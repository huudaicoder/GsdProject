# Roadmap: Hệ thống Quản lý Kho Thiết Bị Công Ty

**Project:** Company Equipment/Asset Management System
**Stack:** ABP Framework Community 9.x (backend) + Angular 19 (frontend)
**Granularity:** Fine-grained (1 feature per phase)
**Total v1 Requirements:** 38
**Coverage:** 38/38 (100%)

---

## Phases

- [ ] **Phase 1: Admin Login + JWT + Audit** — Secure login, session persistence, ABP audit logging configured
- [ ] **Phase 2: Equipment Categories** — Reference data CRUD for equipment categories
- [ ] **Phase 3: Suppliers** — Reference data CRUD for equipment suppliers
- [ ] **Phase 4: Departments** — Reference data CRUD for company departments
- [ ] **Phase 5: Equipment Catalog** — Full equipment CRUD with search, filters, status display, and photo upload
- [ ] **Phase 6: Employee Management** — Employee records linked to departments
- [ ] **Phase 7: Project Management** — Project records for equipment allocation
- [ ] **Phase 8: Import Flow** — Inbound receipts from suppliers with automatic equipment creation
- [ ] **Phase 9: Supplier Payments** — Payment tracking and import receipt history
- [ ] **Phase 10: Employee Assignment + Damage Penalty** — Assign equipment to employees, record returns, and record damage fines
- [ ] **Phase 11: Project Allocation** — Allocate equipment to projects and record returns
- [ ] **Phase 12: Maintenance** — Maintenance logs, scheduling, and overdue alerts
- [ ] **Phase 13: Liquidation** — Record equipment disposal and retirement
- [ ] **Phase 14: Financial Summary** — Aggregated financial dashboard (costs, revenue, penalties)
- [ ] **Phase 15: Dashboard** — KPI overview cards for warehouse status at a glance
- [ ] **Phase 16: Reports** — Inventory, history, and department reports
- [ ] **Phase 17: Export** — Excel and PDF export for all reports

---

## Phase Details

### Phase 1: Admin Login + JWT + Audit
**Goal**: Admin can securely log in with username/password, their session persists across browser refresh, and all write operations are automatically logged
**Depends on**: Nothing (first phase — includes project scaffold)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. Admin enters valid credentials → receives JWT token → redirected to dashboard
  2. After browser refresh, admin is still logged in (token read from localStorage, validated against expiry)
  3. All non-auth API endpoints return 401 when called without a valid JWT token
  4. The login page renders with split layout (branding left, form right) with specific Vietnamese error messages for wrong username vs wrong password
  5. After any write operation (POST/PUT/DELETE), an ABP AuditLog record exists with: userId, entity type, entity ID, action type, timestamp, old values (JSON), new values (JSON) — created atomically, no orphan on rollback
**Plans:** 2 plans
Plans:
- [x] 01-01-PLAN.md — Backend: ABP scaffold + PostgreSQL + OpenIddict ROPC + 8h JWT + Vietnamese error messages + Audit Logging
- [ ] 01-02-PLAN.md — Frontend: Angular 19 scaffold + AuthService + login page + app shell + sidebar + dashboard placeholder
**UI hint**: yes

### Phase 2: Equipment Categories
**Goal**: Admin can manage equipment categories (IT, Văn phòng, Công nghiệp, etc.) through a table UI with search and modal dialogs
**Depends on**: Phase 1
**Requirements**: EQP-04
**Success Criteria** (what must be TRUE):
  1. Admin can view a paginated, searchable list of categories at /categories
  2. Admin can add a category via modal dialog with name (required) and description (optional)
  3. Admin can edit any category; changes saved without page navigation
  4. Admin cannot delete a category that is linked to any equipment — system returns specific error "Không thể xóa danh mục này — đang được sử dụng bởi X thiết bị"
**Plans**: TBD
**UI hint**: yes

