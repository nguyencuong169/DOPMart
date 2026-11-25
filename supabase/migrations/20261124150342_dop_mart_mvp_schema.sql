-- DOP Mart MVP transaction boundary.
--
-- The repository still contains an older public schema used by the existing
-- catalogue UI. New order/payment/inventory data lives in the mart schema so
-- the first production slice can be deployed without rewriting legacy data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS mart;

CREATE SEQUENCE IF NOT EXISTS mart.order_number_seq;

CREATE TABLE IF NOT EXISTS mart.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO mart.warehouses (code, name)
VALUES ('DOP-HQ', 'Kho DOP Mart')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS mart.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS mart_product_one_current_price
  ON mart.product_prices(product_id)
  WHERE valid_to IS NULL;

INSERT INTO mart.product_prices (product_id, amount)
SELECT p.id, p.price::NUMERIC(14, 2)
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1
  FROM mart.product_prices pp
  WHERE pp.product_id = p.id
    AND pp.valid_to IS NULL
);

CREATE TABLE IF NOT EXISTS mart.inventory_balances (
  warehouse_id UUID NOT NULL REFERENCES mart.warehouses(id) ON DELETE RESTRICT,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  on_hand_qty INTEGER NOT NULL DEFAULT 0 CHECK (on_hand_qty >= 0),
  reserved_qty INTEGER NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (warehouse_id, product_id),
  CHECK (reserved_qty <= on_hand_qty)
);

INSERT INTO mart.inventory_balances (warehouse_id, product_id, on_hand_qty)
SELECT
  w.id,
  p.id,
  GREATEST(
    COALESCE(p.stock, 0),
    COALESCE(p.stock_floor_14, 0),
    COALESCE(p.stock_floor_20, 0)
  )
FROM mart.warehouses w
CROSS JOIN public.products p
WHERE w.code = 'DOP-HQ'
  AND NOT EXISTS (
    SELECT 1
    FROM mart.inventory_balances ib
    WHERE ib.warehouse_id = w.id
      AND ib.product_id = p.id
  );

CREATE TABLE IF NOT EXISTS mart.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN (
      'pending_payment', 'confirmed', 'preparing', 'ready_for_pickup',
      'out_for_delivery', 'completed', 'cancelled', 'expired', 'manual_review'
    )),
  fulfillment_method TEXT NOT NULL
    CHECK (fulfillment_method IN ('pickup', 'office_delivery')),
  delivery_location TEXT,
  customer_note TEXT,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  delivery_fee NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  idempotency_key UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    fulfillment_method <> 'office_delivery'
    OR NULLIF(trim(delivery_location), '') IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS mart_order_customer_idempotency
  ON mart.orders(customer_id, idempotency_key);

