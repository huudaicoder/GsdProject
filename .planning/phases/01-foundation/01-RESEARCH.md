# Phase 1: Admin Login + JWT + Audit - Research

**Researched:** 2026-04-15
**Domain:** ABP Framework 9.x scaffold, ABP Identity + OpenIddict authentication, Angular 19 standalone SPA login, ABP Audit Logging
**Confidence:** HIGH overall (core stack verified via npm registry + NuGet registry + official ABP docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** PostgreSQL — free, EF Core full support, good performance
- **D-02:** Npgsql EF Core provider
- **D-03:** ABP solution scaffold: `abp new KhoThietBi -t app --ui none --database-provider ef -dbms PostgreSQL` generating 6 projects
- **D-04:** Feature-based folders in Application layer
- **D-05:** ABP Application Services — NO MediatR
- **D-06:** EF Core 9 with migrations
- **D-07:** ABP Identity Module + ABP OpenIddict — NO manual AddIdentity() or AddJwtBearer()
- **D-08:** JWT lifetime = 8 hours
- **D-09:** Token persist via localStorage + expiry check in Angular AuthService
- **D-10:** Specific Vietnamese login error messages: "Tên đăng nhập không tồn tại" vs "Mật khẩu không đúng"
- **D-11:** ABP Audit Logging Module with `AddAllEntities()` — no manual interceptor
- **D-12:** Login page split layout: branding left, form right
- **D-13:** Redirect to `/dashboard` on login success
- **D-14:** Sidebar left + content area layout
- **D-15:** Full menu from Phase 1, disabled items greyed out
- **D-16:** Header: breadcrumb + admin name + logout button
- **D-17:** Angular AuthGuard protects all routes
- **D-24:** Soft delete for Equipment (Phase 2+)
- **D-25:** Separate Request/Response DTOs
- **D-26:** Service layer owns status transitions
- **D-27:** Server-side pagination from Phase 1
- **D-28:** `AddAllEntities()` — track change history for all entities
- **D-29:** Retain audit logs permanently — no retention policy
- **D-30:** No audit log UI in v1
- **D-31:** Sidebar collapsible groups
- **D-32:** 5 sidebar groups (Dashboard, Danh mục, Nhập xuất kho, Quản lý, Thống kê)
- **D-33:** All groups closed by default, no localStorage persistence
- **D-34:** Active group auto-expands
- **D-35:** 401 response shows PrimeNG Toast then redirects to /login after 3 seconds
- **D-36:** Dashboard Phase 1 is placeholder: KPI cards with static 0 values

### Claude's Discretion

- Angular UI component library: PrimeNG (confirmed by STACK.md)
- Exact spacing, typography, color scheme
- Loading skeleton / spinner design
- Error state handling patterns
- Exact JWT expiry duration (8 hours locked by D-08)
- Refresh token strategy (no refresh token in v1 — D-08 locks 8h JWT)

### Deferred Ideas (OUT OF SCOPE)

- Color scheme / branding — Claude chooses
- Refresh token strategy — deferred to v2
- Audit trail UI — no UI in v1 (D-30)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Admin có thể đăng nhập bằng username và password | ABP OpenIddict password grant flow via POST /connect/token; custom Vietnamese error messages via TokenController override |
| AUTH-02 | Phiên đăng nhập được duy trì qua browser refresh | Angular AuthService with Signals + localStorage + JWT expiry check using computed() |
| AUTH-03 | Hệ thống ghi lại nhật ký mọi thao tác ghi (audit trail) | ABP Audit Logging with `AddAllEntities()` in ConfigureServices — automatic, no manual interceptor |
</phase_requirements>

---

## Summary

Phase 1 là nền tảng kỹ thuật của toàn bộ hệ thống. Nó bao gồm ba phần lớn: (1) ABP Framework solution scaffold với PostgreSQL, (2) authentication flow qua ABP OpenIddict cho Angular SPA, và (3) Angular 19 standalone shell với login page, AuthService, AuthGuard, JWT interceptor, và app shell (sidebar + header).

ABP Framework 9.3.x (chạy trên .NET 9) là lựa chọn đã được khóa. Phiên bản CLI mới nhất là 10.2.1 (chạy trên .NET 10), vì vậy khi cài đặt cần pin phiên bản 9.x cụ thể: `dotnet tool install -g Volo.Abp.Cli --version 9.3.7`. ABP tự động wire ABP Identity + OpenIddict, không cần cấu hình JWT thủ công.

Angular SPA dùng Resource Owner Password Credentials (ROPC) — POST trực tiếp tới `/connect/token` mà không cần redirect sang trang login riêng của OpenIddict. Đây là lựa chọn phù hợp cho admin-only internal tool, dù OAuth 2.0 spec coi đây là deprecated flow. AuthService dùng Angular Signals với effect() để tự động sync token vào localStorage.

Phần khó nhất của phase này là custom error messages cho đăng nhập (D-10): ABP OpenIddict's `TokenController` trả về chuỗi lỗi hardcoded. Để phân biệt "user not found" vs "wrong password", cần override `TokenController` — đây là task cần lưu ý trong PLAN.

**Primary recommendation:** Dùng ABP CLI 9.3.7, scaffold với `--ui none --database-provider ef -dbms PostgreSQL`, implement ROPC grant type cho Angular SPA custom login, configure 8h token lifetime trong `PreConfigureServices<OpenIddictServerBuilder>`, bật `AddAllEntities()` trong `AbpAuditingOptions`.

---

## Standard Stack

### Core Backend

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ABP Framework (Community) | 9.3.7 | Full-stack DDD scaffold | Pre-wires Identity, OpenIddict, Audit Logging, CrudAppService, Permission system |
| Volo.Abp.Cli (tool) | 9.3.7 | ABP scaffold CLI | Pin phiên bản để tránh install ABP 10 (cần .NET 10) |
| ASP.NET Core | 9.0.x | Web API host | ABP 9.x targets .NET 9 |
| Volo.Abp.EntityFrameworkCore.PostgreSql | 9.3.7 | PostgreSQL provider | Tự động include khi scaffold với `-dbms PostgreSQL` |
| Volo.Abp.Identity | 9.3.7 | User store, roles, permissions | Pre-wired trong ABP template |
| Volo.Abp.OpenIddict | 9.3.7 | JWT token server | Pre-wired, phát JWT access token |
| Volo.Abp.AuditLogging | 9.3.7 | Audit trail | Pre-wired, cần thêm `AddAllEntities()` |
| Volo.Abp.FluentValidation | 9.3.7 | Input validation | Pre-wired |
| Serilog.AspNetCore | 8.x | Structured logging | De-facto standard cho .NET structured logging |
| Serilog.Sinks.File | latest | Log persistence | Rotating daily log files |

### Core Frontend

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular CLI | 19.2.24 | Build tooling | Latest 19.x: esbuild-based, fast |
| @angular/core | 19.x | SPA framework | Required by team, standalone default |
| PrimeNG | 19.1.4 | UI components | Latest 19.x: Button, InputText, Toast, PanelMenu, Card |
| PrimeIcons | bundled | Icon set | Bundled với PrimeNG |
| @angular-eslint/eslint-plugin | 18.4.3 | Linting | Latest 18.x cho Angular 19 |
| Prettier | 3.8.3 | Formatting | Latest 3.x stable |

**Version verification:** [VERIFIED: npm registry 2026-04-15]
- `primeng@19` latest: **19.1.4** (not 19.0.x)
- `@angular/cli@19` latest: **19.2.24**
- `@angular-eslint/eslint-plugin@18` latest: **18.4.3**
- `prettier@3` latest: **3.8.3**
- `Volo.Abp.Cli` latest **9.x**: **9.3.7** (latest overall: 10.2.1 — requires .NET 10) [VERIFIED: nuget.org 2026-04-15]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ROPC password grant | Authorization Code + PKCE | PKCE là OAuth2 best practice nhưng cần redirect và không cho custom login page trong SPA |
| Signals + localStorage | NgRx | NgRx overkill cho admin-only app |
| PrimeNG PanelMenu | Custom sidebar | PanelMenu là component có sẵn, không cần viết collapsible logic |
| ABP TokenController override | Custom /api/auth/login endpoint | Custom endpoint thêm complexity, override là ABP-native pattern |

### Installation Commands

```bash
# Backend — ABP CLI (pin to 9.x)
dotnet tool install -g Volo.Abp.Cli --version 9.3.7

# Scaffold ABP solution
abp new KhoThietBi -t app --ui none --database-provider ef -dbms PostgreSQL

# Additional NuGet packages (add to respective projects)
# In KhoThietBi.Domain:
dotnet add package Stateless --version 5.*

# In KhoThietBi.HttpApi.Host:
dotnet add package Serilog.AspNetCore --version 8.*
dotnet add package Serilog.Sinks.File

# Run migrations and seed data
# In KhoThietBi.DbMigrator:
dotnet run

# Frontend
npx @angular/cli@19 new kho-thiet-bi-ui --standalone --routing --style=scss --strict
npm install primeng@19 primeicons
npm install @angular-eslint/eslint-plugin@18 --save-dev
npm install prettier@3 --save-dev
```

---

## Architecture Patterns

### Recommended Project Structure (ABP --ui none template)

```
KhoThietBi/
  src/
    KhoThietBi.Domain.Shared/       <- Enums, consts, error codes (no EF)
    KhoThietBi.Domain/              <- Entities, domain services, repo interfaces
    KhoThietBi.Application.Contracts/ <- DTOs, service interfaces, permissions
    KhoThietBi.Application/         <- CrudAppService / ApplicationService impls
    KhoThietBi.EntityFrameworkCore/ <- DbContext, EF config, migrations
    KhoThietBi.HttpApi.Host/        <- Program.cs, appsettings.json (entry point)
  test/
    KhoThietBi.Application.Tests/
    KhoThietBi.Domain.Tests/
    KhoThietBi.EntityFrameworkCore.Tests/
  KhoThietBi.DbMigrator/            <- Console app: migrate + seed (IMPORTANT)

kho-thiet-bi-ui/                    <- Angular SPA (separate project root)
  src/app/
    core/
      services/
        auth.service.ts             <- Signal-based AuthService
      interceptors/
        jwt.interceptor.ts          <- Functional interceptor
        error.interceptor.ts        <- 401 → Toast + redirect
      guards/
        auth.guard.ts               <- CanActivateFn
    shared/
      layout/
        app-layout/                 <- Shell: sidebar + header + router-outlet
        sidebar/                    <- PanelMenu-based collapsible nav
        header/                     <- Page title + username + logout
    features/
      auth/
        login/                      <- Split-layout login page
      dashboard/                    <- Phase 1 placeholder KPI cards
    app.routes.ts
    app.config.ts
```

### Pattern 1: ABP Audit Logging — AddAllEntities()

**What:** Tự động track old/new values của mọi entity khi có CRUD operation thông qua ABP pipeline.

**Where:** `KhoThietBi.HttpApi.Host` module, `ConfigureServices` method.

```csharp
// Source: abp.io/docs/latest/framework/infrastructure/audit-logging [VERIFIED]
// In KhoThietBiHttpApiHostModule.cs → ConfigureServices
Configure<AbpAuditingOptions>(options =>
{
    options.IsEnabled = true; // default, explicit for clarity
    options.EntityHistorySelectors.AddAllEntities();
    // IsEnabledForGetRequests = false (default) — GET requests không log
    // IsEnabledForAnonymousUsers = false (default)
});
```

**Kết quả:** ABP tự động tạo records trong:
- `AbpAuditLogs` — request-level log (URL, HTTP method, user, duration)
- `AbpAuditLogActions` — app service method calls
- `AbpEntityChanges` — entity changes (Created/Updated/Deleted)
- `AbpEntityPropertyChanges` — property-level changes với `OriginalValue` và `NewValue` (JSON)

**QUAN TRỌNG:** Entity changes chỉ được track khi entity implement `IEntity` (ABP base entity). Entities trong phase sau phải extend `Entity<Guid>` hoặc `AggregateRoot<Guid>`.

### Pattern 2: OpenIddict JWT Token Lifetime (8 giờ)

**What:** Override default token lifetime trong ABP OpenIddict.

**Where:** `KhoThietBi.HttpApi.Host` module, `PreConfigureServices` method (phải dùng Pre, không phải Configure).

```csharp
// Source: abp.io/support/questions/3948 [VERIFIED via web search]
// In KhoThietBiHttpApiHostModule.cs
public override void PreConfigureServices(ServiceConfigurationContext context)
{
    PreConfigure<OpenIddictServerBuilder>(builder =>
    {
        builder.SetAccessTokenLifetime(TimeSpan.FromHours(8));
        // D-08: 8 giờ cho admin-only internal tool
        // Không set refresh token lifetime vì không dùng refresh token trong v1
    });
}
```

### Pattern 3: Angular AuthService với Signals + localStorage

**What:** Signal-based AuthService với auto-sync to localStorage và JWT expiry check.

```typescript
// Source: muneersahel.com/blogs/manage-authentication-state-with-angular-signal [CITED]
// Adapted for ABP OpenIddict response format
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly ADMIN_NAME_KEY = 'admin_name';

  private _state = signal<AuthState>({
    token: localStorage.getItem(this.TOKEN_KEY),
    adminName: localStorage.getItem(this.ADMIN_NAME_KEY) ?? '',
    isAuthenticated: this.checkTokenValidity(localStorage.getItem(this.TOKEN_KEY))
  });

  token = computed(() => this._state().token);
  adminName = computed(() => this._state().adminName);
  isAuthenticated = computed(() => this._state().isAuthenticated);

  constructor() {
    // Auto-sync token to localStorage
    effect(() => {
      const token = this.token();
      if (token) {
        localStorage.setItem(this.TOKEN_KEY, token);
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.ADMIN_NAME_KEY);
      }
    });
  }

  private checkTokenValidity(token: string | null): boolean {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  setAuth(token: string, adminName: string): void {
    localStorage.setItem(this.ADMIN_NAME_KEY, adminName);
    this._state.set({ token, adminName, isAuthenticated: true });
  }

  logout(): void {
    this._state.set({ token: null, adminName: '', isAuthenticated: false });
  }
}
```

### Pattern 4: Angular Functional JWT Interceptor

**What:** Functional interceptor (Angular 17+ style) gắn Bearer token vào mọi HTTP request.

```typescript
// Source: angular.dev/guide/http/interceptors [VERIFIED]
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  if (token) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  return next(req);
};

// Error interceptor — handles 401
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const messageService = inject(MessageService); // PrimeNG toast
  const authService = inject(AuthService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        messageService.add({
          severity: 'warn',
          summary: 'Hết phiên',
          detail: 'Phiên đăng nhập đã hết hạn, đang chuyển hướng...'
        });
        authService.logout();
        setTimeout(() => router.navigate(['/login']), 3000); // D-35: 3s delay
      }
      return throwError(() => error);
    })
  );
};

// Register in app.config.ts:
// provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))
```

### Pattern 5: Angular Functional AuthGuard

```typescript
// Source: angular.dev/guide/routing/route-guards [VERIFIED]
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

### Pattern 6: ABP OpenIddict — Resource Owner Password Credentials

**What:** Angular POST trực tiếp tới `/connect/token` với username/password, không cần redirect.

**Cách hoạt động:**
```
Angular LoginComponent
  → POST /connect/token (application/x-www-form-urlencoded)
     grant_type=password
     client_id=KhoThietBi_App
     client_secret=1q2w3e*   ← "dummyClientSecret" vì public client
     username=admin
     password=<user-input>
     scope=offline_access KhoThietBi
  ← { access_token, token_type, expires_in }
```

**Client seeding** trong `OpenIddictDataSeedContributor.cs`:
```csharp
// Source: abp.io/support/questions/1897 [CITED]
await CreateApplicationAsync(
    name: "KhoThietBi_App",
    type: OpenIddictConstants.ClientTypes.Public,
    consentType: OpenIddictConstants.ConsentTypes.Implicit,
    displayName: "KhoThietBi Angular App",
    secret: "1q2w3e*",
    grantTypes: new List<string>
    {
        OpenIddictConstants.GrantTypes.Password,        // ROPC flow
        OpenIddictConstants.GrantTypes.RefreshToken,    // nếu cần sau này
        OpenIddictConstants.GrantTypes.AuthorizationCode
    },
    scopes: new List<string> { "offline_access", "KhoThietBi" },
    redirectUri: "http://localhost:4200",
    postLogoutRedirectUri: "http://localhost:4200"
);
```

### Pattern 7: Custom Vietnamese Login Error Messages

**Vấn đề:** ABP `TokenController` trả về hardcoded English error messages:
- "Invalid username or password!" — khi user không tồn tại HOẶC khi sai password
- Cannot distinguish "user not found" vs "wrong password" from standard response

**Giải pháp D-10:** Override `TokenController` để phân biệt 2 trường hợp:

```csharp
// Source: abp.io/support/questions/5947/Override-token-controller [CITED]
// In KhoThietBi.HttpApi.Host

[Dependency(ReplaceServices = true)]
[ExposeServices(typeof(TokenController))]
public class CustomTokenController : TokenController
{
    private readonly IIdentityUserRepository _userRepository;

    public CustomTokenController(IIdentityUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    // Override SetSuccessResultAsync or ValidatePasswordAsync
    // to check if user exists first, then check password separately
    // Return localized error in error_description field
}
```

**Lưu ý quan trọng:** Khi override TokenController, Angular cần đọc `error_description` từ response body của `/connect/token` (HTTP 400) để hiển thị message phù hợp.

**Angular side:**
```typescript
// In LoginComponent
login(username: string, password: string) {
  this.http.post<TokenResponse>('/connect/token', formData)
    .subscribe({
      error: (err) => {
        const desc = err.error?.error_description;
        if (desc?.includes('not found') || desc?.includes('không tồn tại')) {
          this.errorMessage = 'Tên đăng nhập không tồn tại';
        } else {
          this.errorMessage = 'Mật khẩu không đúng';
        }
      }
    });
}
```

### Pattern 8: PrimeNG PanelMenu Sidebar với Collapsible Groups

**What:** PanelMenu là component hybrid Accordion + Tree, phù hợp cho collapsible nav groups.

**Import trong standalone component:**
```typescript
// Source: v19.primeng.org/panelmenu [CITED]
import { PanelMenuModule } from 'primeng/panelmenu';
// MenuItem interface từ primeng/api

// D-32 menu model:
menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
  {
    label: 'Danh mục', icon: 'pi pi-list', expanded: false, // D-33: đóng mặc định
    items: [
      { label: 'Loại thiết bị', routerLink: '/categories' },
      { label: 'Nhà cung cấp', routerLink: '/suppliers', disabled: true }, // Phase 3
      { label: 'Phòng ban', routerLink: '/departments', disabled: true },  // Phase 4
      // ... các items khác disabled
    ]
  },
  // ... 4 groups còn lại
];
```

**D-34 — Auto-expand active group:** Cần detect current route trong SidebarComponent và set `expanded: true` cho group chứa active route.

### Pattern 9: Split Layout Login Page (D-12)

**What:** CSS grid/flexbox split, không cần PrimeNG Splitter component.

```html
<!-- login.component.html -->
<div class="login-wrapper">
  <!-- Left panel: Branding -->
  <div class="login-left">
    <div class="branding">
      <i class="pi pi-box branding-icon"></i>
      <h1>Quản lý Kho Thiết Bị</h1>
      <p>Hệ thống quản lý tài sản công ty</p>
    </div>
  </div>
  <!-- Right panel: Form -->
  <div class="login-right">
    <p-card>
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="field">
          <label>Tên đăng nhập</label>
          <input pInputText formControlName="username" />
        </div>
        <div class="field">
          <label>Mật khẩu</label>
          <p-password formControlName="password" [toggleMask]="true" />
        </div>
        @if (errorMessage()) {
          <p-message severity="error" [text]="errorMessage()" />
        }
        <p-button type="submit" label="Đăng nhập" [loading]="loading()" />
      </form>
    </p-card>
  </div>
</div>
```

```scss
// login.component.scss
.login-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}
.login-left {
  background: var(--p-primary-color);
  display: flex; align-items: center; justify-content: center;
}
.login-right {
  display: flex; align-items: center; justify-content: center; padding: 2rem;
}
@media (max-width: 768px) {
  .login-wrapper { grid-template-columns: 1fr; }
  .login-left { display: none; }
}
```

### Anti-Patterns to Avoid

- **KHÔNG dùng `@abp/ng.core` packages:** Project dùng Angular 19 standalone KHÔNG dùng ABP Angular UI packages. Mọi auth logic tự implement bằng HttpClient.
- **KHÔNG set `app.UseAuthentication()` thủ công:** ABP module system tự handle pipeline. Chỉ cần configure `AbpAuditingOptions` và `OpenIddictServerBuilder`.
- **KHÔNG lưu sidebar expanded state vào localStorage:** D-33 quy định reset mỗi phiên.
- **KHÔNG để generic "Invalid credentials" message:** D-10 yêu cầu phân biệt 2 loại lỗi. Cần override TokenController.
- **KHÔNG dùng ABP CLI 10.x:** Cần pin `--version 9.3.7` để tương thích với .NET 9 SDK đang cài.
- **KHÔNG hard-code admin password:** Dùng `options.AdminPassword` trong `IDataSeedContext` hoặc config từ `appsettings.json`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User store + password hashing | Custom UserService | ABP Identity Module (pre-wired) | Identity handles password hashing, lockout, user management |
| JWT token generation | Custom JwtTokenService | ABP OpenIddict (pre-wired) | OpenIddict handles token lifecycle, signing keys, expiry |
| Audit trail interceptor | Custom `SaveChangesInterceptor` | ABP Audit Logging + `AddAllEntities()` | ABP captures entity changes với old/new values automatically |
| Permission checking | Custom `[Authorize]` attributes | ABP Permission System | Pre-wired, extensible |
| Database migration runner | Custom migration script | `KhoThietBi.DbMigrator` project | Generated by ABP scaffold, seeds admin user + OpenIddict clients |
| Token endpoint | Custom /api/auth/login | OpenIddict /connect/token | Standard OAuth2 endpoint, already implemented |
| CSS split layout | PrimeNG Splitter | Plain CSS grid | Splitter là interactive resize, không phải fixed split |
| Collapsible nav from scratch | Custom accordion | PrimeNG PanelMenu | Built-in collapsed/expanded state management |

**Key insight:** ABP framework eliminates ~60% of auth boilerplate. The hardest part (custom error messages in D-10) requires overriding `TokenController` — this is the one piece that IS hand-rolled.

---

## Common Pitfalls

### Pitfall 1: ABP CLI Version Mismatch

**What goes wrong:** `dotnet tool install -g Volo.Abp.Cli` mà không pin version sẽ install 10.2.1 (latest), yêu cầu .NET 10 SDK. `abp new` sẽ scaffold solution targeting .NET 10, không phải .NET 9.

**Root cause:** ABP version số align với .NET version. ABP 10 = .NET 10, ABP 9 = .NET 9.

**Prevention:**
```bash
dotnet tool install -g Volo.Abp.Cli --version 9.3.7
abp --version  # phải hiển thị 9.3.7
```

**Warning signs:** `.csproj` files có `<TargetFramework>net10.0</TargetFramework>` thay vì `net9.0`.

### Pitfall 2: PostgreSQL Không Chạy Khi DbMigrator Runs

**What goes wrong:** PostgreSQL không được cài trên máy dev (pg_isready không tìm thấy). `dotnet run` trong DbMigrator project sẽ fail với connection error.

**Root cause:** [VERIFIED: pg_isready not found on this machine, Docker found but not running]

**Prevention:** Dùng Docker để chạy PostgreSQL:
```bash
docker run --name kho-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=KhoThietBi -p 5432:5432 -d postgres:14
```
Hoặc cài PostgreSQL native trên Windows. Connection string trong `DbMigrator/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=KhoThietBi;Username=postgres;Password=postgres"
  }
}
```

### Pitfall 3: TokenController Override Nhưng Angular Không Đọc Được Error

**What goes wrong:** Override `TokenController` để trả về Vietnamese error, nhưng Angular đọc sai field. OpenIddict trả về OAuth2 error format: `{ "error": "invalid_grant", "error_description": "..." }`. Nếu Angular đọc `error.error.message` thay vì `error.error.error_description`, sẽ không hiển thị được message.

**Prevention:** Angular cần đọc `err.error?.error_description` từ HTTP 400 response body. Test với Postman trước khi wire vào Angular.

### Pitfall 4: PanelMenu routerLink Không Highlight Active Item

**What goes wrong:** PrimeNG PanelMenu không tự highlight active route item vì cần `RouterModule` được import và `routerLinkActive` được set đúng.

**Prevention:** Import `RouterModule` trong SidebarComponent. Sử dụng `styleClass` conditionally based on current route. D-34 (auto-expand active group) cần implement manually bằng cách inject `Router` và detect current URL trong `ngOnInit`.

### Pitfall 5: Audit Logging Không Track Entities Nếu Không Extend ABP Base Class

**What goes wrong:** Nếu entity không implement `IEntity` (không extend `Entity<Guid>` hoặc `AggregateRoot<Guid>`), `AddAllEntities()` sẽ không track changes cho entity đó.

**Prevention:** Tất cả domain entities PHẢI extend `Entity<Guid>` hoặc `AggregateRoot<Guid>`. Verify bằng cách check ABP Audit Logging source: selector kiểm tra `typeof(IEntity).IsAssignableFrom(type)`.

### Pitfall 6: LoginComponent Gọi `/connect/token` Với JSON Content-Type

**What goes wrong:** `/connect/token` là OAuth2 endpoint, phải nhận `application/x-www-form-urlencoded`, KHÔNG phải `application/json`. Gọi với JSON body sẽ trả 400.

**Prevention:**
```typescript
// Đúng:
const body = new HttpParams()
  .set('grant_type', 'password')
  .set('client_id', 'KhoThietBi_App')
  .set('client_secret', '1q2w3e*')
  .set('username', username)
  .set('password', password)
  .set('scope', 'KhoThietBi');

