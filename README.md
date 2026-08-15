# Orange Banana

App cá nhân quản lý Tài chính · Nhật ký · Học tập · Mục tiêu, port từ bản bàn giao thiết kế sang Next.js 16 (App Router). Xem `CLAUDE.md` cho quy ước code/git đầy đủ.

## Chạy dự án

```bash
npm run dev     # dev server (Turbopack), http://localhost:3000
npm run build   # build production
npm run start   # chạy bản build
npm run lint    # eslint
npm run test    # vitest run
```

Cần Node ≥ 20.9 để build; **riêng `npm run test` cần Node ≥ 22.14** (Vitest/jsdom yêu cầu, khác với Next.js).

## Cấu trúc thư mục

```
src/
├── app/                  # routing thuần (Next.js App Router) — page.tsx là shell mỏng
│   ├── layout.tsx        # root layout: nạp font, bọc <AuthGuard>
│   ├── login/            # trang đăng nhập (/login)
│   └── sandbox/          # trang tạm xem trực quan các component ui/ob
├── features/             # business logic theo feature — xem CLAUDE.md mục Feature Rules
│   └── login/            # feature đăng nhập: components/, hooks/, schemas.ts, api.ts, mock-data.ts
├── components/
│   ├── ui/               # component nền từ shadcn/ui, custom theo token --ob-*
│   ├── ob/                # component riêng Orange Banana, không có primitive shadcn tương ứng
│   └── auth-guard.tsx    # bọc root layout, check localStorage, đẩy về /login nếu chưa đăng nhập
├── lib/                  # helper dùng chung ≥ 2 feature (cn(), auth.ts)
└── test/                 # setup file cho Vitest

content/                  # dữ liệu JSONL (từ vựng/ngữ pháp) — dữ liệu, không phải code
public/assets/            # logo, icon SVG từ bản bàn giao thiết kế
```

## Component hiện có

### `components/ui/` — nền shadcn/ui, custom theo token `--ob-*`

| Component | Props chính |
| --- | --- |
| `Button` | `variant` primary/secondary/reward/ghost · `size` sm/md/lg · `fullWidth` |
| `Card` | `tone` plain/invert/reward/soft · `label` · `action` · `elevated` |
| `Switch` | `label` · `hint` · `checked` · `onCheckedChange` |
| `Progress` | `value` · `track` · `tone` reward/action · `label` · `hint` |
| `Field` | `label` · `hint` · `prefix` · `suffix` · `numeric` · `group` (format số kiểu `vi-VN`) |
| `Tag` | `module` taichinh/hoctap/ghichu/tamtrang/muctieu/kehoach |
| `Checkbox`, `Input`, `Label` | primitive gốc shadcn — dùng làm nền cho các component trên, ít khi gọi trực tiếp |

### `components/ob/` — không có primitive shadcn tương ứng, viết riêng

| Component | Props chính |
| --- | --- |
| `Figure` | `value` · `unit` · `delta` · `direction` up/down · `caption` · `size` lg/sm |
| `Streak` | `days` · `done` · `icon` |
| `TaskItem` | `label` · `done` · `onToggle` |

### Khác

| Component | Vị trí | Vai trò |
| --- | --- | --- |
| `AuthGuard` | `src/components/auth-guard.tsx` | Bọc `children` trong root layout, check user trong `localStorage` (qua `src/lib/auth.ts`), đẩy về `/login` nếu chưa đăng nhập; hiện spinner trong lúc chờ check |
