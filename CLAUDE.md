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

## 2. Git Workflow

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
