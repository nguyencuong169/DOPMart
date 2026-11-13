-- ============================================================================
-- DOP Mart — Supabase PostgreSQL Schema
-- ============================================================================
-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. profiles — extends Supabase Auth users, holds per-user floor preference
-- ============================================================================
create table profiles (
  id uuid references auth.users not null primary key,
  name text,
  floor smallint check (floor in (14, 20)) default 20,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 2. formats — packshot photo formats (one photo each, enforced by app logic)
-- ============================================================================
create table formats (
  slug text primary key,
  name text not null,
  icon text,
  color text,
  image_url text,
  photo_shows text,
  photo_keywords text[] default '{}',
  created_at timestamptz default now()
);

-- ============================================================================
-- 3. shelves — shopper-facing category taxonomy (aliases as "categories")
-- ============================================================================
create table shelves (
  slug text primary key,
  name text not null,
  tagline text,
  icon text,
  color text,
  created_at timestamptz default now()
);

-- ============================================================================
-- 4. shelf_formats — many-to-many junction: shelves <-> formats
-- ============================================================================
create table shelf_formats (
  shelf_slug text references shelves(slug) on delete cascade,
  format_slug text references formats(slug) on delete cascade,
  primary key (shelf_slug, format_slug)
);

-- ============================================================================
-- 5. products — the 8 seed products, now sourced from Supabase
-- ============================================================================
create table products (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  format_slug text references formats(slug),
  shelf_slug text references shelves(slug),
  category_name text,
  price integer not null check (price > 0),
  rating numeric(2,1) check (rating >= 0 and rating <= 5),
  sold integer default 0 check (sold >= 0),
  is_new boolean default false,
  hot boolean default false,
  color text,
  tint text,
  description text,
  tags text[] default '{}',
  notes jsonb default '[]',
  stock_floor_14 integer default 0 check (stock_floor_14 >= 0),
  stock_floor_20 integer default 0 check (stock_floor_20 >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 6. carts — one cart per user
-- ============================================================================
create table carts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 7. cart_items — line items inside a cart
-- ============================================================================
create table cart_items (
  id uuid default uuid_generate_v4() primary key,
  cart_id uuid references carts(id) on delete cascade,
  product_id bigint references products(id) on delete cascade,
  qty integer not null check (qty > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(cart_id, product_id)
);

-- ============================================================================
-- 8. favorites — per-user favorite product bookmarks
-- ============================================================================
create table favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  product_id bigint references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ============================================================================
-- 9. orders — completed checkout orders (QR-based)
-- ============================================================================
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  floor smallint check (floor in (14, 20)),
  method text check (method in ('pickup', 'desk')),
  desk_area text,
  customer_name text,
  status text default 'pending' check (status in ('pending', 'paid', 'completed', 'cancelled')),
  total integer default 0 check (total >= 0),
  qr_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 10. order_items — snapshot of line items at order time
-- ============================================================================
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id bigint references products(id),
  qty integer not null check (qty > 0),
  price integer not null check (price >= 0),
  created_at timestamptz default now()
);

-- ============================================================================
-- Indexes for query performance
-- ============================================================================
create index idx_products_shelf_slug on products(shelf_slug);
create index idx_products_format_slug on products(format_slug);
create index idx_products_is_new on products(is_new);
create index idx_products_sold on products(sold);
create index idx_carts_user_id on carts(user_id);
create index idx_cart_items_cart_id on cart_items(cart_id);
create index idx_cart_items_product_id on cart_items(product_id);
create index idx_favorites_user_id on favorites(user_id);
create index idx_favorites_product_id on favorites(product_id);
create index idx_orders_user_id on orders(user_id);
create index idx_order_items_order_id on order_items(order_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table profiles enable row level security;
alter table formats enable row level security;
alter table shelves enable row level security;
alter table shelf_formats enable row level security;
alter table products enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table favorites enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- --- profiles: owners only ---------------------------------------------------
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

-- --- formats / shelves / shelf_formats: public read, service-role write -----
create policy "formats_select_public"
  on formats for select
  using (true);

create policy "shelves_select_public"
  on shelves for select
  using (true);

create policy "shelf_formats_select_public"
  on shelf_formats for select
  using (true);

-- --- products: public read --------------------------------------------------
create policy "products_select_public"
  on products for select
  using (true);

-- --- carts: owners only -----------------------------------------------------
create policy "carts_select_own"
  on carts for select
  using (auth.uid() = user_id);

create policy "carts_insert_own"
  on carts for insert
  with check (auth.uid() = user_id);

create policy "carts_update_own"
  on carts for update
  using (auth.uid() = user_id);

create policy "carts_delete_own"
  on carts for delete
  using (auth.uid() = user_id);

-- --- cart_items: owners only (via cart ownership) --------------------------
create policy "cart_items_select_own"
  on cart_items for select
  using (
    exists (
      select 1 from carts
      where id = cart_items.cart_id
        and user_id = auth.uid()
    )
  );

create policy "cart_items_insert_own"
  on cart_items for insert
  with check (
    exists (
      select 1 from carts
      where id = cart_items.cart_id
        and user_id = auth.uid()
    )
  );

create policy "cart_items_update_own"
  on cart_items for update
  using (
    exists (
      select 1 from carts
      where id = cart_items.cart_id
        and user_id = auth.uid()
    )
  );

create policy "cart_items_delete_own"
  on cart_items for delete
  using (
    exists (
      select 1 from carts
      where id = cart_items.cart_id
        and user_id = auth.uid()
    )
  );

-- --- favorites: owners only -------------------------------------------------
create policy "favorites_select_own"
  on favorites for select
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "favorites_delete_own"
  on favorites for delete
  using (auth.uid() = user_id);

-- --- orders: owners only ----------------------------------------------------
create policy "orders_select_own"
  on orders for select
  using (auth.uid() = user_id);

create policy "orders_insert_own"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "orders_update_own"
  on orders for update
  using (auth.uid() = user_id);

-- --- order_items: owners only (via order ownership) -------------------------
create policy "order_items_select_own"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where id = order_items.order_id
        and user_id = auth.uid()
    )
  );

-- ============================================================================
-- Seed data: formats
-- ============================================================================
insert into formats (slug, name, icon, color, image_url, photo_shows, photo_keywords) values
  ('chips', 'Bim bim', '🍟', '#ffb82e', '/assets/products/chips.webp', 'túi snack vị mặn', ARRAY['khoai', 'bim bim', 'snack', 'bánh gạo', 'phô mai', 'bbq', 'ngô']),
  ('noodles', 'Mì & đồ ăn liền', '🍜', '#ef3340', '/assets/products/noodles.webp', 'ly mì ăn liền', ARRAY['mì ly', 'mì', 'ly']),
  ('instant', 'Xúc xích', '🌭', '#31a354', '/assets/products/instant.webp', 'gói ăn liền', ARRAY['xúc xích', 'cá viên', 'cháo', 'ăn liền']),
  ('chocolate', 'Chocolate', '🍫', '#6f3d27', '/assets/products/chocolate.webp', 'thanh chocolate', ARRAY['chocolate', 'ca cao', 'xốp']),
  ('drinks', 'Nước uống', '🥤', '#7a32a8', '/assets/products/drinks.webp', 'lon soda trái cây', ARRAY['soda', 'lon', 'nước', 'trà']),
  ('spicy', 'Đồ cay', '🌶️', '#ff5a1f', '/assets/products/spicy.webp', 'gói đồ cay', ARRAY['cay', 'khô', 'gà', 'que']),
  ('candy', 'Kẹo', '🍬', '#ef5b9a', '/assets/products/candy.webp', 'gói kẹo', ARRAY['kẹo', 'gum']),
  ('healthy', 'Snack lành mạnh', '🌿', '#31a354', '/assets/products/healthy.webp', 'túi hạt & granola rang mộc', ARRAY['hạt', 'granola', 'điều', 'nhân', 'rang'])
on conflict (slug) do nothing;

-- ============================================================================
-- Seed data: shelves (categories)
-- ============================================================================
insert into shelves (slug, name, tagline, icon, color) values
  ('snack-man', 'Snack mặn', 'Giòn, mặn, mở là ăn', '🍟', '#ffb82e'),
  ('do-cay', 'Đồ cay', 'Cay từ từ rồi bùng', '🌶️', '#ff5a1f'),
  ('ngot', 'Ngọt & bánh', 'Tráng miệng trong 5 phút', '🍫', '#ef5b9a'),
  ('healthy', 'Healthy', 'Hạt & granola rang mộc', '🌿', '#137c58'),
  ('bua-nhanh', 'Bữa nhanh', 'Mì, cháo, xúc xích — 3 phút', '🍜', '#ef3340'),
  ('do-uong', 'Đồ uống', 'Soda lạnh 4°C, uống ngay', '🥤', '#7a32a8')
on conflict (slug) do nothing;

-- ============================================================================
-- Seed data: shelf_formats (junction)
-- ============================================================================
insert into shelf_formats (shelf_slug, format_slug) values
  ('snack-man', 'chips'),
  ('do-cay', 'spicy'),
  ('ngot', 'chocolate'),
  ('ngot', 'candy'),
  ('healthy', 'healthy'),
  ('bua-nhanh', 'noodles'),
  ('bua-nhanh', 'instant'),
  ('do-uong', 'drinks')
on conflict (shelf_slug, format_slug) do nothing;

-- ============================================================================
-- Seed data: products (8 seed rows)
-- ============================================================================
insert into products (slug, name, format_slug, shelf_slug, category_name, price, rating, sold, is_new, hot, color, tint, description, tags, notes, stock_floor_14, stock_floor_20) values
  ('khoai-tay-cay-bung-vi', 'Khoai tây cay bùng vị', 'chips', 'snack-man', 'Snack mặn', 12000, 4.9, 186, false, true, '#ffb82e', '#f5a623', 'Khoai tây cay bùng vị được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.', ARRAY['Giòn rụm', 'Đậm vị'], '[[ "Giòn 2 lớp", "Chiên giòn rồi rắc phô mai" ], [ "Phô mai thật", "Không bột bắp pha" ], [ "Túi 50g", "Vừa một giờ nghỉ" ]]', 8, 12),
  ('hat-hon-hop-rang-moc', 'Hạt hỗn hợp rang mộc', 'healthy', 'healthy', 'Healthy', 15000, 4.8, 149, false, false, '#137c58', '#2f6b31', 'Hạt hỗn hợp rang mộc được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.', ARRAY['Rang mộc', 'Giàu đạm'], '[[ "Rang không dầu", "Giữ nguyên vị hạt" ], [ "Đạm thực vật", "No lâu hơn bánh ngọt" ], [ "Túi 150g", "Chia được 3 lần ăn" ]]', 10, 9),
  ('mi-ly-tom-cay', 'Mì ly tôm cay', 'noodles', 'bua-nhanh', 'Bữa nhanh', 18000, 4.9, 226, false, true, '#ef3340', '#d13a1f', 'Mì ly tôm cay được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.', ARRAY['Cay bùng vị', '3 phút'], '[[ "Sa tế tôm", "Nước dùng nêm sẵn" ], [ "3 phút", "Chỉ cần nước sôi" ], [ "Ly 65g", "Có topping sấy" ]]', 7, 14),
  ('soda-trai-cay-nhiet-doi', 'Soda trái cây nhiệt đới', 'drinks', 'do-uong', 'Đồ uống', 14000, 4.7, 238, false, true, '#7a32a8', '#6d2a9b', 'Soda trái cây nhiệt đới được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.', ARRAY['Lạnh 4°C', 'Trái cây thật'], '[[ "Lấy từ tủ mát", "Uống ngay tại tầng" ], [ "Không phẩm màu", "Vị trái cây tự nhiên" ], [ "Lon 330ml", "Vừa một buổi chiều" ]]', 16, 11),
  ('chocolate-sua-mini', 'Chocolate sữa mini', 'chocolate', 'ngot', 'Ngọt & bánh', 18000, 4.8, 143, true, false, '#ef5b9a', '#5e3323', 'Chocolate sữa mini được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.', ARRAY['Ca cao 55%', 'Tan trong miệng'], '[[ "Ca cocoa 55%", "Đắng dịu, hậu ngọt" ], [ "Không dầu cọ", "Chỉ bơ ca cocoa" ], [ "Viên nhỏ", "Chia nhiều lần" ]]', 6, 13),
  ('keo-deo-trai-cay', 'Kẹo dẻo trái cây', 'candy', 'ngot', 'Ngọt & bánh', 15000, 4.7, 119, true, false, '#ef5b9a', '#e0457b', 'Kẹo dẻo trái cây được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.', ARRAY['Ngọt thanh', 'Không ngấy'], '[[ "Ngọt thanh", "Không gắt cổ" ], [ "Túi zip", "Giữ thơm lâu" ], [ "Chia sẻ", "Gói 20 viên" ]]', 11, 7),
  ('que-khoai-tay-cay', 'Que khoai tây cay', 'spicy', 'do-cay', 'Đồ cay', 11000, 4.8, 132, true, false, '#ff5a1f', '#c62f14', 'Que khoai tây cay được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.', ARRAY['Cay 3 lớp', 'Ăn liền'], '[[ "Ớt khô 3 loại", "Cay từ từ rồi bùng" ], [ "Ăn liền", "Không cần chế biến" ], [ "Gói 40g", "Đủ một lần ăn" ]]', 9, 15),
  ('xuc-xich-an-lien', 'Xúc xích ăn liền', 'instant', 'bua-nhanh', 'Bữa nhanh', 10000, 4.8, 211, true, false, '#ef3340', '#b52a26', 'Xúc xích ăn liền được chọn cho DOP Mart với khẩu phần tiện lợi, phù hợp giờ nghỉ nhanh tại văn phòng tầng 14 và 20.', ARRAY['Mở là ăn', 'Đạm cao'], '[[ "Không cần hâm", "Xé gói là dùng" ], [ "Từ thịt thật", "Không bột nhão" ], [ "Gói tiện", "Bỏ túi áo được" ]]', 4, 10)
on conflict (slug) do nothing;
