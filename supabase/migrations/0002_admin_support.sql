-- ============================================================
-- 0002_admin_support.sql
-- Thêm hỗ trợ admin: is_admin trên profiles, bảng orders,
-- promotions, promotion_usage, order_items + RLS policies
-- ============================================================

-- 1. Thêm cột is_admin vào profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Bảng orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  floor INTEGER NOT NULL CHECK (floor IN (14, 20)),
  area_seat TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_method TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Bảng order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price_snapshot INTEGER NOT NULL CHECK (price_snapshot >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Bảng promotions
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_limit INTEGER,
  created_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Bảng promotion_usage
CREATE TABLE IF NOT EXISTS promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (promotion_id, user_id)
);

-- 6. Cập nhật trigger update_updated_at cho các bảng mới
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_orders_updated_at'
  ) THEN
    CREATE TRIGGER trg_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_order_items_updated_at'
  ) THEN
    CREATE TRIGGER trg_order_items_updated_at
      BEFORE UPDATE ON order_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_promotions_updated_at'
  ) THEN
    CREATE TRIGGER trg_promotions_updated_at
      BEFORE UPDATE ON promotions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_promotion_usage_updated_at'
  ) THEN
    CREATE TRIGGER trg_promotion_usage_updated_at
      BEFORE UPDATE ON promotion_usage
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 7. Row Level Security cho các bảng mới
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders: own" ON orders
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = user_id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = user_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items: own via orders" ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (auth.uid() IS NULL OR orders.user_id = (auth.uid())::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND (auth.uid() IS NULL OR orders.user_id = (auth.uid())::text)
    )
  );

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotions: public read" ON promotions
  FOR SELECT
  USING (is_active = true);

ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotion_usage: own" ON promotion_usage
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = user_id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = user_id);

-- 8. Profiles: chỉ cho phép user đọc/sửa profile của chính mình
--    Admin quản lý profiles qua Supabase Dashboard trực tiếp
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles: own" ON profiles;
CREATE POLICY "profiles: own" ON profiles
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = id);

-- 9. Products: public read, admin quản lý qua Dashboard
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public: catalog & category" ON products;
CREATE POLICY "public: catalog & category" ON products
  FOR SELECT
  USING (true);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cart: own cart" ON carts;
CREATE POLICY "cart: own cart" ON carts
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = user_id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cart_items: own cart" ON cart_items;
CREATE POLICY "cart_items: own cart" ON cart_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND (auth.uid() IS NULL OR carts.user_id = (auth.uid())::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND (auth.uid() IS NULL OR carts.user_id = (auth.uid())::text)
    )
  );

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites: own" ON favorites;
CREATE POLICY "favorites: own" ON favorites
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = user_id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = user_id);