UPDATE public.products
SET
  name = 'Khoai tây vị phô mai',
  description = CASE
    WHEN description = 'Khoai tây cay bùng vị - gói 120g'
      THEN 'Khoai tây vị phô mai - gói 50g'
    ELSE description
  END
WHERE slug = 'khoai-tay-cay-bung-vi'
  AND format_slug = 'chips'
  AND name = 'Khoai tây cay bùng vị';