### Phase 3: Suppliers
**Goal**: Admin can manage supplier records (name, address, contact info) through a table UI with search and modal dialogs
**Depends on**: Phase 2
**Requirements**: SUP-01
**Success Criteria** (what must be TRUE):
  1. Admin can view a paginated, searchable list of suppliers at /suppliers
  2. Admin can add/edit a supplier with name (required), address (optional), contact info (optional)
  3. Admin can delete a supplier (no restriction in Phase 3 — import receipt check deferred to Phase 8)
**Plans**: TBD
**UI hint**: yes

### Phase 4: Departments
**Goal**: Admin can manage company department records through a table UI with search and modal dialogs
**Depends on**: Phase 3
**Requirements**: EMP-02
**Success Criteria** (what must be TRUE):
  1. Admin can view a paginated, searchable list of departments at /departments
  2. Admin can add/edit a department with name (required)
  3. Admin cannot delete a department linked to any employee — system returns specific error "Không thể xóa phòng ban này — đang được sử dụng bởi X nhân viên"
**Plans**: TBD
**UI hint**: yes

### Phase 5: Equipment Catalog
**Goal**: Admin has a complete, searchable equipment catalog where every asset has a profile with full metadata, a photo, and a visible current status
**Depends on**: Phase 4
**Requirements**: EQP-01, EQP-02, EQP-03, EQP-05, EQP-06
**Success Criteria** (what must be TRUE):
  1. Admin can create an equipment record with: name, serial number, category, purchase date, purchase price, notes — record appears in list immediately
  2. Admin can upload a photo for equipment and view it on the equipment detail page
  3. Admin can edit any equipment field; can delete equipment only if status is "Trong kho"
  4. Admin can search by name or serial and filter by status, category, or department
  5. Every equipment record shows its current status (Trong kho / Đang bàn giao / Trong dự án / Bảo trì / Đã thanh lý) on both list and detail views
**Plans**: TBD
**UI hint**: yes

### Phase 6: Employee Management
**Goal**: Admin can manage employee records linked to departments, ready for use in assignment flows
**Depends on**: Phase 5
**Requirements**: EMP-01
**Success Criteria** (what must be TRUE):
  1. Admin can create/edit/delete employee records with: name, department, contact info (email, phone), position
  2. Employee list shows name, department, and contact; searchable by name, filterable by department
  3. Deleting an employee with active equipment assignments is blocked with an appropriate error
**Plans**: TBD
**UI hint**: yes

### Phase 7: Project Management
**Goal**: Admin can manage company project records, ready for use in project allocation flows
**Depends on**: Phase 6
**Requirements**: PROJ-01
**Success Criteria** (what must be TRUE):
  1. Admin can create/edit/delete project records with: name, description, start date, end date (optional)
  2. Project list shows name, dates, and status (Active / Completed); searchable by name
  3. Deleting a project with active equipment allocations is blocked with an appropriate error
**Plans**: TBD
**UI hint**: yes

### Phase 8: Import Flow
**Goal**: Admin can receive equipment from a supplier by creating an inbound receipt that automatically creates individual equipment records upon confirmation
**Depends on**: Phase 7
**Requirements**: SUP-02, IMP-01, IMP-02
**Success Criteria** (what must be TRUE):
  1. Admin can create an inbound receipt linking a supplier (SUP-02) to a list of equipment items with: unit price, quantity, invoice number, receipt date
  2. When the receipt is confirmed, the system auto-creates individual equipment records in "Trong kho" status — one record per unit, no manual creation needed
  3. Each auto-created equipment record inherits: name, category, purchase price (unit cost), supplier from the receipt
**Plans**: TBD
**UI hint**: yes

### Phase 9: Supplier Payments
**Goal**: Admin can track payments made to suppliers for inbound receipts and view full import history
**Depends on**: Phase 8
**Requirements**: IMP-03, IMP-04
**Success Criteria** (what must be TRUE):
  1. Admin can record a supplier payment against an existing inbound receipt: amount paid, date, remaining balance auto-calculated and displayed
  2. Admin can view the full list of all inbound receipts and filter by date range to find receipts from any period
