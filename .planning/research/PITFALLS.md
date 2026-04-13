# Domain Pitfalls: Company Equipment/Asset Management System

**Domain:** Equipment lifecycle management (warehouse → assignment → maintenance → liquidation)
**Stack:** ASP.NET Core + Angular + EF Core
**Researched:** 2026-04-13

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or loss of trust in the system.

---

### Pitfall 1: State Transitions Enforced Only in Application Logic, Not at Database Level

**What goes wrong:** The equipment status field (in-stock / assigned / in-project / maintenance / liquidated) is updated by the API controllers directly without a centralized state machine. Any code path can set any status, and illegal transitions (e.g., jumping from "assigned" to "liquidated" without returning first) become possible through bugs, API misuse, or future code additions.

**Why it happens:** Developers treat status as a simple enum column and add `if/switch` checks in individual controllers. As requirements expand, new code paths bypass existing guards.

**Consequences:** Equipment shows "liquidated" while still assigned to an employee. Financial records become inconsistent with physical state. Audit trail shows a gap that cannot be explained. Rebuilding trust requires manual data correction.

**Prevention:**
- Implement a dedicated `EquipmentStateMachine` service (use the `Stateless` library for .NET — it is the standard for this) that is the *only* code path allowed to mutate equipment status.
- The state machine throws on invalid transitions — this is a feature, not an error to suppress.
- Wrap every transition in a database transaction that also writes the audit log entry atomically.
- Define the full transition graph before writing code: in-stock → assigned, in-stock → in-project, assigned → returned → in-stock, assigned → maintenance, maintenance → in-stock, any → liquidated (only from in-stock or returned).

**Warning signs:**
- Status updates scattered across multiple controllers
- No unit tests covering invalid transition attempts
- Code that sets `equipment.Status = X` directly without going through a service

**Phase to address:** Phase 1 (domain model) — the state machine must be in place before any assignment or export feature is built.

---

### Pitfall 2: Two Export Flows Share One Data Model, Creating Schema Compromises

**What goes wrong:** Employee export and project export are modeled as a single `ExportRecord` table with nullable fields for both flows (e.g., `EmployeeId` is nullable when it's a project export, `ProjectId` is nullable when it's an employee export). This leads to a table with many NULLs, confusing query logic, and reports that need special-casing.

**Why it happens:** The two flows look similar on the surface (both move equipment out of stock), so developers merge them to avoid duplication.

**Consequences:** Business rules specific to one flow bleed into the other. Financial penalties for damaged equipment (employee-specific) require checking NULLs. The "return" flow for projects has different triggers than employee return, but both share the same return logic.

**Prevention:**
- Use separate tables: `EmployeeExportRecord` and `ProjectExportRecord`, both inheriting from a common abstract base if needed.
- Each table carries only the fields relevant to its lifecycle.
- Report queries target the appropriate table — no union hacks or NULL checks.

**Warning signs:**
- A single `ExportType` discriminator column in one table
- Controllers with `if (export.Type == Employee)` branches throughout
- Reports that have different column sets depending on export type but query the same table

**Phase to address:** Phase 1 (domain model design) — fixing this after data exists is a painful migration.

---

### Pitfall 3: Audit Trail as an Afterthought

**What goes wrong:** Audit logging is added after core features are complete, bolted on via manual `AuditLog.Add()` calls sprinkled throughout controller actions. Calls get missed, exception paths skip logging, and the log is incomplete by design.

**Why it happens:** Audit trail feels like a reporting feature, so it gets deferred to "later." Later never happens cleanly.

**Consequences:** Cannot trace who moved equipment and when. Cannot reconstruct equipment history for dispute resolution (e.g., "was this equipment damaged before or after the employee received it?"). Financial records cannot be audited against physical history.

**Prevention:**
- Implement audit logging as an EF Core `SaveChangesInterceptor` from the start. Every mutation to equipment status, export records, and financial records is captured automatically without manual calls.
- Log: entity type, entity ID, changed fields (old value → new value), timestamp, acting user.
- Store audit logs in a separate `AuditLog` table — never in the same table as the entity being tracked.
- Do NOT use database triggers for this — they are invisible to the application, cannot capture user context, and are hard to test.

**Warning signs:**
- `AuditLog.Add()` appears inside controller actions
- No audit entries for delete operations
- Audit table is missing `ChangedBy` or `OldValue`/`NewValue` columns

**Phase to address:** Phase 1 (infrastructure) — the interceptor must be registered before any write operations are built.

---

### Pitfall 4: Soft Delete Breaking Audit History and Joins

**What goes wrong:** Equipment records are soft-deleted (IsDeleted = true) using EF Core global query filters. The filter silently excludes deleted records from all queries, including audit history queries and reports. Worse: when a related entity (employee, category) is soft-deleted, `Include()` queries on equipment silently lose data because EF generates an INNER JOIN — the parent record disappears without any error.