this.http.post<TokenResponse>('/connect/token', body.toString(), {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
```

---

## Code Examples

### 1. ABP Audit Logging Configuration

```csharp
// Source: abp.io/docs/latest/framework/infrastructure/audit-logging [VERIFIED]
// KhoThietBi.HttpApi.Host / KhoThietBiHttpApiHostModule.cs

public override void ConfigureServices(ServiceConfigurationContext context)
{
    Configure<AbpAuditingOptions>(options =>
    {
        options.IsEnabled = true;
        options.EntityHistorySelectors.AddAllEntities();
        // IsEnabledForGetRequests = false (default — GET requests không audit)
        // IsEnabledForAnonymousUsers = false (default)
    });
    // ... other configurations
}
```

### 2. OpenIddict Token Lifetime — 8 giờ

```csharp
// Source: abp.io/support/questions/3948 [CITED]
public override void PreConfigureServices(ServiceConfigurationContext context)
{
    PreConfigure<OpenIddictServerBuilder>(builder =>
    {
        builder.SetAccessTokenLifetime(TimeSpan.FromHours(8));
        // D-08: 8h JWT, no refresh token in v1
    });
}
```

### 3. Angular app.config.ts — Provider Setup

```typescript
// Source: angular.dev/guide/http/interceptors [VERIFIED]
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),
    MessageService, // PrimeNG toast
  ]
};
```

### 4. Angular Login Service — POST /connect/token

```typescript
// ROPC flow — no @abp/ng packages needed
@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  login(username: string, password: string): Observable<void> {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', 'KhoThietBi_App')
      .set('client_secret', '1q2w3e*')
      .set('username', username)
      .set('password', password)
      .set('scope', 'KhoThietBi');

    return this.http.post<TokenResponse>(
      '/connect/token',
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).pipe(
      tap(response => {
        this.authService.setAuth(response.access_token, username);
        this.router.navigate(['/dashboard']); // D-13
      })
    );
  }
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
```

### 5. Angular Route Config với AuthGuard

```typescript
// Source: angular.dev/guide/routing/route-guards [VERIFIED]
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component') },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],  // D-17: protect all routes
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component') },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Phase 2+ routes (disabled menu items still defined here for future)
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ABP IdentityServer4 | ABP OpenIddict | ABP 7.x (2022) | OpenIddict là token server mới; IdentityServer4 deprecated |
| Angular class-based HttpInterceptor | Functional HttpInterceptorFn | Angular 15 (2022) | Functional interceptors dễ test hơn, tree-shakeable |
| NgRx for state management | Angular Signals + Services | Angular 16 (2023) | Signals giảm boilerplate, Signals là 2025 best practice |
| NgModules | Standalone Components | Angular 14+ (2022), default từ v17 | No module boilerplate |
| `BehaviorSubject` + `Observable` | `signal()` + `computed()` | Angular 16 (2023) | Signals sync, computed derivations auto-update |

