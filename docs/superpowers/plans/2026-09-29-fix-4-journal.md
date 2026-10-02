# Nhật ký (phần 4 sửa lỗi review 2026-09-29) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Nhánh:** `fix/journal-review-fixes` (tách từ `developer` sau khi phần trước đã merge — phần trước là Plan 3 `docs/superpowers/plans/2026-09-29-fix-3-study.md`; trước nữa là Plan 2, 1b, 1a).

**Goal:** Không còn đường nào làm mất chữ đang viết trong trang Nhật ký (ghi lỗi, bấm Sửa giữa chừng, xoá đúng bài đang sửa); xoá bài phải xác nhận; bản xem trước hiện đúng chữ (xuống dòng, `&`, `<`, dấu cách đôi) thay vì `&amp;`/`&lt;`/`&nbsp;` dính liền nhau; bài của năm khác có năm; chỉ sửa chữ thì không làm rơi hay đổi mood đã lưu; "ngày này năm xưa" không gán nhầm "1 tháng trước" vào cuối tháng; chip mood báo trạng thái chọn cho trình đọc màn hình.

**Architecture:** `stripHtmlToPlainText` lọc bằng DOMPurify với đúng allowlist của `sanitizeJournalHtml` nhưng `RETURN_DOM: true`, rồi tự đi cây DOM (nằm trong document riêng của DOMPurify, không gắn vào trang) để lấy chữ: text node đã giải mã entity sẵn, ranh giới thẻ khối và `<br>` thành `\n`; kết quả chỉ được render như text React. `useJournal.updateEntry`/`deleteEntry` trả `boolean` (`updateEntry` kiểm id trên bản đọc tươi `getStoredJournal()` của Plan 1a); `JournalEditor.onSave` trả `boolean` và khung soạn chỉ bị xoá khi `true`. `JournalView` ghi nội dung khung soạn bài mới (báo qua `onDraftChange`) vào 1 ref — không render lại cả trang mỗi phím gõ — rồi cất nó cùng mood đang chọn vào state lúc bấm Sửa, trả lại khi Huỷ sửa/Cập nhật xong, hỏi lại khi đổi từ bài đang sửa dở sang bài khác, và rời chế độ sửa khi xoá đúng bài đó. `JournalEntriesCard` xoá qua `AlertDialog` có sẵn; ngày hiển thị qua hàm mới `formatShortDate` trong `src/lib/date.ts`. `MoodPickerCard` nhận `entryMood` để vẫn hiện chip mood đã tắt/xoá của bài đang sửa; `JournalView` giữ nguyên snapshot mood đã lưu khi vẫn chọn đúng mood đó.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript, DOMPurify 3, Vitest + React Testing Library (jsdom) — không thêm dependency nào.

**Spec:** Không có spec riêng — nguồn là 11 phát hiện review đã được kiểm chứng đối kháng (2026-09-29), liệt kê đủ ở mục `## Phạm vi` bên dưới.

## Global Constraints

- Nhánh `fix/journal-review-fixes` tách từ `developer` **sau khi** nhánh của Plan 3 (và 2, 1b, 1a trước đó) đã merge. 1 commit/task, message theo CLAUDE.md (`fix:` / `change:` / `chore:` ...) cộng dòng attribution mà phiên thực thi yêu cầu. Trước mỗi commit tự review `git diff` của task (CLAUDE.md mục 6). Không commit thẳng lên `developer`/`main`, không `git push` khi chủ repo chưa yêu cầu.
- Không thêm dependency. Plan không dùng API Next.js nào; nếu buộc phải đụng tới, đọc `node_modules/next/dist/docs/` trước (Next 16 có breaking changes).
- Giữ nguyên các quyết định có chủ đích: AutoBackup vẫn không mount; mock login giữ nguyên; `EXPORT_VERSION` giữ `1`; `Expense.tag` vẫn là snapshot đóng băng; số còn phải tất toán của tháng vẫn tính lại, không khoá; `/sandbox` không đụng.
- **Plan 1a và 1b đã merge trước:** trước khi sửa 1 file, đọc lại TOÀN BỘ file đó. Giữ nguyên mọi thứ 1a/1b đã thêm: `useStorageSync(JOURNAL_STORAGE_KEY, reload)` và mọi mutation của `useJournal` mở đầu bằng `const current = getStoredJournal()` (đọc tươi, deps `[persist]`); `parseJournalState` của `journal-storage.ts` không đổi (plan này không thêm field nào vào `JournalEntry`/schema).
- Không đổi dữ liệu lưu trữ: không thêm key localStorage/sessionStorage mới (bản nháp chỉ sống trong bộ nhớ của trang — state + ref của `JournalView`), không đổi shape `JournalEntry`/`MoodSnapshot`.
- An toàn HTML: kết quả `stripHtmlToPlainText` chỉ được render như text con của React (tự escape), không bao giờ qua `innerHTML`/`dangerouslySetInnerHTML`; hàm dùng đúng allowlist `ALLOWED_TAGS` + `ALLOWED_ATTR: []` + `ALLOW_DATA_ATTR: false` + `ALLOW_ARIA_ATTR: false` như `sanitizeJournalHtml`. `sanitizeJournalHtml` không đổi.
- Tên file/biến/test tiếng Anh; chữ hiển thị cho người dùng tiếng Việt, đúng nguyên văn trong plan.
- Test đặt trong `__tests__/` mirror cấu trúc, theo đúng pattern file bên cạnh: hook test giữ `vi.mock("sonner", ...)` + `vi.useFakeTimers({ shouldAdvanceTime: true })`; test nào phụ thuộc "hôm nay"/"năm nay" thì ghim bằng `vi.setSystemTime(...)`; lỗi ghi storage mô phỏng bằng `vi.spyOn(Storage.prototype, "setItem")`. jsdom không có `innerText` thật: `typeInto` gán cả `innerHTML` lẫn `innerText`; editor vừa remount chỉ có `innerHTML` nên test kiểm `innerHTML`/`toHaveTextContent`, không kiểm `innerText`.
- Lint của repo bật các rule React Compiler (`react-hooks/refs`, `react-hooks/purity`, `react-hooks/set-state-in-effect`): không đọc/ghi `ref.current` và không gọi `Date.now()` trong lúc render — ref chỉ được đụng tới trong hàm xử lý sự kiện (kể cả callback truyền xuống component con như `onDraftChange`) hoặc effect.
- Chạy từng file test bằng `npx vitest run <path>`; full suite, lint, tsc chỉ ở Task 10.
- Mỗi task commit ngay khi test của task đã xanh và đã tự review diff — **không dừng giữa plan** để chờ chủ repo. Mọi bước bấm thử bằng tay gom vào `### Kiểm tra tay` của Task 10 (chạy sau `npx tsc --noEmit`, `npm run lint`, `npm run test`). Nhánh chỉ merge vào `developer` sau khi chủ repo chạy xong danh sách đó và duyệt.

## Quyết định cần duyệt

### 1. Đang viết dở bài mới mà bấm Sửa 1 bài cũ

Hiện khung soạn remount (key đổi từ `"new"` sang id bài cũ) nên bản nháp bài mới và mood đang chọn biến mất không báo; "Huỷ sửa" trả về 1 khung trống. Tương tự, đang sửa dở bài A mà bấm Sửa bài B thì thay đổi của A mất.

- **A. Hỏi lại trước khi bỏ** — khung soạn có chữ chưa lưu (bài mới, hoặc bài đang sửa đã gõ) mà bấm Sửa bài khác → hộp "Bỏ nội dung đang viết dở?". Không mất gì âm thầm, nhưng muốn sửa 1 lỗi chính tả ở bài cũ giữa chừng thì phải chọn: lưu dở bài mới, hoặc bỏ nó.
- **B. Giữ bản nháp bài mới và trả lại** — bấm Sửa thì chữ + số từ + mood đang chọn của bài mới được cất trong state của trang; "Huỷ sửa" hoặc "Cập nhật" xong là khung soạn hiện lại đúng bản nháp đó. Riêng lúc đang sửa bài A **đã gõ hoặc đổi mood** mà bấm Sửa bài B → hỏi "Bỏ thay đổi chưa lưu?" (thay đổi của 1 bài cũ không có chỗ cất hợp lý; A chưa đổi gì thì chuyển thẳng). Nháp mất khi tải lại trang hoặc rời trang, như hiện nay.
- **C. Như B + lưu nháp vào localStorage** — sống qua cả tải lại trang/đóng tab, nhưng thêm 1 key lưu trữ mới phải tính tới xuất/nhập file, tải lên/tải xuống, xoá toàn bộ dữ liệu và đồng bộ tab (hợp đồng của 1a/1b) — vượt phạm vi lỗi.
- **Khuyên dùng: B** — vì đúng kịch bản của lỗi (đang viết dở, bấm Sửa để sửa lỗi chính tả bài cũ) không mất chữ và không thêm cú bấm nào; hộp hỏi lại chỉ hiện ở ca hiếm là đổi từ bài đang sửa dở sang bài khác. Plan làm B (Task 9). Chọn A hoặc C thì Task 9 phải viết lại — báo lại trước khi làm.

### 2. Chống xoá nhầm bài nhật ký

Nút thùng rác 44px nằm cách nút bút chì 4px; 1 lần chạm là xoá hẳn và ghi ngay xuống máy (toast "Đã xoá bài viết", không hoàn tác). Bài nhật ký là dữ liệu không viết lại được; cách lấy lại duy nhất là nạp 1 bản sao cũ — thay cả toàn bộ dữ liệu khác.

- **A. Hộp xác nhận như trang Tài chính** — "Xoá bài nhật ký?" kèm giờ + ngày của bài; thêm 1 cú bấm mỗi lần xoá.
- **B. Xoá ngay + nút "Hoàn tác" trong toast** — không thêm cú bấm, nhưng toast tự tắt sau vài giây; cần thêm hàm khôi phục bài (đúng id, đúng vị trí) vào `useJournal`.
- **C. Giữ nguyên, chỉ sửa tên nút cho trình đọc màn hình.**
- **Khuyên dùng: A** — vì giống hệt cách xoá ở mọi tab Tài chính và khoản chi ở Plan 2 (Quyết định 3 của Plan 2 cũng chọn A — 2 chỗ nên cùng 1 cách), dùng lại `AlertDialog` sẵn có, và xoá bài nhật ký là việc hiếm. Plan làm A (Task 7). Chọn B thì Task 7 phải viết lại — báo lại trước khi làm; chọn C thì ở Task 7 chỉ giữ phần `aria-label` và phần rời chế độ sửa khi xoá đúng bài đang sửa.

### 3. Ngày của bài viết hiện năm thế nào

`entry.date` chỉ lưu `dd/mm`. Sau 1 năm dùng, danh sách (và tên nút Sửa/Xoá, và "Bài gần đây" ở Tổng quan) hiện `29/09 · 08:30` cho cả bài 29/09/2025 lẫn 29/09/2026. Timestamp thật vẫn có trong `entry.id`.

- **A. Chỉ thêm năm khi bài thuộc năm khác năm hiện tại** — bài năm nay giữ `29/09` gọn như cũ, bài năm trước thành `29/09/2025`.
- **B. Luôn hiện `dd/mm/yyyy`** — đồng nhất nhưng dài thêm 5 ký tự ở mọi dòng, kể cả những dòng không cần.
- **C. Chia danh sách theo tiêu đề năm** — đẹp khi có nhiều năm, nhưng đổi bố cục danh sách; không giúp tên nút Sửa/Xoá và "Bài gần đây".
- **Khuyên dùng: A** — vì năm nay (phần lớn thời gian dùng) nhìn y như cũ, mà 2 bài cùng ngày khác năm vẫn phân biệt được ở cả danh sách, tên nút và Tổng quan. Plan làm A (Task 6). Chọn B thì ở Task 6 thân `formatShortDate` luôn trả `dd/mm/yyyy` và mọi chuỗi ngày mong đợi trong test của Task 5–9 (vd. `"Sửa bài 28/09 20:00"` → `"Sửa bài 28/09/2026 20:00"`) đổi theo; chọn C thì Task 6 phải viết lại — báo lại trước khi làm.

Các lựa chọn còn lại không có đánh đổi nào đáng hỏi — plan làm thẳng: mốc "1 tháng trước"/"1 năm trước" rơi vào ngày không có thật (31/03 lùi 1 tháng, 29/02 lùi 1 năm) thì bỏ mốc đó thay vì dồn về cuối tháng (dồn về thì bài cuối tháng hiện lại 3–4 ngày liền; bỏ thì mỗi bài vẫn có đúng ngày kỷ niệm cùng số ngày); mood của bài đang sửa giữ nguyên snapshot đã lưu (đúng tinh thần "snapshot đóng băng" như `Expense.tag`); bài bị xoá ở tab khác trong lúc đang sửa thì "Cập nhật" báo lỗi và giữ chữ trong khung soạn (không tự lưu thành 1 bài mới mang ngày hôm nay).

## Phạm vi

| Phát hiện | Mô tả | Sửa ở |
|---|---|---|
| `area-overview-journal#1` | Lưu/cập nhật ghi lỗi (bộ nhớ đầy, bị chặn) vẫn xoá sạch khung soạn — toast bảo "thử lại" nhưng không còn gì để thử; ở chế độ sửa thì còn rời luôn chế độ sửa | Task 4 (hook báo `boolean`), Task 5 (khung soạn chỉ xoá khi đã ghi được) |
| `area-overview-journal#2` | Xoá bài nhật ký chỉ 1 chạm, không xác nhận, không hoàn tác; mọi nút xoá cùng tên "Xoá bài" | Task 7 (theo Quyết định 2) |
| `area-overview-journal#3` | Bản xem trước (thu gọn ở danh sách, "Bài gần đây" ở Tổng quan) dính liền các dòng và hiện nguyên `&amp;`/`&lt;`/`&nbsp;`; ngưỡng cắt 180 ký tự đếm cả ký tự escape | Task 1 |
| `lens-security#2` | Cùng gốc với `#3`: `stripHtmlToPlainText` trả chuỗi HTML đã escape chứ không phải chữ | Task 1 |
| `area-overview-journal#4` | Đang viết dở bài mới mà bấm Sửa bài cũ thì mất bản nháp và mood đã chọn; đang sửa dở bài A mà bấm Sửa bài B thì mất thay đổi của A | Task 9 (theo Quyết định 1) |
| `area-overview-journal#5` | Sửa bài có mood đã bị xoá trong Cài đặt thì lưu `mood: null`; mood đã bị tắt thì chip bị ẩn, không thấy/không bỏ chọn được; snapshot bị dựng lại từ Cài đặt thay vì giữ bản đã lưu | Task 8 |
| `area-overview-journal#6` | Xoá đúng bài đang sửa thì vẫn ở chế độ "Cập nhật"; bấm Cập nhật là mất chữ mà toast vẫn báo "Đã cập nhật bài viết" | Task 4 (`updateEntry` từ chối id không còn, kiểm trên bản đọc tươi), Task 7 (xoá đúng bài đang sửa thì rời chế độ sửa) |
| `area-overview-journal#7` | "1 tháng trước"/"1 năm trước" tràn ngày ở cuối tháng (31/03 → 03/03 cùng tháng; 29/02/2028 → 01/03/2027) | Task 2 |
| `area-overview-journal#13` | Ngày của bài chỉ có `dd/mm`, bài cùng ngày khác năm không phân biệt được (danh sách, tên nút Sửa, Tổng quan) | Task 6 (theo Quyết định 3) |
| `area-overview-journal#17` | Chip mood không báo trạng thái chọn cho trình đọc màn hình | Task 8 (`aria-pressed`) |
| `area-overview-journal#20` | Thiếu test: `stripHtmlToPlainText` chỉ test thẻ inline; không test khung soạn khi ghi lỗi, `findOnThisDay` cuối tháng/năm nhuận, mood đã tắt/xoá khi sửa; test hook lịch sử tài sản dùng đồng hồ thật | Task 1 (khối/entity), Task 5 (ghi lỗi), Task 2 (cuối tháng/29-02), Task 8 (mood đã tắt/xoá), Task 3 (ghim đồng hồ `use-net-worth-history.test.ts`). Phần test `forecastSavingsGoal` có điểm 0 đầu chuỗi/bước nhảy: **Không sửa ở plan này** — đó chính là test đỏ của bản sửa `area-overview-journal#11` thuộc Plan 6a; viết ở đây thì hoặc đỏ suốt tới Plan 6a, hoặc phải khẳng định đúng hành vi sai mà 6a sẽ sửa |

