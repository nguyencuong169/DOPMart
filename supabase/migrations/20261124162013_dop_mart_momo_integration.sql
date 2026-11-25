-- MoMo payment session and failure handling.

CREATE OR REPLACE FUNCTION public.attach_momo_payment_session(
  p_order_id UUID,
  p_request_id TEXT,
  p_provider_transaction_id TEXT DEFAULT NULL,
  p_pay_url TEXT DEFAULT NULL,
  p_qr_payload TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_payment mart.payments%ROWTYPE;
BEGIN
  IF current_setting('request.jwt.claim.role', TRUE) <> 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_payment
  FROM mart.payments
  WHERE order_id = p_order_id
    AND provider_name = 'momo'
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  UPDATE mart.payments
  SET provider_transaction_id = COALESCE(p_provider_transaction_id, provider_transaction_id),
      checkout_url = p_pay_url,
      qr_payload = p_qr_payload,
      status = 'pending',
      updated_at = now()
  WHERE id = v_payment.id;

  RETURN jsonb_build_object(
    'paymentId', v_payment.id,
    'orderId', v_payment.order_id,
    'requestId', p_request_id,
    'checkoutUrl', p_pay_url,
    'qrPayload', p_qr_payload
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_mart_payment_failed(
  p_provider_name TEXT,
  p_provider_event_id TEXT,
  p_external_reference TEXT,
  p_provider_transaction_id TEXT,
  p_failure_code TEXT,
  p_failure_message TEXT,
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
BEGIN
  IF current_setting('request.jwt.claim.role', TRUE) <> 'service_role' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  INSERT INTO mart.payment_events (
    provider_name, provider_event_id, event_type, signature_valid, payload
  )
  VALUES (
    p_provider_name, p_provider_event_id, 'payment.failed', TRUE, p_payload
  )
  ON CONFLICT (provider_name, provider_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('accepted', TRUE, 'duplicate', TRUE);
  END IF;

  SELECT * INTO v_payment
  FROM mart.payments
  WHERE provider_name = p_provider_name
    AND merchant_reference = p_external_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE mart.payment_events
    SET processing_error = 'PAYMENT_NOT_FOUND', processed_at = now()
    WHERE id = v_event_id;
    RETURN jsonb_build_object('accepted', TRUE, 'manualReview', TRUE, 'reason', 'PAYMENT_NOT_FOUND');
  END IF;

  UPDATE mart.payments
  SET status = 'failed',
      provider_transaction_id = COALESCE(p_provider_transaction_id, provider_transaction_id),
      failure_code = p_failure_code,
      failure_message = p_failure_message,
      updated_at = now()
  WHERE id = v_payment.id;

  UPDATE mart.payment_events
  SET payment_id = v_payment.id, processed_at = now()
  WHERE id = v_event_id;

  RETURN jsonb_build_object('accepted', TRUE, 'processed', TRUE, 'status', 'failed');
END;
$$;

REVOKE ALL ON FUNCTION public.attach_momo_payment_session(UUID, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_mart_payment_failed(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.attach_momo_payment_session(UUID, TEXT, TEXT, TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_mart_payment_failed(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  TO service_role;
