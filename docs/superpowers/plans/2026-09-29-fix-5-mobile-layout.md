# Bố cục mobile (phần 5 sửa lỗi review 2026-09-29) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Nhánh:** `fix/mobile-layout` (tách từ `developer` sau khi phần trước đã merge — phần trước là Plan 4; chuỗi đầy đủ 1a → 1b → 2 → 3 → 4 → 5 → 6a → 6b).

**Goal:** Trên điện thoại rộng 360–430px không còn gì tràn khỏi màn hình hay khỏi thẻ của nó: đủ 7 mục ở thanh điều hướng dưới (kể cả "Cài đặt"), số tiền lớn nằm trọn trong thẻ, hộp thoại cao hơn màn hình cuộn được tới nút Lưu, lưới từ vựng/ghép cặp không đè hay cắt chữ, từ rơi ở "Gõ từ" không mất chữ đầu, và 3 nút ở thanh trên có vùng chạm 44px.

**Architecture:** Mọi sửa đổi là CSS/cấu trúc markup trong component sẵn có, không đổi dữ liệu hay logic. `Figure` (size lg) co cỡ chữ theo số ký tự của chuỗi qua 1 biến CSS `--ob-figure-chars` (tự đếm khi value là chuỗi, prop `fitChars` khi không đếm được); `PillarCard` bọc số tiền trong 1 container query riêng để `cqi` đo đúng cột chứa số. Thanh điều hướng dưới cho từng mục co giãn theo nhãn (`min-w-0 flex-auto`) thay vì bề rộng cứng; panel của `Modal` cao tối đa bằng màn hình và tự cuộn bên trong. Lưới "Từ cần ôn hôm nay" dùng container query theo bề rộng Card (Tailwind `@xs:`/`@md:`/`@xl:`), lần đầu tiên dùng trong repo — CLAUDE.md mục 4 ghi thêm quy ước này.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript, Tailwind CSS v4.3.3 (container query variants + `wrap-anywhere` có sẵn trong core), Vitest + React Testing Library (jsdom) — không thêm dependency nào.

**Spec:** Không có spec riêng — nguồn là 8 phát hiện review đã được kiểm chứng đối kháng (2026-09-29), liệt kê đủ ở mục `## Phạm vi` bên dưới.

## Global Constraints

- Nhánh `fix/mobile-layout` tách từ `developer` **sau khi** nhánh của Plan 4 đã merge. 1 commit/task, message theo CLAUDE.md (`fix:` / `change:` ...) cộng dòng attribution mà phiên thực thi yêu cầu. Trước mỗi commit tự review `git diff` của task (CLAUDE.md mục 6). Không commit thẳng lên `developer`/`main`, không `git push` khi chủ repo chưa yêu cầu.
- Không thêm dependency. Plan không dùng API Next.js nào mới (chỉ `next/image`/`next/link` sẵn có, không đổi cách dùng); Next tự thêm viewport `width=device-width` nên không cần khai báo viewport. Nếu buộc phải đụng API Next khác, đọc `node_modules/next/dist/docs/` trước (Next 16 có breaking changes).
- Giữ nguyên các quyết định có chủ đích: AutoBackup vẫn không mount; mock login giữ nguyên; `EXPORT_VERSION` giữ `1`; `Expense.tag` vẫn là snapshot đóng băng; số còn phải tất toán của tháng vẫn tính lại, không khoá; `/sandbox` không đụng (nó dùng `Figure` nhưng không cần sửa gì).
- Tên file/biến/test tiếng Anh; chữ hiển thị tiếng Việt. Plan này không thêm/đổi câu chữ nào người dùng thấy — chỉ đổi bố cục.
- Dải bề rộng mục tiêu: 360, 390, 430px (điện thoại dọc). Bố cục ở `md` (768px, sidebar dọc 76px) và `lg` (≥ 1024px, sidebar 248px) giữ nguyên, trừ đúng 3 chỗ được nêu trong task: số tiền rất dài co chữ ở mọi bề rộng (Task 1–2); số ở 4 thẻ trụ cột `/finance` nhỏ đi ~1/5 ở mọi bề rộng (Task 2, xem Quyết định 2); lưới "Từ cần ôn hôm nay" có 3–4 cột khi Card của nó hẹp hơn ~627px — vd. 3 cột ở 1024px, khi Card nằm cạnh "Nhiệm vụ hôm nay" — thay vì 5 cột chật (Task 6).
- jsdom không đo được layout: test khẳng định class/cấu trúc/biến CSS bảo đảm việc co giãn (`min-w-0`, `flex-auto`, `truncate`, container query, `--ob-figure-chars`...). Phần mắt thấy được kiểm ở `### Kiểm tra tay` của Task 9, trên DevTools ở 360/390/430px: F12 → Toggle device toolbar (`Ctrl+Shift+M`) → "Dimensions: Responsive" → gõ bề rộng, cao 800 (trừ khi mục ghi khác). "Không tràn ngang" = Console chạy `document.documentElement.scrollWidth - innerWidth` ra `0`.
- Mọi task commit ngay khi test của task xanh và đã tự review `git diff` — **không dừng giữa plan** chờ chủ repo. Các task đổi thứ người dùng thấy được kiểm lại ở "Kiểm tra tay" của task checkpoint cuối (Task 9); nếu chủ repo thấy sai thì sửa tiếp trên chính nhánh này. Nhánh chỉ merge vào `developer` sau khi chủ repo chạy xong toàn bộ "Kiểm tra tay" và duyệt.
- **Các plan trước đã merge:** trước khi sửa 1 file, đọc lại TOÀN BỘ file đó và chỉ thay đúng khối plan này nêu (neo theo class/`data-testid` được trích, không theo số dòng). Đã biết: `sidebar.tsx` có thêm `import { clearSyncSecret } ...` và `clearSyncSecret()` trong `handleLogout` (Plan 1b Task 9 — giữ nguyên); `sidebar.test.tsx` có thêm 2 import + test "forgets the sync secret…" (Plan 1b); `spelling-game.tsx`/`match-game.tsx` có thể đã đổi cách nhập chữ/cách chọn thẻ (Plan 3, `area-study#5`, `#7`) — plan này chỉ đụng khối render `<span data-testid="falling-word">` và lưới thẻ; `edit-credit-card-modal.tsx` có prop `existingNames` (Plan 1a) — không sửa file này, chỉ dùng nó để kiểm tay mục C (Task 9); `AlertDialog` (dùng `Modal`, có hộp xác nhận của Plan 1b) — Task 5 chỉ đổi class của panel, không đụng lớp phủ, nền mờ hay nội dung.
- Tailwind v4.3.3: biến thể container query `@xs:` (≥ 20rem = 320px), `@md:` (≥ 28rem = 448px), `@xl:` (≥ 36rem = 576px) đo bề rộng **content box** của tổ tiên gần nhất có `container-type` — ở đây là `Card` (`[container-type:inline-size]` trong `cardVariants`). `wrap-anywhere` = `overflow-wrap: anywhere` (khác `break-words`: cho phép co cả min-content, cần khi chữ nằm trực tiếp trong flex container). Không có `@theme` nào trong `globals.css` ghi đè `--container-*`.
- Chạy từng file test bằng `npx vitest run <path>` (đường dẫn có ngoặc như `src/app/(app)/...` phải đặt trong dấu nháy kép); full suite, lint, tsc chỉ ở Task 9.

## Quyết định cần duyệt

### 1. Thanh điều hướng dưới: 7 mục không vừa 360–430px

Hiện mỗi mục rộng cứng = nhãn + 16px đệm, không co được, cộng 6 khe 4px → cả thanh cần ~450px. Theo số đo thật của reviewer (font Be Vietnam Pro 10.5px): ở 360/375/390px "Cài đặt" nằm hẳn ngoài mép phải (thanh `position: fixed` nên không cuộn tới được), ở 412px chỉ lộ 1 mẩu — trong khi đó là đường duy nhất tới Cài đặt (đồng bộ, xuất/nhập file) trên điện thoại. Tổng bề rộng riêng 7 nhãn là ~306px, còn thanh có 352px ở màn 360px.

- **A. Giữ đủ 7 mục, cho từng mục co giãn theo nhãn** — mục rộng theo nhãn của nó nhưng co được (`min-w-0 flex-auto`), đệm ngang còn 2px mỗi bên, bỏ khe giữa các mục, nhãn cắt "…" nếu vẫn thiếu chỗ. Ở 360px vẫn đủ nhãn (dư ~18px, dư nhiều hơn ở 390/430px); chỉ dưới ~340px (vd. 320px) nhãn dài nhất mới thành "Tổng q…", không bao giờ tràn. Ô đang chọn (nền cam nhạt) ôm sát chữ hơn hiện tại (~3px mỗi bên thay vì 8px). Không mục nào đổi chỗ.
- **B. Chuyển "Cài đặt" lên thanh trên thành nút bánh răng**, thanh dưới còn 6 mục — rộng rãi hơn (đệm ~6px mỗi bên), nhưng vẫn phải cho co như A mới chắc vừa 360px. Thanh trên thành 4 nút: với vùng chạm 44px (Task 4) thì ở 360px thiếu ~28px — chữ "Orange Banana" bị cắt thành "Orange Ba…" (hoặc phải thu vùng chạm xuống dưới 44px); "Cài đặt" ở điện thoại nằm khác chỗ so với desktop.
- **C. Chỉ hiện icon ở thanh dưới khi màn < 640px** (nhãn chỉ còn cho trình đọc màn hình) — thoải mái ở mọi cỡ, nhưng Tài chính (ví) / Chi tiêu (hoá đơn), Nhật ký (sách) / Học tập (mũ) khó phân biệt khi chỉ có icon.
- **Khuyên dùng: A** — vì sửa đúng lỗi tràn mà không đổi chỗ mục nào, đủ nhãn ở cả dải 360–430px, và ở máy hẹp hơn thì cắt "…" chứ không bao giờ đẩy mục ra ngoài màn hình. Plan làm A (Task 3). Chọn B hoặc C thì Task 3 phải viết lại trước khi thực thi (không có sẵn trong plan này).

### 2. Số tiền rất dài (≥ 1 tỷ) trong các ô số lớn

Ô số lớn (`Figure` size lg: Tài sản ròng, 4 thẻ trụ cột, dư nợ từng thẻ, Đầu tư, Lãi/lỗ vàng, Chi tiêu tháng này ở Tổng quan) có cỡ chữ `clamp(20px, 13cqi, 36px)` và không xuống dòng — vừa khít ~13 ký tự; "1.234.567.890 ₫" (15 ký tự) đã tràn khỏi thẻ ở 360px, 10 tỷ tràn cả màn hình.

