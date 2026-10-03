# Đồng bộ state giữa các hook & chặn trùng tên (phần 1a sửa lỗi review 2026-09-29) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Nhánh:** `fix/storage-sync` (tách từ `developer` sau khi phần trước đã merge — đây là phần đầu tiên của chuỗi 1a → 1b → 2 → 3 → 4 → 5 → 6a → 6b nên tách thẳng từ `developer` hiện tại).

**Goal:** Không còn đường nào để 1 bản state cũ trong bộ nhớ âm thầm ghi đè dữ liệu mới hơn (do tab khác, do 1 lần tất toán ngân sách, hay do 1 lần "Tải xuống" xong muộn); ô "Tên hiển thị" luôn theo tên đang lưu; tên quỹ tiết kiệm và thẻ tín dụng là duy nhất; xoá quỹ không để lại liên kết mục tiêu mua xe mồ côi.

**Architecture:** 1 hook dùng chung mới `useStorageSync(storageKey, reload)` trong `src/lib/` nghe `onDataChanged` (cùng tab — mọi `setStored*` đã gọi `notifyDataChanged()`) và sự kiện `storage` của trình duyệt (tab khác), so chuỗi thô của đúng key đó với lần đọc trước rồi mới gọi `reload`; 7 hook domain dùng nó để tự đọc lại. Ngoài ra `useFinance`/`useBudget`/`useJournal`/`useSettings` dựng mỗi lần ghi từ `getStored*()` đọc tươi ngay lúc gọi (đúng cách `applySavingsFundDelta` vẫn làm) thay vì từ `state` trong closure; `useStudy`/`useNetWorthHistory` vốn đã đọc qua ref "bản mới nhất", nên `reload` chỉ cần cập nhật ref đó đồng bộ. Tên quỹ/thẻ: `parseFinanceState` đổi tên bản trùng đã lưu thành "Tên (2)"..., hook từ chối tên trùng bằng toast, form chặn ngay khi gõ.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript, zod 4, zustand 5, Vitest + React Testing Library (jsdom) — không thêm dependency nào.

**Spec:** Không có spec riêng — nguồn là 10 phát hiện review đã được kiểm chứng đối kháng (2026-09-29), liệt kê đủ ở mục `## Phạm vi` bên dưới.

## Global Constraints

- Nhánh `fix/storage-sync` tách từ `developer`; 1 commit/task, message theo CLAUDE.md (`fix:` / `refactor:` ...) cộng dòng attribution mà phiên thực thi yêu cầu. Trước mỗi commit tự review `git diff` của task (CLAUDE.md mục 6). Không commit thẳng lên `developer`/`main`, không `git push` khi chủ repo chưa yêu cầu.
- Không thêm dependency. Plan không dùng API Next.js nào; nếu buộc phải đụng tới, đọc `node_modules/next/dist/docs/` trước (Next 16 có breaking changes).
- Giữ nguyên các quyết định có chủ đích: AutoBackup vẫn không mount; mock login giữ nguyên; `EXPORT_VERSION` giữ `1`; `Expense.tag` vẫn là snapshot đóng băng; số còn phải tất toán của tháng vẫn tính lại, không khoá; `/sandbox` không đụng.
- Tên file/biến/test tiếng Anh; chữ hiển thị cho người dùng tiếng Việt, đúng nguyên văn trong plan.
- Listener của `useStorageSync` CHỈ ĐỌC storage, không bao giờ ghi (tránh vòng ghi → notify → reload → ghi); `reload` truyền vào phải ổn định (`useCallback(..., [])` hoặc hàm cấp module).
- Không dựng lần ghi từ `state` trong closure: `useFinance`/`useBudget`/`useJournal`/`useSettings` đọc tươi `getStored*()` ở đầu mỗi mutation; `useStudy`/`useNetWorthHistory` giữ ref sẵn có (`stateRef`/`historyRef`), được `reload` cập nhật TRƯỚC `setState`.
- So khớp tên quỹ/thẻ là so CHÍNH XÁC sau khi trim — đúng như cửa hàng vàng đang làm và đúng như mọi thao tác phía sau (`find`/`map`/`filter` theo `name ===`).
- Test đặt trong `__tests__/` mirror cấu trúc, theo đúng pattern file bên cạnh (`vi.mock("sonner", ...)`, `vi.useFakeTimers({ shouldAdvanceTime: true })`, `renderHook` + `waitFor` chờ hydrate). Mô phỏng "tab khác ghi" = `window.localStorage.setItem(...)` rồi `window.dispatchEvent(new StorageEvent("storage", { key }))` trong `act`; mô phỏng "khoảng hở trước khi kịp đọc lại" = chỉ `setItem`, KHÔNG bắn sự kiện.
- Chạy từng file test bằng `npx vitest run <path>`; full suite, lint, tsc chỉ ở Task 11.
- Mọi task commit ngay khi test của task xanh và đã tự review `git diff` — **không dừng giữa plan** chờ chủ repo. Các task đổi thứ người dùng thấy được kiểm lại ở "Kiểm tra tay" của task checkpoint cuối; nếu chủ repo thấy sai thì sửa tiếp trên chính nhánh này. Nhánh chỉ merge vào `developer` sau khi chủ repo chạy xong toàn bộ "Kiểm tra tay" và duyệt.

## Quyết định cần duyệt

### 1. Quỹ/thẻ trùng tên ĐÃ nằm sẵn trong dữ liệu thì xử lý sao?

Plan chặn tạo mới/đổi tên trùng ở cả hook lẫn form. Nhưng nếu localStorage (hoặc 1 file sao lưu / bản trên cloud) đã có 2 quỹ "Quỹ A", mọi thao tác theo tên vẫn đụng cả 2 — và không gỡ được qua giao diện (đổi tên 1 quỹ là đổi luôn cả 2, xoá 1 là xoá cả 2).

- **A. Tự đổi tên bản trùng khi đọc** — giữ nguyên tên mục ĐẦU TIÊN (đúng mục mà FundPicker, mục tiêu mua xe và tất toán ngân sách vốn đang chọn), các mục sau thành "Quỹ A (2)", "Quỹ A (3)"...; không mất số dư nào, người dùng thấy tên lạ và tự đặt lại. Nếu người dùng thật ra đã gắn mục tiêu xe với quỹ thứ 2 thì liên kết giờ trỏ quỹ thứ 1 (đúng như app vốn đang hiểu từ trước tới nay).
- **B. Để nguyên, chỉ chặn tạo mới** — cặp trùng cũ tiếp tục bị sửa/xoá/trả/tất toán cùng nhau, React tiếp tục cảnh báo trùng key.
- **C. Gộp các mục trùng (cộng số dư)** — mất ranh giới 2 quỹ; mục tiêu, ghi chú, hạn mức của 1 mục bị bỏ.
- **Khuyên dùng: A** — vì không mất dữ liệu, chặn ngay lớp lỗi ghi đè cho cả dữ liệu cũ lẫn file sao lưu cũ (đổi tên ở `parseFinanceState`, nơi cả localStorage, nhập file và tải xuống cùng đi qua), và người dùng vẫn toàn quyền đặt lại tên. "Visa" và "visa" vẫn là 2 thẻ khác nhau vì mọi thao tác phía sau cũng so tên chính xác. Plan làm A (Task 8).

### 2. Xoá quỹ đang gắn mục tiêu mua xe — liên kết đi đâu?

Hiện đổi tên quỹ thì liên kết đi theo, nhưng xoá quỹ thì `car-goal-fund-name` vẫn giữ tên cũ: mục tiêu hiện "Chưa gắn quỹ tiết kiệm nào", còn liên kết mồ côi thì vẫn được xuất file, tải lên, khôi phục — và ngay khi có 1 quỹ mới mang đúng tên đó (tạo mới hay đổi tên), mục tiêu âm thầm gắn vào nó.

- **A. Gỡ liên kết khi xoá, và không để liên kết mồ côi có sẵn tự gắn vào quỹ mới** — xoá quỹ đang gắn thì gỡ luôn; thêm quỹ hoặc đổi tên quỹ thành đúng tên mà 1 liên kết mồ côi (từ lần xoá trước bản sửa này, hay từ file sao lưu cũ) đang trỏ tới thì gỡ liên kết đó. Tạo lại quỹ cùng tên phải chọn lại quỹ ở trang Mục tiêu (1 lần chọn).
- **B. Chỉ gỡ khi xoá** — từ nay trở đi đúng; liên kết mồ côi đã nằm sẵn trong dữ liệu vẫn có thể tự gắn 1 lần vào quỹ mới trùng tên.
- **C. Giữ nguyên** — tạo lại quỹ cùng tên thì mục tiêu tự gắn lại (tiện nếu cố ý), nhưng gắn sai âm thầm nếu tên được dùng lại cho mục đích khác.
- **Khuyên dùng: A** — vì mục tiêu chỉ nên gắn với quỹ người dùng tự chọn trong FundPicker; cái giá là 1 lần chọn lại khi cố ý tạo lại quỹ cũ. Plan làm A (Task 10). Nếu chọn B thì bỏ 2 test "…does not let a … fund inherit a car-goal link left over from a deleted fund", bỏ khối `if` gỡ liên kết trong `addSavingsFund` và nhánh `else if` trong `updateSavingsFund` của Task 10, và không cần sửa test cũ ở Step 1 của Task 10.

Các lựa chọn còn lại (đọc lại + ghi từ bản đọc tươi, bản nháp của ô "Tên hiển thị", chặn trùng ngay ở form) không có đánh đổi nào người dùng thấy được — plan làm thẳng.

## Phạm vi

| Phát hiện | Mô tả | Sửa ở |
|---|---|---|
| `lens-data-integrity#1` | Mọi hook domain đọc storage 1 lần lúc mount rồi ghi nguyên bản trong bộ nhớ → ghi đè dữ liệu tab khác vừa ghi, hoặc dữ liệu của 1 lần "Tải xuống" xong sau khi đã rời trang Cài đặt | Task 1 (hook dùng chung), Task 2–6 (từng hook). Lần tải xuống xong muộn vẫn ghi qua `setStored*` → `notifyDataChanged()`, nên trang đang mở tự đọc lại (test ở Task 3); không cần huỷ kết quả pull khi Cài đặt unmount. Luồng xác nhận trước khi nạp là việc của Plan 1b |
| `area-finance-logic#1` | `useFinance` giữ bản cũ → ghi đè lần mua vàng tab khác vừa thêm; trang Chi tiêu hiện số dư quỹ cũ sau khi tất toán | Task 2 |
| `area-budget-goals#13` | `useBudget` ghi đè khoản chi / đổi tên quỹ trong lịch sử tất toán do tab khác ghi | Task 3 |
| `area-overview-journal#9` | `useJournal` ghi nguyên danh sách cũ → xoá mất bài vừa lưu ở tab khác | Task 4 |
| `area-finance-logic#2` | Quỹ và thẻ không chặn trùng tên → sửa/xoá/trả 1 mục đụng mọi mục cùng tên | Task 8 (hook + bản trùng đã lưu), Task 9 (form) |
| `lens-data-integrity#2` | Tên quỹ là khoá của mục tiêu, tất toán, `applySavingsFundDelta` nhưng không chặn trùng → số dư quỹ này đè quỹ kia khi tất toán | Task 8 (có test `applySavingsFundDelta` với dữ liệu trùng) |
| `area-finance-ui#1` | Form thêm/sửa quỹ không chặn trùng → xoá/sửa 1 quỹ đụng luôn quỹ kia, React cảnh báo trùng key | Task 9 (form), Task 8 (hook) |
| `area-finance-ui#2` | Thẻ tín dụng cùng lỗi trùng tên (trả, sửa, xoá) | Task 9 (form), Task 8 (hook) |
| `lens-data-integrity#4` | Xoá quỹ để lại liên kết mục tiêu mua xe (và `Settlement.fundName`) trỏ vào tên đã xoá | Task 10 (liên kết mục tiêu xe, theo Quyết định 2). Phần settlement: **Không sửa** — `Settlement.fundName` không hiện ở màn nào và không tham gia phép tính nào (`remainingToSettle` chỉ dùng month/direction/amount); `budget-storage.ts:77-79` ghi rõ không đụng settlement khi xoá quỹ là lựa chọn có chủ đích; mọi cách sửa khi chưa có id quỹ đều phải hoặc viết lại lịch sử đã đóng băng, hoặc cấm dùng lại tên quỹ cũ |
| `area-settings-sync#1` | Ô "Tên hiển thị" giữ tên mặc định sau khi tải cứng/nhập file/tải xuống; bấm Lưu là ghi đè tên thật | Task 7 (và Task 6 để tab khác đổi tên cũng hiện ra) |

## Thay đổi ảnh hưởng tới các phần sau

Các plan 1b, 2, 3, 4, 5, 6a, 6b chạy sau khi plan này đã merge. Mọi thứ dưới đây là "hợp đồng" mới mà chúng phải dựa vào (và không được làm mất khi sửa/di chuyển file).

**Hook mới trong `src/lib/`**
- `useStorageSync(storageKey: string, reload: () => void): void` — `src/lib/use-storage-sync.ts`. Không gọi `reload` lúc mount; gọi `reload` khi chuỗi thô `localStorage.getItem(storageKey)` thật sự khác lần đọc trước, do cùng tab (`notifyDataChanged()`) hoặc tab khác (sự kiện `storage` đúng key, hoặc `key === null` khi tab khác `localStorage.clear()`). `reload` phải ổn định và chỉ đọc. Mọi hook domain mới/được viết lại về sau phải gọi nó cho key của mình.
- Giới hạn: vì so với chuỗi thô của lần đọc trước, `useStorageSync` chỉ đúng cho key mà **mọi** lần ghi đều báo `notifyDataChanged()` — 1 lần ghi không báo làm mốc so sánh bị cũ. 7 key domain của plan này đều thoả (mọi `setStored*` đã báo).
- Hệ quả: **mọi chỗ ghi localStorage mà không qua `setStored*()`** (vd. bước trả lại chuỗi thô cũ khi khôi phục lỗi giữa chừng của Plan 1b) phải tự gọi `notifyDataChanged()` sau khi ghi, nếu không các hook đang mount sẽ không đọc lại. `clearSyncSecret()` hiện chưa gọi `notifyDataChanged()` (Plan 1b thêm). Riêng key `sync-secret`, `setSyncSecret()` ghi mỗi lần gõ mà không báo, nên ô secret KHÔNG hợp với `useStorageSync` — nó phải tự nghe `onDataChanged` + sự kiện `storage` và luôn đọc lại (Plan 1b Task 9 làm đúng như vậy).
- CLAUDE.md mục 3 có thêm 1 gạch đầu dòng quy ước "Hook đọc/ghi localStorage" (Task 1). Plan 1b nối thêm ý thứ 4 về `safeArray` vào đúng gạch đầu dòng đó.

**Hành vi hook đã đổi** (shape trả về của cả 7 hook giữ nguyên)
- `useFinance`: mọi mutation mở đầu bằng `const current = getStoredFinance()` và chỉ phụ thuộc `persist` (ổn định giữa các lần render); state tự đọc lại qua `useStorageSync(FINANCE_STORAGE_KEY, reload)`. `addSavingsFund`/`updateSavingsFund` (khi đổi tên) từ chối tên trùng bằng toast `Đã có quỹ tiết kiệm tên "…". Vui lòng chọn tên khác.`; `addCard`/`updateCard` bằng `Đã có thẻ tín dụng tên "…". Vui lòng chọn tên khác.` (hàm vẫn trả `void`). `removeSavingsFund` gỡ `car-goal-fund-name` nếu đang trỏ quỹ bị xoá; `addSavingsFund`/`updateSavingsFund` gỡ liên kết mồ côi trỏ đúng tên mới.
  - **Plan 2**: `BudgetView` dùng `useFinance()` nên sau `confirmSettlement` (ghi qua `applySavingsFundDelta` → `notifyDataChanged`) `savings` đã tự cập nhật — `area-budget-goals#2` và `lens-data-integrity#3` chỉ còn phần "modal chỉ đóng khi `onConfirm` báo thành công" + test hồi quy ở mức `BudgetView`.
