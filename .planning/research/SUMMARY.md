---
phase: all
type: research-summary
researched: 2026-04-13
confidence: HIGH (stack, features, architecture) / MEDIUM (tooling licenses, DB choice)
---

# Project Research Summary

**Project:** Company Equipment/Asset Management System (Quan ly Kho Thiet Bi)
**Domain:** Enterprise Equipment/Asset Lifecycle Management — single warehouse, admin-only
**Researched:** 2026-04-13
**Confidence:** HIGH (stack, features, architecture) / MEDIUM (specific tooling licenses and DB choice)

---

## 1. Stack Decisions

### Locked (HIGH confidence)

| Layer | Choice | Version | Rationale |
|-------|--------|---------|-----------|
| Backend framework | ASP.NET Core + Controller-based API | 9.0 LTS | Required by team. 50+ endpoints — controllers outscale minimal APIs for this complexity. |
| Architecture pattern | Clean Architecture | — | Domain / Application / Infrastructure / API layers. Prevents EF bleeding into controllers. |
| CQRS | MediatR | 14.x | 30+ distinct operations. Pipeline behaviors handle cross-cutting concerns uniformly. |
| Input validation | FluentValidation | 12.x | Complex cross-field rules (end date after start, non-negative penalty amounts). |
| DTO mapping | AutoMapper | 13.x | Reduces boilerplate; team-familiar. |
| ORM | EF Core | 9.x | Migrations justify EF Core for greenfield. Performance sufficient at this scale. |
| Reporting queries | Dapper (optional supplement) | 2.x | Hand-tuned SQL only for multi-join aggregation queries. NOT for CRUD. |
| Auth | ASP.NET Core Identity + JWT Bearer | 9.x | Admin-only SPA. Short-lived JWT (15–60 min) + refresh tokens. HS256 signing. |
| Frontend framework | Angular 19 + Standalone components | 19.x | Required by team. No NgModules — `loadComponent()` lazy loading throughout. |
| Frontend state | Angular Signals + Injectable Services | built-in | Single-admin system. NgRx is overkill — signals + service stores are sufficient. |
| UI components | PrimeNG | 19.x | 90+ components. DataTable with server-side pagination out of the box. Angular-native. |
| Forms | Angular Reactive Forms | built-in | Complex validation (cross-field, conditional required). Template-driven is unsuitable. |
| Excel export | ClosedXML | 0.105.x | MIT license. `LoadFromCollection()` covers all report needs. Do NOT use EPPlus (paid). |
| PDF generation | QuestPDF | 2025.x | Modern fluent API, .NET 9 native, no browser dependency. Free under $1M revenue. |
| Structured logging | Serilog | 4.x | JSON-structured logs. Sinks: Console (dev), File (prod). |
| Equipment images | Local filesystem + IFileStorageService | — | Single-server v1. Abstract behind interface for future cloud swap. |
| Image processing | SixLabors.ImageSharp | 3.x | Resize to max 1200px on upload. Check commercial license threshold. |

### Conditional (MEDIUM confidence)

| Decision | Default | Alternative | When to switch |
|----------|---------|-------------|----------------|
| Database | SQL Server 2019+ | PostgreSQL (Npgsql) | If no existing SQL Server license, or Linux deployment planned. Decision D-01 locks PostgreSQL. |
| Bulk import | EFCore.BulkExtensions | EF Core batched SaveChanges | Only needed for CSV/Excel mass import (v2 scope). |
| Report async | Synchronous (< 1,000 rows) | IHostedService background worker | Switch when reports take > 5s under real data volume. |

---

## 2. Architecture Patterns

### System Shape

**Monolithic deployment. Clean Architecture internals. REST JSON API + Angular SPA.**

Do NOT use microservices. Single warehouse, admin-only, ~200 employees — monolith is correct. Distributed transactions, event buses, and service discovery add zero value here.

```
Angular SPA (feature-based, standalone components)
    │  HTTP REST / JWT Bearer
ASP.NET Core API (Controllers → MediatR handlers → Services → EF Core)
    │
PostgreSQL (single DB, EF Core migrations, Dapper for reports)
```

### Layer Rules

- Controllers → Application Services (via MediatR)
- Services → Domain Entities + EF Core (via DbContext interface)
- **No layer skips its neighbor.** No EF Core in controllers. No HTTP in services.

### Central Data Model

The **`WarehouseTransaction`** is the audit log of all equipment movement:

- Single table, `TransactionType` enum discriminator (Import | ExportEmployee | ReturnEmployee | ExportProject | ReturnProject)
- Nullable FKs for `SupplierId`, `EmployeeId`, `ProjectId` depending on type
- **Do NOT split into type-specific tables** — cross-type reports would require UNION queries
- Append-only: never update or delete rows

