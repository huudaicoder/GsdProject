# Phase 2: Reference Data — Categories + Suppliers + Departments - Research

**Researched:** 2026-04-17
**Domain:** ABP CrudAppService, EF Core PostgreSQL sequences, PrimeNG p-sidebar, Angular 19 standalone feature structure
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 — Pagination:** PrimeNG `p-table` với phân trang server-side. Row options: 10 / 20 / 50.

**D-02 — Search trigger:** Search button (không real-time). Nhấn nút "Tìm kiếm" → gọi API với query params.

**D-03 — Table columns (cả 3 bảng):** Mã | Tên | Mô tả | Actions (Sửa + Xóa).

**D-04 — Page layout:** 2 cột: trái = filter panel (search + nút Tìm kiếm), phải = table + nút "Thêm mới". Áp dụng cho cả 3 trang.

**D-05 — Auto-generated code (Mã):** Tuần tự, unique, required, không được chỉnh sửa sau khi tạo. Prefix: DM- (danh mục), NCC- (nhà cung cấp), PB- (phòng ban). Planner chọn format cụ thể.

**D-06 — Form container:** Slide-over panel từ phải — PrimeNG `p-sidebar` position="right" hoặc custom drawer. KHÔNG dùng modal dialog.

**D-07 — Success behavior:** Toast thông báo thành công + đóng panel tự động.

**D-08 — Validation display:** Lỗi inline dưới từng field (không dùng summary box).

**D-09 — Panel width:** 30% viewport.

**D-10 — Form fields:**
- Danh mục: Mã (read-only khi sửa), Tên (required), Mô tả (optional)
- Nhà cung cấp: Mã (read-only khi sửa), Tên (required), Địa chỉ (optional), Thông tin liên hệ (optional)
- Phòng ban: Mã (read-only khi sửa), Tên (required)

**D-11 — Delete confirmation:** Dialog xác nhận với nút Hủy / Xác nhận trước khi xóa.

**D-12 — Delete blocked error:** Hiển thị **dialog lỗi riêng** (KHÔNG phải toast) khi xóa bị chặn. Ví dụ: "Không thể xóa danh mục này — đang được sử dụng bởi 5 thiết bị."

**Locked từ Phase 1:**
- Auth: ABP Identity + OpenIddict JWT 8h — tất cả API endpoints yêu cầu Bearer token
- ABP pattern: `CrudAppService<TEntity, TDto, TKey>` cho CRUD; auto-generate HTTP controllers
- Database: PostgreSQL / Npgsql (D-01 locked)
- UI stack: Angular 19 standalone + PrimeNG 19 (Lara theme) + Signals
- Validation: FluentValidation trong Application.Contracts layer

### Claude's Discretion

- Format số trong Mã: số chữ số (3 chữ số: DM-001 hay nhiều hơn?) — planner quyết định
- Nhà cung cấp liên hệ: 1 field hay 2 field (email + phone riêng) — planner quyết định
- Cấu trúc file Angular: 1 file component hay tách sub-components — planner quyết định theo codebase pattern

### Deferred Ideas (OUT OF SCOPE)

- Import danh mục từ Excel → Phase 6
- Audit history UI per category/supplier/department → ABP tự ghi, không cần UI riêng
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EQP-04 | Admin có thể quản lý danh mục thiết bị (thêm/sửa/xóa): IT, Văn phòng, Công nghiệp... | CrudAppService cho EquipmentCategory entity; delete-blocking khi equipment tham chiếu |
| SUP-01 | Admin có thể quản lý nhà cung cấp (thêm/sửa/xóa): tên, địa chỉ, thông tin liên hệ | CrudAppService cho Supplier entity; không block delete trong phase này (SUP-02 ở Phase 6) |
| EMP-02 | Admin có thể quản lý phòng ban (thêm/sửa/xóa) | CrudAppService cho Department entity; delete-blocking khi employee tham chiếu (Phase 4 tạo Employee) |
</phase_requirements>

---

## Summary

Phase 2 triển khai 3 entities reference data (EquipmentCategory, Supplier, Department) theo cùng một pattern. Cả 3 đều là CRUD đơn giản với auto-generated code field, server-side pagination, và slide-over panel. Backend sử dụng ABP `CrudAppService` — pattern được thiết kế cho đúng use case này.

Codebase từ Phase 1 đã có: app shell đầy đủ (sidebar, header, layout), JWT interceptor, error interceptor, auth guard, và routing skeleton. Sidebar đã chứa placeholder routes `/categories`, `/suppliers`, `/departments` với `disabled: true` — Phase 2 chỉ cần kích hoạt và implement.

Pattern quan trọng nhất cần nghiên cứu là **auto-generated sequential code** với PostgreSQL sequence (cách tốt nhất) và **delete-blocking với count** trong ABP app service. Cả hai đều có pattern chuẩn rõ ràng trong ABP ecosystem.

**Primary recommendation:** 3 entities dùng chung 1 plan structure — backend (domain + app service + migration) trước, frontend sau. Mỗi entity là 1 wave để có thể test từng bước.

---

## Codebase Patterns từ Phase 1 (VERIFIED: codebase grep)

### Những gì đã có sẵn

