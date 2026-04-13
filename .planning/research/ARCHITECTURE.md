# Architecture Patterns: Company Equipment/Asset Management System

**Domain:** Equipment/Asset Lifecycle Management
**Stack:** ASP.NET Core (backend) + Angular (frontend)
**Researched:** 2026-04-13
**Confidence:** HIGH (Microsoft official docs + well-established patterns)

---

## Recommended Architecture

**Monolithic deployment, Clean Architecture internals, REST API + SPA frontend.**

Do NOT use microservices for this system. Single warehouse, admin-only, ~200 employees, thousands of devices — this is squarely in monolithic territory. The complexity of microservices (event bus, distributed transactions, service discovery) adds zero value here and significant operational cost. A well-structured monolith deployed as a single unit is the correct call.

```
┌─────────────────────────────────────────────┐
│              Angular SPA (Frontend)          │
│  feature/equipment  feature/transactions     │
│  feature/employees  feature/reports          │
│  feature/maintenance  feature/finance        │
│           core/  shared/                    │
└──────────────────┬──────────────────────────┘
                   │ HTTP REST (JSON)
                   │ JWT Bearer token
┌──────────────────▼──────────────────────────┐
│         ASP.NET Core Web API (Backend)       │
│  ┌─────────────────────────────────────┐    │
│  │    Presentation Layer (Controllers)  │    │
│  │  EquipmentController                │    │
│  │  TransactionController              │    │
│  │  EmployeeController                 │    │
│  │  MaintenanceController              │    │
│  │  ReportController                   │    │
│  │  FinancialController                │    │
│  │  AuthController                     │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │       Application Layer (Services)   │    │
│  │  EquipmentService                   │    │
│  │  TransactionService (in/out/return) │    │
│  │  MaintenanceService                 │    │
│  │  ReportService                      │    │
│  │  FinancialService                   │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │         Domain Layer (Entities)      │    │
│  │  Equipment, Category, Supplier       │    │
│  │  Employee, Department, Project       │    │
│  │  WarehouseTransaction               │    │
│  │  MaintenanceRecord                  │    │
│  │  FinancialRecord                    │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │      Infrastructure Layer            │    │
│  │  EF Core DbContext                  │    │
│  │  Repository implementations         │    │
│  │  FileStorageService (images)        │    │
│  │  ExcelExportService (EPPlus)        │    │
│  │  PdfExportService (iTextSharp)      │    │
│  └─────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   SQL Server / PG   │
        │   (single database) │
        └─────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Angular SPA | UI rendering, form validation, state management, routing | ASP.NET Core API via HTTP |
| Controllers (Presentation) | HTTP request/response, DTO mapping, auth validation | Application Services |
| Application Services | Business logic, orchestration, transaction management | Domain entities, Repositories, Infrastructure services |
| Domain Entities | Business rules, status transitions, entity invariants | Nothing (pure domain) |
| Repositories | Data access abstraction, query composition | EF Core DbContext |
| EF Core DbContext | DB schema, migrations, query execution | SQL Server/PostgreSQL |
| FileStorageService | Equipment image upload/storage | Local disk or blob store |
| ExportService | Excel/PDF generation | Application Services (data in) |

**Rule: No layer skips its neighbor.** Controllers call Services. Services call Repositories. Repositories call DbContext. Angular calls only Controllers (via REST). This prevents the spaghetti that kills maintainability.

---

## Core Data Models and Relationships

### Equipment (central entity)

```
Equipment
├── Id (GUID)
├── Name
├── SerialNumber (unique)
├── CategoryId → Category
├── SupplierId → Supplier (optional, set on import)
├── PurchaseYear
├── PurchasePrice (decimal)
├── ImagePath (nullable)
├── Status (enum: InStock | Assigned | InProject | UnderMaintenance | Disposed)
├── Notes
├── CreatedAt, UpdatedAt
```

**Status is derived-but-stored.** Store it explicitly on the Equipment row — do not compute it from transactions at query time. Update it transactionally when a WarehouseTransaction is created/closed. This avoids expensive subqueries on every list view and prevents status drift bugs.

### Category

```
Category
├── Id
├── Name (IT, Office, Industrial, etc.)
├── Description
```

### Supplier

```
Supplier
├── Id
├── Name
├── ContactInfo
├── Address
```

### Employee

```
Employee
├── Id
├── FullName
├── EmployeeCode (unique)
├── DepartmentId → Department
├── Position
├── Email
├── Phone
├── IsActive
```

### Department

```
Department
├── Id
├── Name
```

### Project

```
Project
├── Id
├── Name
├── ProjectCode (unique)
├── StartDate
├── EndDate (nullable)
├── Description
├── Status (Active | Completed | Suspended)
```

### WarehouseTransaction (the audit log of all movement)

This is the most important entity in the system. Every equipment movement produces one record here.

```
WarehouseTransaction
├── Id
├── TransactionType (enum: Import | ExportEmployee | ReturnEmployee | ExportProject | ReturnProject)
├── EquipmentId → Equipment
├── Quantity (always 1 for individual assets — not bulk inventory)
├── TransactionDate
├── Direction (enum: In | Out)  -- derived from TransactionType, stored for query speed

