-- ============================================================
-- PHẦN 1: DDL - DOPMart Supabase Schema
-- ============================================================

-- 0. Xóa sạch các bảng cũ để đảm bảo cập nhật đúng kiểu dữ liệu TEXT mới
DROP TABLE IF EXISTS cart_items, carts, favorites, profiles, products, formats, shelves CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- 1. Tables
CREATE TABLE shelves (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  icon TEXT,
  color TEXT,
  formats TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE formats (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT NOT NULL,
  image TEXT NOT NULL,
  photo_shows TEXT NOT NULL,
  photo_keywords TEXT[] NOT NULL DEFAULT '{}'
);

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

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_cart_product_unique UNIQUE (cart_id, product_id)
);

CREATE TABLE favorites (
  user_id TEXT NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  floor INTEGER NOT NULL CHECK (floor IN (14, 20)),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_products_shelf_slug ON products(shelf_slug);
CREATE INDEX idx_products_format_slug ON products(format_slug);
CREATE INDEX idx_products_price_gt ON products(price) WHERE price > 0;
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_sold ON products(sold);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_product_id ON favorites(product_id);

-- 3. Triggers
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

-- 4. Row Level Security (RLS)
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