**Deprecated/outdated:**
- `IdentityServer4` → ABP đã chuyển sang OpenIddict từ ABP 7.x, đừng tìm IdentityServer docs
- `@abp/ng.core` packages → Project KHÔNG dùng ABP Angular UI packages, custom implementation
- `withInterceptorsFromDi()` (class-based) → Dùng `withInterceptors([fn])` functional style

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Resource Owner Password Credentials (ROPC) là cách phù hợp nhất cho admin-only SPA không cần redirect | Architecture Patterns — Pattern 6 | Nếu team muốn dùng PKCE thì cần implement full Authorization Code flow với redirect, phức tạp hơn nhiều |
| A2 | Override `TokenController` là đủ để phân biệt "user not found" vs "wrong password" | Pattern 7, Pitfall 3 | ABP có thể seal/replace logic, cần verify override hoạt động đúng trong ABP 9.3 |
| A3 | `OpenIddictDataSeedContributor` được tự động generate trong template `--ui none` | Pattern 6 | Nếu template không generate file này, cần tạo manual; cần verify sau scaffold |
| A4 | `KhoThietBi.DbMigrator` project được generate bởi `abp new` template | Architecture Patterns | Template `--ui none` có thể không generate DbMigrator; cần verify |

---

## Open Questions

1. **`abp new --ui none` có generate `DbMigrator` project không?**
   - What we know: ABP `app` template thường generate DbMigrator
   - What's unclear: Template `--ui none` có thể có structure khác
   - Recommendation: Verify sau khi scaffold bằng cách kiểm tra thư mục được tạo; nếu không có DbMigrator, dùng `dotnet ef database update` trong `HttpApi.Host`