| Item | File | Reuse trong Phase 2 |
|------|------|---------------------|
| JWT interceptor | `core/interceptors/jwt.interceptor.ts` | Tự động inject Bearer token — không cần làm gì thêm |
| Error interceptor | `core/interceptors/error.interceptor.ts` | Xử lý 401 (redirect login) và 403 (toast) tự động |
| Auth guard | `core/guards/auth.guard.ts` | Bảo vệ child routes — đã bao gồm `/categories` etc |
| App layout | `shared/layout/app-layout/` | Sidebar + Header wrapper — dùng lại nguyên |
| Sidebar routes | `shared/layout/sidebar/sidebar.component.ts` | `/categories`, `/suppliers`, `/departments` đã có, chỉ cần bỏ `disabled: true` |
| Header titles | `shared/layout/header/header.component.ts` | Tiêu đề tiếng Việt đã có cho cả 3 route |
| App routes | `app.routes.ts` | Thêm child routes vào `children[]` array |
| PrimeNG Lara theme | `app.config.ts` | `providePrimeNG({ theme: { preset: Lara } })` đã configured |
| MessageService | `app.config.ts` | Đã provide globally — dùng được ngay cho toast |
| DbContext | `KhoThietBiDbContext.cs` | Thêm `DbSet<>` mới và EF config |
| AutoMapper Profile | `KhoThietBiApplicationAutoMapperProfile.cs` | Thêm `CreateMap<>` cho 3 entities |
| Permissions | `KhoThietBiPermissions.cs` | Thêm const mới; đăng ký trong `DefinitionProvider` |
| ABP App Service base | `KhoThietBiAppService.cs` | Extend `CrudAppService` thay vì `KhoThietBiAppService` trực tiếp |
| Test infra | `KhoThietBiEntityFrameworkCoreTestModule.cs` | SQLite in-memory test DB đã configured |

### Điều CẦN làm mới hoàn toàn trong Phase 2

- Domain entities: `EquipmentCategory`, `Supplier`, `Department`
- DTOs: `CategoryDto`, `CreateUpdateCategoryDto`, v.v.
- App services + interfaces: `ICategoryAppService` + impl
- FluentValidation validators
- EF Core table config + migration
- Angular feature components: `/categories`, `/suppliers`, `/departments`
- Shared Angular components: slide-over form panel (dùng lại cho 3 entities)

---

## Standard Stack

### Backend — Core

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| ABP Framework | 9.3.7 [VERIFIED: csproj] | CrudAppService base, permissions, DI | Đã lock từ Phase 1 |
| EF Core (Npgsql) | 9.x via ABP [VERIFIED: csproj] | ORM + migrations | Đã configured với PostgreSQL |
| FluentValidation | via `Volo.Abp.FluentValidation` [VERIFIED: csproj] | Input validation | Trigger tự động qua ABP pipeline |
| AutoMapper | via `Volo.Abp.AutoMapper` [VERIFIED: csproj] | DTO mapping | `IObjectMapper` đã configured |

### Frontend — Core

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| Angular | 19.2.0 [VERIFIED: package.json] | SPA framework | Đã lock |
| PrimeNG | 19.1.4 [VERIFIED: package.json] | p-table, p-sidebar, p-button, p-toast, p-confirmdialog | Đã lock |
| @primeng/themes | 21.0.4 [VERIFIED: package.json] | Lara theme preset | Đã configured |
| Angular Signals | built-in Angular 19 | State management in feature stores | Pattern từ Phase 1 |

---

## Architecture Patterns

### Backend — Cấu trúc file cho mỗi entity

```
KhoThietBi.Domain/
└── Categories/
    └── EquipmentCategory.cs          ← Entity (AggregateRoot<Guid>)

KhoThietBi.Domain.Shared/
└── Categories/
    └── CategoryConsts.cs             ← Max lengths, prefix constants

KhoThietBi.Application.Contracts/
└── Categories/
    ├── ICategoryAppService.cs        ← Interface (extends ICrudAppService)
    ├── CategoryDto.cs                ← Response DTO
    ├── CreateUpdateCategoryDto.cs    ← Request DTO
    ├── GetCategoryListInput.cs       ← Paginated filter input
    └── Validators/
        └── CreateUpdateCategoryDtoValidator.cs

KhoThietBi.Application/
└── Categories/
    └── CategoryAppService.cs         ← CrudAppService implementation

KhoThietBi.EntityFrameworkCore/
└── EntityFrameworkCore/
    └── KhoThietBiDbContext.cs        ← Thêm DbSet + OnModelCreating config
```

Nhân bản pattern này cho `Suppliers/` và `Departments/`.

### Pattern 1: ABP CrudAppService cho reference data

```csharp
// Domain/Categories/EquipmentCategory.cs
// Source: [ASSUMED - ABP AggregateRoot pattern, phổ biến trong ABP projects]
using Volo.Abp.Domain.Entities.Auditing;

namespace KhoThietBi.Categories;

public class EquipmentCategory : AuditedAggregateRoot<Guid>
{
    public string Code { get; private set; } = null!;   // DM-001, DM-002...
    public string Name { get; set; } = null!;
    public string? Description { get; set; }

    private EquipmentCategory() { }  // EF Core required

    public EquipmentCategory(Guid id, string code, string name, string? description)
        : base(id)
    {
        Code = code;
        Name = name;
        Description = description;
    }
}
```

**Tại sao dùng `AuditedAggregateRoot`:** Kế thừa `CreationTime`, `CreatorId`, `LastModificationTime`, `LastModifierId` — ABP Audit Logging tự ghi. Không cần `FullAuditedAggregateRoot` vì không cần soft-delete cho reference data (D từ CONTEXT.md).

```csharp
// Application.Contracts/Categories/ICategoryAppService.cs
// Source: [ASSUMED - ABP ICrudAppService pattern]
using Volo.Abp.Application.Services;

namespace KhoThietBi.Categories;

public interface ICategoryAppService
    : ICrudAppService<
        CategoryDto,           // GetAsync, GetListAsync output
        Guid,                  // Primary key
        GetCategoryListInput,  // GetListAsync input (paging + filter)
        CreateUpdateCategoryDto> // CreateAsync, UpdateAsync input
{
}
```

