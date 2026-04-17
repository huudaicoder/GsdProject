---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 01
current_plan: 1
status: executing
last_updated: "2026-04-15T22:24:17.075Z"
progress:
  total_phases: 15
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
  percent: 7
---

# Project State: Hệ thống Quản lý Kho Thiết Bị Công Ty

**Last updated:** 2026-04-13
**Session:** Initial roadmap creation

---

## Project Reference

**Core Value:** Quản trị viên kho có thể biết ngay thiết bị nào đang ở đâu, ai đang dùng, và trạng thái tài chính liên quan — để không bao giờ mất dấu tài sản công ty.

**Stack:** ABP Framework Community 9.x (backend) + Angular 19 (frontend)
**Architecture:** Monolithic, ABP Clean Architecture (6-project solution), REST API + Angular SPA
**Database:** PostgreSQL (D-01 locked)

---

## Current Position

Phase: 01 (Admin Login + JWT + Audit) — COMPLETE
**Milestone:** M1 (v1 — full system)
**Current Phase:** 02
**Status:** Phase 01 complete — ready to plan Phase 02

**Progress:**

```
Phase 1:  Admin Login + JWT + Audit                          [ Complete ✓ ]
Phase 2:  Reference Data (Categories + Suppliers + Depts)    [ Not started ]
Phase 3:  Equipment Catalog                                  [ Not started ]
Phase 4:  Employee Management                                [ Not started ]
Phase 5:  Project Management                                 [ Not started ]
Phase 6:  Import Flow                                        [ Not started ]
Phase 7:  Supplier Payments                                  [ Not started ]
Phase 8:  Employee Assignment + Damage Penalty               [ Not started ]
Phase 9:  Project Allocation                                 [ Not started ]
Phase 10: Maintenance                                        [ Not started ]
Phase 11: Liquidation                                        [ Not started ]
Phase 12: Financial Summary                                  [ Not started ]
Phase 13: Dashboard                                          [ Not started ]
Phase 14: Reports                                            [ Not started ]
Phase 15: Export                                             [ Not started ]

Overall: █░░░░░░░░░░░░░░ 1/15 phases
```

---

## Accumulated Context

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Monolithic deployment | Single warehouse, admin-only, ~200 employees — microservices add zero value |
| ABP Framework Community 9.x | Provides Clean Architecture scaffold, Identity, Audit Logging, CrudAppService, Permission system — ~60% less boilerplate than manual setup |
| ABP Application Services (no MediatR) | CrudAppService auto-generates CRUD + pagination + sorting; ABP auto-generates HTTP API controllers |
| ABP Identity + OpenIddict | Pre-wired auth stack; OpenIddict issues JWT tokens; 8-hour lifetime, no refresh token in v1 |
| ABP Audit Logging Module | Phase 2 — automatically logs all app service calls (who/what/when/old-new); no manual interceptor needed |
| Single WarehouseTransaction table | Discriminator enum + nullable FKs; simplifies cross-type reports and history view |
| Equipment.Status stored explicitly | Never compute from transactions at query time — prevents performance issues and status drift |
| Soft delete for Equipment | Historical transactions must reference equipment rows; hard delete breaks audit trail |
| FinancialRecord as side effect | Created atomically with Import / Return-with-damage / Liquidation operations |
| Separate Request/Response DTOs | Never expose domain entities directly to API; ABP IObjectMapper (AutoMapper) for mapping |
| Server-side pagination from day 1 | 1000+ equipment items; un-paginated lists will be slow |

### Key Patterns

- Service layer owns all Equipment.Status transitions (never from Controller)
- WarehouseTransaction is append-only (corrective transactions, never edits/deletes)
- All flows (import, assign, return) are atomic — EF Core SaveChanges wraps all side effects
- No layer skips its neighbor: Angular → Controller → Service → Repository → DbContext

### Phase Dependencies

```
Phase 1 (Login + JWT + Audit) ✓
  └── Phase 2 (Reference Data: Categories + Suppliers + Departments)
        └── Phase 3 (Equipment Catalog)
              └── Phase 4 (Employee Management)
                    └── Phase 5 (Project Management)
                          └── Phase 6 (Import Flow)
                                └── Phase 7 (Supplier Payments)
                                      └── Phase 8 (Employee Assignment + Damage Penalty)
                                            └── Phase 9 (Project Allocation)
                                                  └── Phase 10 (Maintenance)
                                                        └── Phase 11 (Liquidation)
                                                              └── Phase 12 (Financial Summary)
                                                                    └── Phase 13 (Dashboard)
                                                                          └── Phase 14 (Reports)
                                                                                └── Phase 15 (Export)
```

---

## Todos

- [ ] Run `/gsd-discuss-phase 1` then `/gsd-plan-phase 1` (Admin Login + JWT + Audit)

---

## Blockers

None.

---

## Session Continuity

**Next action:** Run `/gsd-plan-phase 1` to plan Phase 1 (Admin Login + JWT).

**Phase 1 scope (AUTH-01, AUTH-02):**

- Project scaffold: ABP Framework 9.x solution (6 projects) + Angular 19 + PrimeNG
- Backend: ABP Identity + OpenIddict, login endpoint with specific Vietnamese error messages, 8h JWT
- Frontend: Split-layout login page, AuthService (Signals + localStorage), AuthGuard, JWT interceptor
- App shell: sidebar with full nav (disabled unbuilt items), header with page title + logout

**Stack decisions locked (2026-04-15):**

- Backend: ABP Framework Community 9.x (replaces manual Clean Architecture + MediatR)
- Auth: ABP Identity + OpenIddict (replaces manual ASP.NET Identity + JwtBearer)
- Audit: ABP Audit Logging Module — Phase 2 (replaces manual SaveChangesInterceptor)
- Database: PostgreSQL / Npgsql (D-01)
- Frontend: Angular 19 + PrimeNG + Signals (unchanged)

**Note:** Roadmap restructured 2026-04-15 from 6 phases to 19 phases (1 feature per phase).
Old Phase 1 PLAN.md files archived in `.planning/phases/01-foundation-archive/`.
CONTEXT.md updated 2026-04-15 to reflect ABP architecture + Phase 1 scope (AUTH-01, AUTH-02 only).

---
*State initialized: 2026-04-13 during roadmap creation*
*Restructured: 2026-04-15 — 6 phases → 19 granular phases*
