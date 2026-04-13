# Phase 1: Foundation - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Xây dựng nền tảng hoàn chỉnh của hệ thống: project scaffold (ASP.NET Core + Angular), Clean Architecture layers, database schema với EF Core, JWT authentication với audit trail, và CRUD cho reference data (Category, Supplier, Department). Phase này KHÔNG bao gồm Equipment CRUD, Employee, Project, hay bất kỳ transaction flow nào — những thứ đó ở Phase 2+.

**Requirements trong scope:** AUTH-01, AUTH-02, AUTH-03, EQP-04, SUP-01, EMP-02

</domain>

<decisions>
## Implementation Decisions

### Database
- **D-01:** PostgreSQL — miễn phí, EF Core hỗ trợ đầy đủ, hiệu suất tốt, phổ biến trong .NET 2025
- **D-02:** Dùng Npgsql EF Core provider

### .NET Solution Structure (Clean Architecture)
- **D-03:** Project names theo Standard naming với prefix:
  - `KhoThietBi.Domain` — Entities, value objects, domain events
  - `KhoThietBi.Application` — Use cases, CQRS handlers, interfaces, DTOs
  - `KhoThietBi.Infrastructure` — EF Core, repositories, file storage, services
  - `KhoThietBi.API` — Controllers, middleware, DI composition root
- **D-04:** Application layer tổ chức theo **feature-based folders**:
  - `Features/Auth/` — Login command, JWT service interfaces
  - `Features/Equipment/` (Phase 2+)
  - `Features/Categories/` — Category CRUD commands/queries
  - `Features/Suppliers/` — Supplier CRUD commands/queries
  - `Features/Departments/` — Department CRUD commands/queries
- **D-05:** Dùng MediatR cho CQRS pipeline (commands/queries/handlers)
- **D-06:** EF Core 9 với migrations, DbContext trong Infrastructure layer

### Authentication & Security
- **D-07:** JWT Bearer authentication, stateless
- **D-08:** Token lưu trong **localStorage** (admin-only app, XSS risk chấp nhận được khi input được kiểm soát)
- **D-09:** Token persist qua browser refresh — Angular đọc từ localStorage khi khởi động
- **D-10:** Error message đăng nhập **cụ thể**: phân biệt "username không tồn tại" vs "password sai"
- **D-11:** Audit trail dùng **EF Core SaveChangesInterceptor** — tự động capture mọi write operation (không manual trong controllers)
  - Ghi: userId, action type, entity type, entity ID, timestamp, old values, new values (JSON)

### Login Page UX
- **D-12:** **Split layout** — bên trái: Logo + tên hệ thống "Quản lý Kho Thiết Bị"; bên phải: form đăng nhập
- **D-13:** Sau đăng nhập thành công → redirect về `/dashboard` (placeholder dashboard trong Phase 1, nội dung thực ở Phase 6)

### App Layout & Navigation
- **D-14:** **Sidebar trái + content area** — layout chuẩn cho admin app
- **D-15:** **Full menu** từ Phase 1 (hiển thị tất cả nav items của 6 phase, items chưa xây dựng thì disabled/greyed out)
- **D-16:** Header: tên trang hiện tại (breadcrumb) + tên admin đang đăng nhập + nút Logout
- **D-17:** Angular route guard (`AuthGuard`) bảo vệ tất cả routes — redirect về `/login` nếu chưa xác thực

### Reference Data UI (Category, Supplier, Department)
- **D-18:** Hiển thị dạng **bảng (Table)** có phân trang server-side
- **D-19:** Thêm / Sửa qua **Modal Dialog** (không navigate ra trang khác)
- **D-20:** Mỗi module có **trang riêng**: `/categories`, `/suppliers`, `/departments` (nằm riêng trên sidebar, KHÔNG gộp vào Settings)
- **D-21:** Có **ô tìm kiếm** lọc theo tên
- **D-22:** Khi xóa Category/Department đang được liên kết với thiết bị/nhân viên → **khóa xóa**: trả về lỗi "Không thể xóa — đang được sử dụng bởi X bản ghi"
- **D-23:** Supplier có thể xóa nếu chưa có phiếu nhập (Phase 3 sẽ enforce quy tắc này)

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
- `.planning/research/STACK.md` — Recommended libraries với versions: MediatR 14, EF Core 9, ClosedXML, QuestPDF, Angular 19 Signals, PrimeNG
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

- Angular UI framework choice trả lời (PrimeNG vs Angular Material) — để Claude quyết định khi plan dựa trên STACK.md research
- Refresh token mechanism — để Claude research và quyết định khi plan Phase 1
- Color scheme / branding — không thảo luận, để Claude chọn style phù hợp cho admin app

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-14*
