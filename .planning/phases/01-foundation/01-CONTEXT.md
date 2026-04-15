# Phase 1: Admin Login + JWT + Audit - Context

**Gathered:** 2026-04-14
**Updated:** 2026-04-15 (ABP Framework + 19-phase restructure)
**Status:** Ready for planning

<domain>
## Phase Boundary

Xây dựng nền tảng kỹ thuật của hệ thống và chức năng đăng nhập: ABP solution scaffold (6 projects), PostgreSQL + EF Core setup, ABP Identity + OpenIddict authentication, Angular 19 + PrimeNG scaffold, login page, AuthService, AuthGuard, JWT interceptor, và app shell (sidebar + header).

Phase này KHÔNG bao gồm: audit trail (Phase 2), Categories/Suppliers/Departments CRUD (Phases 3-5), Equipment CRUD (Phase 6), hay bất kỳ transaction flow nào.

**Requirements trong scope:** AUTH-01, AUTH-02, AUTH-03

</domain>

<decisions>
## Implementation Decisions

### Database
- **D-01:** PostgreSQL — miễn phí, EF Core hỗ trợ đầy đủ, hiệu suất tốt, phổ biến trong .NET 2025
- **D-02:** Dùng Npgsql EF Core provider

### .NET Solution Structure (ABP Framework)
- **D-03:** ABP solution scaffold: `abp new KhoThietBi -t app --ui none --database-provider ef -dbms PostgreSQL`
  - `KhoThietBi.Domain.Shared` — Enums, error codes, consts (no EF dependency)
  - `KhoThietBi.Domain` — Entities, domain services, repository interfaces
  - `KhoThietBi.Application.Contracts` — DTOs, app service interfaces, permissions
  - `KhoThietBi.Application` — `CrudAppService` / `ApplicationService` implementations
  - `KhoThietBi.EntityFrameworkCore` — DbContext, EF configurations, migrations
  - `KhoThietBi.HttpApi.Host` — Program.cs, appsettings (entry point)
- **D-04:** Application layer tổ chức theo **feature-based folders** trong ABP pattern:
  - `Auth/` — Login app service (extends `ApplicationService`)
  - `Categories/` — `CategoryAppService : CrudAppService<...>` (Phase 3)
  - `Suppliers/` — `SupplierAppService : CrudAppService<...>` (Phase 4)
  - `Departments/` — `DepartmentAppService : CrudAppService<...>` (Phase 5)
  - ABP auto-generates HTTP API controllers from `IApplicationService` interfaces — no manual controllers
- **D-05:** Dùng **ABP Application Services** (không dùng MediatR) — `CrudAppService<TEntity, TDto, TKey>` tự generate CRUD + pagination + sorting; custom logic extend `ApplicationService`
- **D-06:** EF Core 9 với migrations, `KhoThietBiDbContext` trong `EntityFrameworkCore` project (ABP configures automatically)

### Authentication & Security
- **D-07:** Auth dùng **ABP Identity Module + ABP OpenIddict** — pre-wired trong ABP template, không cần manual `AddIdentity()` hay `AddJwtBearer()`. OpenIddict issue JWT access tokens cho Angular SPA.
- **D-08:** JWT lifetime = **8 giờ** (admin-only internal tool, không cần refresh token complexity trong v1). Configure trong `appsettings.json` → OpenIddict settings.
- **D-09:** Token persist qua browser refresh — Angular `AuthService` đọc token từ `localStorage` khi khởi động app, kiểm tra expiry
- **D-10:** Error message đăng nhập **cụ thể**: phân biệt "Tên đăng nhập không tồn tại" vs "Mật khẩu không đúng"
- **D-11:** Audit trail implement ngay trong **Phase 1** cùng với scaffold. Dùng **ABP Audit Logging Module** — tự động ghi mọi app service call (không cần manual interceptor). Cấu hình `options.EntityHistorySelectors.AddAllEntities()` để track old/new values cho tất cả entities.

### Login Page UX
- **D-12:** **Split layout** — bên trái: Logo + tên hệ thống "Quản lý Kho Thiết Bị"; bên phải: form đăng nhập
- **D-13:** Sau đăng nhập thành công → redirect về `/dashboard` (placeholder dashboard trong Phase 1, nội dung thực ở Phase 6)

### App Layout & Navigation
- **D-14:** **Sidebar trái + content area** — layout chuẩn cho admin app
- **D-15:** **Full menu** từ Phase 1 (hiển thị tất cả nav items của 19 phase, items chưa xây dựng thì disabled/greyed out)
- **D-16:** Header: tên trang hiện tại (breadcrumb) + tên admin đang đăng nhập + nút Logout
- **D-17:** Angular route guard (`AuthGuard`) bảo vệ tất cả routes — redirect về `/login` nếu chưa xác thực