**`Equipment.Status` is stored (not computed):**
- Values: `InStock | Assigned | InProject | UnderMaintenance | Disposed`
- Updated atomically within the same `SaveChanges()` as the related transaction
- Computing status from transaction log at query time = N+1 queries on every list load

**`FinancialRecord`** — denormalized ledger:
- Attached to operations (Import → PurchaseCost, Return with damage → DamageFine, Liquidation → Revenue)
- Never created standalone; always a side effect of a transaction event
- Denormalize equipment name/serial at write time — reports must not require active equipment row to display

### Key Status Transitions

```
InStock → Assigned          (ExportEmployee)
InStock → InProject         (ExportProject)
InStock → UnderMaintenance  (MaintenanceRecord created)
Assigned → InStock          (ReturnEmployee)
InProject → InStock         (ReturnProject)
UnderMaintenance → InStock  (MaintenanceRecord completed)
InStock → Disposed          (Liquidation)
```

Invalid transitions throw a domain exception → HTTP 422. **All transitions through a single `EquipmentStateMachine` service** (use `Stateless` library) — never scattered across controllers.

### Two Export Flows — Separate, Not Merged

| Flow | Entity Involved | Return Trigger | Penalty Possible |
|------|----------------|----------------|-----------------|
| ExportEmployee → ReturnEmployee | Employee | Manual return | Yes (damage fine) |
| ExportProject → ReturnProject | Project | Project end | No |

Keep these as separate service paths and separate DB table strategies. Do not merge into one `ExportRecord` with a type discriminator — different lifecycle rules contaminate each other.

### Build Order (Phase Dependencies)

| Phase | Builds | Requires |
|-------|--------|---------|
| 1 | Auth + Reference Data (Category, Dept, Supplier) | Nothing |
| 2 | Equipment CRUD + Employee + Project | Phase 1 |
| 3 | Import Flow (creates Equipment + Transaction + Financial) | Phase 2 |
| 4 | Assignment flows (ExportEmployee, ExportProject, Return) | Phase 3 |
| 5 | Maintenance + Liquidation + Financial summaries | Phase 4 |
| 6 | Reports + Dashboard + Excel/PDF export | Phase 5 |

**Reports are Layer 6.** Building report endpoints before the underlying data exists creates throwaway mock work.

---

## 3. Must-Have Features (v1 MVP)

From FEATURES.md — features where absence makes the system worse than a spreadsheet:

1. Equipment catalog: add / edit / delete / photo / status / category / serial / search
2. Admin authentication + full audit trail (every write: who, what, when, old→new values)
3. Inbound receipt: supplier + equipment list + unit cost + invoice + receipt date
4. Employee assignment (checkout) + return + damage penalty recording
5. Project assignment + return
6. Maintenance log: incidents, repairs, scheduled maintenance, overdue flag
7. Liquidation recording: date, sale revenue, reason
8. Financial summary: purchase costs + liquidation revenue + penalties collected
9. Reports: current inventory, assignment history, inbound/outbound by period — Excel export
10. Dashboard: total assets, assigned count, maintenance count, total inventory value

**Defer to v2:**
- Bulk CSV/Excel import
- Printable assignment receipts (PDF)
- Department-level reporting
- Asset utilization analysis (idle stock > N days)
- QR code / barcode scanning

**Permanent anti-features:** Employee self-service portal, multi-warehouse, IoT/GPS, ERP integration, Active Directory.

---

## 4. Critical Pitfalls (Must Avoid)

Full details in [PITFALLS.md](.planning/research/PITFALLS.md). Summary of the 14 pitfalls:

### Blockers (cause rewrites or data corruption if ignored)

| # | Pitfall | Prevention | Phase |
|---|---------|-----------|-------|
| 1 | Status transitions in multiple controllers | Single `EquipmentStateMachine` service using `Stateless` library | Phase 1 |
| 2 | Employee + Project export flows merged in one table | Separate service classes and DB paths per flow | Phase 1 |
| 3 | Audit trail added as afterthought | EF Core `SaveChangesInterceptor` from day 1 — automatic, not manual | Phase 1 |
| 4 | Soft delete breaking `Include()` joins | Configure `OnDelete(DeleteBehavior.Restrict)`, test with deleted related entities | Phase 1 |

### Serious (cause bugs or performance problems)