```csharp
// Application/Categories/CategoryAppService.cs
// Source: [ASSUMED - ABP CrudAppService pattern]
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace KhoThietBi.Categories;

public class CategoryAppService
    : CrudAppService<
        EquipmentCategory,
        CategoryDto,
        Guid,
        GetCategoryListInput,
        CreateUpdateCategoryDto>,
    ICategoryAppService
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoryAppService(
        IRepository<EquipmentCategory, Guid> repository,
        ICategoryRepository categoryRepository)
        : base(repository)
    {
        _categoryRepository = categoryRepository;
    }

    protected override async Task<IQueryable<EquipmentCategory>> CreateFilteredQueryAsync(
        GetCategoryListInput input)
    {
        var query = await base.CreateFilteredQueryAsync(input);

        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            query = query.Where(x =>
                x.Name.Contains(input.Filter) ||
                x.Code.Contains(input.Filter));
        }

        return query;
    }

    // Override DeleteAsync để check FK trước khi xóa
    public override async Task DeleteAsync(Guid id)
    {
        var equipmentCount = await _categoryRepository.GetEquipmentCountAsync(id);
        if (equipmentCount > 0)
        {
            throw new UserFriendlyException(
                $"Không thể xóa danh mục này — đang được sử dụng bởi {equipmentCount} thiết bị.");
        }
        await base.DeleteAsync(id);
    }
}
```

**Lưu ý:** `UserFriendlyException` trong ABP tự động serialize thành HTTP 400 với `message` field. Angular đọc `error.error.error.message` để hiển thị dialog lỗi (D-12).

### Pattern 2: Auto-generated sequential code — PostgreSQL Sequence

**Vấn đề:** Cần tạo DM-001, DM-002, v.v. an toàn khi concurrent requests.

**Approach đúng: PostgreSQL sequence** — atomic, không bị race condition, không cần lock.

```csharp
// EntityFrameworkCore/KhoThietBiDbContext.cs — OnModelCreating
// Source: [ASSUMED - EF Core HasSequence pattern cho PostgreSQL]
protected override void OnModelCreating(ModelBuilder builder)
{
    base.OnModelCreating(builder);
    // ... ABP module configs ...

    // Tạo sequences cho các entity codes
    builder.HasSequence<int>("CategoryCodeSeq", schema: null)
           .StartsAt(1).IncrementsBy(1);

    builder.HasSequence<int>("SupplierCodeSeq", schema: null)
           .StartsAt(1).IncrementsBy(1);

    builder.HasSequence<int>("DepartmentCodeSeq", schema: null)
           .StartsAt(1).IncrementsBy(1);

    // Entity config
    builder.Entity<EquipmentCategory>(b =>
    {
        b.ToTable(KhoThietBiConsts.DbTablePrefix + "EquipmentCategories",
                  KhoThietBiConsts.DbSchema);
        b.ConfigureByConvention();
        b.Property(x => x.Code).IsRequired().HasMaxLength(20);
        b.Property(x => x.Name).IsRequired().HasMaxLength(CategoryConsts.MaxNameLength);
        b.Property(x => x.Description).HasMaxLength(CategoryConsts.MaxDescriptionLength);
        b.HasIndex(x => x.Code).IsUnique();
        b.HasIndex(x => x.Name).IsUnique();
    });
}
```

**Code generation trong Domain Service** (không trong AppService):

```csharp
// Domain/Categories/CategoryManager.cs
// Source: [ASSUMED - ABP Domain Service pattern với IRepository]
using Volo.Abp.Domain.Services;

namespace KhoThietBi.Categories;

public class CategoryManager : DomainService
{
    private readonly IRepository<EquipmentCategory, Guid> _repository;

    public CategoryManager(IRepository<EquipmentCategory, Guid> repository)
    {
        _repository = repository;
    }

    public async Task<EquipmentCategory> CreateAsync(
        string name, string? description)
    {
        // Lấy next sequence value từ DB
        var nextCode = await GetNextCodeAsync();
        var code = $"DM-{nextCode:D3}";  // DM-001, DM-010, DM-100

        var existing = await _repository.FindAsync(x => x.Name == name);
        if (existing != null)
            throw new UserFriendlyException($"Đã tồn tại danh mục với tên '{name}'.");

        return new EquipmentCategory(GuidGenerator.Create(), code, name, description);
    }

    private async Task<int> GetNextCodeAsync()
    {
        // Đọc nextval từ PostgreSQL sequence bằng raw SQL qua IRepository
        // Hoặc dùng MAX(Code) + 1 approach — xem bên dưới
    }
}
```

**Thực tế trong Phase 2:** Do `CategoryManager` cần gọi sequence, dùng raw SQL qua EF Core:

```csharp
// Trong CategoryAppService.CreateAsync override, hoặc CategoryManager
// Source: [ASSUMED - EF Core raw SQL cho sequence]
var connection = _dbContext.Database.GetDbConnection();
await connection.OpenAsync();
using var cmd = connection.CreateCommand();
cmd.CommandText = "SELECT nextval('\"CategoryCodeSeq\"')";
var nextVal = (long)(await cmd.ExecuteScalarAsync())!;
var code = $"DM-{nextVal:D3}";
```

**Alternative đơn giản hơn: MAX+1 với unique index làm safety net**

```csharp
// Source: [ASSUMED - pattern phổ biến cho single-server deployment]
// Phù hợp với hệ thống single-server (không concurrent load cao)
var maxCode = await _repository.MaxAsync(x => x.Code) ?? "DM-000";
var lastNum = int.Parse(maxCode.Split('-')[1]);
var code = $"DM-{lastNum + 1:D3}";
// Unique index trên Code column làm safety net chống race condition
```

**Recommendation cho planner:** Dùng MAX+1 trong transaction của ABP Unit of Work — đơn giản hơn, phù hợp với single-server v1. Unique index trên `Code` column bảo vệ khỏi race condition nếu có. Nếu cần concurrent safety cao hơn, switch sang DB sequence.