- **A. Co cỡ chữ theo số ký tự** — vẫn 1 dòng, vẫn tối đa 36px như cũ; chuỗi đến ~12 ký tự (≤ "99.999.999 ₫") giữ đúng cỡ hiện tại, dài hơn thì chữ nhỏ dần cho vừa (tối thiểu 16px). Đổi lại: trong cùng 1 hàng thẻ, số dài hiện nhỏ hơn số ngắn (vd. "1.250.000.000 ₫" ~25px cạnh "5.000.000 ₫" ~29px ở 360px). Riêng 4 thẻ trụ cột ở `/finance` (số nằm cạnh icon, trong cột hẹp hơn thẻ ~52px — `area-finance-ui#3`): cỡ chữ tính theo đúng cột đó, nên mọi số ở đây nhỏ đi ~1/5 so với bây giờ (vd. 36 → 29px ở 360px, 33 → 26px ở 1280px) — với cỡ cũ, số từ ~10 triệu trở lên đã tràn khỏi thẻ ở cả điện thoại lẫn desktop.
- **B. Giữ cỡ chữ, cho xuống dòng giữa các nhóm số** — cỡ đồng đều, nhưng "1.250.000.\n000 ₫" khó đọc đúng giá trị.
- **C. Giữ cỡ, cắt "…"** — mất chữ số; không chấp nhận được với tiền.
- **Khuyên dùng: A** — vì số tiền luôn đọc được trọn vẹn trên 1 dòng, số thường ngày (dưới 100 triệu) ở các ô số chiếm cả bề rộng thẻ (Tài sản ròng, dư nợ từng thẻ, Đầu tư, Lãi/lỗ vàng, Chi tiêu tháng này) không đổi gì so với bây giờ. Plan làm A (Task 1, 2).

### 3. Bàn "Ghép cặp" trên điện thoại

4 cột ở 360px cho thẻ ~74px (trong lòng ~55px, ~3 dòng × 7 ký tự) nên nghĩa như "vận động viên thể thao; người chơi thể thao" bị cắt cả trên lẫn dưới.

- **A. 3 cột dưới 640px, thẻ vẫn vuông (~100px ở 360px) nhưng tự cao thêm nếu chữ vẫn dài** — đọc được mọi nghĩa trong dữ liệu hiện có; bàn thành 4 hàng, cao ~440px ở 360px (hiện ~240px), máy thấp phải cuộn để thấy hàng cuối.
- **B. Giữ 4 cột, bỏ thẻ vuông, thẻ cao theo chữ** — bàn thấp hơn, nhưng vẫn chỉ ~7 ký tự/dòng: thẻ nghĩa dài cao gấp 2–3 thẻ khác, bàn lởm chởm.
- **C. Giữ 4 cột, thu chữ xuống 11px** — vẫn cắt các nghĩa dài nhất, chữ khó đọc.
- **Khuyên dùng: A** — vì mục đích của thẻ là đọc được chữ; thêm 1 hàng dễ chịu hơn chữ bị cắt hay bàn lởm chởm. Từ 640px trở lên giữ 4 cột như cũ. Plan làm A (Task 7).

Các sửa đổi còn lại (hộp thoại cao hơn màn hình tự cuộn bên trong, lưới "Từ cần ôn hôm nay" theo bề rộng thẻ, vị trí từ rơi trong "Gõ từ", vùng chạm 44px ở thanh trên) không có đánh đổi người dùng thấy được ngoài chính bản sửa — plan làm thẳng.

## Phạm vi

| Phát hiện | Mô tả | Sửa ở |
|---|---|---|
| `area-shell-auth-calc#1` | Thanh điều hướng dưới 7 mục cần ~450px, mục không co được → ở 360–430px "Cài đặt" (và 1 phần "Mục tiêu") nằm ngoài màn hình, không cuộn tới được | Task 3 (theo Quyết định 1) |
| `area-finance-ui#3` | Số tiền ở 4 thẻ trụ cột `/finance` tính cỡ chữ theo cả Card nhưng chỉ có cột hẹp hơn ~52px cạnh icon → ở 360px từ ~10 triệu đã tràn mép thẻ, từ ~100 triệu cả trang cuộn ngang (400px: 100 triệu đã tràn thẻ; desktop 1280px: 100 triệu lấn sang thẻ bên cạnh) | Task 2 (dùng cơ chế co chữ của Task 1) |
| `area-components-lib#5` | `Figure` size lg cỡ chữ 13cqi cố định, không xuống dòng → số ≥ 1 tỷ (15+ ký tự) tràn khỏi thẻ ở điện thoại (và sát/tràn ở desktop), ≥ 10 tỷ gây cuộn ngang cả trang | Task 1 (theo Quyết định 2) |
| `area-components-lib#4` | `Modal` căn giữa bằng `items-center` trong lớp phủ không cuộn, body bị khoá cuộn → hộp cao hơn màn hình (điện thoại xoay ngang, cửa sổ thấp) mất cả tiêu đề lẫn nút "Huỷ"/"Lưu" | Task 5 |
| `area-overview-journal#12` | "Từ cần ôn hôm nay" ở Tổng quan cố định 5 cột → ~47px/cột ở 360px, từ dài đè sang ô bên, nút phát âm + dấu tích che gần hết ảnh | Task 6 |
| `area-study#13` | "Ghép cặp" 4 cột ở 360–400px → thẻ ~74px, `overflow-hidden` cắt nghĩa dài cả trên lẫn dưới | Task 7 (theo Quyết định 3) |
| `area-study#14` | Từ rơi ở "Gõ từ" đặt tâm tại 8–92% bằng `-translate-x-1/2` trong khu `overflow-hidden` → cụm từ dài xuất hiện sát mép trái mất vài chữ đầu (hơn 100px ở 328px) | Task 8 |
| `area-shell-auth-calc#8` | 3 nút icon ở thanh trên điện thoại (Máy tính, Ẩn/Hiện số tiền, Đăng xuất) chỉ 18×18px, "Đăng xuất" cách nút ẩn tiền 10px và không hỏi lại → bấm trượt là đăng xuất | Task 4 |

## Thay đổi ảnh hưởng tới các phần sau

Plan 6a và 6b chạy sau khi plan này đã merge. Mọi thứ dưới đây là "hợp đồng" mới mà chúng phải dựa vào (và không được làm mất khi sửa/di chuyển file):

**`Figure` / `CountMoney`**
- `Figure` có prop tuỳ chọn mới `fitChars?: number`. Với `size="lg"`, div giá trị mang biến CSS `--ob-figure-chars` (= `fitChars`, hoặc tự đếm độ dài `value` + `unit` khi là chuỗi/số) và cỡ chữ `clamp(16px, min(13cqi, 100cqi / (chars × 0.6)), 36px)`; value là node (vd. `<span>` tô màu) mà không có `fitChars` thì không có biến → cỡ 13cqi như cũ. `size="sm"` không đổi.
- `CountMoney` luôn truyền `fitChars` = độ dài chuỗi của số ĐÍCH (không phải số đang đếm dần).
- `GoldTab`: có biến `goldPLText = signedMoney(goldPL, hidden)` và `<Figure ... fitChars={goldPLText.length}>`. **Plan 6a** (`area-finance-logic#6`, copy "lãi 0 ₫ … nhờ giá vàng tăng" của gold-tab) giữ biến và prop này; nếu đổi value của Figure thành chuỗi thuần thì có thể bỏ `fitChars`.
- **Plan 6a** (`area-components-lib#12`, `formatMoney` bỏ phần lẻ): độ dài chuỗi đổi thì `--ob-figure-chars` tự đổi theo — không cần làm gì.

**`PillarCard`**
- Số tiền là chuỗi thuần (không còn `<span style>`); màu theo `tone` đặt trên div bọc `min-w-0 [container-type:inline-size]` quanh `Figure`. Mọi thay đổi sau phải giữ ô container riêng này (nếu không `cqi` lại đo cả Card).

**Sidebar**
- `<nav>`: `flex min-w-0 flex-1 items-center justify-around md:flex-none md:flex-col md:items-stretch md:justify-start md:gap-1` (không còn `gap-1` ở mobile).
- Mỗi `<Link>`: thêm `min-w-0 flex-auto ... md:flex-none`, đệm mobile `px-0.5` (thay `px-2`); nhãn `<span className="max-w-full truncate md:hidden lg:inline">`. **Plan 6b** (`area-shell-auth-calc#7`, link không có tên ở md): nếu đổi `md:hidden` → `md:sr-only lg:not-sr-only` hoặc thêm `aria-label` thì giữ `max-w-full truncate` và các class co giãn của Link; test "lets the 7 bottom-nav links shrink…" lấy nhãn bằng `link.querySelector("span")` — thêm span khác vào trước nhãn thì sửa test đó.
- `SidebarActionButton` variant `"icon"` có `size-[var(--ob-hit-min)] -my-[9px]` (vùng chạm 44px, thanh trên vẫn cao 47px); chữ "Orange Banana" ở thanh trên có `min-w-0 flex-1 truncate` và line-height 1.5 trong `[font:700_15px/1.5_var(--ob-font-display)]` (để vùng cắt của `truncate` không xén chân chữ "g"). **Plan 6a** (`area-shell-auth-calc#2`, hiện công cụ tiền khi bật bất kỳ module tiền nào): mỗi nút icon thêm vào thanh trên tốn 44px + 10px khe; sau 3 nút, ở 360px thanh trên chỉ còn ~25px dư.

**`Modal`**
- Panel có thêm `max-h-full overflow-y-auto overscroll-contain`: hộp cao hơn màn hình tự cuộn bên trong panel. Lớp phủ (`fixed inset-0 z-50 flex items-center justify-center p-4`) và nền mờ (`absolute inset-0`, bấm vào thì đóng) giữ nguyên. Panel là vùng cuộn nên nội dung đặt trong `Modal` không được có phần tử `absolute` tràn ra ngoài panel (sẽ bị cắt). **Plan 6b** (`area-components-lib#15` selector focus, `#14` `aria-describedby`) không đụng bố cục — giữ nguyên các class này.

**`StudySummarySection` (Tổng quan)**
- Lưới từ ôn: `grid grid-cols-2 gap-[10px] @xs:grid-cols-3 @md:grid-cols-4 @xl:grid-cols-5`; từ và nghĩa có `wrap-anywhere`; ảnh `imageSizes="(max-width: 639px) 45vw, 140px"`. **Plan 6b** (`area-overview-journal#15`, bỏ import sâu sang feature study) giữ nguyên các class này nếu di chuyển `VocabTeaserCard`.

**Quy ước mới**
- CLAUDE.md mục 4 có thêm 1 gạch đầu dòng: bố cục bên trong `Card` theo bề rộng Card bằng container query (`@xs:`/`@md:`/`@xl:` hoặc đơn vị `cqi`), không theo breakpoint màn hình (Task 6).

`MatchGame` (Task 7) và `SpellingGame` (Task 8) không plan nào sau đụng tới.

## Cấu trúc file

