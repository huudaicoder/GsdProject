---
phase: 01-foundation
plan: 01
subsystem: backend-auth
tags: [abp, openiddict, postgresql, jwt, audit-logging, vietnamese-errors]
dependency_graph:
  requires: []
  provides:
    - ABP 9.3.7 solution scaffold (net9.0, 9 projects)
    - PostgreSQL database with all ABP tables migrated
    - /connect/token ROPC endpoint with 8h JWT
    - Vietnamese login error messages (user-not-found vs wrong-password)
    - ABP Audit Logging tracking all entity changes
    - Admin user seeded (admin/1q2w3E*)
    - KhoThietBi_App OpenIddict client (confidential, password grant)
  affects:
    - All subsequent phases (this is the foundation)
tech_stack:
  added:
    - ABP Framework Community 9.3.7 (net9.0)
    - PostgreSQL 14 via Docker
    - OpenIddict 6.x (bundled with ABP)
    - Serilog.AspNetCore 9.0.0 (bundled with ABP scaffold)
    - Npgsql EF Core provider
  patterns:
    - ABP module system (DependsOn attributes)
    - PreConfigure<OpenIddictServerBuilder> for token lifetime
    - [Dependency(ReplaceServices=true)] for controller override
    - ABP audit logging with EntityHistorySelectors.AddAllEntities()
key_files:
  created:
    - KhoThietBi/aspnet-core/KhoThietBi.sln
    - KhoThietBi/aspnet-core/src/KhoThietBi.HttpApi.Host/Controllers/CustomTokenController.cs
    - KhoThietBi/aspnet-core/src/KhoThietBi.EntityFrameworkCore/Migrations/20260415223848_Initial.cs
    - docker-compose.yml
  modified:
    - KhoThietBi/aspnet-core/src/KhoThietBi.HttpApi.Host/KhoThietBiHttpApiHostModule.cs
    - KhoThietBi/aspnet-core/src/KhoThietBi.HttpApi.Host/appsettings.json
    - KhoThietBi/aspnet-core/src/KhoThietBi.DbMigrator/appsettings.json
    - KhoThietBi/aspnet-core/src/KhoThietBi.Domain/OpenIddict/OpenIddictDataSeedContributor.cs
decisions:
  - "ABP CLI 9.3.7 scaffold generates under aspnet-core/ subdirectory — paths differ from plan (plan said KhoThietBi/src/, actual is KhoThietBi/aspnet-core/src/)"
  - "Used ABP scaffold --version 9.3.7 flag to force correct template version (CLI 9.3.7 downloaded template 10.3.0 without it)"
  - "CustomTokenController uses Dictionary<string, string?> for null-safe AuthenticationProperties"
  - "KhoThietBi_App seeded as confidential client (not public) — matches production security model"
metrics:
  duration: 33m
  completed_date: "2026-04-16"
  tasks_completed: 3
  tasks_total: 3
  files_created: 134
  files_modified: 4
---

# Phase 01 Plan 01: Admin Login + JWT + Audit Summary

**One-liner:** ABP Framework 9.3.7 scaffold on net9.0 with PostgreSQL Docker, OpenIddict ROPC /connect/token (8h JWT), Vietnamese error messages distinguishing user-not-found from wrong-password, and ABP audit logging tracking all entity changes.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | ABP Scaffold + PostgreSQL Docker + DbMigrator | c40722d | KhoThietBi/aspnet-core/KhoThietBi.sln, docker-compose.yml, appsettings.json (both), OpenIddictDataSeedContributor.cs |
| 2 | OpenIddict 8h JWT + Custom Vietnamese Errors | 5244441 | KhoThietBiHttpApiHostModule.cs, Controllers/CustomTokenController.cs |
| 3 | ABP Audit Logging + CORS + Serilog | (included in Task 2 commit) | KhoThietBiHttpApiHostModule.cs (ConfigureAuditLogging method) |

## Verification Results

All 8 plan verification criteria confirmed:

