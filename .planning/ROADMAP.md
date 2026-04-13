# Roadmap: Hệ thống Quản lý Kho Thiết Bị Công Ty

**Project:** Company Equipment/Asset Management System
**Stack:** ASP.NET Core (backend) + Angular (frontend)
**Granularity:** Standard
**Total v1 Requirements:** 38
**Coverage:** 38/38 (100%)

---

## Phases

- [ ] **Phase 1: Foundation** - Project scaffold, Clean Architecture, DB schema, JWT auth, and reference data (Category, Department, Supplier)
- [ ] **Phase 2: Equipment Catalog & Core Entities** - Full equipment CRUD with photo upload, employee management, project management
- [ ] **Phase 3: Import Flow** - Inbound receipt from supplier, automatic equipment record creation, supplier payment tracking
- [ ] **Phase 4: Assignment Transaction Engine** - Employee assignment/return with damage penalty, project allocation/return
- [ ] **Phase 5: Maintenance, Liquidation & Financial Tracking** - Maintenance records, disposal, and aggregated financial summaries
- [ ] **Phase 6: Reports & Dashboard** - Dashboard KPIs, inventory/history/department reports, Excel and PDF export

---

## Phase Details

### Phase 1: Foundation
**Goal**: Admin can securely log in and the system has a working backend/frontend scaffold with reference data management (categories, departments, suppliers)
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, EQP-04, SUP-01, EMP-02
**Success Criteria** (what must be TRUE):
  1. Admin can log in with username and password and receive a JWT token that persists across browser refresh without re-logging in
  2. All API endpoints return 401 Unauthorized when called without a valid JWT token
  3. The system records an audit log entry (who, what action, when, old/new values) for every write operation performed by admin
  4. Admin can add, edit, and delete equipment categories (e.g., IT, Van phong, Cong nghiep) through the Angular UI
  5. Admin can add, edit, and delete suppliers and departments through the Angular UI
**Plans**: TBD
**UI hint**: yes

### Phase 2: Equipment Catalog & Core Entities
**Goal**: Admin has a complete, searchable equipment catalog where every asset has a profile with status, photo, and full metadata; employee and project records exist ready for transactions
**Depends on**: Phase 1
**Requirements**: EQP-01, EQP-02, EQP-03, EQP-05, EQP-06, EMP-01, PROJ-01
**Success Criteria** (what must be TRUE):
  1. Admin can create a new equipment record with name, serial number, category, purchase date, purchase price, and notes, and the record appears in the equipment list
  2. Admin can upload a photo for a piece of equipment and view it on the equipment detail page
  3. Admin can edit any equipment field and delete equipment that is currently In Stock
  4. Admin can search equipment by name or serial number and filter by status, category, or department
  5. Every equipment record displays its current status (Trong kho / Dang ban giao / Trong du an / Bao tri / Da thanh ly) clearly on the list and detail views
  6. Admin can create, edit, and delete employee records (name, department, contact) and project records (name, dates, description)
**Plans**: TBD
**UI hint**: yes

### Phase 3: Import Flow
**Goal**: Admin can receive equipment from a supplier through an inbound receipt that automatically creates equipment records and tracks supplier payment status
**Depends on**: Phase 2
**Requirements**: SUP-02, IMP-01, IMP-02, IMP-03, IMP-04
**Success Criteria** (what must be TRUE):
  1. Admin can create an inbound receipt linking a supplier to a list of equipment items with unit price, quantity, invoice number, and receipt date
  2. When an inbound receipt is confirmed, the system automatically creates individual equipment records in "Trong kho" status — no manual creation needed
  3. Admin can record a supplier payment (amount paid, date, remaining balance) against an existing inbound receipt
  4. Admin can view the full history of all inbound receipts and filter by date range to find receipts from any period
**Plans**: TBD
**UI hint**: yes

### Phase 4: Assignment Transaction Engine
**Goal**: Admin can track every equipment movement — assigning devices to employees and projects, recording returns, and collecting damage penalties — with the equipment status automatically reflecting each transition
**Depends on**: Phase 3
**Requirements**: ASNE-01, ASNE-02, ASNE-03, PROJ-02, PROJ-03
**Success Criteria** (what must be TRUE):
  1. Admin can assign an In-Stock equipment to a named employee; the equipment status immediately changes to "Dang ban giao" and cannot be double-assigned
  2. Admin can record an employee return; the equipment status reverts to "Trong kho" and the return date and condition are saved
  3. Admin can record a damage penalty on return — specifying amount, collection date, and damage description — and the record is saved and linked to that assignment
  4. Admin can allocate an In-Stock equipment to a project; the equipment status changes to "Trong du an"
  5. Admin can record equipment returned from a project back to In-Stock with return date and condition