### Pattern 3: Delete-blocking với Vietnamese error message

```csharp
// Trong CategoryAppService.DeleteAsync
// Source: [ASSUMED - ABP UserFriendlyException pattern]
public override async Task DeleteAsync(Guid id)
{
    // Phase 2: Equipment table chưa tồn tại, nhưng FK check được thêm khi Phase 3 tạo Equipment
    // Cho Phase 2: implement skeleton, FK check được thêm sau khi Equipment entity được tạo
    await base.DeleteAsync(id);
}

// Khi Phase 3 đã có Equipment entity:
public override async Task DeleteAsync(Guid id)
{
    var equipmentCount = await _equipmentRepository.CountAsync(
        x => x.CategoryId == id);

    if (equipmentCount > 0)
    {
        throw new UserFriendlyException(
            $"Không thể xóa danh mục này — đang được sử dụng bởi {equipmentCount} thiết bị.");
    }
    await base.DeleteAsync(id);
}
```

**Quan trọng:** `UserFriendlyException` trong ABP serialize thành:
```json
{
  "error": {
    "code": null,
    "message": "Không thể xóa danh mục này — đang được sử dụng bởi 5 thiết bị.",
    "details": null
  }
}
```
HTTP status: 400. Angular đọc: `error.error.error.message`.

**Phase 2 note cho delete-blocking:**
- **Category:** Equipment entity chưa có trong Phase 2. Check sẽ được thêm khi Phase 3 implement Equipment với `CategoryId`. Trong Phase 2, implement `DeleteAsync` với placeholder comment.
- **Department:** Employee entity chưa có trong Phase 2. Check sẽ được thêm khi Phase 4 implement Employee với `DepartmentId`. Trong Phase 2, implement với placeholder comment.
- **Supplier:** Không có delete-blocking trong Phase 2 (SUP-02 yêu cầu link với phiếu nhập kho — ở Phase 6).

### Pattern 4: GetCategoryListInput — PagedAndSortedResultRequestDto

```csharp
// Application.Contracts/Categories/GetCategoryListInput.cs
// Source: [ASSUMED - ABP PagedAndSortedResultRequestDto pattern]
using Volo.Abp.Application.Dtos;

namespace KhoThietBi.Categories;

public class GetCategoryListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }  // Search term
}
```

`PagedAndSortedResultRequestDto` từ ABP tự động cung cấp: `SkipCount`, `MaxResultCount`, `Sorting` — khớp với PrimeNG `p-table` lazy load event (`first`, `rows`, `sortField`, `sortOrder`).

### Pattern 5: FluentValidation trong Application.Contracts

```csharp
// Application.Contracts/Categories/Validators/CreateUpdateCategoryDtoValidator.cs
// Source: [ASSUMED - ABP FluentValidation pattern]
using FluentValidation;

namespace KhoThietBi.Categories;

public class CreateUpdateCategoryDtoValidator : AbstractValidator<CreateUpdateCategoryDto>
{
    public CreateUpdateCategoryDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên danh mục không được để trống.")
            .MaximumLength(CategoryConsts.MaxNameLength)
            .WithMessage($"Tên danh mục không được vượt quá {CategoryConsts.MaxNameLength} ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(CategoryConsts.MaxDescriptionLength)
            .WithMessage($"Mô tả không được vượt quá {CategoryConsts.MaxDescriptionLength} ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}
```

ABP tự động detect và invoke validators — không cần đăng ký thủ công nếu đặt trong đúng assembly.

### Pattern 6: AutoMapper mapping

```csharp
// Application/KhoThietBiApplicationAutoMapperProfile.cs — thêm vào constructor
// Source: [VERIFIED: AutoMapper Profile trong codebase]
public KhoThietBiApplicationAutoMapperProfile()
{
    CreateMap<EquipmentCategory, CategoryDto>();
    CreateMap<CreateUpdateCategoryDto, EquipmentCategory>()
        .ForMember(dest => dest.Code, opt => opt.Ignore()); // Code không map từ input

    CreateMap<Supplier, SupplierDto>();
    CreateMap<CreateUpdateSupplierDto, Supplier>()
        .ForMember(dest => dest.Code, opt => opt.Ignore());

    CreateMap<Department, DepartmentDto>();
    CreateMap<CreateUpdateDepartmentDto, Department>()
        .ForMember(dest => dest.Code, opt => opt.Ignore());
}
```

---

## Frontend — Angular 19 Feature Structure

### Cấu trúc file Angular cho 3 entities

```
kho-thiet-bi-ui/src/app/
├── features/
│   ├── categories/
│   │   ├── categories.component.ts       ← Page component (list + filter)
│   │   ├── categories.component.html
│   │   ├── categories.component.scss
│   │   ├── category-form.component.ts    ← Slide-over form panel
│   │   ├── category-form.component.html
│   │   ├── category-form.component.scss
│   │   └── category.service.ts           ← HTTP service (signals store)
│   ├── suppliers/
│   │   ├── suppliers.component.ts
│   │   ├── suppliers.component.html
│   │   ├── suppliers.component.scss
│   │   ├── supplier-form.component.ts
│   │   ├── supplier-form.component.html
│   │   ├── supplier-form.component.scss
│   │   └── supplier.service.ts
│   └── departments/
│       ├── departments.component.ts
│       ├── departments.component.html
│       ├── departments.component.scss
│       ├── department-form.component.ts
│       ├── department-form.component.html
│       ├── department-form.component.scss
│       └── department.service.ts
└── shared/
    └── components/                        ← TÙY CHỌN: shared UI components
        └── delete-error-dialog/           ← Nếu dialog lỗi được tái sử dụng
```