## Thay đổi ảnh hưởng tới các phần sau

Các plan 5, 6a, 6b chạy sau khi plan này đã merge. Mọi thứ dưới đây là "hợp đồng" mới mà chúng phải dựa vào (và không được làm mất khi sửa/di chuyển file):

**Helper**
- `stripHtmlToPlainText(html)` (`src/features/journal/journal-html.ts`) giờ trả **chữ thật**: entity đã giải mã, mỗi thẻ khối (`div`/`p`/`li`/`h3`/`blockquote`/`ul`/`ol`) và `<br>` thành đúng 1 `\n` (dòng trống bị gộp), `&nbsp;` thành dấu cách thường, khoảng trắng thường trong text node gộp như trình duyệt. Hàm nội bộ mới `collectText` + hằng `BLOCK_TAGS`. **Plan 6b** (`area-overview-journal#15`, chuyển helper HTML của nhật ký ra `src/lib/`) phải mang theo cả `collectText`, `BLOCK_TAGS` và các test mới trong `journal-html.test.ts`; nơi gọi vẫn chỉ được render kết quả như text React.
- `formatShortDate(d: Date, now: Date = new Date()): string` — mới ở `src/lib/date.ts`: `dd/mm` nếu cùng năm với `now`, `dd/mm/yyyy` nếu khác năm. Dùng ở `JournalEntriesCard` (qua `entryDateLabel`) và `JournalSummarySection` (Tổng quan) với `new Date(entry.id)`. Nằm sẵn trong `src/lib/` nên Plan 6b không cần chuyển.

**Hook**
- `useJournal`: `updateEntry(id, input): boolean` — `false` khi id không còn trong bản đọc tươi (toast `Không cập nhật được: bài này đã bị xoá (có thể ở tab khác). Nội dung bạn vừa sửa vẫn còn trong khung soạn.`, không ghi gì, không toast thành công) hoặc khi ghi lỗi; `deleteEntry(id): boolean` — `false` khi ghi lỗi. `saveEntry` giữ nguyên (`JournalEntry | null`). Shape trả về của hook không đổi.

**Component**
- `JournalEditor`: `onSave` giờ phải trả `boolean` (`true` = đã ghi được; `false` thì khung soạn giữ nguyên chữ và số từ). Prop tuỳ chọn mới `initialDraft?: EditorDraft` (nội dung hiện lại lúc mount khi không sửa bài nào) và `onDraftChange?: (draft: EditorDraft) => void` (gọi sau mỗi lần gõ/dán/kéo-thả/Xoá nháp). Export thêm `type EditorDraft = { html: string; words: number }` (khai báo là `interface`).
- `JournalEntriesCard`: tự giữ `AlertDialog` xoá (state `deletingId`, title "Xoá bài nhật ký?", `confirmLabel="Xoá"`, `destructive`, mô tả là inline content `text + <strong>` trong `<p>` của AlertDialog); nút có tên `Sửa bài <ngày> <giờ>` / `Xoá bài <ngày> <giờ>` với `<ngày>` từ `formatShortDate`. **Plan 5** (`area-components-lib#4`, modal cuộn được) và **Plan 6b** (`area-components-lib#14`, `aria-describedby`) sẽ đụng hộp thoại này — giữ mô tả là phrasing content.
- `JournalView`: có thêm 1 `AlertDialog` "Bỏ thay đổi chưa lưu?" (nút "Bỏ thay đổi"/"Tiếp tục sửa") và state bản nháp bài mới (`draft`, `draftMood`, `pendingEdit`; nội dung đang gõ và cờ "bài đang sửa đã đổi" nằm trong 2 ref `latestDraftRef`/`editDirtyRef`, chỉ đọc trong hàm xử lý sự kiện); các hàm `startEditing`/`leaveEditMode`/`handleDelete`; `onDelete` của danh sách đi qua `handleDelete` (xoá đúng bài đang sửa thì rời chế độ sửa). **Plan 6b** (`area-settings-sync#11`, chuyển `useSettings` sang `src/lib/`) chỉ cần đổi dòng import `useSettings` ở file này.
- `MoodPickerCard`: prop tuỳ chọn mới `entryMood?: MoodSnapshot | null`; mỗi chip có `aria-pressed`. **Plan 6a** (`area-settings-sync#8`, chặn mood trùng tên; `#9`, xoá mood 1 chạm) không cần đổi gì ở nhật ký: bài đã lưu giữ snapshot mood của nó kể cả khi mood bị xoá khỏi Cài đặt (Task 8) — so khớp vẫn theo `label`.

**Test đã thêm (để các plan sau khỏi làm lại)**
- `journal-view.test.tsx` có describe mới `"JournalView — sửa, xoá và giữ nội dung đang viết"` với đồng hồ ghim `2026-09-30 09:00` và 2 bài mẫu `ENTRY_A` (28/09 20:00), `ENTRY_B` (27/09 21:00) + helper `seedEntries(...)`.
- `use-net-worth-history.test.ts`: describe đầu tiên ghim đồng hồ `2026-09-25 09:00`. **Plan 6a** (`area-overview-journal#11`) thêm test `forecastSavingsGoal` có điểm 0 đầu chuỗi/bước nhảy cùng bản sửa của mình (xem hàng `#20` ở `## Phạm vi`).

## Cấu trúc file

- Modify (helper): `src/features/journal/journal-html.ts`, `src/features/journal/journal-calculations.ts`, `src/lib/date.ts`
- Modify (hook): `src/features/journal/hooks/use-journal.ts`
- Modify (UI): `src/features/journal/components/{journal-editor,journal-view,journal-entries-card,mood-picker-card}.tsx`, `src/features/overview/components/journal-summary-section.tsx`
- Create (test): `src/features/journal/__tests__/components/mood-picker-card.test.tsx`
- Test sửa/thêm: `src/features/journal/__tests__/{journal-html,journal-calculations}.test.ts`, `src/features/journal/__tests__/hooks/use-journal.test.ts`, `src/features/journal/__tests__/components/{journal-editor,journal-view,journal-entries-card}.test.tsx`, `src/features/overview/__tests__/components/journal-summary-section.test.tsx`, `src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`, `src/lib/__tests__/date.test.ts`

---
### Task 1: Bản xem trước hiện đúng chữ — xuống dòng, giải mã `&amp;`/`&lt;`/`&nbsp;`

**Files:**
- Modify: `src/features/journal/journal-html.ts:20-27` (`stripHtmlToPlainText`)
- Test: `src/features/journal/__tests__/journal-html.test.ts`, `src/features/journal/__tests__/components/journal-entries-card.test.tsx`, `src/features/overview/__tests__/components/journal-summary-section.test.tsx`

**Interfaces:**
- Consumes: `ALLOWED_TAGS` (hằng sẵn có trong `journal-html.ts`), `DOMPurify.sanitize(html, { ..., RETURN_DOM: true }): Node`.
- Produces: `stripHtmlToPlainText(html: string): string` giữ nguyên chữ ký, nhưng giờ trả chữ thật (entity đã giải mã, mỗi khối/`<br>` là 1 `\n`, `&nbsp;` → dấu cách). Nơi gọi không đổi: `JournalEntriesCard` (bản thu gọn, `whitespace-pre-wrap` hiện được xuống dòng) và `JournalSummarySection` (`whitespace-nowrap` tự gộp `\n` thành dấu cách).

- [ ] **Step 1: Viết test thất bại cho hàm**

Trong `src/features/journal/__tests__/journal-html.test.ts`, thêm vào cuối `describe("stripHtmlToPlainText", ...)` (ngay trước `})` cuối file):

```ts
  it("puts each block (div/p/li/h3/blockquote) on its own line instead of running lines together", () => {
    expect(stripHtmlToPlainText("Dòng một<div>Dòng hai</div>")).toBe("Dòng một\nDòng hai")
    expect(stripHtmlToPlainText("<ul><li>một</li><li>hai</li></ul>")).toBe("một\nhai")
    expect(stripHtmlToPlainText("<h3>Tiêu đề</h3><p>Đoạn</p><blockquote>Trích</blockquote>")).toBe(
      "Tiêu đề\nĐoạn\nTrích"
    )
  })

  it("turns <br> into a line break", () => {
    expect(stripHtmlToPlainText("Dòng một<br>Dòng hai")).toBe("Dòng một\nDòng hai")
  })

  it("collapses blank lines and the spaces around a line break into a single line break", () => {
    // Chrome ghi 1 dòng trống thành <div><br></div>.
    expect(stripHtmlToPlainText("Dòng một <div><br></div><div> Dòng ba</div>")).toBe("Dòng một\nDòng ba")
  })

  it("decodes HTML entities instead of showing them literally", () => {
    expect(stripHtmlToPlainText("Tom &amp; Jerry, 3 &lt; 5")).toBe("Tom & Jerry, 3 < 5")
    expect(stripHtmlToPlainText("a&nbsp;&nbsp;b")).toBe("a  b")
  })

  it("returns an escaped tag as literal text, never as markup", () => {
    expect(stripHtmlToPlainText("&lt;b&gt;đậm&lt;/b&gt;")).toBe("<b>đậm</b>")
  })
```

- [ ] **Step 2: Viết test thất bại ở 2 nơi hiển thị**

2.1. Trong `src/features/journal/__tests__/components/journal-entries-card.test.tsx`, thêm vào cuối `describe("JournalEntriesCard", ...)` (ngay trước `})` cuối file):

```ts
  it("measures the preview on the decoded text, so HTML escapes don't make a short entry look long", () => {
    // 40 lần "x&amp;" = 240 ký tự HTML nhưng chỉ 80 ký tự chữ thật — dưới ngưỡng 180, không cắt.
    const entry: JournalEntry = { ...SHORT_ENTRY, text: "x&amp;".repeat(40) }
    render(<JournalEntriesCard entries={[entry]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.queryByRole("button", { name: "Xem thêm" })).not.toBeInTheDocument()
    expect(screen.getByText("x&".repeat(40))).toBeInTheDocument()
  })

  it("keeps line breaks and decoded characters in the collapsed preview of a long entry", () => {
    const html = Array.from({ length: 10 }, () => "<div>Xin chào &amp; tạm biệt.</div>").join("")
    const plain = Array.from({ length: 10 }, () => "Xin chào & tạm biệt.").join("\n") // 209 ký tự
    render(<JournalEntriesCard entries={[{ ...LONG_ENTRY, text: html }]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    const preview = screen.getByText(
      (_, element) => element?.tagName === "P" && element.textContent === `${plain.slice(0, 180)}…`
    )
    expect(preview).toBeInTheDocument()
  })
```

2.2. Trong `src/features/overview/__tests__/components/journal-summary-section.test.tsx`, thêm vào cuối `describe("JournalSummarySection", ...)` (ngay trước `})` cuối file):

```ts
  it("shows readable preview text — decoded characters, lines separated — not raw HTML escapes", () => {
    render(<JournalSummarySection entries={[{ ...ENTRY, text: "Tom &amp; Jerry<div>Dòng hai&nbsp;nữa</div>" }]} />)

    // getByText gộp "\n" thành dấu cách, đúng như whitespace-nowrap hiển thị trên 1 dòng.
    expect(screen.getByText("Tom & Jerry Dòng hai nữa")).toBeInTheDocument()
  })
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/journal-html.test.ts src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/overview/__tests__/components/journal-summary-section.test.tsx`
Expected: FAIL đúng 8 test mới — ví dụ `expected 'Dòng mộtDòng hai' to be 'Dòng một\nDòng hai'`, `expected 'mộthai' to be 'một\nhai'`, `expected 'Tom &amp; Jerry, 3 &lt; 5' to be 'Tom & Jerry, 3 < 5'`, `expected '&lt;b&gt;đậm&lt;/b&gt;' to be '<b>đậm</b>'`; ở card: nút "Xem thêm" vẫn hiện (240 ký tự escape bị coi là dài), không tìm thấy `<p>` có nội dung mong đợi; ở Tổng quan: `Unable to find an element with the text: Tom & Jerry Dòng hai nữa`. 3 test cũ của `stripHtmlToPlainText` và mọi test cũ khác vẫn PASS.

- [ ] **Step 4: Viết lại `stripHtmlToPlainText`**

Trong `src/features/journal/journal-html.ts`, thay nguyên hàm

```ts
function stripHtmlToPlainText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  })
}
```

bằng:

```ts
// Thẻ khối — trên màn hình mỗi thẻ là 1 dòng riêng, nên ranh giới của chúng thành 1 lần xuống dòng.
const BLOCK_TAGS = new Set(["DIV", "P", "LI", "H3", "BLOCKQUOTE", "UL", "OL"])

function collectText(node: Node, parts: string[]) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      // Gộp khoảng trắng thường như trình duyệt vẫn làm khi hiển thị HTML; &nbsp; (U+00A0) không bị gộp.
      parts.push((child.textContent ?? "").replace(/[ \t\n\r]+/g, " "))
    } else if (child.nodeName === "BR") {
      parts.push("\n")
    } else {
      const isBlock = BLOCK_TAGS.has(child.nodeName)
      if (isBlock) parts.push("\n")
      collectText(child, parts)
      if (isBlock) parts.push("\n")
    }
  })
}

// Chữ thuần cho bản xem trước. DOMPurify trả chuỗi HTML đã escape (còn &amp;/&lt;/&nbsp;, các dòng dính
// liền) nên không dùng được làm chữ — lấy cây DOM đã lọc (RETURN_DOM: nằm trong document riêng của
// DOMPurify, không gắn vào trang, không chạy script) rồi đọc text node, vốn đã giải mã entity sẵn.
// Kết quả CHỈ được render như text con của React (tự escape), không bao giờ qua innerHTML.
function stripHtmlToPlainText(html: string): string {
  const root = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    RETURN_DOM: true,
  })
  if (!root) return ""
  const parts: string[] = []
  collectText(root, parts)
  return parts
    .join("")
    .replace(/\u00a0/g, " ") // &nbsp; → dấu cách thường
    .replace(/ *\n[\n ]*/g, "\n") // dòng trống và dấu cách quanh chỗ xuống dòng → đúng 1 "\n"
    .trim()
}
```

