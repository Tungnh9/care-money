# Khả năng truy cập & quy ước (phần 6b sửa lỗi review 2026-09-29) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Nhánh:** `change/a11y` → `refactor/conventions` (tách từ `developer`; nhánh đầu tách sau khi nhánh cuối của Plan 6a — `fix/small-bugs-settings` — đã merge; nhánh sau chỉ tách khi nhánh trước đã được duyệt và merge). Chuỗi đầy đủ 1a → 1b → 2 → 3 → 4 → 5 → 6a → **6b (plan cuối)**. CLAUDE.md đòi "một task một branch/PR": 19 phát hiện của phần này thuộc 2 việc không dính nhau — khả năng truy cập (Task 1–11 trên `change/a11y`) và quy ước code / cấu trúc thư mục (Task 12–17 trên `refactor/conventions`). Nhánh 2 phần lớn là di chuyển file thuần, tách riêng để review được bằng lệnh ("chỉ đổi dòng import") thay vì đọc từng file.

**Goal:** Trình đọc màn hình đọc được tên và trạng thái của mọi công tắc, ô giá, link, tab, nút phát âm và hộp xác nhận; người dùng bàn phím thấy vòng focus ở danh sách nhiệm vụ và không thoát ra khỏi hộp thoại; người bật "giảm chuyển động" không còn thấy confetti/pháo hoa; và code dùng chung giữa các feature nằm đúng chỗ CLAUDE.md quy định (`src/lib/`, `src/components/`), không feature nào còn import ruột của feature khác.

**Architecture:** Nhánh 1 sửa tại chỗ từng component (`aria-labelledby`/`aria-label`/`aria-pressed`/`aria-describedby`, lớp `peer` + `sr-only` cho `TaskItem`, gom animation hiệu ứng vào `@media (prefers-reduced-motion: no-preference)`), không đổi dữ liệu hay luồng nào. Nhánh 2 dọn 3 lỗi quy ước nhỏ, rồi chuyển data layer dùng chung của từng domain (types / storage / calculations / hook) từ `src/features/<x>/` sang `src/lib/<domain>/` và `GrammarHighlightCard` sang `src/components/ob/` bằng 1 script viết lại import theo đường dẫn đã resolve (nội dung file không đổi ngoài dòng import), rồi dọn 4 import chéo cuối cùng và ghi quy ước mới vào CLAUDE.md.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript, Tailwind CSS v4, zustand 5, Vitest + React Testing Library (jsdom) + jest-dom (`toHaveAccessibleDescription`, `getByRole(..., { pressed })`) — không thêm dependency nào (test CSS dùng `postcss` có sẵn trong `node_modules` vì là dependency của `vite` và `@tailwindcss/postcss`; không thêm vào `package.json`).

**Spec:** Không có spec riêng — nguồn là 19 phát hiện review đã được kiểm chứng đối kháng (2026-09-29), liệt kê đủ ở mục `## Phạm vi` bên dưới.

## Global Constraints

- 2 nhánh theo thứ tự ở dòng **Nhánh**; mỗi nhánh tách từ `developer` mới nhất. 1 commit/task, message theo CLAUDE.md (`fix:` / `change:` / `refactor:` / `chore:` / `docs:`) cộng dòng attribution mà phiên thực thi yêu cầu. Trước mỗi commit tự review `git diff` của task (CLAUDE.md mục 6). Không commit thẳng lên `developer`/`main`, không `git push` khi chủ repo chưa yêu cầu.
- Không thêm dependency. API Next duy nhất plan đụng tới là `<Link>` của `next/link` nhận thêm `aria-label` — `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` ghi rõ "`<a>` tag attributes ... can be added to `<Link>` as props and will be passed to the underlying `<a>` element". Nếu buộc phải đụng API Next khác, đọc `node_modules/next/dist/docs/` trước (Next 16 có breaking changes).
- Giữ nguyên các quyết định có chủ đích: AutoBackup vẫn không mount; mock login giữ nguyên; `EXPORT_VERSION` giữ `1`; `Expense.tag` vẫn là snapshot đóng băng; số còn phải tất toán của tháng vẫn tính lại, không khoá; `/sandbox` không đụng (nó chỉ import component ở `src/components/`, không bị di chuyển file nào ảnh hưởng).
- Tên file/biến/test tiếng Anh (tên test viết tiếng Việt nếu file đang viết vậy); chữ cho người dùng tiếng Việt, đúng nguyên văn trong plan. Plan này không đổi chữ nào hiện trên màn hình — chỉ thêm tên cho trình đọc màn hình (`aria-label`...).
- **Plan 1a, 1b, 2, 3, 4, 5, 6a đã merge trước:** trước khi sửa 1 file, đọc lại TOÀN BỘ file đó; mọi đoạn code trong plan được neo theo NỘI DUNG (class, `aria-*`, tên biến), không theo số dòng. Phải giữ: ở `sidebar.tsx` — `clearSyncSecret()` trong `handleLogout` (1b), class co giãn của `<nav>`/`<Link>` (`min-w-0 flex-auto px-0.5 md:flex-none`) và nhãn `<span className="max-w-full truncate md:hidden lg:inline">` (Plan 5 Task 3), vùng chạm 44px ở thanh trên (Plan 5 Task 4), `MONEY_MODULE_KEYS` (6a Task 17); ở `modal.tsx` — class panel `max-h-full overflow-y-auto overscroll-contain` (Plan 5 Task 5); ở `moods-card.tsx` — `useState`, state `deleting`, `AlertDialog` xoá và `existingLabels` (6a Task 21–22); ở `gold-stores-card.tsx` — `storeNames`/`existingNames` (6a Task 4); ở bảng/thẻ giao dịch vàng — `goldMarketPrice` (6a Task 6); ở `money-visibility-provider.tsx` — `toggle` ghi storage ngoài updater (6a Task 17); ở `study-summary-section.tsx` — lưới `@xs:`/`@md:`/`@xl:` và `wrap-anywhere` (Plan 5 Task 6).
- Test đặt trong `__tests__/` mirror cấu trúc, theo pattern file bên cạnh. jsdom không nạp Tailwind lẫn `globals.css`: tên/trạng thái cho trình đọc màn hình kiểm bằng `getByRole(..., { name, pressed })` và `toHaveAccessibleDescription` (dom-accessibility-api tính đúng như trình duyệt); thứ chỉ mắt thấy (vòng focus) kiểm bằng class; quy tắc CSS kiểm bằng cách parse `src/app/globals.css` bằng `postcss`.
- Chạy từng file test bằng `npx vitest run <path>` (đường dẫn có ngoặc như `src/app/(app)/...` đặt trong dấu nháy kép). Full suite, lint, tsc ở task checkpoint (Task 11, 17); riêng Task 13, 15, 16 chạy thêm `npx tsc --noEmit` (và Task 15–16 chạy cả `npm run test`) vì chúng đụng kiểu/import ở nhiều file.
- **Không chạy Prettier** lên file đã sửa: repo chưa từng format theo `.prettierrc` (`npx prettier --check "src/**/*.{ts,tsx}"` báo 309 file) — chạy sẽ viết lại cả file (thêm dấu `;`...) và làm bẩn diff. Dòng import dài hơn sau khi đổi sang alias `@/lib/...` là bình thường, không có lint nào giới hạn độ dài dòng.
- Mọi task commit ngay khi test của task xanh và đã tự review `git diff` — **không dừng giữa plan** chờ chủ repo. Mọi thứ người dùng (kể cả trình đọc màn hình) thấy được kiểm lại ở mục `### Kiểm tra tay` trong task checkpoint cuối mỗi nhánh (Task 11, 17); nếu chủ repo thấy sai thì sửa tiếp trên chính nhánh đó (commit `fix: ...` riêng). Mỗi nhánh chỉ merge vào `developer` sau khi chủ repo chạy xong toàn bộ "Kiểm tra tay" của nhánh đó và duyệt; nhánh 2 chỉ tách sau khi nhánh 1 đã merge.

## Quyết định cần duyệt

### 1. Code dùng ở ≥ 2 feature đang nằm trong 1 feature (`area-settings-sync#11`, `area-finance-logic#11`, `area-study#17`, `area-overview-journal#15`)

CLAUDE.md mục 3 ghi: "Dùng ở ≥ 2 feature → đưa lên `src/components/` hoặc `src/lib/` ở gốc `src/`, không để trong 1 feature", và barrel `index.ts` là nơi export "những gì route/feature khác cần dùng". Thực tế: 28 module bị import xuyên ranh giới feature (đường dẫn sâu như `@/features/finance/hooks/use-finance`, hoặc qua barrel `@/features/goals`) — không chỉ 4 chỗ phát hiện nêu, vì Tổng quan (gom số liệu mọi feature) và Cài đặt (xuất/nhập/xoá dữ liệu của mọi feature) đọc data layer của TẤT CẢ domain. Thêm vào đó: 2 component dùng chung `net-worth-card.tsx`, `fund-picker.tsx` import ruột của feature finance; 2 trang `/overview`, `/study` import thẳng `@/features/study/content-loader`; route `/api/sync` import thẳng `@/features/settings/data-transfer`. `settings-storage.ts` đã từng được chuyển ra `src/lib/` (còn hook `useSettings` thì chưa), và commit `bd66d56` đã chuyển `ImageWithFallback`/`SpeakButton` ra `src/components/ob/` đúng theo quy tắc này.

- **A. Chuyển đúng như CLAUDE.md mục 3 nói** — data layer của 7 domain sang `src/lib/<domain>/` (`finance`, `budget`, `goals`, `journal`, `study`, `net-worth`, `settings`), `data-transfer.ts` sang `src/lib/`, `GrammarHighlightCard` (kèm `HighlightedSentence` nó dùng) sang `src/components/ob/`. Quy mô: 61 file đổi chỗ — 33 module (28 module trên, trừ `overview-calculations.ts` chỉ tách riêng hàm `splitGreeting`, cộng 5 module chúng phụ thuộc và `settings-storage.ts` để cả domain settings nằm chung 1 thư mục) + 28 file test — ~325 dòng import trong ~177 file được 1 script viết lại (số đo trên code hiện tại; sau 7 plan trước sẽ nhỉnh hơn chút), cộng vài sửa tay (tách `splitGreeting`, dọn barrel goals, 5 dòng import ở 4 file), CLAUDE.md, README. Nội dung file không đổi ngoài dòng import. Sau đó: không feature nào import feature khác; `src/components/` và `src/lib/` không import `src/features/`; `src/app/` chỉ import feature qua barrel. Đổi lại: diff rất lớn (nhưng chỉ gồm đổi tên file + dòng import — review bằng lệnh kiểm, không cần đọc từng file); mỗi feature chỉ còn UI + logic riêng của nó; nhánh nào khác còn mở lúc merge mà sửa trúng file bị chuyển sẽ phải merge lại (git thường tự đi theo file đổi tên, chỉ đụng khi 2 bên sửa cùng dòng import). Với 7 plan trước: không xung đột — plan này chạy sau cùng, script viết lại đúng những import có mặt lúc chạy (kể cả import do các plan đó thêm).
- **B. Sửa CLAUDE.md: cho import chéo feature nhưng chỉ qua barrel `index.ts`** — ~97 dòng import (code + test) trong ~40 file đổi sang `@/features/<x>`, 6 barrel thêm ~40 export, thêm 1 entry `src/features/study/server.ts` cho `content-loader` (dùng `node:fs`, không được lọt vào barrel mà component client import). Không file nào đổi chỗ, diff nhỏ hơn nhiều. Nhưng: (1) barrel nào cũng export View của feature, nên finance↔budget, finance↔goals, budget↔settings, journal↔settings, overview↔settings thành vòng import — import 1 feature là nạp code của mọi feature (test 1 file storage nạp cả app; bundle phải trông vào tree-shaking); hiện chạy được chỉ vì chưa module nào dùng export của feature khác ngay lúc nạp — 1 lần dùng như vậy về sau (vd. ghép schema zod của feature khác ở cấp module, `const X = { ...DEFAULT_* }`) sẽ thành lỗi `ReferenceError` tuỳ thứ tự nạp; (2) không sửa được chuyện component dùng chung phụ thuộc feature — `net-worth-card`/`fund-picker` sẽ import `@/features/finance` và thành vòng components↔features, vẫn phải chuyển `pct1`/`FinanceSummary`/`SavingsFund` ra ngoài; (3) ngược với tiền lệ chính chủ repo đã làm (`settings-storage.ts`, commit `bd66d56`).
- **C. Để nguyên** — 0 thay đổi, 0 rủi ro; CLAUDE.md mục 3 tiếp tục bị vi phạm ở ~60 dòng import trong code (cộng ~35 trong test), code mới tiếp tục chép theo mẫu import sâu, review sau sẽ lại báo.
- **Khuyên dùng: A** — vì plan chạy cuối chuỗi nên không xung đột với plan nào; thay đổi thuần cơ học, kiểm được trọn bằng `tsc` + toàn bộ test + 1 lệnh kiểm "không còn import chéo feature" + 1 lệnh kiểm "diff chỉ đổi dòng import"; nó làm đúng quy tắc chủ repo đã viết và đã theo; và tránh được vòng import của B. Điều kiện: chạy nhánh 2 khi không còn nhánh nào khác đang mở, merge sớm sau khi duyệt. Plan làm A (Task 15–16). Chọn B thì Task 15–16 phải viết lại trước khi thực thi (không có sẵn trong plan này); Task 12–14 và 17 giữ nguyên. Chọn C thì bỏ Task 15–16; nhánh 2 còn Task 12–14 và 17.

### 2. Tabs báo tab đang chọn (`area-components-lib#8`)

`Tabs` (4 tab ở `/finance`, 4 tab ở `/study`) chỉ phân biệt tab đang chọn bằng màu và độ đậm chữ — trình đọc màn hình đọc 4 "button" giống hệt nhau.

- **A. `aria-pressed` trên từng nút** — đọc thành "Tích lũy vàng, nút bật tắt, đã nhấn"; phím Tab đi qua từng tab như bây giờ; đúng kiểu repo đang dùng cho trạng thái chọn (`sidebar.tsx` nút Ẩn số tiền, `adjust-savings-fund-modal.tsx`, `vocab-word-card.tsx`, chip mood của Plan 4); không test nào phải sửa.
- **B. Mẫu tab đầy đủ của WAI-ARIA** — `role="tablist"`/`role="tab"` + `aria-selected` + `aria-controls`, nội dung bọc `role="tabpanel"`, phím mũi tên chuyển tab và chỉ tab đang chọn nằm trong thứ tự Tab — đúng chuẩn nhất, nhưng đổi cách dùng bàn phím, phải sửa cả `FinanceView`/`StudyView` (bọc panel, id), và 13 chỗ test đang tìm tab bằng `getByRole("button", ...)` phải viết lại.
- **C. `aria-current="true"`** — ít trình đọc màn hình đọc thành "đang chọn" cho nút; không phải mẫu dành cho việc này.
- **Khuyên dùng: A** — vì sửa đúng chỗ thiếu (trạng thái) với 1 thuộc tính, nhất quán với cả app, không đổi thói quen bàn phím. Plan làm A (Task 5).

Các sửa đổi còn lại không có đánh đổi người dùng thấy được ngoài chính bản sửa — plan làm thẳng: công tắc mood/nhãn lấy tên từ đúng chữ hiện bên cạnh (`aria-labelledby`); ô giá cửa hàng tên "Giá <cửa hàng> hôm nay (mỗi phân)"; nút xoá giao dịch vàng kèm ngày như nút sửa; link "Mở" tên "Mở <mục>"; link sidebar có `aria-label` bằng đúng nhãn (không thêm tooltip `title` — vài trình đọc màn hình sẽ đọc tên 2 lần); nút phát âm tên `Phát âm "<từ>"`; vòng focus của `TaskItem` vẽ quanh ô vuông nhìn thấy được, cùng màu với vòng focus chung của app; mô tả của hộp xác nhận nối bằng `aria-describedby`; bẫy Tab của hộp thoại nhận `textarea`/`select` và bỏ qua input không tab tới được; khi bật "giảm chuyển động" thì mảnh confetti và tia pháo hoa bị ẩn hẳn (không có animation chúng sẽ đứng im ở đỉnh thẻ), thẻ không nảy "tada" — riêng hiệu ứng nền vàng nhạt dần ở bài nhật ký vừa lưu (`ob-highlight-flash`) giữ nguyên vì chỉ đổi màu, không phải chuyển động.

## Phạm vi

