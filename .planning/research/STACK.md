# Technology Stack

**Project:** Company Equipment/Asset Management System (Quan ly Kho Thiet Bi)
**Researched:** 2026-04-13
**Confidence:** MEDIUM-HIGH overall

---

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
| Stateless | 5.x | Equipment state machine | Enforces valid Equipment.Status transitions (InStock → Assigned → InStock etc.). The `Stateless` library is the .NET standard for lightweight, declarative state machines. Prevents illegal transitions at the service layer — see PITFALLS.md Pitfall 1 for why this is mandatory. |

**Confidence:** HIGH — Clean Architecture + CQRS + MediatR is the dominant pattern for .NET enterprise projects in 2025, confirmed by multiple official guides and community consensus.

---

### Backend — Data Access

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Entity Framework Core | 9.x | ORM + migrations | Schema migrations alone justify EF Core for greenfield. Compiled queries close the performance gap with Dapper to ~1.5-2x in read scenarios. For this system's scale (thousands of devices, ~200 employees), EF Core performance is entirely sufficient. |
| EF Core Migrations | built-in | Schema versioning | Code-first migrations give a reproducible database history. Critical for team collaboration and deployment pipelines. |
| Dapper (optional) | 2.x | Complex reports | Use Dapper *only* for the reporting queries (dashboard aggregations, multi-join inventory reports). These are read-only, SQL-heavy, and benefit from hand-tuned queries. Do NOT use Dapper for CRUD — EF Core there. |
| EFCore.BulkExtensions | 8.x | Bulk import | When importing large batches of equipment from Excel, avoid N+1 SaveChanges calls. BulkExtensions maps to BULK INSERT. Use for the "warehouse import" feature. |

**Confidence:** HIGH — EF Core 9 for CRUD + Dapper for reporting is the established hybrid pattern. Confirmed across multiple 2025 benchmark comparisons.

---

### Backend — Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SQL Server | 2019+ / 2022 | Primary database | Team is in the .NET / Microsoft ecosystem. SQL Server has the best EF Core support (SQL Server provider is the reference implementation). Always-On availability groups are available if HA is needed later. The licensing cost is real but typical for enterprise .NET shops that already have SQL Server. |

**Alternative considered:** PostgreSQL (Npgsql EF Core provider is excellent, free, cross-platform). Choose PostgreSQL instead if: (a) the company doesn't already have SQL Server licenses, or (b) the team plans to deploy on Linux. The migration path is straightforward. For v1, default to SQL Server to match Microsoft ecosystem expectations.

**⚠ Project Decision D-01 locks PostgreSQL** — CONTEXT.md Phase 1 explicitly chose PostgreSQL over SQL Server. Use `Npgsql.EntityFrameworkCore.PostgreSQL` (not SqlServer provider) throughout the project.

**Confidence:** MEDIUM — SQL Server is the pragmatic default for .NET enterprise shops, but the decision depends on existing infrastructure. Verify with team whether SQL Server is already licensed.

---

### Backend — Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ASP.NET Core Identity | built-in | User store, password hashing | Admin-only system. Identity handles password hashing, lockout, and user management without custom code. Do NOT integrate Active Directory (explicitly out of scope per PROJECT.md). |
| JWT Bearer Tokens | Microsoft.AspNetCore.Authentication.JwtBearer 9.x | Stateless auth | Angular SPA needs token-based auth. JWT with short lifetime (15-60 min) + refresh tokens is the 2025 standard. Use HS256 signing for single-service (no multi-service token validation needed). Store JWT secret in environment variables / secrets management. |
| Role-based authorization | built-in | Admin-only access | Simple `[Authorize(Roles = "Admin")]` attribute. System is admin-only but keep the door open to adding a ReadOnly role later without rewrites. |

**Confidence:** HIGH — JWT + ASP.NET Core Identity is the canonical approach for admin-only SPAs. No third-party identity provider needed at this scale.

---

### Backend — File Handling (Device Photos)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Local filesystem storage | built-in | Store device photos | Single server, single warehouse deployment — no need for Azure Blob or S3 in v1. Store files outside wwwroot in a configurable path (e.g., `/uploads/equipment/{id}/`). Serve via a dedicated `/files/{id}` endpoint with authorization check. |
| ImageSharp (SixLabors.ImageSharp) | 3.x | Resize/compress uploads | Resize uploaded photos to max 1200px on longest side before saving. Prevents multi-MB photos from accumulating. MIT license for non-profit / revenue-under-$1M; commercial license otherwise — verify company revenue threshold. |

