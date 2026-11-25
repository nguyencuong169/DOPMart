-- DOP Mart legacy catalogue baseline.
-- Order/payment/inventory MVP tables are added in later migrations under the
-- mart schema. This file intentionally contains only the catalogue and cart
-- primitives used by the existing UI.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  rating NUMERIC(2, 1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  sold INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0),
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  hot BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT NOT NULL DEFAULT '#ffffff',
  tint TEXT NOT NULL DEFAULT '#ffffff',
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT[][] NOT NULL DEFAULT '{}',
  stock_floor_14 INTEGER NOT NULL DEFAULT 0 CHECK (stock_floor_14 >= 0),
  stock_floor_20 INTEGER NOT NULL DEFAULT 0 CHECK (stock_floor_20 >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
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
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
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
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('admin', 'customer')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

CREATE INDEX idx_products_shelf_slug ON products(shelf_slug);
CREATE INDEX idx_products_format_slug ON products(format_slug);
CREATE INDEX idx_products_sold ON products(sold DESC);
CREATE INDEX idx_products_rating ON products(rating DESC);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog shelves read" ON shelves
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "catalog formats read" ON formats
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "catalog products read" ON products
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cart own rows" ON carts
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid())::TEXT)
  WITH CHECK (user_id = (select auth.uid())::TEXT);

CREATE POLICY "cart items own rows" ON cart_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts c
      WHERE c.id = cart_id
        AND c.user_id = (select auth.uid())::TEXT
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts c
      WHERE c.id = cart_id
        AND c.user_id = (select auth.uid())::TEXT
    )
  );

CREATE POLICY "favorites own rows" ON favorites
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid())::TEXT)
  WITH CHECK (user_id = (select auth.uid())::TEXT);

CREATE POLICY "profile own read" ON profiles
  FOR SELECT TO authenticated
  USING (id = (select auth.uid())::TEXT);
