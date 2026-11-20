-- ============================================================
-- 0004_products_image.sql
-- Bổ sung cột image (TEXT) vào bảng products để lưu URL ảnh upload
-- Lưu ý: chạy migration này TRƯỚC khi dùng tính năng upload ảnh sản phẩm admin
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image TEXT;