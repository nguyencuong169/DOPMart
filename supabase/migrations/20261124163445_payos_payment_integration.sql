-- payOS integration for a personal bank account + VietQR.
--
-- The order workflow continues to use payment.method = 'vietqr'. The
-- provider is switched from the generic placeholder 'vietqr' to 'payos'
-- only when the Edge Function is about to create the hosted payment link.
-- This keeps the existing create_mart_order contract backward compatible
-- while making webhook idempotency and provider reconciliation explicit.

ALTER TABLE mart.payments
  ADD COLUMN IF NOT EXISTS provider_order_code BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS mart_payments_provider_order_code_uidx
  ON mart.payments(provider_name, provider_order_code)
  WHERE provider_order_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prepare_payos_payment_session(
  p_order_id UUID,
  p_provider_order_code BIGINT
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

  IF p_provider_order_code IS NULL OR p_provider_order_code <= 0 THEN
    RAISE EXCEPTION 'INVALID_PAYOS_ORDER_CODE' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_payment
  FROM mart.payments
  WHERE order_id = p_order_id
    AND method = 'vietqr'
    AND provider_name IN ('vietqr', 'payos')
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_payment.status = 'succeeded' THEN
    RAISE EXCEPTION 'PAYMENT_ALREADY_PROCESSED' USING ERRCODE = 'P0001';
  END IF;

  IF v_payment.provider_order_code IS NOT NULL
     AND v_payment.provider_order_code <> p_provider_order_code THEN
    RAISE EXCEPTION 'PAYOS_ORDER_CODE_CONFLICT' USING ERRCODE = 'P0001';
  END IF;

  UPDATE mart.payments
  SET provider_name = 'payos',
      provider_order_code = p_provider_order_code,
      updated_at = now()
  WHERE id = v_payment.id;

  RETURN jsonb_build_object(
    'paymentId', v_payment.id,
    'orderId', v_payment.order_id,
    'providerOrderCode', p_provider_order_code,
    'merchantReference', v_payment.merchant_reference,
    'amount', v_payment.amount,
    'currency', v_payment.currency,
    'status', v_payment.status,
    'checkoutUrl', v_payment.checkout_url,
    'qrPayload', v_payment.qr_payload,
    'expiresAt', v_payment.expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.attach_payos_payment_session(
  p_order_id UUID,
  p_provider_order_code BIGINT,
  p_payment_link_id TEXT DEFAULT NULL,
  p_checkout_url TEXT DEFAULT NULL,
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
    AND provider_name = 'payos'
    AND provider_order_code = p_provider_order_code
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  UPDATE mart.payments
  SET provider_transaction_id = COALESCE(p_payment_link_id, provider_transaction_id),
      checkout_url = COALESCE(p_checkout_url, checkout_url),
      qr_payload = COALESCE(p_qr_payload, qr_payload),
      status = 'pending',
      updated_at = now()
  WHERE id = v_payment.id;

  RETURN jsonb_build_object(
    'paymentId', v_payment.id,
    'orderId', v_payment.order_id,
    'providerOrderCode', p_provider_order_code,
    'checkoutUrl', COALESCE(p_checkout_url, v_payment.checkout_url),
    'qrPayload', COALESCE(p_qr_payload, v_payment.qr_payload),
    'expiresAt', v_payment.expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_payos_payment_reference(
  p_provider_order_code BIGINT
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
  WHERE provider_name = 'payos'
    AND provider_order_code = p_provider_order_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'paymentId', v_payment.id,
    'orderId', v_payment.order_id,
    'merchantReference', v_payment.merchant_reference,
    'amount', v_payment.amount,
    'currency', v_payment.currency,
    'status', v_payment.status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_payos_payment_session(UUID, BIGINT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attach_payos_payment_session(UUID, BIGINT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_payos_payment_reference(BIGINT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.prepare_payos_payment_session(UUID, BIGINT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.attach_payos_payment_session(UUID, BIGINT, TEXT, TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_payos_payment_reference(BIGINT)
  TO service_role;
