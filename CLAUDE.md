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

## 2. Cấu trúc thư mục

Toàn bộ source code nằm trong `src/`, tách khỏi file config ở gốc repo (`tsconfig.json`, `next.config.ts`, `package.json`...). `public/` (asset tĩnh) và `content/` (dữ liệu JSONL, không phải code) vẫn ở gốc — Next.js bắt buộc `public/` ở gốc, `content/` là dữ liệu nên tách khỏi `src/`.

```
src/
├── app/         # routing thuần — không business logic, mỗi page.tsx là shell mỏng
├── features/    # business logic thật của từng feature (xem mục 3)
├── components/  # UI dùng chung ≥ 2 feature (xem mục 4)
├── lib/         # helper dùng chung ≥ 2 feature (vd. cn())
└── test/        # setup file cho Vitest
```

`@/*` trong `tsconfig.json` trỏ vào `./src/*`.

## 3. Feature Rules (feature-sliced)

- Mỗi feature = 1 folder trong `src/features/[feature-name]/`, tên khớp route segment gọi nó (`src/features/login/` ↔ `src/app/login/`).
- **Tên folder/file/component trong code luôn tiếng Anh** — kể cả route segment trong `src/app/` (URL tiếng Anh, vd. `/login`, không phải `/dang-nhap`). Quy tắc này chỉ áp dụng cho tên định danh, không áp dụng cho text. Nội dung hiển thị cho người dùng (label, message lỗi, `metadata.title`, copy...) đi qua hệ thống dịch đa ngôn ngữ — xem mục 7, không hardcode string trong JSX.
- `src/app/[route]/page.tsx` **chỉ là shell mỏng**: import component từ `src/features/[feature-name]/` (qua barrel `index.ts`) và render, cộng metadata/layout tĩnh riêng của route đó. Không viết business logic (state, validate, gọi API) trực tiếp trong `page.tsx`.
- Khung file chuẩn trong 1 feature — **chỉ tạo file nào thực sự cần**, không tạo file rỗng cho đủ bộ:
  ```
  src/features/[feature-name]/
  ├── index.ts        # barrel — export những gì route/feature khác cần dùng
  ├── types.ts          # kiểu dữ liệu domain viết tay, không gắn 1 form cụ thể (vd. entity, enum trạng thái)
  ├── schemas.ts         # Zod schema + type suy ra từ schema (vd. giá trị form, input tạo/sửa)
  ├── api.ts               # gọi API (khi có backend thật)
  ├── actions.ts            # Server Actions (khi có backend thật)
  ├── hooks/
  │   └── use-[name].ts
  ├── components/
  │   └── [name]-form.tsx
  └── __tests__/             # mirror cấu trúc bên trong, không colocate cạnh file nguồn
      └── components/
          └── [name]-form.test.tsx
  ```
- Dùng ở ≥ 2 feature → đưa lên `src/components/` hoặc `src/lib/` ở gốc `src/`, không để trong 1 feature.
- Layout/sidebar dùng chung toàn app (route group `(app)`) không phải "feature" — không áp dụng quy tắc này.

## 4. Component Rules

- **`src/components/ui/`**: component nền lấy từ shadcn/ui (`npx shadcn add ...`), sở hữu trực tiếp trong repo, custom qua CVA variant để khớp token `--ob-*` (màu, radius, spacing) — không dùng nguyên bản mặc định của shadcn.
- **`src/components/ob/`**: component đặc thù của Orange Banana không có primitive shadcn tương ứng (`Figure`, `Streak`...) — viết từ đầu, style bằng token `--ob-*`.
- Tên file kebab-case khớp tên component PascalCase — ví dụ `button.tsx` export `Button`.
- Mọi `<button>` mặc định có `cursor: pointer` (reset global trong `src/app/globals.css`, đặt trong `@layer base` để `disabled:cursor-not-allowed` ở utilities layer vẫn override đúng) — không cần set `cursor-pointer` tay ở từng component.
- Server Component là mặc định; chỉ thêm `'use client'` khi thật sự cần state/event/browser API.
- Định nghĩa `interface`/`type` riêng cho props, không dùng `any`.

## 5. Git Workflow

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

## 6. Testing

- **Test framework: Vitest** + React Testing Library cho component test — đã cài (`npm run test` = `vitest run`), setup file ở `src/test/setup.ts`.
- Test nằm trong `__tests__/` con của feature, mirror cấu trúc bên trong (`src/features/[ten]/__tests__/components/[ten]-form.test.tsx`) — xem mục 3.
- **Quy trình trước khi commit**: viết test cho phần vừa thêm/sửa → chạy test → tự review lại diff → commit.
- **Trước khi push**: chạy lại toàn bộ test suite. Chưa có hook `pre-push` (Husky) tự chạy `npm run test` — cân nhắc thêm khi test suite đủ lớn để đáng chặn push.

## 7. Đa ngôn ngữ (i18n)

App hỗ trợ tiếng Việt (mặc định) và tiếng Anh, không dùng route theo locale (`/en/...`) — ngôn ngữ lưu trong cookie `app-locale`, đọc được cả ở server lẫn client.

- Toàn bộ text hiển thị cho người dùng lấy từ dictionary tại `src/lib/i18n/dictionaries/{vi,en}.ts` — không hardcode string trong JSX. `vi.ts` là nguồn gốc (source of truth, không dùng `as const`): thêm key mới ở `vi.ts` trước, TypeScript tự báo lỗi nếu `en.ts` thiếu key hoặc lệch cấu trúc.
- Trong Client Component: `const t = useT()` (từ `@/components/locale-provider`), gọi `t("namespace.key")` hoặc `t("namespace.key", { param: value })` cho chuỗi có tham số (cú pháp `{param}` trong giá trị dictionary). Cần đọc/đổi locale hiện tại thì dùng `useLocale()`.
- Trong hàm thuần ngoài React (vd. `finance-calculations.ts`, `get-goals.ts`, `data-transfer.ts`) — thêm tham số `t: TranslationFn = translateDefault` (và `locale: Locale = DEFAULT_LOCALE` nếu cần định dạng số/ngày) ở cuối, mặc định về tiếng Việt để nơi gọi cũ và test hiện có không cần sửa.
- `formatMoney`/`groupVN`/`longDate`/`pct1` (trong `src/lib/format.ts`, `src/lib/date.ts`, `finance-calculations.ts`) đều nhận `locale` tùy chọn — luôn truyền `locale` từ `useLocale()` khi gọi trong component để số/ngày hiển thị đúng định dạng.
- `page.tsx` lấy `metadata.title` theo ngôn ngữ qua `generatePageMetadata(key)` (từ `src/lib/i18n/page-metadata.ts`) thay vì `export const metadata` tĩnh.
- Component dùng `src/components/ob/tabs.tsx` để chuyển tab phải lưu state bằng key ổn định (không lưu trực tiếp nhãn đã dịch) rồi tra bảng nhãn theo `locale` hiện tại — tránh vỡ khi đổi ngôn ngữ giữa chừng (xem mẫu ở `finance-view.tsx`/`study-view.tsx`).
- **Không dịch**: nội dung người dùng tự nhập/chỉnh sửa (tên quỹ, tâm trạng tự thêm, ghi chú...), dữ liệu content tải từ `content/` (từ vựng, ngữ pháp), code comment, và các trang dev-only như `/sandbox`. Ký hiệu ₫ và đơn vị vàng Việt Nam ("phân", "chỉ") giữ nguyên ở cả hai ngôn ngữ.
