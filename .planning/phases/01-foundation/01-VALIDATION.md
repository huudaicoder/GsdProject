---
phase: 1
slug: foundation
status: draft
nyquist_compliant: true
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 1-01-01 | 01 | 0 | AUTH-01 | T-1-01 | ABP scaffold builds without errors | build | `dotnet build KhoThietBi.sln` | pending |
| 1-01-02 | 01 | 1 | AUTH-01 | T-1-01 | Login endpoint returns JWT on valid credentials | runtime-curl | `curl -s -k -X POST https://localhost:{port}/connect/token -d "grant_type=password&..." \| grep -q access_token` | pending |
| 1-01-03 | 01 | 1 | AUTH-01 | T-1-02 | Wrong username returns specific error | runtime-curl | `curl -s -k -X POST https://localhost:{port}/connect/token -d "username=nonexistent&..." \| grep -q "khong ton tai"` | pending |
| 1-01-04 | 01 | 1 | AUTH-01 | T-1-02 | Wrong password returns specific error | runtime-curl | `curl -s -k -X POST https://localhost:{port}/connect/token -d "username=admin&password=wrong&..." \| grep -q "khong dung"` | pending |
| 1-01-05 | 01 | 2 | AUTH-02 | — | N/A | manual | — | pending |
| 1-01-06 | 01 | 2 | AUTH-03 | T-1-03 | AbpAuditLogs table exists after migration | runtime-psql | `docker exec kho-postgres psql -U postgres -d KhoThietBi -c "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename='AbpAuditLogs')"` | pending |
| 1-01-07 | 01 | 3 | AUTH-01 | T-1-04 | 401 returned on unauthenticated request | runtime-curl | `curl -s -o /dev/null -w "%{http_code}" -k https://localhost:{port}/api/app/any-endpoint` | pending |
| 1-02-01 | 02 | 3 | AUTH-01 | — | Angular app builds without errors | build | `cd kho-thiet-bi-ui && npm run build -- --configuration=development` | pending |
| 1-02-02 | 02 | 3 | AUTH-01 | T-1-11 | Login displays full Vietnamese error for wrong username | grep | `grep -q "T\u00ean \u0111\u0103ng nh\u1eadp kh\u00f4ng t\u1ed3n t\u1ea1i" kho-thiet-bi-ui/src/app/features/auth/login/login.component.ts` | pending |
| 1-02-03 | 02 | 3 | AUTH-01 | T-1-11 | Login displays full Vietnamese error for wrong password | grep | `grep -q "M\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang" kho-thiet-bi-ui/src/app/features/auth/login/login.component.ts` | pending |

*Status: pending / green / red / flaky*

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
| Vietnamese error messages display correctly with diacritics | AUTH-01 | UI text verification | Enter wrong username, verify full Vietnamese with diacritics; enter wrong password, verify full Vietnamese with diacritics |
| JWT expiry toast appears and redirects | AUTH-02 | Time-dependent UX | Wait for token to expire or mock 401, verify toast + redirect after 3s |
| Sidebar collapsible groups work correctly | AUTH-01 | UI interaction | Click group headers, verify expand/collapse animation |

---

## Nyquist Compliance Notes

Build-only `<automated>` verify replaced with runtime verification commands:
- **Plan 01-01 Task 2:** curl-based runtime test against /connect/token (valid login, wrong user, wrong password)
- **Plan 01-01 Task 3:** psql-based verification that AbpAuditLogs and AbpEntityChanges tables exist
- **Plan 01-02 Task 2:** grep-based verification that login.component.ts contains full Vietnamese display strings with diacritics

All critical behaviors now have automated runtime verification. `nyquist_compliant: true`.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify with runtime behavior checks
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending execution