- `useBudget`: mọi mutation dựng từ `getStoredBudget()` đọc tươi; `confirmSettlement` gọi `applySavingsFundDelta(...)` trước rồi mới `const current = getStoredBudget()`. **Plan 2** (`area-budget-goals#12`, ghi settlement không nguyên tử) sửa trên nền đó.
- `useJournal`: `saveEntry`/`updateEntry`/`deleteEntry` dựng từ `getStoredJournal()` đọc tươi. **Plan 4** (`area-overview-journal#6`) kiểm id có tồn tại trên `current.entries` (bản đọc tươi), không trên `state`.
- `useStudy`: có `reload` cập nhật `stateRef.current` rồi `setState`; mọi mutation vẫn đọc `stateRef.current`. **Plan 3** (`area-study#4` reset nhiệm vụ mỗi ngày, `area-study#10` bỏ "đã học") phải giữ `reload` + `stateRef` đồng bộ, và KHÔNG được ghi storage từ trong `reload` (listener chỉ đọc) — việc reset theo ngày nên làm lúc parse/đọc, hoặc ở effect hydrate/mutation.
- `useNetWorthHistory`: có `reload` cập nhật `historyRef.current` rồi `setHistory`; `recordSnapshot` vẫn đọc `historyRef`. Cơ chế chống race hydrate cũ giữ nguyên.
- Khác biệt có chủ đích giữa 2 nhóm: `useStudy`/`useNetWorthHistory` dựng lần ghi từ ref chứ không đọc tươi storage, nên chỉ còn 1 khe vài mili-giây (tab khác vừa ghi, sự kiện `storage` chưa kịp tới tab này) — đổi sang đọc tươi sẽ phải viết lại thứ tự `persist` (hiện `setState` chạy trước `setStoredStudy`) và cơ chế ref chống race cùng tick, nằm ngoài phạm vi 1a. Plan sau nào viết lại 2 hook này thì có thể chuyển hẳn sang đọc tươi.
- `useSettings`: thêm hàm cấp module `reloadSettingsFromStorage()` (dùng cho cả effect hydrate lẫn `useStorageSync(SETTINGS_STORAGE_KEY, reloadSettingsFromStorage)`); mọi mutation dựng từ `getStoredSettings()` đọc tươi, deps `[persist]`; **sau khi ghi, `setSettings` nạp store bằng `getStoredSettings()` (KHÔNG phải `set({ settings: next })`)** — bản sửa sau review cuối (commit f7b4efe): bản nhập từ sao lưu cũ có danh sách module chưa qua `mergeModules`, nếu đưa thẳng vào store thì chỉ số hàng trên màn hình lệch với danh sách mà mutation đọc, bật/tắt nhầm module. Plan sau nào sửa/di chuyển `use-settings.ts` phải giữ đúng điều này. **Plan 6a** (`area-settings-sync#8`, chặn mood trùng tên) kiểm trên `current.moods` của bản đọc tươi. **Plan 6b** (`area-settings-sync#11`, chuyển `useSettings` sang `src/lib/`) phải mang theo cả `reloadSettingsFromStorage`, `useStorageSync` và cách đọc tươi.
- `useCarGoalFund`: đọc lại qua `useStorageSync(CAR_GOAL_FUND_KEY, reload)`; `car-goal-storage.ts` export thêm `CAR_GOAL_FUND_KEY`.

**Parse/lưu trữ**
- `finance-storage.ts`: hàm nội bộ mới `dedupeNames<T extends { name: string }>(items: T[]): T[]` bọc quanh `savings` và `cards` trong `parseFinanceState` (bản trùng → "Tên (2)", "Tên (3)"..., mục đầu giữ tên). Vì `getStoredFinance`, `applySavingsFundDelta` và `parseImportPayload` đều đi qua `parseFinanceState`, cả 3 luôn thấy tên duy nhất. **Plan 1b** (`area-finance-logic#3`, lọc từng phần tử) khi thay `safeField(z.array(...))` bằng `safeArray(...)` phải giữ `dedupeNames(...)` bọc ngoài 2 dòng `savings`/`cards`. **Plan 6b** (`area-finance-logic#11`, chuyển data layer tài chính) giữ nguyên.

**UI**
- `ProfileCard`: giữ `draft: string | null` thay vì copy prop 1 lần — `null` nghĩa là hiện đúng `displayName` đang lưu; đang gõ dở thì giữ bản nháp. `ProfileCardProps` không đổi.
- `AddSavingsFundForm`, `EditSavingsFundModal`, `AddCreditCardForm`, `EditCreditCardModal` có prop tuỳ chọn `existingNames?: string[]` (mặc định `[]`); trùng tên → `Field invalid` + hint `Đã có quỹ tên này — chọn tên khác` / `Đã có thẻ tên này — chọn tên khác`, nút Thêm/Lưu bị khoá, chữ đã gõ được giữ. Modal sửa bỏ qua tên hiện tại của chính mục đang sửa. `SavingsTab`/`CreditCardsTab` truyền danh sách tên. Lưu ý cho test: khi hint hiện, nội dung `<label>` gồm cả hint nên `getByLabelText("Tên quỹ")` phải thêm `{ exact: false }`. **Plan 6a** (`area-finance-logic#5`, form cửa hàng vàng bị reset khi hook từ chối) nên dùng lại đúng pattern `existingNames` này. **Plan 6b** (`area-finance-ui#9`): test chặn trùng tên cho 2 modal sửa đã có sẵn từ plan này — chỉ còn tách test "disables Lưu" theo từng field.

**Test đã thêm (để các plan sau khỏi làm lại)**
- `use-finance.test.ts` có 3 khối mới: `useFinance — dữ liệu do nơi khác ghi` (ghi từ tab khác / từ `applySavingsFundDelta` rồi mới mutation), `useFinance — tên quỹ và thẻ không được trùng`, `useFinance — liên kết mục tiêu mua xe khi xoá/tạo quỹ`. **Plan 1b** (`area-finance-logic#13`) chỉ còn thay 2 test storage đang khoá chặt lỗi; test copy "lãi 0 ₫" của `gold-tab` và test AddGoldForm thuộc Plan 6a.

**Plan 5** không phụ thuộc thay đổi nào ở đây (chỉ lưu ý: `Field` có `hint` thì nội dung `<label>` dài thêm 1 dòng — xem mục UI).

## Cấu trúc file

- Create: `src/lib/use-storage-sync.ts`, `src/lib/__tests__/use-storage-sync.test.ts`
- Modify (hook): `src/features/finance/hooks/use-finance.ts`, `src/features/budget/hooks/use-budget.ts`, `src/features/journal/hooks/use-journal.ts`, `src/features/study/hooks/use-study.ts`, `src/features/overview/hooks/use-net-worth-history.ts`, `src/features/settings/hooks/use-settings.ts`, `src/features/goals/hooks/use-car-goal-fund.ts`
- Modify (storage): `src/features/finance/finance-storage.ts`, `src/features/goals/car-goal-storage.ts`
- Modify (UI): `src/features/settings/components/profile-card.tsx`, `src/features/finance/components/{add-savings-fund-form,edit-savings-fund-modal,savings-tab,add-credit-card-form,edit-credit-card-modal,credit-cards-tab}.tsx`
- Modify (docs): `CLAUDE.md` (1 gạch đầu dòng ở mục 3)
- Test sửa/thêm: các file `__tests__` tương ứng, nêu cụ thể trong từng task.

---

### Task 1: Hook dùng chung `useStorageSync` + quy ước trong CLAUDE.md

**Files:**
- Create: `src/lib/use-storage-sync.ts`
- Test: `src/lib/__tests__/use-storage-sync.test.ts`
- Modify: `CLAUDE.md` (mục 3, ngay sau gạch đầu dòng "Dùng ở ≥ 2 feature ...")

**Interfaces:**
- Consumes: `onDataChanged(listener: () => void): () => void` từ `src/lib/data-change-bus.ts` (đã có; mọi `setStored*` của finance, budget, journal, study, settings, net-worth-history, car-goal đều đã gọi `notifyDataChanged()`).
- Produces: `useStorageSync(storageKey: string, reload: () => void): void` — dùng bởi Task 2, 3, 4, 5, 6.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/lib/__tests__/use-storage-sync.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { notifyDataChanged } from "../data-change-bus"
import { useStorageSync } from "../use-storage-sync"

const KEY = "sync-test-key"

