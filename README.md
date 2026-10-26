# Orange Banana

App cá nhân quản lý Tài chính · Chi tiêu · Nhật ký · Học tập · Mục tiêu, port từ bản bàn giao thiết kế sang Next.js 16 (App Router). Đã lên 7 trang chính (xem mục Tính năng) và hỗ trợ đồng bộ dữ liệu qua nhiều máy. Xem `CLAUDE.md` cho quy ước code/git đầy đủ.

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

Tính năng đồng bộ dữ liệu qua nhiều máy (`/api/sync`, backend Vercel Blob) cần 2 biến môi trường trong `.env.local` (mẫu ở `.env.example`) mới hoạt động — không bắt buộc để chạy app ở local:

- `BLOB_READ_WRITE_TOKEN` — token của 1 Vercel Blob private store (`vercel link` + `vercel env pull` sau khi tạo store).
- `SYNC_SECRET` — chuỗi bí mật tự sinh (vd. `openssl rand -hex 32`), đặt cùng giá trị ở đây và ở Vercel dashboard khi deploy thật, dùng để chặn người lạ gọi `/api/sync`.

## Stack chính

| Nhóm | Công nghệ |
| --- | --- |
| Framework | Next.js 16.3.0 (App Router, Turbopack), React 19.2.8 |
| Ngôn ngữ / style | TypeScript 5, Tailwind CSS v4 |
| Form & validate | react-hook-form + Zod (qua `@hookform/resolvers`) |
| State | Zustand (`useSettings`) + `useState` đọc/ghi localStorage riêng từng feature (finance, budget, journal, study, goals) |
| UI primitive | `@base-ui/react`, custom qua CVA (`class-variance-authority`) để khớp token `--ob-*` |
| Biểu đồ | ApexCharts (`apexcharts` + `react-apexcharts`) — dùng ở trang Chi tiêu |
| Kéo thả | dnd-kit (`@dnd-kit/core` + `@dnd-kit/sortable`) — bảng Kanban trang Làm việc |
| Rich text / an toàn | `dompurify` — sanitize nội dung nhật ký (HTML do người dùng nhập) |
| Thông báo / icon | `sonner` (toast), `lucide-react` (icon) |
| Backend đồng bộ | `@vercel/blob` — lưu 1 file snapshot JSON cho `/api/sync` |
| Test | Vitest 3 + React Testing Library + jsdom (không dùng Jest) |
| Lint / format / git hook | ESLint 9 + Prettier, Husky (script `prepare`) chạy lint ở pre-commit |

## Cấu trúc thư mục

```
src/
├── app/
│   ├── layout.tsx             # root layout: nạp 3 font (display/text/num), metadata, bọc <AuthGuard>
│   ├── page.tsx                # "/" → redirect sang /overview
│   ├── login/page.tsx          # "/login" — ngoài route group (app), không có sidebar
│   ├── sandbox/page.tsx        # "/sandbox" — xem trực quan component ui/ob, không phải feature
│   ├── api/sync/route.ts       # "/api/sync" — GET/POST, backup/restore qua Vercel Blob (bearer SYNC_SECRET)
│   └── (app)/                  # route group — shell cho user đã đăng nhập
│       ├── layout.tsx          # bọc <MoneyVisibilityProvider>, render Sidebar + <Toaster>
│       ├── _components/sidebar.tsx   # topbar mobile + sidebar desktop, nav lọc theo module bật/tắt trong Cài đặt
│       ├── overview/page.tsx   # "/overview" — Tổng quan
│       ├── finance/page.tsx    # "/finance"  — Tài chính
│       ├── budget/page.tsx     # "/budget"   — Chi tiêu
│       ├── journal/page.tsx    # "/journal"  — Nhật ký
│       ├── study/page.tsx      # "/study"    — Học tập
│       ├── goals/page.tsx      # "/goals"    — Mục tiêu
│       ├── work/page.tsx       # "/work"     — Làm việc (bảng Kanban, standup, báo cáo tuần)
│       └── settings/page.tsx   # "/settings" — Cài đặt
├── features/             # business logic theo feature — xem CLAUDE.md mục Feature Rules
│                          # 10 feature hiện có: overview, finance, budget, journal, study, goals, work, settings, login, calc
│                          # (xem mục Tính năng dưới để biết mỗi feature làm gì)
├── components/
│   ├── ui/                # 14 component nền shadcn/ui + @base-ui/react, custom theo token --ob-*
│   ├── ob/                 # 15 component riêng Orange Banana (mascot Monkey, Streak, FundPicker, GrammarHighlightCard...)
│   ├── auth-guard.tsx      # bọc root layout, check localStorage, đẩy về /login nếu chưa đăng nhập
│   └── money-visibility-provider.tsx  # context "ẩn số tiền", bọc trong layout (app)
├── lib/                   # helper + data layer dùng chung ≥ 2 feature (finance/, budget/, goals/, journal/, study/, net-worth/, settings/) — xem bảng ở mục Component hiện có
└── test/                  # setup file cho Vitest

content/                   # vocabulary.jsonl (424 từ, mỗi từ đã có ảnh minh hoạ), grammar.jsonl — dữ liệu học tập, không phải code
public/assets/             # logo, app-icon, avatar, icons/ (13 icon module dùng ở goals/overview...), vocab/ (424 ảnh minh hoạ từ vựng)
```

