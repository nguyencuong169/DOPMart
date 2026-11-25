-- Release stock reservations for orders that stayed unpaid past expires_at.
-- The function is service-role only and is intended to be called by a
-- protected Edge Function or a scheduled job.

CREATE OR REPLACE FUNCTION public.expire_mart_pending_orders(
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_order RECORD;
  v_reservation RECORD;
  v_balance RECORD;
  v_expired_count INTEGER := 0;
  v_manual_review_count INTEGER := 0;
  v_reservation_count INTEGER;
  v_invariant_ok BOOLEAN;
BEGIN
  IF coalesce(current_setting('request.jwt.claim.role', TRUE), '') <> 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 1000 THEN
    RAISE EXCEPTION 'INVALID_EXPIRY_LIMIT' USING ERRCODE = 'P0001';
  END IF;

  FOR v_order IN
    SELECT o.*
    FROM mart.orders o
    WHERE o.status = 'pending_payment'
      AND o.expires_at <= now()
    ORDER BY o.expires_at, o.created_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  LOOP
    v_invariant_ok := TRUE;
    v_reservation_count := 0;

    -- Validate every reservation before changing any balance so a broken
    -- reservation cannot cause a partial release for the same order.
    FOR v_reservation IN
      SELECT *
      FROM mart.stock_reservations
      WHERE order_id = v_order.id
        AND status = 'reserved'
      ORDER BY product_id
      FOR UPDATE
    LOOP
      v_reservation_count := v_reservation_count + 1;

      SELECT * INTO v_balance
      FROM mart.inventory_balances
      WHERE warehouse_id = v_reservation.warehouse_id
        AND product_id = v_reservation.product_id
      FOR UPDATE;

      IF NOT FOUND OR v_balance.reserved_qty < v_reservation.quantity THEN
        v_invariant_ok := FALSE;
      END IF;
    END LOOP;

    IF v_reservation_count = 0 THEN
      v_invariant_ok := FALSE;
    END IF;

    IF NOT v_invariant_ok THEN
      UPDATE mart.payments
      SET status = 'manual_review',
          failure_code = 'EXPIRY_RESERVATION_INVARIANT_BROKEN',
          updated_at = now()
      WHERE order_id = v_order.id
        AND status IN ('created', 'pending');

      UPDATE mart.orders
      SET status = 'manual_review', updated_at = now()
      WHERE id = v_order.id;

      INSERT INTO mart.order_status_history (
        order_id, from_status, to_status, changed_by, reason
      )
      VALUES (
        v_order.id, v_order.status, 'manual_review', NULL,
        'Expiry job found a broken stock reservation invariant'
      );

      v_manual_review_count := v_manual_review_count + 1;
      CONTINUE;
    END IF;

    FOR v_reservation IN
      SELECT *
      FROM mart.stock_reservations
      WHERE order_id = v_order.id
        AND status = 'reserved'
      ORDER BY product_id
      FOR UPDATE
    LOOP
      UPDATE mart.inventory_balances
      SET reserved_qty = reserved_qty - v_reservation.quantity,
          updated_at = now()
      WHERE warehouse_id = v_reservation.warehouse_id
        AND product_id = v_reservation.product_id;

      UPDATE mart.stock_reservations
      SET status = 'released', released_at = now()
      WHERE id = v_reservation.id;
    END LOOP;

    UPDATE mart.payments
    SET status = 'expired', updated_at = now()
    WHERE order_id = v_order.id
      AND status IN ('created', 'pending');

    UPDATE mart.orders
    SET status = 'expired', updated_at = now()
    WHERE id = v_order.id;

    INSERT INTO mart.order_status_history (
      order_id, from_status, to_status, changed_by, reason
    )
    VALUES (
      v_order.id, v_order.status, 'expired', NULL,
      'Payment reservation expired'
    );

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'expiredCount', v_expired_count,
    'manualReviewCount', v_manual_review_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.expire_mart_pending_orders(INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_mart_pending_orders(INTEGER)
  TO service_role;