**Plans**: TBD
**UI hint**: yes

### Phase 10: Employee Assignment + Damage Penalty
**Goal**: Admin can assign In-Stock equipment to employees, record returns, and optionally record damage fines when equipment is returned damaged
**Depends on**: Phase 9
**Requirements**: ASNE-01, ASNE-02, ASNE-03
**Success Criteria** (what must be TRUE):
  1. Admin can assign an In-Stock equipment to a named employee (date, condition at handover, notes); equipment status immediately changes to "Đang bàn giao" and cannot be assigned again
  2. Admin can record employee return (return date, condition at return); equipment status reverts to "Trong kho"
  3. Attempting to assign equipment that is not In-Stock returns a clear error
  4. When recording an employee return, admin can optionally record a damage penalty: amount, collection date, damage description — linked to that specific assignment and visible in assignment history
**Plans**: TBD
**UI hint**: yes

### Phase 11: Project Allocation
**Goal**: Admin can allocate In-Stock equipment to company projects and record when equipment is returned from projects
**Depends on**: Phase 10
**Requirements**: PROJ-02, PROJ-03
**Success Criteria** (what must be TRUE):
  1. Admin can allocate an In-Stock equipment to a project (date, notes); equipment status immediately changes to "Trong dự án"
  2. Admin can record return from project (return date, condition); equipment status reverts to "Trong kho"
  3. Attempting to allocate equipment that is not In-Stock returns a clear error
**Plans**: TBD
**UI hint**: yes

### Phase 12: Maintenance
**Goal**: Admin can log repair events and schedule preventive maintenance, with equipment status reflecting maintenance state and overdue items surfaced automatically
**Depends on**: Phase 11
**Requirements**: MAINT-01, MAINT-02, MAINT-03
**Success Criteria** (what must be TRUE):
  1. Admin can log a maintenance event (date, description, repair cost, technician); equipment status changes to "Bảo trì" while event is open
  2. Admin can set a next scheduled maintenance date on any equipment
  3. The system displays a list of equipment that is due or overdue for maintenance based on the scheduled date
**Plans**: TBD
**UI hint**: yes

### Phase 13: Liquidation
**Goal**: Admin can permanently retire equipment by recording its disposal with sale revenue and reason
**Depends on**: Phase 12
**Requirements**: MAINT-04
**Success Criteria** (what must be TRUE):
  1. Admin can record equipment disposal: liquidation date, sale price (may be 0), reason
  2. Equipment status permanently changes to "Đã thanh lý" — no further transitions possible
  3. Attempting to liquidate equipment that is not In-Stock returns a clear error
**Plans**: TBD
**UI hint**: yes

### Phase 14: Financial Summary
**Goal**: Admin can view a consolidated financial picture showing all money flows — purchase costs, liquidation revenue, damage penalties — with filtering options
**Depends on**: Phase 13
**Requirements**: FIN-01, FIN-02, FIN-03, FIN-04
**Success Criteria** (what must be TRUE):
  1. Admin can view total equipment purchase costs filterable by supplier, category, and time period (FIN-01)
  2. Admin can view total liquidation revenue (FIN-02)
  3. Admin can view total damage penalties collected from employees (FIN-03)
  4. Admin can view a net balance summary: total costs vs total revenue (purchase + liquidation + penalties) (FIN-04)
**Plans**: TBD
**UI hint**: yes

### Phase 15: Dashboard
**Goal**: Admin lands on a dashboard that shows warehouse status at a glance with key performance indicators
**Depends on**: Phase 14
**Requirements**: RPT-01
**Success Criteria** (what must be TRUE):
  1. Dashboard displays KPI cards: total equipment count, currently assigned to employees, currently in projects, under maintenance, total inventory value at cost
  2. KPI counts are accurate and refresh on page load
**Plans**: TBD
**UI hint**: yes

