---
phase: 01-foundation
plan: 02
subsystem: frontend-auth
tags: [angular19, primeng19, signals, jwt, auth-guard, interceptors, spa]
dependency_graph:
  requires:
    - 01-01 (ABP backend: /connect/token ROPC endpoint, admin seeded, port 44369)
  provides:
    - Angular 19 SPA at localhost:4200
    - AuthService (Signals + localStorage + JWT expiry check)
    - LoginService (ROPC flow via /connect/token)
    - JWT interceptor (attaches Bearer token)
    - Error interceptor (401 session-expired toast + 3s redirect, 403 forbidden toast)
    - AuthGuard (CanActivateFn protecting all routes)
    - Split-layout login page with Vietnamese error messages
    - App shell: sidebar (5 collapsible groups) + header (page title + admin name + logout)
    - Dashboard placeholder: 5 KPI cards with static 0 values
  affects:
    - All subsequent phases (Angular SPA shell — all feature routes build on this)
tech_stack:
  added:
    - Angular 19.2.x (standalone, esbuild builder)
    - PrimeNG 19.1.4 (Button, Password, InputText, Message, Toast, Toolbar)
    - PrimeIcons 7.0.0
    - Angular Signals (built-in) for AuthService state
    - Prettier 3.x + @angular-eslint/eslint-plugin 18.x (dev deps)
  patterns:
    - Functional HTTP interceptors (HttpInterceptorFn) — no class interceptors
    - Signal-based service store (AuthService) with computed() selectors
    - Lazy-loaded standalone components via loadComponent()
    - AuthGuard as CanActivateFn (functional guard, no class)
    - Proxy config (proxy.conf.json) for Angular dev server -> ABP backend
key_files:
  created:
    - kho-thiet-bi-ui/src/app/app.config.ts
    - kho-thiet-bi-ui/src/app/app.routes.ts
    - kho-thiet-bi-ui/src/app/app.component.ts
    - kho-thiet-bi-ui/src/app/core/services/auth.service.ts
    - kho-thiet-bi-ui/src/app/core/services/login.service.ts
    - kho-thiet-bi-ui/src/app/core/interceptors/jwt.interceptor.ts
    - kho-thiet-bi-ui/src/app/core/interceptors/error.interceptor.ts
    - kho-thiet-bi-ui/src/app/core/guards/auth.guard.ts
    - kho-thiet-bi-ui/src/app/features/auth/login/login.component.ts
    - kho-thiet-bi-ui/src/app/features/auth/login/login.component.html
    - kho-thiet-bi-ui/src/app/features/auth/login/login.component.scss
    - kho-thiet-bi-ui/src/app/shared/layout/app-layout/app-layout.component.ts
    - kho-thiet-bi-ui/src/app/shared/layout/app-layout/app-layout.component.html
    - kho-thiet-bi-ui/src/app/shared/layout/app-layout/app-layout.component.scss
    - kho-thiet-bi-ui/src/app/shared/layout/sidebar/sidebar.component.ts
    - kho-thiet-bi-ui/src/app/shared/layout/sidebar/sidebar.component.html
    - kho-thiet-bi-ui/src/app/shared/layout/sidebar/sidebar.component.scss
    - kho-thiet-bi-ui/src/app/shared/layout/header/header.component.ts
    - kho-thiet-bi-ui/src/app/shared/layout/header/header.component.html
    - kho-thiet-bi-ui/src/app/shared/layout/header/header.component.scss
    - kho-thiet-bi-ui/src/app/features/dashboard/dashboard.component.ts
    - kho-thiet-bi-ui/src/app/features/dashboard/dashboard.component.html
    - kho-thiet-bi-ui/src/app/features/dashboard/dashboard.component.scss
    - kho-thiet-bi-ui/src/styles.scss
    - kho-thiet-bi-ui/proxy.conf.json
    - kho-thiet-bi-ui/angular.json
  modified: []