**Why it happens:** Soft delete via global query filter is a common pattern and looks clean in tutorials. The JOIN behavior is not obvious from reading the filter code.

**Consequences:** Equipment that was previously assigned to a now-deleted employee category appears with no category. Audit history queries return partial data. Reports show inconsistent totals that cannot be reconciled.

**Prevention:**
- For equipment: use soft delete (equipment records must be auditable forever — hard delete is wrong here).
- For reference data (categories, suppliers): consider whether soft delete is truly needed, or whether the record should be archived/inactivated instead.
- Always verify that `Include()` on soft-deletable relationships uses LEFT JOIN semantics (configure `OnDelete(DeleteBehavior.Restrict)` to force explicit handling).
- Index the `IsDeleted` column on any table with global query filters.
- Add an integration test that verifies equipment history is still visible after related entities are soft-deleted.

**Warning signs:**
- `IgnoreQueryFilters()` calls appearing in many places (symptom of the JOIN problem)
- Reports returning different totals depending on whether filters are active
- No test covering "view history of equipment whose category was deleted"

**Phase to address:** Phase 1 (data model) and verified in Phase 2 (reports).

---

## Moderate Pitfalls

Issues that cause bugs, rework, or performance problems if not addressed early.

---

### Pitfall 5: Report Generation Blocking the HTTP Thread

**What goes wrong:** Excel and PDF exports are generated synchronously inside controller actions. For reports covering years of history across thousands of equipment items, this takes 30–120 seconds. The HTTP request times out, the Angular client shows an error, and the user retries — making the problem worse.

**Why it happens:** The first prototype generates a small report quickly, so the synchronous approach is never questioned.

**Consequences:** Timeout errors under real data volumes. IIS/Kestrel thread pool exhaustion if multiple exports are triggered simultaneously. User-visible failures at exactly the moment management needs a quarterly report.

**Prevention:**
- For reports under ~1,000 rows: synchronous generation with streaming response is acceptable.
- For larger reports (full inventory history, financial summaries): queue to an `IHostedService` background worker. Return a job ID immediately. The Angular client polls for completion, then downloads.
- ClosedXML performance: never insert/delete rows in a loop — use range operations. Pre-allocate column widths.
- For PDF: use QuestPDF (free, MIT, actively maintained in 2025) rather than iTextSharp (AGPL licensing complications) or deprecated libraries.

**Warning signs:**
- Report action method has no timeout handling
- No loading state or progress feedback in the Angular UI for exports
- Report endpoint is called directly with no queueing

**Phase to address:** Phase 3 (reporting) — design the async pattern from the first report endpoint.

---

### Pitfall 6: Image Storage in wwwroot or Database BLOB Column

**What goes wrong:** Equipment photos are stored either as BLOB/binary in the database or as files in `wwwroot/uploads/`. The database approach bloats the DB to gigabytes and slows every backup. The wwwroot approach breaks when the app is redeployed (files are wiped) or runs on multiple instances.

**Why it happens:** Both are the easiest options to implement in a tutorial context. Neither is suitable for production.

**Consequences:** Database growth causes backup times to balloon. Images disappear after a deployment. Disk space on the app server fills unexpectedly.

