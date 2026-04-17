# Phase 01 — UI Review

**Audited:** 2026-04-16
**Baseline:** .planning/phases/01-foundation/01-UI-SPEC.md (approved design contract)
**Screenshots:** Captured — login page (desktop, tablet, mobile), dashboard (unauthenticated redirect)
**Dev server:** localhost:4200 (Angular 19 + PrimeNG 19)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | Toan bo chuoi tieng Viet bi mat dau — hien thi khong dau trong UI |
| 2. Visuals | 2/4 | PrimeNG input/button render "invisible" — chi thay label, khong thay input border/fill |
| 3. Color | 3/4 | Hardcode hex dung chinh xac theo spec, nhung chua dung bien CSS var |
| 4. Typography | 2/4 | 2 kich co ngoai spec (1rem, 1.5rem); avatar 32px thay vi 24px trong spec |
| 5. Spacing | 3/4 | Comment sai (gap 24px ghi nham la "2xl token"); khong co arbitrary value |
| 6. Experience Design | 3/4 | Loading + error state day du; thieu sidebar animation va tooltip delay |

**Overall: 15/24**

---

## Top 3 Priority Fixes

1. **Toan bo chuoi tieng Viet mat dau thanh (diacritics missing)** — Nguoi dung thay "Dang nhap", "Quan ly Kho Thiet Bi" thay vi "Dang nhap", "Quan ly Kho Thiet Bi" — day la van de nghiem trong nhat ve Copywriting va tao an tuong chuyen nghiep kem. Fix: doi toan bo string literal trong `.ts` va `.html` sang Unicode co dau (vi du: `'Đăng nhập'`, `'Tài khoản không tồn tại...'`, `'Quản lý Kho Thiết Bị'`). Anh huong tren 25 string.

2. **PrimeNG `p-inputtext` va `p-button` khong hien thi border/background** — Tren screenshot, cac input chi hien thi label label va icon mat khau (eye icon), khong co input box nao. Nut "Dang nhap" chi la text khong mau. PrimeNG 19 loai bo CSS resource files va dua styling vao CSS `@layer primeng` — nhung can kiem tra xem `provideAnimationsAsync()` va PrimeNG theme layer co duoc apply dung khong. Fix: (a) them `import { providePrimeNG } from 'primeng/config'` + `import Lara from '@primeng/themes/lara'` vao `app.config.ts` va configure theme, hoac (b) xac nhan PrimeNG 19 "unstyled mode" la cu the co chu y.

3. **Header avatar diameter: 32px vs UI-SPEC 24px** — UI-SPEC Section "App Shell" dinh nghia avatar circle la 24px diameter. Code dang dung 32px (`header.component.scss` dong 28-29). Du day la issue nho ve visual, do la sai so voi design contract duoc ky ket. Fix: doi `.avatar-circle { width: 32px; height: 32px; }` thanh `width: 24px; height: 24px;` trong `header.component.scss`.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**Nghiem trong — Toan bo string tieng Viet mat dau**

Day la van de lan nhat trong Phase 1. Tat ca string nguoi dung thay deu duoc viet khong co dau Unicode (no diacritics). So sanh:

| Nguon | UI-SPEC / Contract | Code thuc te | File |
|-------|-------------------|--------------|------|
| System name | "Quản lý Kho Thiết Bị" | "Quan ly Kho Thiet Bi" | `login.component.html:8` |
| Form title | "Đăng nhập" | "Dang nhap" | `login.component.html:16` |
| Submit button | "Đăng nhập" | "Dang nhap" | `login.component.html:54` |
| Username label | "Tên đăng nhập" | "Ten dang nhap" | `login.component.html:20` |
| Password label | "Mật khẩu" | "Mat khau" | `login.component.html:34` |
| Tagline | "Hệ thống quản lý tài sản công ty" | "He thong quan ly tai san cong ty" | `login.component.html:9` |
| Logout button | "Đăng xuất" | "Dang xuat" | `header.component.html:10` |
| KPI: Tổng thiết bị | "Tổng thiết bị" | "Tong thiet bi" | `dashboard.component.ts:20` |
| KPI: Đang bàn giao | "Đang bàn giao" | "Dang ban giao" | `dashboard.component.ts:21` |
| Dashboard subtitle | "Tổng quan kho thiết bị" | "Tong quan kho thiet bi" | `dashboard.component.html:4` |
| Toast session expired | "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." | "Phien dang nhap da het han. Vui long dang nhap lai." | `error.interceptor.ts:21` |
| Toast 403 | "Bạn không có quyền thực hiện thao tác này." | "Ban khong co quyen thuc hien thao tac nay." | `error.interceptor.ts:34` |
| Sidebar disabled tooltip | "Chức năng này chưa được triển khai." | "Chuc nang nay chua duoc trien khai." | `sidebar.component.html:38` |
| Field validation | "Tên đăng nhập không được để trống." | "Ten dang nhap khong duoc de trong." | `login.component.html:29` |