| Phát hiện | Mô tả | Sửa ở |
|---|---|---|
| `area-settings-sync#10` | 11 công tắc nhãn chi tiêu và 8 công tắc tâm trạng ở Cài đặt có tên rỗng — trình đọc màn hình đọc "switch, checked" 19 lần | Task 1 |
| `area-finance-logic#10` | Ô giá từng cửa hàng vàng chỉ có tên "đ" (nhãn cột ẩn dưới `sm`); nút xoá giao dịch vàng cùng tên "Xoá giao dịch vàng" trong khi nút sửa có kèm ngày | Task 2 |
| `area-overview-journal#18` | 5 link "Mở" ở Tổng quan cùng tên "Mở", không biết link nào tới trang nào | Task 3 |
| `area-shell-auth-calc#7` | Ở bề rộng 768–1023px nhãn link sidebar bị `display: none`, icon lucide `aria-hidden` → 7 link không có tên | Task 4 |
| `area-components-lib#8` | `Tabs` không báo tab đang chọn cho trình đọc màn hình | Task 5 (theo Quyết định 2) |
| `area-components-lib#7` | Checkbox thật của `TaskItem` 0×0 và `opacity: 0` nên vòng focus vô hình; ô vuông nhìn thấy không có kiểu focus | Task 6 |
| `area-components-lib#10` | Mọi nút phát âm cùng tên "Phát âm từ" | Task 7 |
| `area-components-lib#14` | Mô tả của `AlertDialog` (câu cảnh báo "không thể hoàn tác") không nối `aria-describedby` | Task 8 |
| `area-components-lib#15` | Selector bẫy Tab của `Modal` bỏ sót `textarea`/`select`, lại khớp input bị khoá/ẩn/`tabIndex=-1` (tiềm ẩn — chưa modal nào có) | Task 9 |
| `area-components-lib#6` | Confetti, pháo hoa, "tada" chạy cả khi người dùng bật "giảm chuyển động" | Task 10. `ob-highlight-flash` **không sửa** — verifier xác nhận nó chỉ đổi `background-color`, không phải chuyển động; nó là dấu hiệu duy nhất cho biết bài nào vừa lưu |
| `area-components-lib#11` | `button:active` lặp 1 bản không layer — bản đó đè cả utility và làm bản trong `@layer base` thành code chết; `* { box-sizing }` cũng nằm ngoài layer | Task 12 |
| `area-study#18` | `ExampleSentence`, `ExampleList`, `StructureBadge` khai props inline | Task 13 (kèm `VocabTeaserCard`, `RingCallouts` — cùng lỗi, verifier của 2 phát hiện chỉ ra; sau task này repo không còn component nào khai props inline) |
| `area-components-lib#17` | `MoneyVisibilityProvider` khai props inline | Task 13 |
| `area-finance-logic#12` | `'use client'` thừa ở `gold-pl-indicator.tsx` (không state/event/browser API) | Task 13 |
| `area-finance-ui#9` | Test "disables Lưu" của 3 hộp sửa (quỹ, khoản đầu tư, thẻ) chỉ xoá ô tên → bỏ kiểm số tiền/mục tiêu/vốn/giá trị/dư nợ/hạn mức/ngày đến hạn đi thì test vẫn xanh | Task 14. Các ý phụ của phát hiện đã có test từ plan trước: chặn trùng tên quỹ/thẻ ở hộp sửa (Plan 1a Task 9), giữ giá trị `0` ở form thêm đầu tư (Plan 6a Task 11), gợi ý "hạn gần nhất" (Plan 6a Task 9) |
| `area-settings-sync#11` | `useSettings` nằm trong feature settings nhưng 4 feature + sidebar dùng | Task 15 (`src/lib/settings/`, kèm `settings-storage.ts`), theo Quyết định 1 |
| `area-finance-logic#11` | Data layer tài chính được 5 feature + 2 component dùng chung import sâu | Task 15 (`src/lib/finance/`, kèm `budget`/`goals` vì 3 domain import lẫn nhau), Task 16 (barrel `goals` + import của Tổng quan), theo Quyết định 1 |
| `area-study#17` | Code học tập dùng chung (storage, hook, SRS, `pickDaily`, `content-loader`...) nằm trong feature study; 2 trang import thẳng `content-loader` | Task 15 (`src/lib/study/`; trang import `@/lib/study/content-loader`), theo Quyết định 1 |
| `area-overview-journal#15` | Tổng quan import `GrammarHighlightCard` của study và `stripHtmlToPlainText` của journal | Task 15 (`src/components/ob/grammar-card.tsx`, `src/lib/journal/journal-html.ts`), theo Quyết định 1 |

## Thay đổi ảnh hưởng tới các phần sau

Không có — đây là plan cuối của chuỗi review 2026-09-29. Những thứ dưới đây là quy ước/hợp đồng mới cho mọi thay đổi sau này trong repo:

**Quy ước mới (CLAUDE.md)**
- Mục 2: dòng `lib/` trong cây thư mục ghi thêm "data layer dùng chung theo domain" (Task 16).
- Mục 3: gạch đầu dòng "Dùng ở ≥ 2 feature..." mở rộng thành quy tắc vị trí: UI dùng chung → `src/components/`; data layer của 1 domain mà ≥ 2 feature đọc/ghi (`types.ts`, `*-storage.ts`, `*-calculations.ts`, hook `use-*.ts`) → `src/lib/<domain>/`, test ở `src/lib/__tests__/<domain>/`; feature không import từ feature khác (kể cả qua barrel); `src/components/`, `src/lib/` không import `src/features/`; chỉ code trong `src/app/` import feature, và chỉ qua barrel `index.ts` (Task 16). Gạch đầu dòng "Hook đọc/ghi localStorage" của Plan 1a/1b giữ nguyên chữ — tên hook trong ngoặc vẫn đúng, chỉ khác thư mục.
- README: cây thư mục, bảng `src/lib/` và bảng `components/ob/` theo vị trí mới (Task 16).

**Vị trí mới của data layer (Task 15)** — `src/lib/finance/`, `src/lib/budget/`, `src/lib/goals/`, `src/lib/journal/`, `src/lib/study/`, `src/lib/net-worth/`, `src/lib/settings/` (bảng đầy đủ ở Task 15); `src/lib/data-transfer.ts`; `src/lib/settings/greeting.ts` (`splitGreeting`, Task 16); `src/components/ob/grammar-card.tsx`, `src/components/ob/highlighted-sentence.tsx`. Barrel `src/features/goals/index.ts` chỉ còn export `GoalsView`.

**Component dùng chung**
- `Modal` có prop tuỳ chọn mới `ariaDescribedBy?: string` (render `aria-describedby` trên panel); `FOCUSABLE_SELECTOR` mới gồm `select`/`textarea`, bỏ input bị khoá/ẩn/`tabIndex=-1` (Task 8–9).
- `AlertDialog`: đoạn mô tả có `id="alert-dialog-description"` và panel trỏ `aria-describedby` vào đó khi có `description`; mô tả phải giữ là phrasing content (chữ, `<strong>`, `<span className="block">`) như mọi nơi dùng hiện nay (Task 8).
- `Tabs`: mỗi nút có `aria-pressed` (Task 5). `SpeakButton`: tên `Phát âm "<từ>"` — test tìm nút phát âm theo tên mới (Task 7). `TaskItem`: input `peer sr-only`, ô vuông `peer-focus-visible:outline-*`, label `relative` (Task 6).
- `src/app/__tests__/globals-css.test.ts` (Task 10, 12) khoá 3 quy tắc: animation confetti/pháo hoa/tada chỉ nằm trong `@media (prefers-reduced-motion: no-preference)`; có khối `prefers-reduced-motion: reduce` ẩn `.ob-conf`, `.ob-firework-spark`; `button:active` và `*` chỉ nằm trong `@layer base`. Thêm hiệu ứng chuyển động mới thì đặt animation trong khối `no-preference`.

## Cấu trúc file

Nhánh 1 `change/a11y`:
- Modify (feature): `src/features/settings/components/{tags-card,moods-card}.tsx`, `src/features/finance/components/{gold-stores-card,gold-transactions-table,gold-transactions-cards}.tsx`, `src/features/overview/components/section-head.tsx`
- Modify (shell): `src/app/(app)/_components/sidebar.tsx`
- Modify (dùng chung): `src/components/ob/{tabs,task-item,speak-button}.tsx`, `src/components/ui/{modal,alert-dialog}.tsx`, `src/app/globals.css`
- Create (test): `src/components/__tests__/ob/tabs.test.tsx`, `src/components/__tests__/ob/task-item.test.tsx`, `src/app/__tests__/globals-css.test.ts`
- Test sửa/thêm: `src/features/settings/__tests__/components/{tags-card,moods-card}.test.tsx`, `src/features/finance/__tests__/components/{gold-stores-card,gold-transactions-table,gold-transactions-cards}.test.tsx`, `src/features/overview/__tests__/components/{section-head,study-summary-section}.test.tsx`, `src/app/(app)/_components/__tests__/sidebar.test.tsx`, `src/components/__tests__/ob/speak-button.test.tsx`, `src/features/study/__tests__/components/vocab-word-card.test.tsx`, `src/components/__tests__/ui/{modal,alert-dialog}.test.tsx`

Nhánh 2 `refactor/conventions`:
- Modify (Task 12–14): `src/app/globals.css`, `src/features/study/components/grammar-card.tsx`, `src/components/money-visibility-provider.tsx`, `src/features/overview/components/study-summary-section.tsx`, `src/features/budget/components/tag-breakdown-chart.tsx`, `src/features/finance/components/gold-pl-indicator.tsx`; test `src/app/__tests__/globals-css.test.ts`, `src/features/finance/__tests__/components/{edit-savings-fund-modal,edit-investment-modal,edit-credit-card-modal}.test.tsx`
- Move (Task 15, bằng script, chỉ đổi dòng import): 61 file theo bảng ở Task 15; ~177 file khác chỉ đổi dòng import
- Create (Task 16): `src/lib/settings/greeting.ts`, `src/lib/__tests__/settings/greeting.test.ts`
- Modify (Task 16): `src/features/overview/overview-calculations.ts`, `src/features/overview/__tests__/overview-calculations.test.ts`, `src/features/overview/components/{overview-view,goals-summary-section}.tsx`, `src/features/overview/__tests__/components/goals-summary-section.test.tsx`, `src/features/settings/components/settings-view.tsx`, `src/features/goals/index.ts`, `CLAUDE.md`, `README.md`

Mọi bước kiểm tay nằm ở Task 11 (nhánh 1) và Task 17 (nhánh 2), chạy sau khi các task của nhánh đã commit.

---

## Nhánh 1 — `change/a11y` (Task 1–11)

Tách nhánh (sau khi `fix/small-bugs-settings` của Plan 6a đã merge): `git checkout developer && git pull --ff-only 2>/dev/null; git checkout -b change/a11y` (bỏ qua `git pull` nếu repo không có remote).

### Task 1: Công tắc nhãn chi tiêu và tâm trạng có tên đọc được

**Files:**
- Modify: `src/features/settings/components/tags-card.tsx` (import `useId`, hằng `idPrefix`, div tên nhãn, `<Switch>`)
- Modify: `src/features/settings/components/moods-card.tsx` (import `useId` cạnh `useState` của Plan 6a, hằng `idPrefix`, div tên tâm trạng, `<Switch>`)
- Test: `src/features/settings/__tests__/components/tags-card.test.tsx`, `src/features/settings/__tests__/components/moods-card.test.tsx` (file do Plan 6a Task 21 tạo)

**Interfaces:**
- Consumes: `Switch` (`@/components/ui/switch`) chuyển mọi prop còn lại (`...props`) xuống `SwitchPrimitive.Root` của Base UI. Base UI tự đặt `aria-labelledby` của công tắc trỏ vào `<label>` bọc ngoài (ở 2 card này label chỉ chứa chính công tắc → tên rỗng) **chỉ khi không có `aria-labelledby` truyền vào** (`useAriaLabelledBy` trong `node_modules/@base-ui/react/internals/labelable-provider/useAriaLabelledBy.js`). Vì `aria-labelledby` thắng `aria-label` khi tính tên, truyền `aria-label` sẽ KHÔNG có tác dụng — phải truyền `aria-labelledby`. Hằng `MOODS` trong `moods-card.test.tsx` (Plan 6a) = 2 mood đầu của `DEFAULT_SETTINGS`: "Tuyệt vời" (bật), "Vui" (bật).
- Produces: mỗi công tắc ở `TagsCard`/`MoodsCard` có `aria-labelledby` trỏ vào div tên đang hiện bên cạnh (id `${idPrefix}-tag-${i}` / `${idPrefix}-mood-${i}`, `idPrefix = useId()`) → tên truy cập = đúng chữ người dùng thấy. Props của 2 card không đổi; `ModulesCard` (đã truyền `label`) không đụng.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/settings/__tests__/components/tags-card.test.tsx`, thêm vào cuối `describe("TagsCard", ...)`:

```tsx
  it("names each switch after its tag, so a screen reader can tell the switches apart", () => {
    const onToggle = vi.fn()
    render(<TagsCard tags={TAGS} onToggle={onToggle} />)

    expect(screen.getByRole("switch", { name: "Tiền trọ" })).toBeChecked()
    fireEvent.click(screen.getByRole("switch", { name: "Mua sắm" }))

    expect(onToggle).toHaveBeenCalledWith(1)
  })
