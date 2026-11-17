-- ============================================================
-- DOPMart seed data
-- Migration file: supabase/migrations/0001_init_schema.sql
-- ============================================================

-- shelves (6)
INSERT INTO shelves (slug, name, tagline, icon, color, formats) VALUES
  ('snack-man', 'Snack mặn', 'Giòn, mặn, mở là ăn', '🍟', '#ffb82e', ARRAY['chips']),
  ('do-cay', 'Đồ cay', 'Cay từ từ rồi bùng', '🌶️', '#ff5a1f', ARRAY['spicy']),
  ('ngot', 'Ngọt & bánh', 'Tráng miệng trong 5 phút', '🍫', '#ef5b9a', ARRAY['chocolate', 'candy']),
  ('healthy', 'Snack lành mạnh', 'Rang mộc, giàu đạm', '🌿', '#31a354', ARRAY['healthy']),
  ('bua-nhanh', 'Bụp cơm', 'Mì nộm, cơm tấm, xôi', '🍜', '#ef3340', ARRAY['noodles', 'instant']),
  ('do-uong', 'Đồ uống', 'Soda lạnh 4°C, uống ngay', '🥤', '#7a32a8', ARRAY['drinks']);

-- formats (8)
INSERT INTO formats (slug, name, icon, color, image, photo_shows, photo_keywords) VALUES
  ('chips', 'Bim bim', '🍟', '#ffb82e', 'chips.webp', 'túi snack vị mặn', ARRAY['khoai', 'bim bim', 'snack', 'bánh gạo', 'phô mai', 'bbq', 'ngô']),
  ('noodles', 'Mì & đồ ăn liền', '🍜', '#ef3340', 'noodles.webp', 'ly mì ăn liền', ARRAY['mì ly', 'mì', 'ly']),
  ('instant', 'Xúc xích', '🌭', '#31a354', 'instant.webp', 'gói ăn liền', ARRAY['xúc xích', 'cá viên', 'cháo', 'ăn liền']),
  ('chocolate', 'Chocolate', '🍫', '#6f3d27', 'chocolate.webp', 'thanh chocolate', ARRAY['chocolate', 'ca cao', 'xốp']),
  ('drinks', 'Nước uống', '🥤', '#7a32a8', 'drinks.webp', 'lon soda trái cây', ARRAY['soda', 'lon', 'nước', 'trà']),
  ('spicy', 'Đồ cay', '🌶️', '#ff5a1f', 'spicy.webp', 'gói đồ cay', ARRAY['cay', 'khô', 'gà', 'que']),
  ('candy', 'Kẹo', '🍬', '#ef5b9a', 'candy.webp', 'gói kẹo', ARRAY['kẹo', 'gum']),
  ('healthy', 'Snack lành mạnh', '🌿', '#31a354', 'healthy.webp', 'túi hạt & granola rang mộc', ARRAY['hạt', 'granola', 'điều', 'nhân', 'rang']);

-- products (8 mẫu seed)
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