-- For Import:
├── SupplierId → Supplier (nullable)
├── InvoiceNumber (nullable)
├── UnitCost (decimal, nullable)

-- For ExportEmployee / ReturnEmployee:
├── EmployeeId → Employee (nullable)

-- For ExportProject / ReturnProject:
├── ProjectId → Project (nullable)

├── Notes
├── CreatedBy (admin user id)
├── CreatedAt
```

**Do not split into separate tables per transaction type.** Use a single table with nullable FKs and a discriminator enum. This simplifies reporting (one query for all history) and avoids join complexity with no payoff at this scale.

### MaintenanceRecord

```
MaintenanceRecord
├── Id
├── EquipmentId → Equipment
├── Type (enum: BreakdownRepair | ScheduledMaintenance)
├── Description
├── StartDate
├── EndDate (nullable — null means ongoing)
├── Cost (decimal)
├── PerformedBy (external vendor or internal)
├── Status (Pending | InProgress | Completed)
├── NextMaintenanceDue (nullable — for scheduled)
├── CreatedAt
```

When a MaintenanceRecord is created with Status = InProgress, the Equipment.Status is set to UnderMaintenance. When Status = Completed, Equipment.Status reverts to InStock (or back to Assigned/InProject if it was pulled from there — track with a field).

### FinancialRecord

Financial events are NOT separate from transactions; they are attached to transactions and maintenance. Use a denormalized FinancialRecord for reporting convenience:

```
FinancialRecord
├── Id
├── Type (enum: PurchaseCost | LiquidationRevenue | DamageFine | MaintenanceCost)
├── Amount (decimal)
├── EquipmentId → Equipment
├── EmployeeId → Employee (nullable — for damage fines)
├── ReferenceId (GUID — FK to WarehouseTransaction or MaintenanceRecord)
├── ReferenceType (enum: Transaction | Maintenance)
├── RecordDate
├── Notes
```

This design lets the Finance dashboard query one table for all money flows with direction (cost vs revenue).

---

## Data Flow: Two Export Flows

### Flow 1 — Employee Assignment (ExportEmployee)

```
Admin selects:  Equipment (Status = InStock) + Employee
                        │
                        ▼
Application Service:
  1. Validate Equipment.Status == InStock
  2. Create WarehouseTransaction {
       Type = ExportEmployee, EquipmentId, EmployeeId,
       Direction = Out, TransactionDate = now
     }
  3. Update Equipment.Status = Assigned
  4. SaveChanges() — single DbContext transaction
                        │
                        ▼
