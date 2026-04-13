# Hệ thống Quản lý Kho Thiết Bị Công Ty

## What This Is

Hệ thống web quản lý toàn bộ vòng đời thiết bị của công ty quy mô lớn (>200 nhân viên): từ nhập kho, bàn giao nhân viên hoặc cấp cho dự án, bảo trì định kỳ, đến thanh lý và thu hồi. Được xây dựng bằng ASP.NET Core (backend) và Angular (frontend), dành cho bộ phận quản lý kho vận hành.

## Core Value

Quản trị viên kho có thể biết ngay thiết bị nào đang ở đâu, ai đang dùng, và trạng thái tài chính liên quan — để không bao giờ mất dấu tài sản công ty.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Quản lý Danh mục Thiết bị**
- [ ] Quản trị viên có thể thêm/sửa/xóa thiết bị với thông tin đầy đủ (tên, loại, serial, năm mua, giá, ảnh)
- [ ] Thiết bị được phân loại theo danh mục (IT, văn phòng, công nghiệp, v.v.)
- [ ] Mỗi thiết bị có trạng thái rõ ràng: Trong kho / Đang bàn giao / Đang dùng trong dự án / Bảo trì / Đã thanh lý

**Nhập Kho**
- [ ] Quản trị viên có thể tạo phiếu nhập kho từ nhà cung cấp (số lượng, giá, ngày nhập, hóa đơn)
- [ ] Ghi nhận chi phí thanh toán nhà cung cấp khi nhập kho

**Xuất Kho — Bàn giao Nhân viên**
- [ ] Quản trị viên có thể bàn giao thiết bị cho nhân viên văn phòng sử dụng cá nhân
- [ ] Nhân viên có thể hoàn trả thiết bị khi nghỉ việc hoặc không còn nhu cầu
- [ ] Thu tiền phạt khi nhân viên làm hỏng thiết bị (ghi nhận và lưu vết)

**Xuất Kho — Cấp cho Dự án**
- [ ] Quản trị viên có thể cấp thiết bị cho dự án công ty (lắp ráp, triển khai)
- [ ] Thiết bị có thể được đổi trả từ dự án về kho sau khi hoàn thành

**Quản lý Bảo trì**
- [ ] Ghi nhận sự cố hỏng hóc và lịch sửa chữa cho từng thiết bị
- [ ] Lên lịch bảo trì định kỳ và nhắc nhở khi đến hạn

**Tài chính**
- [ ] Theo dõi chi phí mua thiết bị (theo nhà cung cấp, theo thời gian)
- [ ] Ghi nhận thu tiền khi thanh lý thiết bị
- [ ] Ghi nhận thu tiền phạt khi nhân viên làm hỏng thiết bị

**Dashboard & Báo cáo**
- [ ] Dashboard tổng quan: số thiết bị, giá trị kho, thiết bị đang bàn giao, thiết bị bảo trì
- [ ] Báo cáo tồn kho hiện tại theo danh mục
- [ ] Báo cáo lịch sử xuất/nhập theo ngày/tháng
- [ ] Báo cáo thiết bị theo phòng ban / nhân viên
- [ ] Báo cáo bảo trì và hỏng hóc
- [ ] Xuất báo cáo ra file Excel và PDF

**Hệ thống**
- [ ] Đăng nhập xác thực cho tài khoản Admin
- [ ] Upload và xem ảnh thiết bị

### Out of Scope

- Ứng dụng mobile — người dùng chỉ là quản lý kho, dùng desktop/web
- Phân quyền nhiều cấp (nhân viên tự đăng nhập, tự yêu cầu thiết bị) — quy trình do Admin thao tác
- Tích hợp Active Directory — đăng nhập độc lập, không phụ thuộc hệ thống IT
- Mã vạch / QR Code — có thể bổ sung sau khi core hoạt động ổn định
- Đa ngôn ngữ — hệ thống tiếng Việt là chính

## Context

- Công ty quy mô lớn >200 nhân viên, quản lý hàng nghìn thiết bị đa loại
- Người dùng hệ thống: chỉ bộ phận quản lý kho (Admin)
- 1 kho trung tâm duy nhất
- Thiết bị xuất kho theo 2 luồng: bàn giao nhân viên cá nhân & cấp cho dự án công ty
- Yêu cầu theo dõi tài chính đầy đủ: chi phí nhập, thu thanh lý, thu phạt hỏng
- Công nghệ bắt buộc: ASP.NET Core + Angular (Web App)

## Constraints

- **Tech Stack**: ASP.NET Core (backend) + Angular (frontend) — yêu cầu bắt buộc của đội kỹ thuật
- **Người dùng**: Admin only — không cần giao diện self-service cho nhân viên
- **Kho**: 1 kho trung tâm — không cần hỗ trợ multi-warehouse trong v1
- **Nền tảng**: Web App — không cần mobile native

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| ASP.NET Core + Angular | Yêu cầu công nghệ của team | — Pending |
| Admin-only access | Quy trình do quản lý kho thao tác, nhân viên không tự phục vụ | — Pending |
| 1 kho trung tâm | Đơn giản hóa v1, có thể mở rộng sau | — Pending |
| 2 luồng xuất kho riêng biệt | Bàn giao nhân viên vs cấp dự án có quy trình và báo cáo khác nhau | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-13 after initialization*
