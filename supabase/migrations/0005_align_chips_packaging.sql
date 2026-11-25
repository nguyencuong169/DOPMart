UPDATE public.products
SET name = 'Khoai tây vị phô mai',
    description = CASE WHEN description = 'Khoai tây cay bùng vị - gói 120g'
                       THEN 'Khoai tây giòn rụm, phủ phô mai đậm vị.'
                       ELSE description END
WHERE slug = 'khoai-tay-cay-bung-vi' AND name = 'Khoai tây cay bùng vị';
