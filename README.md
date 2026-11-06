# 🛒 DOP Mart

Cửa hàng trực tuyến **DOP Mart** — ứng dụng web bán hàng đầy đủ (giao diện + REST API) xây dựng bằng **Node.js thuần, không dùng thư viện ngoài**.

- 🏪 Giao diện mua sắm tiếng Việt: trang chủ, danh mục, tìm kiếm, chi tiết sản phẩm, giỏ hàng, thanh toán, tra cứu đơn.
- 🔐 Tài khoản người dùng: đăng ký / đăng nhập / đăng xuất, phân quyền khách hàng và quản trị viên.
- 🛍️ Nghiệp vụ bán hàng: tồn kho, mã giảm giá, miễn phí vận chuyển, đặt hàng COD/chuyển khoản, huỷ đơn hoàn kho.
- ⚙️ Trang quản trị: thống kê doanh thu, quản lý đơn hàng, thêm/sửa/ẩn sản phẩm, danh sách khách hàng.
- ✅ Kiểm thử tự động 13 nhóm test bằng `node:test` (không cần cài dependency).

## Yêu cầu

- Node.js **>= 18** (khuyến nghị 20+). Không cần `npm install` vì dự án không có dependency.

## Chạy nhanh

```bash
# 1. Khởi động máy chủ (mặc định http://localhost:3000)
node server.js

# hoặc dùng npm script
npm start

# đổi cổng nếu cần
PORT=8080 node server.js
```

Mở trình duyệt tại <http://localhost:3000>.

Lần chạy đầu tiên, hệ thống tự tạo dữ liệu mẫu (24 sản phẩm, 8 danh mục, 2 tài khoản) trong `data/db.json`.

### Tài khoản demo

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin@dopmart.vn` | `Admin@123` |
| Khách hàng | `khach@dopmart.vn` | `Khach@123` |

Mã giảm giá demo: `DOP10` (giảm 10%, tối đa 50.000₫) và `FREESHIP` (miễn phí vận chuyển).

## Kiểm thử

```bash
npm test
```

Bộ test khởi tạo máy chủ HTTP thật trên cổng ngẫu nhiên, dùng thư mục dữ liệu tạm và kiểm tra:

- health/config/categories và dữ liệu mẫu;
- tìm kiếm không dấu, lọc danh mục, khoảng giá, sắp xếp, phân trang, sản phẩm nổi bật;
- chi tiết sản phẩm, sản phẩm liên quan;
- giỏ hàng: thêm/cập nhật/xoá, mã giảm giá, chặn vượt tồn kho;
- đặt hàng: miễn phí ship từ 500.000₫, trừ tồn kho, tra cứu đơn của khách vãng lai;
- đăng ký/đăng nhập/đăng xuất, kiểm tra mật khẩu và trùng email;
- phân quyền quản trị, CRUD sản phẩm, cập nhật trạng thái đơn, thống kê;
- phục vụ giao diện tĩnh và chặn truy cập tệp ngoài `public/`.

## Cấu trúc dự án

```
.
├── server.js               # Điểm khởi động HTTP server
├── package.json            # Scripts (start / dev / test), không có dependency
├── src/
│   ├── app.js              # Router REST API + phục vụ tệp tĩnh
│   ├── db.js               # Lớp dữ liệu JSON (users, products, carts, orders, sessions)
│   ├── auth.js             # Băm mật khẩu scrypt, sinh token
│   ├── seed.js             # Danh mục, 24 sản phẩm, 2 tài khoản mẫu
│   └── utils.js            # Lỗi HTTP, đọc JSON, cookie, slug, định dạng tiền
├── public/
│   ├── index.html          # Khung giao diện
│   ├── css/styles.css      # Giao diện responsive
│   └── js/
│       ├── api.js          # Gọi API, định dạng tiền/ngày, nhãn trạng thái
│       └── app.js          # SPA hash routing: trang chủ, sản phẩm, giỏ, đơn, quản trị
├── test/api.test.js        # Kiểm thử API end-to-end
└── data/db.json            # Sinh tự động khi chạy (đã nằm trong .gitignore)
```

## Luồng sử dụng chính

1. **Mua sắm**: trang chủ → chọn danh mục hoặc tìm kiếm → chi tiết sản phẩm → thêm vào giỏ.
2. **Đặt hàng**: giỏ hàng (áp mã `DOP10`) → thanh toán (COD/chuyển khoản) → nhận mã đơn `DH100x`.
3. **Tra cứu**: `#/orders` nhập mã đơn (khách vãng lai) hoặc đăng nhập để xem toàn bộ đơn.
4. **Quản trị**: đăng nhập `admin@dopmart.vn` → `#/admin` → xem thống kê, đổi trạng thái đơn, thêm/sửa/ẩn sản phẩm.

