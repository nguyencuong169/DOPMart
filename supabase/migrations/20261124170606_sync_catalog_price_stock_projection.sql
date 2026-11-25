-- Keep the current public catalog projection aligned with the mart source of
-- truth so existing storefront readers immediately see admin price changes.

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
      is_new, hot, color, tint, description, tags, notes,
      stock_floor_14, stock_floor_20, stock
    )
    VALUES (
      v_name, v_slug, v_format_slug, v_shelf_slug, v_category_name, v_price,
      v_rating, COALESCE((p_product ->> 'isNew')::BOOLEAN, FALSE),
      COALESCE((p_product ->> 'hot')::BOOLEAN, FALSE),
      COALESCE(NULLIF(p_product ->> 'color', ''), '#ffffff'),
      COALESCE(NULLIF(p_product ->> 'tint', ''), '#ffffff'),
      COALESCE(p_product ->> 'description', ''), '{}'::TEXT[], '{}'::TEXT[][],
      v_initial_stock, v_initial_stock, v_initial_stock
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
        price = v_price::INTEGER,
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

REVOKE ALL ON FUNCTION public.upsert_mart_product(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_mart_product(JSONB) TO authenticated;