describe("useStorageSync", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("does not call reload just for mounting", () => {
    window.localStorage.setItem(KEY, "1")
    const reload = vi.fn()

    renderHook(() => useStorageSync(KEY, reload))

    expect(reload).not.toHaveBeenCalled()
  })

  it("calls reload when this tab writes a new value to the watched key", () => {
    const reload = vi.fn()
    renderHook(() => useStorageSync(KEY, reload))

    act(() => {
      window.localStorage.setItem(KEY, "1")
      notifyDataChanged()
    })

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it("does not call reload when a write to another key leaves the watched key unchanged", () => {
    window.localStorage.setItem(KEY, "1")
    const reload = vi.fn()
    renderHook(() => useStorageSync(KEY, reload))

    act(() => {
      window.localStorage.setItem("other-key", "x")
      notifyDataChanged()
    })

    expect(reload).not.toHaveBeenCalled()
  })

  it("calls reload when another tab changes the watched key or clears all storage", () => {
    window.localStorage.setItem(KEY, "1")
    const reload = vi.fn()
    renderHook(() => useStorageSync(KEY, reload))

    act(() => {
      window.localStorage.setItem(KEY, "2")
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }))
    })
    expect(reload).toHaveBeenCalledTimes(1)

    act(() => {
      window.localStorage.clear()
      window.dispatchEvent(new StorageEvent("storage", { key: null }))
    })
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it("ignores storage events for other keys", () => {
    const reload = vi.fn()
    renderHook(() => useStorageSync(KEY, reload))

    act(() => {
      window.localStorage.setItem("other-key", "x")
      window.dispatchEvent(new StorageEvent("storage", { key: "other-key" }))
    })

    expect(reload).not.toHaveBeenCalled()
  })

  it("stops listening after unmount", () => {
    const reload = vi.fn()
    const { unmount } = renderHook(() => useStorageSync(KEY, reload))
    unmount()

    window.localStorage.setItem(KEY, "1")
    notifyDataChanged()
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }))

    expect(reload).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/lib/__tests__/use-storage-sync.test.ts`
Expected: FAIL — `Failed to resolve import "../use-storage-sync" from "src/lib/__tests__/use-storage-sync.test.ts"` (file chưa tồn tại)

- [ ] **Step 3: Tạo `src/lib/use-storage-sync.ts`**

```ts
"use client"

import { useEffect } from "react"

import { onDataChanged } from "./data-change-bus"

function readRaw(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

// Gọi `reload` mỗi khi giá trị thô của `storageKey` trong localStorage thật sự đổi — dù do chính
// tab này ghi (mọi setStored* đều gọi notifyDataChanged) hay tab khác ghi (sự kiện "storage" của
// trình duyệt). So chuỗi thô với lần đọc trước nên 1 lần ghi ở key KHÁC không làm hook này đọc lại
// hay render lại vô ích. `reload` phải ổn định (useCallback/hàm module) và CHỈ ĐỌC — không bao giờ
// ghi storage, nếu không sẽ thành vòng lặp ghi → notify → reload → ghi.
function useStorageSync(storageKey: string, reload: () => void) {
  useEffect(() => {
    let lastRaw = readRaw(storageKey)

    function reloadIfChanged() {
      const raw = readRaw(storageKey)
      if (raw === lastRaw) return
      lastRaw = raw
      reload()
    }

    function handleStorage(event: StorageEvent) {
      // key === null: tab khác vừa gọi localStorage.clear().
      if (event.key === null || event.key === storageKey) reloadIfChanged()
    }

    const unsubscribe = onDataChanged(reloadIfChanged)
    window.addEventListener("storage", handleStorage)
    return () => {
      unsubscribe()
      window.removeEventListener("storage", handleStorage)
    }
  }, [storageKey, reload])
}

export { useStorageSync }
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/lib/__tests__/use-storage-sync.test.ts src/lib/__tests__/data-change-bus.test.ts`
Expected: PASS (6 tests mới + 3 test cũ của data-change-bus)

- [ ] **Step 5: Ghi quy ước vào CLAUDE.md**

Trong `CLAUDE.md`, mục `## 3. Feature Rules (feature-sliced)`, ngay sau dòng `- Dùng ở ≥ 2 feature → đưa lên \`src/components/\` hoặc \`src/lib/\` ở gốc \`src/\`, không để trong 1 feature.`, thêm:

```md
- **Hook đọc/ghi localStorage** (`use-finance`, `use-budget`, `use-journal`, `use-study`, `use-settings`, `use-net-worth-history`, `use-car-goal-fund`...): (1) gọi `useStorageSync(KEY, reload)` từ `@/lib/use-storage-sync` để tự đọc lại khi tab khác hoặc nơi khác trong app ghi cùng key — `reload` phải ổn định (`useCallback(..., [])` hoặc hàm cấp module) và chỉ đọc, không bao giờ ghi; (2) mỗi lần ghi dựng từ bản đọc tươi `getStored*()` (hoặc ref được `reload` cập nhật đồng bộ), không dựng từ `state` trong closure; (3) mọi lần ghi localStorage đi qua `setStored*()` (đã gọi `notifyDataChanged()`) — ghi thẳng `localStorage.setItem` thì phải tự gọi `notifyDataChanged()` ngay sau.
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/use-storage-sync.ts src/lib/__tests__/use-storage-sync.test.ts CLAUDE.md
git commit -m "refactor: add a shared useStorageSync hook for storage-backed hooks"
```

---

### Task 2: `useFinance` tự đọc lại và ghi từ bản đọc tươi

**Files:**
- Modify: `src/features/finance/hooks/use-finance.ts` (toàn bộ file)
- Test: `src/features/finance/__tests__/hooks/use-finance.test.ts`

**Interfaces:**
- Consumes: `useStorageSync` (Task 1); `FINANCE_STORAGE_KEY`, `getStoredFinance`, `setStoredFinance`, `applySavingsFundDelta` từ `../finance-storage` (đã có).
- Produces: `useFinance()` trả về đúng shape cũ (`savings`, `cards`, `gold`, `goldStores`, `invests`, `hydrated`, 17 mutation, `replaceFinance`); các mutation giờ chỉ phụ thuộc `persist` nên ổn định giữa các lần render. Task 8 và Task 10 sửa tiếp `addSavingsFund`, `updateSavingsFund`, `removeSavingsFund`, `addCard`, `updateCard` trên nền file này.

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/finance/__tests__/hooks/use-finance.test.ts`, thay dòng import

```ts
import { DEFAULT_FINANCE_STATE, FINANCE_STORAGE_KEY, getStoredFinance, setStoredFinance } from "../../finance-storage"
```

bằng:

```ts
import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  applySavingsFundDelta,
  getStoredFinance,
  setStoredFinance,
} from "../../finance-storage"
```

Rồi thêm vào cuối file:

```ts
describe("useFinance — dữ liệu do nơi khác ghi", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows a purchase another tab added and keeps it when this tab edits a store price", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.hydrated).toBe(true))

    // Tab khác ghi thẳng vào localStorage, trình duyệt bắn sự kiện "storage" sang tab này.
    act(() => {
      window.localStorage.setItem(
        FINANCE_STORAGE_KEY,
        JSON.stringify({
          ...DEFAULT_FINANCE_STATE,
          gold: [{ id: 1, date: "10/08/2026", phan: 10, buy: 9_000_000, store: "SJC" }],
          goldStores: [{ name: "SJC", price: "" }],
        })
      )
      window.dispatchEvent(new StorageEvent("storage", { key: FINANCE_STORAGE_KEY }))
    })
    expect(result.current.gold).toHaveLength(1)

    act(() => {
      result.current.setGoldStorePrice("SJC", "9.100.000")
    })

    expect(getStoredFinance().gold).toHaveLength(1)
    expect(getStoredFinance().goldStores).toEqual([{ name: "SJC", price: "9.100.000" }])
  })

  it("shows a fund deposit made by a budget settlement and keeps it when a card is paid afterwards", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ A", amount: 10_000_000, target: 50_000_000 }],
      cards: [{ name: "Thẻ A", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "15" }],
    })
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toHaveLength(1))

    // Trang Chi tiêu tất toán tháng: applySavingsFundDelta ghi thẳng finance-data.
    act(() => {
      applySavingsFundDelta("Quỹ A", "deposit", 2_000_000)
    })
    expect(result.current.savings[0].amount).toBe(12_000_000)

    act(() => {
      result.current.payCard("Thẻ A", 500_000)
    })

    expect(getStoredFinance().savings[0].amount).toBe(12_000_000)
    expect(getStoredFinance().cards[0].balance).toBe(1_500_000)
  })

  it("builds each write from the latest stored data, even before it has re-read", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.hydrated).toBe(true))

    // Ghi thẳng, KHÔNG bắn sự kiện — mô phỏng khoảng hở trước khi hook kịp đọc lại.
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ tab khác", amount: 1, target: 2 }] })
    )
    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 1, min: 1, limit: 1, due: "1" })
    })

    expect(getStoredFinance().savings).toEqual([{ name: "Quỹ tab khác", amount: 1, target: 2 }])
    expect(getStoredFinance().cards).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/hooks/use-finance.test.ts`
Expected: FAIL đúng 3 test mới — `expected [] to have a length of 1 but got +0` (không thấy lần mua tab khác thêm), `expected 10000000 to be 12000000` (hook không thấy tiền tất toán vừa nạp), `expected [] to deeply equal [ { name: 'Quỹ tab khác', …(2) } ]` (addCard ghi đè quỹ của tab khác). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Viết lại `use-finance.ts`**

Thay toàn bộ nội dung `src/features/finance/hooks/use-finance.ts` bằng (khác bản cũ đúng 3 chỗ: import `FINANCE_STORAGE_KEY` + `useStorageSync`; thêm `reload` + `useStorageSync`; mỗi mutation mở đầu bằng `const current = getStoredFinance()`, dùng `current` thay `state`, deps `[persist]` — toast, comment, thứ tự hàm giữ nguyên):

```ts
"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  setStoredFinance,
  type FinanceState,
} from "../finance-storage"
import type { CreditCard, GoldPurchase, GoldStore, Investment, SavingsFund } from "../types"
import { toast } from "sonner"
import { getCarGoalFundName, setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { renameFundInSettlements } from "@/features/budget/budget-storage"
import { nextId } from "@/lib/next-id"
import { useStorageSync } from "@/lib/use-storage-sync"

function useFinance() {
  const [state, setState] = useState<FinanceState>(DEFAULT_FINANCE_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredFinance())
    setHydrated(true)
  }, [])

  // Tab khác, 1 lần tải xuống/nhập file vừa xong, hay applySavingsFundDelta (tất toán ngân sách)
  // ghi finance-data → đọc lại để màn hình không hiện số dư cũ.
  const reload = useCallback(() => setState(getStoredFinance()), [])
  useStorageSync(FINANCE_STORAGE_KEY, reload)

  const persist = useCallback((next: FinanceState) => {
    setStoredFinance(next)
    setState(next)
  }, [])

  // Mọi thao tác ghi bên dưới dựng từ getStoredFinance() đọc TƯƠI ngay lúc gọi (đúng cách
  // applySavingsFundDelta vẫn làm), không từ `state` trong closure: giữa 2 lần render, 1 tab khác
  // hay 1 lần tất toán ngân sách có thể vừa ghi finance-data — dựng từ bản cũ sẽ ghi đè mất nó.

  const addSavingsFund = useCallback(
    (fund: SavingsFund) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, savings: [...current.savings, fund] })
        toast.success(`Đã thêm quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể thêm quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const updateSavingsFund = useCallback(
    (originalName: string, fund: SavingsFund) => {
      const current = getStoredFinance()
      try {
        persist({
          ...current,
          savings: current.savings.map((f) => (f.name === originalName ? fund : f)),
        })
        // Mục tiêu "mua xe" link theo tên quỹ (không có id) — đổi tên quỹ đang link
        // thì phải đổi luôn tên lưu ở car-goal-storage, nếu không link sẽ bị mồ côi.
        if (fund.name !== originalName && getCarGoalFundName() === originalName) {
          setCarGoalFundName(fund.name)
        }
        // Lịch sử tất toán ngân sách cũng tham chiếu quỹ theo tên — cascade tương tự
        // để lịch sử vẫn hiển thị đúng tên hiện tại của quỹ.
        if (fund.name !== originalName) {
          renameFundInSettlements(originalName, fund.name)
        }
        toast.success(`Đã cập nhật quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể cập nhật quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const removeSavingsFund = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, savings: current.savings.filter((f) => f.name !== name) })
        toast.success(`Đã xoá quỹ tiết kiệm "${name}"`)
      } catch {
        toast.error(`Không thể xoá quỹ tiết kiệm "${name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const addCard = useCallback(
    (card: CreditCard) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, cards: [...current.cards, card] })
        toast.success(`Đã thêm thẻ tín dụng "${card.name}"`)
      } catch {
        toast.error(`Không thể thêm thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const payCard = useCallback(
    (name: string, amount: number) => {
      const current = getStoredFinance()
      try {
        persist({
          ...current,
          cards: current.cards.map((card) =>
            card.name === name ? { ...card, balance: Math.max(card.balance - amount, 0) } : card
          ),
        })
        toast.success(`Đã ghi nhận thanh toán cho thẻ "${name}"`)
      } catch {
        toast.error("Không thể ghi nhận thanh toán. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const updateCard = useCallback(
    (originalName: string, card: CreditCard) => {
      const current = getStoredFinance()
      try {
        persist({
          ...current,
          cards: current.cards.map((c) => (c.name === originalName ? card : c)),
        })
        toast.success(`Đã cập nhật thẻ tín dụng "${card.name}"`)
      } catch {
        toast.error(`Không thể cập nhật thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const removeCard = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, cards: current.cards.filter((c) => c.name !== name) })
        toast.success(`Đã xoá thẻ tín dụng "${name}"`)
      } catch {
        toast.error(`Không thể xoá thẻ tín dụng "${name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const addGoldStore = useCallback(
    (store: GoldStore) => {
      const current = getStoredFinance()
      if (current.goldStores.some((s) => s.name === store.name)) {
        toast.error(`Đã có cửa hàng tên "${store.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({ ...current, goldStores: [...current.goldStores, store] })
        toast.success(`Đã thêm cửa hàng "${store.name}"`)
      } catch {
        toast.error(`Không thể thêm cửa hàng "${store.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const setGoldStorePrice = useCallback(
    (name: string, price: string) => {
      const current = getStoredFinance()
      // Gõ trực tiếp từng phím, không phải submit 1 lần — không toast để tránh spam,
      // chỉ chặn throw khi ghi storage lỗi (khác payCard/updateCard là hành động rời rạc).
      try {
        persist({
          ...current,
          goldStores: current.goldStores.map((s) => (s.name === name ? { ...s, price } : s)),
        })
      } catch {
        // im lặng bỏ qua, giữ nguyên giá trị hiển thị cũ
      }
    },
    [persist]
  )

  const updateGoldStore = useCallback(
    (originalName: string, store: GoldStore) => {
      const current = getStoredFinance()
      if (store.name !== originalName && current.goldStores.some((s) => s.name === store.name)) {
        toast.error(`Đã có cửa hàng tên "${store.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({
          ...current,
          goldStores: current.goldStores.map((s) => (s.name === originalName ? store : s)),
          // Purchase tham chiếu cửa hàng theo tên (sống, không snapshot) — đổi tên phải
          // cascade luôn, nếu không sẽ mồ côi giống bug car-goal-fund đã fix trước đó.
          gold:
            store.name !== originalName
              ? current.gold.map((p) => (p.store === originalName ? { ...p, store: store.name } : p))
              : current.gold,
        })
        toast.success(`Đã cập nhật cửa hàng "${store.name}"`)
      } catch {
        toast.error(`Không thể cập nhật cửa hàng "${store.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const removeGoldStore = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      // Chặn xoá khi còn purchase tham chiếu — không cascade-xoá purchase hay âm thầm
      // gán lại cửa hàng khác, tránh lặp lại lớp bug "orphan reference" theo hướng ngược.
      if (current.gold.some((p) => p.store === name)) {
        toast.error(`Không thể xoá "${name}" vì vẫn còn giao dịch mua vàng gắn với cửa hàng này.`)
        return
      }
      try {
        persist({ ...current, goldStores: current.goldStores.filter((s) => s.name !== name) })
        toast.success(`Đã xoá cửa hàng "${name}"`)
      } catch {
        toast.error(`Không thể xoá cửa hàng "${name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const addGold = useCallback(
    (purchase: Omit<GoldPurchase, "id">) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, gold: [{ ...purchase, id: nextId(current.gold) }, ...current.gold] })
        toast.success(`Đã thêm lần mua vàng ngày ${purchase.date}`)
      } catch {
        toast.error("Không thể thêm lần mua vàng. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const updateGold = useCallback(
    (id: number, purchase: Omit<GoldPurchase, "id">) => {
      const current = getStoredFinance()
      try {
        persist({
          ...current,
          gold: current.gold.map((p) => (p.id === id ? { ...purchase, id } : p)),
        })
        toast.success(`Đã cập nhật giao dịch vàng ngày ${purchase.date}`)
      } catch {
        toast.error("Không thể cập nhật giao dịch vàng. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const removeGold = useCallback(
    (id: number) => {
      const current = getStoredFinance()
      const date = current.gold.find((purchase) => purchase.id === id)?.date
      try {
        persist({ ...current, gold: current.gold.filter((purchase) => purchase.id !== id) })
        toast.success(date ? `Đã xoá giao dịch vàng ngày ${date}` : "Đã xoá giao dịch vàng")
      } catch {
        toast.error("Không thể xoá giao dịch vàng. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const addInvest = useCallback(
    (invest: Omit<Investment, "id">) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, invests: [...current.invests, { ...invest, id: nextId(current.invests) }] })
        toast.success(`Đã thêm khoản đầu tư "${invest.name}"`)
      } catch {
        toast.error("Không thể thêm khoản đầu tư. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const updateInvest = useCallback(
    (id: number, invest: Omit<Investment, "id">) => {
      const current = getStoredFinance()
      try {
        persist({
          ...current,
          invests: current.invests.map((i) => (i.id === id ? { ...invest, id } : i)),
        })
        toast.success(`Đã cập nhật khoản đầu tư "${invest.name}"`)
      } catch {
        toast.error("Không thể cập nhật khoản đầu tư. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const removeInvest = useCallback(
    (id: number) => {
      const current = getStoredFinance()
      const name = current.invests.find((i) => i.id === id)?.name
      try {
        persist({ ...current, invests: current.invests.filter((i) => i.id !== id) })
        toast.success(name ? `Đã xoá khoản đầu tư "${name}"` : "Đã xoá khoản đầu tư")
      } catch {
        toast.error("Không thể xoá khoản đầu tư. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  return {
    savings: state.savings,
    cards: state.cards,
    gold: state.gold,
    goldStores: state.goldStores,
    invests: state.invests,
    hydrated,
    addSavingsFund,
    updateSavingsFund,
    removeSavingsFund,
    addCard,
    updateCard,
    removeCard,
    payCard,
    addGoldStore,
    updateGoldStore,
    removeGoldStore,
    setGoldStorePrice,
    addGold,
    updateGold,
    removeGold,
    addInvest,
    updateInvest,
    removeInvest,
    replaceFinance: persist,
  }
}

export { useFinance }
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/hooks/use-finance.test.ts src/features/finance/__tests__/components/finance-view.test.tsx src/features/budget/__tests__/components/budget-view.test.tsx`
Expected: PASS toàn bộ (kể cả các test toast "…does not update state when storage write fails": `setStoredFinance` vẫn ném lỗi trước `setState` như cũ, và `getStoredFinance()` đọc tươi không đụng `setItem` nên `mockImplementationOnce` vẫn rơi đúng vào lần ghi)

- [ ] **Step 5: Commit**

```bash
git add src/features/finance/hooks/use-finance.ts src/features/finance/__tests__/hooks/use-finance.test.ts
git commit -m "fix: keep finance data written by another tab or a settlement instead of overwriting it"
```

---

### Task 3: `useBudget` tự đọc lại và ghi từ bản đọc tươi

**Files:**
- Modify: `src/features/budget/hooks/use-budget.ts` (toàn bộ file)
- Test: `src/features/budget/__tests__/hooks/use-budget.test.ts`

**Interfaces:**
- Consumes: `useStorageSync` (Task 1); `BUDGET_STORAGE_KEY`, `getStoredBudget`, `setStoredBudget` từ `../budget-storage` (đã có).
- Produces: `useBudget()` giữ nguyên shape; `confirmSettlement` gọi `applySavingsFundDelta(...)` trước rồi `const current = getStoredBudget()` (Plan 2 sửa tính nguyên tử trên nền này).

- [ ] **Step 1: Viết test thất bại**

Trong `src/features/budget/__tests__/hooks/use-budget.test.ts`, thay dòng

```ts
import { DEFAULT_BUDGET_STATE, getStoredBudget } from "../../budget-storage"
```

bằng:

```ts
import { BUDGET_STORAGE_KEY, DEFAULT_BUDGET_STATE, getStoredBudget, setStoredBudget } from "../../budget-storage"
```

Rồi thêm vào cuối file:

```ts
describe("useBudget — dữ liệu do nơi khác ghi", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps the salary and expenses another tab saved when adding an expense here, with a fresh id", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.expenses).toEqual([]))

    // Ghi thẳng, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_BUDGET_STATE,
        salaries: [{ month: "2026-09", amount: 20_000_000 }],
        expenses: [{ id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null }],
      })
    )
    act(() => {
      result.current.addExpense({ dayKey: "2026-09-02", amount: 10_000, tag: null })
    })

    expect(getStoredBudget().salaries).toEqual([{ month: "2026-09", amount: 20_000_000 }])
    expect(getStoredBudget().expenses.map((e) => e.id).sort((a, b) => a - b)).toEqual([1, 2])
  })

  it("shows expenses another tab added without reloading the page", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.expenses).toEqual([]))

    act(() => {
      window.localStorage.setItem(
        BUDGET_STORAGE_KEY,
        JSON.stringify({
          ...DEFAULT_BUDGET_STATE,
          expenses: [{ id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null }],
        })
      )
      window.dispatchEvent(new StorageEvent("storage", { key: BUDGET_STORAGE_KEY }))
    })

    expect(result.current.expenses).toHaveLength(1)
  })

  it("shows budget data written after this page mounted, e.g. a cloud pull that finished late", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.salaries).toEqual([]))

    // Trang Cài đặt đã unmount nhưng lần ghi của "Tải xuống" vẫn đi qua setStoredBudget (có notifyDataChanged).
    act(() => {
      setStoredBudget({ ...DEFAULT_BUDGET_STATE, salaries: [{ month: "2026-09", amount: 20_000_000 }] })
    })

    expect(result.current.salaries).toEqual([{ month: "2026-09", amount: 20_000_000 }])
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/budget/__tests__/hooks/use-budget.test.ts`
Expected: FAIL đúng 3 test mới — `expected [] to deeply equal [ { month: '2026-09', …(1) } ]` (lương tab khác bị xoá), `expected [] to have a length of 1 but got +0`, và `expected [] to deeply equal [ { month: '2026-09', …(1) } ]` (lần tải xuống xong muộn không hiện). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Viết lại `use-budget.ts`**

Thay toàn bộ nội dung `src/features/budget/hooks/use-budget.ts` bằng:

```ts
"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { applySavingsFundDelta } from "@/features/finance/finance-storage"
import { nextId } from "@/lib/next-id"
import { useStorageSync } from "@/lib/use-storage-sync"
import {
  BUDGET_STORAGE_KEY,
  DEFAULT_BUDGET_STATE,
  getStoredBudget,
  setStoredBudget,
  type BudgetState,
} from "../budget-storage"
import type { Expense, Settlement, SettlementDirection } from "../types"

interface AddExpenseInput {
  dayKey: string
  amount: number
  note?: string
  tag: Expense["tag"]
}

interface UpdateExpenseInput {
  amount: number
  note?: string
  tag: Expense["tag"]
}

function useBudget() {
  const [state, setState] = useState<BudgetState>(DEFAULT_BUDGET_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredBudget())
  }, [])

  // Tab khác thêm khoản chi, hay 1 lần tải xuống/nhập file ghi budget-data sau khi trang này đã mở.
  const reload = useCallback(() => setState(getStoredBudget()), [])
  useStorageSync(BUDGET_STORAGE_KEY, reload)

  const persist = useCallback((next: BudgetState) => {
    setStoredBudget(next)
    setState(next)
  }, [])

  // Mọi thao tác ghi dựng từ getStoredBudget() đọc tươi, không từ `state` trong closure — kể cả
  // nextId, để khoản chi mới không trùng id với khoản tab khác vừa thêm.

  const setSalary = useCallback(
    (month: string, amount: number) => {
      const current = getStoredBudget()
      try {
        const exists = current.salaries.some((s) => s.month === month)
        persist({
          ...current,
          salaries: exists
            ? current.salaries.map((s) => (s.month === month ? { ...s, amount } : s))
            : [...current.salaries, { month, amount }],
        })
        toast.success(`Đã lưu lương tháng ${month}`)
      } catch {
        toast.error("Không thể lưu lương. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const addExpense = useCallback(
    (input: AddExpenseInput) => {
      const current = getStoredBudget()
      try {
        const expense: Expense = { ...input, id: nextId(current.expenses) }
        persist({ ...current, expenses: [expense, ...current.expenses] })
      } catch {
        toast.error("Không thể ghi khoản chi. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const updateExpense = useCallback(
    (id: number, input: UpdateExpenseInput) => {
      const current = getStoredBudget()
      try {
        persist({
          ...current,
          expenses: current.expenses.map((e) => (e.id === id ? { ...e, ...input } : e)),
        })
        toast.success("Đã cập nhật khoản chi")
      } catch {
        toast.error("Không thể cập nhật khoản chi. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const removeExpense = useCallback(
    (id: number) => {
      const current = getStoredBudget()
      try {
        persist({ ...current, expenses: current.expenses.filter((e) => e.id !== id) })
        toast.success("Đã xoá khoản chi")
      } catch {
        toast.error("Không thể xoá khoản chi. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const confirmSettlement = useCallback(
    (month: string, fundName: string, direction: SettlementDirection, amount: number) => {
      const result = applySavingsFundDelta(fundName, direction, amount)
      if (!result.ok) {
        toast.error(
          result.reason === "fund-not-found"
            ? `Không tìm thấy quỹ "${fundName}".`
            : `Quỹ "${fundName}" không đủ số dư để rút ${amount.toLocaleString("vi-VN")} đ.`
        )
        return
      }

      const current = getStoredBudget()
      try {
        const settlement: Settlement = {
          id: nextId(current.settlements),
          month,
          at: new Date().toISOString(),
          direction,
          amount,
          fundName,
          fundAmountBefore: result.before,
          fundAmountAfter: result.after,
        }
        persist({ ...current, settlements: [...current.settlements, settlement] })
        toast.success("Đã tất toán tháng")
      } catch {
        toast.error("Không thể ghi lại lịch sử tất toán. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  return {
    salaries: state.salaries,
    expenses: state.expenses,
    settlements: state.settlements,
    setSalary,
    addExpense,
    updateExpense,
    removeExpense,
    confirmSettlement,
    replaceBudget: persist,
  }
}

export { useBudget }
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/budget/__tests__/hooks/use-budget.test.ts src/features/budget/__tests__/components/budget-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

```bash
git add src/features/budget/hooks/use-budget.ts src/features/budget/__tests__/hooks/use-budget.test.ts
git commit -m "fix: keep budget data written by another tab or a late cloud pull instead of overwriting it"
```

---

### Task 4: `useJournal` tự đọc lại và ghi từ bản đọc tươi

**Files:**
- Modify: `src/features/journal/hooks/use-journal.ts` (toàn bộ file)
- Test: `src/features/journal/__tests__/hooks/use-journal.test.ts`

**Interfaces:**
- Consumes: `useStorageSync` (Task 1); `JOURNAL_STORAGE_KEY`, `getStoredJournal`, `setStoredJournal` từ `../journal-storage` (đã có).
- Produces: `useJournal()` giữ nguyên shape (`entries`, `saveEntry`, `updateEntry`, `deleteEntry`, `replaceJournal`).

- [ ] **Step 1: Viết test thất bại**

Thêm 2 test vào cuối `describe("useJournal", ...)` trong `src/features/journal/__tests__/hooks/use-journal.test.ts` (ngay trước `})` cuối file; `JOURNAL_STORAGE_KEY`, `getStoredJournal` đã được import sẵn ở đầu file):

```ts
  it("keeps an entry saved in another tab when saving one here", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 30))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    // Ghi thẳng, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    window.localStorage.setItem(
      JOURNAL_STORAGE_KEY,
      JSON.stringify({ entries: [{ id: 1, text: "Bài tab B", time: "09:00", date: "10/08", words: 3, mood: null }] })
    )
    act(() => {
      result.current.saveEntry({ text: "Bài tab A", words: 3, mood: null })
    })

    expect(getStoredJournal().entries.map((e) => e.text)).toEqual(["Bài tab A", "Bài tab B"])
  })

  it("shows an entry saved in another tab without reloading the page", async () => {
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    act(() => {
      window.localStorage.setItem(
        JOURNAL_STORAGE_KEY,
        JSON.stringify({ entries: [{ id: 1, text: "Bài tab B", time: "09:00", date: "10/08", words: 3, mood: null }] })
      )
      window.dispatchEvent(new StorageEvent("storage", { key: JOURNAL_STORAGE_KEY }))
    })

    expect(result.current.entries).toHaveLength(1)
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/journal/__tests__/hooks/use-journal.test.ts`
Expected: FAIL đúng 2 test mới — `expected [ 'Bài tab A' ] to deeply equal [ 'Bài tab A', 'Bài tab B' ]` và `expected [] to have a length of 1 but got +0`. Mọi test cũ vẫn PASS.

- [ ] **Step 3: Viết lại `use-journal.ts`**

Thay toàn bộ nội dung `src/features/journal/hooks/use-journal.ts` bằng:

```ts
"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { useStorageSync } from "@/lib/use-storage-sync"
import {
  DEFAULT_JOURNAL_STATE,
  JOURNAL_STORAGE_KEY,
  getStoredJournal,
  setStoredJournal,
  type JournalState,
} from "../journal-storage"
import type { JournalEntry, MoodSnapshot } from "../types"

interface SaveEntryInput {
  text: string
  words: number
  mood: MoodSnapshot | null
}

function useJournal() {
  const [state, setState] = useState<JournalState>(DEFAULT_JOURNAL_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredJournal())
  }, [])

  // Bài lưu ở tab khác (hay từ 1 lần nhập file/tải xuống) hiện ra ngay, không đợi tải lại trang.
  const reload = useCallback(() => setState(getStoredJournal()), [])
  useStorageSync(JOURNAL_STORAGE_KEY, reload)

  const persist = useCallback((next: JournalState) => {
    setStoredJournal(next)
    setState(next)
  }, [])

  // Lưu/sửa/xoá đều dựng từ getStoredJournal() đọc tươi — nếu dựng từ `state` đã tải lúc mở trang,
  // bài vừa lưu ở tab khác sẽ bị ghi đè mất, mà bài nhật ký thì không viết lại được.

  const saveEntry = useCallback(
    (input: SaveEntryInput): JournalEntry | null => {
      const now = new Date()
      const entry: JournalEntry = {
        id: now.getTime(),
        text: input.text,
        time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        date: `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}`,
        words: input.words,
        mood: input.mood,
      }

      const current = getStoredJournal()
      try {
        persist({ entries: [entry, ...current.entries] })
        return entry
      } catch {
        toast.error("Không thể lưu bài viết. Vui lòng thử lại.")
        return null
      }
    },
    [persist]
  )

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

  return {
    entries: state.entries,
    saveEntry,
    updateEntry,
    deleteEntry,
    replaceJournal: persist,
  }
}

export { useJournal }
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/journal/__tests__/hooks/use-journal.test.ts src/features/journal/__tests__/components/journal-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

```bash
git add src/features/journal/hooks/use-journal.ts src/features/journal/__tests__/hooks/use-journal.test.ts
git commit -m "fix: keep journal entries saved in another tab instead of erasing them"
```

---

### Task 5: `useStudy` và `useNetWorthHistory` đọc lại khi nơi khác ghi

**Files:**
- Modify: `src/features/study/hooks/use-study.ts:5-13` (import) và ngay sau effect hydrate (dòng 26-33)
- Modify: `src/features/overview/hooks/use-net-worth-history.ts:5-12` (import) và ngay sau effect hydrate (dòng 24-30)
- Test: `src/features/study/__tests__/hooks/use-study.test.ts`, `src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`

**Interfaces:**
- Consumes: `useStorageSync` (Task 1); `STUDY_STORAGE_KEY` (`../study-storage`), `NET_WORTH_HISTORY_KEY` (`../net-worth-history-storage`) — đã export sẵn.
- Produces: không đổi shape trả về. `reload` của mỗi hook cập nhật ref (`stateRef`/`historyRef`) ĐỒNG BỘ trước `setState` — mutation vẫn đọc ref như cũ nên thấy ngay dữ liệu vừa đọc lại. Không đụng cơ chế `historyRef` chống race hydrate của `recordSnapshot`: effect hydrate vẫn chạy trước, `useStorageSync` đăng ký ngay sau nó trong cùng component, và `OverviewView` vẫn chỉ gọi `recordSnapshot` khi `useFinance` đã `hydrated`. Lần ghi của chính hook (`persist`/`recordSnapshot`) cũng làm `reload` chạy 1 lần — chỉ đọc lại đúng bản vừa ghi, không ghi thêm gì nên không có vòng lặp.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("useStudy", ...)` trong `src/features/study/__tests__/hooks/use-study.test.ts` (ngay trước `})` cuối file; `STUDY_STORAGE_KEY`, `DEFAULT_STUDY_STATE`, `getStoredStudy` đã được import sẵn):

```ts
  it("keeps a word another tab marked as learned when grading a word here", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.hydrated).toBe(true))

    act(() => {
      window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify({ ...DEFAULT_STUDY_STATE, learned: ["v-0007"] }))
      window.dispatchEvent(new StorageEvent("storage", { key: STUDY_STORAGE_KEY }))
    })
    expect(result.current.learned).toEqual(["v-0007"])

    act(() => {
      result.current.gradeWord("v-0001", "good")
    })

    expect(getStoredStudy().learned).toEqual(["v-0007"])
    expect(getStoredStudy().wordReviews["v-0001"]).toBeDefined()
  })
```

Trong `src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`, thay dòng import đầu file

```ts
import { describe, it, expect, beforeEach } from "vitest"
```

bằng

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
```

và thay dòng

```ts
import { getStoredNetWorthHistory, setStoredNetWorthHistory } from "../../net-worth-history-storage"
```

bằng

```ts
import { NET_WORTH_HISTORY_KEY, getStoredNetWorthHistory, setStoredNetWorthHistory } from "../../net-worth-history-storage"
```

rồi thêm vào cuối file:

```ts
describe("useNetWorthHistory — dữ liệu do tab khác ghi", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 20, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("builds on a snapshot another tab recorded instead of overwriting it", async () => {
    const { result } = renderHook(() => useNetWorthHistory())
    await waitFor(() => expect(result.current.history).toEqual([]))

    act(() => {
      window.localStorage.setItem(
        NET_WORTH_HISTORY_KEY,
        JSON.stringify([{ date: "2026-09-19", net: 1, savingsTotal: 1 }])
      )
      window.dispatchEvent(new StorageEvent("storage", { key: NET_WORTH_HISTORY_KEY }))
    })
    expect(result.current.history).toHaveLength(1)

    act(() => {
      result.current.recordSnapshot(5, 5)
    })

    expect(getStoredNetWorthHistory()).toEqual([
      { date: "2026-09-19", net: 1, savingsTotal: 1 },
      { date: "2026-09-20", net: 5, savingsTotal: 5 },
    ])
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/study/__tests__/hooks/use-study.test.ts src/features/overview/__tests__/hooks/use-net-worth-history.test.ts`
Expected: FAIL đúng 2 test mới — `expected [] to deeply equal [ 'v-0007' ]` và `expected [] to have a length of 1 but got +0`. Mọi test cũ vẫn PASS.

- [ ] **Step 3: Thêm `reload` vào `use-study.ts`**

Thay khối import (dòng 5-13)

```ts
import { dayKey } from "@/lib/date"
import { nextStreak } from "../game-calculations"
import { applyGrade, ensureReviewStates, initialReviewState, seedLearnedReviewState } from "../srs-calculations"
import {
  DEFAULT_STUDY_STATE,
  getStoredStudy,
  setStoredStudy,
  type StudyState,
} from "../study-storage"
```

bằng:

```ts
import { dayKey } from "@/lib/date"
import { useStorageSync } from "@/lib/use-storage-sync"
import { nextStreak } from "../game-calculations"
import { applyGrade, ensureReviewStates, initialReviewState, seedLearnedReviewState } from "../srs-calculations"
import {
  DEFAULT_STUDY_STATE,
  STUDY_STORAGE_KEY,
  getStoredStudy,
  setStoredStudy,
  type StudyState,
} from "../study-storage"
```

Ngay sau effect hydrate (khối `useEffect(() => { ... setHydrated(true) }, [])`), trước `const persist = useCallback(...)`, thêm:

```ts
  // Tab khác (hay 1 lần nhập file/tải xuống) ghi study-progress → đọc lại. Cập nhật stateRef TRƯỚC
  // setState, cùng lý do stateRef tồn tại: action gọi ngay sau đó phải thấy dữ liệu mới nhất.
  const reload = useCallback(() => {
    const loaded = getStoredStudy()
    stateRef.current = loaded
    setState(loaded)
  }, [])
  useStorageSync(STUDY_STORAGE_KEY, reload)
```

- [ ] **Step 4: Thêm `reload` vào `use-net-worth-history.ts`**

Thay khối import (dòng 5-12)

```ts
import { dayKey } from "@/lib/date"
import { appendSnapshot } from "../net-worth-history-calculations"
import {
  DEFAULT_NET_WORTH_HISTORY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
  type NetWorthHistory,
} from "../net-worth-history-storage"
```

bằng:

```ts
import { dayKey } from "@/lib/date"
import { useStorageSync } from "@/lib/use-storage-sync"
import { appendSnapshot } from "../net-worth-history-calculations"
import {
  DEFAULT_NET_WORTH_HISTORY,
  NET_WORTH_HISTORY_KEY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
  type NetWorthHistory,
} from "../net-worth-history-storage"
```

Ngay sau effect hydrate (khối `useEffect(() => { ... setHistory(loaded) }, [])`), trước `const recordSnapshot = useCallback(...)`, thêm:

```ts
  // Tab khác ghi snapshot (hay 1 lần nhập file/tải xuống) → đọc lại, cập nhật historyRef trước để
  // recordSnapshot kế tiếp nối tiếp đúng lịch sử mới nhất thay vì ghi đè nó.
  const reload = useCallback(() => {
    const loaded = getStoredNetWorthHistory()
    historyRef.current = loaded
    setHistory(loaded)
  }, [])
  useStorageSync(NET_WORTH_HISTORY_KEY, reload)
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/study/__tests__/hooks/use-study.test.ts src/features/overview/__tests__/hooks/use-net-worth-history.test.ts src/features/overview/__tests__/components/overview-view.test.tsx src/features/study/__tests__/components/study-view.test.tsx`
Expected: PASS toàn bộ — kể cả test hồi quy "preserves and appends to pre-existing history when a consumer calls recordSnapshot from its own mount effect" và "does not lose a grade when gradeWord and recordGameResult are called in the same tick"

- [ ] **Step 6: Commit**

```bash
git add src/features/study/hooks/use-study.ts src/features/overview/hooks/use-net-worth-history.ts src/features/study/__tests__/hooks/use-study.test.ts src/features/overview/__tests__/hooks/use-net-worth-history.test.ts
git commit -m "fix: re-read study progress and net-worth history when another tab writes them"
```

---

### Task 6: `useSettings` và `useCarGoalFund` đọc lại khi nơi khác ghi

**Files:**
- Modify: `src/features/settings/hooks/use-settings.ts` (toàn bộ file)
- Modify: `src/features/goals/car-goal-storage.ts:19` (export thêm key)
- Modify: `src/features/goals/hooks/use-car-goal-fund.ts` (toàn bộ file)
- Test: `src/features/settings/__tests__/hooks/use-settings.test.ts`, `src/features/goals/__tests__/hooks/use-car-goal-fund.test.ts`

**Interfaces:**
- Consumes: `useStorageSync` (Task 1); `SETTINGS_STORAGE_KEY`, `getStoredSettings` từ `@/lib/settings-storage` (đã có).
- Produces: hàm cấp module `reloadSettingsFromStorage()` trong `use-settings.ts` (Plan 6b mang theo khi chuyển file); mọi mutation của `useSettings` dựng từ `getStoredSettings()` đọc tươi, deps `[persist]`; `CAR_GOAL_FUND_KEY` là export mới của `car-goal-storage.ts`. Shape trả về của 2 hook không đổi.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("useSettings", ...)` trong `src/features/settings/__tests__/hooks/use-settings.test.ts` (ngay trước `})` cuối file; `DEFAULT_SETTINGS`, `SETTINGS_STORAGE_KEY`, `getStoredSettings` đã được import sẵn):

```ts
  it("reloads the shared settings when another tab changes them", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ ...DEFAULT_SETTINGS, profile: { displayName: "Tùng", greeting: "Chào buổi sáng, Tùng" } })
      )
      window.dispatchEvent(new StorageEvent("storage", { key: SETTINGS_STORAGE_KEY }))
    })

    expect(result.current.settings.profile.displayName).toBe("Tùng")
  })

  it("keeps a module another tab turned off when this tab toggles a tag before it has re-read", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    // Ghi thẳng, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    const modules = DEFAULT_SETTINGS.modules.map((m, i) => (i === 0 ? { ...m, on: false } : m))
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, modules }))
    act(() => {
      result.current.toggleTag(0)
    })

    expect(getStoredSettings().modules[0].on).toBe(false)
    expect(getStoredSettings().tags[0].on).toBe(false)
  })
