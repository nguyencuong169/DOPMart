# LUỒNG KIỂM TRA UI — DOPMart

Tài liệu này mô tả toàn bộ pattern kiểm tra giao diện người dùng (UI) cho DOPMart, nhằm phát hiện sớm các vấn đề phát sinh sau mỗi thay đổi code. Không cần cài thêm test runner; có thể thực hiện theo flow thủ tục hoặc viết script Node đơn giản.

## 1. Cách sử dụng
- Mỗi pattern bao gồm: Mục đích, Điều kiện trước, Bước kiểm tra, Kết quả mong đợi, Lỗi thường gặp.
- Sau khi hoàn tất một pattern, đánh dấu [x] trong checklist cuối cùng.
- Nếu phát hiện lỗi, ghi lại: trình duyệt, màn hình (width), bước bị lỗi, chụp màn hình nếu có.

## 2. Môi trường kiểm tra
- Trình duyệt: Chrome, Firefox, Safari, Edge
- Kích thước màn hình: Mobile (375px), Tablet (768px), Desktop (1280px+)
- Môi trường: Dev (localhost:5173), Staging (nếu có)
- Tài khoản test: admin, customer, chưa đăng nhập

## 3. Pattern kiểm tra

### 3.1 Xác thực (Auth)

#### 3.1.1 Đăng nhập
- Mục đích: Xác minh người dùng có thể đăng nhập và được chuyển hướng đúng.
- Điều kiện trước: Trang `/login` đã tải, Supabase đã cấu hình.
- Bước: Nhập email/mật khẩu đúng → nhấn Đăng nhập.
- Kết quả mong đợi: Chuyển về trang chủ `/`, hiển thị thông tin user ở header, nút Đăng nhập biến mất.
- Lỗi thường gặp: Không chuyển hướng, vẫn hiển thị form đăng nhập, thông tin sai.

#### 3.1.2 Đăng ký
- Mục đích: Xác minh tài khoản mới có thể được tạo.
- Bước: Truy cập `/register`, điền đầy đủ thông tin, nhấn Đăng ký.
- Kết quả: Tài khoản được tạo, chuyển đến trang xác thực hoặc đăng nhập.
- Lỗi: Lỗi validation trùng email, mật khẩu yếu không bị chặn.

#### 3.1.3 Bảo vệ route (Protected Route)
- Mục đích: Xác minh các route cần đăng nhập không truy cập được khi chưa đăng nhập.
- Bước: Truy cập trực tiếp `/profile`, `/orders`, `/checkout` mà chưa đăng nhập.
- Kết quả: Chuyển hướng về `/login` kèm query `redirect`.
- Lỗi: Truy cập được mà chưa đăng nhập, hoặc redirect sai trang.

#### 3.1.4 Đăng xuất
- Mục đích: Xác minh phiên làm việc bị huỷ và UI cập nhật.
- Bước: Đăng nhập → nhấn Đăng xuất ở header.
- Kết quả: Chuyển về trang chủ, header hiển thị nút Đăng nhập/Đăng ký, giỏ hàng reset.
- Lỗi: Vẫn hiển thị thông tin user sau khi đăng xuất, giỏ hàng không reset.

### 3.2 Danh mục sản phẩm (Catalog)

#### 3.2.1 Xem danh sách sản phẩm
- Mục đích: Xác minh sản phẩm hiển thị đúng, phân trang, lọc, sắp xếp.
- Bước: Truy cập `/products`, xem sản phẩm, nhấn phân trang, lọc danh mục, sắp xếp giá.
- Kết quả: Số sản phẩm khớp với `paginate`, lọc đúng danh mục, sắp xếp đúng giá tăng/giảm.
- Lỗi: Sản phẩm trùng lặp, phân trang sai, lọc không áp dụng.

#### 3.2.2 Tìm kiếm
- Mục đích: Xác minh chức năng tìm kiếm sản phẩm.
- Bước: Nhập từ khóa ở ô tìm kiếm, nhấn Enter.
- Kết quả: Chỉ hiển thị sản phẩm có tên chứa từ khóa.
- Lỗi: Không lọc được, tìm kiếm phân biệt hoa thường không mong muốn.