**Prevention:**
- Store images on the filesystem in a dedicated directory *outside* wwwroot — e.g., `D:\AppData\EquipmentImages\` — configured via `appsettings.json`.
- Store only the relative file path (e.g., `images/equipment/{guid}.jpg`) in the database.
- Serve images through a dedicated controller endpoint that validates the requesting user is authenticated, not by exposing the raw filesystem path.
- Generate a new GUID filename on upload — never use the original client filename in the stored path (path traversal risk).
- Resize/compress images on upload (limit to max 800x800, 200KB) to prevent storage abuse.

**Warning signs:**
- `IFormFile` saved directly to `wwwroot/uploads/`
- `Equipment.Photo` column is `byte[]` or `varbinary(max)`
- No validation on uploaded file size or type

**Phase to address:** Phase 1 (equipment catalog with image upload).

---

### Pitfall 7: Concurrency Bugs in Multi-Session Scenarios

**What goes wrong:** The project states "single admin but multi-session possible." Without concurrency handling, two browser sessions can simultaneously read equipment as "in-stock" and both assign it to different employees, creating a double-assignment.

**Why it happens:** The single-admin assumption leads developers to skip concurrency tokens. Multi-session is dismissed as unlikely.

**Consequences:** Equipment assigned to two people at once. Financial records show two active assignments. Audit trail shows two valid-looking assignments with no conflict marker.

**Prevention:**
- Add a `RowVersion` (byte array with `[Timestamp]` attribute) concurrency token to the `Equipment` entity.
- EF Core automatically detects concurrent modifications and throws `DbUpdateConcurrencyException`.
- Catch this exception at the assignment/transition service level and return a 409 Conflict with a user-readable message ("This equipment was modified by another session. Please refresh and try again.").
- This is a one-time setup cost with very low ongoing maintenance.

**Warning signs:**
- No `RowVersion` or `[ConcurrencyCheck]` anywhere in the domain model
- Assignment logic reads status, then updates status in separate operations without transaction wrapping

**Phase to address:** Phase 2 (assignment workflows) — add the concurrency token in Phase 1 domain model.

---

### Pitfall 8: Angular State Management Complexity Without Clear Strategy

**What goes wrong:** Equipment list, assignment forms, and dashboard widgets each manage their own HTTP calls and local component state. When the admin assigns equipment on one screen, the equipment list on another tab still shows the old status. The dashboard total is stale. Bugs accumulate as more components share the same data.

**Why it happens:** Component-local state is the path of least resistance in Angular, and the problem only becomes visible at integration time.

**Consequences:** Stale data causing wrong decisions. Excessive API calls as every component independently refreshes. Difficult-to-reproduce bugs that depend on navigation order.

**Prevention:**
- Use Angular services with `BehaviorSubject` or Angular Signals for shared state (equipment list, current assignment) — this is sufficient for a single-admin admin panel; full NgRx is overkill here.
- After any mutation (assignment, return, maintenance), the service updates its cached state and all subscribers automatically reflect the change.
- Avoid NgRx for this project scale — it adds significant boilerplate with minimal benefit for a single-user admin tool.

**Warning signs:**
- Each component makes its own `GET /equipment` call on init
- No shared service holding the current equipment list
- Dashboard data and equipment list data can be inconsistent simultaneously

**Phase to address:** Phase 1 (frontend architecture) — establish the service pattern before building multiple components.

---

### Pitfall 9: Financial Records Tightly Coupled to Physical Records

**What goes wrong:** The `PurchaseRecord`, `LiquidationRecord`, and `PenaltyRecord` tables are modeled with direct foreign keys to equipment and assume the equipment record always exists. When equipment is liquidated and eventually soft-deleted or archived, financial history queries break with null references. Reports mixing financial and physical data become fragile.

**Why it happens:** Financial tracking is added feature-by-feature alongside physical tracking without defining the relationship contract.

**Consequences:** Financial reports show incomplete data. Total cost calculations miss equipment that has been liquidated. Audits find financial records that cannot be traced to any active equipment.

**Prevention:**
- Financial records should be *append-only* and should denormalize the data they need at write time (equipment name, serial number, category, purchase price). They must not depend on joining to a mutable equipment row to display correctly.
- Think of financial records as ledger entries: immutable, self-describing, and complete at the time of creation.
- The FK to equipment can exist for navigation purposes, but reports must not *require* the equipment record to be active to display the financial record.

**Warning signs:**
- Financial report query uses `INNER JOIN` to equipment
- Liquidation report breaks after equipment is archived
- `PenaltyRecord.Amount` is calculated at query time by joining to current equipment fields

**Phase to address:** Phase 2 (financial tracking) — design ledger semantics from the first financial record.

---

### Pitfall 10: N+1 Queries in Equipment List and Report Endpoints

**What goes wrong:** The equipment list includes current assignee name, category name, and last maintenance date. Each of these is loaded by a separate lazy-loaded query per row. For 1,000 equipment items, this is 3,000+ queries per page load.

**Why it happens:** EF Core's lazy loading proxies or ad-hoc `.Include()` calls are added individually as features are built. The problem is invisible in development with 20 test items.

**Consequences:** Equipment list takes 10+ seconds to load under real data. Database CPU spikes. Performance problems are reported only after go-live when data volume grows.

**Prevention:**
- Disable lazy loading entirely (do not install `Microsoft.EntityFrameworkCore.Proxies`). All includes must be explicit.
- Use projection to DTOs via `Select()` rather than loading full entity graphs — only fetch the columns the view actually needs.
- Use EF Core's `.AsSplitQuery()` for queries with multiple collection includes to avoid cartesian explosion.
- Add a test that asserts the equipment list endpoint generates a bounded number of SQL queries (use MiniProfiler or EF Core's logging in tests).

**Warning signs:**
- `UseLazyLoadingProxies()` is called in `DbContext` configuration
- Entity navigation properties are accessed outside of the original query scope
- No explicit `.Include()` calls in repository/service queries

**Phase to address:** Phase 1 (data access layer) — establish the projection pattern before building the first list endpoint.

---

## Minor Pitfalls

Lower-severity issues that create friction but do not cause data loss or rewrites.

---

### Pitfall 11: JWT Tokens Without Refresh Strategy

**What goes wrong:** The admin logs in, gets a JWT, and the token has a long expiry (e.g., 24 hours) to avoid re-login hassle. A compromised token is valid for a full day. Alternatively, tokens expire mid-session and the admin loses unsaved work without warning.

**Prevention:**
- Use short-lived access tokens (15–30 minutes) with refresh tokens (7–30 days).
- Implement a silent refresh in the Angular `AuthInterceptor` — refresh the access token automatically before it expires, so the admin never sees a login prompt mid-work.
- Store the refresh token in an `HttpOnly` cookie, not in localStorage, to prevent XSS theft.

**Phase to address:** Phase 1 (authentication setup).

---

### Pitfall 12: No Server-Side Validation for Business Rules (Trusting Angular Forms)

**What goes wrong:** Validation rules (required serial number, valid status transition, non-negative penalty amount) exist only in Angular reactive form validators. The API endpoint accepts any valid JSON and inserts it without re-checking.

**Prevention:**
- Validate all business rules in the ASP.NET Core application layer (use FluentValidation for clean separation). Angular validation is UX sugar, not security.
- Return structured 400 responses with field-level error details that Angular can map back to form controls.

**Phase to address:** Phase 1 (API design) — establish the validation pipeline early.

---

### Pitfall 13: Date/Time Storage Without Timezone Consideration

**What goes wrong:** Dates are stored as local server time (Vietnam UTC+7). Reports run on a server with a different timezone setting, or the company eventually hosts on UTC cloud — all timestamps shift by 7 hours, breaking audit chronology.

**Prevention:**
- Store all timestamps as UTC in the database (`DateTime` with `Kind = DateTimeKind.Utc`).
- Convert to local time (UTC+7) only in the frontend display layer.
- In EF Core, use `DateTime` columns configured with `ValueConverter` to enforce UTC, or use `DateTimeOffset`.

**Phase to address:** Phase 1 (domain model) — fix this after data exists requires a data migration.

---

### Pitfall 14: Maintenance Scheduling Without Notification Mechanism

**What goes wrong:** Maintenance due dates are stored but nothing notifies the admin when equipment is overdue. The maintenance scheduling feature is built but never actually used because the admin has no reason to open that screen unprompted.

**Prevention:**
- Before building the full maintenance scheduling UI, validate whether the admin actually wants notifications. A simple dashboard widget showing "X items overdue for maintenance" is sufficient and provides value without building a notification system.
- Do not build email notifications in v1 unless specifically requested — they add infrastructure complexity (SMTP config, email templates) for uncertain value.

**Phase to address:** Phase 3 (maintenance module) — check with stakeholders before adding automated alerting.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Domain model design | Two export flows merged into one table | Separate tables from day one |
| Equipment catalog + image upload | Images in wwwroot or DB blob | Filesystem path + dedicated serve endpoint |
| Authentication setup | Long-lived JWT, no refresh | Short JWT + refresh token + silent refresh interceptor |
| Assignment (employee export) | State transitions in controllers | Stateless-based state machine service |
| Assignment (project export) | Reusing employee assignment logic | Separate service classes, separate DB tables |
| Financial tracking | Financial records joined to mutable equipment | Append-only ledger with denormalized fields |
| Report generation | Synchronous generation blocking HTTP thread | Background worker for large reports |
| Report generation | N+1 queries for report data | Projection queries with explicit includes |
| Maintenance module | Building notifications without validating need | Dashboard widget first, notifications only if asked |
| Frontend state management | Component-local state causing stale data | Shared Angular services with BehaviorSubject/Signals |

---

## Sources

- EF Core soft delete and global query filter pitfalls: https://codewithmukesh.com/blog/soft-deletes-efcore/ | https://barretblake.dev/posts/development/2026/03/ef-core-global-query-filters/
- EF Core concurrency handling: https://learn.microsoft.com/en-us/ef/core/saving/concurrency | https://code-maze.com/aspnetcore-webapi-optimistic-concurrency/
- Stateless state machine library for .NET: https://github.com/dotnet-state-machine/stateless
- ASP.NET Core file upload best practices: https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads
- Report generation background jobs: https://boldsign.com/blogs/aspnet-core-background-jobs-hosted-services-hangfire-quartz/
- Angular state management 2025: https://nx.dev/blog/angular-state-management-2025
- Audit trail design patterns: https://medium.com/techtofreedom/4-common-designs-of-audit-trail-tracking-data-changes-in-databases-c894b7bb6d18
- Asset tracking common mistakes: https://cpcongroup.com/insights/5-common-asset-tracking-mistakes-and-how-to-avoid-them/
- ClosedXML performance guide: https://github.com/ClosedXML/ClosedXML/wiki/Performance-Guide