**Pham vi:** Tat ca cac component (login, dashboard, header, sidebar, error interceptor).

**Cac copy DUNG theo spec (khong can sua):**
- `p-message severity="error"` dung dung vi tri (below submit) — correct
- Loading state text "Dang xu ly..." — dung pattern, chi mat dau

**Sidebar group labels (`.ts` data):**
- "Danh muc" → nen la "Danh mục" — `sidebar.component.ts:37`
- "Nhap xuat kho" → "Nhập xuất kho" — `sidebar.component.ts:50`
- "Quan ly" → "Quản lý" — `sidebar.component.ts:61`
- "Thong ke" → "Thống kê" — `sidebar.component.ts:70`
- Toan bo 17 nav item labels cung bi mat dau

**App title:** `index.html` co title "KhoThietBiUi" — nen sua thanh "Quản lý Kho Thiết Bị" (UI-SPEC khong dinh nghia nhung chuyen nghiep hon).

---

### Pillar 2: Visuals (2/4)

**PrimeNG input va button khong render dung tren screenshot**

Tren screenshot desktop (1440x900), trang login hien thi:
- Left panel: Chinh xac — navy `#1E3A5F`, logo KTB circle, system name, tagline
- Right panel: Chi hien thi label "Ten dang nhap", label "Mat khau", eye icon nho, text "Dang nhap" — KHONG co input border, khong co input background, nut "Dang nhap" khong co filled blue background

Day la bieu hien cua PrimeNG 19 "styled mode" chua duoc cau hinh theme. PrimeNG 19 doi sang "unstyled by default" va yeu cau explicit theme provider. `styles.scss` da xoa ca hai dong `@import "primeng/resources/..."` (dung) nhung chua cau hinh theme provider moi (thieu).

**Dieu nay co nghia la:**
- Input fields co the invisible hoac rat nhat
- Buttons khong co filled state
- Password toggle chi hien eye icon (khong co container)
- Toan bo authenticated app shell (sidebar, header, dashboard) cung co the bi anh huong

**Dieu tot:**
- Split layout structure: CHINH XAC — 50/50, left navy, right white
- Visual hierarchy: Left panel la focal point thu cap, right form la primary (dung)
- Logo circle (80px, white border) hien thi dung
- Responsive: Mobile screenshot xac nhan left panel bi an khi < 768px (DUNG)

**Van de thu cap:**
- Header layout: Spec mo ta header la full-width (toan bo chieu ngang, tren ca sidebar va content). Code dang render header CHI trong `main-area`, do do header khong phu tren sidebar. Sidebar co logo rieng (56px height match header height) — nen nhin OK nhung khong chinh xac theo spec.
- Sidebar animation: UI-SPEC yeu cau `@slideDown` (150ms ease-out) khi mo group. Code khong co Angular animation — chi dung `@if` (instant show/hide). `sidebar.component.ts` khong import `animations`.

---

### Pillar 3: Color (3/4)

**Phan tich mau:**

Tat ca mau hex duoc hardcode dung chinh xac theo UI-SPEC:
- `#1E3A5F` — login left panel: DUNG
- `#93C5FD` — login tagline: DUNG
- `#2563EB` — accent (logo initials bg, active nav, KPI icons, avatar text): DUNG
- `#EFF6FF` — accent light (active nav bg, avatar bg): DUNG
- `#9CA3AF` — disabled text: DUNG
- `#374151`, `#111827`, `#6B7280` — text hierarchy: DUNG
- `#E5E7EB` — borders: DUNG
- `#DC2626` — destructive/field error: DUNG

**Van de: Hardcode thay vi dung CSS variables**

`styles.scss` dinh nghia day du CSS custom properties (`--color-accent`, `--color-surface`, v.v.) nhung cac component khong dung bien do. Thay vao do, moi component hardcode lai gia tri hex.

