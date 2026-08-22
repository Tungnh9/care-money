# Orange Banana

App cá nhân quản lý Tài chính · Nhật ký · Học tập · Mục tiêu, port từ bản bàn giao thiết kế sang Next.js 16 (App Router). Đã lên 6 trang chính (xem mục Tính năng) và hỗ trợ đồng bộ dữ liệu qua nhiều máy. Xem `CLAUDE.md` cho quy ước code/git đầy đủ.

## Chạy dự án

```bash
npm run dev            # dev server (Turbopack), http://localhost:3000
npm run build          # build production
npm run start          # chạy bản build
npm run lint            # eslint
npm run test            # vitest run
npm run format          # prettier --write .
npm run format:check    # prettier --check .
```

Repo pin cứng **Node 24.19.0** qua `.nvmrc` — chạy `nvm use` trước khi làm việc.

Tính năng đồng bộ dữ liệu qua nhiều máy (`/api/sync`, backend Vercel Blob) cần biến môi trường `SYNC_SECRET` mới hoạt động — không bắt buộc để chạy app ở local.

## Cấu trúc thư mục

```
src/
├── app/
│   ├── layout.tsx             # root layout: nạp font, metadata, bọc <AuthGuard>
│   ├── page.tsx                # "/" → redirect sang /overview
│   ├── login/page.tsx          # "/login"
│   ├── sandbox/page.tsx        # "/sandbox" — xem trực quan component ui/ob, không phải feature
│   ├── api/sync/route.ts       # "/api/sync" — GET/POST, backup/restore qua Vercel Blob
│   └── (app)/                  # route group — shell cho user đã đăng nhập
│       ├── layout.tsx          # bọc <MoneyVisibilityProvider>, render Sidebar + <Toaster>
│       ├── _components/sidebar.tsx   # topbar mobile + sidebar desktop, nav 6 mục
│       ├── overview/page.tsx   # "/overview" — Tổng quan
│       ├── finance/page.tsx    # "/finance"  — Tài chính
│       ├── journal/page.tsx    # "/journal"  — Nhật ký
│       ├── study/page.tsx      # "/study"    — Học tập
│       ├── goals/page.tsx      # "/goals"    — Mục tiêu
│       └── settings/page.tsx   # "/settings" — Cài đặt
├── features/             # business logic theo feature — xem CLAUDE.md mục Feature Rules
│                          # 8 feature hiện có: overview, finance, journal, study, goals, settings, login, calc
│                          # (xem mục Tính năng dưới để biết mỗi feature làm gì)
├── components/
│   ├── ui/                # 11 component nền shadcn/ui, custom theo token --ob-*
│   ├── ob/                 # 9 component riêng Orange Banana (mascot Monkey, Streak, Figure...)
│   ├── auth-guard.tsx      # bọc root layout, check localStorage, đẩy về /login nếu chưa đăng nhập
│   └── money-visibility-provider.tsx  # context "ẩn số tiền", bọc trong layout (app)
├── lib/                   # helper dùng chung ≥ 2 feature: cn(), auth.ts, format.ts, date.ts,
│                          # settings-storage.ts, money-visibility-storage.ts, sync-secret-storage.ts
└── test/                  # setup file cho Vitest

content/                   # vocabulary.jsonl, grammar.jsonl — dữ liệu học tập, không phải code
public/assets/             # logo, app-icon, avatar, icons/ (car, gold, pig, timer...) từ bản bàn giao thiết kế
```

## Tính năng