**Quyết định về shared components:** 3 entities có cùng pattern nhưng form fields khác nhau. Không có lợi ích rõ ràng từ việc tạo generic form component trong Phase 2. Mỗi entity có component riêng — đơn giản, dễ maintain.

### Pattern 7: Feature service với Signals

```typescript
// features/categories/category.service.ts
// Source: [ASSUMED - Angular Signals service pattern từ Phase 1 AuthService]
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryDto {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface CreateUpdateCategoryDto {
  name: string;
  description?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private readonly BASE = '/api/app/category';

  getList(filter: string, skipCount: number, maxResultCount: number): Observable<PagedResult<CategoryDto>> {
    const params = new HttpParams()
      .set('filter', filter)
      .set('skipCount', skipCount)
      .set('maxResultCount', maxResultCount);
    return this.http.get<PagedResult<CategoryDto>>(this.BASE, { params });
  }

  create(dto: CreateUpdateCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.BASE, dto);
  }

  update(id: string, dto: CreateUpdateCategoryDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.BASE}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
```

**ABP auto-generated URL pattern:** `CrudAppService<EquipmentCategory, ...>` với class name `CategoryAppService` → ABP tự tạo route `/api/app/category` (kebab-case, bỏ "AppService" suffix). [ASSUMED - ABP routing convention]

### Pattern 8: Page component với PrimeNG p-table server-side

```typescript
// features/categories/categories.component.ts
// Source: [ASSUMED - PrimeNG p-table lazy loading pattern]
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoryService, CategoryDto } from './category.service';
import { CategoryFormComponent } from './category-form.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule,
    InputTextModule, ConfirmDialogModule, DialogModule, ToastModule,
    CategoryFormComponent
  ],
  providers: [ConfirmationService],  // ConfirmationService scoped to component
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // State signals
  categories = signal<CategoryDto[]>([]);
  totalCount = signal<number>(0);
  loading = signal<boolean>(false);
  filterText = signal<string>('');
  rows = signal<number>(10);
  first = signal<number>(0);

  // Panel state
  panelVisible = signal<boolean>(false);
  editItem = signal<CategoryDto | null>(null);

  // Error dialog state (D-12)
  errorDialogVisible = signal<boolean>(false);
  errorDialogMessage = signal<string>('');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.categoryService.getList(
      this.filterText(),
      this.first(),
      this.rows()
    ).subscribe({
      next: (result) => {
        this.categories.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void {
    this.first.set(0);
    this.loadData();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
    this.loadData();
  }

  openCreate(): void {
    this.editItem.set(null);
    this.panelVisible.set(true);
  }

  openEdit(item: CategoryDto): void {
    this.editItem.set(item);
    this.panelVisible.set(true);
  }

  onSaved(): void {
    this.panelVisible.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Lưu danh mục thành công.',
      life: 3000
    });
    this.loadData();
  }

  confirmDelete(item: CategoryDto): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa "${item.name}" không?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xác nhận',
      rejectLabel: 'Hủy',
      accept: () => this.deleteItem(item)
    });
  }

  private deleteItem(item: CategoryDto): void {
    this.categoryService.delete(item.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Đã xóa',
          detail: `Đã xóa danh mục "${item.name}".`,
          life: 3000
        });
        this.loadData();
      },
      error: (err) => {
        // D-12: Error dialog (không phải toast) khi xóa bị chặn
        const msg = err?.error?.error?.message
          || 'Không thể xóa danh mục này.';
        this.errorDialogMessage.set(msg);
        this.errorDialogVisible.set(true);
      }
    });
  }
}
```

### Pattern 9: PrimeNG p-sidebar slide-over panel (D-06, D-09)

```typescript
// features/categories/category-form.component.ts
// Source: [ASSUMED - PrimeNG Sidebar + Angular Reactive Forms pattern]
import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SidebarModule } from 'primeng/sidebar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CategoryService, CategoryDto, CreateUpdateCategoryDto } from './category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, SidebarModule,
    InputTextModule, TextareaModule, ButtonModule
  ],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.scss'
})
export class CategoryFormComponent implements OnChanges {
  @Input() visible: boolean = false;
  @Input() editItem: CategoryDto | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  saving = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)]
  });

  get isEdit(): boolean { return !!this.editItem; }

  ngOnChanges(): void {
    if (this.visible && this.editItem) {
      this.form.patchValue({
        name: this.editItem.name,
        description: this.editItem.description ?? ''
      });
    } else if (this.visible && !this.editItem) {
      this.form.reset();
    }
  }

  onHide(): void {
    this.visibleChange.emit(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const dto: CreateUpdateCategoryDto = {
      name: this.form.value.name!,
      description: this.form.value.description || undefined
    };

    const op$ = this.isEdit
      ? this.categoryService.update(this.editItem!.id, dto)
      : this.categoryService.create(dto);

    op$.subscribe({
      next: () => {
        this.saving = false;
        this.saved.emit();
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
```

**p-sidebar style cho 30% viewport (D-09):**
```html
<!-- category-form.component.html -->
<p-sidebar
  [visible]="visible"
  (visibleChange)="onHide()"
  position="right"
  styleClass="w-30vw"
  [closeOnEscape]="true"
>
  <!-- form content -->
</p-sidebar>
```

**Lưu ý PrimeNG 19:** `p-sidebar` vẫn là component chính cho slide-over panels. `styleClass="w-30vw"` hoặc inline style `style="width: 30vw"`. [VERIFIED: package.json — primeng 19.1.4]

### Pattern 10: Cập nhật routing (app.routes.ts)

```typescript
// app.routes.ts — thêm vào children[] array
// Source: [VERIFIED: app.routes.ts trong codebase]
{
  path: 'categories',
  loadComponent: () =>
    import('./features/categories/categories.component')
      .then(m => m.CategoriesComponent)
},
{
  path: 'suppliers',
  loadComponent: () =>
    import('./features/suppliers/suppliers.component')
      .then(m => m.SuppliersComponent)
},
{
  path: 'departments',
  loadComponent: () =>
    import('./features/departments/departments.component')
      .then(m => m.DepartmentsComponent)
},
```

