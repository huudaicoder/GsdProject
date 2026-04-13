# Feature Landscape: Company Equipment/Asset Management System

**Domain:** Enterprise Equipment/Asset Lifecycle Management (single warehouse, admin-only)
**Researched:** 2026-04-13
**Context:** 200+ employees, thousands of devices, warehouse managers only, ASP.NET Core + Angular

---

## Table Stakes

Features users (warehouse admins) always expect. Absence makes the system feel incomplete or unusable compared to even a well-organized spreadsheet.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Equipment catalog with full details | Can't manage what you can't see — name, serial, category, purchase date, purchase price, photos | Low | Photos are critical for identification; serial uniquely identifies an asset |
| Per-asset status indicator | Admins need instant answer to "where is this item right now?" | Low | States: In Stock / Assigned to Employee / In Project / Under Maintenance / Liquidated |
| Equipment categorization | Filtering and reporting collapse without categories (IT, Office, Industrial, etc.) | Low | Needs add/rename/delete category management |
| Search and filter across catalog | With thousands of devices, no search = unusable | Low | Filter by status, category, assignee, date range |
| Inbound receipt (import from supplier) | Core event that creates assets in the system | Medium | Needs: supplier name, quantity, unit cost, invoice reference, receipt date |
| Supplier cost recording at inbound | Financial compliance — every purchase must be traceable | Low | Tied to inbound receipt; amounts feed financial reports |
| Employee assignment (checkout) | Primary workflow — assigning a device to a named person | Medium | Record: which device, which employee, date, condition at checkout, notes |
| Employee return (check-in) | Symmetric to checkout; closes the assignment loop | Medium | Record: return date, condition at return; trigger penalty flow if damaged |
| Project assignment and return | Second checkout path — devices deployed for company projects, expected back | Medium | Same check-in/check-out logic but linked to a project entity, not a person |
| Damage recording and penalty tracking | Financially critical — admins need to document damage and record that a penalty was collected | Medium | Link to specific assignment; record penalty amount, date collected |
| Maintenance event log | Know what was repaired, when, by whom, cost | Medium | Per-device history of incidents and repairs |
| Preventive maintenance scheduling | Admins need to plan routine service before failures occur | Medium | Schedule by date or interval; alert when due |
| Overdue maintenance alerts | Without reminders, scheduled maintenance gets missed silently | Low | Surface on dashboard; email/notification optional in v1 |
| Liquidation recording | End-of-life disposal — record asset retired, disposal revenue if sold | Low | Changes status to Liquidated; records sale amount for financial tracking |
| Current inventory report | "What do we have right now, and where is it?" — most-run report in any warehouse | Medium | Filterable by category, status, department; exportable |
| Assignment history report | "Who had this device and when?" — audit and accountability | Medium | Per device and per employee views |
| Inbound/outbound history report by period | Month-end and quarterly reviews; financial reconciliation | Medium | Filter by date range; show totals |
| Financial summary report | Total purchase cost, total liquidation revenue, total penalties collected | Medium | Feeds cost management and budget planning |
| Excel and PDF export for all reports | Management always wants printable/submittable documents | Medium | Minimum: download button per report page |
| Dashboard with key counts | First screen admins see — total assets, currently assigned, in maintenance, value at cost | Low | 4–6 KPI cards plus recent activity feed |
| Audit trail on all changes | "Who changed what and when?" — essential for accountability in shared admin systems | Medium | Log user, action, timestamp, old/new values on all write operations |
| Admin authentication | System has financial data; access must be gated | Low | Username/password login; session management; no AD integration required |
| Equipment photo upload and view | Visual identification is faster than reading serial numbers | Low | Upload on create/edit; thumbnail in list; full view on detail page |

---

## Differentiators