#### 3.2.3 Chi tiết sản phẩm
- Mục đích: Xác minh trang chi tiết hiển thị đầy đủ thông tin.
- Bước: Nhấn vào một sản phẩm → `/product/:slug`.
- Kết quả: Hiển thị tên, giá, mô tả, hình ảnh, nút Thêm vào giỏ.
- Lỗi: Hình ảnh không tải, giá sai, nút thêm vào giỏ không phản hồi.

### 3.3 Giỏ hàng (Cart)

#### 3.3.1 Thêm vào giỏ
- Mục đích: Xác minh sản phẩm được thêm vào giỏ hàng.
- Bước: Tại trang chi tiết hoặc danh mục, nhấn Thêm vào giỏ.
- Kết quả: MiniCart hiển thị số lượng tăng, tổng tiền cập nhật.
- Lỗi: Số lượng không tăng, sản phẩm trùng không gộp, tổng tiền sai.

#### 3.3.2 Cập nhật số lượng / Xóa
- Mục đích: Xác minh thay đổi giỏ hàng.
- Bước: Vào `/cart`, thay đổi số lượng hoặc nhấn Xóa.
- Kết quả: Giỏ hàng cập nhật ngay, tổng tiền tính lại.
- Lỗi: Số lượng 0 không xóa sản phẩm, tổng tiền không cập nhật.

#### 3.3.3 Checkout
- Mục đích: Xác minh luồng đặt hàng.
- Bước: Đăng nhập → vào giỏ hàng → nhấn Thanh toán → `/checkout`.
- Kết quả: Hiển thị form thông tin giao hàng, tổng đơn hàng, nút đặt hàng.
- Lỗi: Chưa đăng nhập vẫn vào được checkout, form không validate, tổng tiền sai.

### 3.4 Đơn hàng (Orders)

#### 3.4.1 Xem lịch sử đơn hàng
- Mục đích: Xác minh khách hàng chỉ xem được đơn hàng của mình.
- Bước: Đăng nhập khách hàng → `/orders`.
- Kết quả: Chỉ hiển thị đơn hàng của khách hàng đó.
- Lỗi: Xem được đơn hàng của người khác.

#### 3.4.2 Chi tiết đơn hàng
- Mục đích: Xác minh xem chi tiết một đơn hàng.
- Bước: Nhấn vào một đơn hàng → `/orders/:id`.
- Kết quả: Hiển thị chi tiết sản phẩm, số lượng, trạng thái, tổng tiền.
- Lỗi: Truy cập đơn hàng không thuộc về mình mà không bị chặn.

### 3.5 Hồ sơ (Profile)

#### 3.5.1 Cập nhật thông tin
- Mục đích: Xác minh user có thể cập nhật profile của mình.
- Bước: Đăng nhập → `/profile`, sửa thông tin, lưu.
- Kết quả: Thông tin được cập nhật, hiển thị thông báo thành công.
- Lỗi: Không lưu được, thông tin cũ vẫn hiển thị.

### 3.6 Quản trị (Admin)

#### 3.6.1 Truy cập admin
- Mục đích: Xác minh chỉ admin mới vào được `/admin`.
- Bước: Đăng nhập admin → `/admin/dashboard`.
- Kết quả: Hiển thị bảng điều khiển admin.
- Lỗi: Khách hàng vào được admin, hoặc admin bị chặn sai.

#### 3.6.2 Quản lý sản phẩm / Đơn hàng / Người dùng / Khuyến mãi
- Mục đích: Xác minh CRUD admin hoạt động.
- Bước: Tại các trang admin, thực hiện thêm/sửa/xóa.
- Kết quả: Thao tác thành công, danh sách cập nhật ngay.
- Lỗi: Thao tác không lưu, xóa không xác nhận, phân trang sai.

#### 3.6.3 Chặn tự hạ cấp vai trò (Self-demotion block)
- Mục đích: Xác minh admin không thể tự đổi vai trò của mình thành customer.
- Bước: Admin gọi RPC `update_mart_user_role` với own id và role 'customer'.
- Kết quả: Lỗi `CANNOT_CHANGE_OWN_ROLE`.
- Lỗi: Cho phép tự hạ cấp vai trò.

### 3.7 Thiết kế đáp ứng & Typography