Vi du trong `header.component.scss`:
```scss
background-color: #EFF6FF;  // nen la var(--color-accent-light)
color: #2563EB;               // nen la var(--color-accent)
```

**Ket qua:** 60% color rules trong component files hardcode hex thay vi dung `var(--color-*)`. Day la van de maintainability — neu mau thay doi, phai sua nhieu cho.

**Kiem tra 60/30/10 split:**
- Dominant 60% (`#F8F9FA` bg): DUNG trong `app-layout.component.scss`
- Secondary 30% (`#FFFFFF` sidebar, cards, header): DUNG
- Accent 10% (`#2563EB`): Dung o 5 diem duoc spec (button, active nav indicator, KPI icons, avatar, logo) — KHONG overuse

**Registry audit:** No shadcn. No third-party registries. Bao qua.

---

### Pillar 4: Typography (2/4)

**Font sizes phat hien:**

| Gia tri | Tuong duong | Co trong UI-SPEC? |
|---------|-------------|-------------------|
| `0.75rem` (12px) | Label | DA KHAI BAO — Label role |
| `0.875rem` (14px) | Body | DA KHAI BAO — Body role |
| `1.25rem` (20px) | Heading | DA KHAI BAO — Heading role |
| `1.75rem` (28px) | Display | DA KHAI BAO — Display role |
| `1rem` (16px) | (Icon size) | NGOAI SPEC |
| `1.5rem` (24px) | (Icon size) | NGOAI SPEC |

Tong: **6 font sizes** trong khi spec gioi han trong **4 sizes**.

**Chi tiet vi pham:**
- `sidebar.component.scss:71` — `font-size: 1rem` cho sidebar icon (`i` element). Nav icons la decoration, nen dung `width: 20px` (da co) thay vi font-size rieng.
- `login.component.scss:31` — `font-size: 1.5rem` cho KTB logo span text. Day la icon text, co the chap nhan nhung lam tang so font size.
- `dashboard.component.scss:53` — `font-size: 1.5rem` cho `.kpi-icon` (KPI icon). Comment noi "24px per UI-SPEC" — UI-SPEC xac nhan icon 24px la dung nhung khong dat ten size trong typography scale.

**Font weights:**
Chi co `400` va `600` — CHINH XAC THEO SPEC (exactly 2 weights).

**Avatar size discrepancy:**
- UI-SPEC (App Shell section): "Avatar circle with admin initials (24px diameter, background `#EFF6FF`, text `#2563EB`)"
- Code `header.component.scss:28-29`: `width: 32px; height: 32px;`
- Lech 8px — nen sua lai thanh 24px

---

### Pillar 5: Spacing (3/4)

**Spacing scale analysis:**

Cac gia tri spacing duoc su dung:
- `4px` (xs): Khong thay trong code
- `8px` (sm): `margin-bottom: 8px` (login label), `margin: 0 0 4px` (dashboard title)
- `16px` (md): `padding: 0 16px` (sidebar), `margin-bottom: 16px` (form fields)
- `24px` (lg): `padding: 24px` (content area), `padding: 24px` (KPI cards), `gap: 24px` (KPI grid)
- `32px` (xl): `margin-bottom: 32px` (form title), `margin-top: 32px` (kpi notice)
- `48px` (2xl): `padding: 48px` (login panels)

Khong co arbitrary values (`[...px]` hay `[...rem]`) — DUNG.

**Van de: Gap comment sai**

`dashboard.component.scss:24`:
```scss
gap: 24px; // 2xl token for card-to-card gap
```

Nhung spacing scale trong UI-SPEC:
- `2xl` = 48px (Login panel vertical padding)
- `lg` = 24px (Section padding)

Gap 24px la DUNG (theo spec KPI grid section), nhung comment `// 2xl token` la SAI — nen la `// lg token`. Khong anh huong runtime nhung gay nham lan cho developer sau.

**Van de: Spacing `10px` ngoai scale**

`sidebar.component.scss:45`: `padding: 10px 16px` cho `.nav-item`. Gia tri `10px` khong co trong declared spacing scale (4/8/16/24/32/48px). Day la outlier nho.

---

### Pillar 6: Experience Design (3/4)

**Trang thai duoc handle:**