(`sanitizeJournalHtml` và dòng `export { sanitizeJournalHtml, stripHtmlToPlainText }` giữ nguyên.)

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/journal-html.test.ts src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/overview/__tests__/components/journal-summary-section.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: PASS toàn bộ (kể cả 3 test cũ: thẻ inline, `<script>` bị bỏ cả nội dung, chữ thường giữ nguyên; và test "truncates long entries" với `LONG_TEXT` không có thẻ).

- [ ] **Step 6: Tự review diff rồi commit**

Run: `git diff`
Kiểm: chỉ đổi `journal-html.ts` + 3 file test; `sanitizeJournalHtml` không đổi; không chỗ nào đưa kết quả `stripHtmlToPlainText` vào `dangerouslySetInnerHTML`/`innerHTML`.

```bash
git add src/features/journal/journal-html.ts src/features/journal/__tests__/journal-html.test.ts src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/overview/__tests__/components/journal-summary-section.test.tsx
git commit -m "fix: show decoded text and line breaks in journal previews"
```

---

### Task 2: "Ngày này năm xưa" bỏ mốc rơi vào ngày không có thật (cuối tháng, 29/02)

**Files:**
- Modify: `src/features/journal/journal-calculations.ts:16-30` (`findOnThisDay` + hàm nội bộ mới `existingDate`)
- Test: `src/features/journal/__tests__/journal-calculations.test.ts`

**Interfaces:**
- Consumes: `isSameCalendarDay(a: Date, b: Date): boolean` (đã có, cùng file).
- Produces: `findOnThisDay(entries: JournalEntry[], now?: Date): OnThisDayResult | null` giữ nguyên chữ ký; mốc "1 năm trước"/"1 tháng trước" là `null` (bị bỏ qua) khi tháng đích không có ngày `now.getDate()`. Mốc "1 tuần trước" vẫn lùi 7 ngày qua ranh giới tháng như cũ. Hàm nội bộ `existingDate(year, month, day): Date | null` không export.

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/journal/__tests__/journal-calculations.test.ts`, thêm vào cuối `describe("findOnThisDay", ...)` (ngay trước `})` cuối file):

```ts
  it("skips the 1-month-ago check on 31/03 instead of rolling 31/02 over into this month", () => {
    const sameMonth = entry(new Date(2026, 2, 3, 9, 0).getTime(), "Đầu tháng 3")

    // new Date(2026, 1, 31) tự tràn thành 03/03 — trước bản sửa, bài 03/03 bị gắn nhãn "1 tháng trước".
    expect(findOnThisDay([sameMonth], new Date(2026, 2, 31, 9, 0))).toBeNull()
  })

  it("skips the 1-month-ago check on the 31st after a 30-day month (31/05 has no 31/04)", () => {
    const firstOfMay = entry(new Date(2026, 4, 1, 9, 0).getTime(), "Đầu tháng 5")

    expect(findOnThisDay([firstOfMay], new Date(2026, 4, 31, 9, 0))).toBeNull()
  })

  it("does not move a missing 1-month-ago day to the end of the previous month either", () => {
    const endOfFebruary = entry(new Date(2026, 1, 28, 9, 0).getTime(), "Cuối tháng 2")

    expect(findOnThisDay([endOfFebruary], new Date(2026, 2, 31, 9, 0))).toBeNull()
    // Bài 28/02 vẫn có đúng ngày kỷ niệm của nó: 28/03.
    expect(findOnThisDay([endOfFebruary], new Date(2026, 2, 28, 9, 0))).toEqual({
      entry: endOfFebruary,
      label: "1 tháng trước",
    })
  })

  it("skips the 1-year-ago check on 29/02 instead of matching 01/03 of the year before", () => {
    const marchFirst = entry(new Date(2027, 2, 1, 9, 0).getTime(), "01/03 năm trước")

    expect(findOnThisDay([marchFirst], new Date(2028, 1, 29, 9, 0))).toBeNull()
  })

  it("still finds a 1-month-ago entry on 29/02, when only the 1-year-ago day is missing", () => {
    const januaryEntry = entry(new Date(2028, 0, 29, 9, 0).getTime(), "29/01")

    expect(findOnThisDay([januaryEntry], new Date(2028, 1, 29, 9, 0))).toEqual({
      entry: januaryEntry,
      label: "1 tháng trước",
    })
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/journal-calculations.test.ts`
Expected: FAIL đúng 3 test — "skips the 1-month-ago check on 31/03…" và "…31st after a 30-day month…" (`expected { entry: {…}, label: '1 tháng trước' } to be null`), "skips the 1-year-ago check on 29/02…" (`expected { entry: {…}, label: '1 năm trước' } to be null`). 2 test "does not move a missing 1-month-ago day…" và "still finds a 1-month-ago entry on 29/02…" đã PASS sẵn — rào chắn để bản sửa không dồn về cuối tháng và không chặn nhầm mốc tháng. Mọi test cũ vẫn PASS.

- [ ] **Step 3: Sửa `findOnThisDay`**

Trong `src/features/journal/journal-calculations.ts`, thay khối

```ts
// entry.id là timestamp thật lúc lưu (Date.now()), nên dùng để so ngày chính xác —
// field "date" hiển thị (dd/mm) không có năm, không đủ để tính "bao lâu trước".
function findOnThisDay(entries: JournalEntry[], now: Date = new Date()): OnThisDayResult | null {
  const targets: [Date, string][] = [
    [new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), "1 năm trước"],
    [new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()), "1 tháng trước"],
    [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), "1 tuần trước"],
  ]

  for (const [target, label] of targets) {
    const match = entries.find((entry) => isSameCalendarDay(new Date(entry.id), target))
    if (match) return { entry: match, label }
  }
  return null
}
```

bằng:

```ts
// Ngày `day` của tháng `month` (0–11; âm hay quá 11 thì Date tự lùi/tiến năm), hoặc null nếu tháng đó
// không có ngày này (31/04, 29/02 năm thường). Không dùng thẳng new Date(y, m, d): ngày không có thật bị
// tự tràn sang tháng sau — lùi 1 tháng từ 31/03 ra 03/03, gắn nhãn "1 tháng trước" cho bài mới 4 tuần.
function existingDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month, day)
  return date.getDate() === day ? date : null
}

// entry.id là timestamp thật lúc lưu (Date.now()), nên dùng để so ngày chính xác —
// field "date" hiển thị (dd/mm) không có năm, không đủ để tính "bao lâu trước".
// Mốc "1 năm/1 tháng trước" rơi vào ngày không có thật thì bỏ mốc đó, không dồn về cuối tháng: bài nào
// cũng vẫn có đúng ngày kỷ niệm cùng số ngày, và không bài cuối tháng nào hiện lại nhiều ngày liền.
function findOnThisDay(entries: JournalEntry[], now: Date = new Date()): OnThisDayResult | null {
  const targets: [Date | null, string][] = [
    [existingDate(now.getFullYear() - 1, now.getMonth(), now.getDate()), "1 năm trước"],
    [existingDate(now.getFullYear(), now.getMonth() - 1, now.getDate()), "1 tháng trước"],
    [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), "1 tuần trước"],
  ]

  for (const [target, label] of targets) {
    if (!target) continue
    const match = entries.find((entry) => isSameCalendarDay(new Date(entry.id), target))
    if (match) return { entry: match, label }
  }
  return null
}
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/journal-calculations.test.ts src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: PASS toàn bộ — kể cả test cũ "handles the 1-month-ago boundary across a year change (Jan -> Dec of previous year)" (`existingDate(2026, -1, 15)` = 15/12/2025) và 2 test thẻ "ngày này năm xưa" của `journal-view.test.tsx`.

- [ ] **Step 5: Tự review diff rồi commit**

Run: `git diff` — chỉ đổi `journal-calculations.ts` và file test của nó; `OnThisDayCard`, `isSameCalendarDay` không đổi.

```bash
git add src/features/journal/journal-calculations.ts src/features/journal/__tests__/journal-calculations.test.ts
git commit -m "fix: skip on-this-day anniversaries that fall on a day the month does not have"
```

---

### Task 3: Ghim đồng hồ cho test `useNetWorthHistory`

**Files:**
- Test (chỉ sửa test): `src/features/overview/__tests__/hooks/use-net-worth-history.test.ts` — describe đầu tiên `describe("useNetWorthHistory", ...)`

**Interfaces:**
- Consumes: `recordSnapshot` ghi theo `dayKey()` (`@/lib/date`, đọc `new Date()` — fake timers của Vitest điều khiển được). Sau Plan 1a Task 5, dòng import đầu file đã là `import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"` và cuối file có describe thứ 2 `"useNetWorthHistory — dữ liệu do tab khác ghi"` (ghim `2026-09-20`) — không đụng tới describe đó.
- Produces: describe đầu tiên ghim "hôm nay" là `2026-09-25 09:00`; không đổi code nguồn nào.

- [ ] **Step 1: Thêm khẳng định theo ngày (đỏ khi còn dùng đồng hồ thật)**

Trong describe đầu tiên của `src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`:

1.1. Test `"starts empty and records a snapshot for today"` — ngay sau dòng `expect(result.current.history[0].savingsTotal).toBe(5_000_000)` thêm:

```ts
    expect(result.current.history[0].date).toBe("2026-09-25")
```

1.2. Test `"replaces (not duplicates) today's snapshot when called again with different values"` — ngay sau dòng `expect(result.current.history[0].savingsTotal).toBe(9_000_000)` thêm:

```ts
    expect(result.current.history[0].date).toBe("2026-09-25")
```

1.3. Test `"preserves and appends to pre-existing history when a consumer calls recordSnapshot from its own mount effect"` — ngay sau khối kiểm cuối cùng của test (khối `expect(getStoredNetWorthHistory().slice(0, 3)).toEqual(` liệt kê 3 bản ghi `2026-09-18`…`2026-09-20`), trước `})` của test, thêm:

```ts
    expect(getStoredNetWorthHistory()[3]).toEqual({ date: "2026-09-25", net: 9_999_999, savingsTotal: 8_888_888 })
```