## Quy tắc nghiệp vụ

- Giá lưu bằng số nguyên VNĐ; hiển thị theo định dạng `vi-VN`.
- Phí vận chuyển 25.000₫, **miễn phí** cho đơn từ 500.000₫.
- Mỗi dòng sản phẩm tối đa 99 đơn vị và không vượt tồn kho hiện tại.
- Trạng thái đơn: `pending → confirmed → packing → shipping → delivered`, có thể `cancelled` trước khi giao.
- Huỷ đơn sẽ hoàn lại tồn kho; đơn đã huỷ/đã giao không đổi trạng thái được nữa.
- Mật khẩu băm bằng `scrypt` kèm salt riêng, phiên đăng nhập dùng cookie `HttpOnly` (7 ngày).
- Dữ liệu ghi nguyên tử (tệp tạm + `rename`) để tránh hỏng `db.json`.

## REST API

| Nhóm | Phương thức & đường dẫn | Mô tả |
| --- | --- | --- |
| Hệ thống | `GET /api/health` | Kiểm tra trạng thái |
| | `GET /api/config` | Cấu hình cửa hàng, mã giảm giá, danh mục |
| | `GET /api/categories` | Danh mục kèm số sản phẩm |
| Sản phẩm | `GET /api/products` | Danh sách + `q`, `category`, `sort`, `min`, `max`, `page`, `limit`, `featured` |
| | `GET /api/products/:id` | Chi tiết theo id/slug + sản phẩm liên quan |
| Tài khoản | `POST /api/auth/register` | Đăng ký (name, email, password) |
| | `POST /api/auth/login` / `POST /api/auth/logout` | Đăng nhập / đăng xuất |
| | `GET /api/auth/me` · `PUT /api/auth/profile` | Thông tin hiện tại / cập nhật hồ sơ |
| Giỏ hàng | `GET /api/cart` | Giỏ hàng + tạm tính, giảm giá, phí ship |
| | `POST /api/cart` · `PATCH /api/cart/:productId` · `DELETE /api/cart/:productId` | Thêm / đổi số lượng / xoá |
| | `POST /api/cart/coupon` | Áp mã giảm giá (`DOP10`, `FREESHIP`) |
| Đơn hàng | `POST /api/orders` | Đặt hàng (thông tin giao hàng + phương thức thanh toán) |
| | `GET /api/orders` · `GET /api/orders/:code` | Đơn của tôi / chi tiết đơn |
| | `POST /api/orders/:code/cancel` | Huỷ đơn (hoàn kho) |
| Quản trị | `GET /api/admin/stats` | Doanh thu, số đơn, tồn kho thấp, top bán chạy |
| | `GET /api/admin/orders` · `PATCH /api/admin/orders/:code` | Danh sách đơn / đổi trạng thái |
| | `GET/POST /api/admin/products` · `PATCH/DELETE /api/admin/products/:id` | CRUD sản phẩm (xoá = ẩn) |
| | `GET /api/admin/customers` | Danh sách khách hàng |

Mọi phản hồi lỗi có dạng `{ "error": "mô tả tiếng Việt" }` với mã HTTP phù hợp (400/401/403/404/409).

## Ghi chú kỹ thuật

- Không dùng framework/thư viện: chỉ `node:http`, `node:fs`, `node:crypto`, `node:path`, `node:url`.
- Lưu trữ JSON đơn giản phù hợp demo/học tập; khi triển khai thật nên thay bằng cơ sở dữ liệu quan hệ.
- Biến môi trường: `PORT` (mặc định 3000), `HOST` (mặc định 0.0.0.0), `DOP_DATA_DIR` (đổi thư mục dữ liệu), `NODE_ENV=test` (tắt log request).
