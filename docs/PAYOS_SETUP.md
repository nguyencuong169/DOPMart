# DOP Mart – PayOS + VietQR

DOP Mart giữ `payment.method = vietqr` ở luồng nghiệp vụ. Khi người dùng đặt
hàng, Edge Function chuyển payment sang provider `payos`, tạo payment link
động và trả về trang checkout PayOS để người dùng quét VietQR bằng ứng dụng
ngân hàng.

## 1. Lấy credential PayOS

1. Tạo và xác thực tài khoản cá nhân tại [my.payos.vn](https://my.payos.vn).
2. Liên kết tài khoản ngân hàng cá nhân.
3. Tạo một payment channel.
4. Lấy ba giá trị `Client ID`, `API Key` và `Checksum Key` của channel.

PayOS hiện chạy API production, không có sandbox riêng. Khi kiểm thử nên dùng
giá trị nhỏ và tài khoản cá nhân dành cho test.

## 2. Lưu secret vào Supabase

Chạy từ thư mục repo:

```powershell
npx supabase secrets set --remote=znwgqdaqxxynxoltuhpp `
  PAYOS_CLIENT_ID="<client-id>" `
  PAYOS_API_KEY="<api-key>" `
  PAYOS_CHECKSUM_KEY="<checksum-key>"
```

Không đưa ba giá trị này vào `VITE_*`, `.env.local`, frontend bundle hoặc
Git. Edge Functions đọc chúng bằng `Deno.env.get(...)`.

Các URL không nhạy cảm đã được cấu hình cho môi trường local:

```text
PAYOS_API_BASE_URL=https://api-merchant.payos.vn
PAYOS_RETURN_URL=http://127.0.0.1:5173/checkout
PAYOS_CANCEL_URL=http://127.0.0.1:5173/checkout
```

Function tự thêm `order=<uuid>&payment=payos` vào return URL để trang checkout
đọc lại đơn sau khi PayOS redirect.

## 3. Cấu hình webhook trên PayOS

Đặt URL webhook của payment channel là:

```text
https://znwgqdaqxxynxoltuhpp.supabase.co/functions/v1/payment-webhook
```

Webhook không yêu cầu JWT của Supabase. Function tự xác minh `signature` bằng
`PAYOS_CHECKSUM_KEY`, sau đó gọi RPC transaction-safe để:

- ghi nhận `payment_events` chống duplicate;
- kiểm tra đúng số tiền và currency;
- commit reservation;
- trừ `inventory_balances` và ghi `inventory_movements`;
- chuyển payment sang `succeeded` và order sang `confirmed`.

Nếu số tiền sai, giao dịch bị chuyển `manual_review`; không tự động giao hàng.

## 4. Kiểm thử end-to-end

1. Đăng nhập bằng user customer.
2. Chọn sản phẩm, chọn `VietQR`, tạo đơn.
3. Mở link PayOS và thanh toán số tiền nhỏ.
4. Kiểm tra log của function `payment-webhook` và order trong dashboard admin.
5. Gửi lại cùng webhook hoặc chờ PayOS retry để kiểm tra idempotency; tồn kho
   chỉ được trừ một lần.

Nếu chưa nhập ba secret PayOS, checkout vẫn tạo được order và reservation,
nhưng Edge Function sẽ trả `PAYOS_NOT_CONFIGURED`; không được coi đó là thanh
toán thành công.