## Tính năng

| Route | Feature | Mô tả |
| --- | --- | --- |
| `/overview` | `overview` | Tổng quan — tổng hợp số liệu từ finance/budget/goals/journal/study, không có state riêng, mỗi phần bị ẩn nếu module tương ứng đang tắt ở Cài đặt |
| `/finance` | `finance` | Tài chính — 5 tab: Tiết kiệm · Nợ thẻ tín dụng (có màu tuỳ chỉnh) · Tích lũy vàng (nhiều cửa hàng, mỗi cửa hàng 1 giá riêng) · Tích lũy bạc (tính theo lượng nguyên, không quy đổi; danh sách cửa hàng và giá riêng; giá trị bạc cộng vào Tài sản ròng) · Đầu tư. Tab vàng và tab bạc dùng chung bộ component `metal-*` + `MetalTab`, chỉ khác cấu hình trong `metal-config.ts`. Mỗi lần mua vàng/bạc có nút "Tặng": lấy ra 1 số nguyên phân/lượng (ghi ngày, ghi chú), lần mua chỉ còn tính phần chưa tặng (số đang giữ, giá vốn, Tài sản ròng giảm theo), trị giá lần tặng theo giá mua lúc đó; mục "Lịch sử tặng" xem/sửa/huỷ (huỷ thì số lượng về lại lần mua) |
| `/budget` | `budget` | Chi tiêu — nhập lương hàng tháng, ghi từng khoản chi kèm tag tuỳ biến (cấu hình ở Cài đặt), xem biểu đồ theo tag và theo tháng (ApexCharts), "tất toán" tháng: dư thì cộng vào 1 quỹ tiết kiệm, thiếu thì rút từ 1 quỹ (nút chọn quỹ hiện số dư rút gọn) — số tiền còn phải tất toán luôn tính lại từ dữ liệu gốc; mọi tháng cũ có lương mà còn lệch đều được nhắc cho tới khi tất toán xong; tháng đang chạy phải có lương (kể cả 0 đ) mới tất toán được; các lần tất toán bấm trong tháng hiện ở khối "Chốt sổ" đầu danh sách "Khoản chi tháng này" (không cộng vào số đã chi); nhãn "Quẹt thẻ" gắn khoản chi với 1 thẻ tín dụng (tính 0 đ vào chi tiêu, cộng vào nợ thẻ), nhãn "Trả nợ thẻ" mới ghi tự trừ nợ thẻ; các lần tặng vàng/bạc trong tháng hiện ở khối "Quà tặng từ tích lũy" ngay dưới khối "Chốt sổ" (chỉ để xem, không cộng vào số đã chi hay tất toán) |
| `/journal` | `journal` | Nhật ký — ghi chú rich-text hàng ngày (sanitize qua `dompurify`) kèm mood (danh sách mood tuỳ biến ở Cài đặt), có card "On this day" gợi lại bài viết cùng ngày các năm trước |
| `/study` | `study` | Học tập — 4 tab: **Hôm nay** (task hàng ngày + Pomodoro + pick ngẫu nhiên-nhưng-cố-định-theo-ngày 5 từ vựng/1 điểm ngữ pháp) · **Từ vựng** · **Ngữ pháp** (2 tab sau đọc từ `content/*.jsonl`) · **Trò chơi** (3 mini-game ôn từ vựng — xem chi tiết bên dưới) |
| `/goals` | `goals` | Mục tiêu — 3 mục tiêu tính từ dữ liệu Tài chính thật, riêng mục "mua xe" có thể gắn thủ công vào 1 quỹ tiết kiệm cụ thể |
| `/work` | `work` | Làm việc — 3 tab: **Việc cần làm** (bảng Kanban kiểu Trello: cột tuỳ biến — mặc định Bắt đầu / Đang làm / Hoàn thành, đổi tên/thêm/xoá/đổi chỗ được, cột cuối luôn là cột "đã xong"; kéo thả thẻ giữa các cột và trong cột, hoặc chọn "Chuyển sang…"; "+ Thêm thẻ" cuối mỗi cột; bấm thẻ để sửa hạn, ưu tiên Cao/Thường/Thấp, xoá) · **Standup** (Hôm qua / Hôm nay / Vướng mắc, tự điền gợi ý từ danh sách việc, nút Copy) · **Báo cáo tuần** (việc đã xong, việc còn dở, vướng mắc, nút Copy). Thẻ "Việc hôm nay" ở Tổng quan |
| `/settings` | `settings` | Cài đặt — hồ sơ, danh sách mood, danh sách tag chi tiêu, bật/tắt module (điều khiển sidebar + Tổng quan), xuất/nhập dữ liệu (JSON), đồng bộ 2 chiều qua cloud (bấm tay "Tải lên"/"Tải xuống"), xoá toàn bộ dữ liệu |
| _(modal, không có route)_ | `calc` | Máy tính bỏ túi — mở từ sidebar, gõ biểu thức trực tiếp (sanitize trước khi `Function()` eval), xem trước kết quả, lưu 4 phép tính gần nhất |
| `/login` | `login` | Đăng nhập mock (so khớp tài khoản hardcode trong `src/lib/mock-account.ts`, không có backend thật) — khoá 10 phút sau 5 lần sai (`useAttemptLockout`), bảo vệ toàn app qua `AuthGuard` |

