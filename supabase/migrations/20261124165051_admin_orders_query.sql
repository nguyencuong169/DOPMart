-- Admin order list for the new mart schema.
-- The function is intentionally the only read boundary used by the Admin
-- Orders screen; it avoids exposing mart tables directly to the browser.

CREATE OR REPLACE FUNCTION public.get_mart_admin_orders(
  p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_orders JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN (
    'pending_payment', 'confirmed', 'preparing', 'ready_for_pickup',
    'out_for_delivery', 'completed', 'cancelled', 'expired', 'manual_review'
  ) THEN
    RAISE EXCEPTION 'INVALID_ORDER_STATUS' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'orderNumber', o.order_number,
      'status', o.status,
      'customerId', o.customer_id,
      'floor', profile.floor,
      'fulfillmentMethod', o.fulfillment_method,
      'deliveryLocation', o.delivery_location,
      'grandTotal', o.grand_total,
      'currency', o.currency,
      'createdAt', o.created_at,
      'itemCount', COALESCE(items.item_count, 0),
      'paymentStatus', COALESCE(payment.status, 'unknown')
    ) ORDER BY o.created_at DESC
  ), '[]'::jsonb)
  INTO v_orders
  FROM mart.orders o
  LEFT JOIN public.profiles profile ON profile.id = o.customer_id
  LEFT JOIN LATERAL (
    SELECT p.status
    FROM mart.payments p
    WHERE p.order_id = o.id
    ORDER BY p.created_at DESC
    LIMIT 1
  ) payment ON TRUE
  LEFT JOIN LATERAL (
    SELECT SUM(oi.quantity)::INTEGER AS item_count
    FROM mart.order_items oi
    WHERE oi.order_id = o.id
  ) items ON TRUE
  WHERE p_status IS NULL OR o.status = p_status;

  RETURN v_orders;
END;
$$;

REVOKE ALL ON FUNCTION public.get_mart_admin_orders(TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mart_admin_orders(TEXT)
  TO authenticated;