#### 3.7.1 Mobile vs Desktop
- Mục đích: Xác minh giao diện không bị vỡ trên các kích thước màn hình.
- Bước: Thay đổi kích thước cửa sổ trình duyệt, kiểm tra menu, bảng, form.
- Kết quả: Menu chuyển sang hamburger trên mobile, bảng cuộn ngang nếu cần, chữ không bị cắt.
- Lỗi: Menu không mở trên mobile, bảng tràn màn hình, chữ bị đè lên nhau.

#### 3.7.2 Tiếng Việt & diacritic
- Mục đích: Xác minh ký tiếng Việt hiển thị đúng, không bị vỡ font.
- Bước: Kiểm tra tất cả văn bản có dấu tiếng Việt trên trang.
- Kết quả: Tất cả ký tự hiển thị đúng, không có mojibake.
- Lỗi: `CHỌN` hiển thị `CHềE`, dấu mũ bị lệch.

#### 3.7.3 Contrast & accessibility
- Mục đích: Xác minh tỷ lệ contrast tối thiểu 4.5:1 cho văn bản thường.
- Bước: Sử dụng công cụ kiểm tra contrast (DevTools, axe).
- Kết quả: Tất cả văn bản đạt chuẩn WCAG AA.
- Lỗi: Màu xám nhạt trên nền trắng không đủ contrast.

### 3.8 Xử lý lỗi & Edge case

#### 3.8.1 Mạng mất kết nối
- Mục đích: Xác minh ứng dụng phản ứng khi Supabase không phản hồi.
- Bước: Ngắt mạng hoặc chặn request Supabase, thực hiện thao tác cần mạng.
- Kết quả: Hiển thị thông báo lỗi thân thiện, không treo ứng dụng.
- Lỗi: Ứng dụng treo trắng, không có thông báo.

#### 3.8.2 Trang không tồn tại
- Mục đích: Xác minh route 404.
- Bước: Truy cập `/khong-ton-tai`.
- Kết quả: Chuyển hướng về trang chủ hoặc hiển thị trang 404.
- Lỗi: Trang trắng, lỗi 500.

#### 3.8.3 Upload ảnh sản phẩm (admin)
- Mục đích: Xác minh upload ảnh lên Supabase Storage.
- Bước: Tại trang quản lý sản phẩm admin, upload ảnh.
- Kết quả: Ảnh được upload, hiển thị preview, URL công khai đúng.
- Lỗi: Upload thất bại, ảnh không hiển thị, bucket không tồn tại.

## 4. Checklist cuối cùng
[ ] Đăng nhập / Đăng ký / Đăng xuất hoạt động đúng
[ ] Protected route chuyển hướng đúng khi chưa đăng nhập
[ ] Danh mục sản phẩm: lọc, sắp xếp, phân trang đúng
[ ] Tìm kiếm sản phẩm trả về kết quả chính xác
[ ] Chi tiết sản phẩm hiển thị đầy đủ thông tin
[ ] Thêm vào giỏ, cập nhật số lượng, xóa sản phẩm hoạt động
[ ] Checkout hiển thị form và tổng tiền đúng
[ ] Khách hàng chỉ xem được đơn hàng của mình
[ ] Admin truy cập được tất cả trang quản trị
[ ] Admin không thể tự hạ cấp vai trò của mình
[ ] Giao diện không vỡ trên mobile/tablet/desktop
[ ] Tiếng Việt hiển thị đúng, không có mojibake
[ ] Contrast đạt chuẩn WCAG 4.5:1
[ ] Không có lỗi JavaScript trong console DevTools
[ ] Mạng mất kết nối có thông báo lỗi thân thiện
[ ] Route không tồn tại không gây treo ứng dụng
[ ] Upload ảnh sản phẩm admin thành công

## 5. Ghi chú khi phát hiện lỗi
- Ghi lại: Trình duyệt, phiên bản, kích thước màn hình, tài khoản test, bước tái lập, kết quả thực tế vs mong đợi.
- Chụp màn hình và đính kèm vào issue.
- Kiểm tra lại file UTF-8 bằng `npm run check:encoding` nếu lỗi liên quan đến văn bản hiển thị sai.
