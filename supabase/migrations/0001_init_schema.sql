-- ============================================================
-- DOPMart → Supabase schema
-- Bước 1: Data model từ src/data/products.js, src/stores.*
-- ============================================================

-- ============================================================
-- 1. Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS shelves (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  tagline     TEXT,
  icon        TEXT,
  color       TEXT,
  formats     TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS formats (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  icon          TEXT,
  color         TEXT NOT NULL,
  image         TEXT NOT NULL,
  photo_shows   TEXT NOT NULL,
  photo_keywords TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  slug            TEXT NOT NULL,
  name            TEXT NOT NULL,
  format_slug     TEXT NOT NULL REFERENCES formats(slug) ON DELETE RESTRICT,
  shelf_slug      TEXT NOT NULL REFERENCES shelves(slug) ON DELETE RESTRICT,
  category_name   TEXT NOT NULL,
  price           INTEGER NOT NULL CHECK (price >= 0),
  rating          NUMERIC(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  sold            INTEGER NOT NULL DEFAULT 0,
  is_new          BOOLEAN NOT NULL DEFAULT FALSE,
  hot             BOOLEAN NOT NULL DEFAULT FALSE,
  color           TEXT NOT NULL,
  tint            TEXT NOT NULL,
  description     TEXT NOT NULL,
  tags            TEXT[] NOT NULL DEFAULT '{}',
  notes           TEXT[][] NOT NULL DEFAULT '{}',
  stock_floor_14  INTEGER NOT NULL DEFAULT 0,
  stock_floor_20  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID NOT NULL,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  qty         INTEGER NOT NULL CHECK (qty > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id)
    REFERENCES carts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id     TEXT NOT NULL,
  product_id  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, product_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles (
  id          TEXT PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  floor       INTEGER NOT NULL CHECK (floor IN (14, 20)),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()


-- ============================================================
-- 5. Seed data (8 products + 1 floor-profile demo row)
-- ============================================================

INSERT INTO shelves (slug, name, tagline, icon, color, formats) VALUES
  ('snack-man', 'Snack mặn', 'Giòn, mặn, mở là ăn', '🍟', '#ffb82e', ARRAY['chips']),
  ('do-cay', 'Đồ cay', 'Cay từ từ rồi bùng', '🌶️', '#ff5a1f', ARRAY['spicy']),
  ('ngot', 'Ngọt & bánh', 'Tráng miệng trong 5 phút', '🍫', '#ef5b9a', ARRAY['chocolate', 'candy']),
  ('healthy', 'Snack lành mạnh', 'Rang mộc, giàu đạm', '🌿', '#31a354', ARRAY['healthy']),
  ('bua-nhanh', 'Bụp cơm', 'Mì nộm, cơm tấm, xôi', '🍜', '#ef3340', ARRAY['noodles', 'instant']),
  ('do-uong', 'Đồ uống', 'Soda lạnh 4°C, uống ngay', '🥤', '#7a32a8', ARRAY['drinks']);

INSERT INTO formats (slug, name, icon, color, image, photo_shows, photo_keywords) VALUES
  ('chips', 'Bim bim', '🍟', '#ffb82e', 'chips.webp', 'túi snack vị mặn', ARRAY['khoai', 'bim bim', 'snack', 'bánh gạo', 'phô mai', 'bbq', 'ngô']),
  ('noodles', 'Mì & đồ ăn liền', '🍜', '#ef3340', 'noodles.webp', 'ly mì ăn liền', ARRAY['mì ly', 'mì', 'ly']),
  ('instant', 'Xúc xích', '🌭', '#31a354', 'instant.webp', 'gói ăn liền', ARRAY['xúc xích', 'cá viên', 'cháo', 'ăn liền']),
  ('chocolate', 'Chocolate', '🍫', '#6f3d27', 'chocolate.webp', 'thanh chocolate', ARRAY['chocolate', 'ca cao', 'xốp']),
  ('drinks', 'Nước uống', '🥤', '#7a32a8', 'drinks.webp', 'lon soda trái cây', ARRAY['soda', 'lon', 'nước', 'trà']),
  ('spicy', 'Đồ cay', '🌶️', '#ff5a1f', 'spicy.webp', 'gói đồ cay', ARRAY['cay', 'khô', 'gà', 'que']),
  ('candy', 'Kẹo', '🍬', '#ef5b9a', 'candy.webp', 'gói kẹo', ARRAY['kẹo', 'gum']),
  ('healthy', 'Snack lành mạnh', '🌿', '#31a354', 'healthy.webp', 'túi hạt & granola rang mộc', ARRAY['hạt', 'granola', 'điều', 'nhân', 'rang']);

INSERT INTO products (slug, name, format_slug, shelf_slug, category_name, price, rating, sold, is_new, hot, color, tint, description, tags, notes, stock_floor_14, stock_floor_20) VALUES
  ('khoai-tay-cay-bung-vi', 'Khoai tây cay bùng vị', 'chips', 'snack-man', 'Snack mặn', 12000, 4.9, 186, FALSE, TRUE, '#ffb82e', '#f5a623', 'Khoai tây cay bùng vị - gói 120g', ARRAY['Giòn rụm', 'Đậm vị'], ARRAY[ARRAY['Giòn 2 lớp', 'Chiên giòn rồi rắc phô mai'], ARRAY['Phô mai thật', 'Không bột bắp pha'], ARRAY['Túi 50g', 'Vừa một giờ nghỉ']], 8, 12),
  ('hat-hon-hop-rang-moc', 'Hạt hỗn hợp rang mộc', 'healthy', 'healthy', 'Snack lành mạnh', 15000, 4.8, 149, FALSE, FALSE, '#31a354', '#2f6b31', 'Hạt hỗn hợp rang mộc - túi 150g', ARRAY['Rang mộc', 'Giàu đạm'], ARRAY[ARRAY['Rang không dầu', 'Giữ nguyên vị hạt'], ARRAY['Đạm thực vật', 'No lâu hơn bánh ngọt'], ARRAY['Túi 150g', 'Chia được 3 lần ăn']], 10, 9),
  ('mi-ly-tom-cay', 'Mì ly tôm cay', 'noodles', 'bua-nhanh', 'Bụp cơm', 18000, 4.9, 226, FALSE, TRUE, '#ef3340', '#d13a1f', 'Mì ly tôm cay - ly 65g', ARRAY['Cay bùng vị', '3 phút'], ARRAY[ARRAY['Sa tế tôm', 'Nước dùng nêm sẵn'], ARRAY['3 phút', 'Chỉ cần nước sôi'], ARRAY['Ly 65g', 'Có topping sấy']], 7, 14),
  ('soda-trai-cay-nhiet-doi', 'Soda trái cây nhiệt đới', 'drinks', 'do-uong', 'Đồ uống', 14000, 4.7, 238, FALSE, TRUE, '#7a32a8', '#6d2a9b', 'Soda trái cây nhiệt đới - lon 330ml', ARRAY['Lạnh 4°C', 'Trái cây thật'], ARRAY[ARRAY['Lấy từ tủ mát', 'Uống ngay tại tầng'], ARRAY['Không phẩm màu', 'Vị trái cây tự nhiên'], ARRAY['Lon 330ml', 'Vừa một buổi chiều']], 16, 11),
  ('chocolate-sua-mini', 'Chocolate sữa mini', 'chocolate', 'ngot', 'Ngọt & bánh', 18000, 4.8, 143, FALSE, FALSE, '#6f3d27', '#5e3323', 'Chocolate sữa mini - viên nhỏ', ARRAY['Ca cao 55%', 'Tan trong miệng'], ARRAY[ARRAY['Ca cao 55%', 'Đắng dịu, hậu ngọt'], ARRAY['Không dầu cọ', 'Chỉ bơ ca cao'], ARRAY['Viên nhỏ', 'Chia nhiều lần']], 6, 13),
  ('keo-deo-trai-cay', 'Kẹo dẻo trái cây', 'candy', 'ngot', 'Ngọt & bánh', 15000, 4.7, 119, FALSE, FALSE, '#ef5b9a', '#e0457b', 'Kẹo dẻo trái cây - túi 20 viên', ARRAY['Ngọt thanh', 'Không ngấy'], ARRAY[ARRAY['Ngọt thanh', 'Không gắt cổ'], ARRAY['Túi zip', 'Giữ thơm lâu'], ARRAY['Chia sẻ', 'Gói 20 viên']], 11, 7),
  ('que-khoai-tay-cay', 'Que khoai tây cay', 'spicy', 'do-cay', 'Đồ cay', 11000, 4.8, 132, FALSE, FALSE, '#ff5a1f', '#c62f14', 'Que khoai tây cay - gói 40g', ARRAY['Cay 3 lớp', 'Ăn liền'], ARRAY[ARRAY['Ớt khô 3 loại', 'Cay từ từ rồi bùng'], ARRAY['Ăn liền', 'Không cần chế biến'], ARRAY['Gói 40g', 'Đủ một lần ăn']], 9, 15),
  ('xuc-xich-an-lien', 'Xúc xích ăn liền', 'instant', 'bua-nhanh', 'Bụp cơm', 10000, 4.8, 211, FALSE, FALSE, '#31a354', '#b52a26', 'Xúc xích ăn liền - gói tiện', ARRAY['Mở là ăn', 'Đạm cao'], ARRAY[ARRAY['Không cần hâm', 'Xé gói là dùng'], ARRAY['Từ thịt thật', 'Không bột nhão'], ARRAY['Gói tiện', 'Bỏ túi áo được']], 4, 10);

-- Demo profile for floor store
INSERT INTO profiles (id, floor, updated_at) VALUES
  ('demo-user-id', 20, now());

-- ============================================================
-- 2. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_shelf_slug ON products(shelf_slug);
CREATE INDEX IF NOT EXISTS idx_products_format_slug ON products(format_slug);
CREATE INDEX IF NOT EXISTS idx_products_price_gt ON products(price) WHERE price > 0;
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_sold ON products(sold);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(id);

-- ============================================================
-- 3. Row Level Security (RLS) — bắt buộc
-- ============================================================

-- prices/filters are public: any anonymous visitor may view catalog and category
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: catalog & category" ON products
  FOR SELECT
  USING (true);

ALTER TABLE formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: formats" ON formats
  FOR SELECT
  USING (true);

ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public: shelves" ON shelves
  FOR SELECT
  USING (true);

-- carts & cart_items are private to the owner cart only
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart: own cart" ON carts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_items: own cart" ON cart_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

-- favorites is private to the authenticated user only
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites: own" ON favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles: owner + service_role can read/write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: own" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 4. Triggers + helper columns
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

CREATE TRIGGER trg_favorites_updated_at
  BEFORE UPDATE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

);