**Storage abstraction note:** Wrap file storage behind an `IFileStorageService` interface from day one. When/if cloud deployment is needed, swap the implementation to Azure Blob without touching any domain code.

**Confidence:** MEDIUM — Local storage is fine for single-server v1. The abstraction recommendation is defensive but low-cost insurance.

---

### Backend — Excel/PDF Export

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ClosedXML | 0.105.x | Excel export (.xlsx) | MIT license (no commercial concerns), clean API, sufficient for datasets up to ~50K rows (well within scope). `LoadFromCollection()` and styled headers make inventory reports straightforward. Do NOT use EPPlus unless already licensed — commercial use requires paid license and adds friction. |
| QuestPDF | 2025.x (latest) | PDF generation | Modern fluent C# API, no HTML-to-PDF browser dependency (no Puppeteer/wkhtmltopdf), first-class .NET 9 support. Free for organizations under $1M annual revenue (Community license). For larger organizations: professional license required — verify. Generates professional-looking reports programmatically. |

**Why not iTextSharp:** Deprecated .NET port. Use iText 7 only if you need complex PDF manipulation (signatures, forms) — QuestPDF is simpler for report generation.

**Why not NPOI:** More complex API than ClosedXML, designed for xls (Excel 97 format) compatibility. ClosedXML's API is cleaner for new .xlsx generation.

**Confidence:** HIGH for ClosedXML (MIT, widely used). MEDIUM for QuestPDF (modern but check commercial license against company revenue).

---

### Backend — Logging and Cross-Cutting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Serilog | 4.x (Serilog.AspNetCore 8.x) | Structured logging | Structured events (JSON) rather than plain text. Sinks: Console (dev), File (prod). Enrichers: FromLogContext, WithMachineName. MediatR pipeline behavior logs all commands/queries automatically. |
| Serilog.Sinks.File | latest | Log persistence | Rotating daily log files. Sufficient for single-server v1. |
| Swagger / Scalar | via Swashbuckle or Scalar | API documentation | Dev/test tooling. Swashbuckle.AspNetCore is the standard; Scalar is a newer, cleaner alternative. Either works — pick based on team preference. |

**Confidence:** HIGH — Serilog is the de-facto standard for structured logging in .NET.

---

### Frontend — Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular | 19.x (current stable) | SPA framework | Required by team. Angular 19 makes standalone components the default. No NgModules needed for new code — simplifies structure. |
| TypeScript | 5.x (bundled) | Language | Built into Angular. Strict mode (`strict: true` in tsconfig) — catches class of bugs early. Non-negotiable for a team maintaining this long-term. |
| Angular CLI | 19.x | Build tooling | Standard Angular build pipeline. Esbuild-based builder (since Angular 17) significantly faster than webpack. |
| Standalone Components | Angular 19 default | Component architecture | No NgModule boilerplate. Lazy-load routes with `loadComponent()` for code splitting. Admin dashboard becomes a lazy-loaded feature. |

**Confidence:** HIGH — Angular 19 standalone is the current recommended approach per Angular team.

---

### Frontend — State Management

**Recommendation: Angular Signals + Service Stores (no NgRx for v1)**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Signals | built-in (Angular 16+) | Local + shared state | Admin-only system with straightforward data flows. Equipment list state, selected filters, loading indicators — all manageable with signals. No complex multi-actor state problems that justify NgRx. |
| Injectable Service Stores | pattern | Feature state | `@Injectable({ providedIn: 'root' })` services using signals as state containers. One service per feature domain (EquipmentStore, MaintenanceStore). Clean, no boilerplate, testable. |

**When to add NgRx:** If the team later adds real-time notifications (SignalR), optimistic updates across multiple unrelated components, or the app grows to 80+ screens. NgRx Signal Store is the modern NgRx API if you eventually graduate to it — avoids the old boilerplate.

**Why not plain NgRx (classic):** Significant boilerplate for an admin-only CRUD app. The complexity is not justified by the feature set. Multiple 2025 sources confirm the tiered approach: Signals first, NgRx only when complexity demands.

**Confidence:** HIGH — Tiered state management is the 2025 consensus for Angular apps of this complexity.

---

### Frontend — UI Component Library

