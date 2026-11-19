-- ============================================================
-- DOPMart Initial Schema (polished, safe re-run)
-- Quyền: đọc/ghi đơn giản, không xóa dữ liệu nếu không cần thiết
-- ============================================================

-- 1. Shelf categories
CREATE TABLE formats (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT NOT NULL,
  image TEXT NOT NULL,
  photo_shows TEXT NOT NULL,
  photo_keywords TEXT[] NOT NULL DEFAULT '{}'
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1e. Cart items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_cart_product_unique UNIQUE (cart_id, product_id)
);

-- 1f. Wishlist / favorites
CREATE TABLE favorites (
  user_id TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- 1g. User profile (admin capability nằm ở đây)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  floor INTEGER NOT NULL CHECK (floor IN (14, 20)),
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1h. Order events (audit log)
CREATE TABLE order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1i. Orders (đơn hàng)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total INT4 NOT NULL CHECK (total >= 0),
  shipping_address TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1j. Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price_snapshot INT4 NOT NULL CHECK (price_snapshot >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1k. Promotions (khuyến mãi)
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INT4 NOT NULL CHECK (discount_value > 0),
  min_order INT4 NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  max_uses INT4 NOT NULL DEFAULT 0 CHECK (max_uses >= 0),
  used_count INT4 NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1l. Promotion usage (người dùng dùng mã nào)
CREATE TABLE promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
);

-- 1c. Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  format_slug TEXT NOT NULL REFERENCES formats(slug) ON DELETE RESTRICT,
  shelf_slug TEXT NOT NULL REFERENCES shelves(slug) ON DELETE RESTRICT,
  category_name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  hot BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT NOT NULL,
  tint TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT[][] NOT NULL DEFAULT '{}',
  stock_floor_14 INTEGER NOT NULL DEFAULT 0 CHECK (stock_floor_14 >= 0),
  stock_floor_20 INTEGER NOT NULL DEFAULT 0 CHECK (stock_floor_20 >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE shelves (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  icon TEXT,
  color TEXT,
  formats TEXT[] NOT NULL DEFAULT '{}'
);
-- ============================================================
-- DOPMart Initial Schema (polished, idempotent)
-- ============================================================

-- 1. Shelf categories
CREATE TABLE shelves (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  icon TEXT,
  color TEXT,
-- ============================================================================
-- INDEXES (tối ưu query)
-- ============================================================================
CREATE INDEX idx_products_shelf_slug ON products(shelf_slug);
CREATE INDEX idx_products_format_slug ON products(format_slug);
CREATE INDEX idx_products_price_gt ON products(price) WHERE price > 0;
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_sold ON products(sold);
CREATE INDEX idx_products_stock_floor ON products(stock_floor_14, stock_floor_20);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_is_active ON promotions(is_active);
CREATE INDEX idx_promotions_ends_at ON promotions(ends_at);
CREATE INDEX idx_promotion_usage_promotion_id ON promotion_usage(promotion_id);
CREATE INDEX idx_promotion_usage_user_id ON promotion_usage(user_id);
CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_kind_created ON order_events(kind, created_at DESC);
-- ============================================================================
-- TRIGGERS (auto update updated_at)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 1. Catalog (public read)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: catalog & category" ON products FOR SELECT USING (true);

ALTER TABLE formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: formats" ON formats FOR SELECT USING (true);

ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: shelves" ON shelves FOR SELECT USING (true);

-- 2. Carts (only own)
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart: own cart" ON carts
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = user_id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_items: own cart" ON cart_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM carts
-- ============================================================================
-- STORAGE BUCKET (product images)
-- ============================================================================
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
CREATE POLICY "favorites: own" ON favorites
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = user_id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: own" ON profiles
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = id);

-- 3. Orders (only own)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders: own read" ON orders
  FOR SELECT
  USING (auth.uid() IS NULL OR user_id = (auth.uid())::text);

-- 4. Order items (only own)
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

-- 5. Promotion usage (only own)
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotion_usage: own read" ON promotion_usage
  FOR SELECT
  USING (user_id = (auth.uid())::text);

-- 6. Order events (admin only)
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_events: admin select" ON order_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (auth.uid())::text
        AND profiles.role = 'admin'
    )
  );

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_order_events_updated_at
  BEFORE UPDATE ON order_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  formats TEXT[] NOT NULL DEFAULT '{}'
);