### Phase 16: Reports
**Goal**: Admin can view detailed reports — current inventory by category/status, inbound/outbound history by date range, equipment by department, and per-device assignment history
**Depends on**: Phase 15
**Requirements**: RPT-02, RPT-03, RPT-04, RPT-05
**Success Criteria** (what must be TRUE):
  1. Current inventory report shows equipment count grouped by category and status (RPT-02)
  2. Inbound/outbound history report is filterable by any date range and shows all import/export events (RPT-03)
  3. Department equipment report shows equipment currently in use broken down by department (RPT-04)
  4. Admin can view the complete assignment history (who had it, when) for any individual device (RPT-05)
**Plans**: TBD
**UI hint**: yes

### Phase 17: Export
**Goal**: Admin can download any report as an Excel (.xlsx) or PDF file
**Depends on**: Phase 16
**Requirements**: RPT-06, RPT-07
**Success Criteria** (what must be TRUE):
  1. Every report page has an "Export Excel" button that downloads a correctly formatted .xlsx file (RPT-06)
  2. Every report page has an "Export PDF" button that downloads a readable PDF (RPT-07)
  3. Exported files contain the same data as the on-screen report, including any active filters
**Plans**: TBD
**UI hint**: no

---

## Progress

| Phase | Name | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1 | Admin Login + JWT + Audit | 0/2 | Planning complete | - |
| 2 | Equipment Categories | 0/0 | Not started | - |
| 3 | Suppliers | 0/0 | Not started | - |
| 4 | Departments | 0/0 | Not started | - |
| 5 | Equipment Catalog | 0/0 | Not started | - |
| 6 | Employee Management | 0/0 | Not started | - |
| 7 | Project Management | 0/0 | Not started | - |
| 8 | Import Flow | 0/0 | Not started | - |
| 9 | Supplier Payments | 0/0 | Not started | - |
| 10 | Employee Assignment + Damage Penalty | 0/0 | Not started | - |
| 11 | Project Allocation | 0/0 | Not started | - |
| 12 | Maintenance | 0/0 | Not started | - |
| 13 | Liquidation | 0/0 | Not started | - |
| 14 | Financial Summary | 0/0 | Not started | - |
| 15 | Dashboard | 0/0 | Not started | - |
| 16 | Reports | 0/0 | Not started | - |
| 17 | Export | 0/0 | Not started | - |

Overall: ░░░░░░░░░░░░░░░░░ 0/17 phases

---

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 1 |
| EQP-04 | Phase 2 |
| SUP-01 | Phase 3 |
| EMP-02 | Phase 4 |
| EQP-01 | Phase 5 |
| EQP-02 | Phase 5 |
| EQP-03 | Phase 5 |
| EQP-05 | Phase 5 |
| EQP-06 | Phase 5 |
| EMP-01 | Phase 6 |
| PROJ-01 | Phase 7 |
| SUP-02 | Phase 8 |
| IMP-01 | Phase 8 |
| IMP-02 | Phase 8 |
| IMP-03 | Phase 9 |
| IMP-04 | Phase 9 |
| ASNE-01 | Phase 10 |
| ASNE-02 | Phase 10 |
| ASNE-03 | Phase 10 |
| PROJ-02 | Phase 11 |
| PROJ-03 | Phase 11 |
| MAINT-01 | Phase 12 |
| MAINT-02 | Phase 12 |
| MAINT-03 | Phase 12 |
| MAINT-04 | Phase 13 |
| FIN-01 | Phase 14 |
| FIN-02 | Phase 14 |
| FIN-03 | Phase 14 |
| FIN-04 | Phase 14 |
| RPT-01 | Phase 15 |
| RPT-02 | Phase 16 |
| RPT-03 | Phase 16 |
| RPT-04 | Phase 16 |
| RPT-05 | Phase 16 |
| RPT-06 | Phase 17 |
| RPT-07 | Phase 17 |

**Total mapped: 38/38**

---
*Roadmap created: 2026-04-13*
*Restructured: 2026-04-15 — 6 phases → 19 phases (1 feature per phase)*
*Restructured: 2026-04-15 — 19 phases → 17 phases (ABP audit merged into Phase 1; damage penalty merged into employee assignment)*