2. **`TokenController` override trong ABP 9.3 có hoạt động không?**
   - What we know: ABP support `[Dependency(ReplaceServices = true)]` pattern cho override
   - What's unclear: ABP 9.3 có thể đã thay đổi cách TokenController được register
   - Recommendation: Implement override, test với Postman trước khi wire Angular; nếu không work, dùng approach khác (custom middleware check user tồn tại trước khi call /connect/token)

3. **Proxy configuration cho Angular dev server → ABP backend**
   - What we know: Angular dev server chạy trên port 4200, ABP chạy trên 44305 (hoặc configured port)
   - What's unclear: Cần `proxy.conf.json` để route `/connect/token` và `/api/...` sang backend
   - Recommendation: Configure proxy trong `angular.json` hoặc dùng `proxyConfig` option

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| .NET 9 SDK | ABP backend scaffold | ✓ | 9.0.101 | — |
| Node.js | Angular frontend | ✓ | v20.19.0 | — |
| npm | Angular packages | ✓ | 10.8.2 | — |
| Volo.Abp.Cli | ABP scaffold | ✗ | — | Install: `dotnet tool install -g Volo.Abp.Cli --version 9.3.7` |
| PostgreSQL | Database | ✗ | — | Docker: `docker run --name kho-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14` |
| Docker Desktop | PostgreSQL container | ✓ (found) | 28.0.4 (client) | — |
| Docker Engine | Run containers | ✗ (not running) | — | Start Docker Desktop trước khi develop |
| dotnet-ef | EF migrations | ✓ | 9.0.5 | — |