**Recommendation: PrimeNG**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PrimeNG | 19.x (aligned with Angular 19) | UI components | 90+ components including: DataTable (with sorting, filtering, pagination — critical for equipment lists), FileUpload, Charts (dashboard), Dialog, Dropdown, Calendar, Toast. Built for Angular (not ported). Angular 19 Signal-ready. |
| PrimeIcons | bundled | Icon set | Bundled with PrimeNG. Sufficient for admin UI. |

**Why PrimeNG over Angular Material:** Material Design is Google's consumer-product design language — it works for apps designed for general public. Admin warehouse management tools benefit more from PrimeNG's richer data components (DataTable, TreeTable, Charts). Material's table component requires more custom work to reach PrimeNG DataTable's feature level.

**Why not ng-zorro:** Ant Design aesthetic; heavier setup; primarily popular in Chinese-market Angular projects. PrimeNG has stronger English documentation and community for this use case.

**Confidence:** MEDIUM-HIGH — PrimeNG for Angular 19 is well-supported and the dominant choice for data-heavy Angular admin UIs. Verify the team has no existing preference.

---

### Frontend — Forms

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Reactive Forms | built-in | All forms | Equipment CRUD, import/export records, maintenance logs, financial entries — all have complex validation (cross-field rules, conditional required fields). Reactive Forms give programmatic control and are unit-testable. Template-driven forms are unsuitable for this complexity. |

**Confidence:** HIGH — Reactive Forms are the unanimous recommendation for enterprise admin forms in Angular.

---

### Frontend — HTTP Communication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular HttpClient | built-in | API calls | `provideHttpClient(withInterceptorsFromDi())` with standalone setup. HTTP interceptors for JWT token attachment and global error handling. |
| HTTP Interceptors | built-in | Auth + errors | JWT interceptor attaches `Authorization: Bearer {token}` header. Error interceptor handles 401 (redirect to login), 403 (show forbidden), 500 (show toast). Centralizes auth logic — no per-component token handling. |

**Confidence:** HIGH — Standard Angular pattern, no alternatives needed.

---

### Frontend — Routing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular Router | built-in | Navigation | `loadComponent()` for lazy loading. Route guards for authentication (`canActivate`). Separate routes for: Dashboard, Equipment, Employees, Projects, Maintenance, Finance, Reports. Each feature lazy-loaded to reduce initial bundle. |

**Confidence:** HIGH.

---

### Frontend — Build + Dev Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular CLI (esbuild) | 19.x | Build | Esbuild-based builder is default since Angular 17 — significantly faster than webpack for dev rebuilds. |
| ESLint + Angular ESLint | 18.x | Linting | `@angular-eslint/eslint-plugin`. Enforce consistent code style. |
| Prettier | 3.x | Formatting | Consistent formatting across team. Configure with `prettier --write` as pre-commit hook. |

**Confidence:** HIGH.

---

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

---

## Installation Commands

```bash
# .NET — create solution structure
dotnet new sln -n EquipmentManagement
dotnet new webapi -n EquipmentManagement.API --framework net9.0
dotnet new classlib -n EquipmentManagement.Application --framework net9.0
dotnet new classlib -n EquipmentManagement.Domain --framework net9.0
dotnet new classlib -n EquipmentManagement.Infrastructure --framework net9.0

# Backend NuGet packages (API + Infrastructure)
dotnet add package MediatR --version 14.*
dotnet add package FluentValidation --version 12.*
dotnet add package FluentValidation.DependencyInjectionExtensions --version 12.*
dotnet add package AutoMapper --version 13.*
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 9.*
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 9.*
dotnet add package Stateless --version 5.*
dotnet add package Dapper --version 2.*
dotnet add package EFCore.BulkExtensions --version 8.*
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 9.*
dotnet add package Microsoft.AspNetCore.Identity.EntityFrameworkCore --version 9.*
dotnet add package ClosedXML --version 0.105.*
dotnet add package QuestPDF --version 2025.*
dotnet add package SixLabors.ImageSharp --version 3.*
dotnet add package Serilog.AspNetCore --version 8.*
dotnet add package Serilog.Sinks.File
dotnet add package Swashbuckle.AspNetCore --version 7.*

# Angular — scaffold new project
npx @angular/cli@19 new equipment-management-ui --standalone --routing --style=scss --strict

# Angular packages
npm install primeng@19 primeicons
npm install @angular-eslint/eslint-plugin --save-dev
npm install prettier --save-dev
```

---

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

---

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

---

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
