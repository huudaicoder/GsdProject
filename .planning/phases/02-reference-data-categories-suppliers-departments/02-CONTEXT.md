---
phase: 02
name: Reference Data — Categories + Suppliers + Departments
status: ready-to-plan
created: 2026-04-16
---

# Phase 2 Context: Reference Data

## Phase Goal

Admin có thể quản lý 3 loại dữ liệu tham chiếu (danh mục thiết bị, nhà cung cấp, phòng ban) qua giao diện bảng có tìm kiếm và panel tạo/sửa.

## Requirements Covered

- **EQP-04** — Equipment categories (danh mục thiết bị): tên, mô tả, mã tự sinh
- **SUP-01** — Suppliers (nhà cung cấp): tên, địa chỉ, liên hệ, mã tự sinh
- **EMP-02** — Departments (phòng ban): tên, mã tự sinh

## Success Criteria (from ROADMAP.md)

1. Admin xem danh sách danh mục có phân trang, tìm kiếm được tại `/categories`; thêm/sửa danh mục với tên (bắt buộc) và mô tả (tuỳ chọn)
2. Không thể xóa danh mục đang được sử dụng bởi thiết bị — trả về lỗi tiếng Việt có số lượng
3. Admin xem danh sách nhà cung cấp có phân trang, tìm kiếm được tại `/suppliers`; thêm/sửa với tên (bắt buộc), địa chỉ (tuỳ chọn), liên hệ (tuỳ chọn)
4. Admin xem danh sách phòng ban có phân trang, tìm kiếm được tại `/departments`; thêm/sửa với tên (bắt buộc)
5. Không thể xóa phòng ban đang được sử dụng bởi nhân viên — trả về lỗi tiếng Việt có số lượng

---

## Design Decisions

### Table Layout & Search

**D-01 — Pagination:** PrimeNG `p-table` với phân trang server-side. Row options: 10 / 20 / 50.

**D-02 — Search trigger:** Search button (không real-time). Nhấn nút "Tìm kiếm" → gọi API với query params. Không auto-search khi gõ.

**D-03 — Table columns (cả 3 bảng):**
| Cột | Ghi chú |
|-----|---------|
| Mã | Auto-generated, read-only, hiển thị trong bảng |
| Tên | Text |
| Mô tả | Text (có thể trống với phòng ban) |
| Actions | Nút Sửa + Xóa |

**D-04 — Page layout:** 2 cột trong vùng content:
- **Trái:** Filter panel (ô tìm kiếm + nút "Tìm kiếm") — cố định bên cạnh sidebar
- **Phải:** Data table + nút "Thêm mới" ở góc trên bên phải phía trên table
- Layout này áp dụng cho cả 3 trang `/categories`, `/suppliers`, `/departments`

### Mã (Entity Code)

**D-05 — Auto-generated code:**
- Hệ thống tự đánh mã tuần tự (ví dụ: `DM-001`, `DM-002` cho danh mục; `NCC-001` cho nhà cung cấp; `PB-001` cho phòng ban)
- Bắt buộc (required), unique
- **Không được chỉnh sửa** sau khi tạo — field read-only trong form sửa
- Hiển thị trong bảng như cột đầu tiên
- Prefix gợi ý: `DM-` (danh mục), `NCC-` (nhà cung cấp), `PB-` (phòng ban) — planner quyết định format cụ thể

### Create/Edit Form

**D-06 — Form container:** Slide-over panel từ phải (PrimeNG `p-sidebar` position="right" hoặc custom drawer). Không dùng modal dialog.

**D-07 — Success behavior:** Toast thông báo thành công + đóng panel tự động.

**D-08 — Validation display:** Lỗi inline dưới từng field (không dùng summary box trên đầu form).

**D-09 — Panel width:** 30% viewport.

**D-10 — Form fields per entity:**

*Danh mục thiết bị:*
- Mã (read-only khi sửa, hiển thị để tham chiếu)
- Tên (bắt buộc)
- Mô tả (tuỳ chọn)

*Nhà cung cấp:*
- Mã (read-only khi sửa)
- Tên (bắt buộc)
- Địa chỉ (tuỳ chọn)
- Thông tin liên hệ (tuỳ chọn — email hoặc số điện thoại, planner quyết định 1 field hay 2 field)

*Phòng ban:*
- Mã (read-only khi sửa)
- Tên (bắt buộc)

### Delete Behavior

**D-11 — Delete confirmation:** Hiển thị dialog xác nhận trước khi xóa. Nội dung: "Bạn có chắc muốn xóa [Tên] không?" với 2 nút: Hủy / Xác nhận.

**D-12 — Delete blocked error:** Khi xóa bị chặn (danh mục đang dùng bởi thiết bị / phòng ban đang dùng bởi nhân viên) → hiển thị **dialog lỗi riêng** (không phải toast) với thông báo rõ ràng và nút Đóng. Ví dụ: "Không thể xóa danh mục này — đang được sử dụng bởi 5 thiết bị."

---

## Locked Context from Prior Phases

- **Auth:** ABP Identity + OpenIddict JWT 8h — tất cả API endpoints yêu cầu Bearer token
- **ABP pattern:** `CrudAppService<TEntity, TDto, TKey>` cho CRUD chuẩn; auto-generate HTTP controllers
- **Database:** PostgreSQL / Npgsql — không dùng SQL Server
- **UI stack:** Angular 19 standalone components + PrimeNG 19 (Lara theme) + Signals
- **Validation:** FluentValidation trong `Application.Contracts` layer — trigger tự động qua ABP pipeline

---

## Deferred Ideas

- Import danh mục từ Excel → Phase 6 (Import Flow) nếu cần
- Audit history per category/supplier/department → ABP Audit Logging tự ghi, không cần UI riêng

---

## Implementation Notes for Planner

- 3 entities có cùng pattern → viết 1 plan chung, chia task theo entity (Categories → Suppliers → Departments)
- Backend trước (domain + app service + migration), frontend sau
- Mã auto-generation: dùng database sequence hoặc `MAX(Code) + 1` với prefix — planner chọn approach phù hợp với ABP
- Soft delete không áp dụng cho reference data (hard delete, với FK check trước)
- Nhà cung cấp trong Phase 6 sẽ reference `SupplierId` — cần đảm bảo FK constraint rõ ràng
