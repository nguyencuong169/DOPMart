-- Customer order history boundary.
-- Only the authenticated customer's own orders are returned.

CREATE OR REPLACE FUNCTION public.get_mart_my_orders()
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
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'orderNumber', o.order_number,
      'status', o.status,
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
  WHERE o.customer_id = v_user_id;

  RETURN v_orders;
END;
$$;

REVOKE ALL ON FUNCTION public.get_mart_my_orders()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mart_my_orders()
  TO authenticated;