Return Flow (ReturnEmployee):
  1. Validate Equipment.Status == Assigned
  2. Check for damage → if yes, create FinancialRecord {Type=DamageFine}
  3. Create WarehouseTransaction {Type = ReturnEmployee, Direction = In}
  4. Update Equipment.Status = InStock
  5. SaveChanges()
```

### Flow 2 — Project Allocation (ExportProject)

```
Admin selects:  Equipment (Status = InStock) + Project
                        │
                        ▼
Application Service:
  1. Validate Equipment.Status == InStock
  2. Create WarehouseTransaction {
       Type = ExportProject, EquipmentId, ProjectId,
       Direction = Out, TransactionDate = now
     }
  3. Update Equipment.Status = InProject
  4. SaveChanges()
                        │
                        ▼
Return Flow (ReturnProject):
  1. Validate Equipment.Status == InProject
  2. Create WarehouseTransaction {Type = ReturnProject, Direction = In}
  3. Update Equipment.Status = InStock
  4. SaveChanges()
```

### Flow 3 — Import (for completeness)

```
Admin enters:   Supplier + equipment details + cost + invoice
                        │
                        ▼
Application Service:
  1. Create Equipment {Status = InStock}
  2. Create WarehouseTransaction {Type = Import, Direction = In, SupplierId, UnitCost}
  3. Create FinancialRecord {Type = PurchaseCost, Amount = UnitCost}
  4. SaveChanges()
```

**All three flows are atomic.** Equipment.Status update and WarehouseTransaction creation happen in the same EF Core SaveChanges() call. There is no eventual consistency — this is a single-database monolith, use database transactions.

---

## API Design Approach

**RESTful JSON over HTTPS. JWT Bearer auth. No GraphQL, no SignalR (no real-time needed).**

### Resource Layout

```
/api/auth
  POST   /login                    → JWT token

/api/equipment
  GET    /                         → paginated list, filterable by status/category
  GET    /{id}                     → single equipment + current assignment info
  POST   /                         → create (import flow triggers transaction)
  PUT    /{id}                     → update metadata
  DELETE /{id}                     → soft delete (only if InStock, never if assigned)
  GET    /{id}/history             → all WarehouseTransactions for this equipment

/api/transactions
  GET    /                         → full transaction log, filterable
  POST   /export-employee          → ExportEmployee flow
  POST   /return-employee          → ReturnEmployee flow
  POST   /export-project           → ExportProject flow
  POST   /return-project           → ReturnProject flow

/api/employees
  GET / POST / PUT /{id} / DELETE /{id}
  GET    /{id}/assignments         → current + historical equipment

/api/departments
  GET / POST / PUT / DELETE

/api/projects
  GET / POST / PUT /{id}
  GET    /{id}/equipment           → equipment currently assigned to project

/api/suppliers
  GET / POST / PUT / DELETE

/api/categories
  GET / POST / PUT / DELETE

/api/maintenance
  GET    /                         → list, filterable by status/equipment
  POST   /                         → create maintenance record
  PUT    /{id}                     → update (including completion)
  GET    /upcoming                 → equipment due for maintenance

/api/financial
  GET    /summary                  → totals by type
  GET    /records                  → paginated financial records

/api/reports
  GET    /inventory-by-category    → returns data or triggers Excel/PDF export
  GET    /transactions-by-period   → date range filter
  GET    /by-department-employee
  GET    /maintenance
  POST   /export                   → body: {reportType, format: "excel"|"pdf", filters}
