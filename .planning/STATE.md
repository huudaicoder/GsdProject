---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: None (roadmap restructured, planning not started)
current_plan: None
status: planning
last_updated: "2026-04-15"
progress:
  total_phases: 19
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State: Hệ thống Quản lý Kho Thiết Bị Công Ty

**Last updated:** 2026-04-13
**Session:** Initial roadmap creation

---

## Project Reference

**Core Value:** Quản trị viên kho có thể biết ngay thiết bị nào đang ở đâu, ai đang dùng, và trạng thái tài chính liên quan — để không bao giờ mất dấu tài sản công ty.

**Stack:** ASP.NET Core (backend) + Angular (frontend)
**Architecture:** Monolithic, Clean Architecture internals, REST API + Angular SPA
**Database:** SQL Server or PostgreSQL (single database)

---

## Current Position

**Milestone:** M1 (v1 — full system)
**Current Phase:** None (roadmap restructured 2026-04-15 — planning not started)
**Current Plan:** None
**Status:** Ready to plan Phase 1

**Progress:**

```
Phase 1:  Admin Login + JWT          [ Not started ]
Phase 2:  Audit Trail                [ Not started ]
Phase 3:  Equipment Categories       [ Not started ]
Phase 4:  Suppliers                  [ Not started ]
Phase 5:  Departments                [ Not started ]
Phase 6:  Equipment Catalog          [ Not started ]
Phase 7:  Employee Management        [ Not started ]
Phase 8:  Project Management         [ Not started ]
Phase 9:  Import Flow                [ Not started ]
Phase 10: Supplier Payments          [ Not started ]
Phase 11: Employee Assignment        [ Not started ]
Phase 12: Damage Penalty             [ Not started ]
Phase 13: Project Allocation         [ Not started ]
Phase 14: Maintenance                [ Not started ]
Phase 15: Liquidation                [ Not started ]
Phase 16: Financial Summary          [ Not started ]
Phase 17: Dashboard                  [ Not started ]
Phase 18: Reports                    [ Not started ]
Phase 19: Export                     [ Not started ]

Overall: ░░░░░░░░░░░░░░░░░░░░ 0/19 phases
```

---

## Accumulated Context

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Monolithic deployment | Single warehouse, admin-only, ~200 employees — microservices add zero value |
| Single WarehouseTransaction table | Discriminator enum + nullable FKs; simplifies cross-type reports and history view |
| Equipment.Status stored explicitly | Never compute from transactions at query time — prevents performance issues and status drift |
| Soft delete for Equipment | Historical transactions must reference equipment rows; hard delete breaks audit trail |
| FinancialRecord as side effect | Created atomically with Import / Return-with-damage / Liquidation operations |
| JWT Bearer auth | Admin-only; no AD integration; stateless sessions with browser-side token storage |
| Separate Request/Response DTOs | Never expose domain entities directly to API; AutoMapper or manual mapping |
| Server-side pagination from day 1 | 1000+ equipment items; un-paginated lists will be slow |

### Key Patterns

- Service layer owns all Equipment.Status transitions (never from Controller)
- WarehouseTransaction is append-only (corrective transactions, never edits/deletes)
- All flows (import, assign, return) are atomic — EF Core SaveChanges wraps all side effects
- No layer skips its neighbor: Angular → Controller → Service → Repository → DbContext

### Phase Dependencies

```
Phase 1 (Login + JWT)
  └── Phase 2 (Audit Trail)
        └── Phase 3 (Categories)
              └── Phase 4 (Suppliers)
                    └── Phase 5 (Departments)
                          └── Phase 6 (Equipment Catalog)
                                └── Phase 7 (Employees)
                                      └── Phase 8 (Projects)
                                            └── Phase 9 (Import Flow)
                                                  └── Phase 10 (Supplier Payments)
                                                        └── Phase 11 (Employee Assignment)
                                                              └── Phase 12 (Damage Penalty)
                                                                    └── Phase 13 (Project Allocation)
                                                                          └── Phase 14 (Maintenance)
                                                                                └── Phase 15 (Liquidation)
                                                                                      └── Phase 16 (Financial Summary)
                                                                                            └── Phase 17 (Dashboard)
                                                                                                  └── Phase 18 (Reports)
                                                                                                        └── Phase 19 (Export)
```

---

## Todos

- [ ] Run `/gsd-discuss-phase 1` then `/gsd-plan-phase 1` (Admin Login + JWT)

---

## Blockers

None.

---

## Session Continuity

**Next action:** Run `/gsd-plan-phase 1` to plan Phase 1 (Admin Login + JWT).

**Phase 1 scope (AUTH-01, AUTH-02):**
- Project scaffold: .NET Clean Architecture solution + Angular 19 + PrimeNG
- Backend: ASP.NET Core Identity, JWT Bearer, login endpoint with specific Vietnamese error messages
- Frontend: Split-layout login page, AuthService (Signals + localStorage), AuthGuard, JWT interceptor
- App shell: sidebar with full nav (disabled unbuilt items), header with page title + logout

**Note:** Roadmap restructured 2026-04-15 from 6 phases to 19 phases (1 feature per phase).
Old Phase 1 PLAN.md files archived in `.planning/phases/01-foundation-archive/`.
CONTEXT.md and UI-SPEC.md from old Phase 1 remain valid reference for new Phases 1–5.

---
*State initialized: 2026-04-13 during roadmap creation*
*Restructured: 2026-04-15 — 6 phases → 19 granular phases*