### Reference Data UI (Category, Supplier, Department)
- **D-18:** Hiển thị dạng **bảng (Table)** có phân trang server-side
- **D-19:** Thêm / Sửa qua **Modal Dialog** (không navigate ra trang khác)
- **D-20:** Mỗi module có **trang riêng**: `/categories`, `/suppliers`, `/departments` (nằm riêng trên sidebar, KHÔNG gộp vào Settings)
- **D-21:** Có **ô tìm kiếm** lọc theo tên
- **D-22:** Khi xóa Category/Department đang được liên kết với thiết bị/nhân viên → **khóa xóa**: trả về lỗi "Không thể xóa — đang được sử dụng bởi X bản ghi"
- **D-23:** Supplier có thể xóa nếu chưa có phiếu nhập (Phase 3 sẽ enforce quy tắc này)

### Audit Logging
- **D-28:** `AddAllEntities()` — track change history cho tất cả entities (old/new values JSON). Không chọn lọc entity cụ thể.
- **D-29:** Giữ audit log **mãi mãi** — không cài retention policy. Admin-only system, data volume nhỏ, giá trị compliance dài hạn.
- **D-30:** Không cần UI xem audit log trong v1 — admin query trực tiếp database nếu cần.

### Sidebar Navigation
- **D-31:** Sidebar dùng **collapsible groups** (không phải flat list hay group headers tĩnh).
- **D-32:** Cấu trúc 5 groups theo chức năng:
  - **Dashboard** (standalone, không collapse)
  - **Danh mục**: Categories / Suppliers / Departments / Equipment / Employees / Projects
  - **Nhập xuất kho**: Import / Payments / Assignment / Allocation
  - **Quản lý**: Maintenance / Liquidation
  - **Thống kê**: Financial / Reports / Export
- **D-33:** Tất cả groups **đóng mặc định** khi vào app. State KHÔNG được lưu vào localStorage — reset mỗi phiên.
- **D-34:** Group chứa trang hiện tại tự động mở (active group expansion).

### Session & UX
- **D-35:** Khi JWT hết hạn (401 response), Angular interceptor hiển thị **PrimeNG Toast góc trên phải**: "Phiên đăng nhập đã hết hạn, đang chuyển hướng..." — sau 3 giây redirect về `/login` và xóa token.
- **D-36:** Dashboard Phase 1 là placeholder: hiển thị **KPI cards layout với data = 0** (Total: 0, Assigned: 0, In Project: 0, Maintenance: 0, Value: 0đ). Không gọi API — static display. Phase 15 sẽ thay thế bằng data thật.

### Kiến trúc bổ sung (từ STATE.md)
- **D-24:** Soft delete cho Equipment (Phase 2+) — historical transactions phải reference được equipment rows
- **D-25:** Separate Request/Response DTOs — không expose domain entities trực tiếp ra API
- **D-26:** Service layer owns tất cả status transitions (không từ Controller)
- **D-27:** Server-side pagination từ Phase 1 — mọi list endpoint đều có `page`, `pageSize` params

### Claude's Discretion
- Angular UI component library: PrimeNG hoặc Angular Material (Claude chọn khi plan — STACK.md recommend PrimeNG)
- Exact spacing, typography, color scheme
- Loading skeleton / spinner design
- Error state handling patterns
- Exact JWT expiry duration (recommend 8 giờ cho admin tool)
- Refresh token strategy (có hay không — Claude quyết định dựa trên research)

</decisions>

<specifics>
## Specific Ideas

- Login page split layout giống style admin tools phổ biến — bên trái branding, bên phải form gọn
- Error message đăng nhập cụ thể (khác với best practice "chung chung") — user muốn như vậy để dễ debug
- Sidebar full menu từ đầu — admin có thể thấy toàn bộ structure ngay từ Phase 1, disabled items không gây nhầm lẫn

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context & requirements
- `.planning/PROJECT.md` — Vision, constraints, tech stack, key decisions
- `.planning/REQUIREMENTS.md` — AUTH-01..03, EQP-04, SUP-01, EMP-02 definitions

### Architecture & stack
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data models, build order, API layout, Angular folder structure
- `.planning/research/STACK.md` — Recommended libraries với versions: ABP Framework 9.x, EF Core 9, PostgreSQL/Npgsql, Stateless 5, ClosedXML, QuestPDF, Angular 19 Signals, PrimeNG
- `.planning/research/PITFALLS.md` — Critical pitfalls: state machine setup, audit interceptor pattern, EF Core soft delete trap, server-side pagination

### Research summary
- `.planning/research/SUMMARY.md` — Tổng hợp key findings

No external specs or ADRs exist — this is a greenfield project. All requirements are captured in REQUIREMENTS.md and decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the patterns that all subsequent phases follow

### Integration Points
- Phase 1 output (DB schema, EF Core entities, JWT auth, Angular scaffold) is the foundation that ALL subsequent phases build on
- Reference data (Category, Department, Supplier) entities are FK targets for Equipment (Phase 2), Employee (Phase 2), and Import receipts (Phase 3)

</code_context>

<deferred>
## Deferred Ideas

- Color scheme / branding — không thảo luận, để Claude chọn style phù hợp cho admin app
- Refresh token strategy — deferred to v2; D-08 locks 8-hour JWT lifetime for v1

</deferred>

---

*Phase: 01-admin-login-jwt-audit*
*Context gathered: 2026-04-14*
*Updated: 2026-04-15 — ABP Framework + 17-phase restructure + D-28 through D-36 (audit scope, sidebar groups, session expiry, dashboard placeholder)*