- Modify (component dùng chung): `src/components/ob/figure.tsx`, `src/components/ob/count-money.tsx`, `src/components/ui/modal.tsx`
- Modify (feature): `src/features/finance/components/gold-tab.tsx`, `src/features/finance/components/pillar-card.tsx`, `src/features/overview/components/study-summary-section.tsx`, `src/features/study/components/games/match-game.tsx`, `src/features/study/components/games/spelling-game.tsx`
- Modify (shell): `src/app/(app)/_components/sidebar.tsx`
- Modify (docs): `CLAUDE.md` (1 gạch đầu dòng ở mục 4)
- Create (test): `src/components/__tests__/ob/figure.test.tsx`
- Test sửa/thêm: `src/components/__tests__/ob/count-money.test.tsx`, `src/features/finance/__tests__/components/gold-tab.test.tsx`, `src/features/finance/__tests__/components/pillar-card.test.tsx`, `src/app/(app)/_components/__tests__/sidebar.test.tsx`, `src/components/__tests__/ui/modal.test.tsx`, `src/features/overview/__tests__/components/study-summary-section.test.tsx`, `src/features/study/__tests__/components/games/match-game.test.tsx`, `src/features/study/__tests__/components/games/spelling-game.test.tsx`

Mọi bước kiểm tay nằm ở Task 9, chạy sau khi Task 1–8 đã commit: bước A.1 xuất file JSON làm bản sao lưu trước khi thêm quỹ/thẻ thử với số tiền lớn, mục F xoá đúng 2 mục thử đó (file sao lưu chỉ dùng khi có gì lệch).

---
### Task 1: `Figure` co cỡ chữ theo độ dài số

Theo Quyết định 2 (phương án A).

**Files:**
- Modify: `src/components/ob/figure.tsx` (toàn bộ file)
- Modify: `src/components/ob/count-money.tsx` (hàm `CountMoney`)
- Modify: `src/features/finance/components/gold-tab.tsx` (1 biến mới cạnh `const gain = goldPL >= 0` + khối `<Figure>` trong Card "Lãi / lỗ theo giá thị trường")
- Create: `src/components/__tests__/ob/figure.test.tsx`
- Test: `src/components/__tests__/ob/count-money.test.tsx`, `src/features/finance/__tests__/components/gold-tab.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `FigureProps.fitChars?: number`; với `size="lg"` div giá trị mang biến CSS `--ob-figure-chars` (chuỗi số ký tự) khi đếm được; class cỡ chữ `text-[length:clamp(16px,min(13cqi,calc(100cqi/var(--ob-figure-chars,1)/0.6)),36px)]`. Task 2 dựa vào việc value là chuỗi thì tự đếm (không cần `fitChars`).

Cách tính: JetBrains Mono (`--ob-font-num`) mỗi ký tự rộng 0,6em, trừ tracking −0,02em còn 0,58em. Chia `100cqi` cho `số ký tự × 0,6` là cỡ lớn nhất để cả chuỗi còn nằm trọn 1 dòng trong container gần nhất (chừa ~3%). `min(13cqi, …)` giữ đúng cỡ cũ cho chuỗi ≤ 12 ký tự (100 / (12 × 0,6) ≈ 13,9cqi > 13cqi). Không có biến → `var(--ob-figure-chars,1)` = 1 → 166cqi → `min` chọn 13cqi như cũ. Sàn hạ từ 20px xuống 16px để số cực dài (≥ 17 ký tự) ở thẻ hẹp vẫn vừa; 13cqi chỉ dưới 20px khi container < 154px nên số ngắn không bị ảnh hưởng.

- [ ] **Step 1: Viết test thất bại**

1.1. Tạo `src/components/__tests__/ob/figure.test.tsx`:

```tsx
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { Figure } from "@/components/ob/figure"

describe("Figure", () => {
  it("passes a string value's length to the lg font size so a long amount shrinks to stay on one line", () => {
    render(<Figure value="1.234.567.890 ₫" />)

    const value = screen.getByText("1.234.567.890 ₫")
    // "1.234.567.890 ₫" = 15 ký tự.
    expect(value.style.getPropertyValue("--ob-figure-chars")).toBe("15")
    expect(value.className).toContain("var(--ob-figure-chars,1)")
    expect(value).toHaveClass("whitespace-nowrap")
  })

  it("counts the unit's characters as part of the line", () => {
    render(<Figure value="44.000.000" unit="đ" />)

    expect(screen.getByText("44.000.000").style.getPropertyValue("--ob-figure-chars")).toBe("11")
  })

  it("uses fitChars when the value is a node it cannot count", () => {
    render(<Figure value={<span>+ 1.000.000 ₫</span>} fitChars={13} />)

    const valueLine = screen.getByText("+ 1.000.000 ₫").parentElement as HTMLElement
    expect(valueLine.style.getPropertyValue("--ob-figure-chars")).toBe("13")
  })

  it("leaves the length unset for an uncountable node without fitChars, keeping the old 13cqi size", () => {
    render(<Figure value={<span>+ 1.000.000 ₫</span>} />)

    const valueLine = screen.getByText("+ 1.000.000 ₫").parentElement as HTMLElement
    expect(valueLine.style.getPropertyValue("--ob-figure-chars")).toBe("")
  })

  it("keeps the fixed token size for size='sm'", () => {
    render(<Figure value="3" unit="/5" size="sm" />)

    const value = screen.getByText("3")
    expect(value).toHaveClass("text-[length:var(--ob-size-num)]")
    expect(value.style.getPropertyValue("--ob-figure-chars")).toBe("")
  })
})
```

1.2. Trong `src/components/__tests__/ob/count-money.test.tsx`, thêm vào cuối `describe("CountMoney", ...)` (sau test `"renders the formatted money value once the animation settles"`; `render`, `act`, `screen`, `vi` đã import sẵn):

```tsx
  it("sizes the figure for the final amount from the first frame, so the text doesn't shrink while counting up", () => {
    render(<CountMoney value={1_234_567_890} />)

    // Đang đếm từ 0: chữ chỉ là "0 ₫" nhưng cỡ chữ đã tính cho "1.234.567.890 ₫" (15 ký tự) —
    // nếu đếm theo chuỗi đang hiện, chữ sẽ co nhỏ dần theo từng chữ số mới xuất hiện.
    expect(screen.getByText("0 ₫").style.getPropertyValue("--ob-figure-chars")).toBe("15")

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(screen.getByText("1.234.567.890 ₫").style.getPropertyValue("--ob-figure-chars")).toBe("15")
  })
