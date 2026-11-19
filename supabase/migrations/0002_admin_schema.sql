-- ============================================================
-- DOPMart Admin Schema Migration (idempotent, safe re-run)
-- ============================================================

-- 1. XÓA BẢNG TRƯỚC (CASCADE sẽ xóa chính sách RLS, trigger, index kèm theo)
--    Không xóa policy riêng lẻ trước khi bảng còn tồn tại.
DROP TABLE IF EXISTS promotion_usage CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;

-- 2. Dùng cột role (text) làm admin flag, xóa cột is_admin cũ nếu còn
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'customer';
ALTER TABLE profiles
  ALTER COLUMN role TYPE TEXT USING NULLIF(role, '') IS NOT NULL;
ALTER TABLE profiles
  ADD CONSTRAINT chk_profiles_role CHECK (role IN ('admin', 'customer'));

-- 3. Xóa index dư
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_promotions_code;
DROP INDEX IF EXISTS idx_promotions_is_active;
DROP INDEX IF EXISTS idx_promotions_ends_at;
DROP INDEX IF EXISTS idx_promotion_usage_promotion_id;
DROP INDEX IF EXISTS idx_promotion_usage_user_id;

-- 4. Xóa trigger và hàm (triggers trên bảng đã bị xóa ở trên thì CASCADE đã lo)
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- 5. Thêm cột is_admin vào profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total INTEGER NOT NULL CHECK (total >= 0),
  shipping_address TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 8. Tạo bảng order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price_snapshot INTEGER NOT NULL CHECK (price_snapshot >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 9. Tạo bảng promotions
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order INTEGER NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  max_uses INTEGER NOT NULL DEFAULT 0 CHECK (max_uses >= 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_ends_at ON promotions(ends_at);

-- 10. Tạo bảng promotion_usage
CREATE TABLE IF NOT EXISTS promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_usage_promotion_id ON promotion_usage(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_user_id ON promotion_usage(user_id);

-- 11. Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 12. RLS Policies
-- Mọi so sánh với auth.uid() đều dùng ::text vì các cột id/user_id lưu chuỗi UUID dạng TEXT.

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: own read" ON orders
  FOR SELECT
  USING (auth.uid() IS NULL OR user_id = (auth.uid())::text);

CREATE POLICY "orders: admin all" ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (auth.uid())::text
        AND profiles.role = 'admin'
    )
  );

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items: own read" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = (auth.uid())::text
    )
  );

CREATE POLICY "order_items: admin all" ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (auth.uid())::text
        AND profiles.role = 'admin'
    )
  );

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions: public read active" ON promotions
  FOR SELECT
  USING (is_active = TRUE AND now() >= starts_at AND now() <= ends_at);

CREATE POLICY "promotions: admin all" ON promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (auth.uid())::text
        AND profiles.role = 'admin'
    )
  );

ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotion_usage: own read" ON promotion_usage
  FOR SELECT
  USING (user_id = (auth.uid())::text);

CREATE POLICY "promotion_usage: admin all" ON promotion_usage
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (auth.uid())::text
        AND profiles.role = 'admin'
    )
  );

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: admin read all" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = (auth.uid())::text
        AND p2.role = 'admin'
    )
  );

-- 13. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage: product-images public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "storage: product-images admin upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (auth.uid())::text
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "storage: product-images admin update"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (auth.uid())::text
      AND profiles.role = 'admin'
  )
);

CREATE POLICY "storage: product-images admin delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (auth.uid())::text
      AND profiles.role = 'admin'
  )
);