-- Operations/admin commands for the new mart schema.
-- All functions verify the caller's database profile role and keep stock
-- mutations inside one transaction.

CREATE OR REPLACE FUNCTION public.get_mart_admin_summary()
RETURNS JSONB
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'kpis', jsonb_build_object(
      'paidRevenue', COALESCE((
        SELECT SUM(amount) FROM mart.payments WHERE status = 'succeeded'
      ), 0),
      'paidOrders', (
        SELECT COUNT(*) FROM mart.payments WHERE status = 'succeeded'
      ),
      'activeOrders', (
        SELECT COUNT(*) FROM mart.orders
        WHERE status IN ('confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery')
      ),
      'lowStockCount', (
        SELECT COUNT(*)
        FROM mart.inventory_balances ib
        WHERE ib.on_hand_qty - ib.reserved_qty <= 5
      )
    ),
    'lowStock', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'productId', ib.product_id,
        'name', p.name,
        'sku', p.slug,
        'onHandQty', ib.on_hand_qty,
        'reservedQty', ib.reserved_qty,
        'availableQty', ib.on_hand_qty - ib.reserved_qty
      ) ORDER BY ib.on_hand_qty - ib.reserved_qty, p.name)
      FROM mart.inventory_balances ib
      JOIN public.products p ON p.id = ib.product_id
      WHERE ib.on_hand_qty - ib.reserved_qty <= 5
    ), '[]'::jsonb),
    'recentOrders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', o.id,
        'orderNumber', o.order_number,
        'status', o.status,
        'grandTotal', o.grand_total,
        'fulfillmentMethod', o.fulfillment_method,
        'createdAt', o.created_at
      ) ORDER BY o.created_at DESC)
      FROM mart.orders o
      LIMIT 20
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.receive_mart_stock(
  p_items JSONB,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_warehouse_id UUID;
  v_item RECORD;
  v_balance RECORD;
  v_item_count INTEGER := 0;
  v_total_quantity INTEGER := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_warehouse_id
  FROM mart.warehouses
  WHERE code = 'DOP-HQ' AND is_active = TRUE
  LIMIT 1;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'WAREHOUSE_NOT_CONFIGURED' USING ERRCODE = 'P0001';
  END IF;

  FOR v_item IN
    SELECT product_id, quantity
    FROM jsonb_to_recordset(p_items) AS x(product_id INTEGER, quantity INTEGER)
    ORDER BY product_id
  LOOP
    IF v_item.product_id IS NULL OR v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_STOCK_RECEIPT_ITEM' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_balance
    FROM mart.inventory_balances
    WHERE warehouse_id = v_warehouse_id AND product_id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVENTORY_NOT_CONFIGURED:%', v_item.product_id USING ERRCODE = 'P0001';
    END IF;

    UPDATE mart.inventory_balances
    SET on_hand_qty = on_hand_qty + v_item.quantity,
        updated_at = now()
    WHERE warehouse_id = v_warehouse_id AND product_id = v_item.product_id;

    INSERT INTO mart.inventory_movements (
      warehouse_id, product_id, movement_type, quantity_delta, note, created_by
    )
    VALUES (
      v_warehouse_id, v_item.product_id, 'purchase_in', v_item.quantity,
      NULLIF(trim(p_note), ''), v_user_id
    );

    v_item_count := v_item_count + 1;
    v_total_quantity := v_total_quantity + v_item.quantity;
  END LOOP;

  RETURN jsonb_build_object(
    'itemCount', v_item_count,
    'totalQuantity', v_total_quantity
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_mart_stock(
  p_items JSONB,
  p_note TEXT
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_warehouse_id UUID;
  v_item RECORD;
  v_balance RECORD;
  v_type TEXT;
  v_item_count INTEGER := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF NULLIF(trim(p_note), '') IS NULL THEN
    RAISE EXCEPTION 'ADJUSTMENT_REASON_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_warehouse_id
  FROM mart.warehouses
  WHERE code = 'DOP-HQ' AND is_active = TRUE
  LIMIT 1;

  FOR v_item IN
    SELECT product_id, quantity_delta
    FROM jsonb_to_recordset(p_items) AS x(product_id INTEGER, quantity_delta INTEGER)
    ORDER BY product_id
  LOOP
    IF v_item.product_id IS NULL OR v_item.quantity_delta IS NULL OR v_item.quantity_delta = 0 THEN
      RAISE EXCEPTION 'INVALID_STOCK_ADJUSTMENT_ITEM' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_balance
    FROM mart.inventory_balances
    WHERE warehouse_id = v_warehouse_id AND product_id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND OR v_balance.on_hand_qty + v_item.quantity_delta < v_balance.reserved_qty THEN
      RAISE EXCEPTION 'STOCK_ADJUSTMENT_WOULD_BREAK_RESERVATION:%', v_item.product_id
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE mart.inventory_balances
    SET on_hand_qty = on_hand_qty + v_item.quantity_delta,
        updated_at = now()
    WHERE warehouse_id = v_warehouse_id AND product_id = v_item.product_id;

    v_type := CASE
      WHEN v_item.quantity_delta > 0 THEN 'manual_adjustment_in'
      ELSE 'manual_adjustment_out'
    END;

    INSERT INTO mart.inventory_movements (
      warehouse_id, product_id, movement_type, quantity_delta, note, created_by
    )
    VALUES (
      v_warehouse_id, v_item.product_id, v_type, v_item.quantity_delta, p_note, v_user_id
    );

    v_item_count := v_item_count + 1;
  END LOOP;

  RETURN jsonb_build_object('itemCount', v_item_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_mart_order_status(
  p_order_id UUID,
  p_to_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_order mart.orders%ROWTYPE;
  v_valid_transition BOOLEAN := FALSE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM mart.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  v_valid_transition :=
    (v_order.status = 'confirmed' AND p_to_status = 'preparing')
    OR (v_order.status = 'preparing' AND p_to_status IN ('ready_for_pickup', 'out_for_delivery'))
    OR (v_order.status IN ('ready_for_pickup', 'out_for_delivery') AND p_to_status = 'completed');

  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'INVALID_ORDER_TRANSITION:%:%', v_order.status, p_to_status
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE mart.orders
  SET status = p_to_status, updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO mart.order_status_history (
    order_id, from_status, to_status, changed_by, reason
  )
  VALUES (
    p_order_id, v_order.status, p_to_status, v_user_id, NULLIF(trim(p_reason), '')
  );

  RETURN mart.order_payload(p_order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_mart_admin_summary() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.receive_mart_stock(JSONB, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.adjust_mart_stock(JSONB, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_mart_order_status(UUID, TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_mart_admin_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.receive_mart_stock(JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_mart_stock(JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_mart_order_status(UUID, TEXT, TEXT) TO authenticated;