Features beyond baseline that make the system noticeably better or more valuable than a spreadsheet. Not expected on day one, but strongly valued once baseline is solid.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Bulk import of equipment via CSV/Excel | When migrating from spreadsheets or receiving large supplier deliveries, manual entry of 500 items is a dealbreaker | High | Column mapping UI; validation errors report; rollback on partial failure |
| Department-level reporting | "What equipment does the Sales department have?" — useful for cost allocation and planning | Medium | Requires employees to have a department field |
| Asset utilization view | Show assets that have been sitting in stock unused for 90+ days — prompts reallocation or liquidation decisions | Medium | Simple query: status = In Stock AND last_movement > N days |
| Maintenance cost tracking per asset | Total repair spend per device feeds ROI decisions (repair vs replace) | Medium | Sum repair invoices linked to each asset |
| Overdue assignment alerts | Flag assets assigned for longer than expected (e.g., project ended but equipment not returned) | Medium | Due-date field on project assignments; surface overdue items |
| Condition tracking on return | "Good / Minor Damage / Major Damage" recorded at check-in — feeds damage analytics | Low | Dropdown at return; required if damage penalty is triggered |
| Equipment age and warranty tracking | Know when warranties expire; flag out-of-warranty devices before costly repairs | Medium | Warranty expiry date field; alert N days before expiry |
| Printable assignment receipt | A signed PDF that the admin hands to the employee at checkout — provides legal paper trail | Medium | Generated from assignment data; includes equipment details, employee name, date, condition |
| Maintenance vendor tracking | Record which repair shop or technician handled each maintenance event | Low | Free text or linked vendor entity; low complexity, high usefulness for repeat vendors |
| QR code / barcode label generation | Print labels to stick on devices; scan to look up the device instantly | High | Nice-to-have; out of scope for v1 per PROJECT.md but clear upgrade path |
| Dashboard trend charts | Equipment added per month, maintenance events per quarter — visual trends for management reviews | Medium | Requires charting library; adds polish but not operational necessity |
| Supplier management module | Track suppliers with contacts, payment terms, delivery lead times | Low | Supplement to inbound receipts; optional reference data |

---

## Anti-Features

Features to deliberately NOT build in v1. Each has a specific reason for deferral or permanent exclusion.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Employee self-service portal | PROJECT.md explicitly out of scope; adds auth complexity, request/approval workflows, and UI surface area that doubles build time | Admin manually processes all requests; employees call or email warehouse |
| Multi-warehouse support | Single warehouse in v1; adding multi-location tracking multiplies data model complexity and reporting branching | Design `location` field as optional FK to warehouse entity — defer population to v2 |
| Mobile native app | Warehouse admins use desktop; PROJECT.md out of scope | Responsive web design is sufficient for occasional tablet use |
| Active Directory / SSO integration | PROJECT.md explicitly excluded; coupling to AD creates infrastructure dependency and deployment complexity | Username/password login; AD can be added as a future auth provider |
| IoT sensor integration / real-time location | Enterprise EAM capability far beyond scope; requires physical hardware deployment | Manual status updates by admin; accurate enough for the use case |
| AI predictive maintenance | Requires historical sensor data that doesn't exist yet; adds ML infrastructure | Schedule-based preventive maintenance covers the need |
| Automated depreciation calculation | Accounting-grade depreciation (MACRS, straight-line, etc.) belongs in ERP/accounting software, not an ops system | Track purchase cost and liquidation revenue; leave depreciation to accounting team |
| Approval workflows / multi-step authorization | No multi-user roles in v1; approval chains require role hierarchy, notification system, and state machines | Single admin takes direct action; log the action in audit trail |
| Barcode/QR code scanning | PROJECT.md defers to post-v1; requires hardware (scanner or mobile camera) integration and label printing | Manual lookup by serial or name; add scan in v2 after core is stable |
| Integration with ERP / accounting systems | Complex, company-specific, high risk of scope creep | Export to Excel; accounting team imports manually |
| Fleet / GPS vehicle tracking | Different domain entirely | Out of scope |
| Software license management | IT asset category; different lifecycle model | Can be tracked as generic "asset" with notes field; no special license logic |
| Employee self-service repair requests | Requires employee-facing UI and ticketing workflow | Admin logs maintenance events directly |