### Mini-game trong Học tập (`src/features/study/components/games/`)

Tab "Trò chơi" gồm 3 mini-game ôn từ vựng, dùng chung 1 khung điều phối `GameTab` (state máy `{ kind: "menu" } | { kind: "playing" } | { kind: "result" }`) bao quanh bởi `GameMenuCard` (menu chọn game + streak chơi hàng ngày) và `GameResultCard` (màn kết quả):

| Game | Cơ chế | File |
| --- | --- | --- |
| Trắc nghiệm (`quiz`) | Chọn đúng nghĩa trong 4 lựa chọn, 10 câu, mỗi câu giới hạn 10 giây | `quiz-game.tsx` |
| Ghép cặp (`match`) | Lật thẻ tìm đúng cặp từ ↔ nghĩa, 6 cặp, nổ pháo hoa (`Fireworks`) mỗi lần ghép đúng | `match-game.tsx` |
| Gõ từ (`spelling`) | "Falling words" — từ rơi dần xuống, gõ đúng từ trước khi chạm đáy, 5 mạng, 10 từ/lượt | `spelling-game.tsx` |

`game-registry.ts` là nguồn sự thật duy nhất ánh xạ mỗi `GameType` (`"quiz" | "match" | "spelling"`) sang icon/nhãn/điểm tối đa/component (đọc từ hằng số dùng chung trong `game-config.ts`), tránh lặp lại danh sách 3 game này ở nhiều nơi. Kết quả mỗi ván ghi qua `useStudy().recordGameResult(type, score)` — lưu điểm cao nhất riêng từng game (`GameHighScores`) và 1 streak chơi hàng ngày dùng chung cho cả 3 game (`GameStreak`).

## Component hiện có

### `components/ui/` (14 file) — nền shadcn/ui + `@base-ui/react`, custom theo token `--ob-*`