```

1.2. Thêm vào cuối `src/features/settings/__tests__/components/moods-card.test.tsx` (sau `})` đóng describe xoá tâm trạng của Plan 6a Task 22; `render`, `screen`, `fireEvent`, `vi`, `MoodsCard`, `MOODS` đã có sẵn):

```tsx
describe("MoodsCard — công tắc", () => {
  it("names each switch after its mood, so a screen reader can tell the switches apart", () => {
    const onToggle = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={onToggle} onRemove={vi.fn()} onAdd={vi.fn()} />)

    expect(screen.getByRole("switch", { name: "Tuyệt vời" })).toBeChecked()
    fireEvent.click(screen.getByRole("switch", { name: "Vui" }))

    expect(onToggle).toHaveBeenCalledWith(1)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/components/tags-card.test.tsx src/features/settings/__tests__/components/moods-card.test.tsx`
Expected: FAIL đúng 2 test mới — `Unable to find an accessible element with the role "switch" and name "Tiền trọ"` và `... name "Tuyệt vời"` (log liệt kê các switch với `Name ""`). Mọi test cũ (kể cả 5 test của Plan 6a) vẫn PASS.

- [ ] **Step 3: Viết code**

3.1. `src/features/settings/components/tags-card.tsx`:

- Ngay sau dòng `"use client"` (và dòng trống), thêm import đầu tiên:

```tsx
import { useId } from "react"

```

(giữ 1 dòng trống trước `import { Card } from "@/components/ui/card"`).

- Ngay sau dòng `function TagsCard({ tags, onToggle }: TagsCardProps) {` thêm:

```tsx
  // Công tắc của Base UI tự lấy tên từ <label> bọc ngoài — ở đây label chỉ chứa chính công tắc nên tên
  // rỗng. Trỏ aria-labelledby vào chữ tên nhãn đang hiện bên cạnh (aria-label không dùng được: Base UI
  // luôn đặt aria-labelledby khi không được truyền, và aria-labelledby thắng aria-label).
  const idPrefix = useId()
```

- Trong `tags.map`, thay

```tsx
              <div className="text-sm font-bold">{t.label}</div>
```

bằng

```tsx
              <div id={`${idPrefix}-tag-${i}`} className="text-sm font-bold">
                {t.label}
              </div>
```

và thay

```tsx
            <Switch checked={t.on} onCheckedChange={() => onToggle(i)} className="flex-none" />
```

bằng

```tsx
            <Switch
              checked={t.on}
              onCheckedChange={() => onToggle(i)}
              aria-labelledby={`${idPrefix}-tag-${i}`}
              className="flex-none"
            />
```

3.2. `src/features/settings/components/moods-card.tsx` (bản sau Plan 6a Task 21–22):

- Đổi `import { useState } from "react"` thành `import { useId, useState } from "react"`.
- Ngay sau dòng `const [deleting, setDeleting] = useState<{ index: number; label: string } | null>(null)` thêm:

```tsx
  // Như TagsCard: công tắc lấy tên từ chữ tên tâm trạng đang hiện bên cạnh.
  const idPrefix = useId()
```

- Trong `moods.map`, thay

```tsx
              <div className="text-sm font-bold">{m.label}</div>
```

bằng

```tsx
              <div id={`${idPrefix}-mood-${i}`} className="text-sm font-bold">
                {m.label}
              </div>
```

và thay

```tsx
            <Switch checked={m.on} onCheckedChange={() => onToggle(i)} className="flex-none" />
```

bằng

```tsx
            <Switch
              checked={m.on}
              onCheckedChange={() => onToggle(i)}
              aria-labelledby={`${idPrefix}-mood-${i}`}
              className="flex-none"
            />
```

Không đụng nút thùng rác (`aria-label={"Xoá " + m.label}`), `AlertDialog` xoá hay `AddMoodForm existingLabels` của Plan 6a.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/components/tags-card.test.tsx src/features/settings/__tests__/components/moods-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx`
Expected: PASS toàn bộ (kể cả "calls onToggle with the tag's index when its switch is clicked" — vẫn đếm đủ 2 switch theo vị trí)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.1** ở "Kiểm tra tay" của Task 11):

```bash
git add src/features/settings/components/tags-card.tsx src/features/settings/components/moods-card.tsx src/features/settings/__tests__/components/tags-card.test.tsx src/features/settings/__tests__/components/moods-card.test.tsx
git commit -m "fix: name the tag and mood switches after their visible labels"
```

---

### Task 2: Ô giá cửa hàng vàng và nút xoá giao dịch vàng có tên riêng

**Files:**
- Modify: `src/features/finance/components/gold-stores-card.tsx` (`<Field>` giá trong `stores.map`)
- Modify: `src/features/finance/components/gold-transactions-table.tsx`, `src/features/finance/components/gold-transactions-cards.tsx` (`aria-label` của nút Xoá)
- Test: `src/features/finance/__tests__/components/gold-stores-card.test.tsx`, `src/features/finance/__tests__/components/gold-transactions-table.test.tsx`, `src/features/finance/__tests__/components/gold-transactions-cards.test.tsx`

**Interfaces:**
- Consumes: `Field` (`@/components/ui/field`) rải `...props` xuống `Input` SAU các prop của chính nó, nên `aria-label` tới đúng ô nhập và thắng `<label>` bọc ngoài (label chỉ chứa hậu tố "đ"). Prop `masked`/`onFocus`/`onBlur` (Plan 2) và `onPaste` (Plan 6a) không đụng.
- Produces: ô giá của mỗi cửa hàng tên `Giá <tên cửa hàng> hôm nay (mỗi phân)`; nút xoá mỗi giao dịch tên `Xoá giao dịch vàng <ngày mua>` (khớp nút sửa `Sửa giao dịch vàng <ngày mua>`). Tên ô giá cố ý KHÔNG chứa chuỗi liền "Giá hôm nay": test của Plan 6a Task 4 tìm ô "Giá hôm nay (mỗi phân)" của form thêm cửa hàng bằng `getByLabelText("Giá hôm nay", { exact: false })` trong lúc các dòng cửa hàng đang hiện — `getByLabelText` khớp cả `aria-label`, nên tên chứa "Giá hôm nay" sẽ làm test đó báo "Found multiple elements".

- [ ] **Step 1: Viết test thất bại**

1.1. Thêm vào cuối `src/features/finance/__tests__/components/gold-stores-card.test.tsx` (sau describe "GoldStoresCard — tên cửa hàng trùng" của Plan 6a; `STORES` = SJC "935.000" + PNJ "800.000", `render`, `screen`, `fireEvent`, `vi` đã có sẵn):

```tsx
describe("GoldStoresCard — tên đọc được của ô giá", () => {
  it("names each store's price field after the store instead of just the 'đ' suffix", () => {
    const onSetPrice = vi.fn()
    render(
      <GoldStoresCard stores={STORES} gold={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onSetPrice={onSetPrice} />
    )

    expect(screen.getByRole("textbox", { name: "Giá SJC hôm nay (mỗi phân)" })).toHaveValue("935.000")
    fireEvent.change(screen.getByRole("textbox", { name: "Giá PNJ hôm nay (mỗi phân)" }), {
      target: { value: "810.000" },
    })

    expect(onSetPrice).toHaveBeenCalledWith("PNJ", "810000")
  })
})
```

1.2. Trong `src/features/finance/__tests__/components/gold-transactions-table.test.tsx` (`PURCHASES` = id 1 ngày "01/08/2026", id 2 ngày "05/08/2026"):

- Trong test "calls onRemove with the matching purchase id when its delete button is clicked", thay

```tsx
    const deleteButtons = screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })
    expect(deleteButtons).toHaveLength(2)

    fireEvent.click(deleteButtons[1])
```

bằng

```tsx
    // Mỗi nút xoá kèm ngày mua như nút sửa — trình đọc màn hình phân biệt được từng dòng.
    expect(screen.getByRole("button", { name: "Xoá giao dịch vàng 01/08/2026" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Xoá giao dịch vàng 05/08/2026" }))
```

(giữ nguyên 2 dòng `expect(onRemove)...` phía sau).

- Trong test "pushes each row's edit and delete buttons together to the end of the row", thay

```tsx
    const deleteButtons = screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })
    const deleteButton = deleteButtons[1]
```

bằng

```tsx
    const deleteButton = screen.getByRole("button", { name: "Xoá giao dịch vàng 05/08/2026" })
```

1.3. Trong `src/features/finance/__tests__/components/gold-transactions-cards.test.tsx` (cùng `PURCHASES`):

- Trong test "renders the empty-state message when there are no purchases", đổi

```tsx
    expect(screen.queryAllByRole("button", { name: "Xoá giao dịch vàng" })).toHaveLength(0)
```

thành

```tsx
    expect(screen.queryAllByRole("button", { name: /^Xoá giao dịch vàng/ })).toHaveLength(0)
```

- Trong test "calls onRemove with the matching purchase id when its delete button is clicked", thay

```tsx
    const deleteButtons = screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })
    expect(deleteButtons).toHaveLength(2)

    fireEvent.click(deleteButtons[1])
```

bằng

```tsx
    expect(screen.getByRole("button", { name: "Xoá giao dịch vàng 01/08/2026" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Xoá giao dịch vàng 05/08/2026" }))
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/components/gold-stores-card.test.tsx src/features/finance/__tests__/components/gold-transactions-table.test.tsx src/features/finance/__tests__/components/gold-transactions-cards.test.tsx`
Expected: FAIL 4 test — "names each store's price field…" (`Unable to find an accessible element with the role "textbox" and name "Giá SJC hôm nay (mỗi phân)"` — log liệt kê các ô với `Name "đ"`); 2 test của bảng và 1 test xoá của thẻ (`... role "button" and name "Xoá giao dịch vàng 01/08/2026"`). Test trạng thái rỗng của thẻ PASS sẵn. Mọi test khác (kể cả 2 test tên trùng của Plan 6a) vẫn PASS.

- [ ] **Step 3: Viết code**

3.1. `src/features/finance/components/gold-stores-card.tsx` — trong `stores.map`, ở `<Field>` giá (có `suffix="đ"` và `value={store.price}`), thêm prop ngay sau dòng `onChange={(e) => onSetPrice(store.name, e.target.value)}`:

```tsx
                  // Field bọc ô trong <label> chỉ chứa hậu tố "đ" và nhãn cột ẩn dưới sm → đặt tên riêng.
                  // Không bắt đầu bằng "Giá hôm nay" để không lẫn với ô cùng tên của form thêm cửa hàng.
                  aria-label={`Giá ${store.name} hôm nay (mỗi phân)`}
```

3.2. `src/features/finance/components/gold-transactions-table.tsx` — ở nút xoá, đổi

```tsx
                      aria-label="Xoá giao dịch vàng"
```

thành

```tsx
                      aria-label={`Xoá giao dịch vàng ${purchase.date}`}
```

3.3. `src/features/finance/components/gold-transactions-cards.tsx` — ở nút xoá, đổi

```tsx
                  aria-label="Xoá giao dịch vàng"
```

thành

```tsx
                  aria-label={`Xoá giao dịch vàng ${purchase.date}`}
```

Không đụng dòng `const price = goldMarketPrice(stores, purchase)` (Plan 6a) hay nút sửa.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/components/gold-stores-card.test.tsx src/features/finance/__tests__/components/gold-transactions-table.test.tsx src/features/finance/__tests__/components/gold-transactions-cards.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx`
Expected: PASS toàn bộ (kể cả "blocks adding a store whose name is already taken…" của Plan 6a — `getByLabelText("Giá hôm nay", { exact: false })` vẫn chỉ khớp ô của form thêm, và "setting up a gold store and adding a purchase…" của `finance-view.test.tsx`)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.2** ở "Kiểm tra tay" của Task 11):

```bash
git add src/features/finance/components/gold-stores-card.tsx src/features/finance/components/gold-transactions-table.tsx src/features/finance/components/gold-transactions-cards.tsx src/features/finance/__tests__/components/gold-stores-card.test.tsx src/features/finance/__tests__/components/gold-transactions-table.test.tsx src/features/finance/__tests__/components/gold-transactions-cards.test.tsx
git commit -m "fix: give gold store price fields and purchase delete buttons distinct names"
```

---

### Task 3: Link "Mở" của từng mục ở Tổng quan có tên riêng

**Files:**
- Modify: `src/features/overview/components/section-head.tsx` (`<Link>`)
- Test: `src/features/overview/__tests__/components/section-head.test.tsx`

**Interfaces:**
- Consumes: `title: string` của `SectionHeadProps` (Tổng quan truyền "Tài chính", "Chi tiêu", "Nhật ký", "Học tập", "Mục tiêu").
- Produces: link có `aria-label={`Mở ${title}`}` — vẫn chứa chữ "Mở" người dùng thấy (đọc bằng giọng nói "Mở Tài chính" vẫn khớp), nên các test đang tìm `{ name: /Mở/ }` vẫn đúng. Props không đổi.

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/overview/__tests__/components/section-head.test.tsx`, thêm vào cuối `describe("SectionHead", ...)`:

```tsx
  it("names the Mở link after its section, so the links on Tổng quan read differently", () => {
    render(<SectionHead icon="wallet" title="Tài chính" href="/finance" />)

    expect(screen.getByRole("link", { name: "Mở Tài chính" })).toHaveAttribute("href", "/finance")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/components/section-head.test.tsx`
Expected: FAIL đúng test mới — `Unable to find an accessible element with the role "link" and name "Mở Tài chính"` (link hiện tên "Mở"). 2 test cũ PASS.

- [ ] **Step 3: Viết code**

Trong `src/features/overview/components/section-head.tsx`, đổi

```tsx
      <Link
        href={href}
        className=
```

thành

```tsx
      <Link
        href={href}
        // Tổng quan có tới 5 link "Mở" — danh sách link của trình đọc màn hình cần biết link nào tới đâu.
        aria-label={`Mở ${title}`}
        className=
```

(giữ nguyên chuỗi class, chữ "Mở" và `<ArrowRight size={15} />`).

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/components/section-head.test.tsx src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.3** ở "Kiểm tra tay" của Task 11):

```bash
git add src/features/overview/components/section-head.tsx src/features/overview/__tests__/components/section-head.test.tsx
git commit -m "fix: name each overview section's Mở link after its section"
```

---

### Task 4: Link điều hướng sidebar giữ tên khi chỉ còn icon (768–1023px)

**Files:**
- Modify: `src/app/(app)/_components/sidebar.tsx` (`<Link>` trong `nav.map`)
- Test: `src/app/(app)/_components/__tests__/sidebar.test.tsx`

**Interfaces:**
- Consumes: bản sau Plan 5 Task 3 — `<Link>` có `min-w-0 flex-auto ... px-0.5 ... md:flex-none`, nhãn là `<span>` ĐẦU TIÊN trong Link với class `max-w-full truncate md:hidden lg:inline`; dòng import `@testing-library/react` của test đã có `within` (Plan 5 Task 3 thêm). Icon lucide-react 1.31 tự có `aria-hidden="true"`.
- Produces: mỗi `<Link>` có `aria-label={label}` — tên truy cập bằng đúng nhãn ở mọi bề rộng. Không đổi class nào của Plan 5, không thêm phần tử nào vào Link (test "lets the 7 bottom-nav links shrink…" của Plan 5 lấy nhãn bằng `link.querySelector("span")` và so `textContent`), không thêm `title`.

- [ ] **Step 1: Viết test thất bại**

Trong `src/app/(app)/_components/__tests__/sidebar.test.tsx`, thêm vào cuối `describe("Sidebar", ...)` (sau các test của Plan 1b, 5, 6a). Nếu dòng import `@testing-library/react` chưa có `within` thì thêm vào.

```tsx
  it("keeps every nav link named after its page when the icon-only sidebar hides the label (768–1023px)", () => {
    render(<Sidebar />)

    const nav = screen.getByRole("navigation")
    // jsdom không nạp Tailwind nên `md:hidden` không có tác dụng ở đây — ẩn nhãn bằng tay, đúng như ở bề rộng md.
    for (const link of within(nav).getAllByRole("link")) {
      const label = link.querySelector("span") as HTMLElement
      label.style.display = "none"
    }

    for (const name of ["Tổng quan", "Tài chính", "Chi tiêu", "Nhật ký", "Học tập", "Mục tiêu", "Cài đặt"]) {
      expect(within(nav).getByRole("link", { name })).toBeInTheDocument()
    }
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx"`
Expected: FAIL đúng test mới — `Unable to find an accessible element with the role "link" and name "Tổng quan"` (log liệt kê 7 link với `Name ""`). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/app/(app)/_components/sidebar.tsx`, trong `nav.map(...)`, đổi

```tsx
              <Link
                key={label}
                href={href}
                className={cn(
```

thành

```tsx
              <Link
                key={label}
                href={href}
                // Ở md (768–1023px) nhãn bị ẩn (md:hidden) và icon lucide có aria-hidden → link mất tên.
                // aria-label trùng đúng chữ nhãn nên tên đọc lên luôn khớp chữ người dùng thấy ở mobile/lg.
                aria-label={label}
                className={cn(
```

Không đụng chuỗi class, nhánh `active`, `<ItemIcon size={18} />`, span nhãn, `handleLogout` (giữ `clearSyncSecret()` của 1b) hay thanh trên.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx"`
Expected: PASS toàn bộ (kể cả "shows a Chi tiêu nav link pointing at /budget" và "lets the 7 bottom-nav links shrink…" của Plan 5 — `textContent` vẫn là nhãn)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.4** ở "Kiểm tra tay" của Task 11):

```bash
git add "src/app/(app)/_components/sidebar.tsx" "src/app/(app)/_components/__tests__/sidebar.test.tsx"
git commit -m "fix: keep sidebar nav links named when only their icons show"
```

---

### Task 5: `Tabs` báo tab đang chọn bằng `aria-pressed`

Theo Quyết định 2 (phương án A).

**Files:**
- Modify: `src/components/ob/tabs.tsx` (`<button>` trong `tabs.map`)
- Create: `src/components/__tests__/ob/tabs.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: mỗi nút tab có `aria-pressed={tab === active}`; role vẫn là `button`, nên 13 chỗ test của `FinanceView`/`StudyView` tìm tab bằng `getByRole("button", { name: ... })` không phải sửa. `TabsProps` không đổi.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/components/__tests__/ob/tabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { Tabs } from "@/components/ob/tabs"

const TABS = ["Tiết kiệm", "Nợ thẻ tín dụng", "Tích lũy vàng", "Đầu tư"]

describe("Tabs", () => {
  it("tells assistive tech which tab is showing", () => {
    render(<Tabs tabs={TABS} active="Tích lũy vàng" onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Tích lũy vàng", pressed: true })).toBeInTheDocument()
    for (const tab of ["Tiết kiệm", "Nợ thẻ tín dụng", "Đầu tư"]) {
      expect(screen.getByRole("button", { name: tab, pressed: false })).toBeInTheDocument()
    }
  })

  it("reports the tab that was clicked", () => {
    const onChange = vi.fn()
    render(<Tabs tabs={TABS} active="Tiết kiệm" onChange={onChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Đầu tư" }))

    expect(onChange).toHaveBeenCalledWith("Đầu tư")
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/components/__tests__/ob/tabs.test.tsx`
Expected: FAIL đúng test "tells assistive tech which tab is showing" — `Unable to find an accessible element with the role "button" and name "Tích lũy vàng"` (bộ lọc `pressed: true` không khớp nút nào vì chưa có `aria-pressed`). "reports the tab that was clicked" PASS sẵn.

- [ ] **Step 3: Viết code**

Trong `src/components/ob/tabs.tsx`, đổi

```tsx
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
```

thành

```tsx
          <button
            key={tab}
            type="button"
            // Tab đang chọn chỉ khác ở màu/độ đậm chữ — aria-pressed báo trạng thái đó cho trình đọc màn
            // hình, đúng kiểu các nút chọn khác trong app (Ẩn số tiền, chip tâm trạng).
            aria-pressed={isActive}
            onClick={() => onChange(tab)}
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/ob/tabs.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx src/features/study/__tests__/components/study-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.5** ở "Kiểm tra tay" của Task 11):

```bash
git add src/components/ob/tabs.tsx src/components/__tests__/ob/tabs.test.tsx
git commit -m "fix: expose the active tab with aria-pressed"
```

---

### Task 6: `TaskItem` hiện vòng focus khi dùng bàn phím

**Files:**
- Modify: `src/components/ob/task-item.tsx` (class của `<label>`, `<input>`, ô vuông `<span>`)
- Create: `src/components/__tests__/ob/task-item.test.tsx`

**Interfaces:**
- Consumes: vòng focus chung của app ở `globals.css` (`@layer base :focus-visible { outline: 2px solid var(--ob-color-focus); outline-offset: 2px }`) — ô vuông dùng đúng màu/độ dày/khoảng cách đó.
- Produces: checkbox thật `className="peer sr-only"` (vẫn focus được, vẫn có tên = nhãn task); ô vuông nhìn thấy được thêm `peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--ob-color-focus)]`; `<label>` thêm `relative` (mốc định vị cho input `sr-only` vốn `position: absolute`, để focus không làm trình duyệt cuộn tới 1 điểm lạ). `TaskItemProps` không đổi; `/sandbox` và 2 nơi dùng (`TasksCard`, `StudySummarySection`) không phải sửa.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/components/__tests__/ob/task-item.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { TaskItem } from "@/components/ob/task-item"

describe("TaskItem", () => {
  it("toggles through a real checkbox named after the task", () => {
    const onToggle = vi.fn()
    render(<TaskItem label="Đọc 10 trang" done={false} onToggle={onToggle} />)

    const checkbox = screen.getByRole("checkbox", { name: "Đọc 10 trang" })
    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it("draws the keyboard focus ring on the visible box, since the real checkbox is visually hidden", () => {
    render(<TaskItem label="Đọc 10 trang" done={false} onToggle={vi.fn()} />)

    const checkbox = screen.getByRole("checkbox", { name: "Đọc 10 trang" })
    // Ẩn kiểu sr-only, không phải 0×0 + opacity 0 (opacity giấu luôn vòng focus vẽ trên chính checkbox).
    expect(checkbox).toHaveClass("peer", "sr-only")
    expect(checkbox).not.toHaveClass("opacity-0")
    expect(checkbox).not.toHaveClass("size-0")
    // Ô vuông ngay sau checkbox vẽ vòng focus thay, cùng kiểu với vòng focus chung của app.
    expect(checkbox.nextElementSibling).toHaveClass(
      "peer-focus-visible:outline-2",
      "peer-focus-visible:outline-offset-2",
      "peer-focus-visible:outline-[color:var(--ob-color-focus)]"
    )
    // Input sr-only là position: absolute — label phải là mốc định vị của nó.
    expect(checkbox.closest("label")).toHaveClass("relative")
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/components/__tests__/ob/task-item.test.tsx`
Expected: FAIL đúng test "draws the keyboard focus ring…" — `Expected the element to have class: peer sr-only` / `Received: absolute size-0 opacity-0`. "toggles through a real checkbox…" PASS sẵn (khoá hành vi cũ: input `sr-only` vẫn là checkbox thật bấm được).

- [ ] **Step 3: Viết code**

Trong `src/components/ob/task-item.tsx`:

- Ở `<label className={cn(...)}>`, đổi chuỗi đầu tiên

```tsx
        "flex min-h-8 cursor-pointer items-center gap-[var(--ob-space-3)] text-sm",
```

thành

```tsx
        "relative flex min-h-8 cursor-pointer items-center gap-[var(--ob-space-3)] text-sm",
```

- Đổi `<input ...>`

```tsx
      <input
        type="checkbox"
        checked={!!done}
        onChange={onToggle}
        className="absolute size-0 opacity-0"
      />
```

thành

```tsx
      {/* sr-only thay cho 0×0 + opacity-0: opacity giấu luôn vòng focus của chính checkbox. `peer` để ô
          vuông ngay sau tự vẽ vòng focus khi checkbox được focus bằng bàn phím. */}
      <input type="checkbox" checked={!!done} onChange={onToggle} className="peer sr-only" />
```

- Ở ô vuông `<span className={cn(...)}>`, đổi chuỗi đầu tiên

```tsx
          "grid size-5 shrink-0 place-items-center rounded-[7px] border-[1.5px] text-xs font-bold text-white",
```

thành

```tsx
          "grid size-5 shrink-0 place-items-center rounded-[7px] border-[1.5px] text-xs font-bold text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--ob-color-focus)]",
```

(giữ nguyên nhánh `done ? ... : ...` của cả label lẫn ô vuông và span nhãn cuối).

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/ob/task-item.test.tsx src/features/overview/__tests__/components/overview-view.test.tsx src/features/overview/__tests__/components/study-summary-section.test.tsx src/features/study/__tests__/components/study-view.test.tsx`
Expected: PASS toàn bộ (`overview-view.test.tsx` bấm checkbox nhiệm vụ "Ôn 20 từ vựng" theo role/tên — input `sr-only` vẫn là checkbox thật; 2 file còn lại render danh sách nhiệm vụ ở Tổng quan và tab "Hôm nay")

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **B.1** ở "Kiểm tra tay" của Task 11):

```bash
git add src/components/ob/task-item.tsx src/components/__tests__/ob/task-item.test.tsx
git commit -m "fix: show a keyboard focus ring on task checkboxes"
```

---

### Task 7: Nút phát âm có tên kèm từ nó đọc

**Files:**
- Modify: `src/components/ob/speak-button.tsx` (`aria-label`)
- Test: `src/components/__tests__/ob/speak-button.test.tsx`, `src/features/study/__tests__/components/vocab-word-card.test.tsx`, `src/features/overview/__tests__/components/study-summary-section.test.tsx`

**Interfaces:**
- Consumes: prop `word: string` của `SpeakButtonProps`. `WITH_IMAGE.word` trong `vocab-word-card.test.tsx` = "university"; `DUE_WORDS` trong `study-summary-section.test.tsx` = 5 từ "word-0"…"word-4".
- Produces: nút có `aria-label={`Phát âm "${word}"`}`. Mọi test tìm nút phát âm theo tên mới (`'Phát âm "<từ>"'`, hoặc regex `/^Phát âm "/` khi đếm). `ReviewWordCard` luôn hiện chữ của từ (chỉ ẩn nghĩa/ảnh), nên tên kèm từ không lộ đáp án.

- [ ] **Step 1: Viết test thất bại**

1.1. `src/components/__tests__/ob/speak-button.test.tsx`: đổi cả 3 chỗ `screen.getByRole("button", { name: "Phát âm từ" })` thành `screen.getByRole("button", { name: 'Phát âm "university"' })`, rồi thêm vào cuối `describe("SpeakButton", ...)`:

```tsx
  it("names the button after the word it reads, so a row of speak buttons can be told apart", () => {
    render(
      <>
        <SpeakButton word="university" />
        <SpeakButton word="library" />
      </>
    )

    expect(screen.getByRole("button", { name: 'Phát âm "university"' })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: 'Phát âm "library"' })).toBeInTheDocument()
  })
```

1.2. `src/features/study/__tests__/components/vocab-word-card.test.tsx`: đổi cả 3 chỗ `{ name: "Phát âm từ" }` (trong 3 test "reads the word aloud when the speak button is clicked", "cancels any in-progress utterance…", "does not throw when the browser has no Web Speech API support") thành `{ name: 'Phát âm "university"' }`.

1.3. `src/features/overview/__tests__/components/study-summary-section.test.tsx`:

- Trong test "shows at most 5 due words even when more are due", đổi

```tsx
    expect(screen.getAllByRole("button", { name: "Phát âm từ" })).toHaveLength(5)
```

thành

```tsx
    expect(screen.getAllByRole("button", { name: /^Phát âm "/ })).toHaveLength(5)
```

- Trong test "reads a due word aloud when its speak button is clicked", đổi

```tsx
      fireEvent.click(screen.getAllByRole("button", { name: "Phát âm từ" })[0])
```

thành

```tsx
      fireEvent.click(screen.getByRole("button", { name: `Phát âm "${DUE_WORDS[0].word}"` }))
```

- Trong test "renders one speak button per due word", đổi

```tsx
      expect(screen.getAllByRole("button", { name: "Phát âm từ" })).toHaveLength(5)
```

thành

```tsx
      for (const entry of DUE_WORDS) {
        expect(screen.getByRole("button", { name: `Phát âm "${entry.word}"` })).toBeInTheDocument()
      }
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/components/__tests__/ob/speak-button.test.tsx src/features/study/__tests__/components/vocab-word-card.test.tsx src/features/overview/__tests__/components/study-summary-section.test.tsx`
Expected: FAIL 10 test — 4 ở `speak-button.test.tsx`, 3 ở `vocab-word-card.test.tsx` (`Unable to find an accessible element with the role "button" and name "Phát âm \"university\""`), 3 ở `study-summary-section.test.tsx` (`... name \`/^Phát âm "/\`` / `... name "Phát âm \"word-0\""`). Mọi test khác (kể cả test lưới của Plan 5) vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/components/ob/speak-button.tsx`, đổi

```tsx
      aria-label="Phát âm từ"
```

thành

```tsx
      // Lưới từ vựng/thẻ ôn/Tổng quan có nhiều nút phát âm cạnh nhau — tên kèm từ để danh sách nút của
      // trình đọc màn hình phân biệt được nút nào đọc từ nào.
      aria-label={`Phát âm "${word}"`}
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/ob/speak-button.test.tsx src/features/study/__tests__/components/vocab-word-card.test.tsx src/features/overview/__tests__/components/study-summary-section.test.tsx src/features/study/__tests__/components/review-word-card.test.tsx src/features/study/__tests__/components/review-due-card.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.6** ở "Kiểm tra tay" của Task 11):

```bash
git add src/components/ob/speak-button.tsx src/components/__tests__/ob/speak-button.test.tsx src/features/study/__tests__/components/vocab-word-card.test.tsx src/features/overview/__tests__/components/study-summary-section.test.tsx
git commit -m "fix: name each speak button after the word it reads"
```

---

### Task 8: Hộp xác nhận nối câu cảnh báo bằng `aria-describedby`

**Files:**
- Modify: `src/components/ui/modal.tsx` (`ModalProps`, tham số của `Modal`, thuộc tính của panel)
- Modify: `src/components/ui/alert-dialog.tsx` (lời gọi `<Modal>`, đoạn `<p>` mô tả)
- Test: `src/components/__tests__/ui/modal.test.tsx`, `src/components/__tests__/ui/alert-dialog.test.tsx`

**Interfaces:**
- Consumes: bản `Modal` sau Plan 5 Task 5 (panel có thêm `max-h-full overflow-y-auto overscroll-contain` — giữ nguyên). Mọi nơi dùng `AlertDialog` (Plan 1b `DataCard`, Plan 2 `ExpenseListCard`, Plan 4 `JournalEntriesCard`/`JournalView`, Plan 6a `MoodsCard`, các nút xoá ở Tài chính) truyền `description` là phrasing content (chữ, `<strong>`, `<span className="block">`) — hợp lệ bên trong `<p>`, không phải đổi gì.
- Produces: `ModalProps.ariaDescribedBy?: string` → `aria-describedby` trên panel (`role="dialog"`/`"alertdialog"`). `AlertDialog`: `<p id="alert-dialog-description">` và `ariaDescribedBy="alert-dialog-description"` chỉ khi có `description` (không có thì không có thuộc tính, tránh trỏ vào id không tồn tại). Id cố định theo đúng cách tiêu đề đang dùng `id="alert-dialog-title"` — `Modal` không render gì khi đóng, mỗi lúc chỉ 1 hộp xác nhận mở.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/components/__tests__/ui/modal.test.tsx`, thêm vào cuối `describe("Modal", ...)`:

```tsx
  it("points aria-describedby at the element id it is given", () => {
    render(
      <Modal open onOpenChange={vi.fn()} role="alertdialog" ariaLabel="Xoá?" ariaDescribedBy="modal-test-description">
        <p id="modal-test-description">Không thể hoàn tác.</p>
        <button type="button">Huỷ</button>
      </Modal>
    )

    expect(screen.getByRole("alertdialog", { name: "Xoá?" })).toHaveAccessibleDescription("Không thể hoàn tác.")
  })
```

1.2. Trong `src/components/__tests__/ui/alert-dialog.test.tsx`, thêm vào cuối `describe("AlertDialog", ...)`:

```tsx
  it("links the description as the dialog's accessible description, so the warning is read with the title", () => {
    render(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Xoá quỹ tiết kiệm?"
        description={
          <>
            Xoá &quot;<strong>Quỹ dự phòng</strong>&quot; sẽ không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá"
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByRole("alertdialog", { name: "Xoá quỹ tiết kiệm?" })).toHaveAccessibleDescription(
      'Xoá "Quỹ dự phòng" sẽ không thể hoàn tác.'
    )
  })

  it("leaves aria-describedby off when there is no description", () => {
    render(<AlertDialog open onOpenChange={vi.fn()} title="Xoá quỹ?" onConfirm={vi.fn()} />)

    expect(screen.getByRole("alertdialog", { name: "Xoá quỹ?" })).not.toHaveAttribute("aria-describedby")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/components/__tests__/ui/modal.test.tsx src/components/__tests__/ui/alert-dialog.test.tsx`
Expected: FAIL 2 test — "points aria-describedby…" và "links the description…" (`Expected element to have accessible description ... Received: ""`; vitest không kiểm kiểu nên prop `ariaDescribedBy` chưa khai báo chỉ bị bỏ qua). "leaves aria-describedby off…" PASS sẵn. Mọi test cũ vẫn PASS.

- [ ] **Step 3: Viết code**

3.1. `src/components/ui/modal.tsx`:

- Trong `interface ModalProps`, ngay sau dòng `ariaLabelledBy?: string` thêm:

```tsx
  // id của đoạn mô tả (vd. câu cảnh báo của AlertDialog) — trình đọc màn hình đọc nó cùng tên hộp.
  ariaDescribedBy?: string
```

- Trong danh sách tham số của `function Modal({ ... })`, ngay sau dòng `ariaLabelledBy,` thêm `ariaDescribedBy,`.
- Ở panel (`<div ref={panelRef} role={role} ...>`), ngay sau dòng `aria-labelledby={ariaLabelledBy}` thêm:

```tsx
        aria-describedby={ariaDescribedBy}
```

Không đụng chuỗi class của panel (Plan 5), lớp phủ, nền mờ, logic focus/khoá cuộn/Escape.

3.2. `src/components/ui/alert-dialog.tsx`:

- Trong `<Modal ...>`, ngay sau dòng `ariaLabelledBy="alert-dialog-title"` thêm:

```tsx
      // Câu cảnh báo ("... sẽ không thể hoàn tác") phải được đọc trước khi người dùng bấm xác nhận —
      // focus tự động rơi vào nút "Huỷ", nên chỉ tên hộp thôi là chưa đủ.
      ariaDescribedBy={description ? "alert-dialog-description" : undefined}
```

- Đổi

```tsx
        <p className="mb-5 text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">{description}</p>
```

thành

```tsx
        <p id="alert-dialog-description" className="mb-5 text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">
          {description}
        </p>
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/ui/modal.test.tsx src/components/__tests__/ui/alert-dialog.test.tsx src/features/settings/__tests__/components/moods-card.test.tsx src/features/settings/__tests__/components/data-card.test.tsx src/features/finance/__tests__/components/savings-tab.test.tsx`
Expected: PASS toàn bộ (các test của nơi dùng `AlertDialog` vẫn tìm mô tả bằng chữ như cũ)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.7** ở "Kiểm tra tay" của Task 11):

```bash
git add src/components/ui/modal.tsx src/components/ui/alert-dialog.tsx src/components/__tests__/ui/modal.test.tsx src/components/__tests__/ui/alert-dialog.test.tsx
git commit -m "fix: link alert dialog descriptions with aria-describedby"
```

---

### Task 9: Bẫy Tab của hộp thoại nhận `textarea`/`select`, bỏ qua input không tab tới được

**Files:**
- Modify: `src/components/ui/modal.tsx` (hằng `FOCUSABLE_SELECTOR`)
- Test: `src/components/__tests__/ui/modal.test.tsx`

**Interfaces:**
- Consumes: `FOCUSABLE_SELECTOR` được dùng ở 2 chỗ trong `Modal`: focus tự động khi mở (`panel.querySelector(FOCUSABLE_SELECTOR)?.focus()`) và bẫy Tab (`first`/`last` của `panel.querySelectorAll(FOCUSABLE_SELECTOR)`). Prop `ariaDescribedBy` của Task 8 giữ nguyên.
- Produces: selector mới khớp `button` đang bật, `[href]`, `input` đang bật không phải `type="hidden"` và không `tabindex="-1"`, `select`/`textarea` đang bật, `[tabindex]` khác `-1`. Hiện chưa hộp thoại nào có `textarea`/`select`/`Switch`/`Checkbox` (lỗi tiềm ẩn) — đổi selector không thay đổi gì ở các hộp đang có; input màu `type="color"` của `EditCreditCardModal` vẫn khớp như cũ.

- [ ] **Step 1: Viết test thất bại**

Trong `src/components/__tests__/ui/modal.test.tsx`, thêm vào cuối `describe("Modal", ...)`:

```tsx
  it("traps Tab on a textarea or select, not only on buttons and inputs", () => {
    render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Đầu tiên</button>
        <select aria-label="Loại">
          <option>Một</option>
        </select>
        <textarea aria-label="Ghi chú" />
      </Modal>
    )

    screen.getByRole("textbox", { name: "Ghi chú" }).focus()
    fireEvent.keyDown(window, { key: "Tab" })
    expect(screen.getByRole("button", { name: "Đầu tiên" })).toHaveFocus()

    fireEvent.keyDown(window, { key: "Tab", shiftKey: true })
    expect(screen.getByRole("textbox", { name: "Ghi chú" })).toHaveFocus()
  })

  it("never auto-focuses or wraps Tab onto disabled, hidden or tabIndex=-1 inputs", async () => {
    render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal">
        <input aria-label="Đã khoá" disabled />
        <button type="button">Đầu tiên</button>
        <button type="button">Cuối cùng</button>
        <input type="hidden" name="secret" />
        {/* Như input ẩn mà Switch/Checkbox của Base UI render kèm. */}
        <input aria-label="Input ẩn của công tắc" tabIndex={-1} aria-hidden="true" />
      </Modal>
    )

    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Đầu tiên" })).toHaveFocus())

    screen.getByRole("button", { name: "Cuối cùng" }).focus()
    fireEvent.keyDown(window, { key: "Tab" })
    expect(screen.getByRole("button", { name: "Đầu tiên" })).toHaveFocus()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/components/__tests__/ui/modal.test.tsx`
Expected: FAIL 2 test mới — "traps Tab on a textarea or select…" (`expected <button>Đầu tiên</button> to have focus`, focus còn ở `<textarea>` vì `last` hiện là nút đầu tiên); "never auto-focuses…" (`vi.waitFor` hết giờ: focus tự động nhắm vào input đã khoá nên không gì nhận focus). Mọi test cũ (kể cả 2 test bẫy Tab/Shift+Tab và test `ariaDescribedBy` của Task 8) vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/components/ui/modal.tsx`, thay

```tsx
const FOCUSABLE_SELECTOR = 'button:not([disabled]),[href],input,[tabindex]:not([tabindex="-1"])'
```

bằng

```tsx
// Phần tử nhận Tab được trong panel — dùng cho cả focus tự động lúc mở lẫn 2 đầu của bẫy Tab. Input bị
// khoá, input type="hidden" và input ẩn tabIndex=-1 (Switch/Checkbox của Base UI render kèm 1 cái) không
// nhận focus được nên không được làm đầu/cuối vòng Tab.
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",")
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/ui/modal.test.tsx src/components/__tests__/ui/alert-dialog.test.tsx src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx src/features/settings/__tests__/components/confirm-wipe-modal.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **B.2** ở "Kiểm tra tay" của Task 11):

```bash
git add src/components/ui/modal.tsx src/components/__tests__/ui/modal.test.tsx
git commit -m "fix: include textarea and select in the modal focus trap and skip untabbable inputs"
```

---

### Task 10: Confetti, pháo hoa, "tada" tôn trọng "giảm chuyển động"

**Files:**
- Modify: `src/app/globals.css` (3 rule `.ob-conf`, `.ob-tada`, `.ob-firework-spark` ở mục "mascot & hiệu ứng"; đầu khối `@media (prefers-reduced-motion: no-preference)`; khối `@media (prefers-reduced-motion: reduce)` mới ngay sau khối đó)
- Create: `src/app/__tests__/globals-css.test.ts`

**Interfaces:**
- Consumes: `Confetti` (`src/components/ob/confetti.tsx`, span `ob-conf absolute top-0`, `animationDelay` inline), `Fireworks` (span `ob-firework-spark`, `animationDelay` + `--ob-fw-dx/dy` inline), class `ob-tada` ở `GoalCard`/`VocabCard` — không sửa file nào trong số đó: chỉ đổi CSS.
- Produces: animation của `.ob-conf`, `.ob-tada`, `.ob-firework-spark` chỉ nằm trong `@media (prefers-reduced-motion: no-preference)`; khối `@media (prefers-reduced-motion: reduce)` ẩn `.ob-conf`, `.ob-firework-spark` (`display: none`). `.ob-highlight-flash` giữ nguyên (chỉ đổi màu nền). File test mới export không gì; Task 12 nối thêm describe vào đây và dùng lại 3 helper `wrappersOf`, `rulesFor`, `declares` của file này.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/app/__tests__/globals-css.test.ts`:

```ts
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, it, expect } from "vitest"
import { parse, type Rule } from "postcss"

// jsdom không áp globals.css — các quy tắc CSS quan trọng được khoá bằng cách parse chính file này.
// (postcss có sẵn trong node_modules: dependency của vite và @tailwindcss/postcss.)
const root = parse(readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8"))

const NO_PREFERENCE = "media (prefers-reduced-motion: no-preference)"
const REDUCE = "media (prefers-reduced-motion: reduce)"

// Các at-rule bọc quanh 1 rule, từ ngoài vào trong — vd. ["layer base", "media (prefers-reduced-motion: no-preference)"].
function wrappersOf(rule: Rule): string[] {
  const chain: string[] = []
  let parent = rule.parent
  while (parent?.type === "atrule") {
    chain.unshift(`${parent.name} ${parent.params}`)
    parent = parent.parent
  }
  return chain
}

function rulesFor(selector: string): Rule[] {
  const found: Rule[] = []
  root.walkRules((rule) => {
    if (rule.selectors.includes(selector)) found.push(rule)
  })
  return found
}

function declares(rule: Rule, prop: string, value?: string): boolean {
  return rule.some(
    (node) => node.type === "decl" && node.prop === prop && (value === undefined || node.value === value)
  )
}

describe("globals.css — giảm chuyển động", () => {
  it.each([".ob-conf", ".ob-firework-spark", ".ob-tada"])(
    "only animates %s when the user has not asked for reduced motion",
    (selector) => {
      const animated = rulesFor(selector).filter((rule) => declares(rule, "animation"))
      expect(animated.length).toBeGreaterThan(0)
      for (const rule of animated) expect(wrappersOf(rule)).toContain(NO_PREFERENCE)
    }
  )

  it("hides confetti pieces and firework sparks under reduced motion instead of leaving them frozen on the card", () => {
    const hidden: string[] = []
    root.walkRules((rule) => {
      if (wrappersOf(rule).includes(REDUCE) && declares(rule, "display", "none")) hidden.push(...rule.selectors)
    })
    expect(hidden.sort()).toEqual([".ob-conf", ".ob-firework-spark"])
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/app/__tests__/globals-css.test.ts`
Expected: FAIL 4 test — 3 test `only animates .ob-conf / .ob-firework-spark / .ob-tada…` (`expected [] to include 'media (prefers-reduced-motion: no-preference)'` — rule có animation đang nằm ngoài mọi at-rule) và "hides confetti pieces…" (`expected [] to deeply equal [ '.ob-conf', '.ob-firework-spark' ]`).

- [ ] **Step 3: Viết code**

Trong `src/app/globals.css`, mục `/* ---------- mascot & hiệu ứng ---------- */` (sau các `@keyframes`):

3.1. Đổi

```css
.ob-conf {
  position: absolute;
  top: 0;
  animation: ob-conf 1.5s var(--ob-ease-out) forwards;
}
.ob-tada {
  animation: ob-tada 0.62s var(--ob-ease-pop) both;
}
.ob-firework-spark {
  position: absolute;
  animation: ob-firework-spark 0.72s var(--ob-ease-out) both;
}
```

thành (bỏ 2 dòng `animation`, bỏ hẳn rule `.ob-tada`):

```css
.ob-conf {
  position: absolute;
  top: 0;
}
.ob-firework-spark {
  position: absolute;
}
```

Rule `.ob-highlight-flash { animation: ... }` ngay sau giữ nguyên.

3.2. Ngay sau dòng `@media (prefers-reduced-motion: no-preference) {` (trước `  .ob-wave-arm {`), thêm — đặt ở ĐẦU khối để thứ tự cascade với `.ob-card-grid > *` (cũng đặt `animation`, nằm sau trong khối) giữ đúng như trước:

```css
  /* Confetti, pháo hoa, "tada" chỉ chạy khi người dùng không bật "giảm chuyển động" — như mascot, card-rise
     và hiệu ứng bấm nút bên dưới. */
  .ob-conf {
    animation: ob-conf 1.5s var(--ob-ease-out) forwards;
  }
  .ob-tada {
    animation: ob-tada 0.62s var(--ob-ease-pop) both;
  }
  .ob-firework-spark {
    animation: ob-firework-spark 0.72s var(--ob-ease-out) both;
  }
```

3.3. Ngay sau dấu `}` đóng khối `@media (prefers-reduced-motion: no-preference)` (trước dòng `/* ---------- máy tính ---------- */`), thêm:

```css

@media (prefers-reduced-motion: reduce) {
  /* Không có animation thì mảnh confetti/tia pháo hoa đứng yên ở chỗ xuất phát (đỉnh thẻ, tâm chùm) —
     ẩn hẳn thay vì để lại các chấm màu đứng im trên thẻ. */
  .ob-conf,
  .ob-firework-spark {
    display: none;
  }
}
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/app/__tests__/globals-css.test.ts src/components/__tests__/ob/confetti.test.tsx src/components/__tests__/ob/fireworks.test.tsx`
Expected: PASS toàn bộ (test của `Confetti`/`Fireworks` chỉ kiểm markup + class, không đổi)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **C** ở "Kiểm tra tay" của Task 11):

```bash
git add src/app/globals.css src/app/__tests__/globals-css.test.ts
git commit -m "fix: skip confetti, fireworks and tada animations when reduced motion is requested"
```

---

### Task 11: Checkpoint nhánh 1 — tsc, lint, toàn bộ test, kiểm tra tay

**Files:** không sửa file nào (nếu 1 bước dưới đây fail: quay về đúng task gây lỗi, sửa, chạy lại test của task đó, commit `fix: ...` riêng trên nhánh này).

**Interfaces:**
- Consumes: toàn bộ Task 1–10.
- Produces: nhánh `change/a11y` sạch tsc/lint/test, sẵn sàng cho chủ repo kiểm tra tay rồi merge vào `developer`.

- [ ] **Step 1: Kiểm kiểu**

Run: `npx tsc --noEmit`
Expected: không lỗi (exit 0). Đặc biệt không lỗi ở `wrappersOf`/`declares` của `globals-css.test.ts` (kiểu `postcss`), ở prop `ariaDescribedBy` mới của `Modal`, ở `aria-labelledby` truyền qua `Switch`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error, 0 warning mới.

- [ ] **Step 3: Toàn bộ test**

Run: `npm run test`
Expected: PASS toàn bộ suite (mọi test cũ + test mới của Task 1–10), không cảnh báo React mới trong log.

- [ ] **Step 4: Tự review diff cả nhánh**

Run: `git diff developer --stat` rồi `git diff developer -- src/`
Kiểm: không chữ nào hiện trên màn hình bị đổi (chỉ thêm `aria-*`, `id`, class focus, CSS animation); sidebar còn nguyên class co giãn của Plan 5, `clearSyncSecret()` của 1b, `MONEY_MODULE_KEYS` của 6a; panel `Modal` còn `max-h-full overflow-y-auto overscroll-contain` của Plan 5; `moods-card.tsx` còn hộp xác nhận xoá và `existingLabels` của 6a; `gold-stores-card.tsx` còn `existingNames`; `.ob-highlight-flash` vẫn ngoài khối `no-preference`; không đụng `/sandbox`.

### Kiểm tra tay

Chạy `npm run dev`, mở bằng Chrome/Edge, đăng nhập như thường. Không mục nào thêm dữ liệu mới ngoài 1 bài nhật ký thử ở C.2 (xoá ngay trong mục đó). Cách xem tên/trạng thái mà trình đọc màn hình sẽ đọc: F12 → tab **Elements** → bấm biểu tượng chọn phần tử (Ctrl+Shift+C) → chọn phần tử cần xem → ở khung bên phải mở tab **Accessibility** → mục **Computed Properties**: dòng **Name** (tên), **Description** (mô tả), **Checked**/**Pressed** (trạng thái).

**A. Tên và trạng thái cho trình đọc màn hình**

- [ ] **A.1 Công tắc ở Cài đặt (Task 1)** — `/settings` → thẻ "Nhãn dùng trong chi tiêu": chọn công tắc cạnh "Tiền trọ" (phần tử `role="switch"`) → Name "Tiền trọ", Checked đúng như công tắc đang bật/tắt. Thẻ "Tâm trạng dùng trong nhật ký": công tắc cạnh "Vui" → Name "Vui". Bấm 1 công tắc → đổi trạng thái như cũ; bấm lại để trả về.
- [ ] **A.2 Ô giá cửa hàng vàng, nút xoá giao dịch (Task 2)** — `/finance` → "Tích lũy vàng" → thẻ "Giá thị trường hôm nay": chọn ô giá của 1 cửa hàng → Name "Giá <tên cửa hàng> hôm nay (mỗi phân)" (không còn "đ"). Ở "Các lần mua vàng": nút thùng rác của 1 lần mua → Name "Xoá giao dịch vàng <ngày>", cùng ngày với nút bút chì "Sửa giao dịch vàng <ngày>" cạnh nó. (Chưa có cửa hàng/lần mua nào thì bỏ qua phần đó — đã có test tự động.)
- [ ] **A.3 Link "Mở" ở Tổng quan (Task 3)** — `/overview`: link "Mở" cạnh tiêu đề "Tài chính" → Name "Mở Tài chính"; link "Mở" của các mục khác → "Mở Chi tiêu", "Mở Nhật ký", "Mở Học tập", "Mở Mục tiêu" (mục nào đang tắt ở Cài đặt thì không có).
- [ ] **A.4 Sidebar chỉ có icon (Task 4)** — F12 → Toggle device toolbar (Ctrl+Shift+M) → "Dimensions: Responsive", rộng `900`, cao `800`: sidebar dọc chỉ còn icon. Chọn icon ví (Tài chính) → phần tử `<a>` có Name "Tài chính"; kiểm thêm 2 icon khác. Ở rộng `1280` (có chữ) và `390` (thanh dưới) Name vẫn đúng nhãn. Giao diện không khác trước (không có tooltip mới).
- [ ] **A.5 Tab đang chọn (Task 5)** — `/finance`: chọn nút tab "Tiết kiệm" → Pressed: true; 3 tab còn lại Pressed: false. Bấm "Đầu tư" → "Đầu tư" thành true, "Tiết kiệm" thành false. `/study`: tab "Hôm nay" Pressed: true.
- [ ] **A.6 Nút phát âm (Task 7)** — `/study` → "Từ vựng": nút loa trên ảnh của 1 từ → Name `Phát âm "<từ đó>"`; `/overview` → "Từ cần ôn hôm nay": tương tự. Bấm → vẫn đọc to đúng từ.
- [ ] **A.7 Hộp xác nhận xoá (Task 8)** — `/finance` → "Tiết kiệm" → thùng rác của 1 quỹ → hộp "Xoá quỹ tiết kiệm?" mở: chọn khung hộp (phần tử `role="alertdialog"`) → Name "Xoá quỹ tiết kiệm?", Description `Xoá "<tên quỹ>" sẽ không thể hoàn tác.` → bấm **"Huỷ"** (không xoá). `/settings` → thùng rác của 1 tâm trạng → Description có câu "Muốn ẩn khỏi màn Nhật ký thì chỉ cần tắt công tắc." → bấm **"Huỷ"**.

**B. Chỉ dùng bàn phím** (không chạm chuột sau khi mở trang)

- [ ] **B.1 Vòng focus ở danh sách nhiệm vụ (Task 6)** — `/study`, tab "Hôm nay": nhấn Tab tới khi focus vào nhiệm vụ đầu tiên của "Nhiệm vụ hôm nay" → ô vuông nhỏ của nhiệm vụ đó có viền focus 2px (cùng màu viền focus của các nút khác), không nhảy trang. Space → tick/bỏ tick đúng nhiệm vụ đang có viền; Tab → viền sang nhiệm vụ kế. Space lần nữa ở nhiệm vụ vừa đổi để trả về như cũ. Lặp lại ở `/overview` "Nhiệm vụ hôm nay". Bấm chuột vào nhiệm vụ → KHÔNG hiện viền (chỉ hiện khi dùng bàn phím).
- [ ] **B.2 Tab không thoát khỏi hộp thoại (Task 9)** — `/finance` → "Tiết kiệm" → nhấn Tab tới nút bút chì của 1 quỹ → Enter → hộp "Sửa quỹ tiết kiệm" mở: focus nằm trong hộp; nhấn Tab liên tục → đi qua "Tên quỹ", "Số tiền hiện có", "Mục tiêu", "Ghi chú", "Huỷ", "Lưu" rồi quay lại "Tên quỹ" — không bao giờ tới trang phía sau; Shift+Tab ở "Tên quỹ" → về "Lưu"; Esc → đóng, focus về lại nút bút chì. Tab "Nợ thẻ tín dụng" → Tab tới bút chì của 1 thẻ → Enter → vòng Tab đi qua cả ô chọn màu cạnh "Tên thẻ"; Esc.
- [ ] **B.3 Tab và sidebar bằng bàn phím (Task 4, 5)** — `/finance`: Tab tới tab "Nợ thẻ tín dụng" → Enter → chuyển tab, viền focus hiện trên tab. Ở rộng `900` (như A.4): Tab qua các icon sidebar → mỗi icon có viền focus; Enter → mở đúng trang.

**C. Giảm chuyển động (Task 10)** — F12 → ⋮ (góc phải DevTools) → More tools → **Rendering** → "Emulate CSS media feature prefers-reduced-motion" chọn `prefers-reduced-motion: reduce`.

- [ ] **C.1** `/study` → "Trò chơi" → "Ghép cặp": ghép đúng 1 cặp → không có tia pháo hoa bung ra (cặp vẫn được đánh dấu đã ghép như thường). Thoát ván.
- [ ] **C.2** `/journal`: viết bài "Thử giảm chuyển động" → Lưu → thẻ báo lưu thành công hiện nhưng KHÔNG có pháo hoa; bài mới trong danh sách vẫn có nền vàng nhạt dần (hiệu ứng chỉ đổi màu — giữ lại có chủ đích). Xoá bài thử (thùng rác → "Xoá").
- [ ] **C.3** Nếu `/goals` có mục tiêu đã đạt: không có confetti, thẻ không nảy. (Chưa có mục tiêu nào đạt thì bỏ qua — đã có test tự động.)
- [ ] **C.4** Đổi lại "No emulation" → làm lại C.1: tia pháo hoa xuất hiện như cũ.

**D. (Tuỳ chọn) Trình đọc màn hình thật** — Ubuntu: bật Orca bằng Super+Alt+S. `/settings`: Tab qua các công tắc nhãn → nghe đọc tên nhãn + trạng thái bật/tắt (không còn "chuyển đổi" trơn). `/finance`: Tab qua 4 tab → nghe "đã nhấn" ở tab đang chọn. Super+Alt+S để tắt Orca.

- [ ] **Step 5: Báo lại để duyệt**

Báo chủ repo: kết quả Step 1–4, kết quả từng mục A.1–A.7, B.1–B.3, C.1–C.4 (và D nếu làm), danh sách commit trên `change/a11y` (`git log --oneline developer..HEAD`). Chỉ merge vào `developer` khi chủ repo duyệt (CLAUDE.md mục 5); không `git push` nếu chủ repo chưa yêu cầu. Nhánh 2 chỉ tách sau khi nhánh này đã merge.

---

## Nhánh 2 — `refactor/conventions` (Task 12–17)

Tách nhánh (sau khi `change/a11y` đã merge): `git checkout developer && git pull --ff-only 2>/dev/null; git checkout -b refactor/conventions` (bỏ qua `git pull` nếu repo không có remote). Chạy nhánh này khi không còn nhánh nào khác đang mở (Quyết định 1 — Task 15 đổi chỗ 61 file).

### Task 12: `globals.css` — rule phần tử trần chỉ nằm trong `@layer base`

**Files:**
- Modify: `src/app/globals.css` (bỏ `button:active` trong khối `@media (prefers-reduced-motion: no-preference)` không có layer; bỏ `* { box-sizing: border-box; }` ở mục "base")
- Test: `src/app/__tests__/globals-css.test.ts` (file do Task 10 tạo)

**Interfaces:**
- Consumes: 3 helper `wrappersOf(rule)`, `rulesFor(selector)`, `declares(rule, prop, value?)` và hằng `root` trong `globals-css.test.ts` (Task 10). Bản `button:active { transform: scale(0.95) }` trong `@layer base` (bọc trong `@media (prefers-reduced-motion: no-preference)`) đã có sẵn và giữ nguyên; preflight của Tailwind (`@import "tailwindcss"`, nằm trong `@layer base`) đã đặt `box-sizing: border-box` cho `*, ::before, ::after`.
- Produces: không còn rule nào chọn `button:active` hay `*` nằm ngoài `@layer base` (đúng quy ước CLAUDE.md mục 4 và ghi chú chủ repo "bare element rules must sit in @layer base"). Không đổi gì người dùng thấy: hiệu ứng nhấn nút vẫn chạy (bản trong layer giờ mới thật sự có tác dụng) và vẫn tắt khi bật "giảm chuyển động"; `.ob-calc-key:active { transform: scale(0.93) }` (không layer) vẫn thắng cho phím máy tính như trước. Hiện không component nào dùng `transform-none`/`[transform:...]`/`box-content`, nên không có gì đổi hình.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/app/__tests__/globals-css.test.ts` (sau `})` đóng describe "globals.css — giảm chuyển động"):

```ts
describe("globals.css — rule phần tử trần nằm trong @layer base", () => {
  it("keeps the press-scale `button:active` rule only inside @layer base, so a utility on a button can still override it", () => {
    const rules = rulesFor("button:active")
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) expect(wrappersOf(rule)[0]).toBe("layer base")
  })

  it("has no unlayered `*` rule — Tailwind preflight in @layer base already sets box-sizing", () => {
    for (const rule of rulesFor("*")) expect(wrappersOf(rule)[0]).toBe("layer base")
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/app/__tests__/globals-css.test.ts`
Expected: FAIL đúng 2 test mới — `expected 'media (prefers-reduced-motion: no-preference)' to be 'layer base'` (bản `button:active` không layer) và `expected undefined to be 'layer base'` (`* { box-sizing }` ở cấp gốc). 4 test của Task 10 vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/app/globals.css`:

3.1. Ở mục `/* ---------- base ---------- */`, xoá

```css
* {
  box-sizing: border-box;
}

```

(giữ dòng comment mục và rule `body { ... }` ngay sau).

3.2. Trong khối `@media (prefers-reduced-motion: no-preference) {` không có layer (khối có `.ob-wave-arm`, `.ob-card-grid > *`, `.ob-calc-*`), xoá

```css
  button:active {
    transform: scale(0.95);
  }
```

(nằm giữa `.ob-card-grid > *:nth-child(n + 6) { ... }` và `.ob-calc-veil { ... }`). KHÔNG đụng bản `button:active` trong `@layer base` ở cuối file, không đụng `.ob-calc-key:active`, và không đụng 3 rule confetti/tada/pháo hoa mà Task 10 đã đặt ở đầu khối.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/app/__tests__/globals-css.test.ts`
Expected: PASS 6 test

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.1** ở "Kiểm tra tay" của Task 17):

```bash
git add src/app/globals.css src/app/__tests__/globals-css.test.ts
git commit -m "refactor: keep bare element rules inside @layer base in globals.css"
```

---

### Task 13: Đặt tên kiểu props còn khai inline; bỏ `'use client'` thừa

**Files:**
- Modify: `src/features/study/components/grammar-card.tsx` (`ExampleSentence`, `ExampleList`, `StructureBadge`)
- Modify: `src/components/money-visibility-provider.tsx` (`MoneyVisibilityProvider`)
- Modify: `src/features/overview/components/study-summary-section.tsx` (`VocabTeaserCard`)
- Modify: `src/features/budget/components/tag-breakdown-chart.tsx` (`RingCallouts`)
- Modify: `src/features/finance/components/gold-pl-indicator.tsx` (dòng `"use client"`)

**Interfaces:**
- Consumes: không có gì từ task trước. `grammar-card.tsx` vẫn ở `src/features/study/components/` (Task 15 mới chuyển nó — chuyển kèm thay đổi này).
- Produces: interface mới (không export, chỉ dùng trong file): `ExampleSentenceProps`, `ExampleListProps`, `StructureBadgeProps`, `MoneyVisibilityProviderProps`, `VocabTeaserCardProps`, `RingCalloutsProps`. `gold-pl-indicator.tsx` không còn `"use client"` (không hook, không event, không browser API; mọi nơi import nó — `gold-transactions-table/cards`, `gold-store-summary-table/cards` — đều đã là client component nên bundle không đổi). Sau task này `grep -rnE "^\}: \{|\}: \{ [a-z]" src --include=*.tsx` (bỏ qua `__tests__`) không còn component nào khai props inline.

Task này không đổi hành vi (chỉ đặt tên kiểu và bỏ 1 directive) nên không có test thất bại để viết — "test" là `tsc` + test sẵn có của 5 file này vẫn xanh.

- [ ] **Step 1: Chạy test sẵn có trước khi sửa (mốc)**

Run: `npx vitest run src/features/study/__tests__/components/grammar-card.test.tsx src/components/__tests__/money-visibility-provider.test.tsx src/features/overview/__tests__/components/study-summary-section.test.tsx src/features/budget/__tests__/components/tag-breakdown-chart.test.tsx src/features/finance/__tests__/components/gold-transactions-table.test.tsx src/features/finance/__tests__/components/gold-store-summary-table.test.tsx`
Expected: PASS toàn bộ.

- [ ] **Step 2: Viết code**

2.1. `src/features/study/components/grammar-card.tsx`:

- Thay

```tsx
function ExampleSentence({
  sentence,
  translation,
  vocabIndex,
}: {
  sentence: string
  translation?: string
  vocabIndex: Map<string, string>
}) {
```

bằng

```tsx
interface ExampleSentenceProps {
  sentence: string
  translation?: string
  vocabIndex: Map<string, string>
}

function ExampleSentence({ sentence, translation, vocabIndex }: ExampleSentenceProps) {
```

- Thay

```tsx
function ExampleList({
  examples,
  translations,
  vocab,
}: {
  examples?: string[]
  translations?: string[]
  vocab: VocabEntry[]
}) {
```

bằng

```tsx
interface ExampleListProps {
  examples?: string[]
  translations?: string[]
  vocab: VocabEntry[]
}

function ExampleList({ examples, translations, vocab }: ExampleListProps) {
```

- Thay

```tsx
function StructureBadge({ structure }: { structure?: string }) {
```

bằng

```tsx
interface StructureBadgeProps {
  structure?: string
}

function StructureBadge({ structure }: StructureBadgeProps) {
```

2.2. `src/components/money-visibility-provider.tsx` (bản sau Plan 6a Task 17 — `toggle` ghi storage ngoài updater, giữ nguyên): thay

```tsx
function MoneyVisibilityProvider({ children }: { children: ReactNode }) {
```

bằng

```tsx
interface MoneyVisibilityProviderProps {
  children: ReactNode
}

function MoneyVisibilityProvider({ children }: MoneyVisibilityProviderProps) {
```

2.3. `src/features/overview/components/study-summary-section.tsx` (bản sau Plan 5 Task 6 — thân `VocabTeaserCard` giữ nguyên): thay

```tsx
function VocabTeaserCard({ entry, learned }: { entry: VocabEntry; learned: boolean }) {
```

bằng

```tsx
interface VocabTeaserCardProps {
  entry: VocabEntry
  learned: boolean
}

function VocabTeaserCard({ entry, learned }: VocabTeaserCardProps) {
```

2.4. `src/features/budget/components/tag-breakdown-chart.tsx`: thay

```tsx
function RingCallouts({ items, width, centerX }: { items: CalloutItem[]; width: number; centerX: number }) {
```

bằng

```tsx
function RingCallouts({ items, width, centerX }: RingCalloutsProps) {
```

và thêm ngay TRÊN khối comment 5 dòng mở đầu bằng `// Callout kiểu "icon badge + đường nối + %/tên" quanh vòng` (khối comment đứng sát trên `function RingCallouts`):

```tsx
interface RingCalloutsProps {
  items: CalloutItem[]
  width: number
  centerX: number
}

```

2.5. `src/features/finance/components/gold-pl-indicator.tsx`: xoá dòng đầu `"use client"` và dòng trống ngay sau nó (file bắt đầu bằng `import { TrendingDown, TrendingUp } from "lucide-react"`).

- [ ] **Step 3: Kiểm kiểu + chạy lại test**

Run: `npx tsc --noEmit`
Expected: không lỗi (exit 0).

Run: lệnh vitest ở Step 1
Expected: PASS toàn bộ, đúng số test như Step 1.

- [ ] **Step 4: Commit**

Tự review `git diff` của task (chỉ có khai báo interface, chữ ký hàm và 1 dòng directive bị xoá) rồi commit (mục **A.2** ở "Kiểm tra tay" của Task 17):

```bash
git add src/features/study/components/grammar-card.tsx src/components/money-visibility-provider.tsx src/features/overview/components/study-summary-section.tsx src/features/budget/components/tag-breakdown-chart.tsx src/features/finance/components/gold-pl-indicator.tsx
git commit -m "refactor: name inline props types and drop an unneeded use client"
```

---

### Task 14: Test "khoá nút Lưu" của 3 hộp sửa kiểm từng ô bắt buộc

**Files:**
- Test: `src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx`, `src/features/finance/__tests__/components/edit-investment-modal.test.tsx`, `src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx`

**Interfaces:**
- Consumes: điều kiện khoá nút sau Plan 1a Task 9 — `EditSavingsFundModal`: `const disabled = duplicate || !trimmedName || !amount.trim() || !target.trim()`; `EditCreditCardModal`: `const disabled = duplicate || !trimmedName || !balance.trim() || !limit.trim() || !due.trim()`; `EditInvestmentModal` (không đổi): `const disabled = !name.trim() || !cost.trim() || !value.trim()`. Nhãn ô: quỹ "Tên quỹ", "Số tiền hiện có", "Mục tiêu", "Ghi chú" (tuỳ chọn); đầu tư "Tên khoản đầu tư", "Vốn đã bỏ ra", "Giá trị hiện tại"; thẻ "Tên thẻ", "Dư nợ hiện tại", "Số tiền tối thiểu" (tuỳ chọn), "Hạn mức", "Ngày đến hạn". Mẫu `it.each([...])("... %s ...", (label) => ...)` đã dùng ở `monkey.test.tsx`.
- Produces: mỗi ô bắt buộc có 1 test riêng "disables Lưu while <nhãn> is empty"; ô tuỳ chọn có test "vẫn lưu được khi để trống". Không sửa file component nào. Test chặn trùng tên của 2 hộp sửa đã có từ Plan 1a — không viết lại.

Đây là việc sửa test (code đúng sẵn) nên test mới PASS ngay; bước "đỏ" là kiểm chứng từng test bắt được lỗi bằng cách tạm bỏ điều kiện tương ứng trong component (Step 2) rồi hoàn tác.

- [ ] **Step 1: Viết test**

1.1. `src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx` — thay nguyên test

```tsx
  it("disables Lưu while name, amount, or target is empty", () => {
    render(<EditSavingsFundModal fund={FUND} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Tên quỹ"), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
```

bằng

```tsx
  // Mỗi ô bắt buộc 1 test riêng: trước đây chỉ xoá ô tên, nên bỏ kiểm số tiền/mục tiêu đi thì test vẫn xanh
  // — và lưu với số tiền trống sẽ ghi 0 (Number("") || 0), xoá mất số dư của quỹ.
  it.each(["Tên quỹ", "Số tiền hiện có", "Mục tiêu"])("disables Lưu while %s is empty", (label) => {
    render(<EditSavingsFundModal fund={FUND} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()

    fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("still saves when the optional Ghi chú is cleared", () => {
    const onSave = vi.fn()
    render(<EditSavingsFundModal fund={FUND} onOpenChange={vi.fn()} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Ghi chú", { exact: false }), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith({ name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000 })
  })
```

1.2. `src/features/finance/__tests__/components/edit-investment-modal.test.tsx` — thay nguyên test

```tsx
  it("disables Lưu while name, cost or value is empty", () => {
    render(<EditInvestmentModal investment={INVESTMENT} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Tên khoản đầu tư", { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
```

bằng

```tsx
  it.each(["Tên khoản đầu tư", "Vốn đã bỏ ra", "Giá trị hiện tại"])("disables Lưu while %s is empty", (label) => {
    render(<EditInvestmentModal investment={INVESTMENT} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()

    fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
```

1.3. `src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx` — thay nguyên test

```tsx
  it("disables Lưu until name, balance, limit and due are filled", () => {
    render(<EditCreditCardModal card={CARD} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Tên thẻ", { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
```

bằng

```tsx
  it.each(["Tên thẻ", "Dư nợ hiện tại", "Hạn mức", "Ngày đến hạn"])("disables Lưu while %s is empty", (label) => {
    render(<EditCreditCardModal card={CARD} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()

    fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("still saves when the optional Số tiền tối thiểu is cleared", () => {
    const onSave = vi.fn()
    render(<EditCreditCardModal card={CARD} onOpenChange={vi.fn()} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Số tiền tối thiểu", { exact: false }), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: CARD.name, min: 0, limit: CARD.limit }))
  })
```

- [ ] **Step 2: Chạy test — PASS ngay, rồi kiểm chứng từng test bắt được lỗi**

Run: `npx vitest run src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx src/features/finance/__tests__/components/edit-investment-modal.test.tsx src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx`
Expected: PASS toàn bộ (code đúng sẵn; mọi test cũ — kể cả test trùng tên của Plan 1a — vẫn PASS).

Kiểm chứng (mỗi lần sửa tạm 1 component, chạy lại đúng lệnh trên, rồi hoàn tác; các file component KHÔNG thuộc diff của task):
- `src/features/finance/components/edit-savings-fund-modal.tsx`: đổi `const disabled = duplicate || !trimmedName || !amount.trim() || !target.trim()` thành `const disabled = duplicate || !trimmedName` → FAIL "disables Lưu while Số tiền hiện có is empty" và "... Mục tiêu is empty" (`expected element to be disabled`), "... Tên quỹ is empty" vẫn PASS → `git checkout src/features/finance/components/edit-savings-fund-modal.tsx`.
- `src/features/finance/components/edit-investment-modal.tsx`: đổi `const disabled = !name.trim() || !cost.trim() || !value.trim()` thành `const disabled = !name.trim()` → FAIL 2 test "Vốn đã bỏ ra"/"Giá trị hiện tại" → `git checkout src/features/finance/components/edit-investment-modal.tsx`.
- `src/features/finance/components/edit-credit-card-modal.tsx`: đổi `const disabled = duplicate || !trimmedName || !balance.trim() || !limit.trim() || !due.trim()` thành `const disabled = duplicate || !trimmedName` → FAIL 3 test "Dư nợ hiện tại"/"Hạn mức"/"Ngày đến hạn" → `git checkout src/features/finance/components/edit-credit-card-modal.tsx`.

(Nếu dòng `const disabled = ...` ở file nào khác chút so với trên do plan trước, giữ phần `duplicate` và kiểm tên, bỏ phần còn lại — mục đích chỉ là thấy test đỏ đúng ô.) Sau 3 lần, `git status` chỉ còn 3 file test bị sửa.

- [ ] **Step 3: Commit**

Tự review `git diff` của task rồi commit:

```bash
git add src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx src/features/finance/__tests__/components/edit-investment-modal.test.tsx src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx
git commit -m "chore: test each required field of the finance edit modals separately"
```

---

### Task 15: Chuyển data layer dùng chung ra `src/lib/<domain>/`, grammar card ra `src/components/ob/`

Theo Quyết định 1 (phương án A). Đây là di chuyển file thuần: nội dung mọi file giữ nguyên, chỉ dòng import đổi đường dẫn — nên không có test thất bại để viết; "test" là `npx tsc --noEmit` + **toàn bộ** suite (`npm run test`) vẫn xanh với đúng số test như trước, cộng 2 lệnh kiểm ở Step 4 (diff chỉ gồm đổi tên + dòng import; import chéo feature chỉ còn đúng 4 chỗ mà Task 16 sửa tay).

**Files:**
- Move (61 file, bằng `git mv` trong script — bảng `MOVES` ở Step 2 là danh sách chính thức):

| Domain | Module → đích | Test → đích |
|---|---|---|
| settings | `src/lib/settings-storage.ts`, `src/features/settings/hooks/use-settings.ts` → `src/lib/settings/` | `src/lib/__tests__/settings-storage.test.ts`, `src/features/settings/__tests__/hooks/use-settings.test.ts` → `src/lib/__tests__/settings/` |
| (chung) | `src/features/settings/data-transfer.ts` → `src/lib/data-transfer.ts` | `.../settings/__tests__/data-transfer.test.ts` → `src/lib/__tests__/data-transfer.test.ts` |
| finance | `types.ts`, `finance-storage.ts`, `finance-calculations.ts`, `hooks/use-finance.ts` → `src/lib/finance/` | 3 file → `src/lib/__tests__/finance/` |
| budget | `types.ts`, `budget-storage.ts`, `budget-calculations.ts`, `hooks/use-budget.ts` → `src/lib/budget/` | 3 file → `src/lib/__tests__/budget/` |
| goals | `types.ts`, `car-goal-storage.ts`, `get-goals.ts`, `hooks/use-car-goal-fund.ts` → `src/lib/goals/` | 3 file → `src/lib/__tests__/goals/` |
| journal | `types.ts`, `journal-storage.ts`, `journal-html.ts`, `hooks/use-journal.ts` → `src/lib/journal/` | 3 file (kể cả `journal-storage.test.ts` của Plan 1b) → `src/lib/__tests__/journal/` |
| net-worth | `overview/net-worth-history-storage.ts`, `overview/net-worth-history-calculations.ts`, `overview/hooks/use-net-worth-history.ts` → `src/lib/net-worth/` | 3 file → `src/lib/__tests__/net-worth/` |
| study | `types.ts`, `study-storage.ts`, `srs-calculations.ts`, `daily-pick.ts`, `random-sample.ts`, `game-calculations.ts`, `highlight-vocab.ts`, `content-loader.ts`, `hooks/use-study.ts` → `src/lib/study/` | 8 file → `src/lib/__tests__/study/` |
| study (UI) | `components/grammar-card.tsx`, `components/highlighted-sentence.tsx` → `src/components/ob/` | 2 file → `src/components/__tests__/ob/` |

- Modify (chỉ dòng import, do script): mọi file còn lại import 1 module ở trên — khoảng 180 file (trang `/overview`, `/study`, sidebar, route `/api/sync`, component của mọi feature, `net-worth-card.tsx`, `fund-picker.tsx`, ~75 file test). Barrel `src/features/goals/index.ts` được script trỏ lại sang `@/lib/goals/...` (Task 16 dọn hẳn).

**Interfaces:**
- Consumes: cây sau Task 14, sạch (`git status` rỗng). Các thứ của plan trước nằm TRONG các file được chuyển và đi theo nguyên vẹn: `useStorageSync` + `reloadSettingsFromStorage` + đọc tươi (1a), `dedupeNames`/`safeArray`/`parse*` (1a, 1b), `vocabEntrySchema`/`grammarEntrySchema` của `content-loader.ts` (1b), `tasksForDay`/`isNewWord`/`activeStreakCount`/`pickMatchEntries` (Plan 3), `collectText`/`BLOCK_TAGS` + test mới của `journal-html` (Plan 4), `goldReferencePricePerPhan` (Plan 2), `goldMarketPrice`/`nearestDueCard`/`formatPhan`... (6a), kiểm mood trùng tên của `useSettings` (6a), `restoreCounts`/`exportedAt` của `data-transfer.ts` (1b), `exportFileName` theo giờ máy (6a).
- Produces: vị trí mới theo bảng trên; mọi import tới chúng dạng alias `@/lib/...`/`@/components/ob/...`. Còn đúng 4 import chéo feature cho Task 16: `overview-view.tsx` và `goals-summary-section.tsx` (+ test của nó) → barrel `@/features/goals`; `settings-view.tsx` → `@/features/overview/overview-calculations` (`splitGreeting`).

- [ ] **Step 1: Kiểm điều kiện trước khi chạy + ghi mốc số test**

Run: `git status --porcelain && git log --oneline -1`
Expected: không có dòng nào của `git status` (cây sạch); commit cuối là của Task 14. Script tự từ chối chạy nếu cây chưa sạch — để Step 7 hoàn tác được trọn bằng `git reset --hard`.

Run: `npm run test`
Expected: PASS toàn bộ. Ghi lại 2 số ở cuối log — `Test Files  N passed` và `Tests  M passed` — làm mốc cho Step 6.

- [ ] **Step 2: Tạo script (ngoài repo — không commit)**

Script phải nằm NGOÀI repo: pre-commit hook chạy `npm run lint` lên cả thư mục làm việc, file lạ trong repo có thể chặn commit. Tạo `/tmp/ob-move-modules.mjs`:

```js
// Plan 6b — Task 15: chuyển data layer dùng chung ra src/lib/<domain>/, grammar card ra src/components/ob/.
// Chạy 1 lần từ gốc repo, trên cây sạch: node /tmp/ob-move-modules.mjs
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const MOVES = {
  // settings (+ định dạng bản sao dùng bởi Cài đặt và route /api/sync)
  "src/lib/settings-storage.ts": "src/lib/settings/settings-storage.ts",
  "src/lib/__tests__/settings-storage.test.ts": "src/lib/__tests__/settings/settings-storage.test.ts",
  "src/features/settings/hooks/use-settings.ts": "src/lib/settings/use-settings.ts",
  "src/features/settings/__tests__/hooks/use-settings.test.ts": "src/lib/__tests__/settings/use-settings.test.ts",
  "src/features/settings/data-transfer.ts": "src/lib/data-transfer.ts",
  "src/features/settings/__tests__/data-transfer.test.ts": "src/lib/__tests__/data-transfer.test.ts",
  // finance
  "src/features/finance/types.ts": "src/lib/finance/types.ts",
  "src/features/finance/finance-storage.ts": "src/lib/finance/finance-storage.ts",
  "src/features/finance/finance-calculations.ts": "src/lib/finance/finance-calculations.ts",
  "src/features/finance/hooks/use-finance.ts": "src/lib/finance/use-finance.ts",
  "src/features/finance/__tests__/finance-storage.test.ts": "src/lib/__tests__/finance/finance-storage.test.ts",
  "src/features/finance/__tests__/finance-calculations.test.ts": "src/lib/__tests__/finance/finance-calculations.test.ts",
  "src/features/finance/__tests__/hooks/use-finance.test.ts": "src/lib/__tests__/finance/use-finance.test.ts",
  // budget
  "src/features/budget/types.ts": "src/lib/budget/types.ts",
  "src/features/budget/budget-storage.ts": "src/lib/budget/budget-storage.ts",
  "src/features/budget/budget-calculations.ts": "src/lib/budget/budget-calculations.ts",
  "src/features/budget/hooks/use-budget.ts": "src/lib/budget/use-budget.ts",
  "src/features/budget/__tests__/budget-storage.test.ts": "src/lib/__tests__/budget/budget-storage.test.ts",
  "src/features/budget/__tests__/budget-calculations.test.ts": "src/lib/__tests__/budget/budget-calculations.test.ts",
  "src/features/budget/__tests__/hooks/use-budget.test.ts": "src/lib/__tests__/budget/use-budget.test.ts",
  // goals
  "src/features/goals/types.ts": "src/lib/goals/types.ts",
  "src/features/goals/car-goal-storage.ts": "src/lib/goals/car-goal-storage.ts",
  "src/features/goals/get-goals.ts": "src/lib/goals/get-goals.ts",
  "src/features/goals/hooks/use-car-goal-fund.ts": "src/lib/goals/use-car-goal-fund.ts",
  "src/features/goals/__tests__/car-goal-storage.test.ts": "src/lib/__tests__/goals/car-goal-storage.test.ts",
  "src/features/goals/__tests__/get-goals.test.ts": "src/lib/__tests__/goals/get-goals.test.ts",
  "src/features/goals/__tests__/hooks/use-car-goal-fund.test.ts": "src/lib/__tests__/goals/use-car-goal-fund.test.ts",
  // journal
  "src/features/journal/types.ts": "src/lib/journal/types.ts",
  "src/features/journal/journal-storage.ts": "src/lib/journal/journal-storage.ts",
  "src/features/journal/journal-html.ts": "src/lib/journal/journal-html.ts",
  "src/features/journal/hooks/use-journal.ts": "src/lib/journal/use-journal.ts",
  "src/features/journal/__tests__/journal-storage.test.ts": "src/lib/__tests__/journal/journal-storage.test.ts",
  "src/features/journal/__tests__/journal-html.test.ts": "src/lib/__tests__/journal/journal-html.test.ts",
  "src/features/journal/__tests__/hooks/use-journal.test.ts": "src/lib/__tests__/journal/use-journal.test.ts",
  // net-worth (đang nằm trong overview)
  "src/features/overview/net-worth-history-storage.ts": "src/lib/net-worth/net-worth-history-storage.ts",
  "src/features/overview/net-worth-history-calculations.ts": "src/lib/net-worth/net-worth-history-calculations.ts",
  "src/features/overview/hooks/use-net-worth-history.ts": "src/lib/net-worth/use-net-worth-history.ts",
  "src/features/overview/__tests__/net-worth-history-storage.test.ts": "src/lib/__tests__/net-worth/net-worth-history-storage.test.ts",
  "src/features/overview/__tests__/net-worth-history-calculations.test.ts": "src/lib/__tests__/net-worth/net-worth-history-calculations.test.ts",
  "src/features/overview/__tests__/hooks/use-net-worth-history.test.ts": "src/lib/__tests__/net-worth/use-net-worth-history.test.ts",
  // study
  "src/features/study/types.ts": "src/lib/study/types.ts",
  "src/features/study/study-storage.ts": "src/lib/study/study-storage.ts",
  "src/features/study/srs-calculations.ts": "src/lib/study/srs-calculations.ts",
  "src/features/study/daily-pick.ts": "src/lib/study/daily-pick.ts",
  "src/features/study/random-sample.ts": "src/lib/study/random-sample.ts",
  "src/features/study/game-calculations.ts": "src/lib/study/game-calculations.ts",
  "src/features/study/highlight-vocab.ts": "src/lib/study/highlight-vocab.ts",
  "src/features/study/content-loader.ts": "src/lib/study/content-loader.ts",
  "src/features/study/hooks/use-study.ts": "src/lib/study/use-study.ts",
  "src/features/study/__tests__/study-storage.test.ts": "src/lib/__tests__/study/study-storage.test.ts",
  "src/features/study/__tests__/srs-calculations.test.ts": "src/lib/__tests__/study/srs-calculations.test.ts",
  "src/features/study/__tests__/daily-pick.test.ts": "src/lib/__tests__/study/daily-pick.test.ts",
  "src/features/study/__tests__/random-sample.test.ts": "src/lib/__tests__/study/random-sample.test.ts",
  "src/features/study/__tests__/game-calculations.test.ts": "src/lib/__tests__/study/game-calculations.test.ts",
  "src/features/study/__tests__/highlight-vocab.test.ts": "src/lib/__tests__/study/highlight-vocab.test.ts",
  "src/features/study/__tests__/content-loader.test.ts": "src/lib/__tests__/study/content-loader.test.ts",
  "src/features/study/__tests__/hooks/use-study.test.ts": "src/lib/__tests__/study/use-study.test.ts",
  // study — UI dùng ở Học tập và Tổng quan
  "src/features/study/components/grammar-card.tsx": "src/components/ob/grammar-card.tsx",
  "src/features/study/components/highlighted-sentence.tsx": "src/components/ob/highlighted-sentence.tsx",
  "src/features/study/__tests__/components/grammar-card.test.tsx": "src/components/__tests__/ob/grammar-card.test.tsx",
  "src/features/study/__tests__/components/highlighted-sentence.test.tsx": "src/components/__tests__/ob/highlighted-sentence.test.tsx",
}

const SRC = "src"

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, out)
    else if (/\.tsx?$/.test(entry.name)) out.push(file)
  }
  return out
}

// Resolve 1 specifier theo cây HIỆN TẠI (trước khi chuyển) → file trong src, hoặc null (package, asset...).
function resolveSpecifier(fromFile, spec) {
  let base
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2))
  else if (spec.startsWith("./") || spec.startsWith("../")) base = path.join(path.dirname(fromFile), spec)
  else return null
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

function aliasOf(file) {
  return "@/" + path.relative(SRC, file).replace(/\.tsx?$/, "").replace(/\/index$/, "")
}

if (execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim()) {
  throw new Error("Cây làm việc chưa sạch — commit hoặc stash trước khi chạy.")
}

const moves = new Map()
for (const [from, to] of Object.entries(MOVES)) {
  if (!fs.existsSync(from)) {
    if (from.includes("__tests__")) {
      console.warn(`Bỏ qua (không có file test này): ${from}`)
      continue
    }
    throw new Error(`Thiếu file nguồn: ${from}`)
  }
  if (fs.existsSync(to)) throw new Error(`File đích đã tồn tại: ${to}`)
  moves.set(from, to)
}

// 1. Viết lại import tại chỗ (resolve theo cây cũ): specifier trỏ tới file bị chuyển, hoặc specifier tương
//    đối nằm trong file bị chuyển, đổi thành alias "@/..." của vị trí mới. Mọi ký tự khác giữ nguyên.
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bvi\.mock\(\s*|^\s*import\s+)(["'])([^"'\n]+)\2/gm
let rewritten = 0
let touchedFiles = 0
for (const file of walk(SRC)) {
  const fileMoves = moves.has(file)
  const source = fs.readFileSync(file, "utf8")
  const next = source.replace(SPECIFIER, (match, lead, quote, spec) => {
    const target = resolveSpecifier(file, spec)
    if (!target) return match
    if (!moves.has(target) && !(fileMoves && spec.startsWith("."))) return match
    rewritten += 1
    return `${lead}${quote}${aliasOf(moves.get(target) ?? target)}${quote}`
  })
  if (next !== source) {
    fs.writeFileSync(file, next)
    touchedFiles += 1
  }
}

// 2. Đổi chỗ bằng git mv (giữ lịch sử), rồi xoá thư mục rỗng còn lại (vd. src/features/finance/hooks/).
for (const [from, to] of moves) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  execFileSync("git", ["mv", from, to])
}
execFileSync("find", [SRC, "-type", "d", "-empty", "-delete"])

// 3. Cảnh báo file test còn ở lại trong src/features mà trùng tên 1 module vừa chuyển (vd. test do plan
//    trước thêm mà bảng chưa có) — chuyển nó theo đúng quy tắc rồi mới commit.
const movedNames = new Set(
  [...moves.keys()].filter((f) => !f.includes("__tests__")).map((f) => path.basename(f).replace(/\.tsx?$/, ""))
)
for (const file of walk(SRC)) {
  if (!file.startsWith("src/features/") || !file.includes("__tests__")) continue
  if (movedNames.has(path.basename(file).replace(/\.test\.tsx?$/, ""))) {
    console.warn(`Cảnh báo: ${file} trùng tên 1 module đã chuyển — chuyển nó theo bảng MOVES.`)
  }
}
console.log(`Đã chuyển ${moves.size} file, viết lại ${rewritten} import trong ${touchedFiles} file.`)
```

- [ ] **Step 3: Chạy script**

Run: `node /tmp/ob-move-modules.mjs`
Expected: dòng cuối `Đã chuyển 61 file, viết lại <khoảng 330> import trong <khoảng 180> file.` (số import/file nhỉnh hơn số đo trước 7 plan một chút — tuỳ import các plan đó thêm). Bình thường không có dòng "Bỏ qua" hay "Cảnh báo" nào. Nếu có dòng "Bỏ qua (không có file test này)" cho `journal-storage.test.ts` nghĩa là Plan 1b chưa tạo file đó — ghi lại để báo chủ repo, không cần làm gì thêm. Nếu có dòng "Cảnh báo: ..." → `git mv` file test đó sang đúng thư mục `src/lib/__tests__/<domain>/` (hoặc `src/components/__tests__/ob/`) và sửa dòng import của nó thành alias `@/lib/...` trước khi sang Step 4.

- [ ] **Step 4: Kiểm diff và ranh giới feature**

4.1. Stage và đếm loại thay đổi:

Run: `git add -A src && git diff --cached -M --name-status | cut -c1 | sort | uniq -c`
Expected: chỉ có 2 loại — khoảng 180 dòng `M` và 61 dòng `R` (đổi tên; 60 nếu Step 3 đã bỏ qua `journal-storage.test.ts`); không có `A` hay `D` (nếu có `A`+`D` cùng tên file thay cho `R`, chạy `git diff --cached -M30% --name-status` — vẫn phải ra `R`).

4.2. Diff chỉ gồm dòng import:

Run: `git diff --cached -M -U0 -- src | grep -E '^[+-]' | grep -vE '^(\+\+\+|---) ' | grep -vF -e 'from "' -e 'import("' -e 'vi.mock("'`
Expected: không in ra dòng nào (mọi dòng bị đổi đều là dòng có specifier import — kể cả `} from "..."` của import nhiều dòng và `await import("...")` trong test).

4.3. Import chéo feature còn lại:

Run:

```bash
node --input-type=module <<'EOF'
import fs from "node:fs"
import path from "node:path"

// Feature chỉ được import chính nó; src/app chỉ được import barrel "@/features/<x>"; src/components, src/lib không import feature.
const problems = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file)
    else if (/\.tsx?$/.test(entry.name)) check(file)
  }
}
function check(file) {
  const own = file.match(/^src\/features\/([a-z-]+)\//)?.[1]
  for (const [, feature, subpath = ""] of fs.readFileSync(file, "utf8").matchAll(/["']@\/features\/([a-z-]+)(\/[^"']*)?["']/g)) {
    if (feature === own) continue
    if (file.startsWith("src/app/") && subpath === "") continue
    problems.push(`${file} -> @/features/${feature}${subpath}`)
  }
}
walk("src")
console.log(problems.length ? problems.join("\n") : "OK: không còn import chéo feature")
EOF
```

Expected: đúng 4 dòng (thứ tự có thể khác):

```
src/features/overview/__tests__/components/goals-summary-section.test.tsx -> @/features/goals
src/features/overview/components/goals-summary-section.tsx -> @/features/goals
src/features/overview/components/overview-view.tsx -> @/features/goals
src/features/settings/components/settings-view.tsx -> @/features/overview/overview-calculations
```

Có thêm dòng khác → module đích là code dùng ở ≥ 2 feature mà bảng `MOVES` chưa có (do 1 plan trước thêm import mới): hoàn tác (Step 7), thêm module đó (và test của nó) vào `MOVES` theo đúng quy tắc domain ở bảng đầu task, chạy lại từ Step 3. Có dòng nào bắt đầu bằng `src/lib/` hoặc `src/components/` → cũng vậy (module đích phải chuyển theo).

- [ ] **Step 5: Kiểm kiểu**

Run: `npx tsc --noEmit`
Expected: không lỗi (exit 0) — mọi import đã trỏ đúng chỗ mới.

- [ ] **Step 6: Lint + toàn bộ test**

Run: `npm run lint`
Expected: 0 error, 0 warning mới.

Run: `npm run test`
Expected: PASS toàn bộ; `Test Files  N passed` và `Tests  M passed` bằng ĐÚNG 2 số mốc ở Step 1 (test chỉ đổi chỗ, không thêm/bớt — thiếu file nào nghĩa là 1 file test bị bỏ sót khỏi lần quét).

- [ ] **Step 7: (Chỉ khi Step 3–6 hỏng) Hoàn tác**

Run: `git reset --hard HEAD && find src -type d -empty -delete && git status --porcelain`
Expected: cây sạch, về đúng commit của Task 14. Sửa `MOVES` trong `/tmp/ob-move-modules.mjs` theo hướng dẫn ở Step 3/4.3 rồi chạy lại từ Step 3.

- [ ] **Step 8: Commit**

Tự review: `git diff --cached -M --stat | tail -1` (tổng số file) và lướt `git diff --cached -M -- src/app src/components/ob/net-worth-card.tsx src/components/ob/fund-picker.tsx` (đường dẫn mới đúng chỗ). Rồi:

```bash
git commit -m "refactor: move cross-feature data layers to src/lib and the grammar card to src/components"
```

(Đã `git add -A src` ở Step 4.1; `/tmp/ob-move-modules.mjs` nằm ngoài repo nên không lọt vào commit.)

---

### Task 16: Dọn 4 import chéo cuối cùng, ghi quy ước vào CLAUDE.md và README

Theo Quyết định 1 (phương án A).

**Files:**
- Create: `src/lib/settings/greeting.ts`, `src/lib/__tests__/settings/greeting.test.ts`
- Modify: `src/features/overview/overview-calculations.ts` (bỏ `splitGreeting`/`GreetingParts`), `src/features/overview/__tests__/overview-calculations.test.ts` (bỏ describe `splitGreeting`)
- Modify: `src/features/overview/components/overview-view.tsx` (2 dòng import), `src/features/settings/components/settings-view.tsx` (1 dòng import), `src/features/overview/components/goals-summary-section.tsx` + `src/features/overview/__tests__/components/goals-summary-section.test.tsx` (1 dòng import type), `src/features/goals/index.ts` (cả file)
- Modify (docs): `CLAUDE.md` (mục 2 dòng `lib/`, mục 3 gạch đầu dòng "Dùng ở ≥ 2 feature"), `README.md` (cây thư mục, bảng `components/ob/`, bảng `src/lib/`)

**Interfaces:**
- Consumes: kết quả Task 15 — `getGoals` ở `@/lib/goals/get-goals`, `useCarGoalFund` ở `@/lib/goals/use-car-goal-fund`, `type Goal` ở `@/lib/goals/types`; barrel `src/features/goals/index.ts` đang re-export 3 thứ đó từ `@/lib/goals/...`. `splitGreeting` hiện ở `src/features/overview/overview-calculations.ts` (cùng `monthLabel` — hàm chỉ còn test dùng, KHÔNG xoá vì ngoài phạm vi), được `overview-view.tsx` (tô riêng phần tên trong lời chào) và `settings-view.tsx` (giữ câu chào khi đổi tên hiển thị) dùng.
- Produces: `splitGreeting(greeting: string, displayName: string): GreetingParts` + `type GreetingParts = { prefix: string; name: string }` ở `src/lib/settings/greeting.ts` (thân hàm giữ nguyên từng ký tự); barrel goals chỉ còn `export { GoalsView }`; lệnh kiểm ranh giới ở Step 4 in "OK"; CLAUDE.md và README mô tả đúng vị trí mới.

- [ ] **Step 1: Viết test thất bại**

1.1. Tạo `src/lib/__tests__/settings/greeting.test.ts` (2 test chuyển nguyên văn từ `overview-calculations.test.ts`):

```ts
import { describe, it, expect } from "vitest"

import { splitGreeting } from "@/lib/settings/greeting"

describe("splitGreeting", () => {
  it("splits the greeting phrase from the trailing display name", () => {
    expect(splitGreeting("Chào buổi sáng, Tungnh2k1", "Tungnh2k1")).toEqual({
      prefix: "Chào buổi sáng",
      name: "Tungnh2k1",
    })
  })

  it("falls back to the full greeting with no name when it doesn't end with the display name", () => {
    expect(splitGreeting("Xin chào", "Tungnh2k1")).toEqual({
      prefix: "Xin chào",
      name: "",
    })
  })
})
```

1.2. Trong `src/features/overview/__tests__/overview-calculations.test.ts`: đổi `import { monthLabel, splitGreeting } from "../overview-calculations"` thành `import { monthLabel } from "../overview-calculations"` và xoá nguyên khối `describe("splitGreeting", () => { ... })` (2 test vừa chuyển sang file mới); giữ `describe("monthLabel", ...)`.

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/lib/__tests__/settings/greeting.test.ts src/features/overview/__tests__/overview-calculations.test.ts`
Expected: FAIL file `greeting.test.ts` — `Failed to resolve import "@/lib/settings/greeting"` (module chưa có). `overview-calculations.test.ts` PASS (còn 1 test `monthLabel`).

- [ ] **Step 3: Viết code**

3.1. Tạo `src/lib/settings/greeting.ts`:

```ts
// Tách lời chào ở hồ sơ ("Chào buổi sáng, Tungnh2k1") thành câu chào + tên hiển thị — Tổng quan tô riêng
// phần tên, Cài đặt giữ lại câu chào khi đổi tên hiển thị. 2 feature cùng dùng nên nằm cạnh settings-storage.
interface GreetingParts {
  prefix: string
  name: string
}

function splitGreeting(greeting: string, displayName: string): GreetingParts {
  const suffix = `, ${displayName}`
  if (displayName && greeting.endsWith(suffix)) {
    return { prefix: greeting.slice(0, greeting.length - suffix.length), name: displayName }
  }
  return { prefix: greeting, name: "" }
}

export { splitGreeting, type GreetingParts }
```

3.2. `src/features/overview/overview-calculations.ts`: xoá khối `interface GreetingParts { ... }` và hàm `function splitGreeting(...) { ... }`, đổi dòng export cuối `export { monthLabel, splitGreeting, type GreetingParts }` thành `export { monthLabel }`. File còn lại đúng hàm `monthLabel`.

3.3. `src/features/overview/components/overview-view.tsx`:
- Đổi `import { splitGreeting } from "../overview-calculations"` thành `import { splitGreeting } from "@/lib/settings/greeting"`.
- Đổi `import { getGoals, useCarGoalFund } from "@/features/goals"` thành 2 dòng:

```tsx
import { getGoals } from "@/lib/goals/get-goals"
import { useCarGoalFund } from "@/lib/goals/use-car-goal-fund"
```

3.4. `src/features/settings/components/settings-view.tsx`: đổi `import { splitGreeting } from "@/features/overview/overview-calculations"` thành `import { splitGreeting } from "@/lib/settings/greeting"`.

3.5. `src/features/overview/components/goals-summary-section.tsx` và `src/features/overview/__tests__/components/goals-summary-section.test.tsx`: đổi `import type { Goal } from "@/features/goals"` thành `import type { Goal } from "@/lib/goals/types"`.

3.6. Thay toàn bộ nội dung `src/features/goals/index.ts` bằng:

```ts
export { GoalsView } from "./components/goals-view"
```

(`getGoals`/`useCarGoalFund`/`Goal`/`GoalsInput` giờ ở `src/lib/goals/` — feature khác import thẳng từ đó; trang `/goals` chỉ cần `GoalsView`.)

- [ ] **Step 4: Chạy lại test, kiểm ranh giới, kiểm kiểu**

Run: `npx vitest run src/lib/__tests__/settings/greeting.test.ts src/features/overview/__tests__/overview-calculations.test.ts src/features/overview/__tests__/components/overview-view.test.tsx src/features/overview/__tests__/components/goals-summary-section.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx src/features/goals/__tests__/components/goals-view.test.tsx`
Expected: PASS toàn bộ.

Run:

```bash
node --input-type=module <<'EOF'
import fs from "node:fs"
import path from "node:path"

// Feature chỉ được import chính nó; src/app chỉ được import barrel "@/features/<x>"; src/components, src/lib không import feature.
const problems = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file)
    else if (/\.tsx?$/.test(entry.name)) check(file)
  }
}
function check(file) {
  const own = file.match(/^src\/features\/([a-z-]+)\//)?.[1]
  for (const [, feature, subpath = ""] of fs.readFileSync(file, "utf8").matchAll(/["']@\/features\/([a-z-]+)(\/[^"']*)?["']/g)) {
    if (feature === own) continue
    if (file.startsWith("src/app/") && subpath === "") continue
    problems.push(`${file} -> @/features/${feature}${subpath}`)
  }
}
walk("src")
console.log(problems.length ? problems.join("\n") : "OK: không còn import chéo feature")
EOF
```

Expected: `OK: không còn import chéo feature`

Run: `npx tsc --noEmit`
Expected: không lỗi (exit 0).

- [ ] **Step 5: Ghi quy ước vào CLAUDE.md**

5.1. Mục `## 2. Cấu trúc thư mục`, trong khối cây thư mục, đổi dòng

```
├── lib/         # helper dùng chung ≥ 2 feature (vd. cn())
```

thành

```
├── lib/         # helper + data layer dùng chung ≥ 2 feature (vd. cn(), lib/finance/) — xem mục 3
```

5.2. Mục `## 3. Feature Rules (feature-sliced)`, thay dòng

```md
- Dùng ở ≥ 2 feature → đưa lên `src/components/` hoặc `src/lib/` ở gốc `src/`, không để trong 1 feature.
```

bằng

```md
- Dùng ở ≥ 2 feature → đưa lên `src/components/` (UI) hoặc `src/lib/` (helper, data layer) ở gốc `src/`, không để trong 1 feature. Data layer của 1 domain mà ≥ 2 feature đọc/ghi (`types.ts`, `*-storage.ts`, `*-calculations.ts`, hook `use-*.ts`) nằm chung 1 thư mục `src/lib/<domain>/` — hiện có `finance`, `budget`, `goals`, `journal`, `study`, `net-worth`, `settings` — test ở `src/lib/__tests__/<domain>/`. Feature không import từ feature khác (kể cả qua barrel); `src/components/` và `src/lib/` không import `src/features/`; chỉ code trong `src/app/` import feature, và chỉ qua barrel `index.ts`.
```

Gạch đầu dòng "Hook đọc/ghi localStorage" (Plan 1a, 1b) ngay sau giữ nguyên.

- [ ] **Step 6: Cập nhật README**

Trong `README.md`:

6.1. Cây thư mục — đổi dòng

```
│   ├── ob/                 # 13 component riêng Orange Banana (mascot Monkey, Streak, FundPicker...)
```

thành

```
│   ├── ob/                 # 15 component riêng Orange Banana (mascot Monkey, Streak, FundPicker, GrammarHighlightCard...)
```

và đổi dòng

```
├── lib/                   # helper dùng chung ≥ 2 feature — xem bảng chi tiết ở mục Component hiện có
```

thành

```
├── lib/                   # helper + data layer dùng chung ≥ 2 feature (finance/, budget/, goals/, journal/, study/, net-worth/, settings/) — xem bảng ở mục Component hiện có
```

6.2. Đổi tiêu đề `` ### `components/ob/` (13 file) — không có primitive shadcn tương ứng, viết riêng `` thành `` ### `components/ob/` (15 file) — không có primitive shadcn tương ứng, viết riêng ``, và thêm ngay sau dòng bảng `` | `SpeakButton` | ... `` :

```md
| `GrammarHighlightCard` · `GrammarListCard` | `entry` / `entries` · `vocab` — thẻ "Ngữ pháp hôm nay" (dùng ở Học tập và Tổng quan) và danh sách ngữ pháp, tô sáng từ vựng trong câu ví dụ, có nút dịch từng câu |
| `HighlightedSentence` | `sentence` · `vocabIndex` — 1 câu ví dụ với các từ có trong kho từ vựng được tô sáng (dùng trong 2 thẻ trên) |
```

6.3. Bảng `src/lib/`:
- Đổi tiêu đề `` ### `src/lib/` — helper dùng chung ≥ 2 feature `` thành `` ### `src/lib/` — helper và data layer dùng chung ≥ 2 feature ``.
- Thêm làm dòng ĐẦU của bảng (ngay sau dòng `| --- | --- |`):

```md
| `finance/` · `budget/` · `goals/` · `journal/` · `study/` · `net-worth/` · `settings/` | Data layer của từng domain mà ≥ 2 feature cùng đọc/ghi: `types.ts`, `*-storage.ts` (đọc/ghi localStorage + hàm `parse*`), `*-calculations.ts` (hàm thuần), hook `use-*.ts`. `settings/` gồm `settings-storage.ts` (`AppSettings` + default `DEFAULT_SETTINGS`/`DEFAULT_MODULES`/`DEFAULT_TAGS`, `TINT_PALETTE`/`EMOJI_PICKER`), `use-settings.ts`, `greeting.ts` (`splitGreeting`); `study/` có thêm `content-loader.ts` (đọc `content/*.jsonl`, chỉ dùng phía server) |
```

- Thêm ngay sau dòng `` | `data-change-bus.ts` | ... ``:

```md
| `data-transfer.ts` | Định dạng bản sao xuất/nhập/đồng bộ: `buildExportPayload` · `parseImportPayload` · `exportFileName` · `uploadedSummary` · `EXPORT_VERSION` — dùng bởi Cài đặt và route `/api/sync` |
```

- Xoá dòng `` | `settings-storage.ts` | ... `` (đã gộp vào dòng `settings/` ở trên).
- Thêm ngay sau dòng `` | `next-id.ts` | ... ``:

```md
| `safe-array.ts` | `safeArray(schema, value)` — parse mảng theo từng phần tử bằng zod, phần tử hỏng chỉ bị bỏ riêng nó |
```

- Thêm ngay sau dòng `` | `use-attempt-lockout.ts` | ... ``:

```md
| `use-storage-sync.ts` | `useStorageSync(key, reload)` — hook domain tự đọc lại khi tab khác hoặc nơi khác trong app ghi cùng key |
```

- [ ] **Step 7: Toàn bộ test**

Run: `npm run test`
Expected: PASS toàn bộ; `Test Files` nhiều hơn mốc ở Task 15 Step 1 đúng 1 (thêm `greeting.test.ts`), `Tests` bằng mốc (2 test `splitGreeting` chỉ đổi file).

- [ ] **Step 8: Commit**

Tự review `git diff` của task rồi commit (mục **B** ở "Kiểm tra tay" của Task 17):

```bash
git add src/lib/settings/greeting.ts src/lib/__tests__/settings/greeting.test.ts src/features/overview/overview-calculations.ts src/features/overview/__tests__/overview-calculations.test.ts src/features/overview/components/overview-view.tsx src/features/settings/components/settings-view.tsx src/features/overview/components/goals-summary-section.tsx src/features/overview/__tests__/components/goals-summary-section.test.tsx src/features/goals/index.ts CLAUDE.md README.md
git commit -m "refactor: remove the last cross-feature imports and document the shared-code layout"
```

---

### Task 17: Checkpoint nhánh 2 — tsc, lint, toàn bộ test, build, kiểm tra tay

**Files:** không sửa file nào (nếu 1 bước dưới đây fail: quay về đúng task gây lỗi, sửa, chạy lại test của task đó, commit `fix: ...` riêng trên nhánh này).

**Interfaces:**
- Consumes: toàn bộ Task 12–16.
- Produces: nhánh `refactor/conventions` sạch tsc/lint/test/build, không còn import chéo feature, sẵn sàng cho chủ repo kiểm tra tay rồi merge vào `developer` — kết thúc chuỗi plan sửa lỗi review 2026-09-29.

- [ ] **Step 1: Kiểm kiểu**

Run: `npx tsc --noEmit`
Expected: không lỗi (exit 0).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error, 0 warning mới.

- [ ] **Step 3: Toàn bộ test**

Run: `npm run test`
Expected: PASS toàn bộ suite, không cảnh báo React mới trong log.

- [ ] **Step 4: Build production**

Run: `npm run build`
Expected: build xong không lỗi (cần mạng để `next/font/google` tải 3 font). Đây là lần duy nhất kiểm được ranh giới server/client sau khi chuyển file: 2 trang `/overview`, `/study` prerender gọi `getVocab()`/`getGrammar()` từ `@/lib/study/content-loader` (dùng `node:fs` — không được lọt vào bundle client), route `/api/sync` dùng `@/lib/data-transfer`. Lỗi kiểu "Module not found: Can't resolve 'fs'" nghĩa là 1 file client import `content-loader` — sửa import đó, không chuyển `content-loader` đi đâu khác.

- [ ] **Step 5: Kiểm ranh giới feature**

Run:

```bash
node --input-type=module <<'EOF'
import fs from "node:fs"
import path from "node:path"

// Feature chỉ được import chính nó; src/app chỉ được import barrel "@/features/<x>"; src/components, src/lib không import feature.
const problems = []
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file)
    else if (/\.tsx?$/.test(entry.name)) check(file)
  }
}
function check(file) {
  const own = file.match(/^src\/features\/([a-z-]+)\//)?.[1]
  for (const [, feature, subpath = ""] of fs.readFileSync(file, "utf8").matchAll(/["']@\/features\/([a-z-]+)(\/[^"']*)?["']/g)) {
    if (feature === own) continue
    if (file.startsWith("src/app/") && subpath === "") continue
    problems.push(`${file} -> @/features/${feature}${subpath}`)
  }
}
walk("src")
console.log(problems.length ? problems.join("\n") : "OK: không còn import chéo feature")
EOF
```

Expected: `OK: không còn import chéo feature`

- [ ] **Step 6: Tự review diff cả nhánh**

Run: `git diff developer -M --name-status | cut -c1 | sort | uniq -c` rồi `git diff developer -M -- src/app/globals.css CLAUDE.md README.md src/features/goals/index.ts src/lib/settings/greeting.ts`
Expected/Kiểm: đúng 61 dòng `R` (Task 15; 60 nếu script ở Task 15 đã in "Bỏ qua" cho `journal-storage.test.ts`), 2 dòng `A` (`src/lib/settings/greeting.ts` + test của nó), còn lại `M`; không có `D`. `globals.css` chỉ mất 2 rule (Task 12); 3 rule confetti/tada/pháo hoa của nhánh 1 vẫn ở đầu khối `no-preference`. Không đụng `/sandbox`, `EXPORT_VERSION`, `auto-backup.tsx` ngoài dòng import, `content/`.

### Kiểm tra tay

Chạy `npm run dev`, đăng nhập như thường. **Trước khi bắt đầu:** Cài đặt → "Xuất file JSON" để có bản sao lưu dữ liệu thật (các mục dưới thêm rồi xoá ngay 1 quỹ, 1 khoản chi, 1 bài nhật ký thử; file sao lưu chỉ dùng nếu có gì lệch). Nhánh này không đổi giao diện — mục tiêu là thấy mọi trang vẫn đọc/ghi đúng dữ liệu như trước khi chuyển file.

**A. Không đổi hình (Task 12–13)**

- [ ] **A.1 Hiệu ứng nhấn nút (Task 12)** — bấm và giữ chuột trên 1 nút bất kỳ (vd. "Thêm quỹ tiết kiệm" ở `/finance`): nút hơi thu nhỏ khi đang nhấn, thả ra trở lại như cũ. Mở Máy tính (sidebar) → phím vẫn thu nhỏ khi nhấn. F12 → ⋮ → More tools → Rendering → "Emulate CSS media feature prefers-reduced-motion" = `reduce` → nút KHÔNG thu nhỏ nữa; đổi lại "No emulation".
- [ ] **A.2 Component vừa đặt tên kiểu props (Task 13)** — `/finance` → "Tích lũy vàng": ô lãi/lỗ (▲/▼) ở bảng/thẻ giao dịch và bảng theo cửa hàng hiện như cũ. `/budget`: biểu đồ vòng theo nhãn có nhãn chú thích quanh vòng như cũ. `/study` → "Ngữ pháp": câu ví dụ có từ được tô sáng, nút dịch mở/đóng bản dịch.

**B. Mọi trang đọc/ghi đúng dữ liệu sau khi chuyển data layer (Task 15–16)**

- [ ] **B.1** `/overview`: mọi mục hiện số như trước (Tài sản ròng, chi tiêu tháng, nhiệm vụ, từ cần ôn, ngữ pháp hôm nay, mục tiêu, nhật ký gần đây); lời chào "<câu chào>, <tên>" vẫn tô riêng tên. Tick 1 nhiệm vụ → số "x/y" tăng; bỏ tick lại.
- [ ] **B.2** `/finance`: 4 tab hiện đủ dữ liệu. Thêm quỹ "Thử refactor" (số tiền `1000`, mục tiêu `2000`) → hiện trong danh sách và "Tài sản ròng" tăng 1.000 ₫. Xoá quỹ đó (thùng rác → "Xoá").
- [ ] **B.3** `/budget`: ghi 1 khoản chi `1000` ₫ với 1 nhãn bất kỳ → danh sách và biểu đồ tháng này cập nhật. Xoá khoản đó (thùng rác → "Xoá").
- [ ] **B.4** `/journal`: viết và lưu bài "Thử refactor" → hiện đầu danh sách; `/overview` mục Nhật ký hiện bản xem trước dạng chữ thường. Quay lại `/journal`, xoá bài đó.
- [ ] **B.5** `/study`: tab "Hôm nay" (nhiệm vụ + Pomodoro), "Từ vựng" (đánh dấu 1 từ đã học rồi bỏ đánh dấu), "Ngữ pháp" (danh sách hiện đủ), "Trò chơi" (chơi vài câu Trắc nghiệm rồi thoát) — không lỗi.
- [ ] **B.6** `/goals`: 3 mục tiêu hiện; mục tiêu mua xe vẫn gắn đúng quỹ như trước. Chọn quỹ khác rồi chọn lại quỹ cũ.
- [ ] **B.7** `/settings`: đổi tên hiển thị thành "Thử" → Lưu → `/overview` lời chào đổi tên nhưng giữ nguyên câu chào; đổi lại tên cũ. Tắt module "Nhật ký" → sidebar mất "Nhật ký" ngay; bật lại. "Xuất file JSON" → tải được file mới (mở bằng trình soạn thảo: có dữ liệu nhật ký, tài chính, học tập, cài đặt, chi tiêu như file sao lưu lúc đầu). Nếu máy đã cấu hình đồng bộ (secret): "Tải lên" báo thành công (route `/api/sync` dùng `src/lib/data-transfer.ts`).
- [ ] **B.8** Đồng bộ giữa 2 tab: mở `/finance` ở 2 tab; ở tab 1 thêm quỹ "Thử 2 tab" → chuyển sang tab 2: quỹ đã hiện (không cần tải lại — `useStorageSync` vẫn chạy sau khi chuyển file). Xoá quỹ thử ở 1 tab → tab kia cũng mất.

- [ ] **Step 7: Báo lại để duyệt**

Báo chủ repo: kết quả Step 1–6 (kèm 2 dòng `Test Files`/`Tests` và kết quả build), kết quả từng mục A.1–A.2, B.1–B.8, danh sách commit trên `refactor/conventions` (`git log --oneline developer..HEAD`), và dòng "Bỏ qua"/"Cảnh báo" nếu script ở Task 15 có in. Chỉ merge vào `developer` khi chủ repo duyệt (CLAUDE.md mục 5); không `git push` nếu chủ repo chưa yêu cầu. Merge xong là hết chuỗi plan 1a → 6b; xoá `/tmp/ob-move-modules.mjs` nếu còn.