```

Trong `src/features/goals/__tests__/hooks/use-car-goal-fund.test.ts`, thay dòng

```ts
import { getCarGoalFundName } from "../../car-goal-storage"
```

bằng

```ts
import { getCarGoalFundName, setCarGoalFundName } from "../../car-goal-storage"
```

rồi thêm vào cuối `describe("useCarGoalFund", ...)` (ngay trước `})` cuối file):

```ts
  it("follows a link changed elsewhere in this tab, e.g. a fund rename on the Tài chính page", async () => {
    const { result } = renderHook(() => useCarGoalFund())
    await waitFor(() => expect(result.current.fundName).toBeNull())

    act(() => {
      setCarGoalFundName("Quỹ mua xe")
    })

    expect(result.current.fundName).toBe("Quỹ mua xe")
  })

  it("follows a link another tab removed", async () => {
    window.localStorage.setItem("car-goal-fund-name", "Quỹ cũ")
    const { result } = renderHook(() => useCarGoalFund())
    await waitFor(() => expect(result.current.fundName).toBe("Quỹ cũ"))

    act(() => {
      window.localStorage.removeItem("car-goal-fund-name")
      window.dispatchEvent(new StorageEvent("storage", { key: "car-goal-fund-name" }))
    })

    expect(result.current.fundName).toBeNull()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/hooks/use-settings.test.ts src/features/goals/__tests__/hooks/use-car-goal-fund.test.ts`
Expected: FAIL đúng 4 test mới — `expected 'Tungnh2k1' to be 'Tùng'`, `expected true to be false` (toggle tag ở tab này bật lại module tab kia đã tắt), `expected null to be 'Quỹ mua xe'`, `expected 'Quỹ cũ' to be null`. Mọi test cũ vẫn PASS.

- [ ] **Step 3: Viết lại `use-settings.ts`**

Thay toàn bộ nội dung `src/features/settings/hooks/use-settings.ts` bằng (khác bản cũ: import `SETTINGS_STORAGE_KEY` + `useStorageSync`; hàm module `reloadSettingsFromStorage` dùng cho cả effect hydrate lẫn `useStorageSync`; mỗi mutation mở đầu bằng `const current = getStoredSettings()`, dùng `current` thay `settings`, deps `[persist]` — toast và logic giữ nguyên):

```ts
"use client"

import { useCallback, useEffect } from "react"
import { create } from "zustand"

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  TINT_PALETTE,
  getStoredSettings,
  setStoredSettings,
  type AppSettings,
  type Mood,
  type Profile,
} from "@/lib/settings-storage"
import { useStorageSync } from "@/lib/use-storage-sync"
import { toast } from "sonner"

interface SettingsStore {
  settings: AppSettings
  setSettings: (next: AppSettings) => void
}

const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: (next) => {
    setStoredSettings(next)
    set({ settings: next })
  },
}))

