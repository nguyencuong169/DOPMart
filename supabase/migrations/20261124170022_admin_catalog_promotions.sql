-- Admin catalog and promotion boundaries for the mart schema.
-- Catalog writes remain separate from inventory writes: product metadata and
-- pricing are managed here, while stock changes go through stock RPCs.

CREATE TABLE IF NOT EXISTS mart.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(14, 2) NOT NULL CHECK (discount_value > 0),
  min_order NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  max_uses INTEGER NOT NULL DEFAULT 0 CHECK (max_uses >= 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at),
  CHECK (discount_type <> 'percent' OR discount_value <= 100)
);

CREATE INDEX IF NOT EXISTS mart_promotions_active_window_idx
  ON mart.promotions(is_active, starts_at, ends_at);

ALTER TABLE mart.promotions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON mart.promotions FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_mart_admin_products()
RETURNS JSONB
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_products JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'slug', p.slug,
      'formatSlug', p.format_slug,
      'shelfSlug', p.shelf_slug,
      'categoryName', p.category_name,
      'price', COALESCE(current_price.amount, p.price::NUMERIC),
      'rating', p.rating,
      'sold', p.sold,
      'isNew', p.is_new,
      'hot', p.hot,
      'color', p.color,
      'tint', p.tint,
      'description', p.description,
      'onHandQty', COALESCE(stock.on_hand_qty, 0),
      'reservedQty', COALESCE(stock.reserved_qty, 0),
      'availableQty', COALESCE(stock.on_hand_qty - stock.reserved_qty, 0),
      'createdAt', p.created_at,
      'updatedAt', p.updated_at
    ) ORDER BY p.id
  ), '[]'::jsonb)
  INTO v_products
  FROM public.products p
  LEFT JOIN LATERAL (
    SELECT pp.amount
    FROM mart.product_prices pp
    WHERE pp.product_id = p.id AND pp.valid_to IS NULL
    LIMIT 1
  ) current_price ON TRUE
  LEFT JOIN mart.inventory_balances stock
    ON stock.product_id = p.id
   AND stock.warehouse_id = (SELECT id FROM mart.warehouses WHERE code = 'DOP-HQ' LIMIT 1);

  RETURN v_products;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_mart_product(p_product JSONB)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_product_id INTEGER := NULLIF(p_product ->> 'id', '')::INTEGER;
  v_name TEXT := NULLIF(trim(p_product ->> 'name'), '');
  v_slug TEXT := NULLIF(trim(p_product ->> 'slug'), '');
  v_format_slug TEXT := NULLIF(trim(p_product ->> 'formatSlug'), '');
  v_shelf_slug TEXT := NULLIF(trim(p_product ->> 'shelfSlug'), '');
  v_category_name TEXT := COALESCE(NULLIF(trim(p_product ->> 'categoryName'), ''), v_shelf_slug);
  v_price NUMERIC(14, 2) := (p_product ->> 'price')::NUMERIC;
  v_rating NUMERIC(2, 1) := COALESCE((p_product ->> 'rating')::NUMERIC, 0);
  v_initial_stock INTEGER := GREATEST(COALESCE((p_product ->> 'initialStock')::INTEGER, 0), 0);
  v_warehouse_id UUID;
  v_old_price NUMERIC(14, 2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF v_name IS NULL OR v_slug IS NULL OR v_format_slug IS NULL OR v_shelf_slug IS NULL
     OR v_price IS NULL OR v_price < 0 OR v_rating < 0 OR v_rating > 5 THEN
    RAISE EXCEPTION 'INVALID_PRODUCT_PAYLOAD' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_warehouse_id FROM mart.warehouses WHERE code = 'DOP-HQ' AND is_active LIMIT 1;

  IF v_product_id IS NULL THEN
    INSERT INTO public.products (
      name, slug, format_slug, shelf_slug, category_name, price, rating,
      is_new, hot, color, tint, description, tags, notes
    )
    VALUES (
      v_name, v_slug, v_format_slug, v_shelf_slug, v_category_name, v_price,
      v_rating, COALESCE((p_product ->> 'isNew')::BOOLEAN, FALSE),
      COALESCE((p_product ->> 'hot')::BOOLEAN, FALSE),
      COALESCE(NULLIF(p_product ->> 'color', ''), '#ffffff'),
      COALESCE(NULLIF(p_product ->> 'tint', ''), '#ffffff'),
      COALESCE(p_product ->> 'description', ''), '{}'::TEXT[], '{}'::TEXT[][]
    )
    RETURNING id INTO v_product_id;

    INSERT INTO mart.product_prices (product_id, amount, created_by)
    VALUES (v_product_id, v_price, v_user_id);

    INSERT INTO mart.inventory_balances (warehouse_id, product_id, on_hand_qty)
    VALUES (v_warehouse_id, v_product_id, v_initial_stock);
  ELSE
    UPDATE public.products
    SET name = v_name,
        slug = v_slug,
        format_slug = v_format_slug,
        shelf_slug = v_shelf_slug,
        category_name = v_category_name,
        rating = v_rating,
        is_new = COALESCE((p_product ->> 'isNew')::BOOLEAN, FALSE),
        hot = COALESCE((p_product ->> 'hot')::BOOLEAN, FALSE),
        color = COALESCE(NULLIF(p_product ->> 'color', ''), color),
        tint = COALESCE(NULLIF(p_product ->> 'tint', ''), tint),
        description = COALESCE(p_product ->> 'description', description),
        updated_at = now()
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    SELECT amount INTO v_old_price
    FROM mart.product_prices
    WHERE product_id = v_product_id AND valid_to IS NULL
    FOR UPDATE;

    IF v_old_price IS DISTINCT FROM v_price THEN
      UPDATE mart.product_prices SET valid_to = now()
      WHERE product_id = v_product_id AND valid_to IS NULL;

      INSERT INTO mart.product_prices (product_id, amount, created_by)
      VALUES (v_product_id, v_price, v_user_id);
    END IF;
  END IF;

  RETURN jsonb_build_object('id', v_product_id, 'saved', TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_mart_product(p_product_id INTEGER)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (SELECT 1 FROM mart.order_items WHERE product_id = p_product_id) THEN
    RAISE EXCEPTION 'PRODUCT_HAS_ORDERS' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM mart.inventory_balances WHERE product_id = p_product_id;
  DELETE FROM mart.product_prices WHERE product_id = p_product_id;
  DELETE FROM public.products WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object('deleted', TRUE, 'productId', p_product_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_mart_admin_promotions()
RETURNS JSONB
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_promotions JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC), '[]'::jsonb)
  INTO v_promotions
  FROM mart.promotions p;

  RETURN v_promotions;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_mart_promotion(p_promotion JSONB)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_id UUID := NULLIF(p_promotion ->> 'id', '')::UUID;
  v_code TEXT := upper(NULLIF(trim(p_promotion ->> 'code'), ''));
  v_type TEXT := COALESCE(NULLIF(p_promotion ->> 'discountType', ''), 'percent');
  v_value NUMERIC(14, 2) := (p_promotion ->> 'discountValue')::NUMERIC;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF v_code IS NULL OR v_value IS NULL OR v_value <= 0 OR v_type NOT IN ('percent', 'fixed')
     OR (v_type = 'percent' AND v_value > 100) THEN
    RAISE EXCEPTION 'INVALID_PROMOTION_PAYLOAD' USING ERRCODE = 'P0001';
  END IF;

  IF v_id IS NULL THEN
    INSERT INTO mart.promotions (
      code, description, discount_type, discount_value, min_order, max_uses,
      starts_at, ends_at, is_active, created_by
    )
    VALUES (
      v_code,
      COALESCE(p_promotion ->> 'description', ''),
      v_type,
      v_value,
      GREATEST(COALESCE((p_promotion ->> 'minOrder')::NUMERIC, 0), 0),
      GREATEST(COALESCE((p_promotion ->> 'maxUses')::INTEGER, 0), 0),
      COALESCE(NULLIF(p_promotion ->> 'startsAt', '')::TIMESTAMPTZ, now()),
      NULLIF(p_promotion ->> 'endsAt', '')::TIMESTAMPTZ,
      COALESCE((p_promotion ->> 'isActive')::BOOLEAN, TRUE),
      v_user_id
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE mart.promotions
    SET code = v_code,
        description = COALESCE(p_promotion ->> 'description', ''),
        discount_type = v_type,
        discount_value = v_value,
        min_order = GREATEST(COALESCE((p_promotion ->> 'minOrder')::NUMERIC, 0), 0),
        max_uses = GREATEST(COALESCE((p_promotion ->> 'maxUses')::INTEGER, 0), 0),
        starts_at = COALESCE(NULLIF(p_promotion ->> 'startsAt', '')::TIMESTAMPTZ, starts_at),
        ends_at = NULLIF(p_promotion ->> 'endsAt', '')::TIMESTAMPTZ,
        is_active = COALESCE((p_promotion ->> 'isActive')::BOOLEAN, is_active),
        updated_at = now()
    WHERE id = v_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROMOTION_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN jsonb_build_object('id', v_id, 'saved', TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_mart_promotion(p_promotion_id UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  DELETE FROM mart.promotions WHERE id = p_promotion_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROMOTION_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object('deleted', TRUE, 'promotionId', p_promotion_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_mart_admin_products() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.upsert_mart_product(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_mart_product(INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_mart_admin_promotions() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.upsert_mart_promotion(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_mart_promotion(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_mart_admin_products() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_mart_product(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_mart_product(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mart_admin_promotions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_mart_promotion(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_mart_promotion(UUID) TO authenticated;