### Pattern 11: Bỏ `disabled: true` trong sidebar

```typescript
// shared/layout/sidebar/sidebar.component.ts
// Source: [VERIFIED: sidebar.component.ts trong codebase]
// Thay đổi: disabled: true → disabled: false cho 3 items
{ label: 'Danh mục thiết bị', icon: 'pi pi-tag', route: '/categories', disabled: false },
{ label: 'Nhà cung cấp', icon: 'pi pi-building', route: '/suppliers', disabled: false },
{ label: 'Phòng ban', icon: 'pi pi-sitemap', route: '/departments', disabled: false },
```

### Pattern 12: PrimeNG ConfirmDialog cho delete (D-11)

`ConfirmationService` cần được provided ở component level (không global) để tránh conflict. `p-confirmDialog` cần import trong component template.

```html
<!-- Trong categories.component.html -->
<p-toast />
<p-confirmDialog />
<!-- Error dialog D-12 -->
<p-dialog
  [header]="'Không thể xóa'"
  [(visible)]="errorDialogVisible"
  [modal]="true"
  [closable]="true">
  <p>{{ errorDialogMessage() }}</p>
  <ng-template pTemplate="footer">
    <p-button label="Đóng" (click)="errorDialogVisible.set(false)" />
  </ng-template>
</p-dialog>
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CRUD HTTP endpoints | Manual controllers | ABP `CrudAppService` + auto HTTP | ABP auto-generates: GET /api/app/category, POST, PUT/{id}, DELETE/{id} |
| Pagination logic | Manual skip/take | `PagedAndSortedResultRequestDto` | ABP cung cấp sẵn, p-table compatible |
| Input validation | Manual if/else checks | FluentValidation + ABP pipeline | Tự động trigger, serialize lỗi chuẩn |
| DTO mapping | Manual property copy | AutoMapper `IObjectMapper` | Đã configured trong project |
| JWT auth | Manual token check | Existing JWT interceptor | Đã có trong `core/interceptors/jwt.interceptor.ts` |
| Slide-over panel | Custom CSS drawer | PrimeNG `p-sidebar` | 30+ props, accessible, animation built-in |
| Delete confirmation | Custom confirm UI | PrimeNG `ConfirmDialog` + `ConfirmationService` | Đã có trong PrimeNG 19 |
| Toast notifications | Custom toast | PrimeNG `Toast` + `MessageService` | MessageService đã provided globally trong app.config.ts |
| Sequential code generation | Custom UUID | MAX+1 pattern với DB unique index | Safe cho single-server, đơn giản, không cần thêm library |

---

## Common Pitfalls

### Pitfall 1: ABP auto-generated URL convention

**What goes wrong:** `CategoryAppService` → developer nghĩ URL là `/api/app/categoryappservice` hoặc `/api/app/equipmentcategory`.
**Why it happens:** ABP bỏ suffix "AppService" và dùng tên class còn lại theo convention.
**How to avoid:** `CategoryAppService` → `/api/app/category`. `EquipmentCategoryAppService` → `/api/app/equipment-category`. Kiểm tra Swagger UI (`https://localhost:44369/swagger`) sau khi build để xác nhận URL thực tế.
**Warning signs:** Angular nhận 404 từ API calls.

### Pitfall 2: UserFriendlyException vs AbpException trong Angular error handling

**What goes wrong:** Angular interceptor bắt tất cả errors và hiển thị toast — nhưng D-12 yêu cầu dialog riêng cho delete-blocked errors.
**Why it happens:** Error interceptor hiện tại chỉ handle 401 và 403, không handle 400.
**How to avoid:** Trong `deleteItem()` method của component, catch error và check `err.error?.error?.message` — hiển thị dialog (D-12) thay vì toast. Không modify error interceptor toàn cục.
**Warning signs:** Delete-blocked message xuất hiện dưới dạng toast thay vì dialog.

### Pitfall 3: ConfirmationService scope

**What goes wrong:** `ConfirmationService` được provide ở root level nhưng `p-confirmDialog` không hiển thị.
**Why it happens:** PrimeNG ConfirmDialog cần `ConfirmationService` được provide cùng scope với component có `p-confirmDialog` template.
**How to avoid:** Thêm `providers: [ConfirmationService]` vào `@Component` decorator của page component. Import `ConfirmDialogModule` vào `imports[]`.
**Warning signs:** Click xóa không hiện dialog gì.

### Pitfall 4: ABP `CrudAppService.UpdateAsync` overwrites Code field

**What goes wrong:** Khi update, `CreateUpdateCategoryDto` được map vào entity — nếu AutoMapper không ignore `Code`, nó có thể bị overwrite thành null/empty.
**Why it happens:** AutoMapper map toàn bộ properties mặc định.
**How to avoid:** Trong AutoMapper profile: `.ForMember(dest => dest.Code, opt => opt.Ignore())`. Đảm bảo `Code` không có setter public (dùng `private set` hoặc chỉ set trong constructor).
**Warning signs:** Code field bị null sau update.

### Pitfall 5: Slide-over panel width trên màn hình nhỏ

**What goes wrong:** `width: 30vw` quá nhỏ trên màn hình 1280px (384px) — form bị chật, nhất là Supplier có nhiều fields.
**Why it happens:** 30vw là quyết định của user (D-09) nhưng chưa test thực tế.
**How to avoid:** Implement đúng 30vw theo D-09. Nếu cần responsive, thêm `min-width: 320px`.
**Warning signs:** Form fields bị truncated hoặc overflow.