**Plans**: TBD
**UI hint**: yes

### Phase 5: Maintenance, Liquidation & Financial Tracking
**Goal**: Admin can manage the full end-of-life and upkeep cycle — recording repairs, scheduling preventive maintenance, disposing of assets — and the system provides a consolidated financial picture of all money flows
**Depends on**: Phase 4
**Requirements**: MAINT-01, MAINT-02, MAINT-03, MAINT-04, FIN-01, FIN-02, FIN-03, FIN-04
**Success Criteria** (what must be TRUE):
  1. Admin can log a breakdown or repair event for a device (date, description, repair cost, technician) and the equipment status changes to "Bao tri" while maintenance is open
  2. Admin can set a next scheduled maintenance date on any equipment, and the system displays a list of devices that are due or overdue for maintenance
  3. Admin can record equipment disposal (liquidation date, sale price, reason) and the equipment status changes to "Da thanh ly" permanently
  4. Admin can view a financial summary showing: total equipment purchase costs (filterable by supplier, category, time period), total liquidation revenue, total damage penalties collected, and a net cost-vs-revenue balance
**Plans**: TBD
**UI hint**: yes

### Phase 6: Reports & Dashboard
**Goal**: Admin sees the full state of the warehouse at a glance on the dashboard and can generate, view, and export any report as Excel or PDF
**Depends on**: Phase 5
**Requirements**: RPT-01, RPT-02, RPT-03, RPT-04, RPT-05, RPT-06, RPT-07
**Success Criteria** (what must be TRUE):
  1. Admin lands on a Dashboard with KPI cards showing: total equipment count, currently assigned to employees, currently in projects, under maintenance, and total inventory value at cost
  2. Admin can view a current inventory report showing equipment counts grouped by category and status
  3. Admin can view an inbound/outbound history report filtered by any date range, showing all import and export events in that period
  4. Admin can view a report of equipment currently in use broken down by department, and can view the complete assignment history for any individual device
  5. Admin can download any report as an Excel file (.xlsx) or a PDF file — both export options are available on every report page
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/0 | Not started | - |
| 2. Equipment Catalog & Core Entities | 0/0 | Not started | - |
| 3. Import Flow | 0/0 | Not started | - |
| 4. Assignment Transaction Engine | 0/0 | Not started | - |
| 5. Maintenance, Liquidation & Financial Tracking | 0/0 | Not started | - |
| 6. Reports & Dashboard | 0/0 | Not started | - |

---

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 1 |
| EQP-04 | Phase 1 |
| SUP-01 | Phase 1 |
| EMP-02 | Phase 1 |
| EQP-01 | Phase 2 |
| EQP-02 | Phase 2 |
| EQP-03 | Phase 2 |
| EQP-05 | Phase 2 |
| EQP-06 | Phase 2 |
| EMP-01 | Phase 2 |
| PROJ-01 | Phase 2 |
| SUP-02 | Phase 3 |
| IMP-01 | Phase 3 |
| IMP-02 | Phase 3 |
| IMP-03 | Phase 3 |
| IMP-04 | Phase 3 |
| ASNE-01 | Phase 4 |
| ASNE-02 | Phase 4 |
| ASNE-03 | Phase 4 |
| PROJ-02 | Phase 4 |
| PROJ-03 | Phase 4 |
| MAINT-01 | Phase 5 |
| MAINT-02 | Phase 5 |
| MAINT-03 | Phase 5 |
| MAINT-04 | Phase 5 |
| FIN-01 | Phase 5 |
| FIN-02 | Phase 5 |
| FIN-03 | Phase 5 |
| FIN-04 | Phase 5 |
| RPT-01 | Phase 6 |
| RPT-02 | Phase 6 |
| RPT-03 | Phase 6 |
| RPT-04 | Phase 6 |
| RPT-05 | Phase 6 |
| RPT-06 | Phase 6 |
| RPT-07 | Phase 6 |

**Total mapped: 38/38**

---
*Roadmap created: 2026-04-13*
