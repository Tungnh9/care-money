# CLAUDE.md
@AGENTS.md

## 1. Tech Stack

| Technology | Purpose |
| --- | --- |
| Next.js 16.3.0 (App Router, Turbopack) | Framework |
| React 19.2.8 (canary) | UI library |
| TypeScript 5 | Ngôn ngữ |
| Tailwind CSS v4 | Styling |
| react-hook-form + Zod (`@hookform/resolvers`) | Form & validation |
| Zustand | State |
| ESLint 9 + Prettier | Lint & format |
| Husky | Git hooks (pre-commit chạy lint) |

## 2. Feature Rules

- Mỗi feature = 1 route segment trong `app/` (`app/tai-chinh/`, `app/nhat-ky/`...).
- Code riêng của feature (component, hook, helper chỉ dùng trong feature đó) đặt trong private folder cùng route: `_components/`, `_hooks/`, `_lib/` — ví dụ `app/tai-chinh/_components/savings-card.tsx`. Next.js không coi `_folder` là route nên không lo tạo route lạ.
- Dùng ở ≥ 2 feature → đưa lên `components/` hoặc `lib/` ở gốc repo, không để trong `_components` của 1 feature.
- Layout/sidebar dùng chung toàn app (route group `(app)`) không phải "feature" — không áp dụng quy tắc này.

## 3. Component Rules

- **`components/ui/`**: component nền lấy từ shadcn/ui (`npx shadcn add ...`), sở hữu trực tiếp trong repo, custom qua CVA variant để khớp token `--ob-*` (màu, radius, spacing) — không dùng nguyên bản mặc định của shadcn.
- **`components/ob/`**: component đặc thù của Orange Banana không có primitive shadcn tương ứng (`Figure`, `Streak`...) — viết từ đầu, style bằng token `--ob-*`.
- Tên file kebab-case khớp tên component PascalCase — ví dụ `button.tsx` export `Button`.
- Server Component là mặc định; chỉ thêm `'use client'` khi thật sự cần state/event/browser API.
- Định nghĩa `interface`/`type` riêng cho props, không dùng `any`.

## 4. Git Workflow

`developer` là branch nền — không commit trực tiếp lên `developer`/`main`, luôn tách branch mới trước khi bắt đầu task mới. Loại branch/commit: `feat`, `fix`, `change`, `chore`, `docs`, `refactor`.

### Branch Naming

```
feat/shadcn-setup
fix/login-redirect
change/sidebar-spacing
chore/update-deps
docs/tech-stack-section
refactor/auth-flow
```

### Commit Messages

```
feat: add shadcn button component
fix: correct login redirect loop
change: adjust sidebar spacing
docs: update tech stack section
```

### PR Requirements

- ✅ Một task một branch/PR, không gộp việc không liên quan
- ✅ `npm run lint` sạch (Husky pre-commit đã tự chặn nếu lỗi)
- ✅ Cập nhật `CLAUDE.md` nếu thay đổi ảnh hưởng tới quy ước hoặc tech stack
- ✅ Báo lại để duyệt trước khi merge vào `developer`
