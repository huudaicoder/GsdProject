<!-- GSD:project-start source:PROJECT.md -->
## Project

**Hệ thống Quản lý Kho Thiết Bị Công Ty**

Hệ thống web quản lý toàn bộ vòng đời thiết bị của công ty quy mô lớn (>200 nhân viên): từ nhập kho, bàn giao nhân viên hoặc cấp cho dự án, bảo trì định kỳ, đến thanh lý và thu hồi. Được xây dựng bằng ASP.NET Core (backend) và Angular (frontend), dành cho bộ phận quản lý kho vận hành.

**Core Value:** Quản trị viên kho có thể biết ngay thiết bị nào đang ở đâu, ai đang dùng, và trạng thái tài chính liên quan — để không bao giờ mất dấu tài sản công ty.

### Constraints

- **Tech Stack**: ASP.NET Core (backend) + Angular (frontend) — yêu cầu bắt buộc của đội kỹ thuật
- **Người dùng**: Admin only — không cần giao diện self-service cho nhân viên
- **Kho**: 1 kho trung tâm — không cần hỗ trợ multi-warehouse trong v1
- **Nền tảng**: Web App — không cần mobile native
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Backend — Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ASP.NET Core | 9.0 (LTS Nov 2024) | Web API host | Required by team. .NET 9 is current stable; .NET 10 arrives Nov 2025 but not yet LTS |
| Controller-based API | built-in | REST endpoints | 50+ endpoints with shared filters (auth, validation, error handling) — controllers scale better than minimal APIs for this complexity. Minimal APIs shine for microservices, not large CRUD apps. |
| Clean Architecture | pattern | Project structure | Domain / Application / Infrastructure / Presentation layers. Enforces testability and prevents EF Core bleeding into controllers. Industry standard for .NET enterprise in 2025. |
| CQRS + MediatR | MediatR 14.x | Request handling | Separates reads (queries) from writes (commands). Each handler has one job. Pipeline behaviors replace manual cross-cutting concerns. Fits Clean Architecture naturally. Use because the app has 30+ distinct operations with different validation/caching needs. |
| FluentValidation | 12.x | Input validation | `FluentValidation.DependencyInjectionExtensions` for DI. Place validators in Application layer as MediatR pipeline behavior. Cleaner than Data Annotations for complex rules (e.g., "end date after start date", "fine amount positive only for damaged returns"). |
| AutoMapper | 13.x | DTO mapping | Reduces mapping boilerplate between domain entities and DTOs. Acceptable overhead for CRUD-heavy apps. Alternative: Mapster (slightly faster) but AutoMapper has broader documentation and is more familiar to .NET teams. |
### Backend — Data Access
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Entity Framework Core | 9.x | ORM + migrations | Schema migrations alone justify EF Core for greenfield. Compiled queries close the performance gap with Dapper to ~1.5-2x in read scenarios. For this system's scale (thousands of devices, ~200 employees), EF Core performance is entirely sufficient. |
| EF Core Migrations | built-in | Schema versioning | Code-first migrations give a reproducible database history. Critical for team collaboration and deployment pipelines. |
| Dapper (optional) | 2.x | Complex reports | Use Dapper *only* for the reporting queries (dashboard aggregations, multi-join inventory reports). These are read-only, SQL-heavy, and benefit from hand-tuned queries. Do NOT use Dapper for CRUD — EF Core there. |
| EFCore.BulkExtensions | 8.x | Bulk import | When importing large batches of equipment from Excel, avoid N+1 SaveChanges calls. BulkExtensions maps to BULK INSERT. Use for the "warehouse import" feature. |
### Backend — Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SQL Server | 2019+ / 2022 | Primary database | Team is in the .NET / Microsoft ecosystem. SQL Server has the best EF Core support (SQL Server provider is the reference implementation). Always-On availability groups are available if HA is needed later. The licensing cost is real but typical for enterprise .NET shops that already have SQL Server. |
### Backend — Authentication
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ASP.NET Core Identity | built-in | User store, password hashing | Admin-only system. Identity handles password hashing, lockout, and user management without custom code. Do NOT integrate Active Directory (explicitly out of scope per PROJECT.md). |
| JWT Bearer Tokens | Microsoft.AspNetCore.Authentication.JwtBearer 9.x | Stateless auth | Angular SPA needs token-based auth. JWT with short lifetime (15-60 min) + refresh tokens is the 2025 standard. Use HS256 signing for single-service (no multi-service token validation needed). Store JWT secret in environment variables / secrets management. |
| Role-based authorization | built-in | Admin-only access | Simple `[Authorize(Roles = "Admin")]` attribute. System is admin-only but keep the door open to adding a ReadOnly role later without rewrites. |
### Backend — File Handling (Device Photos)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Local filesystem storage | built-in | Store device photos | Single server, single warehouse deployment — no need for Azure Blob or S3 in v1. Store files outside wwwroot in a configurable path (e.g., `/uploads/equipment/{id}/`). Serve via a dedicated `/files/{id}` endpoint with authorization check. |
| ImageSharp (SixLabors.ImageSharp) | 3.x | Resize/compress uploads | Resize uploaded photos to max 1200px on longest side before saving. Prevents multi-MB photos from accumulating. MIT license for non-profit / revenue-under-$1M; commercial license otherwise — verify company revenue threshold. |
### Backend — Excel/PDF Export
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ClosedXML | 0.105.x | Excel export (.xlsx) | MIT license (no commercial concerns), clean API, sufficient for datasets up to ~50K rows (well within scope). `LoadFromCollection()` and styled headers make inventory reports straightforward. Do NOT use EPPlus unless already licensed — commercial use requires paid license and adds friction. |
| QuestPDF | 2025.x (latest) | PDF generation | Modern fluent C# API, no HTML-to-PDF browser dependency (no Puppeteer/wkhtmltopdf), first-class .NET 9 support. Free for organizations under $1M annual revenue (Community license). For larger organizations: professional license required — verify. Generates professional-looking reports programmatically. |
### Backend — Logging and Cross-Cutting
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Serilog | 4.x (Serilog.AspNetCore 8.x) | Structured logging | Structured events (JSON) rather than plain text. Sinks: Console (dev), File (prod). Enrichers: FromLogContext, WithMachineName. MediatR pipeline behavior logs all commands/queries automatically. |
| Serilog.Sinks.File | latest | Log persistence | Rotating daily log files. Sufficient for single-server v1. |
| Swagger / Scalar | via Swashbuckle or Scalar | API documentation | Dev/test tooling. Swashbuckle.AspNetCore is the standard; Scalar is a newer, cleaner alternative. Either works — pick based on team preference. |
### Frontend — Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular | 19.x (current stable) | SPA framework | Required by team. Angular 19 makes standalone components the default. No NgModules needed for new code — simplifies structure. |
| TypeScript | 5.x (bundled) | Language | Built into Angular. Strict mode (`strict: true` in tsconfig) — catches class of bugs early. Non-negotiable for a team maintaining this long-term. |
| Angular CLI | 19.x | Build tooling | Standard Angular build pipeline. Esbuild-based builder (since Angular 17) significantly faster than webpack. |
| Standalone Components | Angular 19 default | Component architecture | No NgModule boilerplate. Lazy-load routes with `loadComponent()` for code splitting. Admin dashboard becomes a lazy-loaded feature. |
### Frontend — State Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Signals | built-in (Angular 16+) | Local + shared state | Admin-only system with straightforward data flows. Equipment list state, selected filters, loading indicators — all manageable with signals. No complex multi-actor state problems that justify NgRx. |
| Injectable Service Stores | pattern | Feature state | `@Injectable({ providedIn: 'root' })` services using signals as state containers. One service per feature domain (EquipmentStore, MaintenanceStore). Clean, no boilerplate, testable. |
### Frontend — UI Component Library
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PrimeNG | 19.x (aligned with Angular 19) | UI components | 90+ components including: DataTable (with sorting, filtering, pagination — critical for equipment lists), FileUpload, Charts (dashboard), Dialog, Dropdown, Calendar, Toast. Built for Angular (not ported). Angular 19 Signal-ready. |
| PrimeIcons | bundled | Icon set | Bundled with PrimeNG. Sufficient for admin UI. |
### Frontend — Forms
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Reactive Forms | built-in | All forms | Equipment CRUD, import/export records, maintenance logs, financial entries — all have complex validation (cross-field rules, conditional required fields). Reactive Forms give programmatic control and are unit-testable. Template-driven forms are unsuitable for this complexity. |
### Frontend — HTTP Communication
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular HttpClient | built-in | API calls | `provideHttpClient(withInterceptorsFromDi())` with standalone setup. HTTP interceptors for JWT token attachment and global error handling. |
| HTTP Interceptors | built-in | Auth + errors | JWT interceptor attaches `Authorization: Bearer {token}` header. Error interceptor handles 401 (redirect to login), 403 (show forbidden), 500 (show toast). Centralizes auth logic — no per-component token handling. |
### Frontend — Routing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Router | built-in | Navigation | `loadComponent()` for lazy loading. Route guards for authentication (`canActivate`). Separate routes for: Dashboard, Equipment, Employees, Projects, Maintenance, Finance, Reports. Each feature lazy-loaded to reduce initial bundle. |
### Frontend — Build + Dev Tooling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular CLI (esbuild) | 19.x | Build | Esbuild-based builder is default since Angular 17 — significantly faster than webpack for dev rebuilds. |
| ESLint + Angular ESLint | 18.x | Linting | `@angular-eslint/eslint-plugin`. Enforce consistent code style. |
| Prettier | 3.x | Formatting | Consistent formatting across team. Configure with `prettier --write` as pre-commit hook. |
## What NOT to Use (and Why)
| Technology | Why Avoid |
|------------|-----------|
| Minimal APIs (only) | Appropriate for microservices and simple endpoints. 50+ endpoints with shared filters, complex routing, and team familiarity with MVC controllers — use controllers. Minimal APIs can be added selectively if needed. |
| NgRx (classic, v1) | Excessive boilerplate for admin-only CRUD. Signal-based service stores are sufficient and far simpler to maintain. Graduate to NgRx Signal Store if complexity demands. |
| EPPlus | Requires commercial license for business use. ClosedXML covers all report needs under MIT license. |
| iTextSharp | Deprecated .NET port of iText. Not maintained for new .NET versions. Use QuestPDF instead. |
| Storing images in the database | Binary data in SQL Server columns causes table bloat, slow queries, and backup size explosion. Always use filesystem/blob storage. |
| Angular Material (for this use case) | 40 components vs PrimeNG's 90+. Material's DataTable needs more custom work to reach production-ready filtering/sorting/pagination. PrimeNG DataTable is ready out of the box. |
| Active Directory / LDAP integration | Explicitly out of scope per PROJECT.md. Independent login system is simpler and meets stated requirements. |
| Multi-tenancy patterns | Single warehouse, single company — any multi-tenancy abstraction is premature. |
| CQRS with separate read/write databases | Event sourcing / read model separation is overkill for this scale. Single database with EF Core + Dapper for complex reads is sufficient. |
## Installation Commands
# .NET — create solution structure
# Backend NuGet packages (API + Infrastructure)
# Angular — scaffold new project
# Angular packages
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ORM | EF Core 9 | Dapper (primary) | Dapper lacks migrations; development speed suffers for greenfield. Use Dapper for reports only. |
| Excel export | ClosedXML | EPPlus | EPPlus requires commercial license. ClosedXML is MIT. |
| PDF generation | QuestPDF | iText 7 | iText 7 has AGPL/commercial license complexity. QuestPDF API is cleaner for report generation. |
| State management | Signals + Services | NgRx | NgRx boilerplate unjustified for admin-only CRUD system. |
| UI library | PrimeNG | Angular Material | Material's data table less capable out-of-the-box for inventory management use case. |
| Database | SQL Server | PostgreSQL | SQL Server preferred for Microsoft ecosystem teams with existing licenses. PostgreSQL is viable alternative if licenses are a concern. |
| Image resize | ImageSharp | System.Drawing | System.Drawing is deprecated on non-Windows and not recommended for server-side image processing. ImageSharp is the official replacement. |
| API style | Controllers | Minimal APIs | Controllers are better for 50+ endpoints with shared behaviors. |
## Confidence Assessment
| Area | Confidence | Basis |
|------|------------|-------|
| .NET 9 + Clean Architecture + CQRS + MediatR | HIGH | Multiple official guides + GitHub examples from 2025 confirm this as the dominant pattern |
| EF Core 9 primary + Dapper for reports | HIGH | 2025 benchmark comparisons confirm EF Core 9's narrowed performance gap; hybrid pattern is well-documented |
| ClosedXML for Excel | HIGH | MIT license, active maintenance (0.105.0 released 2025), .NET Standard 2.0 target covers .NET 9 |
| QuestPDF for PDF | MEDIUM | Strong community adoption in 2025, fluent API is excellent — but verify commercial license vs company revenue |
| PrimeNG for Angular UI | MEDIUM-HIGH | Widely recommended for data-heavy Angular admin UIs; Angular 19 Signal-ready; verify team preference |
| Angular Signals (no NgRx) | HIGH | 2025 Angular community consensus: use signals + services first, graduate to NgRx only for complex state |
| JWT + ASP.NET Core Identity | HIGH | Standard pattern for admin-only SPA; no third-party identity server needed |
| SQL Server | MEDIUM | Pragmatic default for .NET ecosystem; depends on existing license availability — confirm with team |
| Local filesystem for images | MEDIUM | Acceptable for single-server v1; abstract behind interface for future cloud migration |
## Sources
- [ASP.NET Core Minimal APIs vs Controllers — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis)
- [CQRS and Clean Architecture in .NET 9 — Medium (Aug 2025)](https://medium.com/@michaelmaurice410/cqrs-and-clean-architecture-in-net-9-54f6a736f383)
- [Angular State Management for 2025 — Nx Blog](https://nx.dev/blog/angular-state-management-2025)
- [NgRx vs Signal Store: Which One in 2025 — Stackademic](https://blog.stackademic.com/ngrx-vs-signal-store-which-one-should-you-use-in-2025-d7c9c774b09d)
- [EF Core 9 vs Dapper Performance 2025 — Trailhead Technology](https://trailheadtechnology.com/ef-core-9-vs-dapper-performance-face-off/)
- [ORM Showdown 2025: EF Core vs Dapper — DevelopersVoice](https://developersvoice.com/blog/database/orm-showdown-2025/)
- [Top PDF Generation Libraries for C# .NET 2025 — PDFBolt](https://pdfbolt.com/blog/top-csharp-pdf-generation-libraries)
- [QuestPDF License and Pricing](https://www.questpdf.com/license/)
- [ClosedXML NuGet Gallery (0.105.0)](https://www.nuget.org/packages/closedxml/)
- [MediatR NuGet Gallery (14.1.0)](https://www.nuget.org/packages/MediatR)
- [Why PrimeNG is Still Best for Angular 19 in 2025 — Diggibyte](https://diggibyte.com/why-primeng-remains-my-go-to-ui-library-for-angular-19-in-2025/)
- [PrimeNG vs Angular Material for Enterprise — Infragistics](https://www.infragistics.com/blogs/angular-material-vs-primeng)
- [Serilog Logging in ASP.NET Core 2025 — amarozka.dev](https://amarozka.dev/serilog-logging-in-asp-net-core/)
- [ASP.NET Core JWT Authentication Best Practices — BoldSign](https://boldsign.com/blogs/aspnet-core-jwt-authentication-guide/)
- [Angular 19 Standalone Components — Syncfusion Blogs](https://www.syncfusion.com/blogs/post/angular19-standalone-components)
- [Upload Files in ASP.NET Core — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
