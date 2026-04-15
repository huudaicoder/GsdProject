---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit (.NET) + Jasmine/Karma (Angular) |
| **Config file** | none — Wave 0 installs test scaffolding |
| **Quick run command** | `dotnet test --no-build --filter "Category=Unit"` |
| **Full suite command** | `dotnet test && cd kho-thiet-bi-ui && npm test -- --watch=false` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet build` (verify no compilation errors)
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | AUTH-01 | T-1-01 | ABP scaffold builds without errors | build | `dotnet build KhoThietBi.sln` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-01 | T-1-01 | Login endpoint returns JWT on valid credentials | integration | `dotnet test --filter "LoginReturnsJwt"` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | AUTH-01 | T-1-02 | Wrong username returns specific error | integration | `dotnet test --filter "WrongUsernameError"` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | AUTH-01 | T-1-02 | Wrong password returns specific error | integration | `dotnet test --filter "WrongPasswordError"` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 2 | AUTH-02 | — | N/A | manual | — | — | ⬜ pending |
| 1-01-06 | 01 | 2 | AUTH-03 | T-1-03 | AuditLog record created after write operation | integration | `dotnet test --filter "AuditLogCreatedOnWrite"` | ❌ W0 | ⬜ pending |
| 1-01-07 | 01 | 3 | AUTH-01 | T-1-04 | 401 returned on unauthenticated request | integration | `dotnet test --filter "UnauthenticatedReturns401"` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 3 | AUTH-01 | — | Angular app builds without errors | build | `cd kho-thiet-bi-ui && npm run build -- --configuration=development` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `KhoThietBi.sln` — ABP solution scaffolded and builds
- [ ] `kho-thiet-bi-ui/` — Angular project scaffolded and builds
- [ ] `docker-compose.yml` — PostgreSQL container for local dev
- [ ] ABP CLI 9.3.7 installed (`dotnet tool install -g Volo.Abp.Cli --version 9.3.7`)
- [ ] PostgreSQL container running (Wave 0 starts Docker and DB)
- [ ] Initial migration applied (`dotnet ef database update`)
- [ ] Admin seed user created (admin/admin or configured credentials)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login page renders split layout (branding left, form right) | AUTH-01 | Visual UI test | Open /login in browser, verify split layout |
| Session persists after browser refresh | AUTH-02 | Browser state | Log in, press F5, verify still authenticated |
| Vietnamese error messages display correctly | AUTH-01 | UI text verification | Enter wrong username, verify "Tên đăng nhập không tồn tại"; enter wrong password, verify "Mật khẩu không đúng" |
| JWT expiry toast appears and redirects | AUTH-02 | Time-dependent UX | Wait for token to expire or mock 401, verify toast + redirect after 3s |
| Sidebar collapsible groups work correctly | AUTH-01 | UI interaction | Click group headers, verify expand/collapse animation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