CREATE INDEX IF NOT EXISTS mart_orders_customer_created
  ON mart.orders(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS mart_orders_status_created
  ON mart.orders(status, created_at DESC);

CREATE TABLE IF NOT EXISTS mart.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mart.orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  line_total NUMERIC(14, 2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS mart_order_items_product
  ON mart.order_items(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mart.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mart.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mart.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mart.orders(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES mart.warehouses(id) ON DELETE RESTRICT,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'committed', 'released', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  committed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  UNIQUE (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS mart_reservations_expiry
  ON mart.stock_reservations(status, expires_at);

CREATE TABLE IF NOT EXISTS mart.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES mart.warehouses(id) ON DELETE RESTRICT,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES mart.orders(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL
    CHECK (movement_type IN (
      'opening_balance', 'purchase_in', 'sale_out',
      'manual_adjustment_in', 'manual_adjustment_out',
      'return_in', 'waste_out'
    )),
  quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS mart_one_sale_movement_per_order_product
  ON mart.inventory_movements(order_id, product_id)
  WHERE movement_type = 'sale_out';

CREATE INDEX IF NOT EXISTS mart_movements_product_created
  ON mart.inventory_movements(product_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mart.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES mart.orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('vietqr', 'momo', 'zalopay')),
  provider_name TEXT NOT NULL,
  merchant_reference TEXT NOT NULL UNIQUE,
  provider_transaction_id TEXT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'pending', 'succeeded', 'failed', 'expired', 'refunded', 'manual_review')),
  qr_payload TEXT,
  checkout_url TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failure_code TEXT,
  failure_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS mart_provider_transaction
  ON mart.payments(provider_name, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS mart.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES mart.payments(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  UNIQUE (provider_name, provider_event_id)
);

CREATE OR REPLACE FUNCTION mart.order_payload(p_order_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = mart, public
AS $$
  SELECT jsonb_build_object(
    'id', o.id,
    'orderNumber', o.order_number,
    'status', o.status,
    'fulfillmentMethod', o.fulfillment_method,
    'deliveryLocation', o.delivery_location,
    'subtotal', o.subtotal,
    'discountTotal', o.discount_total,
    'deliveryFee', o.delivery_fee,
    'grandTotal', o.grand_total,
    'currency', o.currency,
    'expiresAt', o.expires_at,
    'createdAt', o.created_at,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'productId', oi.product_id,
        'name', oi.product_name_snapshot,
        'sku', oi.sku_snapshot,
        'unitPrice', oi.unit_price,
        'quantity', oi.quantity,
        'discountAmount', oi.discount_amount,
        'lineTotal', oi.line_total
      ) ORDER BY oi.created_at)
      FROM mart.order_items oi
      WHERE oi.order_id = o.id
    ), '[]'::jsonb),
    'payment', (
      SELECT jsonb_build_object(
        'id', p.id,
        'method', p.method,
        'status', p.status,
        'amount', p.amount,
        'currency', p.currency,
        'merchantReference', p.merchant_reference,
        'qrPayload', p.qr_payload,
        'checkoutUrl', p.checkout_url,
        'expiresAt', p.expires_at,
        'paidAt', p.paid_at
      )
      FROM mart.payments p
      WHERE p.order_id = o.id
      ORDER BY p.created_at DESC
      LIMIT 1
    )
  )
  FROM mart.orders o
  WHERE o.id = p_order_id;
$$;

CREATE OR REPLACE FUNCTION public.create_mart_order(p_request JSONB)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_warehouse_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_idempotency_key UUID;
  v_method TEXT;
  v_location TEXT;
  v_payment_method TEXT;
  v_item RECORD;
  v_product RECORD;
  v_balance RECORD;
  v_unit_price NUMERIC(14, 2);
  v_subtotal NUMERIC(14, 2) := 0;
  v_line_total NUMERIC(14, 2);
  v_existing_order UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'USER_PROFILE_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  IF jsonb_typeof(p_request -> 'items') <> 'array'
     OR jsonb_array_length(p_request -> 'items') = 0 THEN
    RAISE EXCEPTION 'ITEMS_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  v_idempotency_key := (p_request ->> 'idempotencyKey')::UUID;
  v_method := COALESCE(p_request #>> '{fulfillment,method}', 'pickup');
  v_location := NULLIF(trim(p_request #>> '{fulfillment,deliveryLocation}'), '');
  v_payment_method := COALESCE(p_request #>> '{payment,method}', 'vietqr');

  IF v_method = 'office_delivery' AND v_location IS NULL THEN
    RAISE EXCEPTION 'DELIVERY_LOCATION_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  IF v_method NOT IN ('pickup', 'office_delivery') THEN
    RAISE EXCEPTION 'INVALID_FULFILLMENT_METHOD' USING ERRCODE = 'P0001';
  END IF;

  IF v_payment_method NOT IN ('vietqr', 'momo', 'zalopay') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_existing_order
  FROM mart.orders
  WHERE customer_id = v_user_id
    AND idempotency_key = v_idempotency_key;

  IF v_existing_order IS NOT NULL THEN
    RETURN mart.order_payload(v_existing_order);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_request -> 'items') AS x(product_id INTEGER, quantity INTEGER)
    WHERE product_id IS NULL OR quantity IS NULL OR quantity <= 0
  ) THEN
    RAISE EXCEPTION 'INVALID_ORDER_ITEM' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT product_id
    FROM jsonb_to_recordset(p_request -> 'items') AS x(product_id INTEGER, quantity INTEGER)
    GROUP BY product_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_ORDER_ITEM' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_warehouse_id
  FROM mart.warehouses
  WHERE code = 'DOP-HQ' AND is_active = TRUE
  LIMIT 1;

  IF v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'WAREHOUSE_NOT_CONFIGURED' USING ERRCODE = 'P0001';
  END IF;

  v_order_number := 'DOP-' || to_char(clock_timestamp(), 'YYYYMMDD') || '-' ||
    lpad(nextval('mart.order_number_seq')::TEXT, 4, '0');

  INSERT INTO mart.orders (
    order_number,
    customer_id,
    fulfillment_method,
    delivery_location,
    customer_note,
    idempotency_key
  )
  VALUES (
    v_order_number,
    v_user_id,
    v_method,
    v_location,
    NULLIF(trim(p_request #>> '{fulfillment,note}'), ''),
    v_idempotency_key
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN
    SELECT product_id, quantity
    FROM jsonb_to_recordset(p_request -> 'items') AS x(product_id INTEGER, quantity INTEGER)
    ORDER BY product_id
  LOOP
    SELECT p.id, p.name, p.slug, p.price
    INTO v_product
    FROM public.products p
    WHERE p.id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND:%', v_item.product_id USING ERRCODE = 'P0001';
    END IF;

    SELECT pp.amount
    INTO v_unit_price
    FROM mart.product_prices pp
    WHERE pp.product_id = v_item.product_id
      AND pp.valid_to IS NULL
    FOR UPDATE;

    v_unit_price := COALESCE(v_unit_price, v_product.price::NUMERIC(14, 2));

    SELECT *
    INTO v_balance
    FROM mart.inventory_balances ib
    WHERE ib.warehouse_id = v_warehouse_id
      AND ib.product_id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVENTORY_NOT_CONFIGURED:%', v_item.product_id USING ERRCODE = 'P0001';
    END IF;

    IF (v_balance.on_hand_qty - v_balance.reserved_qty) < v_item.quantity THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%:%:%', v_item.product_id, v_item.quantity,
        (v_balance.on_hand_qty - v_balance.reserved_qty) USING ERRCODE = 'P0001';
    END IF;

    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;

    INSERT INTO mart.order_items (
      order_id,
      product_id,
      product_name_snapshot,
      sku_snapshot,
      unit_price,
      quantity,
      line_total
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.slug,
      v_unit_price,
      v_item.quantity,
      v_line_total
    );

    UPDATE mart.inventory_balances
    SET reserved_qty = reserved_qty + v_item.quantity,
        updated_at = now()
    WHERE warehouse_id = v_warehouse_id
      AND product_id = v_item.product_id;

    INSERT INTO mart.stock_reservations (
      order_id,
      warehouse_id,
      product_id,
      quantity,
      expires_at
    )
    VALUES (
      v_order_id,
      v_warehouse_id,
      v_item.product_id,
      v_item.quantity,
      now() + interval '15 minutes'
    );
  END LOOP;

  UPDATE mart.orders
  SET subtotal = v_subtotal,
      grand_total = v_subtotal,
      updated_at = now()
  WHERE id = v_order_id;

  INSERT INTO mart.payments (
    order_id,
    method,
    provider_name,
    merchant_reference,
    amount,
    status,
    expires_at
  )
  VALUES (
    v_order_id,
    v_payment_method,
    v_payment_method,
    v_order_number,
    v_subtotal,
    'pending',
    now() + interval '15 minutes'
  );

  INSERT INTO mart.order_status_history (order_id, to_status, changed_by, reason)
  VALUES (v_order_id, 'pending_payment', v_user_id, 'Order created');

  RETURN mart.order_payload(v_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_mart_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_customer_id TEXT;
BEGIN
  SELECT customer_id INTO v_customer_id
  FROM mart.orders
  WHERE id = p_order_id;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_customer_id <> v_user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = v_user_id AND role = 'admin'
     ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  RETURN mart.order_payload(p_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_mart_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_order mart.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM mart.orders
  WHERE id = p_order_id
    AND customer_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'ORDER_NOT_CANCELLABLE' USING ERRCODE = 'P0001';
  END IF;

  UPDATE mart.inventory_balances ib
  SET reserved_qty = ib.reserved_qty - sr.quantity,
      updated_at = now()
  FROM mart.stock_reservations sr
  WHERE sr.order_id = p_order_id
    AND sr.status = 'reserved'
    AND ib.warehouse_id = sr.warehouse_id
    AND ib.product_id = sr.product_id;

  UPDATE mart.stock_reservations
  SET status = 'released', released_at = now()
  WHERE order_id = p_order_id AND status = 'reserved';

  UPDATE mart.orders
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO mart.order_status_history (order_id, from_status, to_status, changed_by, reason)
  VALUES (p_order_id, v_order.status, 'cancelled', v_user_id, 'Cancelled by customer');

  RETURN mart.order_payload(p_order_id);
END;
$$;

ALTER TABLE mart.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mart.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mart own orders read" ON mart.orders
  FOR SELECT TO authenticated
  USING (customer_id = (select auth.uid())::TEXT);

CREATE POLICY "mart own order items read" ON mart.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mart.orders o
      WHERE o.id = order_id
        AND o.customer_id = (select auth.uid())::TEXT
    )
  );

CREATE POLICY "mart own payments read" ON mart.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mart.orders o
      WHERE o.id = order_id
        AND o.customer_id = (select auth.uid())::TEXT
    )
  );

REVOKE ALL ON SCHEMA mart FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA mart FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION mart.order_payload(UUID) FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA mart TO authenticated;
GRANT SELECT ON mart.orders, mart.order_items, mart.payments TO authenticated;

REVOKE ALL ON FUNCTION public.create_mart_order(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_mart_order(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_mart_order(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_mart_order(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mart_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_mart_order(UUID) TO authenticated;