decisions:
  - "PrimeNG 19.x does not ship CSS files in primeng/resources/ — removed those imports, kept only primeicons/primeicons.css; PrimeNG 17+ styling is embedded in components via CSS layers"
  - "Combined Tasks 1+2+3 into single commit (971d22e) — components depend on each other for build to pass; plan assumed sequential build verification per task but Angular requires all lazy-loaded components to exist before build succeeds"
  - "Proxy target set to https://localhost:44369 (read from KhoThietBi/aspnet-core/src/KhoThietBi.HttpApi.Host/Properties/launchSettings.json)"
metrics:
  duration: 15m
  completed_date: "2026-04-16"
  tasks_completed: 3
  tasks_total: 4
  files_created: 27
  files_modified: 0
---

# Phase 01 Plan 02: Angular Frontend Shell Summary

Angular 19 SPA with AuthService (Signals + localStorage), split-layout login page with Vietnamese error messages, JWT + error HTTP interceptors, AuthGuard, collapsible 5-group sidebar, and dashboard placeholder with 5 KPI static cards.

## What Was Built

### Task 1: Angular Scaffold + Core Services

Angular 19 project scaffolded with PrimeNG 19.1.4. Core auth infrastructure:

- **AuthService** (`auth.service.ts`): Signal-based state (`signal<AuthState>`) with `computed()` selectors for `token`, `adminName`, `isAuthenticated`. Reads from `localStorage` on init, checks JWT expiry via `checkTokenValidity()` (base64 decode + exp comparison). `effect()` syncs state changes back to localStorage.
- **LoginService** (`login.service.ts`): ROPC flow — POSTs `application/x-www-form-urlencoded` to `/connect/token` with `grant_type=password`, `client_id=KhoThietBi_App`, `client_secret=1q2w3e*`, `scope=KhoThietBi`. On success, calls `authService.setAuth()` and navigates to `/dashboard`.
- **jwtInterceptor** (`jwt.interceptor.ts`): Functional `HttpInterceptorFn`. Attaches `Authorization: Bearer {token}` to all requests except `/connect/token`.
- **errorInterceptor** (`error.interceptor.ts`): Functional `HttpInterceptorFn`. On 401 (non-login): shows PrimeNG Toast ("Phien dang nhap da het han"), then after 3000ms calls `authService.logout()` + navigates to `/login`. On 403: shows forbidden toast.
- **authGuard** (`auth.guard.ts`): `CanActivateFn`. Checks `authService.isAuthenticated()`, returns `router.createUrlTree(['/login'])` if false.
- **app.config.ts**: `provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))`, `provideAnimationsAsync()`, `MessageService`.
- **app.routes.ts**: `login` route (no guard), parent `''` route with `canActivate: [authGuard]` wrapping `dashboard` child. All lazy-loaded via `loadComponent()`.
- **proxy.conf.json**: `/connect` and `/api` proxied to `https://localhost:44369` (ABP backend).

### Task 2: Login Page

Split-layout login page (D-12):
- **Left panel** (`#1E3A5F` navy): "KTB" circle logo + "Quan ly Kho Thiet Bi" system name + tagline in `#93C5FD`.
- **Right panel** (white): Reactive form with `p-inputtext` (username) + `p-password` (password, `[toggleMask]="true"`) + `p-button` (primary, full-width, 44px height).
- **Vietnamese error messages** (D-10): `error_description.includes('khong ton tai')` → "Tai khoan khong ton tai"; otherwise → "Mat khau khong dung"; status 0 → "Khong the ket noi den may chu".
- **Responsive**: `@media (max-width: 768px)` hides left panel.

### Task 3: App Shell — Sidebar + Header + Dashboard