(Nếu dòng import vitest đầu file chưa có `afterEach, vi` — tức Plan 1a Task 5 chưa thêm — thì đổi thành `import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"`.)

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`
Expected: FAIL đúng 3 test vừa sửa — `expected '<ngày chạy test>' to be '2026-09-25'` (vd. `expected '2026-10-05' to be '2026-09-25'`) và `expected { date: '<ngày chạy test>', … } to deeply equal { date: '2026-09-25', … }`. Test của describe "dữ liệu do tab khác ghi" vẫn PASS.

- [ ] **Step 3: Ghim đồng hồ ở `beforeEach`**

Trong describe đầu tiên, thay

```ts
describe("useNetWorthHistory", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
```

bằng:

```ts
describe("useNetWorthHistory", () => {
  beforeEach(() => {
    window.localStorage.clear()
    // recordSnapshot ghi theo dayKey() của đồng hồ thật — ghim "hôm nay" để kết quả không đổi theo ngày
    // chạy, và test "replaces (not duplicates)…" không hỏng khi chạy vắt qua nửa đêm (2 lần
    // recordSnapshot rơi vào 2 ngày khác nhau thì thành 2 bản ghi).
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 25, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`
Expected: PASS toàn bộ (cả 2 describe).

- [ ] **Step 5: Tự review diff rồi commit**

Run: `git diff` — chỉ đổi file test này; không đụng `use-net-worth-history.ts` hay describe của Plan 1a.

```bash
git add src/features/overview/__tests__/hooks/use-net-worth-history.test.ts
git commit -m "chore: pin the clock in the net-worth history hook tests"
```

---

### Task 4: `useJournal` báo sửa/xoá có thành công không, và từ chối sửa 1 bài đã bị xoá

**Files:**
- Modify: `src/features/journal/hooks/use-journal.ts` (`updateEntry`, `deleteEntry` — bản đã qua Plan 1a Task 4)
- Test: `src/features/journal/__tests__/hooks/use-journal.test.ts`

**Interfaces:**
- Consumes: `getStoredJournal()` đọc tươi + `persist` (deps `[persist]`) của Plan 1a — giữ nguyên.
- Produces:
  - `updateEntry(id: number, input: SaveEntryInput): boolean` — `true` khi đã ghi; `false` khi `id` không còn trong bản đọc tươi (toast lỗi `Không cập nhật được: bài này đã bị xoá (có thể ở tab khác). Nội dung bạn vừa sửa vẫn còn trong khung soạn.`, không ghi gì, không toast thành công) hoặc khi ghi lỗi (toast cũ `Không thể cập nhật bài viết. Vui lòng thử lại.`).
  - `deleteEntry(id: number): boolean` — `true` khi đã ghi; `false` khi ghi lỗi (toast cũ).
  - `saveEntry` giữ nguyên (`JournalEntry | null`); shape trả về của hook không đổi. Task 5 và Task 7 dùng 2 giá trị `boolean` này.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("useJournal", ...)` trong `src/features/journal/__tests__/hooks/use-journal.test.ts` (ngay trước `})` cuối file, sau 2 test của Plan 1a; `JOURNAL_STORAGE_KEY`, `getStoredJournal`, `toast`, `JournalEntry` đã được import sẵn):

```ts
  it("updateEntry and deleteEntry return true when the write succeeds", async () => {
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    let entry!: JournalEntry
    act(() => {
      entry = result.current.saveEntry({ text: "Bài gốc", words: 2, mood: null })!
    })

    let updated: boolean | undefined
    act(() => {
      updated = result.current.updateEntry(entry.id, { text: "Bài sửa", words: 2, mood: null })
    })
    let deleted: boolean | undefined
    act(() => {
      deleted = result.current.deleteEntry(entry.id)
    })

    expect(updated).toBe(true)
    expect(deleted).toBe(true)
  })

  it("updateEntry and deleteEntry return false when the storage write fails", async () => {
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    let entry!: JournalEntry
    act(() => {
      entry = result.current.saveEntry({ text: "Bài gốc", words: 2, mood: null })!
    })

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded")
    })
    let updated: boolean | undefined
    act(() => {
      updated = result.current.updateEntry(entry.id, { text: "Sẽ lỗi", words: 2, mood: null })
    })
    let deleted: boolean | undefined
    act(() => {
      deleted = result.current.deleteEntry(entry.id)
    })
    setItemSpy.mockRestore()

    expect(updated).toBe(false)
    expect(deleted).toBe(false)
  })

  it("updateEntry refuses an entry that was deleted elsewhere: no write, no success toast, returns false", async () => {
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    let entry!: JournalEntry
    act(() => {
      entry = result.current.saveEntry({ text: "Bài gốc", words: 2, mood: null })!
    })
    // Tab khác xoá đúng bài này — ghi thẳng, KHÔNG bắn sự kiện: `state` của hook vẫn còn bài, chỉ bản
    // đọc tươi là biết bài đã mất (cùng tình huống với xoá đúng bài đang sửa ngay trên trang này).
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [] }))
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem")

    let updated: boolean | undefined
    act(() => {
      updated = result.current.updateEntry(entry.id, { text: "Bài đã sửa", words: 3, mood: null })
    })

    expect(updated).toBe(false)
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(getStoredJournal().entries).toEqual([])
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      "Không cập nhật được: bài này đã bị xoá (có thể ở tab khác). Nội dung bạn vừa sửa vẫn còn trong khung soạn."
    )
    setItemSpy.mockRestore()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/hooks/use-journal.test.ts`
Expected: FAIL đúng 3 test mới — `expected undefined to be true`, `expected undefined to be false`, và ở test thứ 3 `expected undefined to be false` (bản cũ còn ghi lại `{"entries":[]}` và toast "Đã cập nhật bài viết"). Mọi test cũ (kể cả 2 test của Plan 1a) vẫn PASS.

- [ ] **Step 3: Sửa `updateEntry` và `deleteEntry`**

Trong `src/features/journal/hooks/use-journal.ts`, thay nguyên 2 khối (bản của Plan 1a)

```ts
  const updateEntry = useCallback(
    (id: number, input: SaveEntryInput) => {
      const current = getStoredJournal()
      try {
        persist({
          ...current,
          entries: current.entries.map((entry) =>
            entry.id === id
              ? { ...entry, text: input.text, words: input.words, mood: input.mood }
              : entry
          ),
        })
        toast.success("Đã cập nhật bài viết")
      } catch {
        toast.error("Không thể cập nhật bài viết. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const deleteEntry = useCallback(
    (id: number) => {
      const current = getStoredJournal()
      try {
        persist({ ...current, entries: current.entries.filter((entry) => entry.id !== id) })
        toast.success("Đã xoá bài viết")
      } catch {
        toast.error("Không thể xoá bài viết. Vui lòng thử lại.")
      }
    },
    [persist]
  )
```

bằng:

```ts
  // Trả true khi đã ghi được — khung soạn (JournalView/JournalEditor) chỉ rời chế độ sửa và xoá chữ khi true.
  const updateEntry = useCallback(
    (id: number, input: SaveEntryInput): boolean => {
      const current = getStoredJournal()
      // Kiểm trên bản đọc tươi: bài có thể vừa bị xoá (ở tab khác, hay ngay trên trang này) trong lúc đang
      // sửa. Không kiểm thì map() không thấy id, ghi lại y nguyên danh sách và vẫn báo "Đã cập nhật".
      if (!current.entries.some((entry) => entry.id === id)) {
        toast.error(
          "Không cập nhật được: bài này đã bị xoá (có thể ở tab khác). Nội dung bạn vừa sửa vẫn còn trong khung soạn."
        )
        return false
      }
      try {
        persist({
          ...current,
          entries: current.entries.map((entry) =>
            entry.id === id
              ? { ...entry, text: input.text, words: input.words, mood: input.mood }
              : entry
          ),
        })
        toast.success("Đã cập nhật bài viết")
        return true
      } catch {
        toast.error("Không thể cập nhật bài viết. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  const deleteEntry = useCallback(
    (id: number): boolean => {
      const current = getStoredJournal()
      try {
        persist({ ...current, entries: current.entries.filter((entry) => entry.id !== id) })
        toast.success("Đã xoá bài viết")
        return true
      } catch {
        toast.error("Không thể xoá bài viết. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )
```

(Phần còn lại của file — `useStorageSync(JOURNAL_STORAGE_KEY, reload)`, `persist`, `saveEntry`, object trả về — giữ nguyên. `JournalView` vẫn chạy như cũ vì bỏ qua giá trị trả về; Task 5/7 mới dùng tới.)

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/hooks/use-journal.test.ts src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Tự review diff rồi commit**

Run: `git diff` — chỉ 2 hàm `updateEntry`/`deleteEntry` và file test; deps vẫn `[persist]`, không có chỗ nào đọc `state` trong closure.

```bash
git add src/features/journal/hooks/use-journal.ts src/features/journal/__tests__/hooks/use-journal.test.ts
git commit -m "fix: report journal update and delete results and refuse updating a deleted entry"
```

---

### Task 5: Khung soạn giữ nguyên chữ khi lưu/cập nhật không ghi được

**Files:**
- Modify: `src/features/journal/components/journal-editor.tsx:30-35` (`onSave` trả `boolean`), `:91-98` (`handleSave`)
- Modify: `src/features/journal/components/journal-view.tsx:32-41` (`handleSave`)
- Test: `src/features/journal/__tests__/components/journal-editor.test.tsx`, `src/features/journal/__tests__/components/journal-view.test.tsx`

**Interfaces:**
- Consumes: `saveEntry(input): JournalEntry | null`, `updateEntry(id, input): boolean` (Task 4).
- Produces:
  - `JournalEditorProps.onSave: (input: { text: string; words: number; mood: MoodSnapshot | null }) => boolean` — `true` = đã ghi; khung soạn chỉ xoá chữ + số từ khi nhận `true`.
  - `JournalView.handleSave(input): boolean` — chế độ sửa: chỉ rời chế độ sửa khi `updateEntry` trả `true`; bài mới: `true` khi `saveEntry` trả bài.
  - Trong `journal-view.test.tsx`: describe mới `"JournalView — sửa, xoá và giữ nội dung đang viết"` (đồng hồ ghim `2026-09-30 09:00`) + fixture `ENTRY_A` (28/09 20:00), `ENTRY_B` (27/09 21:00) + helper `seedEntries(...entries)`. Task 7, 8, 9 thêm test vào cuối describe này.

- [ ] **Step 1: Viết test thất bại cho khung soạn**

Trong `src/features/journal/__tests__/components/journal-editor.test.tsx`:

1.1. Test `"saves the current text, word count, and selected mood, then clears the editor"` — thay dòng

```ts
    const onSave = vi.fn()
```

(dòng đầu tiên trong thân test đó) bằng:

```ts
    const onSave = vi.fn(() => true) // true = đã ghi được — chỉ khi đó khung soạn mới được xoá
```

1.2. Thêm ngay sau test đó:

```ts
  it("keeps the text and word count when onSave reports that nothing was written, so saving can be retried", () => {
    const onSave = vi.fn(() => false)
    render(<JournalEditor selectedMood={null} onSave={onSave} />)

    const editor = screen.getByRole("textbox")
    typeInto(editor, "Một ngày ổn")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(editor.innerHTML).toBe("Một ngày ổn")
    expect(screen.getByText("3 từ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeEnabled()
  })
```

- [ ] **Step 2: Viết test thất bại cho trang Nhật ký**

Trong `src/features/journal/__tests__/components/journal-view.test.tsx`:

2.1. Ngay dưới dòng `import { JournalView } from "../../components/journal-view"` thêm:

```ts
import type { JournalEntry } from "../../types"
```

2.2. Thêm vào cuối file (sau `describe("JournalView on-this-day card", ...)`):

```ts
// "Hôm nay" ghim là 30/09/2026 — không bài mẫu nào trùng mốc "ngày này năm xưa" (23/09, 30/08, 30/09/2025)
// nên mỗi đoạn chữ chỉ xuất hiện 1 lần trên trang.
const ENTRY_A: JournalEntry = {
  id: new Date(2026, 8, 28, 20, 0).getTime(),
  text: "Tối nay đi bộ quanh hồ",
  time: "20:00",
  date: "28/09",
  words: 6,
  mood: null,
}

const ENTRY_B: JournalEntry = {
  id: new Date(2026, 8, 27, 21, 0).getTime(),
  text: "Đọc xong một cuốn sách",
  time: "21:00",
  date: "27/09",
  words: 5,
  mood: null,
}

function seedEntries(...entries: JournalEntry[]) {
  window.localStorage.setItem("journal-entries", JSON.stringify({ entries }))
}

describe("JournalView — sửa, xoá và giữ nội dung đang viết", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps a new entry in the editor when it cannot be saved, so it can be saved again", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Bài sẽ lưu lỗi")
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded")
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))
    setItemSpy.mockRestore()

    expect(screen.queryByText("Đã lưu vào nhật ký")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài sẽ lưu lỗi")
    expect(screen.getByText("4 từ")).toBeInTheDocument()
  })

  it("stays in edit mode with the edited text when the update cannot be written", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A đã sửa")
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded")
    })
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))
    setItemSpy.mockRestore()

    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài A đã sửa")
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].text).toBe(ENTRY_A.text)
  })

  it("keeps the edited text, and saves no new entry, when the entry was deleted in another tab meanwhile", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A đã sửa")
    // Tab khác xoá bài A — ghi thẳng, KHÔNG bắn sự kiện: trang này vẫn đang ở chế độ sửa bài A.
    seedEntries(ENTRY_B)
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài A đã sửa")
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries).toEqual([ENTRY_B])
  })
})
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/components/journal-editor.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: FAIL đúng 4 test mới — ở editor `expected '' to be 'Một ngày ổn'`; ở trang: `expected element to have text content "Bài sẽ lưu lỗi"` (khung soạn đã bị xoá), và 2 test chế độ sửa `Unable to find an accessible element with the role "button" and name "Cập nhật bài viết"` (trang đã rời chế độ sửa, khung soạn trống). Test editor 1.1 vẫn PASS; mọi test cũ vẫn PASS.

- [ ] **Step 4: `JournalEditor` chỉ xoá chữ khi đã ghi được**

Trong `src/features/journal/components/journal-editor.tsx`:

4.1. Trong `interface JournalEditorProps`, thay dòng

```ts
  onSave: (input: { text: string; words: number; mood: MoodSnapshot | null }) => void
```

bằng:

```ts
  // true = đã ghi được. false (bộ nhớ đầy, bài đã bị xoá ở tab khác...) thì khung soạn giữ nguyên chữ.
  onSave: (input: { text: string; words: number; mood: MoodSnapshot | null }) => boolean
```

4.2. Thay hàm

```ts
  function handleSave() {
    const plainText = ref.current?.innerText?.trim() ?? ""
    if (!plainText) return
    const html = sanitizeJournalHtml(ref.current?.innerHTML ?? "")
    onSave({ text: html, words, mood: selectedMood })
    if (ref.current) ref.current.innerHTML = ""
    setWords(0)
  }
```

bằng:

```ts
  function handleSave() {
    const plainText = ref.current?.innerText?.trim() ?? ""
    if (!plainText) return
    const html = sanitizeJournalHtml(ref.current?.innerHTML ?? "")
    // Ghi không được thì giữ nguyên chữ — toast lỗi bảo "thử lại", nên phải còn chữ để thử lại.
    if (!onSave({ text: html, words, mood: selectedMood })) return
    if (ref.current) ref.current.innerHTML = ""
    setWords(0)
  }
```

- [ ] **Step 5: `JournalView.handleSave` báo kết quả và chỉ rời chế độ sửa khi đã ghi**

Trong `src/features/journal/components/journal-view.tsx`, thay hàm

```ts
  function handleSave(input: { text: string; words: number; mood: typeof selectedMoodSnapshot }) {
    if (editingEntry) {
      updateEntry(editingEntry.id, input)
      setEditingEntry(null)
      setMood("")
      return
    }
    const entry = saveEntry(input)
    if (entry) setJustSaved(entry)
  }
```

bằng:

```ts
  function handleSave(input: { text: string; words: number; mood: typeof selectedMoodSnapshot }): boolean {
    if (editingEntry) {
      // Ghi lỗi (hay bài vừa bị xoá ở tab khác) thì ở lại chế độ sửa: khung soạn còn nguyên chữ để thử lại.
      if (!updateEntry(editingEntry.id, input)) return false
      setEditingEntry(null)
      setMood("")
      return true
    }
    const entry = saveEntry(input)
    if (!entry) return false
    setJustSaved(entry)
    return true
  }
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/components/journal-editor.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx src/features/journal/__tests__/hooks/use-journal.test.ts`
Expected: PASS toàn bộ — kể cả test cũ "Huỷ sửa cancels editing without changing the entry" và "clicking Sửa on an entry prefills the editor and updates it instead of creating a new one".

- [ ] **Step 7: Tự review diff rồi commit**

Run: `git diff` — khung soạn chỉ xoá chữ sau `onSave` trả `true`; `JournalView` không gọi `setEditingEntry(null)` khi `updateEntry` trả `false`.

```bash
git add src/features/journal/components/journal-editor.tsx src/features/journal/components/journal-view.tsx src/features/journal/__tests__/components/journal-editor.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx
git commit -m "fix: keep the journal editor's text when saving or updating fails"
```

---

### Task 6: Bài của năm khác hiện kèm năm (Quyết định 3)

**Files:**
- Modify: `src/lib/date.ts` (hàm mới `formatShortDate` + export)
- Modify: `src/features/journal/components/journal-entries-card.tsx` (import, helper `entryDateLabel`, dòng ngày, tên nút Sửa)
- Modify: `src/features/overview/components/journal-summary-section.tsx:1-8` (import), `:30-32` (dòng ngày)
- Test: `src/lib/__tests__/date.test.ts`, `src/features/journal/__tests__/components/journal-entries-card.test.tsx`, `src/features/overview/__tests__/components/journal-summary-section.test.tsx`

**Interfaces:**
- Consumes: `entry.id` = timestamp lúc lưu (`saveEntry` dùng `now.getTime()`).
- Produces:
  - `formatShortDate(d: Date, now: Date = new Date()): string` (`@/lib/date`) — `"dd/mm"` nếu `d` cùng năm với `now`, `"dd/mm/yyyy"` nếu khác năm.
  - `JournalEntriesCard`: hàm nội bộ `entryDateLabel(entry: JournalEntry): string` (= `formatShortDate(new Date(entry.id))`), biến `dateLabel` trong vòng lặp; dòng ngày `"<dateLabel> · <time> · <words> từ"`, nút sửa `aria-label="Sửa bài <dateLabel> <time>"`. Task 7 dùng `dateLabel` cho nút xoá và `entryDateLabel` cho hộp xác nhận.
  - `JournalSummarySection` (Tổng quan → "Bài gần đây"): dòng ngày `"<formatShortDate(new Date(entry.id))> · <time> · <words> từ"`.
  - `entry.date` không đổi gì (vẫn lưu `dd/mm`, không đọc ở 2 nơi này nữa). `OnThisDayCard` giữ nguyên `entry.date` — tiêu đề "1 năm trước, bạn đã viết" đã nói rõ năm.

- [ ] **Step 1: Viết test thất bại cho `formatShortDate`**

Trong `src/lib/__tests__/date.test.ts`, thêm `formatShortDate,` vào khối import (ngay sau dòng `formatMonthKey,`), rồi thêm vào cuối file:

```ts
describe("formatShortDate", () => {
  const now = new Date(2026, 8, 30, 9, 0)

  it("shows dd/mm for a date in the same year as now", () => {
    expect(formatShortDate(new Date(2026, 8, 29, 8, 30), now)).toBe("29/09")
    expect(formatShortDate(new Date(2026, 0, 5), now)).toBe("05/01")
  })

  it("adds the year for a date in another year", () => {
    expect(formatShortDate(new Date(2025, 8, 29, 8, 30), now)).toBe("29/09/2025")
    expect(formatShortDate(new Date(2027, 0, 5), now)).toBe("05/01/2027")
  })
})
```

- [ ] **Step 2: Viết test thất bại cho danh sách bài và Tổng quan**

2.1. `src/features/journal/__tests__/components/journal-entries-card.test.tsx` — fixture dùng timestamp thật (ngày hiển thị giờ lấy từ `entry.id`) và đồng hồ ghim:

- Dòng import vitest đổi thành `import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"`.
- Trong `SHORT_ENTRY`, thay `id: 1,` bằng `id: new Date(2026, 7, 10, 9, 0).getTime(),`.
- Trong `LONG_ENTRY`, thay `id: 2,` bằng `id: new Date(2026, 7, 11, 20, 0).getTime(),`.
- Ngay đầu thân `describe("JournalEntriesCard", () => {` thêm:

```ts
  beforeEach(() => {
    // Ngày hiển thị so năm của bài với năm hiện tại — ghim "hôm nay" vào 30/09/2026 cho mọi test.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })
```

- Test `"calls onDelete with the matching entry's id when its delete button is clicked"`: thay `expect(onDelete).toHaveBeenCalledWith(1)` bằng `expect(onDelete).toHaveBeenCalledWith(SHORT_ENTRY.id)`.
- Test `"flashes only the entry matching highlightEntryId, not other entries"`: thay `highlightEntryId={1}` bằng `highlightEntryId={SHORT_ENTRY.id}` và `document.getElementById("journal-entry-1")` bằng ``document.getElementById(`journal-entry-${SHORT_ENTRY.id}`)`` (`other` với `id: 4` và `"journal-entry-4"` giữ nguyên).
- Thêm vào cuối `describe("JournalEntriesCard", ...)`:

```ts
  it("adds the year to the date of an entry written in another year, in the list and in the edit button's name", () => {
    const lastYear: JournalEntry = { ...SHORT_ENTRY, id: new Date(2025, 7, 10, 9, 0).getTime() }
    render(<JournalEntriesCard entries={[SHORT_ENTRY, lastYear]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("10/08/2025 · 09:00 · 3 từ")).toBeInTheDocument()
    expect(screen.getByText("10/08 · 09:00 · 3 từ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sửa bài 10/08/2025 09:00" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sửa bài 10/08 09:00" })).toBeInTheDocument()
  })
```

2.2. `src/features/overview/__tests__/components/journal-summary-section.test.tsx` — dòng import vitest đổi thành `import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"`, rồi thêm vào cuối file:

```ts
describe("JournalSummarySection — ngày của bài", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows dd/mm for this year's entries and adds the year for an entry from another year", () => {
    render(
      <JournalSummarySection
        entries={[
          { ...ENTRY, id: new Date(2026, 7, 10, 9, 0).getTime() },
          { ...ENTRY, id: new Date(2025, 7, 10, 9, 0).getTime(), text: "Bài năm ngoái" },
        ]}
      />
    )

    expect(screen.getByText("10/08 · 09:00 · 5 từ")).toBeInTheDocument()
    expect(screen.getByText("10/08/2025 · 09:00 · 5 từ")).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/lib/__tests__/date.test.ts src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/overview/__tests__/components/journal-summary-section.test.tsx`
Expected: FAIL đúng 4 test mới — `TypeError: formatShortDate is not a function` (2 test), `Unable to find an element with the text: 10/08/2025 · 09:00 · 3 từ`, và ở Tổng quan `Found multiple elements with the text: 10/08 · 09:00 · 5 từ` (cả 2 bài đều hiện `entry.date`). Các test cũ đã sửa fixture vẫn PASS.

- [ ] **Step 4: Thêm `formatShortDate`**

Trong `src/lib/date.ts`, ngay sau hàm `formatDayKeyWithYear` thêm:

```ts
// "dd/mm" khi cùng năm với `now`, "dd/mm/yyyy" khi khác năm — năm nay nhìn gọn như cũ, còn 29/09 năm
// ngoái không lẫn với 29/09 năm nay.
function formatShortDate(d: Date, now: Date = new Date()): string {
  const dayMonth = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
  return d.getFullYear() === now.getFullYear() ? dayMonth : `${dayMonth}/${d.getFullYear()}`
}
```

và trong khối `export { ... }` cuối file thêm `formatShortDate,` ngay sau dòng `formatMonthKey,`.

- [ ] **Step 5: Danh sách bài và Tổng quan lấy ngày từ `entry.id`**

5.1. `src/features/journal/components/journal-entries-card.tsx`:

- Ngay trên dòng `import { cn } from "@/lib/utils"` thêm `import { formatShortDate } from "@/lib/date"`.
- Ngay sau dòng `const TRUNCATE_LENGTH = 180` thêm:

```ts

// entry.date chỉ lưu dd/mm (không có năm) — ngày hiển thị lấy từ entry.id (timestamp lúc lưu) để bài của
// năm khác hiện kèm năm, và 2 bài cùng ngày khác năm không trùng tên nút Sửa/Xoá.
function entryDateLabel(entry: JournalEntry): string {
  return formatShortDate(new Date(entry.id))
}
```

- Trong vòng `entries.map`, ngay sau dòng `const isHighlighted = entry.id === highlightEntryId` thêm `const dateLabel = entryDateLabel(entry)`.
- Thay `{entry.date} · {entry.time} · {entry.words} từ` bằng `{dateLabel} · {entry.time} · {entry.words} từ`.
- Thay ``aria-label={`Sửa bài ${entry.date} ${entry.time}`}`` bằng ``aria-label={`Sửa bài ${dateLabel} ${entry.time}`}``.

5.2. `src/features/overview/components/journal-summary-section.tsx`:

- Ngay dưới dòng `import { stripHtmlToPlainText } from "@/features/journal/journal-html"` thêm `import { formatShortDate } from "@/lib/date"`.
- Thay `{entry.date} · {entry.time} · {entry.words} từ` bằng `{formatShortDate(new Date(entry.id))} · {entry.time} · {entry.words} từ`.

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/lib/__tests__/date.test.ts src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/overview/__tests__/components/journal-summary-section.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx src/features/journal/__tests__/components/on-this-day-card.test.tsx`
Expected: PASS toàn bộ (test cũ `"10/08 · 09:00 · 3 từ"`, `"Sửa bài 10/08 09:00"` vẫn đúng vì bài năm 2026 và "hôm nay" ghim năm 2026; các nút `"Sửa bài 28/09 20:00"` của Task 5 không đổi).

- [ ] **Step 7: Tự review diff rồi commit**

Run: `git diff` — không còn chỗ nào trong 2 component này đọc `entry.date`; `OnThisDayCard` không đổi.

```bash
git add src/lib/date.ts src/lib/__tests__/date.test.ts src/features/journal/components/journal-entries-card.tsx src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/overview/components/journal-summary-section.tsx src/features/overview/__tests__/components/journal-summary-section.test.tsx
git commit -m "fix: show the year on journal entries from another year"
```

---

### Task 7: Xoá bài phải xác nhận; xoá đúng bài đang sửa thì rời chế độ sửa (Quyết định 2)

**Files:**
- Modify: `src/features/journal/components/journal-entries-card.tsx` (import, state `deletingId`, nút xoá, `AlertDialog`)
- Modify: `src/features/journal/components/journal-view.tsx` (`handleCancelEdit` → `leaveEditMode`, `handleSave`, `handleDelete` mới, 2 prop)
- Test: `src/features/journal/__tests__/components/journal-entries-card.test.tsx`, `src/features/journal/__tests__/components/journal-view.test.tsx`

**Interfaces:**
- Consumes: `AlertDialog` (`@/components/ui/alert-dialog`: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `onConfirm`, `destructive`; nút huỷ mặc định "Huỷ"; mô tả nằm trong `<p>`); `entryDateLabel`, `dateLabel` (Task 6); `deleteEntry(id): boolean` (Task 4); `handleSave(input): boolean` (Task 5).
- Produces:
  - `JournalEntriesCard`: nút thùng rác `aria-label="Xoá bài <dateLabel> <time>"` chỉ mở hộp xác nhận (state `deletingId: number | null`); `onDelete(id)` chỉ được gọi khi bấm "Xoá" trong hộp. `JournalEntriesCardProps` không đổi.
  - `JournalView`: `leaveEditMode()` (thay `handleCancelEdit`, dùng cho Huỷ sửa, Cập nhật xong, xoá đúng bài đang sửa) và `handleDelete(id: number)` (truyền làm `onDelete` của danh sách). Task 9 sửa thân `leaveEditMode`.

- [ ] **Step 1: Viết test thất bại cho danh sách bài**

Trong `src/features/journal/__tests__/components/journal-entries-card.test.tsx`, thay nguyên test (bản đã sửa ở Task 6)

```ts
  it("calls onDelete with the matching entry's id when its delete button is clicked", () => {
    const onDelete = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={onDelete} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài" }))

    expect(onDelete).toHaveBeenCalledWith(SHORT_ENTRY.id)
  })
```

bằng:

```ts
  it("asks for confirmation, naming the entry's time and date, instead of deleting on the first tap", () => {
    const onDelete = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={onDelete} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 10/08 09:00" }))

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByText("Xoá bài nhật ký?")).toBeInTheDocument()
    const when = screen.getByText("09:00 ngày 10/08", { selector: "strong" })
    expect(when.closest("p")).toHaveTextContent("Xoá bài viết lúc 09:00 ngày 10/08 sẽ không thể hoàn tác.")
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("calls onDelete with the entry's id only after Xoá is confirmed", () => {
    const onDelete = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={onDelete} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 10/08 09:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onDelete).toHaveBeenCalledWith(SHORT_ENTRY.id)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("keeps the entry when the confirmation is cancelled", () => {
    const onDelete = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={onDelete} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 10/08 09:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("names each delete button after its entry's date and time, so entries of the same day are told apart", () => {
    const evening: JournalEntry = { ...SHORT_ENTRY, id: new Date(2026, 7, 10, 21, 30).getTime(), time: "21:30" }
    render(<JournalEntriesCard entries={[evening, SHORT_ENTRY]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Xoá bài 10/08 21:30" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xoá bài 10/08 09:00" })).toBeInTheDocument()
  })
```

- [ ] **Step 2: Viết test thất bại cho trang Nhật ký**

Thêm vào cuối `describe("JournalView — sửa, xoá và giữ nội dung đang viết", ...)` trong `src/features/journal/__tests__/components/journal-view.test.tsx`:

```ts
  it("leaves edit mode when the entry being edited is deleted", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 28/09 20:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(screen.queryByRole("button", { name: "Cập nhật bài viết" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeInTheDocument()
    expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument()
  })

  it("stays in edit mode, keeping the typed text, when a different entry is deleted", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A đang sửa")
    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 27/09 21:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài A đang sửa")
    expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument()
  })
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: FAIL đúng 6 test mới — `Unable to find an accessible element with the role "button" and name "Xoá bài 10/08 09:00"` (nút vẫn tên "Xoá bài") ở 4 test của danh sách và `… name "Xoá bài 28/09 20:00"` / `"Xoá bài 27/09 21:00"` ở 2 test của trang. Mọi test cũ vẫn PASS.

- [ ] **Step 4: Hộp xác nhận trong `JournalEntriesCard`**

Trong `src/features/journal/components/journal-entries-card.tsx`:

4.1. Ngay trên dòng `import { Card } from "@/components/ui/card"` thêm `import { AlertDialog } from "@/components/ui/alert-dialog"`.

4.2. Ngay sau dòng `const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())` thêm:

```ts
  // Xoá là mất hẳn (không hoàn tác) — nút thùng rác chỉ mở hộp xác nhận, như mọi nút xoá ở trang Tài chính.
  const [deletingId, setDeletingId] = useState<number | null>(null)
  // Tra lại theo id mỗi lần render: bài đã biến mất (vd. bị xoá ở tab khác) thì hộp tự đóng.
  const deleting = entries.find((entry) => entry.id === deletingId) ?? null
```

4.3. Thay nút thùng rác

```tsx
                <button
                  type="button"
                  aria-label="Xoá bài"
                  onClick={() => onDelete(entry.id)}
```

bằng:

```tsx
                <button
                  type="button"
                  aria-label={`Xoá bài ${dateLabel} ${entry.time}`}
                  onClick={() => setDeletingId(entry.id)}
```

(phần `className` và icon `<Trash2 size={17} />` giữ nguyên).

4.4. Thay đoạn cuối của component

```tsx
      ) : (
        <Empty pose="book" title="Chưa có bài nào" hint="Bài đầu tiên bạn lưu sẽ hiện ở đây." />
      )}
    </Card>
```

bằng:

```tsx
      ) : (
        <Empty pose="book" title="Chưa có bài nào" hint="Bài đầu tiên bạn lưu sẽ hiện ở đây." />
      )}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xoá bài nhật ký?"
        description={
          deleting ? (
            <>
              Xoá bài viết lúc{" "}
              <strong>
                {deleting.time} ngày {entryDateLabel(deleting)}
              </strong>{" "}
              sẽ không thể hoàn tác.
            </>
          ) : null
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deleting) onDelete(deleting.id)
        }}
      />
    </Card>
```

- [ ] **Step 5: `JournalView` rời chế độ sửa khi xoá đúng bài đang sửa**

Trong `src/features/journal/components/journal-view.tsx`:

5.1. Trong `handleSave` (bản của Task 5), thay 2 dòng

```ts
      setEditingEntry(null)
      setMood("")
      return true
```

bằng:

```ts
      leaveEditMode()
      return true
```

5.2. Thay hàm

```ts
  function handleCancelEdit() {
    setEditingEntry(null)
    setMood("")
  }
```

bằng:

```ts
  // Dùng chung cho Huỷ sửa, Cập nhật xong và xoá đúng bài đang sửa.
  function leaveEditMode() {
    setEditingEntry(null)
    setMood("")
  }

  function handleDelete(id: number) {
    // Xoá đúng bài đang sửa thì rời chế độ sửa — không thì nút "Cập nhật" trỏ vào 1 bài không còn nữa.
    if (deleteEntry(id) && editingEntry?.id === id) leaveEditMode()
  }
```

5.3. Trong JSX: `onCancelEdit={handleCancelEdit}` đổi thành `onCancelEdit={leaveEditMode}`; `onDelete={deleteEntry}` đổi thành `onDelete={handleDelete}`.

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx src/components/__tests__/ui/alert-dialog.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 7: Tự review diff rồi commit**

Run: `git diff` — nút thùng rác không còn gọi `onDelete` trực tiếp; mô tả hộp là inline content (text + `<strong>`) nằm trong `<p>` của `AlertDialog`; không còn tham chiếu `handleCancelEdit`.

```bash
git add src/features/journal/components/journal-entries-card.tsx src/features/journal/components/journal-view.tsx src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx
git commit -m "change: confirm before deleting a journal entry and leave edit mode when it is the one being edited"
```

---

### Task 8: Sửa bài giữ nguyên mood đã lưu; chip mood báo trạng thái chọn

**Files:**
- Modify: `src/features/journal/components/mood-picker-card.tsx` (toàn bộ file)
- Modify: `src/features/journal/components/journal-view.tsx:15` (import type), `:26-29` (snapshot mood), `:94` (`MoodPickerCard`)
- Create: `src/features/journal/__tests__/components/mood-picker-card.test.tsx`
- Test: `src/features/journal/__tests__/components/journal-view.test.tsx`

**Interfaces:**
- Consumes: `Mood` (`@/lib/settings-storage`: `label`, `emoji`, `desc`, `tint`, `on`, `score`), `MoodSnapshot` (`../types`: `emoji`, `label`, `tint`, `score`); `editingEntry` của `JournalView`. Cài đặt mặc định có sẵn 3 mood tắt: "Lo lắng", "Buồn", "Căng thẳng".
- Produces:
  - `MoodPickerCardProps.entryMood?: MoodSnapshot | null` — mood đã lưu của bài đang sửa; nếu nó không nằm trong các mood đang bật (đã tắt hoặc đã bị xoá khỏi Cài đặt) thì vẫn hiện thêm 1 chip cho nó ở cuối hàng. Mỗi chip có `aria-pressed={active}`.
  - `JournalView`: `keptEntryMood` — bài đang sửa vẫn chọn đúng label của mood đã lưu thì `selectedMoodSnapshot` là chính snapshot đã lưu (không dựng lại từ Cài đặt); chọn mood khác thì dựng từ Cài đặt như cũ; bỏ chọn thì `null`. `selectedMoodSnapshot` có kiểu `MoodSnapshot | null`.

- [ ] **Step 1: Viết test thất bại cho `MoodPickerCard`**

Tạo `src/features/journal/__tests__/components/mood-picker-card.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import type { Mood } from "@/lib/settings-storage"
import { MoodPickerCard } from "../../components/mood-picker-card"

const MOODS: Mood[] = [
  { label: "Vui", emoji: "🙂", desc: "Tâm trạng tốt", tint: "#FFE0C7", on: true, score: 4 },
  { label: "Mệt", emoji: "😴", desc: "Thiếu năng lượng", tint: "#EAF1FE", on: true, score: 2 },
  { label: "Buồn", emoji: "😔", desc: "Hơi trũng", tint: "#E4E9F2", on: false, score: 1 },
]

describe("MoodPickerCard", () => {
  it("tells screen readers which chip is selected with aria-pressed", () => {
    render(<MoodPickerCard moods={MOODS} selected="Vui" onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Vui")
    expect(screen.getByText("Mệt").closest("button")).toHaveAttribute("aria-pressed", "false")
  })

  it("does not show a switched-off mood when no entry needs it", () => {
    render(<MoodPickerCard moods={MOODS} selected="" onSelect={vi.fn()} />)

    expect(screen.queryByText("Buồn")).not.toBeInTheDocument()
  })

  it("still shows the edited entry's mood after it was switched off, selected and clearable", () => {
    const onSelect = vi.fn()
    const entryMood = { emoji: "😔", label: "Buồn", tint: "#E4E9F2", score: 1 }
    render(<MoodPickerCard moods={MOODS} selected="Buồn" onSelect={onSelect} entryMood={entryMood} />)

    const chip = screen.getByRole("button", { pressed: true })
    expect(chip).toHaveTextContent("Buồn")

    fireEvent.click(chip)
    expect(onSelect).toHaveBeenCalledWith("")
  })

  it("still shows the edited entry's mood after it was deleted from Settings", () => {
    const entryMood = { emoji: "🥳", label: "Phấn khích", tint: "#FFF0B8", score: 5 }
    render(<MoodPickerCard moods={MOODS} selected="Phấn khích" onSelect={vi.fn()} entryMood={entryMood} />)

    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("🥳Phấn khích")
  })

  it("does not repeat the entry's mood when it is still switched on", () => {
    const entryMood = { emoji: "🙂", label: "Vui", tint: "#FFE0C7", score: 4 }
    render(<MoodPickerCard moods={MOODS} selected="Vui" onSelect={vi.fn()} entryMood={entryMood} />)

    expect(screen.getAllByText("Vui")).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Viết test thất bại cho trang Nhật ký**

Thêm vào cuối `describe("JournalView — sửa, xoá và giữ nội dung đang viết", ...)` trong `src/features/journal/__tests__/components/journal-view.test.tsx`:

```ts
  it("keeps the saved mood when only the text is edited, even after that mood was deleted from Settings", async () => {
    const savedMood = { emoji: "🥳", label: "Phấn khích", tint: "#FFF0B8", score: 5 } // không có trong Cài đặt
    seedEntries({ ...ENTRY_A, mood: savedMood }, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Phấn khích")

    typeInto(screen.getByRole("textbox"), "Bài A chỉ sửa chữ")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0]).toMatchObject({ text: "Bài A chỉ sửa chữ", mood: savedMood })
  })

  it("shows a switched-off mood of the edited entry as selected, and lets it be cleared", async () => {
    const savedMood = { emoji: "😔", label: "Buồn", tint: "#E4E9F2", score: 1 } // "Buồn" tắt sẵn trong Cài đặt mặc định
    seedEntries({ ...ENTRY_A, mood: savedMood }, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    const chip = screen.getByRole("button", { pressed: true })
    expect(chip).toHaveTextContent("Buồn")

    fireEvent.click(chip)
    typeInto(screen.getByRole("textbox"), "Bài A bỏ tâm trạng")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].mood).toBeNull()
  })

  it("keeps the stored mood snapshot instead of rebuilding it from the current Settings", async () => {
    // Cài đặt mặc định hiện có "Vui" với tint #FFE0C7, score 4 — bài này lưu bản cũ hơn.
    const savedMood = { emoji: "🙂", label: "Vui", tint: "#ABCDEF", score: 3 }
    seedEntries({ ...ENTRY_A, mood: savedMood }, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A sửa chữ")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].mood).toEqual(savedMood)
  })
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/components/mood-picker-card.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: FAIL đúng 6 test — ở `MoodPickerCard`: "tells screen readers…" (`Unable to find an accessible element with the role "button"` — chưa chip nào có `aria-pressed`), "…switched off…" và "…deleted from Settings" (chip không hiện); ở trang: 2 test đầu (`Unable to find an accessible element with the role "button"` vì chip của mood đã xoá/đã tắt không hiện) và test snapshot (`expected { emoji: '🙂', label: 'Vui', tint: '#FFE0C7', score: 4 } to deeply equal { …, tint: '#ABCDEF', score: 3 }`). 2 test "does not show a switched-off mood…" và "does not repeat the entry's mood…" đã PASS sẵn (rào chắn). Mọi test cũ vẫn PASS.

- [ ] **Step 4: Viết lại `mood-picker-card.tsx`**

Thay toàn bộ nội dung `src/features/journal/components/mood-picker-card.tsx` bằng:

```tsx
"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Mood } from "@/lib/settings-storage"
import type { MoodSnapshot } from "../types"

interface MoodPickerCardProps {
  moods: Mood[]
  selected: string
  onSelect: (label: string) => void
  // Mood đã lưu của bài đang sửa: vẫn hiện thành 1 chip (để thấy nó đang được chọn và bỏ chọn được) kể cả
  // khi mood đó đã bị tắt hay đã bị xoá khỏi Cài đặt.
  entryMood?: MoodSnapshot | null
}

function MoodPickerCard({ moods, selected, onSelect, entryMood = null }: MoodPickerCardProps) {
  const activeMoods = moods.filter((m) => m.on)
  const chips: Pick<MoodSnapshot, "label" | "emoji">[] =
    entryMood && !activeMoods.some((m) => m.label === entryMood.label) ? [...activeMoods, entryMood] : activeMoods

  return (
    <Card label="Tâm trạng hôm nay">
      <div className="flex flex-wrap gap-2">
        {chips.map((m) => {
          const active = m.label === selected
          return (
            <button
              key={m.label}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? "" : m.label)}
              className={cn(
                "inline-flex min-h-[var(--ob-hit-min)] items-center gap-[9px] rounded-[var(--ob-radius-pill)] border-[1.5px] px-[15px] py-[9px] text-[13px] font-semibold",
                active
                  ? "border-transparent bg-[#FDEBF2] text-[#B92E63]"
                  : "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"
              )}
            >
              <span className="text-base leading-none">{m.emoji}</span>
              {m.label}
            </button>
          )
        })}
        {!activeMoods.length ? (
          <span className="text-[13.5px] text-[var(--ob-color-text-subtle)]">
            Chưa bật tâm trạng nào — mở Cài đặt để chọn.
          </span>
        ) : null}
      </div>
    </Card>
  )
}

export { MoodPickerCard }
```

- [ ] **Step 5: `JournalView` giữ snapshot mood đã lưu của bài đang sửa**

Trong `src/features/journal/components/journal-view.tsx`:

5.1. Thay `import type { JournalEntry } from "../types"` bằng `import type { JournalEntry, MoodSnapshot } from "../types"`.

5.2. Thay

```ts
  const selectedMood = settings.moods.find((m) => m.label === mood)
  const selectedMoodSnapshot = selectedMood
    ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint, score: selectedMood.score }
    : null
```

bằng:

```ts
  const selectedMood = settings.moods.find((m) => m.label === mood)
  // Bài đang sửa vẫn chọn đúng mood đã lưu thì giữ nguyên snapshot đã lưu (đóng băng như Expense.tag) — kể
  // cả khi mood đó đã bị tắt, bị xoá hay được tạo lại trong Cài đặt. Chỉ khi chọn mood khác (hoặc viết bài
  // mới) mới dựng snapshot từ Cài đặt.
  const keptEntryMood = editingEntry?.mood && editingEntry.mood.label === mood ? editingEntry.mood : null
  const selectedMoodSnapshot: MoodSnapshot | null =
    keptEntryMood ??
    (selectedMood
      ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint, score: selectedMood.score }
      : null)
```

5.3. Thay

```tsx
            <MoodPickerCard moods={settings.moods} selected={mood} onSelect={setMood} />
```

bằng:

```tsx
            <MoodPickerCard
              moods={settings.moods}
              selected={mood}
              onSelect={setMood}
              entryMood={editingEntry?.mood ?? null}
            />
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/components/mood-picker-card.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: PASS toàn bộ — kể cả test cũ "copies the selected mood's score into the saved journal snapshot" (bài mới vẫn dựng snapshot từ Cài đặt).

- [ ] **Step 7: Tự review diff rồi commit**

Run: `git diff` — bài mới vẫn lấy snapshot từ Cài đặt; chỉ bài đang sửa với đúng label đã lưu mới giữ snapshot cũ; `Mood`/`MoodSnapshot` và dữ liệu lưu không đổi shape.

```bash
git add src/features/journal/components/mood-picker-card.tsx src/features/journal/components/journal-view.tsx src/features/journal/__tests__/components/mood-picker-card.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx
git commit -m "fix: keep an edited journal entry's saved mood and announce the selected mood chip"
```

---

### Task 9: Giữ bản nháp bài mới khi bấm Sửa bài cũ; hỏi lại trước khi bỏ thay đổi của bài đang sửa (Quyết định 1)

**Files:**
- Modify: `src/features/journal/components/journal-editor.tsx` (props, state đầu, effect mount, `handleInput`, `handleClear`, export)
- Modify: `src/features/journal/components/journal-view.tsx` (toàn bộ file — bản sau Task 5, 7, 8)
- Test: `src/features/journal/__tests__/components/journal-editor.test.tsx`, `src/features/journal/__tests__/components/journal-view.test.tsx`

**Interfaces:**
- Consumes: `handleSave(input): boolean` (Task 5), `leaveEditMode`/`handleDelete` (Task 7), `keptEntryMood`/`selectedMoodSnapshot: MoodSnapshot | null`/prop `entryMood` (Task 8), chip mood có `aria-pressed` (Task 8), `AlertDialog` (prop `cancelLabel` có sẵn).
- Produces:
  - `journal-editor.tsx` export thêm `type EditorDraft` (`interface EditorDraft { html: string; words: number }`). `JournalEditorProps` có thêm `initialDraft?: EditorDraft` (đặt `innerHTML` đã lọc qua `sanitizeJournalHtml` + số từ lúc mount, chỉ khi không có `editingEntry`) và `onDraftChange?: (draft: EditorDraft) => void` (gọi sau mỗi lần gõ/dán/kéo-thả với `innerHTML` thô + số từ, và sau "Xoá nháp" với `{ html: "", words: 0 }`; KHÔNG gọi khi lưu xong — nơi dùng tự xoá bản nháp khi `onSave` trả `true`).
  - `JournalView`: hằng `EMPTY_DRAFT`; state `draft: EditorDraft`, `draftMood: string`, `pendingEdit: JournalEntry | null`; ref `latestDraftRef` (nội dung khung soạn bài mới, ghi mỗi lần gõ) và `editDirtyRef` (bài đang sửa đã gõ/đổi mood); hàm `startEditing`, `leaveEditMode` (trả lại mood của bản nháp), `handleEdit`, `handleDraftChange`, `handleSelectMood`; hộp `AlertDialog` "Bỏ thay đổi chưa lưu?" (`confirmLabel="Bỏ thay đổi"`, `cancelLabel="Tiếp tục sửa"`, `destructive`). Không thêm key localStorage nào — bản nháp mất khi tải lại/rời trang (đúng Quyết định 1 B).

- [ ] **Step 1: Viết test thất bại cho khung soạn**

Thêm vào cuối `describe("JournalEditor", ...)` trong `src/features/journal/__tests__/components/journal-editor.test.tsx`:

```tsx
  it("shows the draft it was given when mounted for a new entry, ready to save", () => {
    render(
      <JournalEditor selectedMood={null} onSave={vi.fn()} initialDraft={{ html: "<b>Nháp</b> dở dang", words: 3 }} />
    )

    expect(screen.getByRole("textbox").innerHTML).toBe("<b>Nháp</b> dở dang")
    expect(screen.getByText("3 từ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeEnabled()
  })

  it("sanitizes the draft before putting it back into the editor", () => {
    render(
      <JournalEditor
        selectedMood={null}
        onSave={vi.fn()}
        initialDraft={{ html: '<b>Nháp</b><img src=x onerror="window.__xss = true">', words: 1 }}
      />
    )

    expect(screen.getByRole("textbox").innerHTML).toBe("<b>Nháp</b>")
  })

  it("shows the entry, not the draft, when mounted to edit an entry", () => {
    const entry: JournalEntry = { id: 1, text: "Bài viết cũ", time: "09:00", date: "10/08", words: 3, mood: null }
    render(
      <JournalEditor
        selectedMood={null}
        onSave={vi.fn()}
        editingEntry={entry}
        initialDraft={{ html: "Nháp", words: 1 }}
      />
    )

    expect(screen.getByRole("textbox").innerHTML).toBe("Bài viết cũ")
    expect(screen.getByText("3 từ")).toBeInTheDocument()
  })

  it("reports the editor content after typing and after Xoá nháp", () => {
    const onDraftChange = vi.fn()
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} onDraftChange={onDraftChange} />)

    typeInto(screen.getByRole("textbox"), "Đang viết nháp")
    expect(onDraftChange).toHaveBeenLastCalledWith({ html: "Đang viết nháp", words: 3 })

    fireEvent.click(screen.getByRole("button", { name: "Xoá nháp" }))
    expect(onDraftChange).toHaveBeenLastCalledWith({ html: "", words: 0 })
  })
```

- [ ] **Step 2: Viết test thất bại cho trang Nhật ký**

Thêm vào cuối `describe("JournalView — sửa, xoá và giữ nội dung đang viết", ...)` trong `src/features/journal/__tests__/components/journal-view.test.tsx` (khung soạn vừa remount chỉ có `innerHTML` trong jsdom — kiểm bằng `toHaveTextContent`, xem Global Constraints):

```ts
  it("keeps a half-written new entry and its mood while another entry is edited, and gives them back on Huỷ sửa", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    fireEvent.click(screen.getByText("Vui"))
    typeInto(editor, "Nháp bài mới hôm nay")

    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 28/09 20:00" }))
    expect(screen.getByRole("textbox")).toHaveTextContent(ENTRY_A.text)
    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument() // bài A không có mood

    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }))

    expect(screen.getByRole("textbox")).toHaveTextContent("Nháp bài mới hôm nay")
    expect(screen.getByText("5 từ")).toBeInTheDocument()
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Vui")
  })

  it("gives the new-entry draft back after the edited entry is updated, untouched by the edit", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    typeInto(await screen.findByRole("textbox"), "Nháp bài mới hôm nay")
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A đã sửa lỗi chính tả")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    expect(screen.getByText("Bài A đã sửa lỗi chính tả")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Nháp bài mới hôm nay")
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeEnabled()

    // Chữ gõ lúc sửa bài A không được lẫn vào bản nháp: sửa tiếp bài B rồi huỷ vẫn ra đúng bản nháp cũ.
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }))
    expect(screen.getByRole("textbox")).toHaveTextContent("Nháp bài mới hôm nay")
  })

  it("asks before discarding unsaved changes when switching from one edited entry to another", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    typeInto(screen.getByRole("textbox"), "Bài A sửa dở")
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))

    expect(screen.getByText("Bỏ thay đổi chưa lưu?")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục sửa" }))
    expect(screen.queryByText("Bỏ thay đổi chưa lưu?")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent("Bài A sửa dở")

    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Bỏ thay đổi" }))
    expect(screen.getByRole("textbox")).toHaveTextContent(ENTRY_B.text)
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].text).toBe(ENTRY_A.text)
  })

  it("also asks when only the mood of the entry being edited was changed", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    fireEvent.click(screen.getByText("Vui"))
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))

    expect(screen.getByText("Bỏ thay đổi chưa lưu?")).toBeInTheDocument()
  })

  it("switches straight to another entry when the one being edited has no changes", async () => {
    seedEntries(ENTRY_A, ENTRY_B)
    render(<JournalView />)

    fireEvent.click(await screen.findByRole("button", { name: "Sửa bài 28/09 20:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 27/09 21:00" }))

    expect(screen.queryByText("Bỏ thay đổi chưa lưu?")).not.toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveTextContent(ENTRY_B.text)
  })
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/components/journal-editor.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: FAIL đúng 7 test — ở khung soạn: "shows the draft…" (`expected '' to be '<b>Nháp</b> dở dang'`), "sanitizes the draft…" (`expected '' to be '<b>Nháp</b>'`), "reports the editor content…" (`expected "spy" to be called with arguments: [ { html: 'Đang viết nháp', words: 3 } ]`, không lần gọi nào); ở trang: 2 test bản nháp (`expected element to have text content "Nháp bài mới hôm nay"` — khung soạn trống) và 2 test hỏi lại (`Unable to find an element with the text: Bỏ thay đổi chưa lưu?`). 2 test "shows the entry, not the draft…" và "switches straight…" đã PASS sẵn (rào chắn). Mọi test cũ vẫn PASS.

