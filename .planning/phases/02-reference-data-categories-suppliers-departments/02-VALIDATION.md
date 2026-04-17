---
phase: 02
slug: reference-data-categories-suppliers-departments
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | xUnit 2.x (ABP test projects) |
| **Config file** | `KhoThietBi.EntityFrameworkCore.Tests` (existing — SQLite in-memory) |
| **Quick run command** | `dotnet test KhoThietBi/aspnet-core/test/KhoThietBi.EntityFrameworkCore.Tests` |
| **Full suite command** | `dotnet test KhoThietBi/aspnet-core/` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `dotnet test KhoThietBi/aspnet-core/test/KhoThietBi.EntityFrameworkCore.Tests`
- **After every plan wave:** Run `dotnet test KhoThietBi/aspnet-core/`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | EQP-04 | — | Name required validation | unit | `dotnet test --filter CategoryAppServiceTests` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | EQP-04 | — | Auto-generates Code DM-001 format | unit | `dotnet test --filter CategoryAppServiceTests` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 2 | EQP-04 | — | Delete blocked if equipment exists (stub — real test in Phase 3) | unit | `dotnet test --filter CategoryAppServiceTests` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | SUP-01 | — | Name required validation | unit | `dotnet test --filter SupplierAppServiceTests` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | SUP-01 | — | Code field immutable after creation | unit | `dotnet test --filter SupplierAppServiceTests` | ❌ W0 | ⬜ pending |
| 02-03-01 | 02 | 1 | EMP-02 | — | Name required validation | unit | `dotnet test --filter DepartmentAppServiceTests` | ❌ W0 | ⬜ pending |
| 02-03-02 | 02 | 2 | EMP-02 | — | Delete blocked if employee exists (stub — real test in Phase 4) | unit | `dotnet test --filter DepartmentAppServiceTests` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `KhoThietBi/aspnet-core/test/KhoThietBi.EntityFrameworkCore.Tests/EntityFrameworkCore/Applications/CategoryAppServiceTests.cs` — stubs for EQP-04
- [ ] `KhoThietBi/aspnet-core/test/KhoThietBi.EntityFrameworkCore.Tests/EntityFrameworkCore/Applications/SupplierAppServiceTests.cs` — stubs for SUP-01
- [ ] `KhoThietBi/aspnet-core/test/KhoThietBi.EntityFrameworkCore.Tests/EntityFrameworkCore/Applications/DepartmentAppServiceTests.cs` — stubs for EMP-02

Test pattern from `SampleAppServiceTests.cs` (existing in codebase):
```csharp
public class CategoryAppServiceTests : KhoThietBiApplicationTestBase<KhoThietBiEntityFrameworkCoreTestModule>
{
    private readonly ICategoryAppService _categoryAppService;
    public CategoryAppServiceTests() { _categoryAppService = GetRequiredService<ICategoryAppService>(); }

    [Fact]
    public async Task Create_Should_Generate_Code()
    {
        var dto = new CreateUpdateCategoryDto { Name = "IT Equipment" };
        var result = await _categoryAppService.CreateAsync(dto);
        result.Code.ShouldStartWith("DM-");
        result.Code.ShouldMatchRegex(@"DM-\d{3}");
    }
}
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slide-over panel opens from right at 30% width | EQP-04, SUP-01, EMP-02 | Frontend visual behavior | Open /categories, click "Thêm mới", verify panel slides from right |
| Delete confirmation dialog appears | EQP-04, SUP-01, EMP-02 | Frontend dialog behavior | Click delete button on any row, verify confirm dialog |
| Delete-blocked error dialog shows | EQP-04, EMP-02 | Requires Phase 3/4 data | Covered by UAT in Phase 3/4 |
| Search button triggers table refresh | EQP-04, SUP-01, EMP-02 | Frontend behavior | Type in search field, click button, verify filtered results |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