App shell (D-14):
- **AppLayoutComponent**: `display: flex`, fixed sidebar (256px), main area with `margin-left: var(--sidebar-width)`.
- **HeaderComponent**: `p-toolbar` with page title (derived from router URL), admin avatar (initials, `#EFF6FF` bg, `#2563EB` text), admin username, "Dang xuat" button (outlined, small).
- **SidebarComponent**: Fixed 256px, 5 navigation items (Dashboard standalone + 4 collapsible groups: Danh muc, Nhap xuat kho, Quan ly, Thong ke). All groups `expanded: false` by default (D-33). `expandActiveGroup()` auto-expands group containing current route on `NavigationEnd` (D-34). `toggleGroup()` closes other groups (only one open at a time). Disabled items: `#9CA3AF` text, `cursor: not-allowed`, `pointer-events: none`. Active item: `3px solid #2563EB` left border + `#EFF6FF` background.
- **DashboardComponent**: 5 static KPI cards (Tong thiet bi: 0, Dang ban giao: 0, Trong du an: 0, Dang bao tri: 0, Gia tri ton kho: 0 d). No API calls (D-36). Fixed 120px height per UI-SPEC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PrimeNG 19 breaking change: no CSS files in primeng/resources/**
- **Found during:** Task 1 build verification
- **Issue:** Plan specified `@import "primeng/resources/themes/lara-light-blue/theme.css"` and `@import "primeng/resources/primeng.min.css"` in `styles.scss`. PrimeNG 19.x removed these files — theming is now embedded in components via CSS layers. The imports caused build to fail with "Could not resolve" errors.
- **Fix:** Removed both PrimeNG CSS imports from `styles.scss`. Kept only `primeicons/primeicons.css` (which still ships as a CSS file). PrimeNG 19 components render their own styles via `@layer primeng`.
- **Files modified:** `kho-thiet-bi-ui/src/styles.scss`
- **Commit:** 971d22e

### Process Deviation

**Tasks 1+2+3 combined in one commit (971d22e):** Plan expected incremental build verification per task. In practice, all lazy-loaded components must exist before `ng build` can resolve imports. Creating Task 1 components would fail build without Task 2+3 components already in place. Combined into one commit with all 27 files. All acceptance criteria for Tasks 1, 2, and 3 individually verified post-commit.

## Known Stubs

| Component | File | Stub | Resolution |
|-----------|------|------|------------|
| DashboardComponent KPI cards | `dashboard.component.ts` | `value: '0'` / `'0 d'` — hardcoded zeros, no API calls | Intentional per D-36. Phase 15 replaces with real data from aggregation APIs. |
| Sidebar nav items | `sidebar.component.ts` | All non-Dashboard items have `disabled: true` | Intentional per D-15. Each phase enables its items when routes are implemented. |

Note: These stubs are **intentional** per design decisions D-36 and D-15 — they do NOT prevent the plan's goal from being achieved (goal is working auth + app shell, not live dashboard data).

## Threat Flags

No new threat surface introduced beyond what is documented in the plan's threat model (T-1-05, T-1-09, T-1-10, T-1-11).

## Self-Check

### Files exist check:
- `kho-thiet-bi-ui/src/app/core/services/auth.service.ts` — FOUND
- `kho-thiet-bi-ui/src/app/core/services/login.service.ts` — FOUND
- `kho-thiet-bi-ui/src/app/core/interceptors/jwt.interceptor.ts` — FOUND
- `kho-thiet-bi-ui/src/app/core/interceptors/error.interceptor.ts` — FOUND
- `kho-thiet-bi-ui/src/app/core/guards/auth.guard.ts` — FOUND
- `kho-thiet-bi-ui/src/app/features/auth/login/login.component.ts` — FOUND
- `kho-thiet-bi-ui/src/app/shared/layout/sidebar/sidebar.component.ts` — FOUND
- `kho-thiet-bi-ui/src/app/features/dashboard/dashboard.component.ts` — FOUND

### Commit exists check:
- 971d22e — FOUND (feat(01-02): Angular 19 scaffold + core services + auth infrastructure)

### Build verification:
- `npx ng build --configuration=development` — PASSED (0 errors, 0 warnings)

## Self-Check: PASSED