-- 2. Product formats
CREATE TABLE formats (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT NOT NULL,
  image TEXT NOT NULL,
  photo_shows TEXT NOT NULL,
  photo_keywords TEXT[] NOT NULL DEFAULT '{}'
);

-- 3. Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  format_slug TEXT NOT NULL REFERENCES formats(slug) ON DELETE RESTRICT,
  shelf_slug TEXT NOT NULL REFERENCES shelves(slug) ON DELETE RESTRICT,
  category_name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  hot BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT NOT NULL,
  tint TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT[][] NOT NULL DEFAULT '{}',
  stock_floor_14 INTEGER NOT NULL DEFAULT 0 CHECK (stock_floor_14 >= 0),
  stock_floor_20 INTEGER NOT NULL DEFAULT 0 CHECK (stock_floor_20 >= 0),
  stock INT4 NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Shopping cart
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Cart items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_cart_product_unique UNIQUE (cart_id, product_id)
);

-- 6. Wishlist / favorites
CREATE TABLE favorites (
  user_id TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

-- 7. User profile (admin flag nằm ở đây)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  floor INTEGER NOT NULL CHECK (floor IN (14, 20)),
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Order events (audit log)
CREATE TABLE order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total INT4 NOT NULL CHECK (total >= 0),
  shipping_address TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Order items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price_snapshot INT4 NOT NULL CHECK (price_snapshot >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'percent'
    CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INT4 NOT NULL CHECK (discount_value > 0),
  min_order INT4 NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  max_uses INT4 NOT NULL DEFAULT 0 CHECK (max_uses >= 0),
  used_count INT4 NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Promotion usage (who used which code)
CREATE TABLE promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_products_shelf_slug ON products(shelf_slug);
CREATE INDEX idx_products_format_slug ON products(format_slug);
CREATE INDEX idx_products_price_gt ON products(price) WHERE price > 0;
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_sold ON products(sold);
CREATE INDEX idx_products_stock_floor ON products(stock_floor_14, stock_floor_20);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_promotions_code ON promotions(code);
CREATE INDEX idx_promotions_is_active ON promotions(is_active);
CREATE INDEX idx_promotions_ends_at ON promotions(ends_at);
CREATE INDEX idx_promotion_usage_promotion_id ON promotion_usage(promotion_id);
CREATE INDEX idx_promotion_usage_user_id ON promotion_usage(user_id);
CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_kind_created ON order_events(kind, created_at DESC);

-- ============================================================
-- Triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_order_events_updated_at
  BEFORE UPDATE ON order_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: catalog & category" ON products FOR SELECT USING (true);

ALTER TABLE formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: formats" ON formats FOR SELECT USING (true);

ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: shelves" ON shelves FOR SELECT USING (true);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart: own cart" ON carts
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = user_id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "favorites: own" ON favorites
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = user_id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = user_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: own" ON profiles
  FOR ALL
  USING (auth.uid() IS NULL OR (auth.uid())::text = id)
  WITH CHECK (auth.uid() IS NULL OR (auth.uid())::text = id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders: own read" ON orders
  FOR SELECT
  USING (auth.uid() IS NULL OR user_id = (auth.uid())::text);

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

ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotion_usage: own read" ON promotion_usage
  FOR SELECT
  USING (user_id = (auth.uid())::text);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_events: admin select" ON order_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (auth.uid())::text
        AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Storage bucket (product images)
-- ============================================================
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