// Hàm cấp module (không phải closure) nên luôn ổn định — useStorageSync không phải đăng ký lại
// mỗi lần render. Chỉ đọc storage rồi nạp vào store dùng chung, không ghi gì.
function reloadSettingsFromStorage() {
  useSettingsStore.setState({ settings: getStoredSettings() })
}

function useSettings() {
  const settings = useSettingsStore((s) => s.settings)
  const setSettings = useSettingsStore((s) => s.setSettings)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // Không gate "chỉ hydrate 1 lần": mỗi component mount (sidebar, settings,
    // tổng quan...) đều tự đồng bộ store dùng chung theo giá trị mới nhất.
    reloadSettingsFromStorage()
  }, [])

  // Tab khác đổi cài đặt (hay 1 lần nhập file/tải xuống) → nạp lại store dùng chung.
  useStorageSync(SETTINGS_STORAGE_KEY, reloadSettingsFromStorage)

  const persist = useCallback((next: AppSettings) => setSettings(next), [setSettings])

  // Mọi thao tác ghi dựng từ getStoredSettings() đọc tươi, không từ `settings` của lần render
  // hiện tại — tab khác có thể vừa đổi module/mood/nhãn mà tab này chưa kịp nhận sự kiện.

  const updateProfile = useCallback(
    (profile: Partial<Profile>) => {
      const current = getStoredSettings()
      persist({ ...current, profile: { ...current.profile, ...profile } })
    },
    [persist]
  )

  const toggleModule = useCallback(
    (index: number) => {
      const current = getStoredSettings()
      persist({
        ...current,
        modules: current.modules.map((m, i) => (i === index ? { ...m, on: !m.on } : m)),
      })
    },
    [persist]
  )

  const toggleMood = useCallback(
    (index: number) => {
      const current = getStoredSettings()
      persist({
        ...current,
        moods: current.moods.map((m, i) => (i === index ? { ...m, on: !m.on } : m)),
      })
    },
    [persist]
  )

  const removeMood = useCallback(
    (index: number) => {
      const current = getStoredSettings()
      const label = current.moods[index]?.label
      try {
        persist({ ...current, moods: current.moods.filter((_, i) => i !== index) })
        toast.success(label ? `Đã xoá tâm trạng "${label}"` : "Đã xoá tâm trạng")
      } catch {
        toast.error("Không thể xoá tâm trạng. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const addMood = useCallback(
    (mood: Omit<Mood, "tint" | "on" | "score">) => {
      const current = getStoredSettings()
      try {
        const tint = TINT_PALETTE[current.moods.length % TINT_PALETTE.length]
        persist({ ...current, moods: [...current.moods, { ...mood, tint, on: true, score: 3 }] })
        toast.success(`Đã thêm tâm trạng "${mood.label}"`)
      } catch {
        toast.error(`Không thể thêm tâm trạng "${mood.label}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const toggleTag = useCallback(
    (index: number) => {
      const current = getStoredSettings()
      persist({
        ...current,
        tags: current.tags.map((t, i) => (i === index ? { ...t, on: !t.on } : t)),
      })
    },
    [persist]
  )

  const dismissInsight = useCallback(
    (id: string) => {
      const current = getStoredSettings()
      if (current.dismissedInsights.includes(id)) return
      persist({ ...current, dismissedInsights: [...current.dismissedInsights, id] })
    },
    [persist]
  )

  return {
    settings,
    updateProfile,
    toggleModule,
    toggleMood,
    removeMood,
    addMood,
    toggleTag,
    dismissInsight,
    replaceSettings: persist,
  }
}

export { useSettings }
```

- [ ] **Step 4: Export key trong `car-goal-storage.ts` và viết lại `use-car-goal-fund.ts`**

Sửa dòng cuối `src/features/goals/car-goal-storage.ts` từ `export { getCarGoalFundName, setCarGoalFundName }` thành:

```ts
export { CAR_GOAL_FUND_KEY, getCarGoalFundName, setCarGoalFundName }
```

Thay toàn bộ `src/features/goals/hooks/use-car-goal-fund.ts` bằng:

```ts
"use client"

import { useCallback, useEffect, useState } from "react"

import { useStorageSync } from "@/lib/use-storage-sync"
import { CAR_GOAL_FUND_KEY, getCarGoalFundName, setCarGoalFundName } from "../car-goal-storage"

function useCarGoalFund() {
  const [fundName, setFundName] = useState<string | null>(null)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFundName(getCarGoalFundName())
  }, [])

  // Xoá/đổi tên quỹ ở trang Tài chính, nhập file, tải xuống hay tab khác đều có thể đổi liên kết.
  const reload = useCallback(() => setFundName(getCarGoalFundName()), [])
  useStorageSync(CAR_GOAL_FUND_KEY, reload)

  const selectFund = useCallback((name: string | null) => {
    setCarGoalFundName(name)
    setFundName(name)
  }, [])

  return { fundName, selectFund }
}

export { useCarGoalFund }
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/hooks/use-settings.test.ts src/features/goals/__tests__/hooks/use-car-goal-fund.test.ts src/features/goals/__tests__/components/goals-view.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx "src/app/(app)/_components/__tests__/sidebar.test.tsx"`
Expected: PASS toàn bộ (kể cả "shows an error toast and leaves state unchanged when addMood fails to persist": `getStoredSettings()` chỉ gọi `getItem`, `setItem` vẫn ném lỗi trong `setSettings` trước `set(...)` như cũ)

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/hooks/use-settings.ts src/features/goals/car-goal-storage.ts src/features/goals/hooks/use-car-goal-fund.ts src/features/settings/__tests__/hooks/use-settings.test.ts src/features/goals/__tests__/hooks/use-car-goal-fund.test.ts
git commit -m "fix: re-read settings and the car-goal link when they change elsewhere"
```

---

### Task 7: Ô "Tên hiển thị" luôn theo tên đang lưu

**Files:**
- Modify: `src/features/settings/components/profile-card.tsx:15-25,35-38`
- Test: `src/features/settings/__tests__/components/profile-card.test.tsx`

**Interfaces:**
- Consumes: không có gì mới — `ProfileCardProps` giữ nguyên (`displayName: string`, `onSave: (name: string) => void`). Task 6 làm `settings.profile.displayName` đổi theo cả tab khác.
- Produces: ô nhập hiện `draft ?? displayName`; `draft === null` (chưa gõ gì, hoặc vừa Lưu xong) thì luôn theo prop, kể cả khi prop đổi sau lúc mount (store settings hydrate xong sau lượt render đầu, nhập file, tải xuống, tab khác đổi tên); đang gõ dở thì giữ bản nháp.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("ProfileCard", ...)` trong `src/features/settings/__tests__/components/profile-card.test.tsx` (ngay trước `})` cuối file):

```tsx
  it("shows the saved name once it arrives after the first render (hydration, import, pull)", () => {
    const { rerender } = render(<ProfileCard displayName="Tungnh2k1" onSave={vi.fn()} />)

    rerender(<ProfileCard displayName="Tùng" onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên hiển thị", { exact: false })).toHaveValue("Tùng")
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("keeps what the user is typing when the saved name changes underneath", () => {
    const { rerender } = render(<ProfileCard displayName="Tùng" onSave={vi.fn()} />)
    fireEvent.change(screen.getByLabelText("Tên hiển thị", { exact: false }), {
      target: { value: "Tùng đang gõ" },
    })

    rerender(<ProfileCard displayName="Tên từ tab khác" onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên hiển thị", { exact: false })).toHaveValue("Tùng đang gõ")
    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()
  })

  it("follows the saved name again right after saving", () => {
    const { rerender } = render(<ProfileCard displayName="Tùng" onSave={vi.fn()} />)
    fireEvent.change(screen.getByLabelText("Tên hiển thị", { exact: false }), {
      target: { value: "  Tùng mới " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    rerender(<ProfileCard displayName="Tùng mới" onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên hiển thị", { exact: false })).toHaveValue("Tùng mới")
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
    expect(screen.getByText("Đã lưu")).toBeInTheDocument()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/components/profile-card.test.tsx`
Expected: FAIL đúng 2 test — "shows the saved name once it arrives after the first render…" (`expected the element to have value: Tùng` — ô vẫn là `"Tungnh2k1"`, `useState` bỏ qua prop mới) và "follows the saved name again right after saving" (ô vẫn là `"  Tùng mới "` chưa trim). Test "keeps what the user is typing…" đã xanh sẵn — đó là rào chắn để cách sửa không xoá chữ đang gõ.

- [ ] **Step 3: Sửa `profile-card.tsx`**

Thay đoạn từ `const [name, setName] = useState(displayName)` tới hết hàm `handleSave` (dòng 16-25) bằng:

```tsx
  // null = người dùng chưa gõ gì → ô luôn hiện đúng tên đang lưu, kể cả khi tên đổi sau lúc mount
  // (store settings hydrate xong sau lượt render đầu, nhập file, tải xuống, tab khác đổi tên).
  // Chỉ khi đang gõ dở mới giữ bản nháp, để 1 lần nạp lại dữ liệu không xoá chữ đang gõ.
  const [draft, setDraft] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const name = draft ?? displayName
  const trimmed = name.trim()
  const disabled = !trimmed || trimmed === displayName

  function handleSave() {
    onSave(trimmed)
    setDraft(null)
    setSaved(true)
  }
```

và trong `onChange` của `Field` (dòng 35-38) đổi `setName(e.target.value)` thành `setDraft(e.target.value)` (giữ nguyên `setSaved(false)` ngay sau).

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/components/profile-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx`
Expected: PASS toàn bộ (kể cả "saves a new display name, keeping the greeting prefix and persisting both to localStorage" của SettingsView: sau Lưu, ô hiện tên mới lấy từ store)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (2 gạch đầu dòng cuối của mục **4** ở "Kiểm tra tay" của Task 11 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/features/settings/components/profile-card.tsx src/features/settings/__tests__/components/profile-card.test.tsx
git commit -m "fix: keep the profile name field in sync with the saved name"
```

---

### Task 8: Tên quỹ và thẻ là duy nhất (bản trùng đã lưu + chặn ở hook)

**Files:**
- Modify: `src/features/finance/finance-storage.ts:69-113` (thêm `dedupeNames`, bọc `savings`/`cards` trong `parseFinanceState`)
- Modify: `src/features/finance/hooks/use-finance.ts` (`addSavingsFund`, `updateSavingsFund`, `addCard`, `updateCard` — bản sau Task 2)
- Test: `src/features/finance/__tests__/finance-storage.test.ts`, `src/features/settings/__tests__/data-transfer.test.ts`, `src/features/finance/__tests__/hooks/use-finance.test.ts`

**Interfaces:**
- Consumes: `useFinance` sau Task 2 (mỗi mutation có `const current = getStoredFinance()`).
- Produces: `parseFinanceState(...).savings`/`.cards` luôn có tên duy nhất (Quyết định 1) — qua đó `getStoredFinance()`, `applySavingsFundDelta()` và `parseImportPayload()` cũng vậy. Toast từ chối `Đã có quỹ tiết kiệm tên "${name}". Vui lòng chọn tên khác.` và `Đã có thẻ tín dụng tên "${name}". Vui lòng chọn tên khác.` — Task 9 chặn sớm ở form, hook là lớp chặn cuối (tab khác, modal điều chỉnh số dư). Task 10 sửa tiếp `addSavingsFund`/`updateSavingsFund` trên nền bản ở đây.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/features/finance/__tests__/finance-storage.test.ts` (mọi import cần dùng đã có sẵn ở đầu file):

```ts
describe("parseFinanceState — tên quỹ/thẻ trùng đã lưu", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renames later savings funds and cards that share a name so each one can be edited on its own", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        savings: [
          { name: "Quỹ A", amount: 100, target: 1_000 },
          { name: "Quỹ A", amount: 5_000, target: 9_000 },
          { name: "Quỹ A (2)", amount: 7, target: 8 },
        ],
        cards: [
          { name: "Visa", balance: 1, min: 1, limit: 10, due: "5" },
          { name: "Visa", balance: 2, min: 2, limit: 20, due: "6" },
        ],
      })
    )

    const state = getStoredFinance()

    // Mục đầu giữ tên (là mục FundPicker/mục tiêu xe/tất toán vốn đang chọn); "Quỹ A (2)" đã có sẵn
    // nên bản trùng thứ 2 nhận "Quỹ A (3)". Không số dư nào bị mất.
    expect(state.savings.map((f) => [f.name, f.amount])).toEqual([
      ["Quỹ A", 100],
      ["Quỹ A (3)", 5_000],
      ["Quỹ A (2)", 7],
    ])
    expect(state.cards.map((c) => [c.name, c.balance])).toEqual([
      ["Visa", 1],
      ["Visa (2)", 2],
    ])
  })

  it("deposits a settlement into one fund only, even when the stored data had two funds with that name", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        savings: [
          { name: "Quỹ A", amount: 100, target: 1_000 },
          { name: "Quỹ A", amount: 5_000, target: 9_000 },
        ],
      })
    )

    const result = applySavingsFundDelta("Quỹ A", "deposit", 10)

    expect(result).toEqual({ ok: true, before: 100, after: 110 })
    expect(getStoredFinance().savings.map((f) => [f.name, f.amount])).toEqual([
      ["Quỹ A", 110],
      ["Quỹ A (2)", 5_000],
    ])
  })
})
```

Thêm vào cuối `describe("parseImportPayload", ...)` trong `src/features/settings/__tests__/data-transfer.test.ts` (ngay trước `})` cuối file):

```ts
  it("renames duplicate fund and card names from a backup so each keeps its own balance", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      finance: {
        savings: [
          { name: "Quỹ A", amount: 100, target: 1_000 },
          { name: "Quỹ A", amount: 5_000, target: 9_000 },
        ],
        cards: [
          { name: "Visa", balance: 1, min: 1, limit: 10, due: "5" },
          { name: "Visa", balance: 2, min: 2, limit: 20, due: "6" },
        ],
      },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.finance.savings.map((f) => [f.name, f.amount])).toEqual([
        ["Quỹ A", 100],
        ["Quỹ A (2)", 5_000],
      ])
      expect(result.data.finance.cards.map((c) => [c.name, c.balance])).toEqual([
        ["Visa", 1],
        ["Visa (2)", 2],
      ])
    }
  })