| Trang thai | Co trong code? | Ghi chu |
|------------|----------------|---------|
| Loading (login submit) | DAY DU | Signal `loading`, button `[loading]`, text doi "Dang xu ly..." |
| Error (wrong login) | DAY DU | `p-message severity="error"` inline, correct position |
| Error (network) | DAY DU | Separate message "Khong the ket noi den may chu." |
| Error (401 session) | DAY DU | Toast warn, sticky, 3s redirect — dung spec |
| Error (403 forbidden) | DAY DU | Toast error, 6s life — dung spec |
| Auth guard redirect | DAY DU | `CanActivateFn` → `/login` redirect |
| Session persistence | DAY DU | localStorage + JWT expiry check |
| Already logged in | DAY DU | Constructor check → redirect to dashboard |
| Disabled nav items | DAY DU | `pointer-events: none`, `cursor: not-allowed`, grey text |

**Van de:**

1. **Sidebar animation thieu** (UI-SPEC Interaction States): "Sidebar group expand: Angular `[@slideDown]` animation (150ms ease-out); chevron rotates 90deg". Code dung `@if` → instant show/hide, KHONG co animation. `sidebar.component.ts` khong import Angular `animations`.

2. **Tooltip delay thieu** (UI-SPEC Interaction States): "Disabled nav item hover: tooltip 'Chuc nang nay chua duoc trien khai.' appears after 500ms delay". Code dung HTML native `[title]` attribute (no delay, browser-default delay ~1s). Spec yeu cau 500ms delay controlled.

3. **Toast copy mat dau** (lien quan Pillar 1): `error.interceptor.ts:21` — "Phien dang nhap da het han..." thay vi "Phiên đăng nhập đã hết hạn..."

4. **Header page title khong reactive** (`header.component.ts:21`): `get pageTitle()` la JavaScript getter thong thuong, KHONG phai Signal. Angular change detection se goi lai getter moi khi co change trong component, nhung khi dung default `ChangeDetection.Default` tren `HeaderComponent`, neu route navigate xay ra ngoai component tree nay, title co the khong cap nhat ngay. Day la potential UX bug.

5. **Dashboard notice text missing diacritics**: "Du lieu se hien thi sau khi thiet bi duoc nhap vao he thong." thay vi "Dữ liệu sẽ hiển thị sau khi thiết bị được nhập vào hệ thống."

---

## Registry Safety

shadcn khong duoc khoi tao. Khong co third-party block registry. Bo qua kiem tra nay.

---

## Files Audited

| File | Pillar |
|------|--------|
| `kho-thiet-bi-ui/src/styles.scss` | 3, 4, 5 |
| `kho-thiet-bi-ui/src/app/features/auth/login/login.component.ts` | 1, 6 |
| `kho-thiet-bi-ui/src/app/features/auth/login/login.component.html` | 1, 2 |
| `kho-thiet-bi-ui/src/app/features/auth/login/login.component.scss` | 3, 4, 5 |
| `kho-thiet-bi-ui/src/app/shared/layout/sidebar/sidebar.component.ts` | 1, 6 |
| `kho-thiet-bi-ui/src/app/shared/layout/sidebar/sidebar.component.html` | 1, 2 |
| `kho-thiet-bi-ui/src/app/shared/layout/sidebar/sidebar.component.scss` | 3, 4, 5 |
| `kho-thiet-bi-ui/src/app/shared/layout/header/header.component.ts` | 1, 6 |
| `kho-thiet-bi-ui/src/app/shared/layout/header/header.component.html` | 1, 2 |
| `kho-thiet-bi-ui/src/app/shared/layout/header/header.component.scss` | 3, 4, 5 |
| `kho-thiet-bi-ui/src/app/shared/layout/app-layout/app-layout.component.ts` | 2 |
| `kho-thiet-bi-ui/src/app/shared/layout/app-layout/app-layout.component.html` | 2 |
| `kho-thiet-bi-ui/src/app/shared/layout/app-layout/app-layout.component.scss` | 5 |
| `kho-thiet-bi-ui/src/app/features/dashboard/dashboard.component.ts` | 1 |
| `kho-thiet-bi-ui/src/app/features/dashboard/dashboard.component.html` | 1, 2 |
| `kho-thiet-bi-ui/src/app/features/dashboard/dashboard.component.scss` | 3, 4, 5 |
| `kho-thiet-bi-ui/src/app/core/interceptors/error.interceptor.ts` | 1, 6 |
| `.planning/phases/01-foundation/01-UI-SPEC.md` | Baseline |
