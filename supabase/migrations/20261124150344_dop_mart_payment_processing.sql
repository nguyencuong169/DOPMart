-- Verified payment processing boundary.
--
-- Only the service_role Edge Function may execute this function. The
-- provider adapter must verify the callback before passing signature_valid =
-- true. All payment, reservation, inventory and order mutations happen in
-- one database transaction.

CREATE OR REPLACE FUNCTION public.process_mart_payment_webhook(
  p_provider_name TEXT,
  p_provider_event_id TEXT,
  p_event_type TEXT,
  p_external_reference TEXT,
  p_provider_transaction_id TEXT,
  p_amount NUMERIC(14, 2),
  p_currency TEXT,
  p_signature_valid BOOLEAN,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_event_id UUID;
  v_payment mart.payments%ROWTYPE;
  v_order mart.orders%ROWTYPE;
  v_reservation RECORD;
  v_balance RECORD;
  v_currency TEXT := upper(trim(coalesce(p_currency, '')));
  v_payment_currency TEXT;
  v_payment_error TEXT;
  v_has_reservation BOOLEAN := FALSE;
BEGIN
  IF current_setting('request.jwt.claim.role', TRUE) <> 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF NULLIF(trim(p_provider_name), '') IS NULL
     OR NULLIF(trim(p_provider_event_id), '') IS NULL
     OR NULLIF(trim(p_external_reference), '') IS NULL
     OR NULLIF(trim(p_provider_transaction_id), '') IS NULL
     OR p_amount IS NULL
     OR p_amount <= 0
     OR p_payload IS NULL THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_EVENT' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO mart.payment_events (
    provider_name,
    provider_event_id,
    event_type,
    signature_valid,
    payload
  )
  VALUES (
    p_provider_name,
    p_provider_event_id,
    coalesce(nullif(trim(p_event_type), ''), 'unknown'),
    coalesce(p_signature_valid, FALSE),
    p_payload
  )
  ON CONFLICT (provider_name, provider_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object(
      'accepted', TRUE,
      'duplicate', TRUE,
      'providerEventId', p_provider_event_id
    );
  END IF;

  SELECT *
  INTO v_payment
  FROM mart.payments
  WHERE provider_name = p_provider_name
    AND merchant_reference = p_external_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE mart.payment_events
    SET processing_error = 'PAYMENT_NOT_FOUND', processed_at = now()
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
      'accepted', TRUE,
      'processed', FALSE,
      'manualReview', TRUE,
      'reason', 'PAYMENT_NOT_FOUND'
    );
  END IF;

  SELECT * INTO v_order
  FROM mart.orders
  WHERE id = v_payment.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE mart.payment_events
    SET payment_id = v_payment.id,
        processing_error = 'ORDER_NOT_FOUND',
        processed_at = now()
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
      'accepted', TRUE,
      'processed', FALSE,
      'manualReview', TRUE,
      'reason', 'ORDER_NOT_FOUND'
    );
  END IF;

  IF NOT coalesce(p_signature_valid, FALSE) THEN
    UPDATE mart.payment_events
    SET processing_error = 'SIGNATURE_INVALID', processed_at = now()
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
      'accepted', FALSE,
      'processed', FALSE,
      'reason', 'SIGNATURE_INVALID'
    );
  END IF;

  v_payment_currency := upper(trim(v_payment.currency));

  IF v_payment.amount <> p_amount
     OR v_payment_currency <> v_currency
     OR (p_provider_transaction_id IS NOT NULL AND EXISTS (
       SELECT 1
       FROM mart.payments other_payment
       WHERE other_payment.provider_name = p_provider_name
         AND other_payment.provider_transaction_id = p_provider_transaction_id
         AND other_payment.id <> v_payment.id
     )) THEN
    v_payment_error := CASE
      WHEN v_payment.amount <> p_amount THEN 'PAYMENT_AMOUNT_MISMATCH'
      WHEN v_payment_currency <> v_currency THEN 'PAYMENT_CURRENCY_MISMATCH'
      ELSE 'PROVIDER_TRANSACTION_REUSED'
    END;

    UPDATE mart.payments
    SET status = 'manual_review',
        failure_code = v_payment_error,
        updated_at = now()
    WHERE id = v_payment.id;

    UPDATE mart.orders
    SET status = 'manual_review', updated_at = now()
    WHERE id = v_payment.order_id;

    INSERT INTO mart.order_status_history (
      order_id, from_status, to_status, changed_by, reason
    )
    VALUES (
      v_payment.order_id,
      v_order.status,
      'manual_review',
      NULL,
      v_payment_error
    );

    UPDATE mart.payment_events
    SET payment_id = v_payment.id,
        processing_error = v_payment_error,
        processed_at = now()
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
      'accepted', TRUE,
      'processed', FALSE,
      'manualReview', TRUE,
      'reason', v_payment_error
    );
  END IF;

  IF v_payment.status = 'succeeded' THEN
    UPDATE mart.payment_events
    SET payment_id = v_payment.id, processed_at = now()
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
      'accepted', TRUE,
      'processed', TRUE,
      'duplicatePayment', TRUE,
      'orderId', v_order.id
    );
  END IF;

  IF v_order.status IN ('cancelled', 'expired', 'manual_review') THEN
    UPDATE mart.payments
    SET status = 'manual_review',
        failure_code = 'ORDER_NOT_PAYABLE',
        updated_at = now()
    WHERE id = v_payment.id;

    UPDATE mart.payment_events
    SET payment_id = v_payment.id,
        processing_error = 'ORDER_NOT_PAYABLE',
        processed_at = now()
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
      'accepted', TRUE,
      'processed', FALSE,
      'manualReview', TRUE,
      'reason', 'ORDER_NOT_PAYABLE'
    );
  END IF;

  FOR v_reservation IN
    SELECT *
    FROM mart.stock_reservations
    WHERE order_id = v_order.id
      AND status = 'reserved'
    ORDER BY product_id
    FOR UPDATE
  LOOP
    v_has_reservation := TRUE;

    SELECT *
    INTO v_balance
    FROM mart.inventory_balances
    WHERE warehouse_id = v_reservation.warehouse_id
      AND product_id = v_reservation.product_id
    FOR UPDATE;

    IF NOT FOUND
       OR v_balance.on_hand_qty < v_reservation.quantity
       OR v_balance.reserved_qty < v_reservation.quantity THEN
      UPDATE mart.payments
      SET status = 'manual_review',
          failure_code = 'RESERVATION_INVARIANT_BROKEN',
          updated_at = now()
      WHERE id = v_payment.id;

      UPDATE mart.orders
      SET status = 'manual_review', updated_at = now()
      WHERE id = v_order.id;

      UPDATE mart.payment_events
      SET payment_id = v_payment.id,
          processing_error = 'RESERVATION_INVARIANT_BROKEN',
          processed_at = now()
      WHERE id = v_event_id;

      RETURN jsonb_build_object(
        'accepted', TRUE,
        'processed', FALSE,
        'manualReview', TRUE,
        'reason', 'RESERVATION_INVARIANT_BROKEN'
      );
    END IF;

    UPDATE mart.inventory_balances
    SET on_hand_qty = on_hand_qty - v_reservation.quantity,
        reserved_qty = reserved_qty - v_reservation.quantity,
        updated_at = now()
    WHERE warehouse_id = v_reservation.warehouse_id
      AND product_id = v_reservation.product_id;

    INSERT INTO mart.inventory_movements (
      warehouse_id,
      product_id,
      order_id,
      movement_type,
      quantity_delta,
      note
    )
    VALUES (
      v_reservation.warehouse_id,
      v_reservation.product_id,
      v_order.id,
      'sale_out',
      -v_reservation.quantity,
      'Committed after verified payment webhook'
    );

    UPDATE mart.stock_reservations
    SET status = 'committed', committed_at = now()
    WHERE id = v_reservation.id;
  END LOOP;

  IF NOT v_has_reservation THEN
    UPDATE mart.payments
    SET status = 'manual_review',
        failure_code = 'RESERVATION_NOT_FOUND',
        updated_at = now()
    WHERE id = v_payment.id;

    UPDATE mart.orders
    SET status = 'manual_review', updated_at = now()
    WHERE id = v_order.id;

    UPDATE mart.payment_events
    SET payment_id = v_payment.id,
        processing_error = 'RESERVATION_NOT_FOUND',
        processed_at = now()
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
      'accepted', TRUE,
      'processed', FALSE,
      'manualReview', TRUE,
      'reason', 'RESERVATION_NOT_FOUND'
    );
  END IF;

  UPDATE mart.payments
  SET status = 'succeeded',
      provider_transaction_id = p_provider_transaction_id,
      paid_at = now(),
      updated_at = now()
  WHERE id = v_payment.id;

  UPDATE mart.orders
  SET status = 'confirmed', updated_at = now()
  WHERE id = v_order.id;

  INSERT INTO mart.order_status_history (
    order_id, from_status, to_status, changed_by, reason
  )
  VALUES (
    v_order.id,
    v_order.status,
    'confirmed',
    NULL,
    'Verified payment webhook'
  );

  UPDATE mart.payment_events
  SET payment_id = v_payment.id, processed_at = now()
  WHERE id = v_event_id;

  RETURN jsonb_build_object(
    'accepted', TRUE,
    'processed', TRUE,
    'orderId', v_order.id,
    'paymentId', v_payment.id,
    'status', 'confirmed'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_mart_payment_webhook(
  TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, JSONB
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_mart_payment_webhook(
  TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, BOOLEAN, JSONB
) TO service_role;