| # | Pitfall | Prevention | Phase |
|---|---------|-----------|-------|
| 5 | Report generation blocking HTTP thread | Background `IHostedService` worker for large reports | Phase 6 |
| 6 | Equipment images in wwwroot or DB blob | Filesystem outside wwwroot, path in DB, serve via authenticated endpoint | Phase 2 |
| 7 | Double-assignment from concurrent sessions | `RowVersion` concurrency token on `Equipment`; catch `DbUpdateConcurrencyException` → 409 | Phase 2 |
| 8 | Component-local Angular state causing stale data | Shared service stores with Angular Signals; no per-component `GET /equipment` on init | Phase 1 |
| 9 | Financial records tightly joined to mutable equipment | Denormalize at write time; ledger semantics — never `INNER JOIN` to equipment in reports | Phase 3 |
| 10 | N+1 queries in Equipment list / reports | Disable lazy loading; use `Select()` projection; `AsSplitQuery()` for multi-collection includes | Phase 1 |

### Minor (friction, not corruption)

| # | Pitfall | Prevention | Phase |
|---|---------|-----------|-------|
| 11 | Long-lived JWT with no refresh | Short JWT (15–60 min) + refresh token in HttpOnly cookie; silent refresh in Angular interceptor | Phase 1 |
| 12 | Validation only in Angular forms | FluentValidation pipeline in Application layer; Angular validation is UX only | Phase 1 |
| 13 | Timestamps in local server time | Store all timestamps as UTC; convert to UTC+7 in frontend display only | Phase 1 |
| 14 | Maintenance notifications without validating need | Dashboard "overdue" widget first; no email/push in v1 | Phase 5 |

---

## 5. Angular Frontend Architecture

```
src/app/
  core/               ← AuthService (Signals), JWT interceptor, AuthGuard
  shared/             ← DataTable, StatusBadge, ConfirmDialog, FileUpload, VND pipe
  features/
    auth/             ← Login page
    dashboard/        ← KPI cards
    equipment/        ← List, Detail, Form (Phase 2+)
    transactions/     ← Import, Export flows, Return forms (Phase 3–4)
    employees/        ← List, Detail (Phase 2+)
    departments/      ← List, Form (Phase 1)
    projects/         ← List, Detail (Phase 2+)
    suppliers/        ← List, Form (Phase 1)
    categories/       ← List, Form (Phase 1)
    maintenance/      ← List, Form, Calendar (Phase 5)
    finance/          ← Dashboard, Records (Phase 5)
    reports/          ← Builder, Export (Phase 6)
```

Feature service pattern: `@Injectable({ providedIn: 'root' })` with `signal<T[]>()` for list state. After any mutation, update the signal — all subscribers reflect instantly.

---

## 6. API Shape (Key Endpoints)

```
POST   /api/auth/login
GET    /api/equipment?page&pageSize&status&categoryId
POST   /api/equipment
PUT    /api/equipment/{id}
GET    /api/equipment/{id}/history
POST   /api/transactions/export-employee
POST   /api/transactions/return-employee
POST   /api/transactions/export-project
POST   /api/transactions/return-project
GET    /api/maintenance/upcoming
GET    /api/financial/summary
GET    /api/reports/inventory-by-category
POST   /api/reports/export   { reportType, format: "excel"|"pdf", filters }
```

All list endpoints: `?page=1&pageSize=20&sortBy=name&sortDir=asc` → `{ data: [], totalCount, page, pageSize }`.

---

## 7. Key Numbers

| Metric | Value | Source |
|--------|-------|--------|
| Expected employees | ~200 | PROJECT.md |
| Expected equipment | Thousands | PROJECT.md |
| API endpoints (total) | ~50+ | ARCHITECTURE.md estimate |
| Status transition states | 5 | ARCHITECTURE.md |
| Transaction types | 5 | ARCHITECTURE.md |
| Financial record types | 4 | ARCHITECTURE.md |
| Research files | 4 | STACK, ARCHITECTURE, FEATURES, PITFALLS |
| Phase count | 6 | ROADMAP.md |
| v1 requirements | 38 | REQUIREMENTS.md |

---

## 8. Open Questions / Verify with Team

- [ ] SQL Server vs PostgreSQL — does the company already have SQL Server licenses? (D-01 locks PostgreSQL per CONTEXT.md Phase 1)
- [ ] QuestPDF commercial license — does company revenue exceed $1M? (verify before Phase 6)
- [ ] ImageSharp commercial license — same revenue threshold check (before Phase 2)
- [ ] Hosting environment — Windows Server (IIS/Kestrel) or Linux? Affects filesystem image storage paths
- [ ] JWT expiry preference — 8 hours (CONTEXT.md D-08 accepts 8h for admin tool; no refresh token in Phase 1)

---

*Research synthesized from: STACK.md, ARCHITECTURE.md, FEATURES.md, PITFALLS.md*
*Synthesized: 2026-04-15*