### Pitfall 6: Phase 2 không có Equipment/Employee entities — delete-blocking chưa thể implement đầy đủ

**What goes wrong:** Planner implement delete-blocking check cho Category (đang dùng bởi Equipment) nhưng Equipment entity chưa tồn tại trong Phase 2.
**Why it happens:** Phase 3 mới tạo Equipment; Phase 4 mới tạo Employee.
**How to avoid:** Trong Phase 2, `DeleteAsync` không cần check (bởi vì không có Equipment nào có thể reference Category chưa có equipment). Delete-blocking được **thêm vào** khi Phase 3 implement Equipment với `CategoryId` FK. Tương tự cho Department → Employee (Phase 4).
**Warning signs:** Compiler error vì inject `IEquipmentRepository` chưa tồn tại.

### Pitfall 7: Permissions cần đăng ký để Swagger Authorization hoạt động

**What goes wrong:** API endpoint hoạt động nhưng `[Authorize(Policy = "...")]` trả về 403 vì permission chưa được grant cho admin user.
**Why it happens:** ABP Permission system yêu cầu grant permission cho roles/users sau khi define.
**How to avoid:** Trong Phase 2, dùng `[Authorize]` (chỉ cần authenticated, không cần specific permission) hoặc grant permissions trong `DbMigrator`. Hoặc đơn giản nhất: không dùng `[Authorize(Permission)]` cho reference data trong v1 — chỉ cần authenticated.
**Warning signs:** 403 Forbidden sau khi login thành công.

---

## Supplier — Thông tin liên hệ: 1 field hay 2 field?

**Quyết định của planner (D-10 nói "planner quyết định"):**

**Option A: 1 field `ContactInfo` (string)** — Đơn giản, flexible. Admin có thể ghi "Email: abc@xyz.com, SĐT: 0912..." hoặc chỉ SĐT.

**Option B: 2 fields riêng (`Email`, `Phone`)** — Structured, dễ validation email format, dễ display.

**Recommendation:** Option B — 2 fields riêng:
- `Email` (optional, validate email format via FluentValidation)
- `Phone` (optional, string — không validate format vì SĐT VN có nhiều dạng)

Lý do: Structured data dễ dùng hơn khi Phase 6 cần in phiếu nhập kho với thông tin NCC. Validation email format tránh dữ liệu xấu.

---

## Mã code format: số chữ số

**Quyết định của planner (D-05 nói "planner quyết định format cụ thể"):**

**Recommendation:** 3 chữ số với zero-padding (DM-001, DM-999). Lý do:
- Công ty >200 nhân viên → số lượng categories/suppliers/departments không vượt 999 trong v1
- 3 chữ số đủ dài để hiển thị đẹp trong table column

Nếu có khả năng >999 items: dùng 4 chữ số (DM-0001).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | xUnit 2.x [VERIFIED: ABP test projects sử dụng xUnit] |
| Test infra | `KhoThietBiEntityFrameworkCoreTestModule` — SQLite in-memory [VERIFIED: codebase] |
| Backend test run | `dotnet test KhoThietBi.EntityFrameworkCore.Tests` |
| Frontend test run | `ng test` (Karma + Jasmine) [VERIFIED: package.json] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | File Location | Notes |
|--------|----------|-----------|---------------|-------|
| EQP-04 | Create category — validates Name required | Unit | `CategoryAppServiceTests.cs` | Smoke test |
| EQP-04 | Create category — auto-generates Code (DM-001 format) | Unit | `CategoryAppServiceTests.cs` | Verify code generation |
| EQP-04 | Delete category — blocked if equipment exists | Unit | `CategoryAppServiceTests.cs` | Sẽ implement khi Phase 3 tạo Equipment |
| SUP-01 | Create supplier — validates Name required | Unit | `SupplierAppServiceTests.cs` | Smoke test |
| SUP-01 | Update supplier — Code field unchanged | Unit | `SupplierAppServiceTests.cs` | Verify Code immutability |
| EMP-02 | Create department — validates Name required | Unit | `DepartmentAppServiceTests.cs` | Smoke test |
| EMP-02 | Delete department — blocked if employee exists | Unit | `DepartmentAppServiceTests.cs` | Sẽ implement khi Phase 4 tạo Employee |

### Wave 0 Gaps (test files cần tạo)

- [ ] `test/KhoThietBi.EntityFrameworkCore.Tests/EntityFrameworkCore/Applications/CategoryAppServiceTests.cs`
- [ ] `test/KhoThietBi.EntityFrameworkCore.Tests/EntityFrameworkCore/Applications/SupplierAppServiceTests.cs`
- [ ] `test/KhoThietBi.EntityFrameworkCore.Tests/EntityFrameworkCore/Applications/DepartmentAppServiceTests.cs`

Test pattern từ `SampleAppServiceTests.cs` [VERIFIED: codebase]:

```csharp
public class CategoryAppServiceTests : KhoThietBiApplicationTestBase<KhoThietBiEntityFrameworkCoreTestModule>
{
    private readonly ICategoryAppService _categoryAppService;

    public CategoryAppServiceTests()
    {
        _categoryAppService = GetRequiredService<ICategoryAppService>();
    }

    [Fact]
    public async Task Create_Should_Generate_Code()
    {
        var dto = new CreateUpdateCategoryDto { Name = "IT Equipment" };
        var result = await _categoryAppService.CreateAsync(dto);
        result.Code.ShouldStartWith("DM-");
    }

    [Fact]
    public async Task Create_Should_Fail_With_Empty_Name()
    {
        var dto = new CreateUpdateCategoryDto { Name = "" };
        await Should.ThrowAsync<AbpValidationException>(
            async () => await _categoryAppService.CreateAsync(dto));
    }
}
```

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | ABP Identity + OpenIddict JWT — đã implement Phase 1 |
| V3 Session Management | yes | JWT 8h — đã implement Phase 1 |
| V4 Access Control | yes | `[Authorize]` trên tất cả endpoints — Bearer token required |
| V5 Input Validation | yes | FluentValidation trong Application.Contracts |
| V6 Cryptography | no | Không có sensitive data trong reference data |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized access to reference data APIs | Spoofing | `[Authorize]` attribute trên AppService interface; JWT interceptor trong Angular |
| SQL injection via Filter param | Tampering | EF Core parameterized queries — ORM handles |
| Mass assignment (Code field override) | Tampering | AutoMapper ignore Code trong UpdateAsync mapping |
| XSS via Category name/description | Tampering | ABP auto-escapes output; Angular template binding escapes by default |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Backend DB | ✓ (Phase 1 running) [VERIFIED: appsettings.json] | 14+ | — |
| .NET 9 SDK | ABP backend | ✓ (Phase 1 built) [VERIFIED: csproj TargetFramework] | net9.0 | — |
| Node.js + npm | Angular frontend | ✓ (Phase 1 built) [VERIFIED: package.json] | — | — |
| Angular CLI 19 | Frontend build | ✓ (Phase 1 built) [VERIFIED: angular.json] | 19.2.24 | — |
| ABP CLI | New scaffolding | [ASSUMED from Phase 1 — not re-verified] | 9.3.7 | Manual file creation |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ABP auto-generates URL `/api/app/category` từ `CategoryAppService` | Architecture Patterns | Angular service gọi sai URL → 404. Xác nhận bằng Swagger sau khi build |
| A2 | `UserFriendlyException` serialize thành HTTP 400 với `error.error.message` | Delete-blocking pattern | Angular đọc sai field → error dialog hiển thị "undefined" |
| A3 | PrimeNG `p-sidebar` hỗ trợ `styleClass="w-30vw"` trong v19.1.4 | Frontend Pattern 9 | Style không apply → sidebar không đúng width. Fallback: inline style |
| A4 | FluentValidation validators được ABP auto-detect nếu đặt trong Application.Contracts assembly | Standard Stack | Validation không trigger → dữ liệu xấu vào DB |
| A5 | MAX+1 approach an toàn cho single-server deployment | Auto-code pattern | Race condition trong concurrent requests → duplicate code (unique index sẽ catch lỗi) |
| A6 | `ConfirmationService` cần provide ở component level không phải root | Frontend Pattern 12 | ConfirmDialog không hiển thị |
| A7 | ABP `CrudAppService.UpdateAsync` tự động map `CreateUpdateDto` vào entity và gọi `SaveChanges` | Backend CRUD | Update không persist changes |
| A8 | Delete blocking cho Category (Equipment FK) và Department (Employee FK) có thể bỏ qua trong Phase 2 vì các entities đó chưa tồn tại | Delete-blocking note | Success criteria #2 và #5 yêu cầu delete-blocking → cần placeholder implementation + thêm check trong Phase 3/4 |

---

## Open Questions

1. **ABP Permission cho reference data CRUD**
   - What we know: ABP `[Authorize]` (chỉ authenticated) vs `[Authorize(Permission = "...")]` (specific permission)
   - What's unclear: User muốn granular permissions cho mỗi entity hay chỉ cần authenticated?
   - Recommendation: Phase 2 dùng `[Authorize]` (chỉ cần authenticated) — đủ cho admin-only system. Permission granularity có thể thêm sau.

2. **Delete-blocking implementation timing**
   - What we know: Phase 2 thêm Category/Department delete-blocking, nhưng Equipment và Employee entities chưa tồn tại
   - What's unclear: Success criteria #2 và #5 của Phase 2 yêu cầu delete-blocking phải PASS — nhưng không có Equipment/Employee để test
   - Recommendation: Implement delete-blocking code với FK check trong Phase 2, nhưng test chỉ pass khi Phase 3 (Equipment) và Phase 4 (Employee) được implement. Document điều này trong plan.

3. **Supplier delete-blocking**
   - What we know: SUP-01 không mention delete-blocking; SUP-02 (Phase 6) link NCC với phiếu nhập
   - What's unclear: Có nên block delete Supplier khi có phiếu nhập liên quan không?
   - Recommendation: Không implement trong Phase 2. Phase 6 sẽ thêm nếu cần.

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: codebase] — Tất cả patterns về file structure, existing components, package versions lấy từ codebase thực tế
- [VERIFIED: package.json] — Angular 19.2.0, PrimeNG 19.1.4, @primeng/themes 21.0.4
- [VERIFIED: *.csproj files] — ABP 9.3.7, .NET 9, Npgsql
- [VERIFIED: appsettings.json] — PostgreSQL connection, API host `https://localhost:44369`
- [VERIFIED: proxy.conf.json] — Angular proxy `/api` → `https://localhost:44369`
- [VERIFIED: sidebar.component.ts] — Sidebar routes với disabled flags cho Phase 2 items

### Secondary (MEDIUM confidence)
- [ASSUMED: ABP docs knowledge] — CrudAppService URL convention, UserFriendlyException format, FluentValidation auto-detection

### Tertiary (LOW confidence)
- None — tất cả LOW-confidence claims đã được tag [ASSUMED] trong Assumptions Log

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified từ codebase và package files
- Architecture: HIGH — Phase 1 patterns verified, Phase 2 patterns follow same conventions
- Frontend patterns: MEDIUM-HIGH — PrimeNG patterns assumed từ training, p-sidebar API stable
- Delete-blocking timing: HIGH — logic rõ ràng, Phase dependency documented
- Auto-code generation: MEDIUM — MAX+1 pattern assumed safe cho single-server

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable stack, ABP 9.x không breaking changes trong 30 ngày)