- [ ] **Step 4: `JournalEditor` nhận bản nháp và báo nội dung**

Trong `src/features/journal/components/journal-editor.tsx`:

4.1. Thay khối (bản sau Task 5)

```ts
interface JournalEditorProps {
  selectedMood: MoodSnapshot | null
  // true = đã ghi được. false (bộ nhớ đầy, bài đã bị xoá ở tab khác...) thì khung soạn giữ nguyên chữ.
  onSave: (input: { text: string; words: number; mood: MoodSnapshot | null }) => boolean
  editingEntry?: JournalEntry | null
  onCancelEdit?: () => void
}

function JournalEditor({ selectedMood, onSave, editingEntry, onCancelEdit }: JournalEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [words, setWords] = useState(editingEntry?.words ?? 0)
  const isEditing = !!editingEntry
```

bằng:

```ts
interface EditorDraft {
  html: string
  words: number
}

interface JournalEditorProps {
  selectedMood: MoodSnapshot | null
  // true = đã ghi được. false (bộ nhớ đầy, bài đã bị xoá ở tab khác...) thì khung soạn giữ nguyên chữ.
  onSave: (input: { text: string; words: number; mood: MoodSnapshot | null }) => boolean
  editingEntry?: JournalEntry | null
  onCancelEdit?: () => void
  // Nội dung hiện lại lúc mount khi không sửa bài nào: bản nháp bài mới mà JournalView đã cất trong lúc
  // sửa 1 bài cũ (khung soạn remount mỗi lần đổi bài nên tự nó không giữ được).
  initialDraft?: EditorDraft
  // Gọi sau mỗi lần gõ/dán/kéo-thả/Xoá nháp — để JournalView cất bản nháp và biết bài đang sửa đã đổi.
  onDraftChange?: (draft: EditorDraft) => void
}

function JournalEditor({
  selectedMood,
  onSave,
  editingEntry,
  onCancelEdit,
  initialDraft,
  onDraftChange,
}: JournalEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [words, setWords] = useState(editingEntry?.words ?? initialDraft?.words ?? 0)
  const isEditing = !!editingEntry
```