1. `dotnet build KhoThietBi.sln` — 0 errors, 0 warnings
2. `docker exec kho-postgres pg_isready -U postgres` — "accepting connections"
3. POST /connect/token admin/1q2w3E* — returns access_token, expires_in: 28799
4. POST /connect/token nonexistent/test — returns "Tai khoan khong ton tai. Vui long kiem tra lai ten dang nhap."
5. POST /connect/token admin/wrongpassword — returns "Mat khau khong dung. Vui long thu lai."
6. expires_in = 28799 (~8 hours = 28800 seconds)
7. SELECT COUNT(*) FROM "AbpAuditLogs" returns 8 after login operations
8. Bearer with invalid token returns HTTP 401

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ABP CLI 9.3.7 downloaded template 10.3.0 on first scaffold**
- **Found during:** Task 1 Step 3
- **Issue:** `abp new KhoThietBi -t app --ui none` without `--version` flag fetched template 10.3.0 (ABP 10 / .NET 10 structure with Blazor UI projects). The wrong scaffold had 20+ projects including Blazor variants.
- **Fix:** Deleted wrong scaffold, re-ran with `-v 9.3.7` flag: `abp new KhoThietBi -t app --ui none --database-provider ef -dbms PostgreSQL --output-folder KhoThietBi -v 9.3.7`
- **Impact:** Correct 9-project structure (src: 9 projects) on net9.0 generated successfully

**2. [Rule 1 - Deviation] ABP scaffold generates under aspnet-core/ subdirectory**
- **Found during:** Task 1
- **Issue:** Plan specified paths like `KhoThietBi/src/KhoThietBi.HttpApi.Host/` but ABP 9.3.7 template generates under `KhoThietBi/aspnet-core/src/KhoThietBi.HttpApi.Host/`
- **Fix:** Used actual generated paths throughout. All file references updated accordingly.
- **Impact:** All file paths in this summary use the actual generated structure

**3. [Rule 1 - Deviation] Worktree file placement**
- **Found during:** Task 1 commit
- **Issue:** Files created in `D:/MyGsd/` (main repo root) but the git worktree is at `D:/MyGsd/.claude/worktrees/agent-ab774d16/`. Git worktree cannot track files outside its directory.
- **Fix:** Copied `KhoThietBi/` and `docker-compose.yml` into the worktree directory using PowerShell Copy-Item. Committed from worktree branch.
- **Impact:** None — all files correctly committed to worktree branch

**4. [Rule 2 - Missing ROPC client] OpenIddict seeder lacked KhoThietBi_App client**
- **Found during:** Task 1
- **Issue:** ABP scaffold's `OpenIddictDataSeedContributor.cs` only seeded `KhoThietBi_Swagger` (AuthorizationCode grant). No ROPC client for Angular SPA.
- **Fix:** Added `KhoThietBi_App` confidential client with Password + RefreshToken grants to seeder and DbMigrator appsettings.json
- **Files modified:** `OpenIddictDataSeedContributor.cs`, `DbMigrator/appsettings.json`

**5. [Rule 2 - Nullability] CustomTokenController null reference warnings**
- **Found during:** Task 2 build
- **Issue:** `request.Username` and `request.Password` are nullable strings, causing CS8604 warnings with strict nullable reference types
- **Fix:** Used `?? string.Empty` fallback and `Dictionary<string, string?>` for AuthenticationProperties
- **Impact:** Build completes with 0 warnings

## Known Stubs

None. All implemented features are fully functional and verified against live PostgreSQL.

## Threat Flags

No new security surface beyond the plan's threat model. The `/connect/token` endpoint and audit logging are exactly as specified in T-1-01 through T-1-08.

## Self-Check: PASSED

Files verified:
- KhoThietBi/aspnet-core/KhoThietBi.sln — FOUND
- KhoThietBi/aspnet-core/src/KhoThietBi.HttpApi.Host/Controllers/CustomTokenController.cs — FOUND
- docker-compose.yml — FOUND
- .planning/phases/01-foundation/01-01-SUMMARY.md — FOUND (this file)

Commits verified:
- c40722d (Task 1: ABP scaffold) — FOUND
- 5244441 (Task 2: JWT + Controllers) — FOUND
