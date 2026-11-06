# Công cụ khôi phục code từ lịch sử generate của Cline

Cline lưu lại **toàn bộ lịch sử generate** (mọi tin nhắn của model và mọi lần ghi/sửa file) trong thư mục dữ liệu cục bộ. Hai script dưới đây đọc lịch sử đó để dựng lại source code, kể cả khi thư mục dự án đã bị xoá.

## 1. Rà lịch sử để tìm phiên chứa code

```bash
node tools/find-cline-sessions.js
# hoặc chỉ định thư mục cụ thể
node tools/find-cline-sessions.js "$HOME/.cline/data/sessions"
```

Script tự dò các vị trí thường gặp:

| Nền tảng | Đường dẫn |
| --- | --- |
| Cline CLI / dashboard | `~/.cline/data/sessions/**/<id>.messages.json` |
| VS Code (Windows) | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\tasks\**\api_conversation_history.json` |
| VS Code (macOS) | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/tasks/**` |
| VS Code (Linux) | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/tasks/**` |

Kết quả xếp hạng theo số lần ghi file và số lần nhắc tới từ khoá cần tìm (DOP Mart).

## 2. Dựng lại source code từ transcript

```bash
node tools/recover-cline-code.js "<đường-dẫn-transcript>" ./recovered
```

Script sẽ:

- tái tạo đúng cây thư mục tương đối so với thư mục gốc chung;
- ghi nội dung từ `write_to_file`;
- áp các thay đổi `replace_in_file` / `edit_file` (khối `<<<<<<< SEARCH … REPLACE`);
- cảnh báo nếu phiên có dùng `apply_patch` (phần đó nên dùng “Restore checkpoint” trong Cline hoặc xem lại hội thoại).

Hỗ trợ cả hai định dạng lưu trữ: `*.messages.json` / `api_conversation_history.json` và `ui_messages.json` của extension VS Code.

## 3. Đưa code đã khôi phục lên GitHub

```bash
git clone https://github.com/nguyencuong169/DOPMart.git
cd DOPMart
cp -r ../recovered/* .
git add -A
git commit -m "feat: khôi phục DOP Mart từ phiên generate"
git push origin main
```

> Nếu file vẫn còn trên máy, cách nhanh nhất vẫn là mở đúng workspace và dùng **Restore checkpoint** trong Cline, sau đó `git push` trực tiếp.