4.2. Thay effect mount

```ts
  useEffect(() => {
    if (ref.current && editingEntry) {
      ref.current.innerHTML = sanitizeJournalHtml(editingEntry.text)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy 1 lần lúc mount
  }, [])
```

bằng:

```ts
  useEffect(() => {
    if (!ref.current) return
    if (editingEntry) ref.current.innerHTML = sanitizeJournalHtml(editingEntry.text)
    // Bản nháp là innerHTML thô lúc đang gõ — vẫn lọc lại trước khi gắn vào DOM, như mọi HTML khác.
    else if (initialDraft) ref.current.innerHTML = sanitizeJournalHtml(initialDraft.html)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy 1 lần lúc mount
  }, [])
```

4.3. Thay

```ts
  function handleInput() {
    const text = ref.current?.innerText?.trim() ?? ""
    setWords(text ? text.split(/\s+/).length : 0)
  }
```

bằng:

```ts
  function handleInput() {
    const text = ref.current?.innerText?.trim() ?? ""
    const nextWords = text ? text.split(/\s+/).length : 0
    setWords(nextWords)
    onDraftChange?.({ html: ref.current?.innerHTML ?? "", words: nextWords })
  }
```

(dán và kéo-thả đi qua `insertSanitized` → `handleInput`, nên cũng báo luôn.)