---

## Feature Dependencies

Understanding which features must exist before others can work:

```
Equipment Catalog (CRUD + categories + photos)
  └─► Inbound Receipt (imports create catalog entries)
        └─► Employee Assignment (checkout requires catalog entry)
              └─► Damage Penalty Tracking (penalty requires an active/past assignment)
              └─► Employee Return (check-in requires an active assignment)
        └─► Project Assignment (same dependency as Employee Assignment)
              └─► Project Return
  └─► Maintenance Scheduling (maintenance requires a device to exist)
        └─► Maintenance Event Log
        └─► Overdue Maintenance Alerts (requires scheduled date on event)
  └─► Liquidation Recording (requires device to exist and not already liquidated)

Admin Authentication
  └─► All write operations (protected)
  └─► Audit Trail (requires known user identity)

Inbound Receipt + Employee Return + Project Return + Damage Penalty + Liquidation
  └─► Financial Summary Report (aggregates all financial events)

All CRUD operations (Inbound, Assignment, Return, Maintenance, Liquidation)
  └─► Audit Trail

Inventory State (derived from all movements)
  └─► Dashboard KPI cards
  └─► Current Inventory Report
  └─► Assignment History Report
  └─► Department Report (requires employee → department link)
```

**Build order implication:** Equipment Catalog must be Phase 1. Inbound receipts establish the device pool. Assignment flows come next. Financial tracking is additive on top of those events. Reports are last because they read from all prior tables.

---

## MVP Recommendation

For a functional v1 that replaces a warehouse spreadsheet:

**Must ship:**
1. Equipment catalog — add / edit / delete / photo / status / category / search
2. Inbound receipt — record supplier purchase with cost
3. Employee assignment + return + damage penalty
4. Project assignment + return
5. Maintenance log — record incidents and repairs; basic schedule with overdue flag
6. Liquidation recording
7. Financial summary: purchase costs, liquidation revenue, penalties
8. Reports: current inventory, assignment history, inbound/outbound by period — Excel export
9. Dashboard: 4–6 KPI cards (total assets, assigned, in maintenance, total cost, overdue maintenance)
10. Admin login + full audit trail

**Defer to v2:**
- Bulk CSV import (useful, but manual entry workable for launch)
- Printable assignment receipts (PDF generation adds complexity; notes field substitutes temporarily)
- Department-level reporting (requires clean employee department data)
- Asset utilization analysis
- QR code / barcode scanning

---

## Sources

Research informed by:
- [Infraon: Top 10 Must-Have Asset Management System Requirements 2025](https://infraon.io/blog/requirements-of-asset-management-system/)
- [Cloudaware: 12 Must-Have Asset Management Software Features](https://cloudaware.com/blog/asset-management-software-features/)
- [Aptien: Equipment Checkout Software Features](https://aptien.com/en/equipment-checkout-software)
- [Cheqroom: Equipment Management Challenges](https://www.cheqroom.com/blog/3-equipment-management-challenges-tips/)
- [Alignops: 5 Must-Haves in Equipment Tracking](https://alignops.com/resources/guides/5-must-haves-in-an-equipment-tracking-and-management-solution)
- [GoWorkwize: Asset Management System Guide 2026](https://www.goworkwize.com/blog/asset-management-system)
- [GetApp: Best Asset Tracking with Import/Export 2025](https://www.getapp.com/operations-management-software/asset-tracking/f/data-import-export/)
- [Fexa: Asset Depreciation and Financial Reporting](https://fexa.io/blog/asset-depreciation-management-financial-reporting/)
- [itemit: Equipment Checkout Software](https://itemit.com/asset-tracking/equipment-checkout-software/)