**Missing dependencies with no fallback:**
- Volo.Abp.Cli — phải install trước khi scaffold (Wave 0 task)
- PostgreSQL / Docker Engine running — phải start trước khi run DbMigrator (Wave 0 task)

**Missing dependencies with fallback:**
- Không có

**Wave 0 blockers:**
1. `dotnet tool install -g Volo.Abp.Cli --version 9.3.7`
2. Start Docker Desktop → `docker run --name kho-postgres ...`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | xUnit (auto-included in ABP template) + Angular Jasmine/Karma (Angular CLI default) |
| Config file (backend) | `KhoThietBi.Application.Tests/KhoThietBiApplicationTestModule.cs` (generated) |
| Config file (frontend) | `karma.conf.js` (Angular CLI generated) |
| Quick run command (backend) | `dotnet test --filter "Category=Unit"` |
| Full suite command (backend) | `dotnet test` |
| Quick run command (frontend) | `ng test --watch=false --browsers=ChromeHeadless` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Admin login với valid credentials → JWT token | Integration | `dotnet test --filter "Auth"` | ❌ Wave 0 |
| AUTH-01 | Login với username không tồn tại → specific error | Unit | `dotnet test --filter "TokenController"` | ❌ Wave 0 |
| AUTH-01 | Login với wrong password → specific error | Unit | `dotnet test --filter "TokenController"` | ❌ Wave 0 |
| AUTH-02 | Token từ localStorage valid → isAuthenticated = true | Unit (Angular) | `ng test --include auth.service.spec.ts` | ❌ Wave 0 |
| AUTH-02 | Token hết hạn → isAuthenticated = false | Unit (Angular) | `ng test --include auth.service.spec.ts` | ❌ Wave 0 |
| AUTH-02 | AuthGuard redirect khi không authenticated | Unit (Angular) | `ng test --include auth.guard.spec.ts` | ❌ Wave 0 |
| AUTH-03 | Write operation tạo AuditLog record | Integration | `dotnet test --filter "AuditLog"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `dotnet build` (backend) + `ng build --configuration development` (frontend)
- **Per wave merge:** `dotnet test` + `ng test --watch=false`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `KhoThietBi.Application.Tests/Auth/TokenControllerTests.cs` — covers AUTH-01 custom error messages
- [ ] `KhoThietBi.Application.Tests/Auth/AuditLogIntegrationTests.cs` — covers AUTH-03
- [ ] `kho-thiet-bi-ui/src/app/core/services/auth.service.spec.ts` — covers AUTH-02
- [ ] `kho-thiet-bi-ui/src/app/core/guards/auth.guard.spec.ts` — covers AUTH-02 guard behavior

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | ABP Identity + OpenIddict (pre-wired) |
| V3 Session Management | yes | JWT 8h lifetime (D-08), localStorage (client-side) |
| V4 Access Control | yes | ABP Permission System + AuthGuard |
| V5 Input Validation | yes | FluentValidation (ABP pipeline) + Angular Reactive Forms |
| V6 Cryptography | yes | ABP Identity (bcrypt password hashing) + OpenIddict (JWT RS256) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Brute force login | Spoofing | ABP Identity lockout (pre-configured) |
| Token theft (localStorage) | Information Disclosure | Acceptable risk cho admin-only internal tool; short session scope |
| CORS misconfiguration | Elevation of Privilege | Configure `AllowedOrigins` trong ABP CORS settings |
| XSS → token theft | Tampering | Sanitize Angular templates; PrimeNG sanitizes by default |
| Unprotected API endpoints | Elevation of Privilege | `[Authorize]` trên tất cả controllers (ABP default behavior) |

**Token trong localStorage:** Đây là [ASSUMED] risk tradeoff. Cho admin-only internal tool, localStorage là acceptable. HttpOnly cookie bảo mật hơn nhưng phức tạp hơn cho CORS setup. D-08/D-09 locks localStorage approach.

---

## Sources

### Primary (HIGH confidence)

- [ABP Audit Logging — abp.io/docs/latest/framework/infrastructure/audit-logging](https://abp.io/docs/latest/framework/infrastructure/audit-logging) — `AddAllEntities()` configuration, entity change tracking, table names
- [Angular HTTP Interceptors — angular.dev/guide/http/interceptors](https://angular.dev/guide/http/interceptors) — functional interceptor syntax, `withInterceptors()` registration
- [Angular Route Guards — angular.dev/guide/routing/route-guards](https://angular.dev/guide/routing/route-guards) — `CanActivateFn` functional guard syntax
- [npm registry — primeng@19](https://www.npmjs.com/package/primeng) — version 19.1.4 verified
- [npm registry — @angular/cli@19](https://www.npmjs.com/package/@angular/cli) — version 19.2.24 verified
- [nuget.org — Volo.Abp.Cli](https://www.nuget.org/packages/Volo.Abp.Cli) — version 9.3.7 latest stable 9.x confirmed

### Secondary (MEDIUM confidence)

- [ABP OpenIddict Module — abp.io/docs/en/abp/latest/Modules/OpenIddict](https://abp.io/docs/en/abp/latest/Modules/OpenIddict) — token lifetime config, client seeding pattern
- [ABP Support — OAuth Password Grant Type #1897](https://abp.io/support/questions/1897/Oauth-Password-Grant-Type-in-Use) — ROPC configuration, environment.ts settings
- [ABP Support — OpenIddict token lifetime #3948](https://abp.io/support/questions/3948/OpenIddict-change-access-token-expiration-time) — `PreConfigure<OpenIddictServerBuilder>` pattern
- [ABP Support — Override TokenController #5947](https://abp.io/support/questions/5947/Override-token-controller) — `[Dependency(ReplaceServices = true)]` pattern
- [Manage Auth State with Angular Signal — muneersahel.com](https://muneersahel.com/blogs/manage-authentication-state-with-angular-signal) — Signal-based AuthService pattern
- [PrimeNG PanelMenu v19 — v19.primeng.org/panelmenu](https://v19.primeng.org/panelmenu) — component API

### Tertiary (LOW confidence — flag for validation)

- ABP scaffold generates `DbMigrator` with `--ui none` — not explicitly verified, [ASSUMED] based on general ABP template behavior
- `OpenIddictDataSeedContributor` auto-generated in `--ui none` template — [ASSUMED]
- TokenController override hoạt động đúng trong ABP 9.3.7 — [ASSUMED], needs runtime verification

---

## Metadata

**Confidence breakdown:**

- Standard Stack: HIGH — versions verified via npm registry + nuget.org
- Architecture: HIGH — ABP documentation + Angular official docs
- Auth flow (ROPC): MEDIUM — documented but marked "discouraged" by OAuth2 spec; functional for internal admin tool
- Custom error messages: MEDIUM — pattern documented in community posts, needs runtime verification
- Pitfalls: HIGH — verified against ABP community forums + official docs

**Research date:** 2026-04-15
**Valid until:** 2026-07-15 (stable libraries — ABP 9.3.x patch releases don't break APIs)