4.4. Thay

```ts
  function handleClear() {
    if (ref.current) ref.current.innerHTML = ""
    setWords(0)
  }
```

bằng:

```ts
  function handleClear() {
    if (ref.current) ref.current.innerHTML = ""
    setWords(0)
    onDraftChange?.({ html: "", words: 0 })
  }
```

4.5. Dòng cuối `export { JournalEditor }` đổi thành `export { JournalEditor, type EditorDraft }`.

- [ ] **Step 5: Viết lại `journal-view.tsx`**

Thay toàn bộ nội dung `src/features/journal/components/journal-view.tsx` (bản sau Task 5, 7, 8) bằng:

```tsx
"use client"

import { useRef, useState } from "react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { longDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useJournal } from "../hooks/use-journal"
import { findOnThisDay } from "../journal-calculations"
import { JournalEditor, type EditorDraft } from "./journal-editor"
import { JournalEntriesCard } from "./journal-entries-card"
import { JournalSaveSuccess } from "./journal-save-success"
import { MoodPickerCard } from "./mood-picker-card"
import { OnThisDayCard } from "./on-this-day-card"
import type { JournalEntry, MoodSnapshot } from "../types"

const EMPTY_DRAFT: EditorDraft = { html: "", words: 0 }

function JournalView() {
  const { settings } = useSettings()
  const { entries, saveEntry, updateEntry, deleteEntry } = useJournal()
  const [mood, setMood] = useState("")
  const [justSaved, setJustSaved] = useState<JournalEntry | null>(null)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [highlight, setHighlight] = useState<{ id: number; nonce: number } | null>(null)
  // Bản nháp bài mới (chữ + số từ + mood) được cất lúc bấm Sửa 1 bài cũ — khung soạn remount mỗi lần đổi
  // bài nên tự nó không giữ được; Huỷ sửa hay Cập nhật xong thì khung soạn bài mới hiện lại đúng bản này.
  const [draft, setDraft] = useState<EditorDraft>(EMPTY_DRAFT)
  const [draftMood, setDraftMood] = useState("")
  // Bài muốn chuyển sang sửa trong lúc bài đang sửa còn thay đổi chưa cập nhật — mở hộp hỏi lại.
  const [pendingEdit, setPendingEdit] = useState<JournalEntry | null>(null)
  // 2 giá trị dưới chỉ đọc trong hàm xử lý sự kiện, không dùng để render — để trong ref thì mỗi phím gõ
  // không render lại cả trang (danh sách bài lọc HTML từng bài mỗi lần render).
  const latestDraftRef = useRef<EditorDraft>(EMPTY_DRAFT)
  const editDirtyRef = useRef(false)

  const moodEnabled = settings.modules.find((m) => m.key === "tamtrang")?.on ?? true
  const selectedMood = settings.moods.find((m) => m.label === mood)
  // Bài đang sửa vẫn chọn đúng mood đã lưu thì giữ nguyên snapshot đã lưu (đóng băng như Expense.tag) — kể
  // cả khi mood đó đã bị tắt, bị xoá hay được tạo lại trong Cài đặt. Chỉ khi chọn mood khác (hoặc viết bài
  // mới) mới dựng snapshot từ Cài đặt.
  const keptEntryMood = editingEntry?.mood && editingEntry.mood.label === mood ? editingEntry.mood : null
  const selectedMoodSnapshot: MoodSnapshot | null =
    keptEntryMood ??
    (selectedMood
      ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint, score: selectedMood.score }
      : null)
  const onThisDay = findOnThisDay(entries)

  function startEditing(entry: JournalEntry) {
    setJustSaved(null)
    setEditingEntry(entry)
    setMood(entry.mood?.label ?? "")
    editDirtyRef.current = false
  }

  // Dùng chung cho Huỷ sửa, Cập nhật xong và xoá đúng bài đang sửa: khung soạn bài mới hiện lại bản nháp
  // đã cất (prop initialDraft), mood quay về mood của bản nháp.
  function leaveEditMode() {
    setEditingEntry(null)
    setMood(draftMood)
    editDirtyRef.current = false
  }

  function handleSave(input: { text: string; words: number; mood: typeof selectedMoodSnapshot }): boolean {
    if (editingEntry) {
      // Ghi lỗi (hay bài vừa bị xoá ở tab khác) thì ở lại chế độ sửa: khung soạn còn nguyên chữ để thử lại.
      if (!updateEntry(editingEntry.id, input)) return false
      leaveEditMode()
      return true
    }
    const entry = saveEntry(input)
    if (!entry) return false
    // Bản nháp đã thành bài — lần sau khung soạn bài mới bắt đầu trống.
    latestDraftRef.current = EMPTY_DRAFT
    setDraft(EMPTY_DRAFT)
    setJustSaved(entry)
    return true
  }

  function handleEdit(entry: JournalEntry) {
    if (entry.id === editingEntry?.id) return
    if (editingEntry && editDirtyRef.current) {
      // Thay đổi của 1 bài cũ không có chỗ cất hợp lý — hỏi trước khi bỏ.
      setPendingEdit(entry)
      return
    }
    if (!editingEntry) {
      // Rời khung soạn bài mới: cất bản nháp và mood đang chọn để trả lại khi sửa xong.
      setDraft(latestDraftRef.current)
      setDraftMood(mood)
    }
    startEditing(entry)
  }

  function handleDraftChange(next: EditorDraft) {
    if (editingEntry) editDirtyRef.current = true
    else latestDraftRef.current = next
  }

  function handleSelectMood(label: string) {
    setMood(label)
    if (editingEntry) editDirtyRef.current = true
  }

  function handleDelete(id: number) {
    // Xoá đúng bài đang sửa thì rời chế độ sửa — không thì nút "Cập nhật" trỏ vào 1 bài không còn nữa.
    if (deleteEntry(id) && editingEntry?.id === id) leaveEditMode()
  }

  function handleViewEntries() {
    if (!justSaved) return
    // nonce buộc React remount đúng dòng đó để phát lại hiệu ứng nhấp nháy, kể cả khi
    // bấm liên tiếp nhiều lần vào cùng 1 bài (setState cùng id sẽ không tự re-render).
    setHighlight({ id: justSaved.id, nonce: Date.now() })
    const el = document.getElementById(`journal-entry-${justSaved.id}`) ?? document.getElementById("ds-entries")
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Nhật ký</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {longDate()} · viết bao nhiêu cũng được
      </p>
      <div className="ob-card-grid flex flex-wrap gap-5">
        <div className="min-w-0 flex-[1_1_100%]">
          {justSaved ? (
            <JournalSaveSuccess
              entry={justSaved}
              onWriteMore={() => setJustSaved(null)}
              onViewEntries={handleViewEntries}
            />
          ) : (
            <JournalEditor
              key={editingEntry?.id ?? "new"}
              selectedMood={selectedMoodSnapshot}
              onSave={handleSave}
              editingEntry={editingEntry}
              onCancelEdit={leaveEditMode}
              initialDraft={draft}
              onDraftChange={handleDraftChange}
            />
          )}
        </div>
        {onThisDay ? (
          <div className="min-w-0 flex-[1_1_100%]">
            <OnThisDayCard result={onThisDay} />
          </div>
        ) : null}
        {moodEnabled ? (
          <div className="min-w-0 flex-[1_1_300px] [&>*]:h-full">
            <MoodPickerCard
              moods={settings.moods}
              selected={mood}
              onSelect={handleSelectMood}
              entryMood={editingEntry?.mood ?? null}
            />
          </div>
        ) : null}
        <div
          className={cn(
            "min-w-0 [&>*]:h-full",
            entries.length ? "flex-[1_1_100%]" : "flex-[2_1_360px]"
          )}
        >
          <JournalEntriesCard
            entries={entries}
            onDelete={handleDelete}
            onEdit={handleEdit}
            highlightEntryId={highlight?.id ?? null}
            highlightNonce={highlight?.nonce}
          />
        </div>
      </div>
      <AlertDialog
        open={pendingEdit !== null}
        onOpenChange={(open) => !open && setPendingEdit(null)}
        title="Bỏ thay đổi chưa lưu?"
        description="Bài đang sửa có thay đổi chưa cập nhật. Chuyển sang sửa bài khác thì các thay đổi đó sẽ mất."
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục sửa"
        destructive
        onConfirm={() => {
          if (pendingEdit) startEditing(pendingEdit)
        }}
      />
    </div>
  )
}

export { JournalView }
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/components/journal-editor.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx src/features/journal/__tests__/components/journal-entries-card.test.tsx src/features/journal/__tests__/components/mood-picker-card.test.tsx`
Expected: PASS toàn bộ — kể cả test cũ "Huỷ sửa cancels editing without changing the entry" (bản nháp đã về trống sau lần lưu trước đó nên khung soạn vẫn `toBeEmptyDOMElement()`), các test của Task 5, 7, 8 trong describe mới, và "wraps the sections in the ob-card-grid entrance-animation class" (`AlertDialog` không render gì khi đóng).