```

Thêm vào cuối `src/features/finance/__tests__/hooks/use-finance.test.ts` (mọi import cần dùng — `toast`, `setCarGoalFundName`, `getCarGoalFundName`, `setStoredBudget`, `getStoredBudget`, `DEFAULT_BUDGET_STATE`, `setStoredFinance`, `getStoredFinance`, `DEFAULT_FINANCE_STATE` — đã có sẵn ở đầu file):

```ts
describe("useFinance — tên quỹ và thẻ không được trùng", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("addSavingsFund refuses a name another fund already has", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.hydrated).toBe(true))

    act(() => result.current.addSavingsFund({ name: "Quỹ A", amount: 100, target: 1_000 }))
    act(() => result.current.addSavingsFund({ name: "Quỹ A", amount: 999, target: 9_999 }))

    expect(result.current.savings).toEqual([{ name: "Quỹ A", amount: 100, target: 1_000 }])
    expect(getStoredFinance().savings).toHaveLength(1)
    expect(toast.error).toHaveBeenCalledWith('Đã có quỹ tiết kiệm tên "Quỹ A". Vui lòng chọn tên khác.')
  })

  it("updateSavingsFund refuses to rename onto another fund and touches neither the car goal nor settlements", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [
        { name: "Quỹ A", amount: 100, target: 1_000 },
        { name: "Quỹ B", amount: 200, target: 2_000 },
      ],
    })
    setCarGoalFundName("Quỹ B")
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      settlements: [
        {
          id: 1,
          month: "2026-09",
          at: "2026-09-30T00:00:00.000Z",
          direction: "deposit",
          amount: 50_000,
          fundName: "Quỹ B",
          fundAmountBefore: 0,
          fundAmountAfter: 50_000,
        },
      ],
    })
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toHaveLength(2))

    act(() => result.current.updateSavingsFund("Quỹ B", { name: "Quỹ A", amount: 200, target: 2_000 }))

    expect(result.current.savings.map((f) => f.name)).toEqual(["Quỹ A", "Quỹ B"])
    expect(getStoredFinance().savings.map((f) => f.amount)).toEqual([100, 200])
    expect(getCarGoalFundName()).toBe("Quỹ B")
    expect(getStoredBudget().settlements[0].fundName).toBe("Quỹ B")
    expect(toast.error).toHaveBeenCalledWith('Đã có quỹ tiết kiệm tên "Quỹ A". Vui lòng chọn tên khác.')
  })

  it("updateSavingsFund still saves when the name is kept (e.g. the balance-adjust modal)", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.hydrated).toBe(true))

    act(() => result.current.addSavingsFund({ name: "Quỹ A", amount: 100, target: 1_000 }))
    act(() => result.current.updateSavingsFund("Quỹ A", { name: "Quỹ A", amount: 150, target: 1_000 }))

    expect(result.current.savings).toEqual([{ name: "Quỹ A", amount: 150, target: 1_000 }])
  })

  it("addCard and updateCard refuse a name another card already has", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.hydrated).toBe(true))

    act(() => result.current.addCard({ name: "Visa", balance: 1, min: 1, limit: 10, due: "5" }))
    act(() => result.current.addCard({ name: "Visa", balance: 2, min: 2, limit: 20, due: "6" }))
    act(() => result.current.addCard({ name: "Master", balance: 3, min: 3, limit: 30, due: "7" }))
    act(() => result.current.updateCard("Master", { name: "Visa", balance: 3, min: 3, limit: 30, due: "7" }))

    expect(result.current.cards.map((c) => [c.name, c.balance])).toEqual([
      ["Visa", 1],
      ["Master", 3],
    ])
    expect(toast.error).toHaveBeenCalledWith('Đã có thẻ tín dụng tên "Visa". Vui lòng chọn tên khác.')
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/finance-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts src/features/finance/__tests__/hooks/use-finance.test.ts`
Expected: FAIL — 2 test storage mới (`["Quỹ A", 5000]` vẫn giữ tên trùng; `["Quỹ A", 110]` bị ghi vào cả 2 quỹ), test data-transfer mới (`"Quỹ A"` thay vì `"Quỹ A (2)"`), và 3 test hook từ chối trùng (danh sách có 2 mục cùng tên, `toast.error` không được gọi). Test "updateSavingsFund still saves when the name is kept…" đã xanh sẵn — rào chắn để lớp chặn không chặn nhầm việc sửa số dư.

- [ ] **Step 3: Thêm `dedupeNames` vào `finance-storage.ts`**

Ngay trên `function isObject(value: unknown): value is Record<string, unknown> {`, thêm:

```ts
// Quỹ và thẻ được định danh bằng TÊN ở mọi nơi (sửa, xoá, trả thẻ, tất toán ngân sách, liên kết
// mục tiêu mua xe, React key) — 2 mục trùng tên thì thao tác trên 1 mục sẽ đè/xoá luôn mục kia.
// Bản lưu cũ (hay file sao lưu cũ) lỡ có trùng: giữ nguyên tên mục ĐẦU TIÊN (đúng mục mà find() ở
// FundPicker/getGoals/applySavingsFundDelta vốn đang chọn), đổi các mục sau thành "Tên (2)",
// "Tên (3)"... — không mất số dư nào, người dùng tự đổi lại tên cho đúng ý.
function dedupeNames<T extends { name: string }>(items: T[]): T[] {
  const taken = new Set(items.map((item) => item.name))
  const seen = new Set<string>()
  return items.map((item) => {
    if (!seen.has(item.name)) {
      seen.add(item.name)
      return item
    }
    let n = 2
    while (taken.has(`${item.name} (${n})`)) n++
    const name = `${item.name} (${n})`
    taken.add(name)
    seen.add(name)
    return { ...item, name }
  })
}
```

Rồi trong `return { ... }` của `parseFinanceState`, thay 2 dòng đầu

```ts
    savings: safeField(z.array(savingsFundSchema), parsed.savings, DEFAULT_FINANCE_STATE.savings),
    cards: safeField(z.array(creditCardSchema), parsed.cards, DEFAULT_FINANCE_STATE.cards),
```

bằng:

```ts
    savings: dedupeNames(safeField(z.array(savingsFundSchema), parsed.savings, DEFAULT_FINANCE_STATE.savings)),
    cards: dedupeNames(safeField(z.array(creditCardSchema), parsed.cards, DEFAULT_FINANCE_STATE.cards)),
```

- [ ] **Step 4: Chặn trùng tên trong `use-finance.ts`**

Thay 4 hàm `addSavingsFund`, `updateSavingsFund`, `addCard`, `updateCard` (bản sau Task 2) bằng đúng nội dung dưới; các hàm khác giữ nguyên.

```ts
  const addSavingsFund = useCallback(
    (fund: SavingsFund) => {
      const current = getStoredFinance()
      // Quỹ định danh bằng tên ở mọi nơi — trùng tên thì sửa/xoá/tất toán 1 quỹ sẽ đè luôn quỹ kia.
      if (current.savings.some((f) => f.name === fund.name)) {
        toast.error(`Đã có quỹ tiết kiệm tên "${fund.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({ ...current, savings: [...current.savings, fund] })
        toast.success(`Đã thêm quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể thêm quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const updateSavingsFund = useCallback(
    (originalName: string, fund: SavingsFund) => {
      const current = getStoredFinance()
      if (fund.name !== originalName && current.savings.some((f) => f.name === fund.name)) {
        toast.error(`Đã có quỹ tiết kiệm tên "${fund.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({
          ...current,
          savings: current.savings.map((f) => (f.name === originalName ? fund : f)),
        })
        // Mục tiêu "mua xe" link theo tên quỹ (không có id) — đổi tên quỹ đang link
        // thì phải đổi luôn tên lưu ở car-goal-storage, nếu không link sẽ bị mồ côi.
        if (fund.name !== originalName && getCarGoalFundName() === originalName) {
          setCarGoalFundName(fund.name)
        }
        // Lịch sử tất toán ngân sách cũng tham chiếu quỹ theo tên — cascade tương tự
        // để lịch sử vẫn hiển thị đúng tên hiện tại của quỹ.
        if (fund.name !== originalName) {
          renameFundInSettlements(originalName, fund.name)
        }
        toast.success(`Đã cập nhật quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể cập nhật quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )
```

```ts
  const addCard = useCallback(
    (card: CreditCard) => {
      const current = getStoredFinance()
      // Thẻ định danh bằng tên (trả thẻ, sửa, xoá) — trùng tên thì trả 1 thẻ sẽ trừ nợ cả 2.
      if (current.cards.some((c) => c.name === card.name)) {
        toast.error(`Đã có thẻ tín dụng tên "${card.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({ ...current, cards: [...current.cards, card] })
        toast.success(`Đã thêm thẻ tín dụng "${card.name}"`)
      } catch {
        toast.error(`Không thể thêm thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )
```

```ts
  const updateCard = useCallback(
    (originalName: string, card: CreditCard) => {
      const current = getStoredFinance()
      if (card.name !== originalName && current.cards.some((c) => c.name === card.name)) {
        toast.error(`Đã có thẻ tín dụng tên "${card.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({
          ...current,
          cards: current.cards.map((c) => (c.name === originalName ? card : c)),
        })
        toast.success(`Đã cập nhật thẻ tín dụng "${card.name}"`)
      } catch {
        toast.error(`Không thể cập nhật thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/finance-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts src/features/finance/__tests__/hooks/use-finance.test.ts src/features/finance/__tests__/components/finance-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 6: Commit**

```bash
git add src/features/finance/finance-storage.ts src/features/finance/hooks/use-finance.ts src/features/finance/__tests__/finance-storage.test.ts src/features/settings/__tests__/data-transfer.test.ts src/features/finance/__tests__/hooks/use-finance.test.ts
git commit -m "fix: keep savings fund and credit card names unique"
```

---

### Task 9: Form quỹ/thẻ chặn tên trùng ngay khi gõ

**Files:**
- Modify: `src/features/finance/components/add-savings-fund-form.tsx:9-13,37,44-50,84`
- Modify: `src/features/finance/components/edit-savings-fund-modal.tsx:10-16,36,56-62`
- Modify: `src/features/finance/components/savings-tab.tsx:33,90,98-105`
- Modify: `src/features/finance/components/add-credit-card-form.tsx:9-13,41,48-63,107`
- Modify: `src/features/finance/components/edit-credit-card-modal.tsx:10-16,40,61-76`
- Modify: `src/features/finance/components/credit-cards-tab.tsx:36,132,141-148`
- Test: `src/features/finance/__tests__/components/savings-tab.test.tsx`, `src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx`, `src/features/finance/__tests__/components/credit-cards-tab.test.tsx`, `src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx`

**Interfaces:**
- Consumes: `Field` (`@/components/ui/field`) có sẵn `invalid?: boolean` và `hint?: ReactNode` (hint đỏ khi `invalid`).
- Produces: prop tuỳ chọn `existingNames?: string[]` (mặc định `[]`) trên `AddSavingsFundForm`, `EditSavingsFundModal`, `AddCreditCardForm`, `EditCreditCardModal`; hint `Đã có quỹ tên này — chọn tên khác` / `Đã có thẻ tên này — chọn tên khác`. So khớp sau khi trim. Modal sửa bỏ qua tên hiện tại của chính mục đang sửa (`fund.name`/`card.name`). Chặn ở form nên nút bị khoá và chữ đã gõ được giữ (nếu chỉ để hook từ chối, form vẫn `reset()` và mất chữ).

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/features/finance/__tests__/components/savings-tab.test.tsx` (sau `})` đóng `describe("SavingsTab", ...)`; `render`, `screen`, `fireEvent`, `vi`, `SavingsTab` đã import sẵn):

```tsx
describe("SavingsTab — tên quỹ trùng", () => {
  it("blocks adding a fund whose name is already taken and keeps what was typed", () => {
    const onAddSavingsFund = vi.fn()
    render(
      <SavingsTab
        savings={[{ name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 }]}
        onAddSavingsFund={onAddSavingsFund}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm quỹ tiết kiệm" }))
    fireEvent.change(screen.getByLabelText("Tên quỹ"), { target: { value: "  Quỹ khẩn cấp " } })
    fireEvent.change(screen.getByLabelText("Số tiền hiện có", { exact: false }), { target: { value: "500000" } })
    fireEvent.change(screen.getByLabelText("Mục tiêu", { exact: false }), { target: { value: "2000000" } })

    expect(screen.getByText("Đã có quỹ tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAddSavingsFund).not.toHaveBeenCalled()
    // Label giờ kèm cả dòng hint nên phải khớp không-chính-xác.
    expect(screen.getByLabelText("Tên quỹ", { exact: false })).toHaveValue("  Quỹ khẩn cấp ")
  })

  it("blocks renaming a fund to another fund's name from the Sửa form", () => {
    render(
      <SavingsTab
        savings={[
          { name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000 },
          { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 },
        ]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Sửa Quỹ du lịch" }))
    fireEvent.change(screen.getByLabelText("Tên quỹ"), { target: { value: "Quỹ khẩn cấp" } })

    expect(screen.getByText("Đã có quỹ tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
})
```

Thêm vào cuối `src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx` (dùng `FUND` có sẵn ở đầu file — tên `"Quỹ du lịch"`):

```tsx
describe("EditSavingsFundModal — tên quỹ trùng", () => {
  it("disables Lưu and explains why when renaming to another fund's name", () => {
    render(
      <EditSavingsFundModal
        fund={FUND}
        existingNames={["Quỹ du lịch", "Quỹ khẩn cấp"]}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText("Tên quỹ"), { target: { value: "Quỹ khẩn cấp" } })

    expect(screen.getByText("Đã có quỹ tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("still allows saving under the fund's own current name", () => {
    render(
      <EditSavingsFundModal
        fund={FUND}
        existingNames={["Quỹ du lịch", "Quỹ khẩn cấp"]}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()
    expect(screen.queryByText("Đã có quỹ tên này — chọn tên khác")).not.toBeInTheDocument()
  })
})
```

Thêm vào cuối `src/features/finance/__tests__/components/credit-cards-tab.test.tsx` (dùng `CARD` có sẵn — tên `"Techcombank Visa"`):

```tsx
describe("CreditCardsTab — tên thẻ trùng", () => {
  it("blocks adding a card whose name is already taken", () => {
    const onAddCard = vi.fn()
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={onAddCard}
        onPayCard={vi.fn()}
        onUpdateCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm thẻ tín dụng" }))
    fireEvent.change(screen.getByLabelText("Tên thẻ", { exact: false }), { target: { value: CARD.name } })

    expect(screen.getByText("Đã có thẻ tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
  })
})
```

Thêm vào cuối `src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx` (dùng `CARD` có sẵn):

```tsx
describe("EditCreditCardModal — tên thẻ trùng", () => {
  it("blocks renaming to another card's name but still allows the card's own name", () => {
    render(
      <EditCreditCardModal card={CARD} existingNames={[CARD.name, "VIB"]} onOpenChange={vi.fn()} onSave={vi.fn()} />
    )
    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()

    fireEvent.change(screen.getByLabelText("Tên thẻ", { exact: false }), { target: { value: "VIB" } })

    expect(screen.getByText("Đã có thẻ tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/components/savings-tab.test.tsx src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx src/features/finance/__tests__/components/credit-cards-tab.test.tsx src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx`
Expected: FAIL 5 test mới — `Unable to find an element with the text: Đã có quỹ tên này — chọn tên khác` (và bản "thẻ"; vitest không kiểm kiểu nên prop `existingNames` chưa khai báo không chặn test chạy tới đó). Test "still allows saving under the fund's own current name" đã xanh sẵn — rào chắn cho việc bỏ qua tên của chính mục đang sửa.

- [ ] **Step 3: Sửa 2 form quỹ**

`add-savings-fund-form.tsx` — thay interface + dòng khai báo component (dòng 9-13):

```tsx
interface AddSavingsFundFormProps {
  onAdd: (fund: SavingsFund) => void
  // Tên các quỹ đang có — quỹ được định danh bằng tên (sửa, xoá, tất toán, mục tiêu mua xe), nên
  // chặn trùng ngay ở form: nếu để hook từ chối, form vẫn reset và mất chữ người dùng đã gõ.
  existingNames?: string[]
}

function AddSavingsFundForm({ onAdd, existingNames = [] }: AddSavingsFundFormProps) {
```

Ngay trước `return (` của nhánh form đang mở (sau khối `if (!open) { ... }`), thêm:

```tsx
  const duplicate = existingNames.includes(name.trim())

```

Field "Tên quỹ" (có `label="Tên quỹ"`) thêm 2 prop ngay sau `onChange={(e) => setName(e.target.value)}`:

```tsx
          invalid={duplicate}
          hint={duplicate ? "Đã có quỹ tên này — chọn tên khác" : undefined}
```

và nút Thêm đổi `disabled={!name.trim() || !amount.trim() || !target.trim()}` thành:

```tsx
          disabled={duplicate || !name.trim() || !amount.trim() || !target.trim()}
```

`edit-savings-fund-modal.tsx` — thay interface + dòng khai báo component (dòng 10-16):

```tsx
interface EditSavingsFundModalProps {
  fund: SavingsFund | null
  // Tên mọi quỹ đang có (tên hiện tại của chính quỹ đang sửa luôn được giữ).
  existingNames?: string[]
  onOpenChange: (open: boolean) => void
  onSave: (fund: SavingsFund) => void
}

function EditSavingsFundModal({ fund, existingNames = [], onOpenChange, onSave }: EditSavingsFundModalProps) {
```

Thay dòng `const disabled = !name.trim() || !amount.trim() || !target.trim()` bằng:

```tsx
  const trimmedName = name.trim()
  const duplicate = trimmedName !== fund.name && existingNames.includes(trimmedName)
  const disabled = duplicate || !trimmedName || !amount.trim() || !target.trim()
```

và Field "Tên quỹ" thêm 2 prop ngay sau `onChange={(e) => setName(e.target.value)}`:

```tsx
          invalid={duplicate}
          hint={duplicate ? "Đã có quỹ tên này — chọn tên khác" : undefined}
```

- [ ] **Step 4: Sửa 2 form thẻ**

`add-credit-card-form.tsx` — thay interface + dòng khai báo component (dòng 9-13):

```tsx
interface AddCreditCardFormProps {
  onAdd: (card: CreditCard) => void
  // Tên các thẻ đang có — thẻ được định danh bằng tên (trả thẻ, sửa, xoá), nên chặn trùng ngay ở form.
  existingNames?: string[]
}

function AddCreditCardForm({ onAdd, existingNames = [] }: AddCreditCardFormProps) {
```

Ngay trước `return (` của nhánh form đang mở (sau khối `if (!open) { ... }`), thêm:

```tsx
  const duplicate = existingNames.includes(name.trim())

```

Field "Tên thẻ" (có `label="Tên thẻ"`) thêm 2 prop ngay sau `onChange={(e) => setName(e.target.value)}` (trước `prefix={...}`):

```tsx
          invalid={duplicate}
          hint={duplicate ? "Đã có thẻ tên này — chọn tên khác" : undefined}
```

và nút Thêm đổi `disabled={!name.trim() || !balance.trim() || !limit.trim() || !due.trim()}` thành:

```tsx
          disabled={duplicate || !name.trim() || !balance.trim() || !limit.trim() || !due.trim()}
```

`edit-credit-card-modal.tsx` — thay interface + dòng khai báo component (dòng 10-16):

```tsx
interface EditCreditCardModalProps {
  card: CreditCard | null
  // Tên mọi thẻ đang có (tên hiện tại của chính thẻ đang sửa luôn được giữ).
  existingNames?: string[]
  onOpenChange: (open: boolean) => void
  onSave: (card: CreditCard) => void
}

function EditCreditCardModal({ card, existingNames = [], onOpenChange, onSave }: EditCreditCardModalProps) {
```

Thay dòng `const disabled = !name.trim() || !balance.trim() || !limit.trim() || !due.trim()` bằng:

```tsx
  const trimmedName = name.trim()
  const duplicate = trimmedName !== card.name && existingNames.includes(trimmedName)
  const disabled = duplicate || !trimmedName || !balance.trim() || !limit.trim() || !due.trim()
```

và Field "Tên thẻ" thêm 2 prop ngay sau `onChange={(e) => setName(e.target.value)}` (trước `prefix={...}`):

```tsx
          invalid={duplicate}
          hint={duplicate ? "Đã có thẻ tên này — chọn tên khác" : undefined}
```

- [ ] **Step 5: 2 tab truyền danh sách tên**

`savings-tab.tsx`: ngay sau dòng `const savingsTotal = savings.reduce((sum, fund) => sum + fund.amount, 0)` thêm:

```tsx
  const fundNames = savings.map((fund) => fund.name)
```

đổi `<AddSavingsFundForm onAdd={onAddSavingsFund} />` thành:

```tsx
      <AddSavingsFundForm onAdd={onAddSavingsFund} existingNames={fundNames} />
```

và trong `<EditSavingsFundModal ...>` thêm prop ngay sau dòng `fund={savings.find((f) => f.name === editingName) ?? null}`:

```tsx
        existingNames={fundNames}
```

`credit-cards-tab.tsx`: ngay sau dòng `const [deletingCard, setDeletingCard] = useState("")` thêm:

```tsx
  const cardNames = cards.map((card) => card.name)
```

đổi `<AddCreditCardForm onAdd={onAddCard} />` thành:

```tsx
      <AddCreditCardForm onAdd={onAddCard} existingNames={cardNames} />
```

và trong `<EditCreditCardModal ...>` thêm prop ngay sau dòng `card={cards.find((c) => c.name === editingCard) ?? null}`:

```tsx
        existingNames={cardNames}
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/components/savings-tab.test.tsx src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx src/features/finance/__tests__/components/credit-cards-tab.test.tsx src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 7: Commit**

Tự review `git diff` của task rồi commit (mục **5** ở "Kiểm tra tay" của Task 11 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/features/finance/components/add-savings-fund-form.tsx src/features/finance/components/edit-savings-fund-modal.tsx src/features/finance/components/savings-tab.tsx src/features/finance/components/add-credit-card-form.tsx src/features/finance/components/edit-credit-card-modal.tsx src/features/finance/components/credit-cards-tab.tsx src/features/finance/__tests__/components/savings-tab.test.tsx src/features/finance/__tests__/components/edit-savings-fund-modal.test.tsx src/features/finance/__tests__/components/credit-cards-tab.test.tsx src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx
git commit -m "fix: block duplicate fund and card names in the add and edit forms"
```

---

### Task 10: Xoá quỹ thì gỡ liên kết mục tiêu mua xe, không để liên kết mồ côi tự gắn vào quỹ mới

**Files:**
- Modify: `src/features/finance/hooks/use-finance.ts` (`addSavingsFund`, `updateSavingsFund`, `removeSavingsFund` — bản sau Task 8)
- Test: `src/features/finance/__tests__/hooks/use-finance.test.ts`

**Interfaces:**
- Consumes: `getCarGoalFundName`, `setCarGoalFundName` (đã import sẵn trong `use-finance.ts`); `useCarGoalFund` tự đọc lại qua Task 6 nên trang Mục tiêu/Tổng quan đang mở cũng cập nhật; lớp chặn trùng tên của Task 8 (nhờ nó, 1 liên kết trỏ đúng tên của quỹ SẮP thêm/SẮP đổi sang chắc chắn là liên kết mồ côi).
- Produces: `removeSavingsFund(name)` gỡ `car-goal-fund-name` khi nó đang trỏ đúng quỹ bị xoá; `addSavingsFund(fund)` / `updateSavingsFund(originalName, fund)` (khi đổi tên) gỡ liên kết mồ côi đang trỏ đúng `fund.name` (Quyết định 2). `Settlement.fundName` giữ nguyên (xem `## Phạm vi`).

- [ ] **Step 1: Sửa 1 test cũ đang dựa vào liên kết mồ côi, rồi viết test thất bại**

Test cũ `"updateSavingsFund keeps the car-goal link pointed at the fund when it's renamed"` trong `src/features/finance/__tests__/hooks/use-finance.test.ts` gắn liên kết TRƯỚC khi quỹ tồn tại rồi mới `addSavingsFund` — đúng kiểu liên kết mồ côi mà Quyết định 2 gỡ đi. Thay nguyên test đó bằng bản dựng quỹ có sẵn trong storage (vẫn kiểm đúng hành vi cũ: đổi tên quỹ đang gắn thì liên kết đi theo):

```ts
  it("updateSavingsFund keeps the car-goal link pointed at the fund when it's renamed", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 }],
    })
    setCarGoalFundName("Quỹ dự phòng")
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toHaveLength(1))

    act(() => {
      result.current.updateSavingsFund("Quỹ dự phòng", {
        name: "Quỹ khẩn cấp",
        amount: 8_000_000,
        target: 25_000_000,
      })
    })

    expect(getCarGoalFundName()).toBe("Quỹ khẩn cấp")
  })
```

Rồi thêm vào cuối file:

```ts
describe("useFinance — liên kết mục tiêu mua xe khi xoá/tạo quỹ", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("removeSavingsFund unlinks the car goal from the deleted fund", async () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ mua xe", amount: 1, target: 2 }] })
    setCarGoalFundName("Quỹ mua xe")
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toHaveLength(1))

    act(() => result.current.removeSavingsFund("Quỹ mua xe"))

    expect(getCarGoalFundName()).toBeNull()
  })

  it("removeSavingsFund leaves the car-goal link alone when deleting another fund", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [
        { name: "Quỹ mua xe", amount: 1, target: 2 },
        { name: "Quỹ khác", amount: 1, target: 2 },
      ],
    })
    setCarGoalFundName("Quỹ mua xe")
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toHaveLength(2))

    act(() => result.current.removeSavingsFund("Quỹ khác"))

    expect(getCarGoalFundName()).toBe("Quỹ mua xe")
  })

  it("addSavingsFund does not let a new fund inherit a car-goal link left over from a deleted fund", async () => {
    // Liên kết mồ côi: quỹ "Quỹ mua xe" đã bị xoá từ trước bản sửa này (hay đến từ 1 file sao lưu cũ).
    setCarGoalFundName("Quỹ mua xe")
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.hydrated).toBe(true))

    act(() => result.current.addSavingsFund({ name: "Quỹ mua xe", amount: 1, target: 2 }))

    expect(getCarGoalFundName()).toBeNull()
  })

  it("updateSavingsFund does not let a renamed fund inherit a car-goal link left over from a deleted fund", async () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ khác", amount: 1, target: 2 }] })
    setCarGoalFundName("Quỹ mua xe")
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toHaveLength(1))

    act(() => result.current.updateSavingsFund("Quỹ khác", { name: "Quỹ mua xe", amount: 1, target: 2 }))

    expect(getCarGoalFundName()).toBeNull()
  })

  it("addSavingsFund keeps a car-goal link that points at an existing fund", async () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ mua xe", amount: 1, target: 2 }] })
    setCarGoalFundName("Quỹ mua xe")
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toHaveLength(1))

    act(() => result.current.addSavingsFund({ name: "Quỹ khác", amount: 1, target: 2 }))

    expect(getCarGoalFundName()).toBe("Quỹ mua xe")
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/hooks/use-finance.test.ts`
Expected: FAIL đúng 3 test mới — "removeSavingsFund unlinks the car goal from the deleted fund" (`expected 'Quỹ mua xe' to be null`), "addSavingsFund does not let a new fund inherit…" và "updateSavingsFund does not let a renamed fund inherit…" (cùng `expected 'Quỹ mua xe' to be null`). 2 test còn lại của khối mới và test cũ vừa viết lại đã xanh sẵn — rào chắn để không gỡ nhầm liên kết đang đúng.

- [ ] **Step 3: Sửa 3 hàm quỹ trong `use-finance.ts`**

Thay `addSavingsFund`, `updateSavingsFund`, `removeSavingsFund` (bản sau Task 8) bằng đúng nội dung dưới; các hàm khác giữ nguyên.

```ts
  const addSavingsFund = useCallback(
    (fund: SavingsFund) => {
      const current = getStoredFinance()
      // Quỹ định danh bằng tên ở mọi nơi — trùng tên thì sửa/xoá/tất toán 1 quỹ sẽ đè luôn quỹ kia.
      if (current.savings.some((f) => f.name === fund.name)) {
        toast.error(`Đã có quỹ tiết kiệm tên "${fund.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({ ...current, savings: [...current.savings, fund] })
        // Chưa quỹ nào mang tên này (vừa chặn ở trên) nên liên kết mục tiêu "mua xe" đang trỏ đúng
        // tên này chỉ có thể là liên kết mồ côi của 1 quỹ đã xoá — gỡ đi, không để quỹ mới âm thầm
        // bị gắn vào mục tiêu mà người dùng không hề chọn.
        if (getCarGoalFundName() === fund.name) setCarGoalFundName(null)
        toast.success(`Đã thêm quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể thêm quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const updateSavingsFund = useCallback(
    (originalName: string, fund: SavingsFund) => {
      const current = getStoredFinance()
      if (fund.name !== originalName && current.savings.some((f) => f.name === fund.name)) {
        toast.error(`Đã có quỹ tiết kiệm tên "${fund.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({
          ...current,
          savings: current.savings.map((f) => (f.name === originalName ? fund : f)),
        })
        // Mục tiêu "mua xe" link theo tên quỹ (không có id) — đổi tên quỹ đang link
        // thì phải đổi luôn tên lưu ở car-goal-storage, nếu không link sẽ bị mồ côi.
        if (fund.name !== originalName && getCarGoalFundName() === originalName) {
          setCarGoalFundName(fund.name)
        } else if (fund.name !== originalName && getCarGoalFundName() === fund.name) {
          // Tên mới đang bị 1 liên kết mồ côi (quỹ đã xoá từ trước) trỏ tới — gỡ, không để quỹ vừa
          // đổi tên âm thầm bị gắn vào mục tiêu.
          setCarGoalFundName(null)
        }
        // Lịch sử tất toán ngân sách cũng tham chiếu quỹ theo tên — cascade tương tự
        // để lịch sử vẫn hiển thị đúng tên hiện tại của quỹ.
        if (fund.name !== originalName) {
          renameFundInSettlements(originalName, fund.name)
        }
        toast.success(`Đã cập nhật quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể cập nhật quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const removeSavingsFund = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, savings: current.savings.filter((f) => f.name !== name) })
        // Mục tiêu "mua xe" đang gắn đúng quỹ này thì gỡ luôn — nếu không, 1 quỹ tạo sau trùng tên
        // sẽ âm thầm bị gắn vào mục tiêu (đổi tên đã cascade tương tự ở updateSavingsFund).
        // Settlement giữ nguyên tên cũ: chỉ là lịch sử đã đóng băng (xem budget-storage.ts).
        if (getCarGoalFundName() === name) setCarGoalFundName(null)
        toast.success(`Đã xoá quỹ tiết kiệm "${name}"`)
      } catch {
        toast.error(`Không thể xoá quỹ tiết kiệm "${name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/hooks/use-finance.test.ts src/features/goals/__tests__/components/goals-view.test.tsx src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: PASS toàn bộ (kể cả "updateSavingsFund does not touch the car-goal link when renaming an unrelated fund" và "updateSavingsFund cascades a rename into historical budget settlements")

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **7** ở "Kiểm tra tay" của Task 11 sẽ kiểm lại thay đổi này trước khi merge):

```bash
git add src/features/finance/hooks/use-finance.ts src/features/finance/__tests__/hooks/use-finance.test.ts
git commit -m "fix: unlink the car goal when its savings fund is deleted"
```

---

### Task 11: Checkpoint — kiểm tra toàn bộ nhánh

**Files:** không sửa file nào (chỉ sửa nếu 1 bước dưới đây báo lỗi — khi đó quay về đúng task gây lỗi, sửa, chạy lại test của task đó, commit `fix: ...` riêng).

**Interfaces:**
- Consumes: toàn bộ Task 1–10.
- Produces: nhánh `fix/storage-sync` sạch tsc/lint/test, sẵn sàng cho chủ repo kiểm tra tay rồi merge vào `developer`.

- [ ] **Step 1: Kiểm kiểu**

Run: `npx tsc --noEmit`
Expected: không in lỗi nào (exit 0). Đặc biệt không có lỗi prop `existingNames` ở `savings-tab.tsx`/`credit-cards-tab.tsx` hay lỗi kiểu trả về của cleanup trong `use-storage-sync.ts`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error, 0 warning mới. Nếu `react-hooks/exhaustive-deps` báo thiếu deps ở 1 mutation vừa sửa → mutation đó còn sót 1 chỗ đọc `state`/`settings` trong closure; đổi sang `current` (bản đọc tươi) thay vì thêm deps.

- [ ] **Step 3: Toàn bộ test**

Run: `npm run test`
Expected: PASS toàn bộ suite (mọi file cũ + 41 test mới của plan này: 6 `use-storage-sync`, 3+4+5 `use-finance`, 3 `use-budget`, 2 `use-journal`, 1 `use-study`, 1 `use-net-worth-history`, 2 `use-settings`, 2 `use-car-goal-fund`, 3 `profile-card`, 2 `finance-storage`, 1 `data-transfer`, 2 `savings-tab`, 2 `edit-savings-fund-modal`, 1 `credit-cards-tab`, 1 `edit-credit-card-modal`). Không có cảnh báo React "Encountered two children with the same key" mới trong log.

- [ ] **Step 4: Tự review diff**

Run: `git diff developer --stat` rồi `git diff developer -- src/`
Kiểm: không còn `[state, persist]` hay `[settings, persist]` nào trong 4 hook đọc tươi; không listener nào ghi storage (`reload` chỉ gọi `getStored*()` + `setState`/`setHistory`/`useSettingsStore.setState`); không đụng `auto-backup.tsx`, `/sandbox`, `EXPORT_VERSION`, `budget-calculations.ts`.

### Kiểm tra tay

Chạy `npm run dev`, đăng nhập như thường. Trước khi bắt đầu, vào **Cài đặt → Xuất file JSON** để có bản sao lưu dữ liệu thật — mục 6 cần sửa 1 bản sao của file này, và mục 9 nạp lại file gốc để xoá sạch mọi dữ liệu thử (quỹ, khoản chi, lần tất toán). Khi dừng ở Task 7/9/10 để kiểm riêng 1 mục, vẫn xuất file trước và làm mục 9 sau. "Tab A"/"Tab B" = 2 tab cùng trình duyệt, cùng địa chỉ app.

1. **Nhật ký — 2 tab không xoá bài của nhau**
   - Mở `/journal` ở Tab A và Tab B.
   - Tab B: viết "Bài thử tab B", lưu. Chuyển sang Tab A (KHÔNG tải lại): bài "Bài thử tab B" đã hiện trong danh sách.
   - Tab A: viết "Bài thử tab A", lưu. Tải lại cả 2 tab: còn đủ cả 2 bài. Xoá 2 bài thử.
2. **Tài chính — 2 tab + tất toán ngân sách**
   - Mở `/finance` (tab "Tiết kiệm") ở Tab A và Tab B.
   - Tab B: thêm quỹ "Quỹ thử 2 tab" (số tiền 1.000.000, mục tiêu 5.000.000). Tab A: quỹ đó tự hiện, không cần tải lại.
   - Tab A: sang "Tích lũy vàng", gõ đổi giá 1 cửa hàng (chưa có cửa hàng nào thì bấm "Thêm cửa hàng" thêm 1 cửa hàng thử). Tải lại Tab B: "Quỹ thử 2 tab" vẫn còn.
   - Bước dưới tất toán 2 lần 100.000 nên thẻ "Tất toán tháng" ở `/budget` phải đang ghi dư hoặc thiếu ít nhất 200.000 ₫ (chưa đủ thì ghi tạm 1 khoản chi hoặc sửa lương tháng — mục 9 trả lại).
   - Mở `/budget`, bấm "Tất toán tháng", chọn "Quỹ thử 2 tab", sửa ô "Số tiền" thành 100.000, bấm "Xác nhận". Bấm "Tất toán tháng" lần nữa, chọn lại quỹ đó, sửa "Số tiền" thành 100.000: nếu tháng đang dư, dòng "Số dư mới của "Quỹ thử 2 tab"" phải là 1.200.000 (trước bản sửa hiện 1.100.000 vì trang còn giữ số dư cũ); nếu tháng đang thiếu (rút quỹ) thì phải là 800.000 (trước bản sửa: 900.000). Bấm "Huỷ".
   - Sang `/finance`: quỹ đó hiện 1.100.000 (hoặc 900.000 nếu rút). Trả 1 thẻ tín dụng bất kỳ (nếu có) rồi tải lại: số dư quỹ không bị trả về 1.000.000.
3. **Chi tiêu — 2 tab**
   - Mở `/budget` ở Tab A và Tab B. Tab B: ghi 1 khoản chi 12.000. Tab A: khoản đó tự hiện. Tab A: ghi 1 khoản chi 13.000. Tải lại cả 2: có đủ 2 khoản. Xoá 2 khoản thử.
4. **Cài đặt — 2 tab và ô "Tên hiển thị"**
   - Mở `/settings` ở Tab A và Tab B. Tab B: tắt module "Học tập". Tab A: công tắc "Học tập" tự tắt và sidebar mất mục Học tập. Tab A: bật/tắt 1 nhãn chi tiêu. Tải lại Tab B: "Học tập" vẫn tắt. Bật lại "Học tập".
   - Đổi "Tên hiển thị" thành 1 tên khác mặc định (vd. "Tùng"), bấm Lưu. Tải cứng trang `/settings` (F5): ô hiện đúng "Tùng", nút Lưu bị khoá (trước bản sửa ô hiện "Tungnh2k1" và Lưu sáng).
   - Tab A: gõ dở "Tùng 2" (chưa Lưu). Tab B: đổi tên thành "Tùng 3", Lưu. Quay lại Tab A: ô vẫn giữ "Tùng 2" đang gõ; sidebar Tab A đã hiện "Tùng 3". Đặt lại tên như ý.
5. **Tên quỹ/thẻ trùng**
   - `/finance` → "Tiết kiệm" → "Thêm quỹ tiết kiệm", gõ đúng tên 1 quỹ đang có (thêm vài dấu cách 2 đầu cũng được): dưới ô hiện chữ đỏ "Đã có quỹ tên này — chọn tên khác", nút Thêm bị khoá, chữ đã gõ vẫn còn. Sửa tên khác đi: nút Thêm bật lại. Huỷ.
   - Bấm "Sửa" 1 quỹ (cần ít nhất 2 quỹ — "Quỹ thử 2 tab" của mục 2 vẫn còn), đổi tên thành tên quỹ khác: Lưu bị khoá + chữ đỏ. Trả lại đúng tên cũ và chỉ đổi số tiền: Lưu bật, lưu được.
   - "Nợ thẻ tín dụng": làm lại 2 bước trên với tên thẻ (chưa đủ 2 thẻ thì thêm tạm 1 thẻ thử — mục 9 trả lại) → chữ đỏ "Đã có thẻ tên này — chọn tên khác".
6. **Dữ liệu trùng tên có sẵn (file sao lưu)**
   - Mở file JSON vừa xuất, trong `finance.savings` nhân đôi 1 quỹ (copy nguyên object, giữ đúng tên) rồi sửa `"amount"` của bản sao thành `1`, lưu thành file mới. **Cài đặt → Nhập từ file** chọn file mới: ở `/finance` quỹ gốc giữ tên và số dư cũ, bản sao hiện tên "… (2)" với số dư 1 ₫; sửa/xoá quỹ "… (2)" không đụng quỹ gốc.
6b. **Sao lưu cũ thiếu module (bản sửa sau review cuối)**
   - Mở lại bản sao file JSON (từ mục 6, hoặc copy file gốc), trong `settings.modules` xoá nguyên object có `"key": "chitieu"`, lưu thành file mới. **Cài đặt → Nhập từ file** chọn file đó.
   - Vẫn ở `/settings` (KHÔNG tải lại): danh sách module vẫn đủ 6 hàng, có "Chi tiêu". Tắt "Nhật ký": chỉ "Nhật ký" tắt, "Chi tiêu" vẫn bật; sidebar chỉ mất mục Nhật ký (trước bản sửa: "Chi tiêu" bị tắt thay cho "Nhật ký"). Bật lại "Nhật ký".

7. **Mục tiêu mua xe khi xoá quỹ**
   - Tạo quỹ "Quỹ thử xe". `/goals` → mục tiêu mua xe → chọn "Quỹ thử xe".
   - `/finance` xoá "Quỹ thử xe". `/goals`: mục tiêu mua xe hiện "Chưa gắn quỹ tiết kiệm nào. Chọn 1 quỹ bên dưới để bắt đầu theo dõi."
   - Tạo lại quỹ "Quỹ thử xe": `/goals` vẫn chưa gắn (phải tự chọn lại — đúng Quyết định 2). Xoá quỹ thử, gắn lại quỹ mua xe thật nếu đã đổi.
8. **Tổng quan**
   - Mở `/overview` ở Tab A. Tab B: sửa số tiền 1 quỹ ở `/finance`. Tab A: thẻ tài sản ròng/tiết kiệm tự cập nhật, không cần tải lại; trang không nhấp nháy hay tải lại liên tục.

9. **Trả dữ liệu thật về như cũ**
   - **Cài đặt → Nhập từ file** → chọn file sao lưu GỐC xuất lúc đầu. Kiểm tra nhanh `/finance`, `/budget`, `/journal`, `/goals`: không còn quỹ/khoản chi/bài/liên kết thử nào, tên hiển thị đúng như trước.

Xong cả 9 mục → báo lại để chủ repo duyệt, merge `fix/storage-sync` vào `developer` rồi mới tách nhánh cho Plan 1b.