| Component | Props chính |
| --- | --- |
| `AlertDialog` | `open` · `onOpenChange` · `title` · `description` · `confirmLabel` · `cancelLabel` · `onConfirm` · `destructive` |
| `Button` | `variant` primary/secondary/reward/ghost/**outline** · `size` sm/md/lg · `fullWidth` |
| `Card` | `tone` plain/invert/reward/soft · `label` · `action` · `elevated` |
| `DropdownMenu` | `DropdownMenuTrigger` · `DropdownMenuContent` (`align`, `side` — portal, không bị khung cuộn cắt) · `DropdownMenuLabel` · `DropdownMenuItem` · `DropdownMenuRadioGroup` (`value`, `onValueChange`) + `DropdownMenuRadioItem` (`closeOnClick`) — menu `@base-ui/react`, dùng cho nút "Chuyển" trên thẻ Kanban |
| `Field` | `label` · `hint` · `prefix` · `suffix` · `numeric` · `group` (format số kiểu `vi-VN`) · `invalid` |
| `Modal` | `open` · `onOpenChange` · `role` dialog/alertdialog · `ariaLabelledBy`/`ariaLabel` · `panelClassName` — portal, focus trap, khoá scroll, nền cho `AlertDialog` và mọi modal chỉnh sửa trong các feature |
| `Progress` | `value` · `track` · `tone` reward/action/expense · `label` · `hint` |
| `Switch` | `label` · `hint` · `checked` · `onCheckedChange` · `disabled` |
| `Tag` | `module` taichinh/hoctap/ghichu/tamtrang/muctieu/kehoach |
| `Textarea` | `label` · `hint` (nối bằng `aria-describedby`) · `rows` · props của `<textarea>` — ô nhiều dòng cùng khung với `Field` |
| `Toaster` (sonner) | wrapper `sonner`, theme + icon + màu đã khớp token `--ob-*` |
| `Checkbox`, `Input`, `Label` | primitive gốc shadcn/`@base-ui/react` — dùng làm nền cho các component trên, ít khi gọi trực tiếp |

### `components/ob/` (15 file) — không có primitive shadcn tương ứng, viết riêng

| Component | Props chính |
| --- | --- |
| `Monkey` | `pose` wave/cheer/banana/book/sleep/focus/calc · `size` · `dark` — mascot chính của app, xem chi tiết dưới |
| `Figure` | `value` · `unit` · `delta` · `direction` up/down · `caption` · `size` lg/sm |
| `CountMoney` | như `Figure` (trừ `value`/`unit`) + animation đếm số tiền tăng dần, tự mask khi bật "ẩn số tiền" |
| `Empty` | `pose` (dùng lại `Monkey`, mặc định `sleep`) · `title` · `hint` · `size` — trạng thái rỗng chung |
| `NetWorthCard` | `summary` (`FinanceSummary`) — card tài sản ròng, ghép từ `Card` + `CountMoney` |
| `Streak` | `days` · `done` · `icon` — dùng cả cho streak học tập lẫn streak chơi mini-game |
| `Tabs` | `tabs` · `active` · `onChange` |
| `TaskItem` | `label` · `done` · `onToggle` |
| `Confetti` | `n` (số lượng mảnh confetti) |
| `Fireworks` | `sparksPerBurst` — hiệu ứng pháo hoa CSS, dùng khi ghép đúng cặp thẻ trong mini-game Ghép cặp |
| `FundPicker` | `savings` · `selected` · `onSelect` — chọn 1 quỹ tiết kiệm, dùng chung ở Mục tiêu (gắn quỹ mua xe) và Chi tiêu (tất toán tháng); mỗi nút hiện số dư rút gọn cạnh tên quỹ (`formatMoneyCompact`: 8k · 50xu · 500k · 1,5tr · 2 tỷ), số dư đầy đủ đọc qua `aria-describedby`, tự che khi bật "ẩn số tiền" |
| `ImageWithFallback` | `src` · `alt` · `iconSize` · `imageSizes` — wrapper `next/image` tự rơi về icon khi thiếu ảnh hoặc load lỗi (dùng cho ảnh minh hoạ từ vựng) |
| `SpeakButton` | `word` · `size` sm/md — phát âm 1 từ tiếng Anh qua Web Speech API (`speakWord`) |
| `GrammarHighlightCard` · `GrammarListCard` | `entry` / `entries` · `vocab` — thẻ "Ngữ pháp hôm nay" (dùng ở Học tập và Tổng quan) và danh sách ngữ pháp, tô sáng từ vựng trong câu ví dụ, có nút dịch từng câu |
| `HighlightedSentence` | `sentence` · `vocabIndex` — 1 câu ví dụ với các từ có trong kho từ vựng được tô sáng (dùng trong 2 thẻ trên) |

**Mascot `Monkey`** xuất hiện lặp lại nhiều nơi (trạng thái rỗng, trang chủ...) qua 7 giá trị `pose`: `wave` (mặc định, vẫy tay có animation), `cheer` (ăn mừng), `banana` (cầm chuối), `book` (cầm sách), `sleep` (ngủ, dùng trong `Empty`), `focus` (đang tập trung), `calc` (cầm máy tính). `dark` đổi màu để dùng trên nền tối.

### Khác

| Component | Vị trí | Vai trò |
| --- | --- | --- |
| `AuthGuard` | `src/components/auth-guard.tsx` | Bọc `children` trong root layout, check user trong `localStorage` (qua `src/lib/auth.ts`), đẩy về `/login` nếu chưa đăng nhập; hiện spinner trong lúc chờ check |
| `MoneyVisibilityProvider` | `src/components/money-visibility-provider.tsx` | Context "ẩn số tiền" toàn app (`useMoneyVisibility()`), bọc trong `src/app/(app)/layout.tsx`, lưu trạng thái qua `src/lib/money-visibility-storage.ts` |

### `src/lib/` — helper và data layer dùng chung ≥ 2 feature

| File | Vai trò |
| --- | --- |
| `finance/` · `budget/` · `goals/` · `journal/` · `study/` · `net-worth/` · `settings/` · `work/` | Data layer của từng domain mà ≥ 2 feature cùng đọc/ghi: `types.ts`, `*-storage.ts` (đọc/ghi localStorage + hàm `parse*`), `*-calculations.ts` (hàm thuần), hook `use-*.ts`. `finance/` có thêm `metal-calculations.ts` (giá, lãi/lỗ, tổng hợp theo cửa hàng dùng chung cho vàng và bạc). `settings/` gồm `settings-storage.ts` (`AppSettings` + default `DEFAULT_SETTINGS`/`DEFAULT_MODULES`/`DEFAULT_TAGS`, `TINT_PALETTE`/`EMOJI_PICKER`), `use-settings.ts`, `greeting.ts` (`splitGreeting`); `study/` có thêm `content-loader.ts` (đọc `content/*.jsonl`, chỉ dùng phía server) |
| `auth.ts` | Auth mock qua localStorage: `getStoredUser` · `setStoredUser` · `clearStoredUser` |
| `data-change-bus.ts` | Pub/sub nhỏ (`notifyDataChanged` · `onDataChanged`) báo hiệu dữ liệu vừa đổi giữa các component không liên quan trực tiếp |
| `data-transfer.ts` | Định dạng bản sao xuất/nhập/đồng bộ: `buildExportPayload` · `parseImportPayload` · `exportFileName` · `uploadedSummary` · `EXPORT_VERSION` — dùng bởi Cài đặt và route `/api/sync` |
| `date.ts` | Helper ngày/tháng tiếng Việt: `longDate` · `dayKey` · `dayKeyFromIso` (chuỗi ISO → ngày theo giờ máy) · `formatDayKey` · `monthKey` · `monthKeyFromDayKey` · `isMonthKey` (key tháng đúng dạng YYYY-MM, tháng 01–12) · `monthsFrom` · `shiftMonth` · `shiftDay` · `monthsThroughYearEnd` · `formatMonthKey` |
| `format.ts` | `formatMoney(n, hidden)` (VNĐ, ẩn bằng dấu chấm khi bật "ẩn số tiền") · `groupVN(value)` (nhóm số hàng nghìn cho input) · `formatMoneyCompact(n, hidden)` (rút gọn, cắt xuống: 8k · 50xu · 500k · 1,5tr · 2 tỷ; ẩn → `•••`) · `pastedMoneyDigits(text)` (lấy chữ số từ số tiền dán vào) |
| `mock-account.ts` | `MOCK_ACCOUNT` — tài khoản demo hardcode cho `login` |
| `money-visibility-storage.ts` | Đọc/ghi localStorage cờ "ẩn số tiền": `getHideMoney` · `setHideMoney` |
| `next-id.ts` | `nextId(existing)` — sinh id số nguyên tiếp theo (`max(id hiện có) + 1`), dùng chung bởi `use-finance.ts` và `use-budget.ts` |
| `safe-array.ts` | `safeArray(schema, value)` — parse mảng theo từng phần tử bằng zod, phần tử hỏng chỉ bị bỏ riêng nó |
| `speak.ts` | `speakWord(word)` — phát âm tiếng Anh qua Web Speech API |
| `sync-secret-storage.ts` | Đọc/ghi/xoá localStorage "sync secret": `getSyncSecret` · `setSyncSecret` · `clearSyncSecret` |
| `use-attempt-lockout.ts` | `useAttemptLockout(storageKey)` — khoá sau N lần thao tác sai liên tiếp (mặc định 5 lần / khoá 10 phút), dùng cho cả login và các thao tác phá huỷ cần xác nhận |
| `use-storage-sync.ts` | `useStorageSync(key, reload)` — hook domain tự đọc lại khi tab khác hoặc nơi khác trong app ghi cùng key |
| `utils.ts` | `cn(...)` — gộp class kiểu shadcn (`clsx` + `tailwind-merge`) |