| Route | Feature | Mô tả |
| --- | --- | --- |
| `/overview` | `overview` | Tổng quan — tổng hợp số liệu từ finance/goals/journal/study, không có state riêng |
| `/finance` | `finance` | Tài chính — 4 tab: Tiết kiệm · Nợ thẻ tín dụng (có màu tuỳ chỉnh) · Tích lũy vàng · Đầu tư |
| `/journal` | `journal` | Nhật ký — ghi chú hàng ngày kèm mood (danh sách mood tuỳ biến ở Cài đặt) |
| `/study` | `study` | Học tập — từ vựng + ngữ pháp (từ `content/*.jsonl`), Pomodoro, task hàng ngày, tiến độ học |
| `/goals` | `goals` | Mục tiêu — 3 mục tiêu, 2 mục tự tính từ dữ liệu Tài chính thật, 1 mục (mua xe) có thể gắn vào 1 quỹ tiết kiệm cụ thể |
| `/settings` | `settings` | Cài đặt — hồ sơ, danh sách mood, ẩn/hiện module ở Tổng quan, xuất/nhập + đồng bộ dữ liệu, xoá dữ liệu |
| _(modal, không có route)_ | `calc` | Máy tính — mở từ sidebar |
| `/login` | `login` | Đăng nhập mock (so khớp tài khoản hardcode, lockout sau nhiều lần sai) — bảo vệ toàn app qua `AuthGuard` |

## Component hiện có

### `components/ui/` — nền shadcn/ui, custom theo token `--ob-*`

| Component | Props chính |
| --- | --- |
| `AlertDialog` | `open` · `onOpenChange` · `title` · `description` · `confirmLabel` · `cancelLabel` · `onConfirm` · `destructive` |
| `Button` | `variant` primary/secondary/reward/ghost · `size` sm/md/lg · `fullWidth` |
| `Card` | `tone` plain/invert/reward/soft · `label` · `action` · `elevated` |
| `Field` | `label` · `hint` · `prefix` · `suffix` · `numeric` · `group` (format số kiểu `vi-VN`) · `invalid` |
| `Progress` | `value` · `track` · `tone` reward/action/expense · `label` · `hint` |
| `Switch` | `label` · `hint` · `checked` · `onCheckedChange` · `disabled` |
| `Tag` | `module` taichinh/hoctap/ghichu/tamtrang/muctieu/kehoach |
| `Toaster` (sonner) | wrapper `sonner`, theme + icon + màu đã khớp token `--ob-*` |
| `Checkbox`, `Input`, `Label` | primitive gốc shadcn — dùng làm nền cho các component trên, ít khi gọi trực tiếp |

### `components/ob/` — không có primitive shadcn tương ứng, viết riêng

| Component | Props chính |
| --- | --- |
| `Monkey` | `pose` wave/cheer/banana/book/sleep/focus/calc · `size` · `dark` — mascot chính của app, xem chi tiết dưới |
| `Figure` | `value` · `unit` · `delta` · `direction` up/down · `caption` · `size` lg/sm |
| `CountMoney` | như `Figure` (trừ `value`/`unit`) + animation đếm số tiền tăng dần |
| `Empty` | `pose` (dùng lại `Monkey`, mặc định `sleep`) · `title` · `hint` · `size` — trạng thái rỗng chung |
| `NetWorthCard` | `summary` (`FinanceSummary`) — card tài sản ròng, ghép từ `Card` + `CountMoney` |
| `Streak` | `days` · `done` · `icon` |
| `Tabs` | `tabs` · `active` · `onChange` |
| `TaskItem` | `label` · `done` · `onToggle` |
| `Confetti` | `n` (số lượng mảnh confetti) |

**Mascot `Monkey`** xuất hiện lặp lại nhiều nơi (trạng thái rỗng, trang chủ...) qua 7 giá trị `pose`: `wave` (mặc định, vẫy tay có animation), `cheer` (ăn mừng), `banana` (cầm chuối), `book` (cầm sách), `sleep` (ngủ, dùng trong `Empty`), `focus` (đang tập trung), `calc` (cầm máy tính). `dark` đổi màu để dùng trên nền tối.

### Khác

| Component | Vị trí | Vai trò |
| --- | --- | --- |
| `AuthGuard` | `src/components/auth-guard.tsx` | Bọc `children` trong root layout, check user trong `localStorage` (qua `src/lib/auth.ts`), đẩy về `/login` nếu chưa đăng nhập; hiện spinner trong lúc chờ check |
| `MoneyVisibilityProvider` | `src/components/money-visibility-provider.tsx` | Context "ẩn số tiền" toàn app (`useMoneyVisibility()`), bọc trong `src/app/(app)/layout.tsx`, lưu trạng thái qua `src/lib/money-visibility-storage.ts` |
