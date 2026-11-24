# DOP Mart – Order expiry

Các đơn ở trạng thái `pending_payment` được giữ tồn kho trong 15 phút. Sau thời
gian này, hệ thống cần:

- chuyển order sang `expired`;
- chuyển payment chưa thành công sang `expired`;
- chuyển reservation sang `released`;
- hoàn lại `reserved_qty` vào tồn khả dụng;
- ghi `order_status_history`.

## Edge Function

Function đã deploy:

```text
expire-orders
```

Endpoint:

```text
https://znwgqdaqxxynxoltuhpp.supabase.co/functions/v1/expire-orders
```

Function không dùng Supabase JWT. Nó yêu cầu header bí mật:

```text
x-order-expiry-secret: <ORDER_EXPIRY_SECRET>
```

## Cấu hình secret

Tạo secret riêng cho scheduler:

```powershell
npx supabase secrets set --remote=znwgqdaqxxynxoltuhpp `
  ORDER_EXPIRY_SECRET="<random-long-secret>"
```

Không đưa secret vào frontend hoặc commit vào Git.

## Gọi thủ công

```powershell
Invoke-RestMethod `
  -Uri "https://znwgqdaqxxynxoltuhpp.supabase.co/functions/v1/expire-orders" `
  -Method Post `
  -Headers @{ "x-order-expiry-secret" = "<random-long-secret>" } `
  -ContentType "application/json" `
  -Body '{"limit":100}'
```

Response mẫu:

```json
{
  "data": {
    "expiredCount": 3,
    "manualReviewCount": 0
  }
}
```

Nên gọi function mỗi 1–5 phút bằng scheduler/cron. RPC bên dưới dùng
`FOR UPDATE SKIP LOCKED`, nên nhiều worker chạy đồng thời vẫn không xử lý cùng
một order hai lần.

## Trạng thái project DOP Mart

Project mới đã được cấu hình:

```text
Cron job: dop-mart-expire-orders
Schedule: */5 * * * *
Target: expire-orders
Secret: Edge Function Secrets + Supabase Vault
```

Secret không nằm trong migration hoặc source code. Cron đọc secret từ Vault
tại thời điểm gửi request.

```text
public.expire_mart_pending_orders(integer)
```

Nếu reservation không còn đủ hoặc inventory invariant bị hỏng, order sẽ chuyển
sang `manual_review` thay vì tự ý giải phóng sai tồn kho.
