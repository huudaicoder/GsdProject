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
### Backend — Core Framework (ABP Framework)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ASP.NET Core | 9.0 (LTS) | Web API host | Required by team. ABP 9.x targets .NET 9. |
| **ABP Framework (Community)** | **9.x** | **Full-stack DDD framework** | Provides: Clean Architecture scaffold (6-layer solution), Identity, Audit Logging, CRUD base services, Permission system, Repository pattern, Unit of Work, Module system. Eliminates ~60% boilerplate for a CRUD-heavy admin app. Free, MIT license, open source. |
| ABP Application Services | built-in | Request handling | Replaces MediatR. `CrudAppService<TEntity, TDto, TKey>` auto-generates CRUD + pagination + sorting. Extend `ApplicationService` for custom business logic. ABP generates HTTP API controllers automatically from app service interfaces. |
| FluentValidation | 12.x | Input validation | ABP integrates via `Volo.Abp.FluentValidation`. Place validators in `Application.Contracts` layer. Triggered automatically by ABP pipeline. |
| AutoMapper (via ABP IObjectMapper) | 13.x | DTO mapping | ABP uses AutoMapper internally via `IObjectMapper`. Configure mappings in Application layer `AutoMapperProfile`. |
| Stateless | 5.x | Equipment state machine | Enforces valid Equipment.Status transitions. ABP does not provide a state machine — `Stateless` library still required in Domain layer. |

**ABP Solution Structure (6 projects):**
```
KhoThietBi.Domain.Shared         ← Enums, error codes, consts (no EF dependency)
KhoThietBi.Domain                ← Entities, domain services, repository interfaces
KhoThietBi.Application.Contracts ← DTOs, app service interfaces, permissions
KhoThietBi.Application           ← CrudAppService implementations
KhoThietBi.EntityFrameworkCore   ← DbContext, EF configurations, migrations
KhoThietBi.HttpApi.Host          ← Program.cs, appsettings (entry point)
```
### Backend — Data Access
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Entity Framework Core | 9.x | ORM + migrations | Schema migrations alone justify EF Core for greenfield. ABP configures EF Core automatically. |
| EF Core Migrations | built-in | Schema versioning | Code-first migrations give a reproducible database history. Critical for team collaboration and deployment pipelines. |
| Dapper (optional) | 2.x | Complex reports | Use Dapper *only* for the reporting queries (dashboard aggregations, multi-join inventory reports). These are read-only, SQL-heavy, and benefit from hand-tuned queries. Do NOT use Dapper for CRUD — EF Core there. |
| EFCore.BulkExtensions | 8.x | Bulk import | When importing large batches of equipment from Excel, avoid N+1 SaveChanges calls. BulkExtensions maps to BULK INSERT. Use for the "warehouse import" feature. |
### Backend — Database
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PostgreSQL** | **14+** | **Primary database** | **Decision D-01 locks PostgreSQL.** No existing SQL Server licenses; PostgreSQL is free, cross-platform, and has excellent EF Core support via Npgsql. Use `Npgsql.EntityFrameworkCore.PostgreSQL` (not SqlServer provider). |
### Backend — Authentication (ABP Identity + OpenIddict)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **ABP Identity Module** | built-in (ABP 9.x) | User store, roles, permissions | Provides full ASP.NET Core Identity integration with ABP's Permission system. Handles password hashing, lockout, user management. Pre-wired — no manual `AddIdentity()` setup needed. |
| **ABP OpenIddict Module** | built-in (ABP 9.x) | Token server (OAuth2/OIDC) | ABP Community uses OpenIddict as the token server. Issues JWT access tokens + refresh tokens. Pre-configured for SPA (Authorization Code + PKCE). Replaces manual `JwtBearer` configuration. |
| ABP Permission System | built-in | Admin-only access | Permissions defined in `Application.Contracts` via `PermissionDefinitionProvider`. `[Authorize(KhoThietBiPermissions.Equipment.Create)]` — granular and extensible. |