```

1.3. Trong `src/features/finance/__tests__/components/gold-tab.test.tsx`, thêm vào cuối `describe("GoldTab", ...)` (dùng `HOLDING_SUMMARY`, `SJC`, `noopHandlers`, `formatMoney` có sẵn trong file):

```tsx
  it("sizes the P&L figure from the signed amount's length so a large gain stays inside the card", () => {
    render(
      <GoldTab
        summary={{ ...HOLDING_SUMMARY, goldPL: 1_234_567_890 }}
        stores={[SJC]}
        gold={[]}
        {...noopHandlers}
      />
    )

    // Value của Figure ở đây là <span> tô màu lãi/lỗ nên Figure không tự đếm được — GoldTab phải
    // truyền fitChars: "+ 1.234.567.890 ₫" = 17 ký tự.
    const amount = screen.getByText(`+ ${formatMoney(1_234_567_890)}`)
    expect(amount.parentElement?.style.getPropertyValue("--ob-figure-chars")).toBe("17")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/components/__tests__/ob/figure.test.tsx src/components/__tests__/ob/count-money.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx`
Expected: FAIL 5 test — 3 test đầu của `figure.test.tsx` (`expected '' to be '15'` / `'11'` / `'13'`), test mới của `CountMoney` (`expected '' to be '15'`) và test mới của `GoldTab` (`expected '' to be '17'`). 2 test cuối của `figure.test.tsx` PASS sẵn (khoá hành vi cũ: node không đếm được và size sm không có biến). Mọi test cũ của 2 file còn lại vẫn PASS.

- [ ] **Step 3: Viết code**

3.1. Thay toàn bộ nội dung `src/components/ob/figure.tsx` bằng:

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

interface FigureProps {
  value: React.ReactNode
  unit?: React.ReactNode
  delta?: React.ReactNode
  direction?: "up" | "down"
  caption?: React.ReactNode
  size?: "lg" | "sm"
  // Số ký tự của dòng số, để size="lg" co chữ cho vừa bề rộng khung. Bỏ trống thì tự đếm value +
  // unit khi là chuỗi/số; truyền tay khi value là 1 node (vd. <span> tô màu) hoặc khi value đổi
  // liên tục (CountMoney đếm dần — phải đếm theo số đích, không theo số đang hiện).
  fitChars?: number
  className?: string
}

// Mỗi ký tự JetBrains Mono (--ob-font-num) rộng 0,6em, trừ tracking -0,02em còn 0,58em: chia 100cqi
// cho (số ký tự × 0,6) là cỡ lớn nhất để cả dòng số còn nằm trọn 1 dòng trong container gần nhất
// (Card, hoặc ô riêng như ở PillarCard). 13cqi giữ nguyên cỡ cũ cho số ngắn (≤ 12 ký tự); chưa biết
// số ký tự thì biến rơi về 1 → chỉ còn 13cqi như trước.
const LG_FONT_SIZE = "text-[length:clamp(16px,min(13cqi,calc(100cqi/var(--ob-figure-chars,1)/0.6)),36px)]"

function textLength(node: React.ReactNode): number {
  return typeof node === "string" || typeof node === "number" ? String(node).length : 0
}

function Figure({
  value,
  unit,
  delta,
  direction = "up",
  caption,
  size = "lg",
  fitChars,
  className,
}: FigureProps) {
  const up = direction === "up"
  const chars = size === "lg" ? (fitChars ?? textLength(value) + textLength(unit)) : 0
  return (
    <div className={className}>
      <div
        className={cn(
          "[font-family:var(--ob-font-num)] font-bold leading-none tracking-[-0.02em] whitespace-nowrap tabular-nums",
          size === "lg" ? LG_FONT_SIZE : "text-[length:var(--ob-size-num)]"
        )}
        style={chars > 0 ? ({ "--ob-figure-chars": String(chars) } as React.CSSProperties) : undefined}
      >
        {value}
        {unit ? <span className="opacity-50">{unit}</span> : null}
      </div>
      {delta || caption ? (
        <div className="mt-[var(--ob-space-3)] flex items-center gap-[var(--ob-space-2)] text-[13.5px]">
          {delta ? (
            <span
              className={cn(
                "font-bold",
                up ? "text-[var(--ob-la-300)]" : "text-[var(--ob-do-300)]"
              )}
            >
              {up ? "▲" : "▼"} {delta}
            </span>
          ) : null}
          {caption ? <span className="opacity-[.72]">{caption}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { Figure }
export type { FigureProps }
```

3.2. Trong `src/components/ob/count-money.tsx`, thay hàm `CountMoney` (giữ nguyên `CountMoneyProps` — nó đã kế thừa `fitChars` từ `FigureProps`) bằng:

```tsx
function CountMoney({ value, fitChars, ...rest }: CountMoneyProps) {
  const { hidden } = useMoneyVisibility()
  // Cỡ chữ tính theo số ĐÍCH ngay từ khung đầu — nếu để Figure tự đếm chuỗi đang đếm dần, chữ sẽ co
  // nhỏ dần theo từng chữ số mới xuất hiện trong ~0,8s đầu.
  return (
    <Figure
      value={formatMoney(useCountUp(value), hidden)}
      fitChars={fitChars ?? formatMoney(value, hidden).length}
      {...rest}
    />
  )
}
```

3.3. Trong `src/features/finance/components/gold-tab.tsx`:

- Ngay sau dòng `const gain = goldPL >= 0` thêm:

```tsx
  const goldPLText = signedMoney(goldPL, hidden)
```

- Thay khối `<Figure ... />` trong Card "Lãi / lỗ theo giá thị trường" (khối đang có `{signedMoney(goldPL, hidden)}` trong `<span style={{ color: gain ? ... }}>`) bằng:

```tsx
            <Figure
              value={
                <span
                  style={{ color: gain ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                >
                  {goldPLText}
                </span>
              }
              fitChars={goldPLText.length}
              delta={pct1(goldPct)}
              direction={gain ? "up" : "down"}
            />
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/ob/figure.test.tsx src/components/__tests__/ob/count-money.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/components/__tests__/ob/net-worth-card.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx`
Expected: PASS toàn bộ (kể cả test cũ `"+ ${formatMoney(800_000)}"` của GoldTab và các test `CountMoney`/`NetWorthCard`/`FinanceView` đọc số tiền bằng `getByText`)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A** ở "Kiểm tra tay" của Task 9 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/components/ob/figure.tsx src/components/ob/count-money.tsx src/features/finance/components/gold-tab.tsx src/components/__tests__/ob/figure.test.tsx src/components/__tests__/ob/count-money.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx
git commit -m "fix: shrink large money figures to fit their card instead of overflowing"
```

---

### Task 2: Số tiền ở 4 thẻ trụ cột `/finance` co theo đúng cột của nó

Theo Quyết định 2 (phương án A), dùng cơ chế co chữ của Task 1.

**Files:**
- Modify: `src/features/finance/components/pillar-card.tsx` (khối `<Figure ... />` trong lưới `grid-cols-[auto_1fr]`)
- Test: `src/features/finance/__tests__/components/pillar-card.test.tsx`

**Interfaces:**
- Consumes: Task 1 — `Figure` size `lg` tự đếm `value` khi là chuỗi và đặt biến `--ob-figure-chars` trên div giá trị; cỡ chữ (`13cqi` và phần co theo số ký tự) đo theo container gần nhất.
- Produces: `PillarCard` giữ nguyên props (`icon`, `label`, `amount`, `hint`, `tone?`, `className?`). Số tiền là chuỗi thuần truyền thẳng vào `Figure`; màu theo `tone` đặt bằng `style.color` trên div bọc `min-w-0 [container-type:inline-size]` quanh `Figure`.

Lý do: `Card` đã là container (`[container-type:inline-size]` trong `cardVariants`), nên `cqi` của `Figure` hiện đo cả bề rộng nội dung Card (277px ở màn 360px), trong khi số chỉ có cột `1fr` bên phải icon 40px + khe 12px (225px). Bọc `Figure` trong 1 container riêng thì cả `13cqi` lẫn phần co theo số ký tự đều tính trên đúng 225px đó. Value phải là chuỗi (không bọc `<span>` tô màu) để `Figure` tự đếm — màu chuyển lên div bọc, chữ thừa hưởng.

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/finance/__tests__/components/pillar-card.test.tsx`, thêm vào cuối `describe("PillarCard", ...)` (`render`, `screen`, `formatMoney` đã import sẵn):

```tsx
  it("sizes a large amount from its own column next to the icon, so it stays inside the card", () => {
    render(
      <PillarCard icon="pig" label="Tiết kiệm" amount={1_234_567_890} hint="3 quỹ đang chạy" tone="income" />
    )

    // Số tiền là chuỗi thuần nên Figure tự đếm: "1.234.567.890 ₫" = 15 ký tự.
    const amount = screen.getByText(formatMoney(1_234_567_890))
    expect(amount.style.getPropertyValue("--ob-figure-chars")).toBe("15")
    // cqi của cỡ chữ phải đo đúng cột chứa số (hẹp hơn Card ~52px vì icon 40px + khe 12px): container
    // gần nhất là 1 ô riêng quanh Figure, không phải cả Card (<section>).
    const column = amount.closest("[class*='container-type:inline-size']") as HTMLElement
    expect(column).not.toBe(amount.closest("section"))
    expect(column).toHaveClass("min-w-0")
    expect(column).toHaveStyle({ color: "var(--ob-color-income)" })
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/components/pillar-card.test.tsx`
Expected: FAIL đúng test mới với `expected '' to be '15'` — value đang là `<span style={{ color }}>` nên `getByText` trả về span đó và `Figure` không đếm được (không có biến). 3 test cũ vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/features/finance/components/pillar-card.tsx`, thay khối

```tsx
        <Figure
          className="min-w-0"
          value={<span style={{ color: amountColor }}>{formatMoney(amount, hidden)}</span>}
        />
```

bằng

```tsx
        {/* Ô container riêng: cỡ chữ của Figure (đơn vị cqi) đo đúng cột này — đo cả Card thì số được
            tính cho bề rộng lớn hơn cột thật ~52px (icon + khe) và tràn khỏi thẻ. Số là chuỗi thuần
            (màu đặt ở ô này, chữ thừa hưởng) để Figure tự đếm ký tự mà co chữ khi số dài. */}
        <div className="min-w-0 [container-type:inline-size]" style={{ color: amountColor }}>
          <Figure value={formatMoney(amount, hidden)} />
        </div>
```

Giữ nguyên biến `amountColor`, icon và đoạn `<p className="col-start-2 ...">{hint}</p>` (vẫn nằm ở hàng 2, cột 2 của lưới).

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/components/pillar-card.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx`
Expected: PASS toàn bộ (kể cả "masks the amount when the sidebar's Ẩn số tiền toggle is on" — chuỗi "•••••••• ₫" giờ nằm thẳng trong div giá trị của `Figure`, `getByText` vẫn tìm thấy)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A** ở "Kiểm tra tay" của Task 9 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/features/finance/components/pillar-card.tsx src/features/finance/__tests__/components/pillar-card.test.tsx
git commit -m "fix: size pillar card amounts by their own column so they stay inside the card"
```

---

### Task 3: Thanh điều hướng dưới đủ 7 mục ở 360–430px

Theo Quyết định 1 (phương án A).

**Files:**
- Modify: `src/app/(app)/_components/sidebar.tsx` (khối `<nav>...</nav>` trong `<aside>`)
- Test: `src/app/(app)/_components/__tests__/sidebar.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `<nav>` có class `flex min-w-0 flex-1 items-center justify-around md:flex-none md:flex-col md:items-stretch md:justify-start md:gap-1`; mỗi `<Link>` có thêm `min-w-0 flex-auto` + `md:flex-none`, đệm ngang mobile `px-0.5` (thay `px-2`); nhãn là `<span>` đầu tiên trong Link, class `max-w-full truncate md:hidden lg:inline`. Task 4 sửa cùng file nhưng ở thanh trên, không đụng khối này.

Cách tính (số đo font thật của reviewer, Be Vietnam Pro 10.5px): 7 nhãn cộng lại ~306px; đệm `px-0.5` thêm 4px/mục → ~334px, không còn khe 4px giữa các mục; thanh có 352px ở màn 360px (aside đệm 4px mỗi bên) → dư ~18px nên không nhãn nào bị cắt trong dải 360–430px. `min-w-0` trên `<nav>` cho nó co về đúng bề rộng aside (hiện `min-width: auto` làm nav phình theo nội dung ~442px rồi tràn ra ngoài thanh `position: fixed`); `min-w-0 flex-auto` trên Link cho mục rộng theo nhãn nhưng co được; `max-w-full truncate` trên nhãn (Link là flex dọc `items-center`, nhãn không tự co theo Link) để máy hẹp hơn ~340px thì cắt "…" thay vì tràn. Từ `md` trở lên: `md:flex-none` trả Link về không co giãn, `md:px-[14px]` sẵn có đè `px-0.5`, `md:gap-1` giữ khe 4px giữa các mục của sidebar dọc như cũ.

- [ ] **Step 1: Viết test thất bại**

Trong `src/app/(app)/_components/__tests__/sidebar.test.tsx`, đổi dòng import `@testing-library/react` thành

```tsx
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
```

và thêm vào cuối `describe("Sidebar", ...)` (sau test "forgets the sync secret…" của Plan 1b):

```tsx
  it("lets the 7 bottom-nav links shrink to share a phone-width bar instead of pushing Cài đặt off screen", () => {
    render(<Sidebar />)

    // Thanh dưới là position: fixed nên phần tràn không cuộn tới được: nav phải co về đúng bề rộng
    // màn hình (min-w-0) và không chừa khe giữa các mục ở mobile.
    const nav = screen.getByRole("navigation")
    expect(nav).toHaveClass("min-w-0", "flex-1", "md:gap-1")
    expect(nav).not.toHaveClass("gap-1")

    const links = within(nav).getAllByRole("link")
    expect(links.map((link) => link.textContent)).toEqual([
      "Tổng quan",
      "Tài chính",
      "Chi tiêu",
      "Nhật ký",
      "Học tập",
      "Mục tiêu",
      "Cài đặt",
    ])
    for (const link of links) {
      // Mục rộng theo nhãn nhưng co được; từ md trở lên không co giãn như cũ.
      expect(link).toHaveClass("min-w-0", "flex-auto", "px-0.5", "md:flex-none")
      expect(link).not.toHaveClass("px-2")
      // Thiếu chỗ (máy < ~340px) thì nhãn cắt "…" trong mục của nó thay vì đẩy mục khác ra ngoài.
      expect(link.querySelector("span")).toHaveClass("max-w-full", "truncate")
    }
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx"`
Expected: FAIL đúng test mới ở assertion đầu: `Expected the element to have class: min-w-0 flex-1 md:gap-1` / `Received: flex flex-1 items-center justify-around gap-1 md:flex-none md:flex-col md:items-stretch md:justify-start`. Các test cũ (kể cả "forgets the sync secret…" của Plan 1b) vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/app/(app)/_components/sidebar.tsx`, thay toàn bộ khối từ `<nav className="flex flex-1 items-center justify-around gap-1 ...">` tới `</nav>` bằng (chỉ đổi class của `<nav>`, chuỗi class gốc của `<Link>` và class của nhãn; nhánh `active` giữ nguyên):

```tsx
        {/* Điện thoại: 7 mục chia nhau đúng bề rộng thanh — mục rộng theo nhãn nhưng co được (min-w-0
            flex-auto), đệm ngang 2px, không khe giữa các mục; thiếu chỗ thì nhãn cắt "…" thay vì đẩy
            "Cài đặt" ra ngoài thanh cố định (không cuộn tới được). Từ md trở lên giữ nguyên cột dọc. */}
        <nav className="flex min-w-0 flex-1 items-center justify-around md:flex-none md:flex-col md:items-stretch md:justify-start md:gap-1">
          {nav.map(({ label, href, icon: ItemIcon }) => {
            const active = pathname === href
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex min-h-[var(--ob-hit-min)] min-w-0 flex-auto flex-col items-center justify-center gap-0.5 rounded-[var(--ob-radius-md)] px-0.5 py-1.5 text-center text-[10.5px] leading-[var(--ob-lh-normal)] no-underline transition-[background-color,color] duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] md:flex-none md:flex-row md:justify-center md:gap-[11px] md:px-[14px] md:py-[11px] md:text-left md:text-[length:var(--ob-size-sm)] lg:justify-start",
                  active
                    ? "bg-[var(--ob-color-action-soft)] font-bold text-[var(--ob-color-action-strong)]"
                    : "font-medium text-[var(--ob-color-text-muted)] hover:bg-[var(--ob-color-action-soft)] hover:text-[var(--ob-color-action-strong)]"
                )}
              >
                <ItemIcon size={18} />
                <span className="max-w-full truncate md:hidden lg:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
```

Không đụng `<aside>` (khe `gap-1` của aside không có tác dụng ở mobile vì logo và cột chân đều `hidden` dưới `md`), `NAV`, `isModuleOn` hay `handleLogout` (giữ `clearSyncSecret()` của Plan 1b).

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx"`
Expected: PASS toàn bộ (kể cả "shows a Chi tiêu nav link pointing at /budget" — tên link vẫn là nhãn)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **B.1–B.3**, **B.5** ở "Kiểm tra tay" của Task 9 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add "src/app/(app)/_components/sidebar.tsx" "src/app/(app)/_components/__tests__/sidebar.test.tsx"
git commit -m "fix: let the mobile bottom nav fit all 7 items on phone widths"
```

---

### Task 4: Vùng chạm 44px cho 3 nút ở thanh trên điện thoại

**Files:**
- Modify: `src/app/(app)/_components/sidebar.tsx` (hàm `SidebarActionButton` + `<span>` chữ "Orange Banana" ở thanh trên — khối `<div className="fixed inset-x-0 top-0 ... md:hidden">`)
- Test: `src/app/(app)/_components/__tests__/sidebar.test.tsx`

**Interfaces:**
- Consumes: Task 3 đã sửa cùng file (khối `<nav>`) — không đụng lại.
- Produces: `SidebarActionButton` variant `"icon"` thêm `size-[var(--ob-hit-min)] -my-[9px]`; variant `"row"` không đổi. `<span>` chữ thương hiệu ở thanh trên: `min-w-0 flex-1 truncate [font:700_15px/1.5_var(--ob-font-display)] tracking-[-0.02em]`.

Cách tính: thanh trên cao theo logo 26px + đệm `py-2.5` (2 × 10px) + viền 1px = 47px. Nút 44px với margin dọc −9px chỉ chiếm 44 − 18 = 26px trong hàng (bằng logo) nên thanh vẫn cao 47px, vùng chạm phủ gần hết chiều cao thanh. 3 nút rộng thêm 3 × 26px; ở 360px phần còn lại cho chữ "Orange Banana" là 328 − 26 − 10 − 3 × (44 + 10) = 130px, chữ cần ~105px → vẫn đủ chữ. `min-w-0 truncate` để máy hẹp hơn ~340px cắt chữ thành "Orange Ba…" thay vì ép nút co lại/tràn (hiện `flex-1` không có `min-w-0` nên chữ không co được). `truncate` có `overflow: hidden`, mà line-height 1 (15px) thấp hơn vùng vẽ glyph của Bricolage Grotesque → chân chữ "g" bị xén; line-height 1.5 (22,5px, vẫn thấp hơn logo 26px) giữ nguyên chiều cao thanh và vị trí chữ (span căn giữa theo `items-center`).

- [ ] **Step 1: Viết test thất bại**

Trong `src/app/(app)/_components/__tests__/sidebar.test.tsx`, thêm vào cuối `describe("Sidebar", ...)` (sau test của Task 3):

```tsx
  it("gives the 3 mobile top-bar buttons a 44px touch target without making the bar taller", () => {
    render(<Sidebar />)

    for (const name of ["Máy tính", "Ẩn số tiền", "Đăng xuất"]) {
      // Nút đầu tiên trong DOM nằm ở thanh trên điện thoại; nút sau là dòng ở chân sidebar desktop.
      const [topBarButton, sidebarRow] = screen.getAllByRole("button", { name })
      // 44px (--ob-hit-min) thay vì đúng 18px của icon; margin âm dọc giữ thanh cao như cũ.
      expect(topBarButton).toHaveClass("size-[var(--ob-hit-min)]", "-my-[9px]")
      expect(sidebarRow).not.toHaveClass("size-[var(--ob-hit-min)]")
    }
    // 3 nút rộng hơn thì chữ thương hiệu nhường chỗ (cắt "…" ở máy rất hẹp) thay vì đẩy nút ra ngoài.
    const brand = screen.getAllByText("Orange")[0].parentElement as HTMLElement
    expect(brand).toHaveClass("min-w-0", "flex-1", "truncate")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx"`
Expected: FAIL đúng test mới: `Expected the element to have class: size-[var(--ob-hit-min)] -my-[9px]` / `Received: flex items-center justify-center transition-colors duration-[var(--ob-dur-fast)] text-[var(--ob-color-text-muted)] hover:text-[var(--ob-color-action-strong)]`. Các test cũ vẫn PASS.

- [ ] **Step 3: Viết code**

3.1. Trong `src/app/(app)/_components/sidebar.tsx`, hàm `SidebarActionButton`: thay

```tsx
      className={cn(
        "flex items-center justify-center transition-colors duration-[var(--ob-dur-fast)]",
        variant === "row" &&
```

bằng

```tsx
      className={cn(
        "flex items-center justify-center transition-colors duration-[var(--ob-dur-fast)]",
        // Thanh trên điện thoại: icon 18px nhưng vùng chạm đủ --ob-hit-min (44px), để không bấm trượt
        // sang nút bên cạnh (Đăng xuất không hỏi lại). Margin âm dọc trả hộp về đúng 26px như logo
        // nên thanh trên không cao thêm.
        variant === "icon" && "size-[var(--ob-hit-min)] -my-[9px]",
        variant === "row" &&
```

(phần còn lại của `cn(...)` — chuỗi class của `"row"` và `className` — giữ nguyên).

3.2. Trong khối thanh trên (`<div className="fixed inset-x-0 top-0 z-[9] flex items-center gap-[10px] ... md:hidden">`), thay dòng mở `<span>` của chữ thương hiệu

```tsx
        <span className="flex-1 [font:700_15px/1_var(--ob-font-display)] tracking-[-0.02em] whitespace-nowrap">
```

bằng

```tsx
        {/* min-w-0 + truncate: 3 nút 44px chiếm thêm chỗ — máy rất hẹp (< ~340px) thì chữ cắt "…" thay vì
            đẩy nút ra ngoài màn hình. line-height 1.5 (thay vì 1) để vùng cắt của truncate không xén chân
            chữ "g"; thanh vẫn cao theo logo 26px. */}
        <span className="min-w-0 flex-1 truncate [font:700_15px/1.5_var(--ob-font-display)] tracking-[-0.02em]">
```

Giữ nguyên 2 `<span>` con "Orange"/"Banana", các nút và chữ thương hiệu ở sidebar desktop (`hidden ... lg:inline` trong `<aside>`).

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx"`
Expected: PASS toàn bộ (kể cả "toggles Ẩn số tiền and persists the choice", "opens the calculator modal when Máy tính is clicked" và "forgets the sync secret…" — nút vẫn cùng tên, cùng thứ tự)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **B.4** ở "Kiểm tra tay" của Task 9 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add "src/app/(app)/_components/sidebar.tsx" "src/app/(app)/_components/__tests__/sidebar.test.tsx"
git commit -m "fix: give mobile top-bar icon buttons a 44px touch target"
```

---

### Task 5: Hộp thoại cao hơn màn hình tự cuộn bên trong

**Files:**
- Modify: `src/components/ui/modal.tsx` (chuỗi class gốc trong `cn(...)` của panel — `<div ref={panelRef} ...>`)
- Test: `src/components/__tests__/ui/modal.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `ModalProps` không đổi. Panel thêm `max-h-full overflow-y-auto overscroll-contain` (vẫn ghép `panelClassName`). Lớp phủ (`fixed inset-0 z-50 flex items-center justify-center p-4`) và nền mờ (`absolute inset-0 ...`, `data-testid={backdropTestId}`, bấm vào thì đóng) giữ nguyên. Mọi nơi dùng `Modal`/`AlertDialog` tự được sửa, không sửa file nào khác.

Cách hoạt động: lớp phủ cao đúng bằng màn hình (`fixed inset-0`), nên `max-h-full` giới hạn panel ở chiều cao màn hình trừ đệm 16px mỗi bên; nội dung cao hơn thì panel tự cuộn bên trong — mở ra thấy ngay tiêu đề, cuộn tới được "Huỷ"/"Lưu". Panel không bao giờ cao hơn lớp phủ nên `items-center` không còn đẩy phần trên ra ngoài; hộp thấp vẫn nằm giữa như cũ. Body đã bị khoá cuộn khi mở hộp; `overscroll-contain` để cuộn tới cuối hộp không kéo theo trang phía sau.

Không chọn cách cho cả lớp phủ cuộn (bỏ `items-center`, panel `m-auto`): nền mờ `absolute` sẽ trôi lên theo nội dung, để lộ 1 dải trang không mờ ở đáy khi cuộn; đổi nền mờ sang `fixed` thì Chrome/Firefox xâu chuỗi cuộn theo containing block — cuộn chuột/vuốt trên vùng mờ đi thẳng tới viewport (body đang `overflow: hidden`) nên không cuộn gì cả. Cuộn trong panel tránh được cả 2, giữ nguyên cấu trúc DOM (nền mờ vẫn là con của lớp phủ, lớp phủ là con trực tiếp của `body`) và chỉ đổi 1 chuỗi class. Panel thành vùng cuộn thì phần tử `absolute` bên trong tràn ra ngoài panel sẽ bị cắt — hiện không có (đã kiểm: mọi nội dung đặt trong `Modal` — `Field`, `Button`, `Input`, `FundPicker`, `TagPicker`, `GoldStorePicker` — không dùng `absolute`/`fixed`/portal/margin âm).

- [ ] **Step 1: Viết test thất bại**

Trong `src/components/__tests__/ui/modal.test.tsx`, thêm vào cuối `describe("Modal", ...)`:

```tsx
  it("scrolls a dialog taller than the screen inside its own panel instead of cutting off its title and buttons", () => {
    render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Xin chào</button>
      </Modal>
    )

    // Panel cao tối đa bằng lớp phủ (màn hình trừ đệm p-4) và tự cuộn khi nội dung cao hơn — không còn
    // tràn đều lên trên/xuống dưới ra ngoài 1 lớp phủ không cuộn được.
    expect(screen.getByRole("dialog", { name: "Test modal" })).toHaveClass(
      "max-h-full",
      "overflow-y-auto",
      "overscroll-contain"
    )
    // Lớp phủ và nền mờ giữ nguyên: cuộn cả lớp phủ sẽ làm nền mờ trôi đi (absolute) hoặc biến vùng mờ
    // thành chỗ cuộn không được (fixed).
    const backdrop = screen.getByTestId("modal-backdrop")
    expect(backdrop.parentElement).toHaveClass("fixed", "inset-0", "flex", "items-center", "justify-center", "p-4")
    expect(backdrop).toHaveClass("absolute", "inset-0")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/components/__tests__/ui/modal.test.tsx`
Expected: FAIL đúng test mới ở assertion đầu: `Expected the element to have class: max-h-full overflow-y-auto overscroll-contain` / `Received: relative w-full max-w-[400px] rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-6 shadow-[var(--ob-shadow-md)]`. Các test cũ vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/components/ui/modal.tsx`, ở panel (`<div ref={panelRef} role={role} ...>`), thay

```tsx
        className={cn(
          "relative w-full max-w-[400px] rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-6 shadow-[var(--ob-shadow-md)]",
          panelClassName
        )}
```

bằng

```tsx
        className={cn(
          // Cao tối đa bằng lớp phủ (màn hình trừ đệm p-4), nội dung cao hơn thì tự cuộn bên trong — điện
          // thoại xoay ngang/cửa sổ thấp vẫn thấy tiêu đề và tới được nút cuối. Cuộn trong hộp chứ không
          // cuộn cả lớp phủ, để nền mờ absolute vẫn phủ kín màn hình và cuộn được ở mọi chỗ trên hộp.
          "relative max-h-full w-full max-w-[400px] overflow-y-auto overscroll-contain rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-6 shadow-[var(--ob-shadow-md)]",
          panelClassName
        )}
```

Không đụng lớp phủ, nền mờ, `ref`, `role`, `aria-*`, `{children}` hay logic focus/khoá cuộn/Escape phía trên.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/ui/modal.test.tsx src/components/__tests__/ui/alert-dialog.test.tsx src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx src/features/finance/__tests__/components/adjust-savings-fund-modal.test.tsx`
Expected: PASS toàn bộ (kể cả "renders via a portal directly under document.body" ở 2 file đầu, "clicking the backdrop calls onOpenChange(false)" và test bấm `adjust-savings-fund-backdrop` — cấu trúc lớp phủ/nền mờ không đổi)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **C** ở "Kiểm tra tay" của Task 9 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/components/ui/modal.tsx src/components/__tests__/ui/modal.test.tsx
git commit -m "fix: let modals taller than the screen scroll inside their panel"
```

---

### Task 6: Lưới "Từ cần ôn hôm nay" ở Tổng quan theo bề rộng thẻ

**Files:**
- Modify: `src/features/overview/components/study-summary-section.tsx` (hàm `VocabTeaserCard` + `<div className="grid grid-cols-5 gap-[10px]">` trong Card "Từ cần ôn hôm nay")
- Modify: `CLAUDE.md` (mục 4, thêm 1 gạch đầu dòng)
- Test: `src/features/overview/__tests__/components/study-summary-section.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: lưới từ ôn `grid grid-cols-2 gap-[10px] @xs:grid-cols-3 @md:grid-cols-4 @xl:grid-cols-5`; div từ và div nghĩa trong `VocabTeaserCard` có `wrap-anywhere`; ảnh `imageSizes="(max-width: 639px) 45vw, 140px"`. Props của `StudySummarySection` không đổi.

Số cột theo bề rộng nội dung của Card (Card là container; nội dung = bề rộng Card − 2 × 24px đệm − 2 × 1,5px viền), không theo màn hình — cùng 1 màn hình, Card này có lúc chung hàng với "Nhiệm vụ hôm nay" (`flex-[0_1_280px]`), có lúc chiếm cả hàng:

| Màn hình | Nội dung Card | Cột | Mỗi ô |
|---|---|---|---|
| 360 | 277px | 2 | ~133px |
| 390 | 307px | 2 | ~148px |
| 430 | 347px | 3 (`@xs` ≥ 320px) | ~109px |
| 1024 (cạnh "Nhiệm vụ hôm nay") | 345px | 3 | ~108px |
| 1280 | 601px | 5 (`@xl` ≥ 576px) | ~112px |

Hiện là 5 cột cố định: ~47px/ô ở 360px (từ dài đè sang ô bên, nút loa 24px + dấu tích 16px che gần hết ảnh) và ~61px/ô ở 1024px. `wrap-anywhere` (không phải `break-words`) để 1 từ dài hơn cả ô (vd. "uncomfortable" ~95px khi ô chỉ ~85px) vẫn xuống dòng trong ô của nó. `imageSizes` cũ (`20vw` dưới 640px) xin ảnh ~72px cho ô ~133px — đổi sang `45vw` như các thẻ từ vựng ở trang Học tập.

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/overview/__tests__/components/study-summary-section.test.tsx`, thêm vào trong `describe("StudySummarySection", ...)`, ngay trước `describe("speak buttons on the due words", ...)` (`render`, `screen`, `vi`, `VOCAB`, `GRAMMAR`, `TASKS`, `DUE_WORDS` đã có sẵn):

```tsx
  it("fits the due-word grid to the card's own width, so long words wrap inside their tile on a phone", () => {
    const dueWords = [{ ...DUE_WORDS[0], image: "/assets/vocab/v-0010.jpg" }, ...DUE_WORDS.slice(1)]
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={vi.fn()}
        learned={[]}
        dueWords={dueWords}
      />
    )

    const word = screen.getByText(DUE_WORDS[0].word)
    const grid = word.closest(".grid") as HTMLElement
    // 2 cột khi Card hẹp (điện thoại), thêm cột theo bề rộng CARD — không cố định 5 cột.
    expect(grid).toHaveClass("grid-cols-2", "@xs:grid-cols-3", "@md:grid-cols-4", "@xl:grid-cols-5")
    expect(grid).not.toHaveClass("grid-cols-5")
    // @xs:/@md:/@xl: đo container gần nhất — phải là chính Card chứa lưới.
    expect(grid.closest("section")).toHaveClass("[container-type:inline-size]")
    // Từ/nghĩa dài xuống dòng trong ô của nó thay vì đè sang ô bên cạnh.
    expect(word).toHaveClass("wrap-anywhere")
    expect(screen.getByText(DUE_WORDS[0].meaning)).toHaveClass("wrap-anywhere")
    // Ảnh xin đủ nét cho ô ~45% bề rộng màn hình khi lưới 2 cột.
    expect(screen.getByAltText(DUE_WORDS[0].word)).toHaveAttribute("sizes", "(max-width: 639px) 45vw, 140px")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/components/study-summary-section.test.tsx`
Expected: FAIL đúng test mới: `Expected the element to have class: grid-cols-2 @xs:grid-cols-3 @md:grid-cols-4 @xl:grid-cols-5` / `Received: grid grid-cols-5 gap-[10px]`. Các test cũ vẫn PASS.

- [ ] **Step 3: Viết code**

3.1. Trong `src/features/overview/components/study-summary-section.tsx`, thay toàn bộ hàm `VocabTeaserCard` bằng (đổi `imageSizes` và thêm `wrap-anywhere` cho 2 div chữ; phần còn lại giữ nguyên):

```tsx
function VocabTeaserCard({ entry, learned }: { entry: VocabEntry; learned: boolean }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <ImageWithFallback
        src={entry.image}
        alt={entry.word}
        iconSize={18}
        imageSizes="(max-width: 639px) 45vw, 140px"
        className="overflow-hidden rounded-[var(--ob-radius-sm)]"
      >
        <SpeakButton word={entry.word} size="sm" className="absolute top-1 left-1" />
        {learned ? (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[var(--ob-color-income)] text-white">
            <Check size={10} />
          </span>
        ) : null}
      </ImageWithFallback>
      <div className="min-w-0">
        <div
          className={cn(
            "text-[12.5px] leading-[1.4] font-bold wrap-anywhere",
            learned ? "text-[var(--ob-color-text-subtle)] line-through" : "text-[var(--ob-color-text)]"
          )}
        >
          {entry.word}
        </div>
        <div className="text-[11px] leading-[1.4] text-[var(--ob-color-text-subtle)] wrap-anywhere">{entry.meaning}</div>
      </div>
    </div>
  )
}
```

3.2. Trong `StudySummarySection`, thay dòng

```tsx
          <div className="grid grid-cols-5 gap-[10px]">
```

bằng

```tsx
          {/* Số cột theo bề rộng Card (container query — Card là container), không theo màn hình: cùng 1
              màn hình, Card này có lúc chung hàng với "Nhiệm vụ hôm nay", có lúc chiếm cả hàng. */}
          <div className="grid grid-cols-2 gap-[10px] @xs:grid-cols-3 @md:grid-cols-4 @xl:grid-cols-5">
```

3.3. Trong `CLAUDE.md`, mục `## 4. Component Rules`, thêm ngay sau gạch đầu dòng "- Mọi `<button>` mặc định có `cursor: pointer` (...) — không cần set `cursor-pointer` tay ở từng component.":

```markdown
- `Card` là container (`[container-type:inline-size]` trong `cardVariants`): bố cục bên trong Card (số cột lưới, cỡ chữ) theo bề rộng của chính Card — biến thể container query `@xs:`/`@md:`/`@xl:` (bề rộng nội dung Card ≥ 320/448/576px) hoặc đơn vị `cqi` — thay vì breakpoint màn hình `sm:`/`md:`/`lg:`, vì cùng 1 màn hình 1 Card có lúc chung hàng với Card khác, có lúc chiếm cả hàng. Phần tử cần đo theo 1 vùng hẹp hơn Card (vd. cột số cạnh icon ở `PillarCard`) thì bọc trong 1 div `[container-type:inline-size]` riêng.
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/components/study-summary-section.test.tsx src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: PASS toàn bộ (kể cả "marks a learned word with a strikethrough and check icon" — div từ vẫn có `line-through`)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **D** ở "Kiểm tra tay" của Task 9 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/features/overview/components/study-summary-section.tsx src/features/overview/__tests__/components/study-summary-section.test.tsx CLAUDE.md
git commit -m "fix: size the overview due-word grid by its card width instead of a fixed 5 columns"
```

---

### Task 7: Bàn "Ghép cặp" 3 cột trên điện thoại, thẻ không cắt chữ

Theo Quyết định 3 (phương án A).

**Files:**
- Modify: `src/features/study/components/games/match-game.tsx` (lưới `<div className="grid grid-cols-4 gap-2.5">` + chuỗi class gốc của `<button>` thẻ)
- Test: `src/features/study/__tests__/components/games/match-game.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước. Plan 3 (`area-study#7`) đã đổi `buildCards` sang `pickMatchEntries` — task này không đụng `buildCards`, `handleFlip` hay state; chỉ đổi class của lưới và thẻ.
- Produces: lưới `grid grid-cols-3 gap-2.5 sm:grid-cols-4`; thẻ giữ `aspect-square`, bỏ `overflow-hidden`, thêm `wrap-anywhere`.

Cách tính: ở 360px bàn rộng 328px → 3 cột ~103px/thẻ, trong lòng ~84px (~11 ký tự × 5 dòng ở 13px `leading-tight`) thay vì 4 cột ~74px/thẻ, trong lòng ~55px (3 dòng × 7 ký tự). Bỏ `overflow-hidden` thì thẻ không còn là vùng cuộn, nên kích thước tối thiểu tự động theo `aspect-ratio` có hiệu lực: thẻ vuông, nhưng chữ dài hơn ô thì thẻ đó tự cao thêm thay vì bị cắt cả dòng trên lẫn dòng dưới. `wrap-anywhere` cho 1 từ dài hơn cả bề ngang thẻ (vd. "skateboarding") xuống dòng giữa từ — chữ nằm thẳng trong `<button>` flex nên phải là `anywhere` (cho phép co cả min-content), `break-words` không đủ. Từ 640px (`sm:`) trở lên giữ 4 cột như cũ (bàn tối đa 560px → ~132px/thẻ).

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/study/__tests__/components/games/match-game.test.tsx`, thêm vào cuối `describe("MatchGame", ...)` (`render`, `screen`, `vi`, `VOCAB` đã có sẵn):

```tsx
  it("lays the board out in 3 columns on phones and lets a long label grow its card instead of cutting it off", () => {
    render(<MatchGame vocab={VOCAB} onFinish={vi.fn()} />)

    const cards = screen.getAllByRole("button")
    const board = cards[0].parentElement as HTMLElement
    // 3 cột dưới 640px (thẻ ~100px ở 360px), 4 cột từ 640px như cũ.
    expect(board).toHaveClass("grid-cols-3", "sm:grid-cols-4")
    expect(board).not.toHaveClass("grid-cols-4")
    for (const card of cards) {
      // Vuông nhưng không cắt chữ: overflow-hidden làm thẻ cứng đúng hình vuông và xén nghĩa dài.
      expect(card).toHaveClass("aspect-square", "wrap-anywhere")
      expect(card).not.toHaveClass("overflow-hidden")
    }
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/study/__tests__/components/games/match-game.test.tsx`
Expected: FAIL đúng test mới: `Expected the element to have class: grid-cols-3 sm:grid-cols-4` / `Received: grid grid-cols-4 gap-2.5`. Các test cũ vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/features/study/components/games/match-game.tsx`:

3.1. Thay dòng

```tsx
      <div className="grid grid-cols-4 gap-2.5">
```

bằng

```tsx
      {/* 3 cột dưới 640px để thẻ đủ rộng cho nghĩa dài. Thẻ vuông nhưng không overflow-hidden: chữ dài
          hơn ô thì thẻ tự cao thêm (kích thước tối thiểu theo aspect-ratio) thay vì mất dòng trên/dưới. */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
```

3.2. Trong `cn(...)` của `<button>` thẻ, thay chuỗi class gốc

```tsx
                "flex aspect-square items-center justify-center overflow-hidden rounded-[var(--ob-radius-md)] border-[1.5px] p-2 text-center text-[13px] leading-tight font-bold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
```

bằng

```tsx
                "flex aspect-square items-center justify-center rounded-[var(--ob-radius-md)] border-[1.5px] p-2 text-center text-[13px] leading-tight font-bold wrap-anywhere transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
```

Giữ nguyên 2 nhánh màu `isMatched` phía sau, `key`, `data-vocab-id`, `disabled`, `onClick` và nội dung `{faceUp ? card.label : "?"}`.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/study/__tests__/components/games/match-game.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **E.1–E.2** ở "Kiểm tra tay" của Task 9 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/features/study/components/games/match-game.tsx src/features/study/__tests__/components/games/match-game.test.tsx
git commit -m "fix: use 3 columns for match cards on phones so long meanings stay readable"
```

---

### Task 8: Từ rơi ở "Gõ từ" luôn nằm trọn trong khu chơi

**Files:**
- Modify: `src/features/study/components/games/spelling-game.tsx` (thẻ mở `<span key={word.id} data-testid="falling-word" ...>` trong `round.fallingWords.map(...)`: object `style` và chuỗi class đầu tiên của `cn(...)`)
- Test: `src/features/study/__tests__/components/games/spelling-game.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước. Plan 3 (`area-study#5`) đã đổi cách nhập chữ (ô `<input aria-label="Gõ từ đang rơi">` dưới khu chơi, khu chơi `data-testid="spelling-area"` cao `h-[300px] sm:h-[460px]`) — task này chỉ đổi cách đặt từng từ theo chiều ngang, không đụng ô nhập, `queue`/`xPercent` (vẫn rút `8 + Math.random() * 84`), vòng lặp hay cách chấm điểm.
- Produces: mỗi `falling-word` có `style.left = "<xPercent>%"`, `style.transform = "translateX(-<xPercent>%)"` và class `w-max max-w-full` (bỏ `-translate-x-1/2`).

Cách tính: hiện tâm từ đặt ở `xPercent`% bề rộng khu chơi (`left` + `-translate-x-1/2`), nên cụm từ dài sinh gần mép trái lòi nửa đầu ra ngoài khu `overflow-hidden` — "tell someone to do something" (~257px) ở 8% mất ~49px khi khu chơi rộng 1000px, hơn 100px khi rộng 328px (điện thoại). Lùi lại đúng `xPercent`% bề rộng của chính từ (thay vì 50%): mép trái từ = `xPercent`% × (khu chơi − từ), luôn trong khoảng [0, khu chơi − từ], tức từ luôn nằm trọn. `w-max` giữ cụm từ trên 1 dòng (hộp định vị tuyệt đối gần mép phải hiện co lại và xuống dòng theo phần còn trống), `max-w-full` chặn hộp không bao giờ rộng hơn khu chơi (khi đó mới xuống dòng, và `translateX` vẫn đưa nó về trọn trong khu chơi). Từ ngắn vẫn rải khắp bề ngang như cũ.

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/study/__tests__/components/games/spelling-game.test.tsx`, thêm vào cuối `describe("SpellingGame", ...)` (`render`, `screen`, `act`, `vi`, `VOCAB` đã có sẵn; `beforeEach` đã bật `vi.useFakeTimers()`):

```tsx
  it("keeps a falling word inside the play area even when it spawns at the left edge", () => {
    // xPercent = 8 + 0 × 84 = 8 — sát mép trái nhất có thể. Chỉ khoá Math.random lúc render đầu (nơi
    // duy nhất rút xPercent, qua lazy initializer của useState), trả lại ngay sau đó.
    const random = vi.spyOn(Math, "random").mockReturnValue(0)
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)
    random.mockRestore()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const word = screen.getAllByTestId("falling-word")[0]
    // Lùi lại 8% bề rộng của chính từ (không phải 50% như căn giữa): mép trái từ = 8% × (khu chơi − từ) ≥ 0.
    expect(word.style.left).toBe("8%")
    expect(word.style.transform).toBe("translateX(-8%)")
    expect(word).not.toHaveClass("-translate-x-1/2")
    // Hộp ôm đúng 1 dòng chữ nhưng không bao giờ rộng hơn khu chơi.
    expect(word).toHaveClass("w-max", "max-w-full")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/study/__tests__/components/games/spelling-game.test.tsx`
Expected: FAIL đúng test mới ở `expect(word.style.transform).toBe("translateX(-8%)")` với `expected '' to be 'translateX(-8%)'` (`left` đã là `8%` sẵn). Các test cũ vẫn PASS.

- [ ] **Step 3: Viết code**

Trong `src/features/study/components/games/spelling-game.tsx`, trong khối `round.fallingWords.map(...)`, thay phần `style={{ ... }}` và chuỗi class đầu tiên của `cn(...)` ở `<span>` từ rơi:

```tsx
            <span
              key={word.id}
              data-testid="falling-word"
              style={{
                left: `${word.xPercent}%`,
                top: `${progress * 95}%`,
                backgroundColor: isDanger ? undefined : tint,
              }}
              className={cn(
                "absolute -translate-x-1/2 rounded-[var(--ob-radius-sm)] border-[1.5px] px-2.5 py-1 [font-family:var(--ob-font-num)] text-sm font-bold shadow-[var(--ob-shadow-sm)] transition-colors duration-[var(--ob-dur-base)]",
```

bằng

```tsx
            <span
              key={word.id}
              data-testid="falling-word"
              style={{
                // Đặt tại xPercent% khu chơi rồi lùi đúng xPercent% bề rộng của chính từ: mép trái từ =
                // xPercent% × (khu chơi − từ), nên cụm từ dài sinh sát mép vẫn nằm trọn trong khu chơi
                // (căn giữa bằng -translate-x-1/2 làm từ dài ở mép trái mất mấy chữ đầu).
                left: `${word.xPercent}%`,
                transform: `translateX(-${word.xPercent}%)`,
                top: `${progress * 95}%`,
                backgroundColor: isDanger ? undefined : tint,
              }}
              className={cn(
                "absolute w-max max-w-full rounded-[var(--ob-radius-sm)] border-[1.5px] px-2.5 py-1 [font-family:var(--ob-font-num)] text-sm font-bold shadow-[var(--ob-shadow-sm)] transition-colors duration-[var(--ob-dur-base)]",
```

Giữ nguyên các biến `progress`/`isMatching`/`isDanger`/`typedLen`/`tint`, nhánh màu viền phía sau trong `cn(...)`, 2 `<span>` con và mọi thứ Plan 3 đã đổi quanh khối này. Nếu Plan 3 đã thêm thuộc tính khác vào `style` hay chuỗi class này thì giữ chúng — chỉ thêm `transform`, đổi `-translate-x-1/2` thành `w-max max-w-full`.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/study/__tests__/components/games/spelling-game.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **E.3** ở "Kiểm tra tay" của Task 9 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/features/study/components/games/spelling-game.tsx src/features/study/__tests__/components/games/spelling-game.test.tsx
git commit -m "fix: keep long falling words inside the spelling area"
```

---

### Task 9: Checkpoint — tsc, lint, toàn bộ test, kiểm tra tay

**Files:** không sửa file nào (nếu 1 bước dưới đây fail, sửa ở đúng task gây ra, commit vào nhánh này rồi chạy lại từ đầu task này).

**Interfaces:**
- Consumes: toàn bộ Task 1–8.
- Produces: nhánh `fix/mobile-layout` sẵn sàng để chủ repo duyệt merge vào `developer`.

- [ ] **Step 1: Kiểm tra kiểu**

Run: `npx tsc --noEmit`
Expected: không có lỗi (đặc biệt: `fitChars` có trong `FigureProps` nên `CountMoneyProps` kế thừa được; object `style` có `--ob-figure-chars` ép kiểu `React.CSSProperties` như `sonner.tsx`)

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: sạch, không error/warning mới

- [ ] **Step 3: Toàn bộ test suite**

Run: `npm run test`
Expected: PASS toàn bộ (mọi file cũ + 14 test mới của plan này: 5 `figure`, 1 `count-money`, 1 `gold-tab`, 1 `pillar-card`, 2 `sidebar`, 1 `modal`, 1 `study-summary-section`, 1 `match-game`, 1 `spelling-game`)

- [ ] **Step 4: Kiểm tra tay**

Chạy `npm run dev`, mở app trong Chrome, đăng nhập bằng mock account, rồi chạy hết các mục dưới đây trên bản cuối của nhánh (cách đo chung ở Global Constraints: device toolbar → "Responsive" → bề rộng × 800 trừ khi mục ghi khác; "không tràn ngang" = Console `document.documentElement.scrollWidth - innerWidth` ra `0`).

### Kiểm tra tay

**A. Số tiền lớn nằm trọn trong thẻ (Task 1, 2)**

- [ ] A.1 Cài đặt → "Xuất file JSON" — bản sao lưu phòng khi cần (mục F chỉ xoá đúng 2 mục thử thêm ở A.2).
- [ ] A.2 `/finance` → tab "Tiết kiệm" → "Thêm quỹ tiết kiệm": "Tên quỹ" `Quỹ thử số lớn`, "Số tiền hiện có" `12500000000` (12,5 tỷ), "Mục tiêu" `20000000000` → "Thêm". Tab "Nợ thẻ tín dụng" → "Thêm thẻ tín dụng": "Tên thẻ" `Thẻ thử lớn`, "Dư nợ hiện tại" `1234567890` (1,23 tỷ), "Số tiền tối thiểu" `1000000`, "Hạn mức" `2000000000`, "Ngày đến hạn" `15/10` → "Thêm". (Dư nợ nhỏ hơn quỹ để "Tài sản ròng" vẫn dương, ~11 tỷ = 16 ký tự.)
- [ ] A.3 Bề rộng **360**, `/finance`: thẻ tối "Tài sản ròng" — số ~11 tỷ nằm trọn 1 dòng trong thẻ, không chạm viền phải; Inspect số đó → tab Computed → `font-size` ~28–30px (không còn 36px). 4 thẻ trụ cột: số ở "Tiết kiệm" (~12,5 tỷ) và "Nợ thẻ tín dụng" (~1,23 tỷ) nằm trọn bên phải icon, trong viền thẻ; số ngắn ở "Tích lũy vàng"/"Đầu tư" vẫn 1 dòng, cỡ ~29px (nhỏ hơn trước — đúng Quyết định 2). Tab "Nợ thẻ tín dụng": "1.234.567.890 ₫" của "Thẻ thử lớn" nằm trọn trong thẻ (`font-size` ~30–31px). Không tràn ngang.
- [ ] A.4 Lặp A.3 ở **390** và **430**: như trên; chữ lớn dần theo bề rộng, tối đa 36px; không tràn ngang.
- [ ] A.5 `/overview` ở **360**: thẻ "Tài sản ròng" khi vừa vào trang đếm dần từ 0 lên — cỡ chữ đứng yên suốt lúc đếm (không co nhỏ dần theo từng chữ số), số cuối nằm trọn trong thẻ; "Chi tiêu tháng này" (số ngắn) giữ cỡ như trước.
- [ ] A.6 Bề rộng **1280**, `/finance`: "Tài sản ròng" và 4 thẻ trụ cột đều 1 dòng trong thẻ, không số nào lấn sang thẻ bên cạnh; "Tài sản ròng" vẫn 1 dòng ở `/overview`.

**B. Thanh điều hướng dưới và thanh trên (Task 3, 4)** — đang tắt module nào ở Cài đặt → "Module hiển thị" thì tạm bật lại cho đủ 7 mục, xong trả như cũ.

- [ ] B.1 Bề rộng **360**: thanh dưới đủ 7 mục Tổng quan, Tài chính, Chi tiêu, Nhật ký, Học tập, Mục tiêu, Cài đặt — nhãn đủ chữ (không "…"), không mục nào lòi ra ngoài. Console `document.querySelector('nav a[href="/settings"]').getBoundingClientRect().right <= innerWidth` ra `true`. Chạm "Cài đặt" → sang trang Cài đặt, mục đó được tô nền cam nhạt; chạm lại "Tổng quan" → về Tổng quan.
- [ ] B.2 Lặp B.1 ở **390** và **430**: đủ 7 mục, đủ chữ, các mục giãn đều ra.
- [ ] B.3 (hẹp hơn dải mục tiêu) **320**: vẫn đủ 7 mục trong màn hình; nhãn dài nhất có thể thành "Tổng q…" — chấp nhận được.
- [ ] B.4 Thanh trên ở **360**: 3 nút Máy tính / Ẩn số tiền / Đăng xuất cách nhau rộng hơn trước; Inspect từng nút → hộp 44 × 44; Inspect cả thanh (`div` cố định ở đỉnh) → cao 47px như trước; chữ "Orange Banana" đủ chữ, chân chữ "g" không bị xén. Chạm nút mắt → số tiền ẩn/hiện, không bị đăng xuất; chạm nút máy tính → mở máy tính, đóng lại. Lặp ở **390**, **430**. Ở **320**: chữ có thể thành "Orange Ba…", 3 nút vẫn trọn trong màn hình.
- [ ] B.5 Bề rộng **800** (sidebar dọc 76px, chỉ icon) và **1280** (sidebar 248px, icon + nhãn): sidebar như trước — các mục xếp dọc, cách nhau 4px, nhãn đủ chữ ở 1280, mục đang chọn tô nền; không có thanh trên/thanh dưới.

**C. Hộp thoại cao hơn màn hình (Task 5)**

- [ ] C.1 Device toolbar **740 × 360** (điện thoại xoay ngang). `/finance` → tab "Nợ thẻ tín dụng" → nút sửa của "Thẻ thử lớn" (tên "Sửa thẻ Thẻ thử lớn") → hộp "Sửa thẻ tín dụng" nằm gọn trong màn hình (cách mép trên/dưới ~16px), thấy ngay tiêu đề. Lăn chuột/kéo trên hộp → nội dung hộp cuộn xuống tới "Huỷ"/"Lưu". Đổi "Số tiền tối thiểu" thành `2000000` → "Lưu" → hộp đóng, thẻ hiện "2.000.000 ₫" ở dòng "Trả tối thiểu".
- [ ] C.2 Vẫn 740 × 360: mở lại hộp, cuộn tới cuối rồi lăn tiếp → trang phía sau không cuộn theo; vùng mờ vẫn phủ kín màn hình. Bấm vào vùng mờ ngoài hộp → hộp đóng; mở lại, bấm Esc → đóng.
- [ ] C.3 **390 × 800**: hộp "Sửa thẻ tín dụng" nằm giữa màn hình như trước → "Huỷ". Nút "Xoá thẻ Thẻ thử lớn" → hộp "Xoá thẻ tín dụng?" nằm giữa màn hình → "Huỷ".

**D. Lưới "Từ cần ôn hôm nay" ở Tổng quan (Task 6)** — cần module "Học tập" bật và còn từ tới hạn (header "Học tập" ở Tổng quan ghi "N từ cần ôn", N > 0).

- [ ] D.1 Bề rộng **360**, `/overview`: card "Từ cần ôn hôm nay" có 2 cột (5 từ → 3 hàng); chữ từ và nghĩa nằm trong ô của nó, từ dài xuống dòng chứ không đè sang ô bên; nút loa và dấu tích (từ đã học) chỉ chiếm góc ảnh; ảnh nét. Không tràn ngang.
- [ ] D.2 **390**: 2 cột. **430**: 3 cột.
- [ ] D.3 **1024**: card nằm cạnh "Nhiệm vụ hôm nay", 3 cột (hàng 3 + hàng 2) thay vì 5 cột chật. **1280**: 5 cột, 1 hàng như trước.

**E. Trò chơi (Task 7, 8)**

- [ ] E.1 Bề rộng **360**: `/study` → tab "Trò chơi" → "Ghép cặp": bàn 3 cột × 4 hàng, thẻ vuông (~100px). Lật vài cặp: chữ trên thẻ đang ngửa đọc được trọn, không mất dòng trên/dưới; thẻ có nghĩa rất dài (nếu gặp) cao hơn thẻ bên cạnh thay vì cắt chữ. Không tràn ngang. Lặp 1 ván ở **430**.
- [ ] E.2 Bề rộng **800**: bàn 4 cột như trước.
- [ ] E.3 Bề rộng **360**: "Trò chơi" → "Gõ từ": suốt ván, mọi từ đang rơi nằm trọn trong khu chơi — không mất chữ đầu ở mép trái, không lòi ra mép phải. Lúc đang có 2–3 từ rơi, Console chạy

```js
[...document.querySelectorAll('[data-testid="falling-word"]')].map((w) => { const r = w.getBoundingClientRect(), a = w.offsetParent.getBoundingClientRect(); return [w.textContent, Math.round(r.left - a.left), Math.round(a.right - r.right)] })
```

→ với mọi từ, 2 số sau đều ≥ 0. Chạy lại vài lần trong ván, rồi 1 ván ở **1280** (tắt device toolbar).

**F. Dọn dữ liệu thử**

- [ ] F.1 `/finance` → tab "Tiết kiệm" → nút "Xoá Quỹ thử số lớn" → "Xoá"; tab "Nợ thẻ tín dụng" → "Xoá thẻ Thẻ thử lớn" → "Xoá". "Tài sản ròng" và 4 thẻ trụ cột về đúng số trước A.2. Nếu có gì lệch: Cài đặt → "Nhập từ file" → chọn file đã xuất ở A.1 → "Thay dữ liệu".

- [ ] **Step 5: Báo lại để duyệt**

Báo chủ repo: kết quả Step 1–3, kết quả từng mục Kiểm tra tay, danh sách commit trên `fix/mobile-layout`. Chỉ merge vào `developer` khi chủ repo duyệt (CLAUDE.md mục 5). Không `git push` nếu chủ repo chưa yêu cầu.
