-- ============================================
-- DOPMart Migration 0002: Auth + Profiles + RLS
-- ============================================

-- 1. Đảm bảo bảng profiles có khóa ngoại đến auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_id_fkey'
      AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$
;

-- 2. Bật RLS cho profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies cho profiles
-- Mọi người đều có thể xem profile (cần thiết để hiển thị thông tin cơ bản)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Chỉ user sở hữu profile mới có thể cập nhật
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Chỉ user sở hữu profile mới có thể chèn (khi đăng ký)
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Đảm bảo RLS cho các bảng liên quan người dùng
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own carts" ON carts
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own carts" ON carts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own carts" ON carts
  FOR UPDATE USING (auth.uid()::text = user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cart items" ON cart_items
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND auth.uid()::text = carts.user_id));
CREATE POLICY "Users can insert own cart items" ON cart_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND auth.uid()::text = carts.user_id));
CREATE POLICY "Users can update own cart items" ON cart_items
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND auth.uid()::text = carts.user_id));
CREATE POLICY "Users can delete own cart items" ON cart_items
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND auth.uid()::text = carts.user_id));

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid()::text = user_id);

-- 5. Storage bucket cho ảnh sản phẩm
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public product images are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- 6. Trigger tự động tạo profile khi user đăng ký mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, floor, role, updated_at)
  VALUES (NEW.id, 1, 'customer', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();