- [ ] **Step 7: Tự review diff rồi commit**

Run: `git diff`
Kiểm: `latestDraftRef`/`editDirtyRef` chỉ được đọc/ghi trong hàm xử lý sự kiện (không trong thân render); không có `localStorage`/`sessionStorage` mới; `handleDraftChange` không ghi `latestDraftRef` khi đang sửa bài cũ; mọi đường rời chế độ sửa đều qua `leaveEditMode`.

```bash
git add src/features/journal/components/journal-editor.tsx src/features/journal/components/journal-view.tsx src/features/journal/__tests__/components/journal-editor.test.tsx src/features/journal/__tests__/components/journal-view.test.tsx
git commit -m "fix: keep the new-entry draft while an older journal entry is being edited"
```

---

### Task 10: Checkpoint — tsc, lint, toàn bộ test, kiểm tra tay

**Files:** không sửa file nào (nếu 1 bước dưới đây fail: quay về đúng task gây lỗi, sửa, chạy lại test của task đó, commit `fix: ...` riêng, rồi chạy lại từ đầu task này).

**Interfaces:**
- Consumes: toàn bộ Task 1–9.
- Produces: nhánh `fix/journal-review-fixes` sạch tsc/lint/test, sẵn sàng để chủ repo chạy "Kiểm tra tay" rồi duyệt merge vào `developer`.

- [ ] **Step 1: Kiểm kiểu**

Run: `npx tsc --noEmit`
Expected: không có lỗi (exit 0). Đặc biệt: không còn chỗ nào truyền cho `JournalEditor` một `onSave` trả `void`; `selectedMoodSnapshot` khớp `MoodSnapshot | null`; `chips` trong `mood-picker-card.tsx` nhận được cả `Mood` lẫn `MoodSnapshot`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error, 0 warning mới. Nếu `react-hooks/refs` báo ở `journal-view.tsx` → có chỗ đọc `latestDraftRef.current`/`editDirtyRef.current` trong thân render; chuyển vào hàm xử lý sự kiện (đúng như bản ở Task 9), không thêm `eslint-disable`.

- [ ] **Step 3: Toàn bộ test**

Run: `npm run test`
Expected: PASS toàn bộ suite — mọi file cũ + 47 test mới của plan này (1 test cũ bị thay ở Task 7): 5 `journal-html`, 5 `journal-calculations`, 3 `use-journal`, 5 `journal-editor`, 13 `journal-view`, 7 `journal-entries-card`, 2 `journal-summary-section`, 2 `date`, 5 `mood-picker-card` (file mới); `use-net-worth-history` chỉ sửa 3 test có sẵn.

- [ ] **Step 4: Tự review diff cả nhánh**

Run: `git diff developer --stat` rồi `git diff developer -- src/`
Kiểm: chỉ đụng các file trong mục "Cấu trúc file"; không đổi `journal-storage.ts`, `types.ts`, `sanitizeJournalHtml`, `auto-backup.tsx`, `/sandbox`, `EXPORT_VERSION`; không thêm key localStorage/sessionStorage; kết quả `stripHtmlToPlainText` chỉ được render như text con của React; `use-journal.ts` vẫn giữ `useStorageSync(JOURNAL_STORAGE_KEY, reload)` và mọi mutation vẫn mở đầu bằng `getStoredJournal()`, deps `[persist]`.

- [ ] **Step 5: Kiểm tra tay**

Chạy `npm run dev`, đăng nhập như thường, làm hết mục "Kiểm tra tay" ngay dưới đây trên bản cuối của nhánh.

### Kiểm tra tay

Trước khi bắt đầu: **Cài đặt → "Xuất file JSON"** để có bản sao lưu dữ liệu thật — mục H nạp lại file này để xoá sạch mọi bài/mood thử. "Tab A"/"Tab B" = 2 tab cùng trình duyệt, cùng địa chỉ app. Task 2 (ngày kỷ niệm cuối tháng, 29/02) và Task 3 (chỉ sửa test) không cần bấm tay — test đơn vị đã ghim đúng các ngày đó.

**A. Bản xem trước hiện đúng chữ (Task 1)**

- [ ] A.1 `/journal`: viết 1 bài 3 dòng (Enter giữa các dòng): `Tom & Jerry` / `3 < 5` / `hai  dấu cách` (gõ 2 dấu cách giữa "hai" và "dấu"). Lưu → "Viết thêm một bài". Mở `/overview` → "Bài gần đây": dòng xem trước của bài là `Tom & Jerry 3 < 5 hai dấu cách` trên 1 dòng — không có `&amp;`, `&lt;`, `&nbsp;`, các dòng không dính liền nhau (không có "Jerry3", "5hai").
- [ ] A.2 `/journal`: viết 1 bài dài hơn 180 ký tự gồm 4 dòng, mỗi dòng là `Hôm nay đi làm & về sớm, trời mát nên đi bộ một vòng quanh hồ.` → lưu. Trong "Nhật ký đã viết", bài hiện bản thu gọn: mỗi dòng nằm trên 1 hàng riêng, `&` hiện đúng, cuối có `…` và nút "Xem thêm". "Xem thêm" → bài đầy đủ; "Thu gọn" → về bản thu gọn.
- [ ] A.3 Viết 1 bài ngắn chỉ gồm `A & B & C & D & E & F & G & H & I & J & K & L & M & N & O` (khoảng 60 ký tự, nhiều `&`) → lưu: bài hiện đầy đủ, KHÔNG có nút "Xem thêm".

**B. Lưu/cập nhật không ghi được thì chữ vẫn còn (Task 4, 5)**

- [ ] B.1 `/journal`: gõ `Bài thử lỗi ghi` (chưa lưu). DevTools → Console, chạy:
  `window.__setItem = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException("Quota", "QuotaExceededError") }`
  Bấm "Lưu vào nhật ký" → toast đỏ "Không thể lưu bài viết. Vui lòng thử lại."; khung soạn vẫn còn `Bài thử lỗi ghi` và "4 từ"; không hiện thẻ "Đã lưu vào nhật ký".
- [ ] B.2 Console: `Storage.prototype.setItem = window.__setItem` → bấm "Lưu vào nhật ký" lần nữa → thẻ "Đã lưu vào nhật ký". Bấm "Viết thêm một bài".
- [ ] B.3 Bấm bút chì ở bài `Bài thử lỗi ghi`, sửa thành `Bài thử lỗi ghi sửa`. Console chạy lại dòng chặn ghi ở B.1 → "Cập nhật bài viết" → toast đỏ "Không thể cập nhật bài viết. Vui lòng thử lại."; vẫn ở chế độ sửa (nút "Cập nhật bài viết" và "Huỷ sửa"), chữ vừa sửa còn nguyên. Console trả lại như B.2 → "Cập nhật bài viết" → toast "Đã cập nhật bài viết", danh sách hiện chữ mới.

**C. Bài bị xoá ở tab khác trong lúc đang sửa (Task 4, 5)**

- [ ] C.1 Mở `/journal` ở Tab A và Tab B. Tab A: bấm bút chì ở bài `Bài thử lỗi ghi sửa`, gõ thêm vài chữ (chưa Cập nhật).
- [ ] C.2 Tab B: xoá đúng bài đó (thùng rác → "Xoá").
- [ ] C.3 Tab A (không tải lại): bài đã biến khỏi danh sách, khung soạn vẫn ở chế độ sửa với chữ đang gõ. Bấm "Cập nhật bài viết" → toast đỏ "Không cập nhật được: bài này đã bị xoá (có thể ở tab khác). Nội dung bạn vừa sửa vẫn còn trong khung soạn."; chữ vẫn còn; danh sách KHÔNG có bài mới nào mang ngày hôm nay. Bấm "Huỷ sửa".

**D. Xoá bài phải xác nhận (Task 7)**

- [ ] D.1 Viết 2 bài ngắn `Bài thử xoá 1` và `Bài thử xoá 2`. Bấm thùng rác ở `Bài thử xoá 1` → hộp "Xoá bài nhật ký?" với dòng "Xoá bài viết lúc HH:mm ngày dd/mm sẽ không thể hoàn tác." (đúng giờ, ngày của bài đó); bài chưa mất.
- [ ] D.2 Bấm "Huỷ" → hộp đóng, bài còn. Mở lại rồi đóng bằng phím Esc, rồi bằng bấm ra vùng mờ ngoài hộp → bài vẫn còn.
- [ ] D.3 Mở lại → "Xoá" → toast "Đã xoá bài viết", bài biến mất.
- [ ] D.4 Bấm bút chì ở `Bài thử xoá 2` (khung soạn chuyển sang "Cập nhật bài viết"), rồi bấm thùng rác của chính bài đó → "Xoá" → khung soạn trở về chế độ viết bài mới ("Lưu vào nhật ký", "Xoá nháp").
- [ ] D.5 (tuỳ chọn) DevTools → Elements → chọn 1 nút thùng rác → tab Accessibility: tên là "Xoá bài dd/mm HH:mm", mỗi bài 1 tên khác nhau.

**E. Bài năm khác có năm (Task 6)**

- [ ] E.1 Console ở `/journal`, chạy rồi tải lại trang (F5):
  `const k = "journal-entries"; const s = JSON.parse(localStorage.getItem(k) ?? '{"entries":[]}'); s.entries.unshift({ id: new Date(2025, 8, 29, 8, 30).getTime(), text: "Bài thử năm ngoái", time: "08:30", date: "29/09", words: 4, mood: null }); localStorage.setItem(k, JSON.stringify(s))`
- [ ] E.2 Dòng đầu danh sách "Nhật ký đã viết" hiện "29/09/2025 · 08:30 · 4 từ"; các bài năm nay vẫn "dd/mm · HH:mm · N từ" (không có năm). `/overview` → "Bài gần đây": dòng đầu cũng hiện "29/09/2025 · 08:30 · 4 từ".
- [ ] E.3 Về `/journal`, bấm thùng rác ở bài đó → hộp ghi "Xoá bài viết lúc 08:30 ngày 29/09/2025 sẽ không thể hoàn tác." → "Xoá".

**F. Sửa bài giữ mood đã lưu; chip báo trạng thái chọn (Task 8)**

- [ ] F.1 Viết bài `Bài thử mood` với mood "Mệt" → lưu → "Viết thêm một bài".
- [ ] F.2 Cài đặt → "Tâm trạng dùng trong nhật ký": tắt công tắc "Mệt".
- [ ] F.3 `/journal`: "Tâm trạng hôm nay" không còn chip "Mệt". Bấm bút chì ở `Bài thử mood` → chip "Mệt" hiện ở cuối hàng và đang được chọn (nền hồng). Chỉ sửa chữ → "Cập nhật bài viết" → dòng của bài vẫn có 😴 và nhãn "Mệt".
- [ ] F.4 Bấm bút chì ở bài đó lần nữa → bấm chip "Mệt" (bỏ chọn) → "Cập nhật bài viết" → bài không còn mood (biểu tượng 📝, không có nhãn).
- [ ] F.5 Cài đặt → "Thêm tâm trạng" → Tên `Thử mood` (emoji, mô tả tuỳ ý) → "Thêm". `/journal`: viết `Bài thử mood 2` với mood "Thử mood" → lưu → "Viết thêm một bài". Cài đặt → bấm thùng rác cạnh "Thử mood" (xoá mood). `/journal`: bấm bút chì ở `Bài thử mood 2` → chip "Thử mood" hiện và đang được chọn; chỉ sửa chữ → "Cập nhật bài viết" → bài vẫn giữ mood "Thử mood" (đúng emoji cũ). Bấm "Viết thêm một bài" nếu cần.
- [ ] F.6 (tuỳ chọn) DevTools → Accessibility của chip đang chọn: "Pressed: true"; các chip khác "Pressed: false".
- [ ] F.7 Cài đặt: bật lại "Mệt".

**G. Bản nháp bài mới không mất khi bấm Sửa (Task 9)**

- [ ] G.1 `/journal`: chọn mood "Vui", gõ `Nháp đang viết dở` (chưa lưu). Bấm bút chì ở 1 bài cũ → khung soạn hiện bài cũ, chip mood theo bài cũ. Bấm "Huỷ sửa" → khung soạn hiện lại `Nháp đang viết dở` với đúng số từ, chip "Vui" đang được chọn.
- [ ] G.2 Bấm bút chì ở 1 bài cũ, sửa 1 chữ → "Cập nhật bài viết" → toast "Đã cập nhật bài viết", danh sách hiện chữ mới, khung soạn hiện lại `Nháp đang viết dở`.
- [ ] G.3 Bấm bút chì ở bài A, gõ thêm 1 chữ, rồi bấm bút chì ở bài B → hộp "Bỏ thay đổi chưa lưu?". "Tiếp tục sửa" → vẫn đang sửa A với chữ vừa gõ. Bấm bút chì ở B lần nữa → "Bỏ thay đổi" → khung soạn hiện bài B; bài A trong danh sách giữ chữ cũ. Bấm "Huỷ sửa" → `Nháp đang viết dở` vẫn còn.
- [ ] G.4 Bấm bút chì ở A, chỉ bấm đổi 1 chip mood, rồi bấm bút chì ở B → cũng hiện "Bỏ thay đổi chưa lưu?" → "Bỏ thay đổi" → "Huỷ sửa".
- [ ] G.5 Bấm bút chì ở A (không đổi gì) rồi bút chì ở B → chuyển thẳng sang B, không hỏi. "Huỷ sửa".
- [ ] G.6 Có bản nháp trong khung soạn → tải lại trang (F5) → khung soạn trống (đúng Quyết định 1 B: nháp không lưu xuống máy). "Xoá nháp" vẫn xoá trống khung soạn như cũ.

**H. Trả dữ liệu thật về như cũ**

- [ ] H.1 **Cài đặt → "Nhập từ file"** → chọn file sao lưu xuất lúc đầu → hộp "Thay dữ liệu trên máy này?" → "Thay dữ liệu". Kiểm nhanh `/journal` và `/overview`: không còn bài thử nào; Cài đặt: "Mệt" bật như trước, không còn "Thử mood".

- [ ] **Step 6: Báo lại để duyệt**

Báo chủ repo: kết quả Step 1–4, kết quả từng mục Kiểm tra tay (A–H), danh sách commit trên `fix/journal-review-fixes`. Chỉ merge vào `developer` khi chủ repo đã chạy xong "Kiểm tra tay" và duyệt (CLAUDE.md mục 5), rồi mới tách nhánh cho Plan 5. Không `git push` nếu chủ repo chưa yêu cầu.