**D-08:** JWT lifetime = 8 hours for this admin-only internal tool (configured in appsettings.json under OpenIddict settings).
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
| Serilog | 4.x (Serilog.AspNetCore 8.x) | Structured logging | Structured events (JSON) rather than plain text. Sinks: Console (dev), File (prod). Enrichers: FromLogContext, WithMachineName. ABP pipeline behaviors handle cross-cutting logging automatically. |
| Serilog.Sinks.File | latest | Log persistence | Rotating daily log files. Sufficient for single-server v1. |
| Swagger / Scalar | via Swashbuckle or Scalar | API documentation | Dev/test tooling. ABP includes `Volo.Abp.Swashbuckle` — Swagger pre-configured. |
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
| MediatR | Not needed — ABP Application Services (`CrudAppService`, `ApplicationService`) replace MediatR commands/queries with less boilerplate. Adding MediatR on top of ABP is redundant indirection. |
| Minimal APIs | ABP generates HTTP API controllers automatically from `IApplicationService` interfaces — no manual controller code needed. |
| NgRx (classic, v1) | Excessive boilerplate for admin-only CRUD. Signal-based service stores are sufficient and far simpler to maintain. Graduate to NgRx Signal Store if complexity demands. |
| EPPlus | Requires commercial license for business use. ClosedXML covers all report needs under MIT license. |
| iTextSharp | Deprecated .NET port of iText. Not maintained for new .NET versions. Use QuestPDF instead. |
| Storing images in the database | Binary data in DB columns causes table bloat, slow queries, and backup size explosion. Always use filesystem/blob storage. |
| Angular Material (for this use case) | 40 components vs PrimeNG's 90+. Material's DataTable needs more custom work to reach production-ready filtering/sorting/pagination. PrimeNG DataTable is ready out of the box. |
| Active Directory / LDAP integration | Explicitly out of scope per PROJECT.md. Independent login system is simpler and meets stated requirements. |
| Multi-tenancy patterns | Single warehouse, single company — any multi-tenancy abstraction is premature. |
| CQRS with separate read/write databases | Event sourcing / read model separation is overkill for this scale. Single database with EF Core + Dapper for complex reads is sufficient. |
## Installation Commands
```bash
# Prerequisites
dotnet tool install -g Volo.Abp.Cli  # ABP CLI

# Scaffold ABP solution (no UI — Angular is separate)
abp new KhoThietBi -t app --ui none --database-provider ef -dbms PostgreSQL

# Additional NuGet packages
dotnet add package Stateless --version 5.*
dotnet add package Dapper --version 2.*
dotnet add package ClosedXML --version 0.105.*
dotnet add package QuestPDF --version 2025.*
dotnet add package SixLabors.ImageSharp --version 3.*
dotnet add package Serilog.AspNetCore --version 8.*
dotnet add package Serilog.Sinks.File

# Note: ABP template already includes:
# Volo.Abp.EntityFrameworkCore.PostgreSQL, Volo.Abp.Identity,
# Volo.Abp.OpenIddict, Volo.Abp.FluentValidation, Volo.Abp.AutoMapper,
# Volo.Abp.Swashbuckle, Volo.Abp.AuditLogging

# Angular — scaffold new project
npx @angular/cli@19 new kho-thiet-bi-ui --standalone --routing --style=scss --strict

# Angular packages
npm install primeng@19 primeicons
npm install @angular-eslint/eslint-plugin --save-dev
npm install prettier --save-dev
```
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Backend framework | ABP Framework Community 9.x | Manual Clean Architecture + MediatR | ABP provides scaffold, Identity, Audit Logging, and CRUD base services out of the box. Manual setup is ~60% more boilerplate for the same features. |
| Request handling | ABP Application Services | MediatR | MediatR adds indirection on top of ABP. CrudAppService covers 80% of CRUD cases; ApplicationService covers the rest. |
| ORM | EF Core 9 (via ABP) | Dapper (primary) | Dapper lacks migrations; development speed suffers for greenfield. Use Dapper for complex reporting queries only. |
| Excel export | ClosedXML | EPPlus | EPPlus requires commercial license. ClosedXML is MIT. |
| PDF generation | QuestPDF | iText 7 | iText 7 has AGPL/commercial license complexity. QuestPDF API is cleaner for report generation. |
| State management | Signals + Services | NgRx | NgRx boilerplate unjustified for admin-only CRUD system. |
| UI library | PrimeNG | Angular Material | Material's data table less capable out-of-the-box for inventory management use case. |
| Database | PostgreSQL | SQL Server | D-01 decision locks PostgreSQL. No existing SQL Server licenses; PostgreSQL is free, cross-platform, and has excellent EF Core support via Npgsql. |
| Image resize | ImageSharp | System.Drawing | System.Drawing is deprecated on non-Windows and not recommended for server-side image processing. ImageSharp is the official replacement. |
| API style | ABP auto-generated controllers | Manual controllers / Minimal APIs | ABP generates HTTP API controllers automatically from IApplicationService interfaces — no manual wiring. |
## Confidence Assessment
| Area | Confidence | Basis |
|------|------------|-------|
| ABP Framework Community 9.x | HIGH | Mature framework (10+ years), 13k+ GitHub stars, active 2025 maintenance, .NET 9 support confirmed |
| ABP Application Services replacing MediatR | HIGH | CrudAppService is the ABP-native CRUD pattern; well-documented, widely used in ABP projects |
| ABP Identity + OpenIddict for auth | HIGH | Pre-wired in ABP Community template; OpenIddict is the ABP-recommended token server since ABP 7.x |
| EF Core 9 primary + Dapper for reports | HIGH | 2025 benchmark comparisons confirm EF Core 9's narrowed performance gap; hybrid pattern is well-documented |
| PostgreSQL + Npgsql | HIGH | D-01 decision locked; Npgsql is mature, EF Core 9 support is first-class |
| ClosedXML for Excel | HIGH | MIT license, active maintenance (0.105.0 released 2025), .NET Standard 2.0 target covers .NET 9 |
| QuestPDF for PDF | MEDIUM | Strong community adoption in 2025, fluent API is excellent — but verify commercial license vs company revenue |
| PrimeNG for Angular UI | MEDIUM-HIGH | Widely recommended for data-heavy Angular admin UIs; Angular 19 Signal-ready; verify team preference |
| Angular Signals (no NgRx) | HIGH | 2025 Angular community consensus: use signals + services first, graduate to NgRx only for complex state |
| Local filesystem for images | MEDIUM | Acceptable for single-server v1; abstract behind IFileStorageService for future cloud migration |
## Sources
- [ABP Framework Documentation — abp.io](https://abp.io/docs)
- [ABP Community Edition — abp.io/get-started](https://abp.io/get-started)
- [ABP Application Services — abp.io](https://abp.io/docs/latest/framework/architecture/domain-driven-design/application-services)
- [ABP OpenIddict Integration — abp.io](https://abp.io/docs/latest/framework/infrastructure/openiddict)
- [ABP Audit Logging — abp.io](https://abp.io/docs/latest/framework/infrastructure/audit-logging)
- [Angular State Management for 2025 — Nx Blog](https://nx.dev/blog/angular-state-management-2025)
- [EF Core 9 vs Dapper Performance 2025 — Trailhead Technology](https://trailheadtechnology.com/ef-core-9-vs-dapper-performance-face-off/)
- [Top PDF Generation Libraries for C# .NET 2025 — PDFBolt](https://pdfbolt.com/blog/top-csharp-pdf-generation-libraries)
- [QuestPDF License and Pricing](https://www.questpdf.com/license/)
- [ClosedXML NuGet Gallery (0.105.0)](https://www.nuget.org/packages/closedxml/)
- [Why PrimeNG is Still Best for Angular 19 in 2025 — Diggibyte](https://diggibyte.com/why-primeng-remains-my-go-to-ui-library-for-angular-19-in-2025/)
- [PrimeNG vs Angular Material for Enterprise — Infragistics](https://www.infragistics.com/blogs/angular-material-vs-primeng)
- [Serilog Logging in ASP.NET Core 2025 — amarozka.dev](https://amarozka.dev/serilog-logging-in-asp-net-core/)
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