```

### DTO Pattern

Use separate Request/Response DTOs — never expose domain entities directly to the API. A `EquipmentResponse` DTO flattens Category name and current assignment info. A `CreateEquipmentRequest` DTO validates required fields. AutoMapper or manual mapping — either works, but keep it consistent.

### Pagination

All list endpoints accept `?page=1&pageSize=20&sortBy=name&sortDir=asc`. Return `{ data: [], totalCount, page, pageSize }`. At 1000+ equipment items, un-paginated lists will be slow and break the UI.

---

## Angular Frontend Architecture

**Standalone components, feature-based folder structure, no NgModules.**

```
src/
  app/
    core/                    ← Singleton services, interceptors, guards
      services/
        auth.service.ts      ← JWT storage, login/logout
        http-error.interceptor.ts
      guards/
        auth.guard.ts
    shared/                  ← Reusable components, pipes, no services
      components/
        data-table/
        status-badge/        ← Equipment status chip (color-coded)
        confirm-dialog/
        file-upload/
      pipes/
        currency-vnd.pipe.ts
    features/
      equipment/
        equipment-list/
        equipment-detail/
        equipment-form/
        equipment.routes.ts
        equipment.service.ts
      transactions/
        import-form/
        export-employee-form/
        export-project-form/
        return-form/
        transaction-history/
        transactions.routes.ts
        transactions.service.ts
      employees/
        employee-list/
        employee-form/
        employee-detail/     ← shows assigned equipment history
        employees.routes.ts
        employees.service.ts
      departments/
      projects/
        project-list/
        project-detail/      ← shows equipment currently in project
        projects.routes.ts
      suppliers/
      categories/
      maintenance/
        maintenance-list/
        maintenance-form/
        maintenance-calendar/ ← upcoming schedule view
        maintenance.routes.ts
      finance/
        finance-dashboard/
        financial-records/
        finance.routes.ts
      reports/
        report-builder/      ← select report type + filters + format
        reports.routes.ts
      dashboard/
        dashboard.component.ts  ← summary KPIs
      auth/
        login/
    app.routes.ts            ← top-level lazy routes
    app.config.ts
