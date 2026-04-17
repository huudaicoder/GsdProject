---
status: complete
phase: 01-foundation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md]
started: 2026-04-17T00:00:00+07:00
updated: 2026-04-17T00:00:00+07:00
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Dừng tất cả service đang chạy (nếu có). Chạy `docker compose up -d` để khởi động PostgreSQL. Sau đó `cd KhoThietBi/aspnet-core && dotnet run --project src/KhoThietBi.HttpApi.Host`. Cuối cùng mở terminal khác: `cd kho-thiet-bi-ui && ng serve`. Kỳ vọng: backend khởi động không lỗi (cổng 44369 hoặc 5000+), Angular dev server chạy trên localhost:4200, truy cập http://localhost:4200 tự chuyển sang /login.
result: pass

### 2. Login page appearance
expected: Trang /login hiển thị layout 2 cột: bên trái màu navy (#1E3A5F) có vòng tròn "KTB", dòng chữ "Quản lý Kho Thiết Bị" và tagline màu xanh nhạt. Bên phải là form trắng với tiêu đề "Đăng nhập", 2 field (Tên đăng nhập / Mật khẩu), và nút "Đăng nhập" màu xanh full-width.
result: pass

### 3. Login with valid credentials
expected: Nhập username=admin, password=1q2w3E* rồi nhấn "Đăng nhập". Kỳ vọng: loading spinner xuất hiện trên nút, sau đó chuyển hướng về /dashboard. Không có thông báo lỗi.
result: pass

### 4. Login with wrong username
expected: Nhập username=nguoidung_khong_ton_tai, password=batky rồi submit. Kỳ vọng: hiện thông báo lỗi đỏ "Tên đăng nhập không tồn tại. Vui lòng kiểm tra lại." (có đầy đủ dấu tiếng Việt).
result: pass

### 5. Login with wrong password
expected: Nhập username=admin, password=satkhau_sai rồi submit. Kỳ vọng: hiện thông báo lỗi đỏ "Mật khẩu không đúng. Vui lòng thử lại." (có đầy đủ dấu tiếng Việt).
result: pass

### 6. Session persists after browser refresh
expected: Sau khi đăng nhập thành công và đang ở /dashboard, nhấn F5 (refresh trang). Kỳ vọng: vẫn ở /dashboard, không bị redirect về /login. Header vẫn hiển thị tên admin.
result: pass

### 7. Auth guard — unauthenticated redirect
expected: Mở tab ẩn danh (hoặc logout trước), truy cập thẳng http://localhost:4200/dashboard. Kỳ vọng: tự động chuyển về /login, không hiển thị dashboard.
result: pass

### 8. App shell layout
expected: Sau khi đăng nhập, trang /dashboard có: sidebar cố định 256px bên trái (màu trắng, có logo "KTB"), header 56px trên cùng hiển thị tiêu đề trang + tên admin + nút "Đăng xuất". Nội dung dashboard nằm trong vùng còn lại bên phải.
result: pass

### 9. Sidebar collapsible groups
expected: Sidebar có 1 mục standalone "Dashboard" và 4 nhóm có thể thu/mở: "Danh mục", "Nhập xuất kho", "Quản lý", "Thống kê". Click vào nhóm "Danh mục" → nhóm mở ra, hiển thị các mục con (Danh mục thiết bị, Nhà cung cấp…). Click nhóm khác → nhóm trước tự đóng. Hover vào mục con disabled → tooltip "Chức năng này chưa được triển khai."
result: pass

### 10. Dashboard KPI cards
expected: Trang Dashboard hiển thị tiêu đề "Tổng quan kho thiết bị" và 5 thẻ KPI: "Tổng thiết bị", "Đang bàn giao", "Trong dự án", "Đang bảo trì", "Giá trị tồn kho" — tất cả đều hiển thị giá trị 0 (hoặc "0 đ" cho thẻ cuối). Dòng ghi chú ở dưới: "Dữ liệu sẽ hiển thị sau khi thiết bị được nhập vào hệ thống."
result: pass

### 11. Logout
expected: Nhấn nút "Đăng xuất" trên header. Kỳ vọng: chuyển về /login. Nếu thử truy cập /dashboard sau đó → bị redirect về /login (session đã xóa).
result: pass

## Summary

total: 11
passed: 11
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