```

Each feature service is `providedIn: 'root'` (or provided via route). Angular HttpClient calls are in the feature service. Components are thin — they call services and render data.

---

## Build Order (Phase Dependencies)

The following sequence reflects true dependencies where later items cannot be built without earlier ones.

### Layer 1 — Foundation (must come first, everything depends on this)
1. **Database schema + EF Core entities** — all other code references these
2. **Auth (JWT login)** — every API endpoint needs auth; Angular needs the auth guard
3. **Reference data CRUD** — Category, Department, Supplier (no FKs to complex entities)

### Layer 2 — Core Entities (depend only on Layer 1)
4. **Employee + Project CRUD** — needed before transactions can reference them
5. **Equipment CRUD** (no transactions yet, just metadata + image upload)

### Layer 3 — Movement Logic (depends on Layer 2)
6. **Import flow** — creates Equipment + WarehouseTransaction + FinancialRecord together
7. **Export Employee flow** — requires Equipment + Employee
8. **Return Employee flow** — requires active Export Employee transaction
9. **Export Project flow** — requires Equipment + Project
10. **Return Project flow** — requires active Export Project transaction

### Layer 4 — Supporting Features (can run in parallel after Layer 3)
11. **Maintenance module** — requires Equipment; status transitions touch Equipment.Status
12. **Financial module** — FinancialRecord exists from Layer 3, this adds the dashboard
13. **Dashboard** — aggregates counts from all prior entities

### Layer 5 — Output
14. **Reports module** — requires all data to exist; Excel/PDF export is independent of data logic
15. **Equipment history view** — just a transaction log query, easy once transactions exist

**Do not build reports before you have data.** Reports are Layer 5 — they read from everything. Building them first creates mocked data dependency and throwaway work.

---

## Status Transition Rules (Enforced in Application Service Layer)

```
InStock         → Assigned          (ExportEmployee)
InStock         → InProject         (ExportProject)
InStock         → UnderMaintenance  (MaintenanceRecord created)
Assigned        → InStock           (ReturnEmployee)
Assigned        → UnderMaintenance  (pulled for emergency maintenance)
InProject       → InStock           (ReturnProject)
InProject       → UnderMaintenance  (pulled for emergency maintenance)
UnderMaintenance → InStock          (maintenance completed)
InStock         → Disposed          (liquidation)
```

Invalid transitions throw a domain exception caught by the Controller and returned as HTTP 422 Unprocessable Entity with a clear error message. Never silently allow an invalid transition — it corrupts the audit trail.

---

## Scalability Considerations

| Concern | At current scale (1000s devices) | If scaling needed |
|---------|-----------------------------------|-------------------|
| Equipment list query | Paginated + indexed on Status, CategoryId, SupplierId | Add full-text index on Name/Serial |
| Transaction history | Index on EquipmentId + TransactionDate | Already fast at this scale |
| Report generation | Synchronous is fine | Move to background job if reports take >5s |
| Image storage | Local disk path stored in DB | Move path to Azure Blob URL without schema change |
| Auth | Single admin user, JWT | Add roles (ReadOnly admin) without architecture change |

This system does not need Redis, message queues, or event sourcing. Synchronous request-response with a properly indexed SQL Server/PostgreSQL database handles tens of thousands of equipment records trivially.

---

## Patterns to Follow

### Pattern: Service encapsulates all status transitions
Never update Equipment.Status from a Controller. All status transitions happen inside the Application Service, wrapped in a single EF Core `SaveChanges()` with both the transaction record and the status update.

### Pattern: WarehouseTransaction is append-only
Never update or delete WarehouseTransaction rows. They are an audit log. If a mistake was made, create a corrective transaction (e.g., a ReturnEmployee that cancels a wrongful ExportEmployee). This preserves history.

### Pattern: Financial data attached to operations
FinancialRecord rows are created as a side effect of operations (Import, Return with damage, Liquidation). They are never created standalone. This ensures financial figures are always traceable to a specific event.

### Pattern: Soft delete for Equipment
Set `IsDeleted = true` + `DeletedAt` timestamp. Never hard-delete equipment rows — you need historical transaction records to reference them. All queries filter `WHERE IsDeleted = false` by default via EF Core query filters.

---

## Anti-Patterns to Avoid

### Anti-Pattern: Computing equipment status from transaction log at query time
**Why bad:** JOIN + subquery across thousands of transactions on every list load. Status becomes a derived aggregate that's slow and brittle.
**Instead:** Store Status on Equipment, update atomically with each transaction.

### Anti-Pattern: Separate transaction tables per type (ImportTransaction, EmployeeTransaction, ProjectTransaction)
**Why bad:** Cross-type reports require UNION queries. History view requires querying 3 tables. Adds join complexity with no schema benefit.
**Instead:** Single WarehouseTransaction table with TransactionType enum and nullable FK columns.

### Anti-Pattern: Angular calling multiple endpoints to assemble one view
**Why bad:** Waterfall HTTP calls. Equipment detail page makes 5 sequential API calls.
**Instead:** Equipment detail endpoint returns a single DTO that includes category name, current assignment (employee or project), latest maintenance status. Flatten at the API layer.

### Anti-Pattern: Not paginating equipment list on initial load
**Why bad:** 2000 equipment rows serialized to JSON in a single response. Angular renders 2000 table rows. Both are slow.
**Instead:** Default page size of 20-50, server-side pagination required from day 1.

---

## Sources

- [Common web application architectures — Microsoft .NET Docs](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures) — HIGH confidence, official
- [Angular 2025 project structure with features approach](https://www.ismaelramos.dev/blog/angular-2025-project-structure-with-the-features-approach/) — MEDIUM confidence
- [Clean Architecture in ASP.NET Core](https://www.c-sharpcorner.com/article/clean-architecture-in-asp-net-core-web-api/) — MEDIUM confidence
- [Asset lifecycle states — Dynamics 365 docs](https://learn.microsoft.com/en-us/dynamics365/supply-chain/asset-management/setup-for-objects/object-stages) — HIGH confidence for status patterns
- [Repository Pattern in ASP.NET Core — Code Maze](https://code-maze.com/net-core-web-development-part4/) — MEDIUM confidence
