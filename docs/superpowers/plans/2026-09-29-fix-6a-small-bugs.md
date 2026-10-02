# Lỗi nhỏ còn lại — tài chính, máy tính, cài đặt (phần 6a sửa lỗi review 2026-09-29) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Nhánh:** `fix/small-bugs-finance` → `fix/small-bugs-calc` → `fix/small-bugs-settings` (tách từ `developer` sau khi phần trước đã merge — nhánh đầu tách sau khi nhánh của Plan 5 đã merge; mỗi nhánh sau chỉ tách khi nhánh liền trước đã được duyệt và merge). CLAUDE.md đòi "một task một branch/PR": 33 lỗi nhỏ của phần này nằm ở 3 vùng không dính nhau nên chia 3 nhánh — Task 1–14 trên `fix/small-bugs-finance`, Task 15–19 trên `fix/small-bugs-calc`, Task 20–25 trên `fix/small-bugs-settings`.

**Goal:** Dọn hết các lỗi hành vi nhỏ còn lại sau review: số liệu vàng/thẻ/đầu tư/tiến độ không còn sai ở các trường hợp biên (NaN, giá trống, số 0, số lẻ), gợi ý ở Tổng quan không còn báo nhầm cuối tháng, máy tính không nuốt phím tắt trình duyệt và không tính sai khi bấm lặp phép tính, nút ẩn số tiền không bị mất theo module Tài chính, và trang Cài đặt nói đúng những gì nó làm (tên file, secret, mood trùng, xoá mood, hộp xác nhận xoá dữ liệu).

**Architecture:** Không có kiến trúc mới — mỗi task sửa tại chỗ, theo đúng pattern đã có: hàm thuần mới đặt cạnh hàm cũ (`finance-calculations.ts`, `insights-calculations.ts`, `calc-engine.ts`, `lib/format.ts`), form chặn giá trị sai ngay khi gõ bằng `Field invalid` + `hint` (pattern `existingNames` của Plan 1a), xoá có hỏi lại bằng `AlertDialog` (như mọi nút xoá ở trang Tài chính). Không đổi shape dữ liệu lưu trong localStorage; `EXPORT_VERSION` giữ `1`.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript, zod 4, zustand 5, Vitest + React Testing Library (jsdom) — không thêm dependency nào.

**Spec:** Không có spec riêng — nguồn là 33 phát hiện review đã được kiểm chứng đối kháng (2026-09-29), liệt kê đủ ở mục `## Phạm vi` bên dưới.

## Global Constraints

- 3 nhánh theo thứ tự ở dòng **Nhánh**; mỗi nhánh tách từ `developer` mới nhất. 1 commit/task, message theo CLAUDE.md (`fix:` / `change:` / `refactor:`...) cộng dòng attribution mà phiên thực thi yêu cầu. Trước mỗi commit tự review `git diff` của task (CLAUDE.md mục 6). Không commit thẳng lên `developer`/`main`, không `git push` khi chủ repo chưa yêu cầu.
- Không thêm dependency. Plan chỉ dùng API Next đã có sẵn trong repo (`useRouter().replace`, `usePathname` của `next/navigation` ở `auth-guard.tsx`); nếu buộc phải đụng API Next khác, đọc `node_modules/next/dist/docs/` trước (Next 16 có breaking changes).
- Giữ nguyên các quyết định có chủ đích: AutoBackup vẫn không mount; mock login giữ nguyên; `EXPORT_VERSION` giữ `1`; `Expense.tag` vẫn là snapshot đóng băng; số còn phải tất toán của tháng vẫn tính lại, không khoá; `/sandbox` không đụng.
- Tên file/biến/test tiếng Anh (tên test trong file đang viết tiếng Việt thì viết tiếng Việt theo file đó, như `calc-engine.test.ts`); chữ hiển thị cho người dùng tiếng Việt, đúng nguyên văn trong plan.
- **Plan 1a, 1b, 2, 3, 4, 5 đã merge trước:** trước khi sửa 1 file, đọc lại TOÀN BỘ file đó. Đoạn code trong plan này được neo theo NỘI DUNG (không theo số dòng) của bản sau 1a/1b; nếu Plan 2–5 đã dời/sửa đoạn xung quanh thì giữ logic của họ và áp đúng thay đổi của task. Cụ thể phải giữ: `phanValid` của 1b trong `AddGoldForm`/`EditGoldPurchaseModal` (Task 8 chỉ siết điều kiện), prop `existingNames` của 1a (Task 4 dùng lại đúng pattern), prop `masked` + state `focused` + 2 handler `onFocus`/`onBlur` của Plan 2 trong `Field` (Task 3 chỉ thêm `onPaste`), biến `goldPLText` + prop `fitChars` của Plan 5 ở `GoldTab` (Task 6 giữ biến và prop, chỉ đổi cách tính `goldPLText` khi lãi/lỗ bằng 0), `useSettings` đọc tươi `getStoredSettings()` ở mọi mutation + `useStorageSync` của 1a (Task 21), `parseAppSettings` của 1b (Task 21), `clearSyncSecret()` trong `handleLogout` của sidebar (1b) và mọi thay đổi layout của Plan 5 ở sidebar (Task 17 chỉ thêm hằng `MONEY_MODULE_KEYS` và đổi dòng `showMoneyTools`).
- Số tiền VND là đồng nguyên: không hiện, không nhận phần lẻ.
- Test đặt trong `__tests__/` mirror cấu trúc, theo đúng pattern file bên cạnh (`vi.mock("sonner", ...)`, `vi.useFakeTimers()` + `advanceTimersByTime(1200)` khi có `CountMoney`, `vi.spyOn(Storage.prototype, "setItem")` để giả lỗi ghi, `fireEvent.keyDown(window, ...)` cho phím máy tính).
- Chạy từng file test bằng `npx vitest run <path>`; full suite, lint, tsc chỉ ở task checkpoint cuối mỗi nhánh (Task 14, 19, 25).
- Mọi task commit ngay khi test của task xanh và đã tự review `git diff` — **không dừng giữa plan** chờ chủ repo. Mọi thứ người dùng thấy được kiểm lại ở mục `### Kiểm tra tay` trong task checkpoint cuối mỗi nhánh (Task 14, 19, 25); nếu chủ repo thấy sai thì sửa tiếp trên chính nhánh đó. Mỗi nhánh chỉ merge vào `developer` sau khi chủ repo chạy xong toàn bộ "Kiểm tra tay" của nhánh đó và duyệt; nhánh kế tiếp chỉ tách sau khi nhánh trước đã merge.
- Hàm tính theo ngày (`nearestDueCard`, `samePeriodExpenses`, `forecastSavingsGoal`...) là hàm thuần nhận `today` làm tham số; component tự đọc đồng hồ (`new Date()` — rule `react-hooks/purity` của repo chỉ chặn `Date.now()` trong render). Test phụ thuộc "hôm nay" ghim đồng hồ bằng `vi.setSystemTime(...)`.

## Quyết định cần duyệt

### 1. Cửa hàng vàng chưa nhập giá hôm nay thì vàng mua ở đó tính bao nhiêu? (`area-finance-logic#7`)

Form thêm cửa hàng chỉ bắt buộc tên, ô giá trong "Giá thị trường hôm nay" cũng xoá trống được. Hiện giá trống = 0 ₫/phân: 10 phân mua 8.000.000 ₫/phân hiện "Bạn đang lỗ 80.000.000 ₫ … do giá vàng giảm", −100%, và tài sản ròng tụt đúng 80 triệu.

- **A. Tạm tính theo giá mua + nhắc nhập giá** — lần mua ở cửa hàng chưa có giá được định giá bằng chính giá mua (lãi/lỗ 0), tài sản ròng giữ đúng giá vốn; thẻ lãi/lỗ vàng thêm 1 dòng "Chưa nhập giá hôm nay cho SJC — vàng mua ở đó đang tạm tính theo giá mua." Vẫn thêm được cửa hàng trước, nhập giá sau.
- **B. Bắt buộc nhập giá khi thêm cửa hàng** — chặn ở form thêm, nhưng ô giá của cửa hàng có sẵn vẫn xoá trống được (lúc đang gõ lại giá), và dữ liệu cũ đã trống giá vẫn hiện lỗ trọn giá vốn.
- **C. Giữ 0, chỉ sửa câu chữ** — số vẫn sai (tài sản ròng hụt), chỉ bớt câu "do giá vàng giảm".
- **Khuyên dùng: A** — vì là cách duy nhất sửa cả dữ liệu cũ lẫn lúc đang gõ lại giá, không thêm ràng buộc nào cho form; "chưa biết giá thì coi như hoà vốn" là giả định ít sai nhất. Plan làm A (Task 6).

### 2. Ô "Ngày mua" vàng nhận gì? (`area-finance-logic#8`)

Hiện nhận mọi chữ không rỗng; "10-08-2026", "2026-08-10" bị xếp như cũ nhất, "10/08/26" thành năm 1926, "31/02/2026" thành 03/03 — lần mua mới có thể bị đẩy ra sau nút "Xem thêm".

- **A. Vẫn là ô chữ, nhưng phải là 1 ngày có thật** — nhận `dd/mm/yyyy` (ngày/tháng 1 hoặc 2 chữ số, dấu `/`, `-` hoặc `.`) và `yyyy-mm-dd`, năm đủ 4 chữ số; lưu lại chuẩn `dd/mm/yyyy`. Sai thì ô đỏ + hint "Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026", nút Thêm/Lưu khoá. Lần mua cũ đã lưu sai dạng: mở "Sửa" sẽ thấy ô đỏ, phải sửa ngày mới lưu được.
- **B. Đổi sang ô chọn ngày của trình duyệt (`type="date"`)** — không gõ sai được, nhưng giá trị là `yyyy-mm-dd` nên phải chuyển đổi mọi ngày đã lưu (và mọi file sao lưu cũ) sang dạng mới; giao diện ô ngày khác nhau giữa các trình duyệt/điện thoại.
- **Khuyên dùng: A** — vì không đổi dạng dữ liệu đã lưu, vẫn gõ nhanh như cũ, và chỉ chặn đúng những gì làm sai thứ tự. Plan làm A (Task 7).

### 3. Khối lượng vàng có nhận số lẻ không? (`area-finance-logic#9`)

Ô "Khối lượng (phân)" hiện nhận "12.3" và hiện "1 chỉ 2.3000000000000007 phân"; "1,5" (dấu phẩy kiểu Việt) thì im lặng khoá nút Thêm.

- **A. Chỉ nhận phân nguyên** — số lẻ/âm/0 thì ô đỏ + hint "Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)"; giá cửa hàng vốn tính theo phân nên không mất độ chính xác nào đang dùng. Dữ liệu cũ lỡ có số lẻ vẫn hiện gọn (làm tròn 1 chữ số, dấu phẩy: "1 chỉ 2,3 phân").
- **B. Nhận tới 1 chữ số lẻ (li), chấp nhận cả "1,5" lẫn "1.5"** — ghi được "2 chỉ 5 li", nhưng mọi chỗ hiện khối lượng (bảng, thẻ, tổng, Tổng quan, Mục tiêu vàng) đều phải định dạng số lẻ, và tổng phân có thể là số lẻ.
- **Khuyên dùng: A** — vì vàng tích luỹ mua theo chỉ/phân, cửa hàng báo giá theo phân; B thêm nhiều chỗ hiển thị phải sửa cho 1 trường hợp gần như không dùng. Plan làm A (Task 8).

### 4. "Hạn gần nhất" của thẻ tín dụng lấy theo gì? (`area-finance-ui#4`, `area-overview-journal#14`)

Ô "Ngày đến hạn" là chữ tự do ("15", "15 hàng tháng", "05/10"...). Trụ "Nợ thẻ tín dụng" ở Tài chính ghi "hạn gần nhất" nhưng luôn lấy thẻ thêm đầu tiên; ô "Nợ thẻ" ở Tổng quan cũng vậy, kể cả khi thẻ đó đã trả hết (dư nợ 0 ₫ · hạn 15).

- **A. Đọc "ngày trong tháng" từ chữ đã nhập** — lấy số đầu tiên 1–31 trong ô ("15 hàng tháng" → 15, "05/10" → 5), chỉ xét thẻ còn dư nợ, chọn thẻ có lần đến hạn kế tiếp sớm nhất tính từ hôm nay; thẻ không đọc được số thì xếp sau cùng. Không thẻ nào còn nợ → "không nợ". Không đổi dữ liệu đã lưu.
- **B. Đổi ô "Ngày đến hạn" thành ô số 1–31** — chính xác tuyệt đối, nhưng phải chuyển đổi mọi thẻ đã lưu (chữ tự do không phải lúc nào cũng đổi được) và file sao lưu cũ.
- **C. Bỏ chữ "gần nhất"** — chỉ liệt kê "N thẻ", mất thông tin hữu ích nhất của ô.
- **Khuyên dùng: A** — vì mọi cách người dùng hay gõ đều bắt đầu bằng ngày trong tháng, không phải chuyển đổi dữ liệu, và bỏ luôn lỗi "thẻ đã trả hết vẫn hiện hạn". Plan làm A (Task 9).

### 5. Ô "Ngày trả" trong hộp "Ghi một lần trả" (`area-finance-ui#5`)

Ô này không được đọc: gõ gì cũng bị bỏ, vì app không lưu lịch sử trả thẻ (chỉ trừ dư nợ).

- **A. Bỏ ô** — hộp chỉ còn "Số tiền trả"; không hứa điều app không làm.
- **B. Lưu "lần trả gần nhất" vào thẻ và hiện ở danh sách thẻ** — thêm field mới vào `CreditCard` (schema, sao lưu, đồng bộ), thêm chỗ hiển thị; nhiều việc cho 1 thông tin phụ.
- **Khuyên dùng: A** — vì B là tính năng mới chứ không phải sửa lỗi; nếu sau này cần lịch sử trả thẻ thì làm đúng nghĩa (danh sách các lần trả). Plan làm A (Task 10).

### 6. Gợi ý "chi tiêu thấp hơn / giảm" khi tháng chưa hết (`area-overview-journal#10`)

Hiện hướng "thấp hơn/giảm" bị chặn tới khi qua 90% tháng, rồi so tổng-tới-nay với 3 tháng trọn vẹn: từ ngày 27–28 trở đi, khoản trả cố định cuối tháng (vd. cước điện thoại ngày 29) chưa tới hạn là thành "giảm 100%", người chi đều thành "thấp hơn 13%".

- **A. So cùng kỳ** — hướng "thấp hơn/giảm" so chi tiêu từ ngày 1 tới hôm nay với đúng ngày 1 → cùng ngày đó của 3 tháng trước ("Tính tới hôm nay, tháng này bạn chi tiêu thấp hơn khoảng 20% so với cùng kỳ 3 tháng gần đây."); báo được ngay giữa tháng, và khoản chưa tới ngày trả thì tháng trước cùng kỳ cũng chưa có nên không báo nhầm. Hướng "cao hơn/tăng" giữ nguyên (đã vượt cả 1 tháng bình thường thì báo sớm).
- **B. Chỉ báo "thấp hơn/giảm" cho tháng đã hết** — không bao giờ báo nhầm, nhưng tin tốt tới muộn (đầu tháng sau mới biết tháng trước chi ít), cần thêm 1 loại gợi ý mới cho "tháng trước".
- **C. Bỏ hẳn hướng "thấp hơn/giảm"** — chỉ còn cảnh báo chi nhiều.
- **Khuyên dùng: A** — vì so cùng kỳ là phép so công bằng duy nhất cho 1 tháng đang chạy, bỏ được cả ngưỡng 90% tuỳ ý. Plan làm A (Task 12). Cùng task thêm ngưỡng tối thiểu 10% cho gợi ý chi tiêu tổng (`area-overview-journal#16`) — không có đánh đổi: chênh 2% (hay "khoảng 0%") không phải điều đáng báo.

### 7. Máy tính và nút "Ẩn số tiền" hiện khi nào? (`area-shell-auth-calc#2`)

Hiện 2 nút này chỉ hiện khi module "Tài chính" bật (commit 0098df5 cố ý như vậy). Nhưng Chi tiêu, Mục tiêu và các thẻ tương ứng ở Tổng quan cũng hiện số tiền: đang ẩn số tiền mà tắt "Tài chính" thì /budget, /goals kẹt "••••" và không còn nút nào để hiện lại.

- **A. Hiện khi còn ít nhất 1 module có số tiền (Tài chính, Chi tiêu, Mục tiêu)** — chỉ mất khi cả 3 đều tắt (lúc đó không trang nào còn hiện số tiền).
- **B. Giữ theo "Tài chính", nhưng luôn hiện nút mắt khi đang ẩn** — gỡ được kẹt, nhưng đang hiện số thì vẫn không ẩn được ở /budget khi Tài chính tắt, và máy tính vẫn mất ở trang Chi tiêu.
- **Khuyên dùng: A** — vì cả 2 công cụ phục vụ mọi trang có tiền, không riêng Tài chính; đảo lại lựa chọn của commit 0098df5 cho đúng ý đồ ban đầu của nó ("2 công cụ này thao tác trên tiền"). Plan làm A (Task 17).

### 8. Xoá tâm trạng (`area-settings-sync#9`)

Hiện 1 chạm vào thùng rác là xoá ngay; thêm lại qua "Thêm tâm trạng" luôn ra điểm 3 và màu khác, nên xoá nhầm "Tuyệt vời" (điểm 5) là gợi ý chi tiêu–tâm trạng lệch vĩnh viễn cho mọi bài viết sau.

- **A. Hộp xác nhận** — `AlertDialog` "Xoá tâm trạng?" (giống mọi nút xoá ở trang Tài chính), mô tả nhắc "Muốn ẩn khỏi màn Nhật ký thì chỉ cần tắt công tắc"; thêm 1 cú bấm mỗi lần xoá.
- **B. Xoá ngay + toast "Hoàn tác"** — nhanh hơn, nhưng app chưa có mẫu hoàn tác nào, và toast biến mất sau vài giây (xoá nhầm mà không để ý là mất).
- **C. Thêm ô chọn điểm (1–5) vào form "Thêm tâm trạng"** — thêm lại được đúng điểm, nhưng không chặn xoá nhầm, và thêm 1 khái niệm ("điểm tâm trạng") người dùng chưa từng thấy.
- **Khuyên dùng: A** — vì đồng nhất với cách app đang xoá mọi thứ khác, không cần cơ chế mới, và chỉ dẫn người dùng tới "tắt" (cách đúng để ẩn). Plan làm A (Task 22).

Các lựa chọn còn lại không có đánh đổi đáng kể người dùng thấy được — plan làm thẳng: bấm 2 phép tính liền nhau thì phép sau **thay** phép trước (như máy tính điện thoại; vẫn cho "×−" để nhập số âm); secret có ký tự ngoài Latin-1 thì báo lỗi riêng thay vì mã hoá secret ở cả 2 đầu (README đã hướng dẫn tạo secret bằng `openssl rand -hex 32`); dán số tiền có phần lẻ thì bỏ phần lẻ; dự báo tiết kiệm bỏ các điểm 0 ở đầu lịch sử; tâm trạng mới trùng tên (không phân biệt hoa thường) bị chặn ở form + hook, còn cặp trùng tên CHÍNH XÁC đã nằm sẵn trong dữ liệu thì mục sau được đổi thành "Tên (2)" khi đọc — đúng cách Quyết định 1 của Plan 1a đã duyệt cho quỹ/thẻ trùng tên.

## Phạm vi

| Phát hiện | Mô tả | Sửa ở |
|---|---|---|
| `area-components-lib#1` | `Progress` nhận NaN (vd. quỹ 0/0 ₫) thì Base UI coi là "không xác định": thanh chạy kín 100%, trình đọc màn hình đọc "indeterminate progress" | Task 1 |
| `area-finance-ui#7` | Quỹ tiết kiệm số tiền 0 / mục tiêu 0 truyền NaN vào thanh tiến độ | Task 1 (sửa gốc ở `Progress` + test hồi quy ở `SavingsTab`) |
| `area-components-lib#12` | `formatMoney` hiện đồng lẻ ("20.308.642,5 ₫"), `CountMoney` mọc ",5" khi đếm xong | Task 2 |
| `area-components-lib#13` | `NetWorthCard` vẫn vẽ đoạn giá trị 0 nên thanh hở 6–12px | Task 2 |
| `area-components-lib#2` | Ô tiền có `group` bỏ dấu thập phân nhưng giữ số lẻ: dán "1.500.000,00" thành 150.000.000 ₫ | Task 3 |
| `area-finance-logic#5` | Thêm/đổi tên cửa hàng vàng trùng tên: hook từ chối nhưng form vẫn đóng và mất chữ đã gõ | Task 4 |
| `area-finance-logic#4` | Form thêm vàng giữ lựa chọn cửa hàng đã bị đổi tên/xoá → lưu lần mua mồ côi (giá 0, lỗ trọn giá vốn) | Task 5 |
| `area-finance-logic#7` | Cửa hàng chưa nhập giá định giá vàng bằng 0 và báo lỗ trọn giá vốn "do giá vàng giảm" | Task 6 (theo Quyết định 1) |
| `area-finance-logic#6` | Tab vàng rỗng hoặc hoà vốn ghi "lãi 0 ₫ … nhờ giá vàng tăng", ▲ +0,0% — và test đang khoá câu sai | Task 6 |
| `area-finance-logic#8` | Ngày mua là chữ tự do: dạng khác bị xếp như cũ nhất, "10/08/26" thành năm 1926, "31/02" trôi sang tháng 3 | Task 7 (theo Quyết định 2) |
| `area-finance-logic#9` | Ô phân nhận số lẻ và hiện nhiễu số thực ("2.3000000000000007 phân"); "1,5" khoá nút không lời giải thích | Task 8 (theo Quyết định 3) |
| `area-finance-ui#4` | "hạn gần nhất" ở trụ Nợ thẻ là hạn của thẻ thêm đầu tiên, không phải hạn gần nhất | Task 9 (theo Quyết định 4) |
| `area-overview-journal#14` | Ô "Nợ thẻ" ở Tổng quan luôn hiện hạn thẻ đầu tiên, kể cả khi thẻ đó đã trả hết | Task 9 |
| `area-finance-ui#5` | Ô "Ngày trả" trong hộp trả thẻ không được đọc, ngày gõ vào bị bỏ | Task 10 (theo Quyết định 5) |
| `area-finance-ui#6` | Gõ 0 vào "Giá trị hiện tại" khi thêm khoản đầu tư bị thay bằng số vốn | Task 11 |
| `area-finance-ui#8` | Cùng 1 field đầu tư có nhãn khác nhau giữa form thêm và hộp sửa | Task 11 |
| `area-overview-journal#10` | Gợi ý "thấp hơn/giảm" so tháng đang chạy với tháng trọn vẹn khi đã qua 90% tháng → báo nhầm cuối tháng | Task 12 (theo Quyết định 6) |
| `area-overview-journal#16` | Gợi ý chi tiêu tổng không có ngưỡng tối thiểu: chênh 2% (hay "khoảng 0%") vẫn báo | Task 12 |
| `area-overview-journal#11` | Dự báo tiết kiệm hồi quy cả lịch sử, bước nhảy 0 → số dư có sẵn lúc mới nhập quỹ bị đọc thành nhịp tiết kiệm | Task 13 |
| `area-shell-auth-calc#3` | Ctrl/Cmd+C trong máy tính xoá biểu thức và chặn luôn việc copy; Ctrl+'-'/'='/'0' bị nuốt | Task 15 |
| `area-shell-auth-calc#6` | Enter toàn cục chặn kích hoạt nút đang focus: không nạp lại được dòng lịch sử bằng Enter | Task 15 (chỉ bỏ qua dòng lịch sử — đúng lưu ý của verifier: bỏ qua mọi nút sẽ làm Enter đóng máy tính ngay khi mở) |
| `area-shell-auth-calc#4` | Bấm phép tính 2 lần nối thẳng: 5××2 = 25 (luỹ thừa JS), "÷×" mở comment JS | Task 16 |
| `area-shell-auth-calc#5` | Kết quả ≥ 1e21 lưu dạng mũ "1e+22", tính tiếp ra rác (1e22 + 1 = 24) | Task 16 |
| `area-shell-auth-calc#12` | Test thiếu các đường rủi ro: phím có modifier, phép tính lặp, số rất lớn, khoá còn hiệu lực sau tải lại | Task 15 (modifier), Task 16 (phép tính lặp, số lớn), Task 18 (khoá qua tải lại) |
| `area-shell-auth-calc#2` | Tắt "Tài chính" mất nút Ẩn số tiền duy nhất trong khi Chi tiêu/Mục tiêu/Tổng quan vẫn che số | Task 17 (theo Quyết định 7) |
| `area-components-lib#3` | Ghi `hide-money` lỗi ném ngay trong updater của `setHidden` → sập cả app | Task 17 |
| `area-shell-auth-calc#11` | Đã đăng nhập mà mở /login (hoặc bấm Back) vẫn hiện form, bắt nhập lại mật khẩu | Task 18 |
| `area-settings-sync#6` | Tên file xuất lấy ngày UTC → trước 7:00 sáng mang ngày hôm qua, 2 bản sao khác ngày trùng tên | Task 20 |
| `area-settings-sync#15` | Secret có ký tự ngoài Latin-1 (vd. "bí mật đồng bộ") bị báo nhầm là lỗi mạng | Task 20 |
| `area-settings-sync#8` | `addMood` nhận tên trùng; Nhật ký định danh mood bằng tên nên không chọn được mood mới | Task 21 |
| `area-settings-sync#9` | Xoá mood 1 chạm, không hỏi, thêm lại không lấy lại được điểm | Task 22 (theo Quyết định 8) |
| `area-settings-sync#14` | Mật khẩu trong hộp xác nhận xoá dữ liệu còn nguyên sau khi Huỷ → lần sau 1 cú bấm là xoá | Task 23 |
| `area-settings-sync#7` | "Bắt đầu lại" ghi "Không còn gì để xoá." trong khi vẫn xoá lương, tất toán, lịch sử tài sản, tiến độ ôn từ, điểm mini-game | Task 24 |

## Thay đổi ảnh hưởng tới các phần sau

Chỉ còn Plan 6b chạy sau plan này. Những thứ dưới đây là hợp đồng mới mà 6b phải giữ khi di chuyển/sửa file:

**Hàm mới/đổi nghĩa**
- `finance-calculations.ts`: thêm `goldMarketPrice(stores, purchase)` (giá cửa hàng, cửa hàng chưa có giá thì lấy `purchase.buy`), `unpricedGoldStores(gold, stores)`, `normalizeGoldDate(input): string | null`, `formatPhan(phan)`, `parseDueDay(due)`, `nearestDueCard(cards, today)`; `parseGoldDate` giờ đi qua `normalizeGoldDate`; `phanToChi` làm tròn 1 chữ số lẻ (và `formatChi` của `src/features/goals/get-goals.ts` cũng vậy, dùng `formatPhan`). Mọi chỗ định giá 1 lần mua (`summarizeFinance`, `summarizeGoldByStore`, `GoldTab`, `GoldTransactionsTable`, `GoldTransactionsCards`) dùng `goldMarketPrice`, không dùng thẳng `goldStorePrice`. **Plan 6b** (`area-finance-logic#11`, chuyển data layer tài chính ra dùng chung) mang theo cả các hàm này; `nearestDueCard` được Tổng quan dùng (`finance-summary-section.tsx`).
- `lib/format.ts`: `formatMoney` làm tròn về đồng nguyên và không bao giờ in "-0"; thêm `pastedMoneyDigits(text)` dùng bởi `Field` (`onPaste` khi `group`).
- `insights-calculations.ts`: bỏ `isMonthNearlyComplete`/`ANOMALY_MONTH_COMPLETE_RATIO`; thêm `ANOMALY_MIN_PCT = 10`, `samePeriodExpenses(expenses, today)`. Hướng "cao hơn/tăng" so với tháng trọn vẹn, hướng "thấp hơn/giảm" so cùng kỳ.
- `calc-engine.ts`: `evalExpr` trả `null` khi chuỗi sạch có `**`, `/*`, `*/`, `//`; `toMachineString` không bao giờ ra dạng mũ. `use-calculator.ts`: `push` thay phép tính cuối khi bấm 2 phép tính liền nhau (hàm nội bộ `appendToken`).

**UI**
- `AddGoldStoreForm`, `EditGoldStoreModal` có prop tuỳ chọn `existingNames?: string[]` (đúng pattern 1a), hint `Đã có cửa hàng tên này — chọn tên khác`; `GoldStoresCard` truyền `stores.map((s) => s.name)`. **Plan 6b** (`area-finance-logic#10`, tên truy cập được cho ô giá cửa hàng) sửa `gold-stores-card.tsx` — giữ prop này.
- `AddMoodForm` có prop tuỳ chọn `existingLabels?: string[]`; `MoodsCard` có `AlertDialog` xác nhận xoá (state `deleting: { index, label } | null`). **Plan 6b** (`area-settings-sync#10`, tên truy cập được cho công tắc mood/nhãn) sửa `moods-card.tsx` — giữ hộp xác nhận; (`area-components-lib#14`, `aria-describedby` cho AlertDialog) — mô tả của hộp xoá mood chỉ là phrasing content (chữ + `<strong>`).
- `PayCreditCardModal` không còn ô "Ngày trả" (và hàm `todayLabel`).
- `CalculatorModal`: `handleKeyDown` bỏ qua mọi phím có Ctrl/Cmd/Alt, và bỏ qua Enter khi đang focus 1 dòng lịch sử (nút có thuộc tính `data-calc-history-item`).
- `Sidebar`: `showMoneyTools` = còn ít nhất 1 trong `MONEY_MODULE_KEYS = ["taichinh", "chitieu", "muctieu"]`. **Plan 6b** (`area-shell-auth-calc#7`) giữ nguyên.
- `MoneyVisibilityProvider.toggle` ghi storage NGOÀI updater của `setHidden`; `setHideMoney` nuốt lỗi ghi. **Plan 6b** (`area-components-lib#17`, đặt tên type props) giữ nguyên cách này.
- `AuthGuard`: ở `/login` mà đã có `auth-user` thì `router.replace("/overview")`.
- `useSettings.addMood` từ chối tên trùng (so sau trim, không phân biệt hoa thường) bằng toast `Đã có tâm trạng tên "…". Vui lòng chọn tên khác.`; `parseAppSettings` đổi tên mood trùng CHÍNH XÁC thành "Tên (2)"... **Plan 6b** (`area-settings-sync#11`, chuyển `useSettings` sang `src/lib/`) mang theo kiểm tra này.
- `ConfirmWipeModal` tự xoá ô mật khẩu mỗi lần đóng (bất kể đóng bằng đường nào).
- `ResetCard`: chữ ở bước 0 và bước 1 đổi (xem Task 24); `SettingsView` đếm thêm lương, tất toán, lịch sử tài sản, tiến độ ôn từ, điểm/chuỗi mini-game.
- `exportFileName` lấy ngày theo giờ máy (`dayKey`); `pushSnapshot`/`pullSnapshot` trả lỗi `SECRET_CHARSET_ERROR` trước khi gọi `fetch` khi secret có ký tự mã > 255.

## Cấu trúc file

Nhánh 1 `fix/small-bugs-finance`:
- Modify (dùng chung): `src/components/ui/progress.tsx`, `src/components/ui/field.tsx`, `src/components/ob/net-worth-card.tsx`, `src/lib/format.ts`
- Modify (tài chính): `src/features/finance/finance-calculations.ts`, `src/features/finance/components/{add-gold-store-form,edit-gold-store-modal,gold-stores-card,add-gold-form,edit-gold-purchase-modal,gold-tab,gold-transactions-table,gold-transactions-cards,finance-view,pay-credit-card-modal,add-invest-form}.tsx`
- Modify (mục tiêu): `src/features/goals/get-goals.ts` (chỉ hàm `formatChi`)
- Modify (tổng quan): `src/features/overview/insights-calculations.ts`, `src/features/overview/components/finance-summary-section.tsx`
- Create (test): `src/features/finance/__tests__/components/add-gold-form.test.tsx`
- Test sửa/thêm: `src/components/__tests__/ui/progress.test.tsx`, `src/components/__tests__/ui/field.test.tsx` (file do Plan 2 Task 5 tạo), `src/components/__tests__/ob/net-worth-card.test.tsx`, `src/lib/__tests__/format.test.ts`, `src/features/finance/__tests__/finance-calculations.test.ts`, `src/features/finance/__tests__/components/{savings-tab,gold-stores-card,edit-gold-store-modal,gold-tab,edit-gold-purchase-modal,finance-view,pay-credit-card-modal,investments-tab}.test.tsx`, `src/features/goals/__tests__/get-goals.test.ts`, `src/features/overview/__tests__/insights-calculations.test.ts`, `src/features/overview/__tests__/components/finance-summary-section.test.tsx`

Nhánh 2 `fix/small-bugs-calc`:
- Modify: `src/features/calc/components/calculator-modal.tsx`, `src/features/calc/hooks/use-calculator.ts`, `src/features/calc/calc-engine.ts`, `src/app/(app)/_components/sidebar.tsx`, `src/lib/money-visibility-storage.ts`, `src/components/money-visibility-provider.tsx`, `src/components/auth-guard.tsx`
- Create (test): `src/lib/__tests__/money-visibility-storage.test.ts`, `src/components/__tests__/money-visibility-provider.test.tsx`
- Test sửa/thêm: `src/features/calc/__tests__/calc-engine.test.ts`, `src/features/calc/__tests__/components/calculator-modal.test.tsx`, `src/app/(app)/_components/__tests__/sidebar.test.tsx`, `src/components/__tests__/auth-guard.test.tsx`, `src/lib/__tests__/use-attempt-lockout.test.ts`

Nhánh 3 `fix/small-bugs-settings`:
- Modify: `src/features/settings/data-transfer.ts`, `src/features/settings/api.ts`, `src/features/settings/hooks/use-settings.ts`, `src/lib/settings-storage.ts`, `src/features/settings/components/{add-mood-form,moods-card,confirm-wipe-modal,reset-card,settings-view}.tsx`
- Create (test): `src/features/settings/__tests__/api.test.ts`, `src/features/settings/__tests__/components/moods-card.test.tsx`
- Test sửa/thêm: `src/features/settings/__tests__/data-transfer.test.ts`, `src/features/settings/__tests__/hooks/use-settings.test.ts`, `src/lib/__tests__/settings-storage.test.ts`, `src/features/settings/__tests__/components/{confirm-wipe-modal,reset-card,settings-view}.test.tsx`

---

## Nhánh 1 — `fix/small-bugs-finance` (Task 1–14)

Tách nhánh: `git checkout developer && git pull --ff-only 2>/dev/null; git checkout -b fix/small-bugs-finance` (bỏ qua `git pull` nếu repo không có remote).

### Task 1: `Progress` coi NaN là 0% — quỹ 0 ₫ trên mục tiêu 0 ₫ không còn thanh đầy

**Files:**
- Modify: `src/components/ui/progress.tsx` (dòng `const pct = ...`)
- Test: `src/components/__tests__/ui/progress.test.tsx`, `src/features/finance/__tests__/components/savings-tab.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `Progress` nhận `value` là NaN (hay null/undefined) thì vẽ 0%; số âm/±Infinity/> 100 vẫn kẹp về 0–100 như cũ. Props không đổi. Mọi nơi truyền `amount / target` (`SavingsTab`, `GoalsSummarySection`, `GoalCard`) tự đúng theo.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/components/__tests__/ui/progress.test.tsx`, đổi dòng import RTL

```tsx
import { render } from "@testing-library/react"
```

thành

```tsx
import { render, screen } from "@testing-library/react"
```

rồi thêm vào cuối `describe("Progress", ...)`:

```tsx
  it("treats a NaN value (vd. quỹ 0 ₫ trên mục tiêu 0 ₫) as 0%, not as an indeterminate full bar", () => {
    const { container } = render(<Progress value={Number.NaN} />)

    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "0")
    expect(bar).not.toHaveAttribute("data-indeterminate")
    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement
    expect(indicator.style.width).toBe("0%")
  })

  it("still clamps out-of-range values, including Infinity, to 0–100", () => {
    const { rerender } = render(<Progress value={-20} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")

    rerender(<Progress value={250} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")

    // Quỹ đã có tiền nhưng mục tiêu 0 → amount / 0 = Infinity → thanh đầy, giữ đúng như trước.
    rerender(<Progress value={Number.POSITIVE_INFINITY} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })
```

1.2. Thêm vào cuối `src/features/finance/__tests__/components/savings-tab.test.tsx` (sau `})` đóng describe cuối cùng của file; `render`, `screen`, `vi`, `SavingsTab` đã import sẵn):

```tsx
describe("SavingsTab — quỹ có mục tiêu 0", () => {
  it("shows an empty (0%) bar for a fund with 0 ₫ toward a 0 ₫ target, not a full indeterminate one", () => {
    render(
      <SavingsTab
        savings={[{ name: "Quỹ trống", amount: 0, target: 0 }]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "0")
    expect(bar).not.toHaveAttribute("data-indeterminate")
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/components/__tests__/ui/progress.test.tsx src/features/finance/__tests__/components/savings-tab.test.tsx`
Expected: FAIL đúng 2 test — "treats a NaN value…" và "shows an empty (0%) bar…" với `Expected the element to have attribute: aria-valuenow="0" Received: null` (Base UI coi NaN là "indeterminate" nên không có `aria-valuenow`). Test "still clamps out-of-range values…" PASS sẵn (khoá hành vi cũ cần giữ). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Đưa NaN về 0 trước khi kẹp**

Trong `src/components/ui/progress.tsx`, thay dòng

```tsx
  const pct = Math.max(0, Math.min(100, value ?? 0))
```

bằng

```tsx
  // NaN (vd. quỹ 0 ₫ trên mục tiêu 0 ₫ → 0/0) lọt qua Math.min/Math.max, mà Base UI coi mọi giá trị
  // không hữu hạn là "không xác định": thanh chạy kín 100%, trình đọc màn hình đọc "indeterminate
  // progress". Đưa NaN về 0; số âm, ±Infinity và > 100 vẫn kẹp về 0–100 như cũ.
  const raw = value ?? 0
  const pct = Number.isNaN(raw) ? 0 : Math.max(0, Math.min(100, raw))
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/ui/progress.test.tsx src/features/finance/__tests__/components/savings-tab.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.1** ở "Kiểm tra tay" của Task 14 kiểm lại thay đổi này trước khi merge):

```bash
git add src/components/ui/progress.tsx src/components/__tests__/ui/progress.test.tsx src/features/finance/__tests__/components/savings-tab.test.tsx
git commit -m "fix: show an empty progress bar instead of a full one when the value is NaN"
```

---

### Task 2: `formatMoney` chỉ in đồng nguyên; thanh tài sản ròng bỏ phần 0 ₫

**Files:**
- Modify: `src/lib/format.ts` (hàm `formatMoney`)
- Modify: `src/components/ob/net-worth-card.tsx` (khối thanh màu `segments.map`)
- Test: `src/lib/__tests__/format.test.ts`, `src/components/__tests__/ob/net-worth-card.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `formatMoney(n: number, hidden = false): string` giữ chữ ký; luôn làm tròn về đồng nguyên (`Math.round`), `-0` (và NaN) in thành `"0 ₫"`. `CountMoney` khi đếm xong cũng không còn mọc ",5" (nó gọi `formatMoney`). Số "tương đương …" của mục tiêu vàng (Plan 2) tự được làm tròn theo. `NetWorthCard` chỉ vẽ phần có giá trị > 0 trên thanh màu; chú giải giữ đủ các mục như cũ.

- [ ] **Step 1: Viết test thất bại**

1.1. Thêm vào cuối `describe("formatMoney", ...)` trong `src/lib/__tests__/format.test.ts`:

```ts
  it("rounds to whole đồng, so a fractional amount never shows a decimal part", () => {
    // 2,5 phân × 8.123.457 đ/phân = 20.308.642,5 đ
    expect(formatMoney(2.5 * 8_123_457)).toBe("20.308.643 ₫")
    expect(formatMoney(0.5 * 8_123_457)).toBe("4.061.729 ₫")
  })

  it("never prints a negative zero", () => {
    expect(formatMoney(-0)).toBe("0 ₫")
    expect(formatMoney(-0.4)).toBe("0 ₫")
  })
```

1.2. Thêm vào cuối `describe("NetWorthCard", ...)` trong `src/components/__tests__/ob/net-worth-card.test.tsx` (`buildSummary`, `act`, `vi`, `screen` đã có sẵn; `beforeEach` đã bật `vi.useFakeTimers()`):

```tsx
  it("leaves zero-value parts out of the bar so it has no stray gaps, but keeps the full legend", () => {
    render(<NetWorthCard summary={buildSummary({ goldValue: 0, debtTotal: 0 })} />)

    expect(screen.getByTestId("segment-savings")).toBeInTheDocument()
    expect(screen.queryByTestId("segment-gold")).not.toBeInTheDocument()
    expect(screen.queryByTestId("segment-debt")).not.toBeInTheDocument()
    expect(screen.getByText("Vàng")).toBeInTheDocument()
    expect(screen.getByText("Nợ thẻ")).toBeInTheDocument()
  })

  it("settles on whole đồng instead of growing a ',5' when the count-up finishes", () => {
    render(<NetWorthCard summary={buildSummary({ net: 20_308_642.5 })} />)

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByText("20.308.643 ₫")).toBeInTheDocument()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/lib/__tests__/format.test.ts src/components/__tests__/ob/net-worth-card.test.tsx`
Expected: FAIL đúng 4 test — `expected '20.308.642,5 ₫' to be '20.308.643 ₫'`, `expected '-0 ₫' to be '0 ₫'`, "leaves zero-value parts out…" (`expected <span data-testid="segment-gold"> not to be in the document`) và "settles on whole đồng…" (`Unable to find an element with the text: 20.308.643 ₫` — đang hiện "20.308.642,5 ₫"). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Làm tròn trong `formatMoney`**

Trong `src/lib/format.ts`, thay hàm

```ts
function formatMoney(n: number, hidden = false): string {
  return hidden ? "•••••••• ₫" : n.toLocaleString("vi-VN") + " ₫"
}
```

bằng

```ts
// Tiền VND là đồng nguyên: làm tròn về đồng (vd. 2,5 phân × 8.123.457 đ/phân = 20.308.642,5 đ), và
// không bao giờ in "-0 ₫" — Math.round(-0,4) = -0, `|| 0` đổi -0 (và NaN) thành 0.
function formatMoney(n: number, hidden = false): string {
  return hidden ? "•••••••• ₫" : (Math.round(n) || 0).toLocaleString("vi-VN") + " ₫"
}
```

- [ ] **Step 4: Thanh tài sản ròng chỉ vẽ phần có giá trị**

Trong `src/components/ob/net-worth-card.tsx`, thay khối

```tsx
      <div className="mt-5 flex h-2 gap-1.5 overflow-hidden rounded-[var(--ob-radius-pill)]">
        {total > 0 ? (
          segments.map((segment) => (
            <span
              key={segment.key}
              data-testid={`segment-${segment.key}`}
              style={{ flex: segment.value, background: segment.color }}
            />
          ))
        ) : (
```

bằng

```tsx
      {/* Chỉ vẽ phần có giá trị: phần 0 ₫ rộng 0px nhưng vẫn chiếm 1 khe gap-1.5 (6px), làm thanh hở
          ở cuối hoặc giữa. Chú giải bên dưới vẫn liệt kê đủ. */}
      <div className="mt-5 flex h-2 gap-1.5 overflow-hidden rounded-[var(--ob-radius-pill)]">
        {total > 0 ? (
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <span
                key={segment.key}
                data-testid={`segment-${segment.key}`}
                style={{ flex: segment.value, background: segment.color }}
              />
            ))
        ) : (
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/lib/__tests__/format.test.ts src/components/__tests__/ob/net-worth-card.test.tsx src/components/__tests__/ob/count-money.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx`
Expected: PASS toàn bộ (mọi test cũ dùng số nguyên nên chuỗi không đổi; test `fitChars` của Plan 5 vẫn đếm đúng độ dài chuỗi đã làm tròn)

- [ ] **Step 6: Commit**

Tự review `git diff` của task rồi commit (mục **A.2** ở "Kiểm tra tay" của Task 14):

```bash
git add src/lib/format.ts src/components/ob/net-worth-card.tsx src/lib/__tests__/format.test.ts src/components/__tests__/ob/net-worth-card.test.tsx
git commit -m "fix: round money to whole dong and leave empty parts out of the net-worth bar"
```

---

### Task 3: Ô tiền bỏ phần lẻ khi dán ("1.500.000,00" không thành 150.000.000 ₫)

**Files:**
- Modify: `src/lib/format.ts` (hàm mới `pastedMoneyDigits`, khối export)
- Modify: `src/components/ui/field.tsx` (import, lấy `onPaste` ra khỏi props, hàm `handlePaste`, prop `onPaste` của `Input`)
- Test: `src/lib/__tests__/format.test.ts`, `src/components/__tests__/ui/field.test.tsx` (file do Plan 2 Task 5 tạo)

**Interfaces:**
- Consumes: `Field` bản của Plan 2 — đã tách `placeholder`, `onFocus`, `onBlur` khỏi `...props`, có `masked` + state `focused`; `handleChange` (lọc chữ số khi `group`) giữ nguyên.
- Produces: `pastedMoneyDigits(text: string): string` (export mới của `src/lib/format.ts`) — dấu `.`/`,` CUỐI CÙNG mà sau nó không phải đúng 3 chữ số là dấu thập phân: bỏ từ đó trở đi rồi chỉ giữ chữ số. `Field` có `group` tự xử lý lần dán: thay đúng vùng đang chọn bằng phần nguyên của số dán vào và gọi `onChange({ target: { value: <chỉ chữ số> } })` — đúng dạng chuỗi `handleChange` vẫn trả, nên 3 form Chi tiêu của Plan 2 vẫn đưa thẳng chuỗi này vào `exceedsBudgetAmountLimit`. `onPaste` riêng của nơi dùng (nếu có) được gọi trước; nơi dùng gọi `preventDefault()` thì `Field` không xử lý. Ô không có `group` để trình duyệt dán như thường. Gõ tay "1500000.5" vẫn như cũ (dấu chấm biến mất ngay trên màn hình nên người dùng thấy) — ngoài phạm vi.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/lib/__tests__/format.test.ts`, đổi dòng import

```ts
import { formatMoney, groupVN } from "../format"
```

thành

```ts
import { formatMoney, groupVN, pastedMoneyDigits } from "../format"
```

rồi thêm vào cuối file:

```ts
describe("pastedMoneyDigits", () => {
  it("drops a Vietnamese decimal part (after the last comma) before keeping the digits", () => {
    expect(pastedMoneyDigits("1.500.000,00")).toBe("1500000")
    expect(pastedMoneyDigits("1.234.567,5 ₫")).toBe("1234567")
  })

  it("drops an English-style decimal part (after the last dot) too", () => {
    expect(pastedMoneyDigits("1,500,000.00")).toBe("1500000")
    expect(pastedMoneyDigits("1500000.5")).toBe("1500000")
  })

  it("treats a separator followed by exactly 3 digits as a thousands separator", () => {
    expect(pastedMoneyDigits("1.500.000")).toBe("1500000")
    expect(pastedMoneyDigits("20.000.000đ")).toBe("20000000")
    expect(pastedMoneyDigits("1,500")).toBe("1500")
  })

  it("returns an empty string when the text has no digits", () => {
    expect(pastedMoneyDigits("abc")).toBe("")
  })
})
```

1.2. Trong `src/components/__tests__/ui/field.test.tsx`, đổi dòng import RTL

```tsx
import { act, render, screen } from "@testing-library/react"
```

thành

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react"
```

rồi thêm vào cuối file (sau `})` đóng `describe("Field", ...)`; cách giả clipboard giống `journal-editor.test.tsx`):

```tsx
describe("Field — dán số tiền", () => {
  it("drops the decimal part of a pasted Vietnamese amount instead of gluing it onto the number", () => {
    const onChange = vi.fn()
    render(<Field label="Số tiền" numeric group value="" onChange={onChange} />)

    fireEvent.paste(screen.getByLabelText("Số tiền", { exact: false }), {
      clipboardData: { getData: () => "1.500.000,00" },
    })

    expect(onChange).toHaveBeenLastCalledWith({ target: { value: "1500000" } })
  })

  it("replaces the selected amount with the pasted one", () => {
    const onChange = vi.fn()
    render(<Field label="Số tiền" numeric group value="20000000" onChange={onChange} />)
    const input = screen.getByLabelText("Số tiền", { exact: false }) as HTMLInputElement
    input.setSelectionRange(0, input.value.length)

    fireEvent.paste(input, { clipboardData: { getData: () => "1,500,000.00" } })

    expect(onChange).toHaveBeenLastCalledWith({ target: { value: "1500000" } })
  })

  it("leaves pasting into a plain text field to the browser", () => {
    const onChange = vi.fn()
    render(<Field label="Ghi chú" value="" onChange={onChange} />)

    const notCancelled = fireEvent.paste(screen.getByLabelText("Ghi chú", { exact: false }), {
      clipboardData: { getData: () => "1.500.000,00" },
    })

    expect(notCancelled).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/lib/__tests__/format.test.ts src/components/__tests__/ui/field.test.tsx`
Expected: FAIL 6 test — 4 test `pastedMoneyDigits` (`TypeError: pastedMoneyDigits is not a function`) và 2 test dán đầu của `Field` (`expected "spy" to be last called with arguments: [ { target: { value: '1500000' } } ]` — `Number of calls: 0`, vì jsdom không tự chèn chữ khi dán và `Field` chưa nghe `paste`). Test "leaves pasting into a plain text field…" PASS sẵn (khoá hành vi cần giữ). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Thêm `pastedMoneyDigits` vào `src/lib/format.ts`**

Thêm ngay sau hàm `groupVN`:

```ts

// Số tiền dán từ sao kê/hoá đơn có thể kèm phần lẻ: "1.500.000,00" (kiểu Việt) hay "1,500,000.00"
// (kiểu Anh). Dấu "." hay "," CUỐI CÙNG mà theo sau không phải đúng 3 chữ số là dấu thập phân → bỏ
// từ đó trở đi rồi mới lấy chữ số; đúng 3 chữ số thì là dấu ngăn hàng nghìn ("1.500.000", "1,500").
// VND là đồng nguyên nên phần lẻ bị bỏ, không làm tròn.
function pastedMoneyDigits(text: string): string {
  const decimal = /[.,](\d*)\D*$/.exec(text)
  const integerPart = decimal && decimal[1].length !== 3 ? text.slice(0, decimal.index) : text
  return integerPart.replace(/\D/g, "")
}
```

và đổi dòng export cuối file thành:

```ts
export { formatMoney, groupVN, pastedMoneyDigits }
```

- [ ] **Step 4: `Field` tự xử lý lần dán khi `group`**

4.1. Trong `src/components/ui/field.tsx`, đổi

```tsx
import { groupVN } from "@/lib/format"
```

thành

```tsx
import { groupVN, pastedMoneyDigits } from "@/lib/format"
```

4.2. Trong phần lấy props của `Field`, thay

```tsx
  onFocus,
  onBlur,
  ...props
}: FieldProps) {
```

bằng

```tsx
  onFocus,
  onBlur,
  onPaste,
  ...props
}: FieldProps) {
```

4.3. Ngay sau khối `const handleChange = ... : onChange` (khối lọc chữ số khi `group`), thêm:

```tsx
  // Dán số tiền chép từ sao kê/hoá đơn ("1.500.000,00"): handleChange chỉ lọc chữ số trên cả chuỗi
  // nên ",00" dính vào thành 150.000.000 đ. Ô tiền tự xử lý lần dán — bỏ phần lẻ rồi mới lấy chữ số,
  // thay đúng vùng đang chọn — và trả về đúng dạng chuỗi chữ số như handleChange.
  const handlePaste =
    group && onChange
      ? (e: React.ClipboardEvent<HTMLInputElement>) => {
          onPaste?.(e)
          if (e.defaultPrevented) return
          e.preventDefault()
          const input = e.currentTarget
          const start = input.selectionStart ?? input.value.length
          const end = input.selectionEnd ?? input.value.length
          const pasted = pastedMoneyDigits(e.clipboardData.getData("text/plain"))
          const digits = (input.value.slice(0, start) + pasted + input.value.slice(end)).replace(/\D/g, "")
          onChange({ target: { value: digits } } as React.ChangeEvent<HTMLInputElement>)
        }
      : onPaste
```

4.4. Trong `<Input ...>`, ngay sau dòng `onChange={handleChange}` thêm:

```tsx
          onPaste={handlePaste}
```

(`{...props}` vẫn đứng cuối như cũ; `onPaste` đã được lấy ra khỏi `props` nên không bị ghi đè.)

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/lib/__tests__/format.test.ts src/components/__tests__/ui/field.test.tsx src/features/budget/__tests__/components/salary-card.test.tsx src/features/budget/__tests__/components/expense-entry-form.test.tsx src/features/finance/__tests__/components/savings-tab.test.tsx`
Expected: PASS toàn bộ (gõ tay vẫn qua `handleChange` như cũ; `masked` của Plan 2 không đổi)

- [ ] **Step 6: Commit**

Tự review `git diff` của task rồi commit (mục **A.3** ở "Kiểm tra tay" của Task 14):

```bash
git add src/lib/format.ts src/components/ui/field.tsx src/lib/__tests__/format.test.ts src/components/__tests__/ui/field.test.tsx
git commit -m "fix: drop the decimal part of an amount pasted into a money field"
```

---

### Task 4: Form cửa hàng vàng chặn tên trùng ngay khi gõ, không còn đóng và mất chữ

**Files:**
- Modify: `src/features/finance/components/add-gold-store-form.tsx` (interface props, khai báo component, biến `duplicate`, Field "Tên cửa hàng", nút Thêm)
- Modify: `src/features/finance/components/edit-gold-store-modal.tsx` (interface props, khai báo component, biến `duplicate`, Field "Tên cửa hàng", nút Lưu)
- Modify: `src/features/finance/components/gold-stores-card.tsx` (biến `storeNames`, 2 chỗ render form/modal)
- Test: `src/features/finance/__tests__/components/gold-stores-card.test.tsx`, `src/features/finance/__tests__/components/edit-gold-store-modal.test.tsx`

**Interfaces:**
- Consumes: `Field` có `invalid?: boolean` + `hint?: ReactNode` (hint đỏ khi `invalid`) — đúng pattern `existingNames` của Plan 1a ở form quỹ/thẻ.
- Produces: prop tuỳ chọn `existingNames?: string[]` (mặc định `[]`) trên `AddGoldStoreForm` và `EditGoldStoreModal`; trùng tên → `Field invalid` + hint `Đã có cửa hàng tên này — chọn tên khác`, nút Thêm/Lưu khoá, chữ đã gõ được giữ. So khớp CHÍNH XÁC sau khi trim — đúng như `useFinance.addGoldStore`/`updateGoldStore` đang so (hook giữ nguyên kiểm tra + toast của nó làm lớp chặn cuối). Modal sửa bỏ qua tên hiện tại của chính cửa hàng đang sửa. `GoldStoresCard` truyền `stores.map((s) => s.name)` cho cả 2. Khi hint hiện, nội dung `<label>` gồm cả hint nên test phải dùng `getByLabelText("Tên cửa hàng", { exact: false })`.

- [ ] **Step 1: Viết test thất bại**

1.1. Thêm vào cuối `src/features/finance/__tests__/components/gold-stores-card.test.tsx` (sau `})` đóng `describe("GoldStoresCard", ...)`; `STORES` = SJC + PNJ, `render`, `screen`, `fireEvent`, `vi` đã có sẵn):

```tsx
describe("GoldStoresCard — tên cửa hàng trùng", () => {
  it("blocks adding a store whose name is already taken and keeps what was typed", () => {
    const onAdd = vi.fn()
    render(
      <GoldStoresCard stores={STORES} gold={[]} onAdd={onAdd} onUpdate={vi.fn()} onRemove={vi.fn()} onSetPrice={vi.fn()} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))
    fireEvent.change(screen.getByLabelText("Tên cửa hàng", { exact: false }), { target: { value: " SJC " } })
    fireEvent.change(screen.getByLabelText("Giá hôm nay", { exact: false }), { target: { value: "8500000" } })

    expect(screen.getByText("Đã có cửa hàng tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).not.toHaveBeenCalled()
    // Form vẫn mở, chữ đã gõ còn nguyên — trước đây form gọi reset() dù hook từ chối.
    expect(screen.getByLabelText("Tên cửa hàng", { exact: false })).toHaveValue(" SJC ")
    expect(screen.getByLabelText("Giá hôm nay", { exact: false })).toHaveValue("8.500.000")
  })

  it("blocks renaming a store to another store's name from the Sửa form", () => {
    const onUpdate = vi.fn()
    render(
      <GoldStoresCard stores={STORES} gold={[]} onAdd={vi.fn()} onUpdate={onUpdate} onRemove={vi.fn()} onSetPrice={vi.fn()} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Sửa SJC" }))
    fireEvent.change(screen.getByLabelText("Tên cửa hàng", { exact: false }), { target: { value: "PNJ" } })

    expect(screen.getByText("Đã có cửa hàng tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
    expect(onUpdate).not.toHaveBeenCalled()
  })
})
```

1.2. Thêm vào cuối `src/features/finance/__tests__/components/edit-gold-store-modal.test.tsx` (dùng `STORE` có sẵn — tên `"PNJ"`):

```tsx
describe("EditGoldStoreModal — tên cửa hàng trùng", () => {
  it("disables Lưu and explains why when renaming to another store's name", () => {
    render(
      <EditGoldStoreModal store={STORE} existingNames={["PNJ", "SJC"]} onOpenChange={vi.fn()} onSave={vi.fn()} />
    )

    fireEvent.change(screen.getByLabelText("Tên cửa hàng"), { target: { value: "SJC" } })

    expect(screen.getByText("Đã có cửa hàng tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("still allows saving under the store's own current name", () => {
    render(
      <EditGoldStoreModal store={STORE} existingNames={["PNJ", "SJC"]} onOpenChange={vi.fn()} onSave={vi.fn()} />
    )

    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()
    expect(screen.queryByText("Đã có cửa hàng tên này — chọn tên khác")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/components/gold-stores-card.test.tsx src/features/finance/__tests__/components/edit-gold-store-modal.test.tsx`
Expected: FAIL 3 test — `Unable to find an element with the text: Đã có cửa hàng tên này — chọn tên khác` (vitest không kiểm kiểu nên prop `existingNames` chưa khai báo không chặn test chạy tới đó). Test "still allows saving under the store's own current name" PASS sẵn — rào chắn cho việc bỏ qua tên của chính cửa hàng đang sửa. Mọi test cũ vẫn PASS.

- [ ] **Step 3: Sửa `AddGoldStoreForm`**

Trong `src/features/finance/components/add-gold-store-form.tsx`, thay

```tsx
interface AddGoldStoreFormProps {
  onAdd: (store: GoldStore) => void
}

function AddGoldStoreForm({ onAdd }: AddGoldStoreFormProps) {
```

bằng

```tsx
interface AddGoldStoreFormProps {
  onAdd: (store: GoldStore) => void
  // Tên các cửa hàng đang có — lần mua vàng tham chiếu cửa hàng bằng tên, nên chặn trùng ngay ở form:
  // nếu chỉ để hook từ chối, form vẫn reset() và mất chữ người dùng đã gõ.
  existingNames?: string[]
}

function AddGoldStoreForm({ onAdd, existingNames = [] }: AddGoldStoreFormProps) {
```

Ngay trước `return (` của nhánh form đang mở (sau khối `if (!open) { ... }`), thêm:

```tsx
  const duplicate = existingNames.includes(name.trim())

```

Field "Tên cửa hàng" (có `label="Tên cửa hàng"`) thêm 2 prop ngay sau `onChange={(e) => setName(e.target.value)}`:

```tsx
          invalid={duplicate}
          hint={duplicate ? "Đã có cửa hàng tên này — chọn tên khác" : undefined}
```

và nút Thêm đổi `disabled={!name.trim()}` thành:

```tsx
          disabled={duplicate || !name.trim()}
```

- [ ] **Step 4: Sửa `EditGoldStoreModal`**

Trong `src/features/finance/components/edit-gold-store-modal.tsx`, thay

```tsx
interface EditGoldStoreModalProps {
  store: GoldStore | null
  onOpenChange: (open: boolean) => void
  onSave: (store: GoldStore) => void
}

function EditGoldStoreModal({ store, onOpenChange, onSave }: EditGoldStoreModalProps) {
```

bằng

```tsx
interface EditGoldStoreModalProps {
  store: GoldStore | null
  // Tên mọi cửa hàng đang có (tên hiện tại của chính cửa hàng đang sửa luôn được giữ).
  existingNames?: string[]
  onOpenChange: (open: boolean) => void
  onSave: (store: GoldStore) => void
}

function EditGoldStoreModal({ store, existingNames = [], onOpenChange, onSave }: EditGoldStoreModalProps) {
```

Ngay sau dòng `const currentStore = store`, thêm:

```tsx
  const trimmedName = name.trim()
  const duplicate = trimmedName !== currentStore.name && existingNames.includes(trimmedName)
```

Field "Tên cửa hàng" thêm 2 prop ngay sau `onChange={(e) => setName(e.target.value)}`:

```tsx
        invalid={duplicate}
        hint={duplicate ? "Đã có cửa hàng tên này — chọn tên khác" : undefined}
```

và nút Lưu đổi `disabled={!name.trim()}` thành:

```tsx
disabled={duplicate || !trimmedName}
```

- [ ] **Step 5: `GoldStoresCard` truyền danh sách tên**

Trong `src/features/finance/components/gold-stores-card.tsx`, ngay sau dòng `const [deletingName, setDeletingName] = useState<string | null>(null)` thêm:

```tsx
  const storeNames = stores.map((store) => store.name)
```

đổi `<AddGoldStoreForm onAdd={onAdd} />` thành:

```tsx
      <AddGoldStoreForm onAdd={onAdd} existingNames={storeNames} />
```

và trong `<EditGoldStoreModal ...>` thêm prop ngay sau dòng `store={stores.find((s) => s.name === editingName) ?? null}`:

```tsx
        existingNames={storeNames}
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/components/gold-stores-card.test.tsx src/features/finance/__tests__/components/edit-gold-store-modal.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 7: Commit**

Tự review `git diff` của task rồi commit (mục **A.4** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/finance/components/add-gold-store-form.tsx src/features/finance/components/edit-gold-store-modal.tsx src/features/finance/components/gold-stores-card.tsx src/features/finance/__tests__/components/gold-stores-card.test.tsx src/features/finance/__tests__/components/edit-gold-store-modal.test.tsx
git commit -m "fix: block duplicate gold store names in the add and rename forms"
```

---

### Task 5: Form thêm vàng bỏ lựa chọn cửa hàng đã bị đổi tên/xoá — không lưu lần mua mồ côi

**Files:**
- Modify: `src/features/finance/components/add-gold-form.tsx` (biến mới `selectedStore`; `GoldStorePicker`, nút Thêm dùng nó)
- Create: `src/features/finance/__tests__/components/add-gold-form.test.tsx`

**Interfaces:**
- Consumes: `phanValid` của Plan 1b (đứng ngay trước `return (` của nhánh form đang mở).
- Produces: biến cục bộ `selectedStore = stores.some((s) => s.name === store) ? store : ""` — cửa hàng đã chọn chỉ còn hiệu lực khi tên đó vẫn còn trong `stores`; picker, điều kiện khoá nút Thêm và giá trị lưu đều dùng nó. Đổi tên/xoá cửa hàng đang chọn (ở thẻ "Giá thị trường hôm nay" ngay phía trên) thì chip bỏ chọn, nút Thêm khoá cho tới khi chọn lại. Task 7, 8 sửa tiếp file này và thêm test vào `add-gold-form.test.tsx` (dùng lại helper `openForm`/`fillValidPurchase` tạo ở đây). `EditGoldPurchaseModal` không đổi: modal phủ cả trang nên không đổi tên cửa hàng được trong lúc sửa, và sửa 1 lần mua cũ đang trỏ cửa hàng không còn chính là cách chọn lại cửa hàng cho nó.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/features/finance/__tests__/components/add-gold-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { AddGoldForm } from "../../components/add-gold-form"
import type { GoldStore } from "../../types"

const SJX: GoldStore = { name: "SJX", price: "880.000" }
const PNJ: GoldStore = { name: "PNJ", price: "870.000" }

function openForm() {
  fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))
}

function fillValidPurchase() {
  fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "10/08/2026" } })
  fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), { target: { value: "10" } })
  fireEvent.change(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false }), { target: { value: "900000" } })
}

describe("AddGoldForm — cửa hàng đang chọn bị đổi tên/xoá", () => {
  it("drops the picked store when it is renamed while the form is open, so no orphan purchase is saved", () => {
    const onAdd = vi.fn()
    const { rerender } = render(<AddGoldForm stores={[SJX]} onAdd={onAdd} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeEnabled()

    // Sửa tên SJX → SJC bằng bút chì ở thẻ cửa hàng phía trên, trong lúc form vẫn mở.
    rerender(<AddGoldForm stores={[{ ...SJX, name: "SJC" }]} onAdd={onAdd} />)

    expect(screen.getByRole("button", { name: "SJC" })).not.toHaveClass("border-[var(--ob-color-action)]")
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "SJC" }))
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).toHaveBeenCalledWith({ date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" })
  })

  it("drops the picked store when it is deleted while the form is open", () => {
    const onAdd = vi.fn()
    const { rerender } = render(<AddGoldForm stores={[SJX, PNJ]} onAdd={onAdd} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()

    // Cửa hàng chưa có lần mua nào nên xoá được ngay cả khi đang được chọn trong form.
    rerender(<AddGoldForm stores={[PNJ]} onAdd={onAdd} />)

    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/components/add-gold-form.test.tsx`
Expected: FAIL cả 2 test — `Received element is not disabled: <button ...>Thêm</button>` (nút chỉ kiểm `!store` nên vẫn sáng với tên cũ "SJX").

- [ ] **Step 3: Chỉ coi là đã chọn khi cửa hàng còn trong danh sách**

Trong `src/features/finance/components/add-gold-form.tsx`, ngay sau dòng `const phanValid = ...` (của Plan 1b, đứng trước `return (`), thêm:

```tsx
  // Cửa hàng đang chọn có thể vừa bị đổi tên/xoá ở thẻ "Giá thị trường hôm nay" ngay phía trên trong
  // lúc form còn mở (hook chỉ đổi tên ở các lần mua ĐÃ lưu) — chỉ coi là đã chọn khi tên đó vẫn còn
  // trong danh sách, để không lưu lần mua trỏ vào cửa hàng không tồn tại.
  const selectedStore = stores.some((s) => s.name === store) ? store : ""
```

Thay

```tsx
        <GoldStorePicker stores={stores} selected={store} onSelect={setStore} />
```

bằng

```tsx
        <GoldStorePicker stores={stores} selected={selectedStore} onSelect={setStore} />
```

Trong điều kiện `disabled` của nút Thêm, đổi `!store` (cuối biểu thức) thành `!selectedStore`, và trong `onAdd({...})` đổi dòng

```tsx
              store,
```

thành

```tsx
              store: selectedStore,
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/components/add-gold-form.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx`
Expected: PASS toàn bộ (kể cả "keeps the add-purchase Thêm button disabled until a store is picked" sẵn có)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.5** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/finance/components/add-gold-form.tsx src/features/finance/__tests__/components/add-gold-form.test.tsx
git commit -m "fix: forget a picked gold store once it is renamed or deleted"
```

---

### Task 6: Cửa hàng chưa nhập giá tạm tính theo giá mua; câu lãi/lỗ vàng trung tính khi chưa có vàng hoặc hoà vốn (Quyết định 1)

**Files:**
- Modify: `src/features/finance/finance-calculations.ts` (2 hàm mới sau `goldStorePrice`; `summarizeGoldByStore`, `summarizeFinance` dùng hàm mới; khối export)
- Modify: `src/features/finance/components/gold-tab.tsx` (import, `goldPLText`, `unpriced`, `purchasePLs`, khối `<Figure>` + đoạn chữ trong Card "Lãi / lỗ theo giá thị trường")
- Modify: `src/features/finance/components/gold-transactions-table.tsx`, `src/features/finance/components/gold-transactions-cards.tsx` (import, dòng `const price = ...`)
- Test: `src/features/finance/__tests__/finance-calculations.test.ts`, `src/features/finance/__tests__/components/gold-tab.test.tsx`

**Interfaces:**
- Consumes: `goldStorePrice(stores, storeName): number` (giữ nguyên — vẫn trả 0 khi không có giá/không có cửa hàng); biến `goldPLText` + prop `fitChars` của Plan 5 trong `GoldTab`.
- Produces: `goldMarketPrice(stores: GoldStore[], purchase: GoldPurchase): number` — giá hôm nay của cửa hàng của lần mua; cửa hàng chưa có giá (ô trống/0) hoặc tên không còn trong danh sách → `purchase.buy`. `unpricedGoldStores(gold: GoldPurchase[], stores: GoldStore[]): string[]` — tên các cửa hàng (không trùng, theo thứ tự lần mua) có vàng đang được tạm tính như vậy. Mọi chỗ định giá 1 lần mua (`summarizeFinance`, `summarizeGoldByStore`, `GoldTab`, `GoldTransactionsTable`, `GoldTransactionsCards`) dùng `goldMarketPrice`. `goldReferencePricePerPhan` của Plan 2 tự đúng theo (chỉ đọc `goldValue`/`goldPhan`). `GoldTab`: `goldPL === 0` → số hiện "0 ₫" màu thường, không có ▲/▼ và %; câu chữ theo 4 nhánh (chưa có vàng / lãi / lỗ / hoà vốn); có thêm 1 dòng nhắc nhập giá khi `unpriced.length > 0`.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/finance/__tests__/finance-calculations.test.ts`, thêm `goldMarketPrice,` và `unpricedGoldStores,` vào khối import từ `"../finance-calculations"` (ngay sau `goldStorePrice,`). Rồi thêm vào cuối file:

```ts
describe("goldMarketPrice", () => {
  const purchase = { id: 1, date: "10/08/2026", phan: 10, buy: 8_000_000, store: "SJC" }

  it("uses the store's price today when it has one", () => {
    expect(goldMarketPrice([{ name: "SJC", price: "8.500.000" }], purchase)).toBe(8_500_000)
  })

  it("falls back to the purchase's own buy price while the store has no price yet", () => {
    expect(goldMarketPrice([{ name: "SJC", price: "" }], purchase)).toBe(8_000_000)
  })

  it("falls back to the buy price when the store no longer exists", () => {
    expect(goldMarketPrice([], purchase)).toBe(8_000_000)
  })
})

describe("unpricedGoldStores", () => {
  it("lists each store without a price once, and only stores that hold gold", () => {
    const gold = [
      { id: 1, date: "01/08/2026", phan: 10, buy: 8_000_000, store: "SJC" },
      { id: 2, date: "02/08/2026", phan: 5, buy: 8_100_000, store: "SJC" },
      { id: 3, date: "03/08/2026", phan: 5, buy: 8_000_000, store: "PNJ" },
    ]
    const stores = [
      { name: "SJC", price: "" },
      { name: "PNJ", price: "8.200.000" },
      { name: "DOJI", price: "" },
    ]

    expect(unpricedGoldStores(gold, stores)).toEqual(["SJC"])
  })
})

describe("summarizeFinance — cửa hàng chưa nhập giá", () => {
  it("values gold from a store without a price at cost, so net worth does not drop by the whole holding", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      gold: [{ id: 1, date: "10/08/2026", phan: 10, buy: 8_000_000, store: "SJC" }],
      goldStores: [{ name: "SJC", price: "" }],
    }

    const summary = summarizeFinance(state)

    expect(summary.goldValue).toBe(80_000_000)
    expect(summary.goldPL).toBe(0)
    expect(summary.goldPct).toBe(0)
    expect(summary.net).toBe(80_000_000)
  })
})
```

1.2. Trong `src/features/finance/__tests__/components/gold-tab.test.tsx`:

- Đổi dòng import

```tsx
import { phanToChi, pct1, type FinanceSummary } from "../../finance-calculations"
```

thành

```tsx
import { phanToChi, pct1, summarizeFinance, type FinanceSummary } from "../../finance-calculations"
import { DEFAULT_FINANCE_STATE } from "../../finance-storage"
```

- Thay nguyên test `"shows zeroed-out P&L, stats and the empty transactions state when there is no gold"` (test đầu tiên của file — nó đang khoá câu sai "lãi 0 ₫ … nhờ giá vàng tăng") bằng:

```tsx
  it("shows a neutral P&L, zeroed stats and the empty transactions state when there is no gold", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[]} gold={[]} {...noopHandlers} />)

    // Đang giữ (raw phân) và Quy đổi (phanToChi) đều hiện "0 phân" khi chưa có gì
    expect(screen.getAllByText("0 phân")).toHaveLength(2)
    // Chưa có vàng thì không có lãi/lỗ để báo — không "lãi 0 ₫ … nhờ giá vàng tăng", không "▲ +0,0%".
    expect(screen.getByText("Chưa có vàng nào — thêm lần mua đầu tiên để theo dõi lãi/lỗ.")).toBeInTheDocument()
    expect(screen.queryByText(/nhờ giá vàng tăng/)).not.toBeInTheDocument()
    expect(screen.queryByText(pct1(0), { exact: false })).not.toBeInTheDocument()
    // Thông báo rỗng hiện ở cả GoldTransactionsTable và GoldTransactionsCards (song song trong DOM,
    // chỉ ẩn/hiện qua CSS theo breakpoint), nên xuất hiện 2 lần.
    expect(
      screen.getAllByText("Chưa có giao dịch vàng nào. Thêm lần mua đầu tiên để bắt đầu theo dõi lãi/lỗ.")
    ).toHaveLength(2)
  })
```

- Thêm vào cuối `describe("GoldTab", ...)`:

```tsx
  it("says the price equals the cost, with no ▲ and no 'nhờ giá vàng tăng', at break-even", () => {
    const BREAK_EVEN: FinanceSummary = { ...ZERO_SUMMARY, goldPhan: 10, goldCost: 8_000_000, goldValue: 8_000_000 }
    render(<GoldTab summary={BREAK_EVEN} stores={[SJC]} gold={[]} {...noopHandlers} />)

    expect(screen.getByText("Giá hiện tại đang bằng giá vốn — chưa lãi cũng chưa lỗ.")).toBeInTheDocument()
    expect(screen.queryByText(`+ ${formatMoney(0)}`)).not.toBeInTheDocument()
    expect(screen.queryByText(pct1(0), { exact: false })).not.toBeInTheDocument()
  })

  it("values gold from a store with no price yet at its buy price and says so, instead of a full loss", () => {
    const stores: GoldStore[] = [{ name: "SJC", price: "" }]
    const gold = [{ id: 1, date: "10/08/2026", phan: 10, buy: 8_000_000, store: "SJC" }]
    const summary = summarizeFinance({ ...DEFAULT_FINANCE_STATE, gold, goldStores: stores })
    render(<GoldTab summary={summary} stores={stores} gold={gold} {...noopHandlers} />)

    expect(
      screen.getByText("Chưa nhập giá hôm nay cho SJC — vàng mua ở đó đang tạm tính theo giá mua.")
    ).toBeInTheDocument()
    expect(screen.getByText("Giá hiện tại đang bằng giá vốn — chưa lãi cũng chưa lỗ.")).toBeInTheDocument()
    expect(screen.queryByText(/do giá vàng giảm/)).not.toBeInTheDocument()
    // Cột "Giá hiện tại" (thứ 6) của lần mua trong bảng giao dịch bằng giá vốn, không phải 0 ₫.
    const table = document.querySelector("table") as HTMLTableElement
    const cells = table.querySelectorAll("tbody tr")[0].querySelectorAll("td")
    expect(cells[5]).toHaveTextContent(formatMoney(80_000_000))
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/gold-tab.test.tsx`
Expected: FAIL 8 test — 3 test `goldMarketPrice` và 1 test `unpricedGoldStores` (`TypeError: ... is not a function`); "values gold from a store without a price at cost…" (`expected 0 to be 80000000`); 3 test `GoldTab` (`Unable to find an element with the text: Chưa có vàng nào — …` / `… Giá hiện tại đang bằng giá vốn — …` / `… Chưa nhập giá hôm nay cho SJC — …`). Mọi test cũ khác vẫn PASS.

- [ ] **Step 3: Thêm `goldMarketPrice`/`unpricedGoldStores` và dùng ở 2 hàm tổng hợp**

3.1. Trong `src/features/finance/finance-calculations.ts`, thêm ngay sau hàm `goldStorePrice`:

```ts

// Giá hôm nay để định giá 1 lần mua: giá của chính cửa hàng đó. Cửa hàng chưa nhập giá (ô trống/0)
// hoặc tên không còn trong danh sách thì tạm tính theo giá mua của lần mua — "chưa biết giá thì coi
// như hoà vốn" — thay vì định giá 0 rồi báo lỗ trọn giá vốn và kéo tụt tài sản ròng.
function goldMarketPrice(stores: GoldStore[], purchase: GoldPurchase): number {
  const price = goldStorePrice(stores, purchase.store)
  return price > 0 ? price : purchase.buy
}

// Tên các cửa hàng (không trùng, theo thứ tự lần mua) có vàng đang được tạm tính theo giá mua vì
// chưa có giá hôm nay — GoldTab nhắc người dùng nhập giá cho đúng những cửa hàng này.
function unpricedGoldStores(gold: GoldPurchase[], stores: GoldStore[]): string[] {
  const names = gold
    .filter((purchase) => goldStorePrice(stores, purchase.store) <= 0)
    .map((purchase) => purchase.store)
  return Array.from(new Set(names))
}
```

3.2. Trong `summarizeGoldByStore`, thay dòng

```ts
    const price = goldStorePrice(stores, purchase.store)
```

bằng

```ts
    const price = goldMarketPrice(stores, purchase)
```

3.3. Trong `summarizeFinance`, thay dòng

```ts
    (sum, purchase) => sum + purchase.phan * goldStorePrice(state.goldStores, purchase.store),
```

bằng

```ts
    (sum, purchase) => sum + purchase.phan * goldMarketPrice(state.goldStores, purchase),
```

3.4. Trong khối `export { ... }` cuối file, thêm `goldMarketPrice,` ngay sau `goldStorePrice,` và `unpricedGoldStores,` ngay sau `summarizeGoldByStore,`.

- [ ] **Step 4: Bảng và thẻ giao dịch dùng `goldMarketPrice`**

Trong cả `src/features/finance/components/gold-transactions-table.tsx` và `src/features/finance/components/gold-transactions-cards.tsx`, đổi

```tsx
import { goldPurchasePL, goldStorePrice, phanToChi } from "../finance-calculations"
```

thành

```tsx
import { goldMarketPrice, goldPurchasePL, phanToChi } from "../finance-calculations"
```

và thay dòng

```tsx
        const price = goldStorePrice(stores, purchase.store)
```

(trong bảng nằm thụt sâu hơn 1 cấp: `            const price = ...`) bằng

```tsx
        const price = goldMarketPrice(stores, purchase)
```

(giữ đúng mức thụt sẵn có của từng file).

- [ ] **Step 5: `GoldTab` — định giá, câu chữ trung tính và dòng nhắc nhập giá**

5.1. Trong `src/features/finance/components/gold-tab.tsx`, thay khối import

```tsx
import {
  goldPurchasePL,
  goldStorePrice,
  pct1,
  phanToChi,
  signedMoney,
  sortGoldByDate,
  summarizeGoldByStore,
  type FinanceSummary,
  type GoldStoreSummary,
} from "../finance-calculations"
```

bằng

```tsx
import {
  goldMarketPrice,
  goldPurchasePL,
  pct1,
  phanToChi,
  signedMoney,
  sortGoldByDate,
  summarizeGoldByStore,
  unpricedGoldStores,
  type FinanceSummary,
  type GoldStoreSummary,
} from "../finance-calculations"
```

5.2. Thay dòng (của Plan 5)

```tsx
  const goldPLText = signedMoney(goldPL, hidden)
```

bằng

```tsx
  // Hoà vốn (hay chưa có vàng) thì hiện "0 ₫" trơn — "+ 0 ₫" màu xanh là báo lãi không có thật.
  const goldPLText = goldPL === 0 ? formatMoney(0, hidden) : signedMoney(goldPL, hidden)
  const unpriced = unpricedGoldStores(gold, stores)
```

5.3. Thay dòng

```tsx
  const purchasePLs = gold.map((p) => goldPurchasePL(p, goldStorePrice(stores, p.store)))
```

bằng

```tsx
  const purchasePLs = gold.map((p) => goldPurchasePL(p, goldMarketPrice(stores, p)))
```

5.4. Trong Card "Lãi / lỗ theo giá thị trường", thay toàn bộ khối từ `<Figure` tới hết `</p>` của đoạn "Bạn đang lãi … / Bạn đang lỗ …" (khối đang có `fitChars={goldPLText.length}`, `delta={pct1(goldPct)}` và câu chọn giữa "Bạn đang lãi …" / "Bạn đang lỗ …" theo `gain`) bằng:

```tsx
            <Figure
              value={
                <span
                  style={{
                    color:
                      goldPL > 0
                        ? "var(--ob-color-income)"
                        : goldPL < 0
                          ? "var(--ob-color-expense)"
                          : undefined,
                  }}
                >
                  {goldPLText}
                </span>
              }
              fitChars={goldPLText.length}
              // Hoà vốn (hay chưa có vàng) thì không có ▲/▼: "▲ +0,0%" là báo lãi không có thật.
              delta={goldPL !== 0 ? pct1(goldPct) : undefined}
              direction={gain ? "up" : "down"}
            />
            <p className="mt-[10px] max-w-[28ch] text-[13.5px] leading-[1.5] text-[var(--ob-color-text-muted)]">
              {goldPhan === 0
                ? "Chưa có vàng nào — thêm lần mua đầu tiên để theo dõi lãi/lỗ."
                : goldPL > 0
                  ? `Bạn đang lãi ${formatMoney(goldPL, hidden)} so với giá vốn nhờ giá vàng tăng.`
                  : goldPL < 0
                    ? `Bạn đang lỗ ${formatMoney(Math.abs(goldPL), hidden)} so với giá vốn do giá vàng giảm.`
                    : "Giá hiện tại đang bằng giá vốn — chưa lãi cũng chưa lỗ."}
            </p>
            {unpriced.length ? (
              <p className="mt-2 max-w-[28ch] text-[12.5px] leading-[1.5] text-[var(--ob-color-text-subtle)]">
                {`Chưa nhập giá hôm nay cho ${unpriced.join(", ")} — vàng mua ở đó đang tạm tính theo giá mua.`}
              </p>
            ) : null}
```

(`gain` vẫn dùng cho `direction` — chỉ có tác dụng khi `delta` hiện, tức `goldPL !== 0`.)

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/gold-transactions-table.test.tsx src/features/finance/__tests__/components/gold-transactions-cards.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx src/features/goals/__tests__/components/goals-view.test.tsx`
Expected: PASS toàn bộ (kể cả test lãi `"+ ${formatMoney(800_000)}"`, test `fitChars` 17 ký tự của Plan 5, test `goldReferencePricePerPhan` của Plan 2 và "sums to the same totals summarizeFinance computes…")

- [ ] **Step 7: Commit**

Tự review `git diff` của task rồi commit (mục **A.6** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/finance/finance-calculations.ts src/features/finance/components/gold-tab.tsx src/features/finance/components/gold-transactions-table.tsx src/features/finance/components/gold-transactions-cards.tsx src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/gold-tab.test.tsx
git commit -m "fix: value gold from an unpriced store at cost and word a zero gold P&L neutrally"
```

---

### Task 7: Ngày mua vàng phải là 1 ngày có thật, lưu chuẩn `dd/mm/yyyy` (Quyết định 2)

**Files:**
- Modify: `src/features/finance/finance-calculations.ts` (hàm mới `normalizeGoldDate`, `parseGoldDate` dùng nó, khối export)
- Modify: `src/features/finance/components/add-gold-form.tsx` (import, `normalizedDate`/`dateInvalid`, Field "Ngày mua", nút Thêm)
- Modify: `src/features/finance/components/edit-gold-purchase-modal.tsx` (import, `normalizedDate`/`dateInvalid`, `disabled`, `handleSave`, Field "Ngày mua")
- Test: `src/features/finance/__tests__/finance-calculations.test.ts`, `src/features/finance/__tests__/components/add-gold-form.test.tsx`, `src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx`

**Interfaces:**
- Consumes: `selectedStore` (Task 5), `phanValid` (Plan 1b) trong `AddGoldForm`; helper `openForm`/`fillValidPurchase` + hằng `SJX` trong `add-gold-form.test.tsx` (Task 5).
- Produces: `normalizeGoldDate(input: string): string | null` — nhận `d/m/yyyy` hoặc `dd/mm/yyyy` ngăn bằng `/`, `-` hoặc `.` (cùng 1 loại dấu trong 1 ngày), và `yyyy-mm-dd`; năm đủ 4 chữ số; ngày phải có thật (31/02 → null); bỏ khoảng trắng 2 đầu; trả dạng chuẩn `dd/mm/yyyy`. `parseGoldDate` đi qua nó (ngày đọc không được → 0, như cũ). 2 form: ngày không đọc được → `Field invalid` + hint `Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026`, nút khoá; ô trống chỉ khoá nút (không đỏ); lưu `normalizedDate`. Lần mua cũ đã lưu sai dạng: mở "Sửa" thấy ô đỏ ngay, phải sửa ngày mới lưu được. Task 8 sửa tiếp 2 form này.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/finance/__tests__/finance-calculations.test.ts`, thêm `normalizeGoldDate,` vào khối import từ `"../finance-calculations"` (ngay sau `parseGoldDate,`). Thêm vào cuối `describe("parseGoldDate", ...)`:

```ts
  it("sorts other ways of writing the same day exactly like dd/mm/yyyy", () => {
    const expected = parseGoldDate("10/08/2026")
    expect(parseGoldDate("10-08-2026")).toBe(expected)
    expect(parseGoldDate("10.08.2026")).toBe(expected)
    expect(parseGoldDate("2026-08-10")).toBe(expected)
  })

  it("does not turn a 2-digit year into the 1900s or roll 31/02 over into March", () => {
    expect(parseGoldDate("10/08/26")).toBe(0)
    expect(parseGoldDate("31/02/2026")).toBe(0)
  })
```

rồi thêm vào cuối file:

```ts
describe("normalizeGoldDate", () => {
  it("keeps a dd/mm/yyyy date as is", () => {
    expect(normalizeGoldDate("10/08/2026")).toBe("10/08/2026")
  })

  it("accepts 1-digit day/month and '-' or '.' separators, trims spaces and pads to dd/mm/yyyy", () => {
    expect(normalizeGoldDate("1/8/2026")).toBe("01/08/2026")
    expect(normalizeGoldDate("10-08-2026")).toBe("10/08/2026")
    expect(normalizeGoldDate(" 10.08.2026 ")).toBe("10/08/2026")
  })

  it("accepts an ISO yyyy-mm-dd date", () => {
    expect(normalizeGoldDate("2026-08-10")).toBe("10/08/2026")
  })

  it("rejects a 2-digit year, a day that does not exist, mixed separators and free text", () => {
    expect(normalizeGoldDate("10/08/26")).toBeNull()
    expect(normalizeGoldDate("31/02/2026")).toBeNull()
    expect(normalizeGoldDate("10/08-2026")).toBeNull()
    expect(normalizeGoldDate("hôm qua")).toBeNull()
    expect(normalizeGoldDate("")).toBeNull()
  })
})
```

1.2. Thêm vào cuối `src/features/finance/__tests__/components/add-gold-form.test.tsx`:

```tsx
describe("AddGoldForm — ngày mua", () => {
  it("accepts another way of writing a real date and saves it as dd/mm/yyyy", () => {
    const onAdd = vi.fn()
    render(<AddGoldForm stores={[SJX]} onAdd={onAdd} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "2026-08-10" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAdd).toHaveBeenCalledWith({ date: "10/08/2026", phan: 10, buy: 900_000, store: "SJX" })
  })

  it("explains the expected format and blocks Thêm for a 2-digit year or a day that does not exist", () => {
    render(<AddGoldForm stores={[SJX]} onAdd={vi.fn()} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "10/08/26" } })
    expect(screen.getByText("Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "31/02/2026" } })
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
  })
})
```

1.3. Thêm vào cuối `describe("EditGoldPurchaseModal", ...)` trong `src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx` (`PURCHASE`, `STORES` có sẵn):

```tsx
  it("flags a purchase saved earlier with an unreadable date and only saves once the date is fixed", () => {
    const onSave = vi.fn()
    render(
      <EditGoldPurchaseModal purchase={{ ...PURCHASE, date: "10/08/26" }} stores={STORES} onOpenChange={vi.fn()} onSave={onSave} />
    )

    expect(screen.getByText("Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "10-08-2026" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(1, { date: "10/08/2026", phan: PURCHASE.phan, buy: PURCHASE.buy, store: "PNJ" })
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/add-gold-form.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx`
Expected: FAIL 9 test — 2 test mới của `parseGoldDate` (`expected 0 to be 1786…` / `expected -1369… to be 0` vì "10/08/26" thành năm 1926); 4 test `normalizeGoldDate` (`TypeError: normalizeGoldDate is not a function`); "accepts another way of writing a real date…" (`date: "2026-08-10"` thay vì `"10/08/2026"`); "explains the expected format…" (`Unable to find an element with the text: Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026`); test mới của modal (cùng lỗi không tìm thấy hint). Mọi test cũ vẫn PASS.

- [ ] **Step 3: `normalizeGoldDate` + `parseGoldDate` dùng nó**

Trong `src/features/finance/finance-calculations.ts`, thay hàm

```ts
function parseGoldDate(date: string): number {
  const [day, month, year] = date.split("/").map(Number)
  if (!day || !month || !year) return 0
  return new Date(year, month - 1, day).getTime()
}
```

bằng

```ts
// Ngày mua vàng là ô chữ: nhận d/m/yyyy hoặc dd/mm/yyyy (ngăn bằng "/", "-" hoặc ".", cùng 1 loại
// trong 1 ngày) và yyyy-mm-dd; năm đủ 4 chữ số (new Date(26, …) là năm 1926); ngày phải có thật
// (new Date tự trôi 31/02 sang 03/03). Trả dạng chuẩn dd/mm/yyyy, hoặc null nếu không đọc được.
function normalizeGoldDate(input: string): string | null {
  const text = input.trim()
  const dmy = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/.exec(text)
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  const parts = dmy ? [dmy[1], dmy[3], dmy[4]] : ymd ? [ymd[3], ymd[2], ymd[1]] : null
  if (!parts) return null
  const [day, month, year] = parts.map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
}

function parseGoldDate(date: string): number {
  const normalized = normalizeGoldDate(date)
  if (!normalized) return 0
  const [day, month, year] = normalized.split("/").map(Number)
  return new Date(year, month - 1, day).getTime()
}
```

Trong khối `export { ... }` cuối file, thêm `normalizeGoldDate,` ngay trước `parseGoldDate,`.

- [ ] **Step 4: `AddGoldForm` kiểm ngày và lưu dạng chuẩn**

4.1. Trong `src/features/finance/components/add-gold-form.tsx`, thêm dòng import ngay sau `import { Field } from "@/components/ui/field"`:

```tsx
import { normalizeGoldDate } from "../finance-calculations"
```

4.2. Ngay sau dòng `const selectedStore = ...` (Task 5), thêm:

```tsx
  const normalizedDate = normalizeGoldDate(date)
  // Ô trống chỉ khoá nút; gõ rồi mà không đọc ra 1 ngày có thật thì báo đỏ.
  const dateInvalid = date.trim() !== "" && normalizedDate === null
```

4.3. Field "Ngày mua" (có `label="Ngày mua"`) thêm 2 prop ngay sau `onChange={(e) => setDate(e.target.value)}`:

```tsx
          invalid={dateInvalid}
          hint={dateInvalid ? "Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026" : undefined}
```

4.4. Ở nút Thêm, thay

```tsx
          disabled={!date.trim() || !phanValid || !buy.trim() || !selectedStore}
          onClick={() => {
            onAdd({
              date: date.trim(),
```

bằng

```tsx
          disabled={!normalizedDate || !phanValid || !buy.trim() || !selectedStore}
          onClick={() => {
            if (!normalizedDate) return
            onAdd({
              date: normalizedDate,
```

- [ ] **Step 5: `EditGoldPurchaseModal` kiểm ngày và lưu dạng chuẩn**

5.1. Trong `src/features/finance/components/edit-gold-purchase-modal.tsx`, thêm dòng import ngay sau `import { Modal } from "@/components/ui/modal"`:

```tsx
import { normalizeGoldDate } from "../finance-calculations"
```

5.2. Ngay sau dòng `const currentId = purchase.id`, thêm:

```tsx
  const normalizedDate = normalizeGoldDate(date)
  // Lần mua cũ đã lưu sai dạng (vd. "10/08/26") hiện đỏ ngay khi mở — phải sửa ngày mới lưu được.
  const dateInvalid = date.trim() !== "" && normalizedDate === null
```

5.3. Trong dòng `const disabled = ...` (bản của Plan 1b, đứng sau `phanValid`), đổi `!date.trim()` (đầu biểu thức) thành `!normalizedDate`.

5.4. Thay

```tsx
  function handleSave() {
    onSave(currentId, {
      date: date.trim(),
```

bằng

```tsx
  function handleSave() {
    if (!normalizedDate) return
    onSave(currentId, {
      date: normalizedDate,
```

5.5. Field "Ngày mua" thêm 2 prop ngay sau `onChange={(e) => setDate(e.target.value)}`:

```tsx
          invalid={dateInvalid}
          hint={dateInvalid ? "Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026" : undefined}
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/add-gold-form.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx`
Expected: PASS toàn bộ (kể cả "disables Lưu while date, phan, buy or store is empty": ô ngày rỗng → `normalizedDate` null → khoá, không đỏ)

- [ ] **Step 7: Commit**

Tự review `git diff` của task rồi commit (mục **A.7** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/finance/finance-calculations.ts src/features/finance/components/add-gold-form.tsx src/features/finance/components/edit-gold-purchase-modal.tsx src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/add-gold-form.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx
git commit -m "fix: accept only real gold purchase dates and store them as dd/mm/yyyy"
```

---

### Task 8: Khối lượng vàng chỉ nhận phân nguyên; số phân lẻ cũ hiện gọn (Quyết định 3)

**Files:**
- Modify: `src/features/finance/finance-calculations.ts` (hàm mới `formatPhan`, viết lại `phanToChi`, khối export)
- Modify: `src/features/finance/components/add-gold-form.tsx`, `src/features/finance/components/edit-gold-purchase-modal.tsx` (`phanValid` của Plan 1b, biến mới `phanInvalid`, Field "Khối lượng (phân)")
- Modify: `src/features/finance/components/gold-tab.tsx` (import, ô "Đang giữ"), `src/features/finance/components/finance-view.tsx` (import, hint trụ "Tích lũy vàng")
- Modify: `src/features/overview/components/finance-summary-section.tsx` (import, hint ô "Vàng")
- Modify: `src/features/goals/get-goals.ts` (import, hàm `formatChi` — bản Plan 2 vẫn giữ nguyên hàm này)
- Test: `src/features/finance/__tests__/finance-calculations.test.ts`, `src/features/finance/__tests__/components/add-gold-form.test.tsx`, `src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx`, `src/features/finance/__tests__/components/gold-tab.test.tsx`, `src/features/goals/__tests__/get-goals.test.ts`, `src/features/overview/__tests__/components/finance-summary-section.test.tsx`

**Interfaces:**
- Consumes: `phanValid` của Plan 1b ở 2 form (Task 8 chỉ siết `Number.isFinite` thành `Number.isInteger` — `Number.isInteger(Infinity)` là `false` nên "1e400" vẫn bị chặn); helper `openForm`/`fillValidPurchase` + `SJX` trong `add-gold-form.test.tsx` (Task 5).
- Produces: `formatPhan(phan: number): string` — làm tròn 1 chữ số lẻ, định dạng vi-VN (`30` → `"30"`, `0.1 + 0.2` → `"0,3"`). `phanToChi` làm tròn tới 0,1 phân trước khi tách chỉ/phân (`12.3` → `"1 chỉ 2,3 phân"`, `9.96` → `"1 chỉ"`); `formatChi` của `get-goals.ts` cũng vậy (vẫn giữ tiền tố "0 chỉ" như cũ). Mọi chỗ in `goldPhan` thô ("Đang giữ" ở tab vàng, hint trụ "Tích lũy vàng", hint ô "Vàng" ở Tổng quan) đi qua `formatPhan`. 2 form: số lẻ/âm/0/"1,5" → `Field invalid` + hint `Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)`, nút khoá; ô trống chỉ khoá nút, hint thường vẫn là `10 phân = 1 chỉ`.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/finance/__tests__/finance-calculations.test.ts`, thêm `formatPhan,` vào khối import từ `"../finance-calculations"` (ngay sau `phanToChi,`). Thêm vào cuối `describe("phanToChi", ...)`:

```ts
  it("rounds a fractional phân left over from old data to 1 decimal with a comma, not floating-point noise", () => {
    expect(phanToChi(12.3)).toBe("1 chỉ 2,3 phân")
    expect(phanToChi(0.1 + 0.2)).toBe("0,3 phân")
  })

  it("carries a value that rounds up to 10 phân into a whole chỉ", () => {
    expect(phanToChi(9.96)).toBe("1 chỉ")
  })
```

rồi thêm vào cuối file:

```ts
describe("formatPhan", () => {
  it("prints whole phân as is and rounds a fractional one to 1 decimal with a comma", () => {
    expect(formatPhan(30)).toBe("30")
    expect(formatPhan(0.1 + 0.2)).toBe("0,3")
    expect(formatPhan(12.34)).toBe("12,3")
  })
})
```

1.2. Thêm vào cuối `src/features/finance/__tests__/components/add-gold-form.test.tsx`:

```tsx
describe("AddGoldForm — khối lượng", () => {
  it("explains and blocks a fractional or comma-decimal khối lượng instead of silently disabling Thêm", () => {
    render(<AddGoldForm stores={[SJX]} onAdd={vi.fn()} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()
    expect(screen.getByText("10 phân = 1 chỉ")).toBeInTheDocument()

    for (const value of ["12.3", "1,5"]) {
      fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), { target: { value } })
      expect(screen.getByText("Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    }
  })
})
```

1.3. Thêm vào cuối `describe("EditGoldPurchaseModal", ...)` trong `src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx`:

```tsx
  it("disables Lưu and explains why for a fractional khối lượng", () => {
    render(<EditGoldPurchaseModal purchase={PURCHASE} stores={STORES} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Khối lượng", { exact: false }), { target: { value: "2.5" } })

    expect(screen.getByText("Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
```

1.4. Thêm vào cuối `describe("GoldTab", ...)` trong `src/features/finance/__tests__/components/gold-tab.test.tsx`:

```tsx
  it("shows a fractional holding left over from old data rounded to 1 decimal, without floating-point noise", () => {
    render(<GoldTab summary={{ ...ZERO_SUMMARY, goldPhan: 0.1 + 0.2 }} stores={[]} gold={[]} {...noopHandlers} />)

    // Đang giữ (formatPhan) và Quy đổi (phanToChi) đều hiện "0,3 phân".
    expect(screen.getAllByText("0,3 phân")).toHaveLength(2)
  })
```

1.5. Thêm vào cuối `describe("formatChi", ...)` trong `src/features/goals/__tests__/get-goals.test.ts`:

```ts
  it("rounds a fractional phân left over from old data instead of printing floating-point noise", () => {
    expect(formatChi(12.3)).toBe("1 chỉ 2,3 phân")
  })
```

1.6. Thêm vào cuối `describe("FinanceSummarySection", ...)` trong `src/features/overview/__tests__/components/finance-summary-section.test.tsx`:

```tsx
  it("rounds a fractional gold holding left over from old data in the Vàng hint", () => {
    render(
      <FinanceSummarySection
        savings={[]}
        cards={[]}
        invests={[]}
        summary={{ ...ZERO_SUMMARY, goldPhan: 0.1 + 0.2, goldValue: 300_000 }}
      />
    )

    expect(screen.getByText("0,3 phân", { exact: false })).toBeInTheDocument()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/add-gold-form.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/features/goals/__tests__/get-goals.test.ts src/features/overview/__tests__/components/finance-summary-section.test.tsx`
Expected: FAIL 8 test — 2 test mới của `phanToChi` (`expected '1 chỉ 2.3000000000000007 phân' to be '1 chỉ 2,3 phân'`, `expected '9.96 phân' to be '1 chỉ'`); `formatPhan` (`TypeError: formatPhan is not a function`); 2 test form (`Unable to find an element with the text: Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)`); `GoldTab` và `FinanceSummarySection` (`Unable to find an element with the text: 0,3 phân` — đang hiện "0.30000000000000004 phân"); `formatChi` (`expected '1 chỉ 2.3000000000000007 phân' …`). Mọi test cũ vẫn PASS (kể cả 2 test "1e400"/"Infinity" của Plan 1b).

- [ ] **Step 3: `formatPhan` + `phanToChi` làm tròn**

Trong `src/features/finance/finance-calculations.ts`, thay hàm

```ts
function phanToChi(phan: number): string {
  const chi = Math.floor(phan / 10)
  const rest = phan % 10
  if (chi === 0) return `${rest} phân`
  return `${chi} chỉ${rest ? ` ${rest} phân` : ""}`
}
```

bằng

```ts
// Khối lượng vàng lưu theo phân (10 phân = 1 chỉ). Form chỉ nhận phân nguyên, nhưng dữ liệu cũ có thể
// có số lẻ (12.3, hay tổng 0.1 + 0.2 = 0.30000000000000004): làm tròn 1 chữ số lẻ, dấu phẩy kiểu Việt.
function formatPhan(phan: number): string {
  return (Math.round(phan * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 })
}

function phanToChi(phan: number): string {
  // Làm tròn tới 0,1 phân TRƯỚC khi tách chỉ/phân — 9,96 phân thành "1 chỉ", không phải "10 phân".
  const tenths = Math.round(phan * 10)
  const chi = Math.floor(tenths / 100)
  const rest = (tenths % 100) / 10
  if (chi === 0) return `${formatPhan(rest)} phân`
  return `${chi} chỉ${rest ? ` ${formatPhan(rest)} phân` : ""}`
}
```

Trong khối `export { ... }` cuối file, thêm `formatPhan,` ngay trước `phanToChi,`.

- [ ] **Step 4: 2 form chỉ nhận phân nguyên**

4.1. Trong CẢ `src/features/finance/components/add-gold-form.tsx` và `src/features/finance/components/edit-gold-purchase-modal.tsx`, thay khối của Plan 1b

```tsx
  // Number("1e400") = Infinity vẫn > 0, nhưng JSON.stringify lưu nó thành null và lần đọc sau purchase
  // bị bỏ — chỉ nhận số hữu hạn.
  const phanValid = Number.isFinite(Number(phan)) && Number(phan) > 0
```

bằng

```tsx
  // Chỉ nhận phân nguyên dương: giá cửa hàng tính theo phân, số lẻ thì hiện nhiễu số thực ("1 chỉ
  // 2.3000000000000007 phân"), còn "1,5" (dấu phẩy) là NaN. Number.isInteger(Infinity) = false nên
  // "1e400" vẫn bị chặn như trước (JSON.stringify lưu Infinity thành null, lần đọc sau purchase bị bỏ).
  const phanValid = Number.isInteger(Number(phan)) && Number(phan) > 0
  const phanInvalid = phan.trim() !== "" && !phanValid
```

4.2. Ở CẢ 2 file, Field "Khối lượng (phân)" thay dòng

```tsx
          hint="10 phân = 1 chỉ"
```

bằng

```tsx
          invalid={phanInvalid}
          hint={phanInvalid ? "Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)" : "10 phân = 1 chỉ"}
```

- [ ] **Step 5: Mọi chỗ in số phân đi qua `formatPhan`/bản làm tròn**

5.1. `src/features/finance/components/gold-tab.tsx` — trong khối import từ `"../finance-calculations"` thêm `formatPhan,` ngay trước `goldMarketPrice,`; trong mảng `stats` thay

```tsx
    ["Đang giữ", `${goldPhan} phân`],
```

bằng

```tsx
    ["Đang giữ", `${formatPhan(goldPhan)} phân`],
```

5.2. `src/features/finance/components/finance-view.tsx` — đổi

```tsx
import { pct1, summarizeFinance } from "../finance-calculations"
```

thành

```tsx
import { formatPhan, pct1, summarizeFinance } from "../finance-calculations"
```

và ở `PillarCard` "Tích lũy vàng" thay

```tsx
          hint={`${summary.goldPhan} phân · ${pct1(summary.goldPct)}`}
```

bằng

```tsx
          hint={`${formatPhan(summary.goldPhan)} phân · ${pct1(summary.goldPct)}`}
```

5.3. `src/features/overview/components/finance-summary-section.tsx` — đổi

```tsx
import type { FinanceSummary } from "@/features/finance/finance-calculations"
```

thành

```tsx
import { formatPhan, type FinanceSummary } from "@/features/finance/finance-calculations"
```

và trong hint của `MiniStat` "Vàng" thay

```tsx
                  {summary.goldPhan} phân ·{" "}
```

bằng

```tsx
                  {formatPhan(summary.goldPhan)} phân ·{" "}
```

5.4. `src/features/goals/get-goals.ts` — thêm dòng import ngay sau `import type { SavingsFund } from "@/features/finance/types"` (dòng Plan 2 thêm):

```ts
import { formatPhan } from "@/features/finance/finance-calculations"
```

và thay hàm

```ts
function formatChi(phan: number): string {
  const chi = Math.floor(phan / 10)
  const rest = phan % 10
  return `${chi} chỉ${rest ? ` ${rest} phân` : ""}`
}
```

bằng

```ts
function formatChi(phan: number): string {
  // Làm tròn tới 0,1 phân trước khi tách chỉ/phân — dữ liệu cũ có thể có phân lẻ (12.3 từng hiện
  // "1 chỉ 2.3000000000000007 phân"). Khác phanToChi: luôn có tiền tố "N chỉ", kể cả "0 chỉ".
  const tenths = Math.round(phan * 10)
  const chi = Math.floor(tenths / 100)
  const rest = (tenths % 100) / 10
  return `${chi} chỉ${rest ? ` ${formatPhan(rest)} phân` : ""}`
}
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/add-gold-form.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/features/finance/__tests__/components/finance-view.test.tsx src/features/finance/__tests__/components/gold-store-summary-table.test.tsx src/features/finance/__tests__/components/gold-store-summary-cards.test.tsx src/features/goals/__tests__/get-goals.test.ts src/features/goals/__tests__/components/goals-view.test.tsx src/features/overview/__tests__/components/finance-summary-section.test.tsx`
Expected: PASS toàn bộ (kể cả "Đã đạt mục tiêu 18 chỉ" của Plan 2 — `formatChi(180)` vẫn ra "18 chỉ")

- [ ] **Step 7: Commit**

Tự review `git diff` của task rồi commit (mục **A.8** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/finance/finance-calculations.ts src/features/finance/components/add-gold-form.tsx src/features/finance/components/edit-gold-purchase-modal.tsx src/features/finance/components/gold-tab.tsx src/features/finance/components/finance-view.tsx src/features/overview/components/finance-summary-section.tsx src/features/goals/get-goals.ts src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/add-gold-form.test.tsx src/features/finance/__tests__/components/edit-gold-purchase-modal.test.tsx src/features/finance/__tests__/components/gold-tab.test.tsx src/features/goals/__tests__/get-goals.test.ts src/features/overview/__tests__/components/finance-summary-section.test.tsx
git commit -m "fix: accept only whole phan for gold and round fractional phan from old data"
```

---

### Task 9: "Hạn gần nhất" là hạn của thẻ còn nợ đến hạn sớm nhất — ở Tài chính và Tổng quan (Quyết định 4)

**Files:**
- Modify: `src/features/finance/finance-calculations.ts` (3 hàm mới sau `summarizeFinance`, import type `CreditCard`, khối export)
- Modify: `src/features/finance/components/finance-view.tsx` (import, biến `nearestCard`, hint trụ "Nợ thẻ tín dụng")
- Modify: `src/features/overview/components/finance-summary-section.tsx` (import, biến `nearestCard`, hint ô "Nợ thẻ")
- Test: `src/features/finance/__tests__/finance-calculations.test.ts`, `src/features/finance/__tests__/components/finance-view.test.tsx`, `src/features/overview/__tests__/components/finance-summary-section.test.tsx`

**Interfaces:**
- Consumes: import `formatPhan` đã có ở 2 component (Task 8).
- Produces: `parseDueDay(due: string): number | null` — số đầu tiên trong ô "Ngày đến hạn" nếu nó là 1–31 ("15 hàng tháng" → 15, "05/10" → 5), không thì `null`. `nearestDueCard(cards: CreditCard[], today: Date): CreditCard | null` — chỉ xét thẻ `balance > 0`; chọn thẻ có lần đến hạn kế tiếp (tính từ `today`, hôm nay đúng hạn = 0 ngày; tháng ngắn hơn ngày hạn thì hạn rơi vào ngày cuối tháng) sớm nhất; thẻ không đọc được ngày xếp sau cùng; bằng nhau giữ thứ tự thêm thẻ; không thẻ nào còn nợ → `null`. Hàm nội bộ `daysUntilDueDay(day, today)` (không export). Trụ "Nợ thẻ tín dụng": `N thẻ · hạn gần nhất <due>` / `N thẻ · không nợ` / `Chưa có thẻ nào`. Ô "Nợ thẻ" ở Tổng quan: `hạn <due>` / `không nợ`. Chữ `due` hiện nguyên văn như người dùng đã nhập; dữ liệu đã lưu không đổi.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/finance/__tests__/finance-calculations.test.ts`, thêm `parseDueDay,` và `nearestDueCard,` vào khối import từ `"../finance-calculations"` (ngay sau `summarizeFinance,`). Thêm vào cuối file:

```ts
describe("parseDueDay", () => {
  it("reads the day of the month from the usual ways of writing a due date", () => {
    expect(parseDueDay("15")).toBe(15)
    expect(parseDueDay("15 hàng tháng")).toBe(15)
    expect(parseDueDay("05/10")).toBe(5)
    expect(parseDueDay("ngày 25")).toBe(25)
  })

  it("returns null when the first number is not a day of the month, or there is none", () => {
    expect(parseDueDay("0")).toBeNull()
    expect(parseDueDay("45")).toBeNull()
    expect(parseDueDay("cuối tháng")).toBeNull()
  })
})

describe("nearestDueCard", () => {
  // 30/09/2026
  const TODAY = new Date(2026, 8, 30)

  function card(name: string, due: string, balance: number) {
    return { name, balance, min: 0, limit: 10_000_000, due }
  }

  it("picks the card whose next due date comes first, not the first card added", () => {
    const cards = [card("Thẻ A", "25/10", 1_000_000), card("Thẻ B", "05/10", 2_000_000)]

    // A: ngày 25 đã qua trong tháng 9 → 25/10 (25 ngày nữa); B: ngày 5 → 05/10 (5 ngày nữa).
    expect(nearestDueCard(cards, TODAY)?.name).toBe("Thẻ B")
  })

  it("ignores cards that are already paid off, and returns null when none still owes", () => {
    const paid = card("Thẻ C", "01", 0)
    const owing = card("Thẻ A", "25", 1_000_000)

    expect(nearestDueCard([paid, owing], TODAY)?.name).toBe("Thẻ A")
    expect(nearestDueCard([paid], TODAY)).toBeNull()
    expect(nearestDueCard([], TODAY)).toBeNull()
  })

  it("puts a card whose due date cannot be read after every readable one", () => {
    const cards = [card("Thẻ không rõ", "cuối tháng", 1_000_000), card("Thẻ rõ", "28", 1_000_000)]

    expect(nearestDueCard(cards, TODAY)?.name).toBe("Thẻ rõ")
    expect(nearestDueCard([cards[0]], TODAY)?.name).toBe("Thẻ không rõ")
  })

  it("moves a due day that a short month does not have to that month's last day", () => {
    // 27/02/2026: hạn "31" rơi vào 28/02 (1 ngày nữa), sớm hơn hạn "5" (05/03, 6 ngày nữa).
    const cards = [card("Hạn 5", "5", 1_000_000), card("Hạn 31", "31", 1_000_000)]

    expect(nearestDueCard(cards, new Date(2026, 1, 27))?.name).toBe("Hạn 31")
  })
})
```

1.2. Trong `src/features/finance/__tests__/components/finance-view.test.tsx`, thêm dòng import ngay sau `import { FinanceView } from "../../components/finance-view"`:

```tsx
import { DEFAULT_FINANCE_STATE, FINANCE_STORAGE_KEY } from "../../finance-storage"
```

rồi thêm vào cuối `describe("FinanceView", ...)` (`beforeEach` đã xoá localStorage và bật `vi.useFakeTimers()`):

```tsx
  it("names the due date of the card that is actually due next, ignoring cards already paid off", () => {
    // 30/09/2026: thẻ A hạn ngày 25 (→ 25/10), thẻ B hạn ngày 5 (→ 05/10), thẻ C đã trả hết (hạn ngày 1).
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0))
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        cards: [
          { name: "Thẻ A", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "25/10" },
          { name: "Thẻ B", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "05/10" },
          { name: "Thẻ C", balance: 0, min: 0, limit: 5_000_000, due: "01" },
        ],
      })
    )

    render(<FinanceView />)

    expect(screen.getByText("3 thẻ · hạn gần nhất 05/10")).toBeInTheDocument()
  })

  it("says the cards owe nothing instead of naming a due date once every card is paid off", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        cards: [{ name: "Thẻ A", balance: 0, min: 0, limit: 10_000_000, due: "15 hàng tháng" }],
      })
    )

    render(<FinanceView />)

    expect(screen.getByText("1 thẻ · không nợ")).toBeInTheDocument()
  })
```

1.3. Thêm vào cuối `describe("FinanceSummarySection", ...)` trong `src/features/overview/__tests__/components/finance-summary-section.test.tsx`:

```tsx
  it("shows the due date of a card that still owes money, skipping a paid-off first card", () => {
    render(
      <FinanceSummarySection
        savings={[]}
        cards={[
          { name: "Thẻ A", balance: 0, min: 0, limit: 10_000_000, due: "15" },
          { name: "Thẻ B", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "20 hàng tháng" },
        ]}
        invests={[]}
        summary={{ ...ZERO_SUMMARY, debtTotal: 2_000_000 }}
      />
    )

    expect(screen.getByText("hạn 20 hàng tháng")).toBeInTheDocument()
  })

  it("says không nợ when every card is paid off", () => {
    render(
      <FinanceSummarySection
        savings={[]}
        cards={[{ name: "Thẻ A", balance: 0, min: 0, limit: 10_000_000, due: "15" }]}
        invests={[]}
        summary={ZERO_SUMMARY}
      />
    )

    expect(screen.getByText("không nợ")).toBeInTheDocument()
    expect(screen.queryByText("hạn 15")).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/finance-view.test.tsx src/features/overview/__tests__/components/finance-summary-section.test.tsx`
Expected: FAIL 10 test — 6 test `parseDueDay`/`nearestDueCard` (`TypeError: parseDueDay is not a function` / `nearestDueCard is not a function`); 2 test `FinanceView` (`Unable to find an element with the text: 3 thẻ · hạn gần nhất 05/10` — đang hiện "3 thẻ · hạn gần nhất 25/10"; `… 1 thẻ · không nợ`); 2 test `FinanceSummarySection` (`… hạn 20 hàng tháng` — đang hiện "hạn 15"; `… không nợ`). Mọi test cũ vẫn PASS (kể cả "hạn 15/08" với 1 thẻ còn nợ).

- [ ] **Step 3: 3 hàm đọc hạn thẻ trong `finance-calculations.ts`**

3.1. Trong `src/features/finance/finance-calculations.ts`, đổi dòng

```ts
import type { GoldPurchase, GoldStore } from "./types"
```

thành

```ts
import type { CreditCard, GoldPurchase, GoldStore } from "./types"
```

3.2. Thêm ngay sau hàm `summarizeFinance` (nếu Plan 2 đã đặt `goldReferencePricePerPhan` ngay sau `summarizeFinance` thì thêm sau hàm đó):

```ts

// Ô "Ngày đến hạn" là chữ tự do ("15", "15 hàng tháng", "05/10"...) nhưng hầu như luôn bắt đầu bằng
// ngày trong tháng: lấy số đầu tiên trong ô nếu nó là 1–31, không thì null.
function parseDueDay(due: string): number | null {
  const match = /\d+/.exec(due)
  if (!match) return null
  const day = Number(match[0])
  return day >= 1 && day <= 31 ? day : null
}

// Số ngày từ `today` tới lần đến hạn kế tiếp vào ngày `day` hằng tháng (hôm nay đúng hạn = 0). Tháng
// ngắn hơn `day` (vd. 31 ở tháng 30 ngày) thì hạn rơi vào ngày cuối tháng đó.
function daysUntilDueDay(day: number, today: Date): number {
  const year = today.getFullYear()
  const month = today.getMonth()
  const date = today.getDate()
  const daysThisMonth = new Date(year, month + 1, 0).getDate()
  const dueThisMonth = Math.min(day, daysThisMonth)
  if (dueThisMonth >= date) return dueThisMonth - date
  return daysThisMonth - date + Math.min(day, new Date(year, month + 2, 0).getDate())
}

// Thẻ còn dư nợ có lần đến hạn kế tiếp sớm nhất tính từ `today` — "hạn gần nhất" ở trụ Nợ thẻ và ở
// Tổng quan. Thẻ đã trả hết không tính; thẻ không đọc được ngày xếp sau cùng; bằng nhau thì giữ thứ
// tự thêm thẻ. Không thẻ nào còn nợ → null.
function nearestDueCard(cards: CreditCard[], today: Date): CreditCard | null {
  let nearest: CreditCard | null = null
  let nearestDays = Infinity
  for (const card of cards) {
    if (card.balance <= 0) continue
    const day = parseDueDay(card.due)
    const days = day === null ? Infinity : daysUntilDueDay(day, today)
    if (nearest === null || days < nearestDays) {
      nearest = card
      nearestDays = days
    }
  }
  return nearest
}
```

3.3. Trong khối `export { ... }` cuối file, thêm `parseDueDay,` và `nearestDueCard,` ngay sau `summarizeFinance,` (sau cả `goldReferencePricePerPhan,` của Plan 2 nếu nó đứng đó).

- [ ] **Step 4: Trụ "Nợ thẻ tín dụng" dùng `nearestDueCard`**

Trong `src/features/finance/components/finance-view.tsx`:

- Đổi dòng import (bản sau Task 8)

```tsx
import { formatPhan, pct1, summarizeFinance } from "../finance-calculations"
```

thành

```tsx
import { formatPhan, nearestDueCard, pct1, summarizeFinance } from "../finance-calculations"
```

- Ngay sau dòng `const summary = summarizeFinance({ savings, cards, gold, goldStores, invests })` thêm:

```tsx
  // "Hạn gần nhất" = thẻ còn nợ đến hạn sớm nhất tính từ hôm nay, không phải thẻ thêm đầu tiên.
  const nearestCard = nearestDueCard(cards, new Date())
```

- Ở `PillarCard` "Nợ thẻ tín dụng" thay

```tsx
          hint={
            cards.length ? `${cards.length} thẻ · hạn gần nhất ${cards[0].due}` : "Chưa có thẻ nào"
          }
```

bằng

```tsx
          hint={
            cards.length
              ? nearestCard
                ? `${cards.length} thẻ · hạn gần nhất ${nearestCard.due}`
                : `${cards.length} thẻ · không nợ`
              : "Chưa có thẻ nào"
          }
```

- [ ] **Step 5: Ô "Nợ thẻ" ở Tổng quan dùng `nearestDueCard`**

Trong `src/features/overview/components/finance-summary-section.tsx`:

- Đổi dòng import (bản sau Task 8)

```tsx
import { formatPhan, type FinanceSummary } from "@/features/finance/finance-calculations"
```

thành

```tsx
import { formatPhan, nearestDueCard, type FinanceSummary } from "@/features/finance/finance-calculations"
```

- Ngay sau dòng `const { hidden } = useMoneyVisibility()` thêm:

```tsx
  // Thẻ đã trả hết (dư nợ 0 ₫) không còn hạn nào phải nhắc.
  const nearestCard = nearestDueCard(cards, new Date())
```

- Ở `MiniStat` "Nợ thẻ" thay

```tsx
            hint={cards.length ? `hạn ${cards[0].due}` : "không nợ"}
```

bằng

```tsx
            hint={nearestCard ? `hạn ${nearestCard.due}` : "không nợ"}
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/finance-view.test.tsx src/features/overview/__tests__/components/finance-summary-section.test.tsx src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 7: Commit**

Tự review `git diff` của task rồi commit (mục **A.9** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/finance/finance-calculations.ts src/features/finance/components/finance-view.tsx src/features/overview/components/finance-summary-section.tsx src/features/finance/__tests__/finance-calculations.test.ts src/features/finance/__tests__/components/finance-view.test.tsx src/features/overview/__tests__/components/finance-summary-section.test.tsx
git commit -m "fix: show the due date of the card that is actually due next"
```

---

### Task 10: Hộp "Ghi một lần trả" bỏ ô "Ngày trả" không được đọc (Quyết định 5)

**Files:**
- Modify: `src/features/finance/components/pay-credit-card-modal.tsx` (bỏ hàm `todayLabel`, khoảng đệm và Field "Ngày trả")
- Test: `src/features/finance/__tests__/components/pay-credit-card-modal.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `PayCreditCardModal` chỉ còn ô "Số tiền trả"; props và `onPay(name, amount)` không đổi; hàm `todayLabel` bị xoá.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("PayCreditCardModal", ...)` trong `src/features/finance/__tests__/components/pay-credit-card-modal.test.tsx` (`CARD` có sẵn):

```tsx
  it("only asks for the amount — no payment-date field that would silently be thrown away", () => {
    render(<PayCreditCardModal card={CARD} onOpenChange={vi.fn()} onPay={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền trả", { exact: false })).toBeInTheDocument()
    expect(screen.queryByLabelText("Ngày trả", { exact: false })).not.toBeInTheDocument()
    expect(screen.getAllByRole("textbox")).toHaveLength(1)
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/components/pay-credit-card-modal.test.tsx`
Expected: FAIL 1 test — `expected <input …> not to be in the document` (ô "Ngày trả" vẫn còn). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Bỏ ô "Ngày trả"**

Trong `src/features/finance/components/pay-credit-card-modal.tsx`:

- Xoá hẳn hàm

```tsx
function todayLabel() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${now.getFullYear()}`
}

```

- Xoá 2 dòng ngay sau Field "Số tiền trả":

```tsx
      <div className="h-[14px]" />
      <Field label="Ngày trả" placeholder={todayLabel()} />
```

(App không lưu lịch sử trả thẻ — `onPay` chỉ trừ dư nợ — nên ô này chưa từng được đọc. Field "Số tiền trả" giữ nguyên.)

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/components/pay-credit-card-modal.test.tsx src/features/finance/__tests__/components/credit-cards-tab.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.10** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/finance/components/pay-credit-card-modal.tsx src/features/finance/__tests__/components/pay-credit-card-modal.test.tsx
git commit -m "fix: drop the unused payment date field from the card payment dialog"
```

---

### Task 11: Thêm khoản đầu tư giữ đúng giá trị 0 đã gõ; nhãn trùng với hộp sửa

**Files:**
- Modify: `src/features/finance/components/add-invest-form.tsx` (nhãn 2 Field, dòng `value:` trong `onAdd`)
- Test: `src/features/finance/__tests__/components/investments-tab.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `AddInvestForm` dùng đúng nhãn của `EditInvestmentModal`: "Tên khoản đầu tư", "Vốn đã bỏ ra", "Giá trị hiện tại" (hint "Để trống thì lấy bằng vốn" giữ nguyên). Giá trị hiện tại chỉ lấy bằng vốn khi ô TRỐNG; gõ "0" thì lưu 0 (khoản đã mất trắng), khớp hộp sửa vốn đã nhận 0.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/finance/__tests__/components/investments-tab.test.tsx`, đổi nhãn ô vốn theo nhãn mới ở các test sẵn có của form thêm — thay MỌI chỗ

```tsx
screen.getByLabelText("Số tiền đã bỏ vào", { exact: false })
```

bằng

```tsx
screen.getByLabelText("Vốn đã bỏ ra", { exact: false })
```

(3 chỗ, trong "opens the add-investment form…", "defaults value to cost…", "keeps Thêm disabled until…"), và đổi tên test `"keeps Thêm disabled until name and Số tiền đã bỏ vào are filled in"` thành `"keeps Thêm disabled until name and Vốn đã bỏ ra are filled in"`. (`getByLabelText("Tên khoản", { exact: false })` vẫn khớp nhãn mới "Tên khoản đầu tư" nên giữ nguyên.)

1.2. Thêm vào cuối `describe("InvestmentsTab", ...)`:

```tsx
  it("uses the same field labels as the edit dialog", () => {
    render(<InvestmentsTab invests={[]} summary={summaryFor([])} onAddInvest={vi.fn()} onUpdateInvest={vi.fn()} onRemoveInvest={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm khoản đầu tư" }))

    expect(screen.getByLabelText("Tên khoản đầu tư", { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText("Vốn đã bỏ ra", { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText("Giá trị hiện tại", { exact: false })).toBeInTheDocument()
  })

  it("keeps a typed 0 as the current value (a written-off investment) instead of replacing it with the cost", () => {
    const onAddInvest = vi.fn()
    render(<InvestmentsTab invests={[]} summary={summaryFor([])} onAddInvest={onAddInvest} onUpdateInvest={vi.fn()} onRemoveInvest={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm khoản đầu tư" }))
    fireEvent.change(screen.getByLabelText("Tên khoản", { exact: false }), { target: { value: "Cổ phiếu phá sản" } })
    fireEvent.change(screen.getByLabelText("Vốn đã bỏ ra", { exact: false }), { target: { value: "10000000" } })
    fireEvent.change(screen.getByLabelText("Giá trị hiện tại", { exact: false }), { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAddInvest).toHaveBeenCalledWith({ name: "Cổ phiếu phá sản", cost: 10_000_000, value: 0 })
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/finance/__tests__/components/investments-tab.test.tsx`
Expected: FAIL 5 test — 3 test cũ vừa đổi nhãn và "uses the same field labels…" (`Unable to find a label with the text of: Vốn đã bỏ ra`), "keeps a typed 0…" (cùng lỗi ở bước tìm ô vốn). Các test khác vẫn PASS.

- [ ] **Step 3: Đổi nhãn và chỉ lấy theo vốn khi ô trống**

Trong `src/features/finance/components/add-invest-form.tsx`:

- Field tên: đổi `label="Tên khoản"` thành `label="Tên khoản đầu tư"`.
- Field vốn: đổi `label="Số tiền đã bỏ vào"` thành `label="Vốn đã bỏ ra"`.
- Trong `onAdd({...})` của nút Thêm, thay dòng

```tsx
              value: Number(value) || costValue,
```

bằng

```tsx
              // Chỉ lấy bằng vốn khi ô TRỐNG (đúng như hint) — gõ 0 là khoản đã mất trắng, phải lưu 0.
              value: value.trim() ? Number(value) : costValue,
```

(`Field` có `group` nên `value` luôn là chuỗi chỉ gồm chữ số; "0" → 0.)

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/finance/__tests__/components/investments-tab.test.tsx src/features/finance/__tests__/components/edit-investment-modal.test.tsx`
Expected: PASS toàn bộ (kể cả "defaults value to cost when the Giá trị hiện tại field is left blank")

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.11** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/finance/components/add-invest-form.tsx src/features/finance/__tests__/components/investments-tab.test.tsx
git commit -m "fix: keep a typed zero investment value and align the add form labels"
```

---

### Task 12: Gợi ý "thấp hơn/giảm" so cùng kỳ; gợi ý chi tiêu tổng cần lệch ít nhất 10% (Quyết định 6)

**Files:**
- Modify: `src/features/overview/insights-calculations.ts` (import `@/lib/date`, hằng số, bỏ `isMonthNearlyComplete`, hàm mới `samePeriodExpenses`/`compareToBaseline`/`relativeChange`, viết lại `detectSpendingAnomaly` và `detectTagAnomaly`, khối export)
- Test: `src/features/overview/__tests__/insights-calculations.test.ts`

**Interfaces:**
- Consumes: `monthlyExpenseTotals`, `monthlyTagBreakdown`, `totalExpensesForMonth`, `UNTAGGED_LABEL` từ `@/features/budget/budget-calculations` (Plan 2 không đổi chữ ký các hàm này).
- Produces: `ANOMALY_MIN_PCT = 10` (export); `samePeriodExpenses(expenses: Expense[], today: string): Expense[]` (export) — chỉ giữ khoản chi có ngày-trong-tháng ≤ ngày-trong-tháng của `today`, ở mọi tháng. `detectSpendingAnomaly`/`detectTagAnomaly` giữ chữ ký: hướng "cao hơn/tăng" so với 3 tháng trọn vẹn (như cũ, báo được sớm); hướng "thấp hơn/giảm" so với cùng kỳ (ngày 1 → cùng ngày hôm nay) của 3 tháng đó — chữ mới bắt đầu bằng "Tính tới hôm nay, …" và nói "so với cùng kỳ". Gợi ý chi tiêu tổng chỉ báo khi `|z| ≥ 1,5` VÀ lệch ≥ 10% (cả 2 hướng). Bỏ `ANOMALY_MONTH_COMPLETE_RATIO` + `isMonthNearlyComplete` (và import `daysInMonth`). `id` của 2 loại gợi ý không đổi.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/overview/__tests__/insights-calculations.test.ts`, đổi dòng import đầu file

```ts
import { detectSpendingAnomaly, detectTagAnomaly, detectMoodSpendingCorrelation } from "../insights-calculations"
```

thành

```ts
import {
  detectSpendingAnomaly,
  detectTagAnomaly,
  detectMoodSpendingCorrelation,
  samePeriodExpenses,
} from "../insights-calculations"
```

1.2. Trong `describe("detectSpendingAnomaly", ...)`, thay nguyên 2 test `"suppresses a 'thấp hơn' (lower) signal while the month is still in progress"` và `"reports a genuine 'thấp hơn' (lower) signal once the month is nearly complete"` bằng:

```ts
  it("reports a 'thấp hơn' (lower) signal mid-month when spending so far is below the same days of the 3 prior months", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      // Tới ngày 15/04 mới chi 500k, trong khi cùng kỳ (ngày 1 → 15) của 3 tháng trước đều đã chi ~1tr.
      expense(4, "2026-04-10", 500_000),
    ]

    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-15")).toEqual({
      id: "spending-anomaly-2026-04",
      text: "Tính tới hôm nay, tháng này bạn chi tiêu thấp hơn khoảng 50% so với cùng kỳ 3 tháng gần đây.",
    })
  })

  it("still reports a genuine 'thấp hơn' (lower) signal near the end of the month", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      expense(4, "2026-04-10", 500_000),
    ]

    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-29")).toEqual({
      id: "spending-anomaly-2026-04",
      text: "Tính tới hôm nay, tháng này bạn chi tiêu thấp hơn khoảng 50% so với cùng kỳ 3 tháng gần đây.",
    })
  })

  it("does not report 'thấp hơn' near month end just because a fixed late-month payment has not come due yet", () => {
    // Mỗi tháng: chi ~1tr quanh ngày 10 + 2tr cố định ngày 29. Hôm nay 27/09 (đã qua 90% tháng): khoản
    // ngày 29 chưa tới — so với cả tháng trọn vẹn thì như "thấp hơn 67%", so cùng kỳ thì bằng nhau.
    const expenses = [
      expense(1, "2026-06-10", 1_000_000),
      expense(2, "2026-06-29", 2_000_000),
      expense(3, "2026-07-10", 1_100_000),
      expense(4, "2026-07-29", 2_000_000),
      expense(5, "2026-08-10", 900_000),
      expense(6, "2026-08-29", 2_000_000),
      expense(7, "2026-09-10", 1_000_000),
    ]

    expect(detectSpendingAnomaly(expenses, "2026-09", "2026-09-27")).toBeNull()
  })

  it("does not report a change smaller than 10%, even when very stable prior months make it statistically unusual", () => {
    // Std 3 tháng trước chỉ 50k → 8,4tr là z = 3, nhưng chỉ cao hơn khoảng 2% — không đáng báo.
    const expenses = [
      expense(1, "2026-01-15", 8_200_000),
      expense(2, "2026-02-15", 8_250_000),
      expense(3, "2026-03-15", 8_300_000),
      expense(4, "2026-04-12", 8_400_000),
    ]

    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-12")).toBeNull()
  })
```

1.3. Trong `describe("detectTagAnomaly", ...)`, thay nguyên 2 test `"suppresses a 'giảm' (decrease) signal while the month is still in progress"` và `"reports a 'giảm' (decrease) signal once the month is nearly complete"` bằng:

```ts
  it("reports a 'giảm' (decrease) signal mid-month against the same days of the 3 prior months", () => {
    const expenses = [
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 200_000, "Ăn uống"),
    ]

    expect(detectTagAnomaly(expenses, "2026-04", "2026-04-15")).toEqual({
      id: "tag-anomaly-2026-04",
      text: 'Tính tới hôm nay, chi tiêu cho "🛍️ Ăn uống" tháng này giảm 60% so với cùng kỳ 3 tháng trước.',
    })
  })

  it("still reports a 'giảm' (decrease) signal near the end of the month", () => {
    const expenses = [
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 200_000, "Ăn uống"),
    ]

    expect(detectTagAnomaly(expenses, "2026-04", "2026-04-29")).toEqual({
      id: "tag-anomaly-2026-04",
      text: 'Tính tới hôm nay, chi tiêu cho "🛍️ Ăn uống" tháng này giảm 60% so với cùng kỳ 3 tháng trước.',
    })
  })

  it("does not report a 100% decrease for a monthly bill that is simply not due yet this month", () => {
    // Cước điện thoại trả ngày 28 hằng tháng; hôm nay 27/09 thì tháng này chưa trả là bình thường.
    const expenses = [
      taggedExpense(1, "2026-06-28", 200_000, "Điện thoại"),
      taggedExpense(2, "2026-07-28", 200_000, "Điện thoại"),
      taggedExpense(3, "2026-08-28", 200_000, "Điện thoại"),
    ]

    expect(detectTagAnomaly(expenses, "2026-09", "2026-09-27")).toBeNull()
  })
```

1.4. Thêm vào cuối file:

```ts
describe("samePeriodExpenses", () => {
  it("keeps only expenses from day 1 up to today's day of the month, in every month", () => {
    const expenses = [
      expense(1, "2026-08-05", 100),
      expense(2, "2026-08-27", 200),
      expense(3, "2026-08-28", 300),
      expense(4, "2026-09-27", 400),
    ]

    expect(samePeriodExpenses(expenses, "2026-09-27").map((e) => e.id)).toEqual([1, 2, 4])
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: FAIL 8 test — 2 test giữa tháng ("…mid-month…", trả `null` vì cổng 90%); 2 test cuối tháng ("still reports…", chữ cũ "Tháng này bạn chi tiêu thấp hơn khoảng 50% so với trung bình 3 tháng gần đây." / "…giảm 60% so với trung bình 3 tháng trước."); "does not report 'thấp hơn' near month end…" (đang báo "thấp hơn khoảng 67%"); "does not report a change smaller than 10%…" (đang báo "cao hơn khoảng 2%"); "does not report a 100% decrease…" (đang báo "giảm 100%"); `samePeriodExpenses` (`TypeError: samePeriodExpenses is not a function`). Các test còn lại (hướng "cao hơn/tăng", nền thiếu tháng, "Không gắn thẻ", tâm trạng, dự báo) vẫn PASS.

- [ ] **Step 3: Viết lại 2 bộ dò bất thường**

3.1. Trong `src/features/overview/insights-calculations.ts`, đổi dòng import đầu file

```ts
import { dayKey, daysBetween, daysInMonth, formatDayKeyWithYear, monthKeyFromDayKey, shiftDay, shiftMonth } from "@/lib/date"
```

thành

```ts
import { dayKey, daysBetween, formatDayKeyWithYear, monthKeyFromDayKey, shiftDay, shiftMonth } from "@/lib/date"
```

3.2. Thay dòng hằng số

```ts
const ANOMALY_MONTH_COMPLETE_RATIO = 0.9
```

bằng

```ts
// Gợi ý chi tiêu tổng chỉ báo khi lệch ít nhất 10%: 3 tháng nền đều quá (std rất nhỏ) thì chênh 2% —
// hay "khoảng 0%" — cũng vượt ngưỡng z-score, mà không phải điều đáng báo.
const ANOMALY_MIN_PCT = 10
```

3.3. Thay toàn bộ khối từ dòng comment `// Tháng chưa qua hết luôn có tổng chi tiêu-đến-nay THẤP hơn 1 tháng trọn vẹn — …` (ngay trên `function isMonthNearlyComplete`) tới hết hàm `detectTagAnomaly` (dấu `}` đóng hàm, ngay trước `function detectMoodSpendingCorrelation`) bằng:

```ts
// Tháng đang chạy dở luôn có tổng chi-tới-nay THẤP hơn 1 tháng trọn vẹn, nên 2 hướng so khác nhau:
// "cao hơn/tăng" so với cả tháng trọn vẹn của 3 tháng trước (đã vượt cả 1 tháng bình thường thì báo
// sớm được), còn "thấp hơn/giảm" so với CÙNG KỲ — ngày 1 → cùng ngày-trong-tháng của hôm nay — của 3
// tháng đó. Khoản trả cố định cuối tháng (vd. cước điện thoại ngày 28) chưa tới hạn tháng này thì
// cùng kỳ tháng trước cũng chưa có, nên không còn báo nhầm "giảm" vào mấy ngày cuối tháng.
function samePeriodExpenses(expenses: Expense[], today: string): Expense[] {
  const cutoff = Number(today.slice(8, 10))
  return expenses.filter((e) => Number(e.dayKey.slice(8, 10)) <= cutoff)
}

// Độ lệch của `current` so với 3 tháng nền: z-score và % (đã làm tròn); null khi chưa so được.
function compareToBaseline(current: number, baseline: number[]): { z: number; pct: number } | null {
  // Cần CẢ 3 tháng nền đều có chi tiêu thật — nếu chỉ 1-2 tháng có (tài khoản mới, hoặc có tháng
  // không ghi gì), trung bình bị pha loãng bởi các tháng = 0, khiến % lệch báo ra bị thổi phồng
  // sai lệch (ví dụ 1 tháng thật + 2 tháng rỗng khiến tăng thật 20% bị báo thành tăng 260%).
  if (baseline.some((v) => v === 0)) return null
  const std = sampleStdDev(baseline)
  if (std === 0) return null
  const avg = mean(baseline)
  return { z: (current - avg) / std, pct: Math.round((Math.abs(current - avg) / avg) * 100) }
}

function detectSpendingAnomaly(expenses: Expense[], month: string, today: string): Insight | null {
  if (!expenses.length) return null

  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const currentTotal = totalExpensesForMonth(expenses, month)

  const fullMonths = compareToBaseline(
    currentTotal,
    monthlyExpenseTotals(expenses, priorMonths).map((p) => p.total)
  )
  if (fullMonths && fullMonths.z >= ANOMALY_Z_SCORE_THRESHOLD && fullMonths.pct >= ANOMALY_MIN_PCT) {
    return {
      id: `spending-anomaly-${month}`,
      text: `Tháng này bạn chi tiêu cao hơn khoảng ${fullMonths.pct}% so với trung bình 3 tháng gần đây.`,
    }
  }

  const samePeriod = compareToBaseline(
    currentTotal,
    monthlyExpenseTotals(samePeriodExpenses(expenses, today), priorMonths).map((p) => p.total)
  )
  if (samePeriod && samePeriod.z <= -ANOMALY_Z_SCORE_THRESHOLD && samePeriod.pct >= ANOMALY_MIN_PCT) {
    return {
      id: `spending-anomaly-${month}`,
      text: `Tính tới hôm nay, tháng này bạn chi tiêu thấp hơn khoảng ${samePeriod.pct}% so với cùng kỳ 3 tháng gần đây.`,
    }
  }
  return null
}

// % thay đổi của `current` so với trung bình `prior` (vd. -0.6 = giảm 60%); null khi chưa so được.
function relativeChange(current: number, prior: number[]): number | null {
  // Cần CẢ 3 tháng nền đều có chi tiêu thật cho tag này — nếu chỉ 1-2 tháng có (tag mới thêm gần
  // đây, hoặc người dùng mới), trung bình bị pha loãng bởi các tháng = 0, khiến % lệch báo ra bị
  // thổi phồng sai lệch (vd. tag chỉ có ở 1/3 tháng, tăng nhẹ thật vẫn báo tăng gấp 3 lần).
  if (prior.length < ANOMALY_LOOKBACK_MONTHS || prior.some((v) => v === 0)) return null
  const avgPrior = mean(prior)
  return (current - avgPrior) / avgPrior
}

function detectTagAnomaly(expenses: Expense[], month: string, today: string): Insight | null {
  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const allMonths = [...priorMonths, month]
  const series = monthlyTagBreakdown(expenses, allMonths)
  // Hướng "giảm" so với cùng kỳ của 3 tháng trước (xem samePeriodExpenses). Tag không có khoản nào
  // trong cùng kỳ thì không có trong map → không có nền để báo "giảm".
  const samePeriodByLabel = new Map(
    monthlyTagBreakdown(samePeriodExpenses(expenses, today), priorMonths).map((s) => [s.label, s.data] as const)
  )

  let worst: { label: string; emoji: string; pct: number } | null = null
  for (const tagSeries of series) {
    // "Không gắn thẻ" là nhóm gộp tự động (không phải 1 tag người dùng thật chọn) — báo bất
    // thường cho nó vừa đọc kỳ lạ ("chi tiêu cho Không gắn thẻ"), vừa trùng lặp với insight chi
    // tiêu bất thường tổng (detectSpendingAnomaly) khi hầu hết chi tiêu chưa gắn thẻ, lại thường
    // là nhóm ồn nhất nên hay "thắng" và che mất 1 tag thật sự đáng chú ý hơn.
    if (tagSeries.label === UNTAGGED_LABEL) continue
    const currentValue = tagSeries.data[ANOMALY_LOOKBACK_MONTHS]
    const increase = relativeChange(currentValue, tagSeries.data.slice(0, ANOMALY_LOOKBACK_MONTHS))
    const decrease = relativeChange(currentValue, samePeriodByLabel.get(tagSeries.label) ?? [])
    const pct =
      increase !== null && increase >= TAG_ANOMALY_PCT_THRESHOLD
        ? increase
        : decrease !== null && decrease <= -TAG_ANOMALY_PCT_THRESHOLD
          ? decrease
          : null
    if (pct === null) continue
    if (!worst || Math.abs(pct) > Math.abs(worst.pct)) {
      worst = { label: tagSeries.label, emoji: tagSeries.emoji, pct }
    }
  }
  if (!worst) return null

  const pctText = Math.round(Math.abs(worst.pct) * 100)
  return {
    id: `tag-anomaly-${month}`,
    text:
      worst.pct > 0
        ? `Chi tiêu cho "${worst.emoji} ${worst.label}" tháng này tăng ${pctText}% so với trung bình 3 tháng trước.`
        : `Tính tới hôm nay, chi tiêu cho "${worst.emoji} ${worst.label}" tháng này giảm ${pctText}% so với cùng kỳ 3 tháng trước.`,
  }
}
```

3.4. Trong khối `export { ... }` cuối file, thêm `ANOMALY_MIN_PCT,` ngay sau `ANOMALY_Z_SCORE_THRESHOLD,` và `samePeriodExpenses,` ngay trước `detectSpendingAnomaly,`.

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: PASS toàn bộ (kể cả "reports a high anomaly with the correct id, direction and percentage" — 200% vẫn báo với chữ cũ — và "skips the untagged (Không gắn thẻ) bucket…")

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.12** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/overview/insights-calculations.ts src/features/overview/__tests__/insights-calculations.test.ts
git commit -m "fix: compare a running month with the same days of past months before saying spending fell"
```

---

### Task 13: Dự báo tiết kiệm bỏ các điểm 0 ở đầu lịch sử

**Files:**
- Modify: `src/features/overview/insights-calculations.ts` (hàm `forecastSavingsGoal`)
- Test: `src/features/overview/__tests__/insights-calculations.test.ts`

**Interfaces:**
- Consumes: `linearHistory` (helper sẵn có trong file test), `FORECAST_MIN_POINTS`, `FORECAST_MIN_SPAN_DAYS`.
- Produces: `forecastSavingsGoal(history, target, today)` giữ chữ ký; bỏ mọi snapshot `savingsTotal === 0` đứng TRƯỚC điểm khác 0 đầu tiên rồi mới xét đủ 14 điểm / đủ 30 ngày và hồi quy. Điểm 0 nằm giữa chuỗi (đã có tiền rồi rút hết) vẫn tính như cũ. Đây cũng là phần test `forecastSavingsGoal` có điểm 0 đầu chuỗi mà Plan 4 (`area-overview-journal#20`) để lại cho plan này.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("forecastSavingsGoal", ...)` trong `src/features/overview/__tests__/insights-calculations.test.ts`:

```ts
  it("ignores the leading 0 snapshot recorded before any savings were entered", () => {
    // Ngày đầu mở Tổng quan ghi 1 điểm 0 (chưa nhập quỹ nào); hôm sau nhập 50 triệu đang có sẵn rồi
    // để yên 31 ngày. Bước nhảy 0 → 50 triệu không phải nhịp tiết kiệm — không được dự báo gì.
    const history = [
      { date: "2026-08-01", net: 0, savingsTotal: 0 },
      ...linearHistory("2026-08-02", 31, 0, 50_000_000),
    ]

    expect(forecastSavingsGoal(history, 100_000_000, "2026-09-01")).toBeNull()
  })

  it("forecasts from the real saving trend that follows a leading 0 snapshot", () => {
    const history = [
      { date: "2026-08-14", net: 0, savingsTotal: 0 },
      ...linearHistory("2026-08-15", 31, 100_000, 5_000_000),
    ]

    // Bỏ điểm 0 thì y hệt test "forecasts the correct target date for a steady upward trend": còn thiếu
    // 2.000.000, nhịp 100.000/ngày → 20 ngày nữa → 04/10 (giữ điểm 0 thì nhịp bị thổi lên ~128.000/ngày → 30/09).
    expect(forecastSavingsGoal(history, 10_000_000, "2026-09-14")).toEqual({
      id: "savings-forecast-2026-09",
      text: expect.stringContaining("04/10"),
    })
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts`
Expected: FAIL 2 test — "ignores the leading 0 snapshot…" (`expected { id: 'savings-forecast-2026-09', text: '… vào khoảng …/02/2027.' } to be null` — điểm 0 làm độ dốc ~284.000/ngày); "forecasts from the real saving trend…" (text chứa "30/09" thay vì "04/10"). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Bỏ điểm 0 đầu chuỗi trước khi hồi quy**

Trong `src/features/overview/insights-calculations.ts`, thay toàn bộ hàm `forecastSavingsGoal` bằng:

```ts
function forecastSavingsGoal(history: NetWorthSnapshot[], target: number, today: string): Insight | null {
  // Lần đầu mở Tổng quan (hay ngay sau "Xoá toàn bộ dữ liệu") đã ghi 1 điểm savingsTotal = 0 trước khi
  // người dùng kịp nhập các quỹ đang có; bước nhảy 0 → số dư sẵn có đó không phải nhịp tiết kiệm, mà
  // vì hồi quy luôn dùng cả lịch sử nên nó làm dự báo lạc quan sai suốt nhiều tháng. Bỏ mọi điểm 0
  // ở ĐẦU chuỗi rồi mới xét đủ điểm/đủ ngày và hồi quy.
  const firstSaved = history.findIndex((h) => h.savingsTotal !== 0)
  const points = firstSaved === -1 ? [] : history.slice(firstSaved)
  if (points.length < FORECAST_MIN_POINTS) return null

  const n = points.length
  // Tiết kiệm thường dồn theo lương (1 lần/tháng), không đều mỗi ngày — nếu khoảng dữ liệu còn
  // quá ngắn (vd. chỉ 13-14 ngày), 1 lần nhận lương rơi đúng giữa khoảng đó có thể làm độ dốc bị
  // thổi phồng rất nhiều (trông như tiết kiệm nhanh hơn hẳn thực tế). Cần ít nhất 1 chu kỳ lương
  // thật (~30 ngày) đã trôi qua mới đủ tin cậy để dự báo.
  if (daysBetween(points[0].date, points[n - 1].date) < FORECAST_MIN_SPAN_DAYS) return null

  // Hồi quy theo SỐ NGÀY THỰC đã trôi qua kể từ điểm đầu tiên, KHÔNG theo chỉ số phần tử — snapshot
  // chỉ được ghi khi người dùng mở app, nên có thể có khoảng trống (bỏ lỡ vài ngày không mở app).
  // Nếu hồi quy theo chỉ số, độ dốc sẽ bị tính theo "đơn vị/lần ghi" thay vì "đơn vị/ngày", làm dự
  // báo sai lệch (nhanh hơn thực tế) đúng theo tỷ lệ mật độ ghi thưa hay dày.
  const xs = points.map((h) => daysBetween(points[0].date, h.date))
  const ys = points.map((h) => h.savingsTotal)
  const meanX = mean(xs)
  const meanY = mean(ys)
  const numerator = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0)
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)
  const slope = denominator === 0 ? 0 : numerator / denominator

  const currentSavings = points[n - 1].savingsTotal
  if (currentSavings >= target || slope <= 0) return null

  const daysToTarget = Math.ceil((target - currentSavings) / slope)
  // Độ dốc nhỏ dương (gần như đi ngang) có thể ngoại suy ra hàng trăm/nghìn năm — 1 con số vô
  // nghĩa với người dùng thật, chặn lại thay vì hiện 1 ngày xa không thực tế.
  if (daysToTarget > FORECAST_MAX_DAYS) return null
  const targetDate = shiftDay(today, daysToTarget)

  return {
    // Theo tháng (không cố định) — nếu người dùng ẩn đi, gợi ý chỉ ẩn tới hết tháng đó, sang
    // tháng mới sẽ tự hiện lại nếu vẫn còn đúng điều kiện (giống 3 loại gợi ý còn lại), thay vì
    // ẩn vĩnh viễn dù sau này mục tiêu/ngày dự báo đã thay đổi hoàn toàn.
    id: `savings-forecast-${monthKeyFromDayKey(today)}`,
    text: `Với nhịp tiết kiệm hiện tại, bạn có thể đạt mục tiêu tiết kiệm vào khoảng ${formatDayKeyWithYear(targetDate)}.`,
  }
}
```

(Khác bản cũ đúng 3 chỗ: 2 dòng `firstSaved`/`points` + comment ở đầu hàm; mọi chỗ dùng `history` trong thân hàm đổi thành `points`; phần còn lại giữ nguyên từng dòng.)

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/overview/__tests__/insights-calculations.test.ts src/features/overview/__tests__/components/overview-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **A.12** ở "Kiểm tra tay" của Task 14):

```bash
git add src/features/overview/insights-calculations.ts src/features/overview/__tests__/insights-calculations.test.ts
git commit -m "fix: ignore leading zero savings snapshots in the savings forecast"
```

---

### Task 14: Checkpoint nhánh 1 — tsc, lint, toàn bộ test, kiểm tra tay

**Files:** không sửa file nào (nếu 1 bước dưới đây fail: quay về đúng task gây lỗi, sửa, chạy lại test của task đó, commit `fix: ...` riêng trên nhánh này).

**Interfaces:**
- Consumes: toàn bộ Task 1–13.
- Produces: nhánh `fix/small-bugs-finance` sạch tsc/lint/test, sẵn sàng cho chủ repo kiểm tra tay rồi merge vào `developer`.

- [ ] **Step 1: Kiểm kiểu**

Run: `npx tsc --noEmit`
Expected: không lỗi (exit 0). Đặc biệt không lỗi kiểu ở `new Map(... as const)` của `detectTagAnomaly`, ở prop `existingNames` của 2 form cửa hàng vàng, ở `delta={goldPL !== 0 ? pct1(goldPct) : undefined}` của `GoldTab`, ở `handlePaste` của `Field`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error, 0 warning mới (đặc biệt không còn import thừa `daysInMonth` ở `insights-calculations.ts`, `goldStorePrice` ở `gold-tab.tsx`/bảng/thẻ giao dịch, `todayLabel` ở `pay-credit-card-modal.tsx`).

- [ ] **Step 3: Toàn bộ test**

Run: `npm run test`
Expected: PASS toàn bộ suite (mọi test cũ + test mới của Task 1–13), không cảnh báo React mới trong log.

- [ ] **Step 4: Tự review diff cả nhánh**

Run: `git diff developer --stat` rồi `git diff developer -- src/`
Kiểm: không còn chỗ nào định giá 1 lần mua bằng `goldStorePrice(...)` trực tiếp ngoài `goldMarketPrice`/`unpricedGoldStores`; không còn `cards[0].due`; không còn `${...goldPhan} phân` thô; `Field` vẫn còn nguyên `masked`/`focused`/`onFocus`/`onBlur` của Plan 2; `GoldTab` vẫn có `goldPLText` + `fitChars` của Plan 5; không đụng `finance-storage.ts` (schema), `auto-backup.tsx`, `/sandbox`, `EXPORT_VERSION`.

### Kiểm tra tay

Chạy `npm run dev`, đăng nhập như thường. **Trước khi bắt đầu:** Cài đặt → "Xuất file JSON" để có bản sao lưu dữ liệu thật — các mục dưới thêm quỹ/cửa hàng/lần mua/thẻ/khoản đầu tư thử, mục A.8 nạp 1 bản sao đã sửa, và mục A.13 nạp lại file gốc để xoá sạch dữ liệu thử.

- [ ] **A.1 Thanh tiến độ quỹ 0/0 (Task 1)** — `/finance` → "Tiết kiệm" → "Thêm quỹ tiết kiệm": tên "Quỹ thử 0", số tiền `0`, mục tiêu `0` → Thêm. Thanh tiến độ của quỹ này trống (không chạy kín màu như quỹ đã đủ). Xoá "Quỹ thử 0".
- [ ] **A.2 Thanh tài sản ròng (Task 2)** — nhìn thanh màu dưới số "Tài sản ròng" (ở `/finance` và `/overview`): nếu có phần nào đang 0 ₫ (vd. chưa có nợ thẻ hoặc chưa có vàng), thanh vẫn chạy kín tới 2 mép, không có khoảng hở thừa ở cuối hay khe đôi ở giữa; chú giải bên dưới vẫn đủ "Tiết kiệm", "Vàng", "Nợ thẻ". (Số tiền lẻ đồng được kiểm ở A.8.)
- [ ] **A.3 Dán số tiền có phần lẻ (Task 3)** — "Tiết kiệm" → "Thêm quỹ tiết kiệm" → bấm vào ô "Số tiền hiện có" → dán (Ctrl+V) chuỗi `1.500.000,00` (chép từ đây) → ô hiện `1.500.000`, không phải `150.000.000`. Bôi đen cả ô rồi dán `1,500,000.00` → vẫn `1.500.000`. Bôi đen rồi dán `20.000.000đ` → `20.000.000`. Bấm "Huỷ".
- [ ] **A.4 Tên cửa hàng vàng trùng (Task 4)** — "Tích lũy vàng" → "Thêm cửa hàng" → gõ đúng tên 1 cửa hàng đang có (thêm dấu cách 2 đầu cũng được) và 1 giá → dưới ô tên hiện chữ đỏ "Đã có cửa hàng tên này — chọn tên khác", nút "Thêm" khoá, chữ đã gõ vẫn còn. Đổi sang tên khác → "Thêm" sáng lại. Bấm "Huỷ". Nếu chỉ có 1 cửa hàng thì thêm tạm cửa hàng "Thử A". Bấm bút chì ở 1 cửa hàng, đổi tên thành đúng tên cửa hàng kia → "Lưu" khoá + chữ đỏ; trả lại tên cũ → "Lưu" sáng. Bấm "Huỷ".
- [ ] **A.5 Cửa hàng đang chọn bị đổi tên (Task 5)** — thêm cửa hàng "Thử SJX" (giá bất kỳ). Bấm "Thêm lần mua vàng", chọn chip "Thử SJX", điền ngày `10/08/2026`, khối lượng `1`, giá `900000`. KHÔNG đóng form: bấm bút chì ở "Thử SJX" phía trên, đổi tên thành "Thử SJC" → Lưu. Quay xuống form: không chip nào đang chọn, nút "Thêm" khoá. Bấm chip "Thử SJC" → "Thêm" sáng → bấm "Huỷ" (không cần lưu).
- [ ] **A.6 Cửa hàng chưa nhập giá (Task 6)** — thêm cửa hàng "Thử giá trống", KHÔNG nhập giá. Ghi lại số "Tài sản ròng" và số lãi/lỗ vàng đang hiện. Thêm 1 lần mua ở "Thử giá trống": ngày hôm nay, `10` phân, giá mua `8000000`. Thẻ "Lãi / lỗ theo giá thị trường" có dòng "Chưa nhập giá hôm nay cho Thử giá trống — vàng mua ở đó đang tạm tính theo giá mua."; số lãi/lỗ vàng KHÔNG tụt thêm 80.000.000 ₫; "Tài sản ròng" tăng đúng 80.000.000 ₫; dòng lần mua đó trong "Các lần mua vàng" có "Giá hiện tại" = "Giá vốn" = 80.000.000 ₫, lãi lỗ 0 ₫. (Nếu đây là lần mua vàng duy nhất: câu dưới số lãi/lỗ là "Giá hiện tại đang bằng giá vốn — chưa lãi cũng chưa lỗ.", số hiện "0 ₫", không có ▲ +0,0%.) Gõ giá `8500000` cho "Thử giá trống" → dòng nhắc biến mất, lần mua đó lãi 5.000.000 ₫. Xoá lần mua thử, rồi xoá các cửa hàng thử của A.4–A.6.
- [ ] **A.7 Ngày mua vàng (Task 7)** — "Thêm lần mua vàng": ngày `10/08/26` → ô đỏ + "Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026", nút "Thêm" khoá; `31/02/2026` → vẫn đỏ; `2026-08-10` → hết đỏ. Chọn 1 cửa hàng, khối lượng `1`, giá bất kỳ → Thêm → lần mua mới hiện ngày "10/08/2026", nằm đúng chỗ theo thứ tự ngày (không bị đẩy xuống cuối danh sách). Bấm sửa lần mua đó, đổi ngày thành `10-08-2026` → Lưu → vẫn hiện "10/08/2026". Xoá lần mua thử.
- [ ] **A.8 Khối lượng chỉ nhận phân nguyên + dữ liệu cũ có phân lẻ (Task 8, Task 2)** — "Thêm lần mua vàng": khối lượng `12.3` → ô đỏ + "Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)", "Thêm" khoá; `1,5` → như vậy; `12` → hết đỏ, hint "10 phân = 1 chỉ". Bấm "Huỷ". Sau đó mở 1 bản sao của file JSON vừa xuất, thêm vào mảng `finance.gold` phần tử `{ "id": 999999, "date": "01/01/2020", "phan": 2.5, "buy": 8123457, "store": "<tên 1 cửa hàng đang có>" }`, lưu thành file mới → Cài đặt → "Nhập từ file" → chọn file mới → "Thay dữ liệu". Tab "Tích lũy vàng": dòng lần mua 01/01/2020 (bấm "Xem thêm" nếu cần) hiện khối lượng "2,5 phân" và "Giá vốn" "20.308.643 ₫" (không có ",5"); "Đang giữ"/"Quy đổi" ở thẻ lãi/lỗ, hint trụ "Tích lũy vàng", ô "Vàng" ở `/overview` và mục tiêu "Tích lũy 18 chỉ vàng" ở `/goals` không có đuôi số thực dài kiểu "…0000000007"; số "Tài sản ròng" khi đếm xong không mọc ",5".
- [ ] **A.9 Hạn gần nhất của thẻ (Task 9)** — tab "Nợ thẻ tín dụng": thêm "Thẻ thử xa" (dư nợ `1000000`, hạn mức bất kỳ, ngày đến hạn = ngày của 3 hôm nữa, vd. hôm nay ngày 5 thì gõ `8`), rồi "Thẻ thử gần" (dư nợ `1000000`, hạn mức bất kỳ, ngày đến hạn = ngày mai kèm chữ, vd. `6 hàng tháng`). Trụ "Nợ thẻ tín dụng" ghi "… · hạn gần nhất 6 hàng tháng" (của thẻ thêm SAU). Nếu đã có thẻ thật còn nợ đến hạn sớm hơn nữa thì hint là của thẻ thật đó — đối chiếu dòng "Hạn thanh toán" trong tab. `/overview` → ô "Nợ thẻ" hiện cùng "hạn …". Bấm "Ghi một lần trả" ở "Thẻ thử gần", trả `1000000` → hint đổi sang thẻ còn nợ đến hạn kế tiếp. Xoá 2 thẻ thử. (Nếu sau đó mọi thẻ đều dư nợ 0: trụ ghi "N thẻ · không nợ", `/overview` ghi "không nợ".)
- [ ] **A.10 Hộp trả thẻ (Task 10)** — bấm "Ghi một lần trả" ở 1 thẻ bất kỳ: hộp chỉ còn ô "Số tiền trả", không còn ô "Ngày trả". Bấm "Huỷ".
- [ ] **A.11 Thêm khoản đầu tư (Task 11)** — tab "Đầu tư" → "Thêm khoản đầu tư": 3 nhãn là "Tên khoản đầu tư", "Vốn đã bỏ ra", "Giá trị hiện tại" (giống hộp "Sửa"). Tên "Thử mất trắng", vốn `10000000`, giá trị hiện tại `0` → Thêm → dòng đó hiện lỗ "− 10.000.000 ₫" (không phải "+ 0 ₫"). Thêm "Thử để trống" với vốn `5000000`, để trống giá trị hiện tại → lãi lỗ "+ 0 ₫" (lấy bằng vốn như hint). Xoá 2 khoản thử.
- [ ] **A.12 Gợi ý ở Tổng quan (Task 12, 13)** — mở `/overview`: trang không lỗi. Nếu đang có gợi ý chi tiêu "thấp hơn"/"giảm" thì câu bắt đầu bằng "Tính tới hôm nay, …" và nói "so với cùng kỳ"; gợi ý "cao hơn"/"tăng" giữ câu cũ. (Các trường hợp biên — cuối tháng, khoản trả cố định, chênh dưới 10%, điểm 0 đầu lịch sử tài sản — đã có test tự động, không cần dựng dữ liệu.)
- [ ] **A.13 Trả dữ liệu thật về như cũ** — Cài đặt → "Nhập từ file" → chọn file sao lưu GỐC xuất lúc đầu → "Thay dữ liệu". Kiểm nhanh `/finance` (cả 4 tab) và `/goals`: không còn quỹ/cửa hàng/lần mua/thẻ/khoản đầu tư thử nào.

- [ ] **Step 5: Báo lại để duyệt**

Báo chủ repo: kết quả Step 1–4, kết quả từng mục A.1–A.13, danh sách commit trên `fix/small-bugs-finance`. Chỉ merge vào `developer` khi chủ repo duyệt (CLAUDE.md mục 5); không `git push` nếu chủ repo chưa yêu cầu. Nhánh 2 chỉ tách sau khi nhánh này đã merge.

---

## Nhánh 2 — `fix/small-bugs-calc` (Task 15–19)

Tách nhánh (sau khi `fix/small-bugs-finance` đã merge): `git checkout developer && git pull --ff-only 2>/dev/null; git checkout -b fix/small-bugs-calc` (bỏ qua `git pull` nếu repo không có remote).

### Task 15: Máy tính để yên phím tắt có Ctrl/Cmd/Alt và Enter trên dòng lịch sử

**Files:**
- Modify: `src/features/calc/components/calculator-modal.tsx` (`handleKeyDown`, thuộc tính `data-calc-history-item` trên nút dòng lịch sử)
- Test: `src/features/calc/__tests__/components/calculator-modal.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `handleKeyDown` (listener `keydown` trên `window` khi máy tính mở) bỏ qua — không `preventDefault`, không xử lý — mọi phím có `ctrlKey`/`metaKey`/`altKey` (Escape vẫn đóng như cũ vì được xét trước), và bỏ qua Enter khi phần tử đang focus nằm trong 1 dòng lịch sử (nút có thuộc tính `data-calc-history-item`) để trình duyệt tự "bấm" dòng đó (nạp lại phép tính). Enter ở mọi chỗ khác (kể cả khi đang focus nút Đóng hay 1 phím vừa click) vẫn là "=" — đúng lưu ý của verifier: bỏ qua mọi nút sẽ làm Enter đóng máy tính ngay khi mở. Phần test phím có modifier của `area-shell-auth-calc#12` nằm ở task này.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `describe("CalculatorModal", ...)` trong `src/features/calc/__tests__/components/calculator-modal.test.tsx` (helper `type`, `click` có sẵn ở đầu file):

```tsx
  it("phím có Ctrl/Cmd: Ctrl+C và Cmd+C để trình duyệt copy kết quả, không xoá biểu thức", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)
    type(["1", "2", "+", "3", "="])
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("15")

    const ctrlNotCancelled = fireEvent.keyDown(window, { key: "c", ctrlKey: true })
    const cmdNotCancelled = fireEvent.keyDown(window, { key: "c", metaKey: true })

    expect(ctrlNotCancelled).toBe(true)
    expect(cmdNotCancelled).toBe(true)
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("15")
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("15")
  })

  it("phím có Ctrl: Ctrl+'-', Ctrl+'=' và Ctrl+'0' (thu phóng trang) không gõ vào máy tính", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)
    type(["1", "2"])

    for (const key of ["-", "=", "0"]) {
      expect(fireEvent.keyDown(window, { key, ctrlKey: true })).toBe(true)
    }

    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("12")
    expect(screen.queryAllByTestId("calculator-history-item")).toHaveLength(0)
  })

  it("Enter trên 1 dòng lịch sử đang focus để nút đó tự kích hoạt, không chạy '=' thêm 1 dòng", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)
    type(["1", "+", "1", "="])
    const [item] = screen.getAllByTestId("calculator-history-item")

    item.focus()
    const notCancelled = fireEvent.keyDown(item, { key: "Enter" })

    expect(notCancelled).toBe(true)
    expect(screen.getAllByTestId("calculator-history-item")).toHaveLength(1)
  })

  it("Enter khi đang focus 1 phím số vẫn là '=' (chỉ dòng lịch sử được bỏ qua)", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)
    type(["8", "+", "2"])
    screen.getByRole("button", { name: "2" }).focus()

    fireEvent.keyDown(window, { key: "Enter" })

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("10")
    expect(screen.getAllByTestId("calculator-history-item")).toHaveLength(1)
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/calc/__tests__/components/calculator-modal.test.tsx`
Expected: FAIL 3 test — Ctrl+C/Cmd+C (`expected false to be true`: handler gọi `preventDefault()` rồi `clear()`); Ctrl+'-'/'='/'0' (`expected false to be true`); Enter trên dòng lịch sử (`expected false to be true`, và `equals()` thêm dòng thứ 2). Test "Enter khi đang focus 1 phím số…" PASS sẵn (khoá hành vi phải giữ). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Bỏ qua phím có modifier và Enter trên dòng lịch sử**

3.1. Trong `src/features/calc/components/calculator-modal.tsx`, trong `handleKeyDown`, thay

```tsx
      if (e.key === "Tab") {
        trapTab(e)
        return
      }
      if (e.key === "Enter" || e.key === "=") {
```

bằng

```tsx
      // Phím tắt của trình duyệt/hệ điều hành (Ctrl/Cmd+C copy kết quả, Ctrl+"-"/"="/"0" thu phóng
      // trang...) không phải phím của máy tính — để nguyên cho trình duyệt, không preventDefault.
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === "Tab") {
        trapTab(e)
        return
      }
      // Enter trên 1 dòng lịch sử đang focus là "bấm" dòng đó (nạp lại phép tính), không phải "=".
      // Chỉ bỏ qua đúng dòng lịch sử: nút Đóng được focus sẵn khi mở, và click chuột vào 1 phím cũng
      // làm phím đó focus — bỏ qua mọi nút sẽ làm Enter đóng máy tính hoặc bấm lại phím vừa click.
      if (
        e.key === "Enter" &&
        document.activeElement instanceof HTMLElement &&
        document.activeElement.closest("[data-calc-history-item]")
      ) {
        return
      }
      if (e.key === "Enter" || e.key === "=") {
```

(Escape vẫn đứng đầu `handleKeyDown` nên vẫn đóng máy tính dù có modifier.)

3.2. Trên nút dòng lịch sử (đang có `data-testid="calculator-history-item"`), thêm thuộc tính ngay sau dòng đó:

```tsx
                data-calc-history-item
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/calc/__tests__/components/calculator-modal.test.tsx`
Expected: PASS toàn bộ (kể cả "bàn phím thật: Enter ra kết quả giống nút '='", "bẫy Tab…" và "Escape gọi onOpenChange(false)")

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **B.1**, **B.2** ở "Kiểm tra tay" của Task 19):

```bash
git add src/features/calc/components/calculator-modal.tsx src/features/calc/__tests__/components/calculator-modal.test.tsx
git commit -m "fix: let browser shortcuts and Enter on a history row through the calculator"
```

---

### Task 16: Bấm 2 phép tính liền nhau thì phép sau thay phép trước; kết quả rất lớn không ra dạng mũ

**Files:**
- Modify: `src/features/calc/calc-engine.ts` (`toMachineString`, chặn `**`/`/*`/`*/`/`//` trong `evalExpr`)
- Modify: `src/features/calc/hooks/use-calculator.ts` (hàm cấp module mới `appendToken`, dòng `const next = ...` trong `push`)
- Test: `src/features/calc/__tests__/calc-engine.test.ts`, `src/features/calc/__tests__/components/calculator-modal.test.tsx`

**Interfaces:**
- Consumes: `CalculatorModal` của Task 15 (không đổi gì thêm ở modal).
- Produces: `evalExpr(raw)` trả `null` khi chuỗi đã lọc có `**`, `/*`, `*/` hoặc `//` (lưới an toàn cho mọi đường nhập, kể cả chuỗi cũ còn trong lịch sử). `toMachineString(n)` không bao giờ ra dạng mũ (in đủ chữ số, không dấu ngăn nghìn, tối đa 6 chữ số lẻ, `-0` → `"0"`). `use-calculator.ts`: hàm nội bộ `appendToken(expr: string, t: string): string` — `t` và ký tự cuối của `expr` đều là phép tính (`+ − × ÷`) thì phép sau THAY phép trước; riêng "−" sau "×"/"÷" được giữ để nhập số âm (`5×−2`); đang có cụm "×−"/"÷−" mà bấm thêm "−" thì giữ nguyên, bấm phép khác thì thay cả cụm. Bàn phím thật (`*`, `/`, `-` đã được quy về `× ÷ −`) đi cùng đường `push` nên cũng được áp. Phần test phép tính lặp và số rất lớn của `area-shell-auth-calc#12` nằm ở task này.

- [ ] **Step 1: Viết test thất bại**

1.1. Thêm vào cuối `src/features/calc/__tests__/calc-engine.test.ts`:

```ts
describe("evalExpr - phép tính bấm lặp không bị hiểu thành cú pháp JS khác", () => {
  it("'××' không thành luỹ thừa JS: 5××2 -> null (không phải 25)", () => {
    expect(evalExpr("5××2")).toBeNull()
  })

  it("'÷×' / '×÷' không mở/đóng comment JS: 5÷×2×÷+3 -> null (không phải 8)", () => {
    expect(evalExpr("5÷×2×÷+3")).toBeNull()
  })

  it("vẫn nhân/chia được với số âm: 5×−2 = -10, 10÷−4 = -2.5", () => {
    expect(evalExpr("5×−2")).toBe(-10)
    expect(evalExpr("10÷−4")).toBe(-2.5)
  })
})

describe("toMachineString - số rất lớn", () => {
  it("không bao giờ ra dạng mũ: 1e22 -> '10000000000000000000000'", () => {
    expect(toMachineString(1e22)).toBe("10000000000000000000000")
    expect(toMachineString(1.5e22)).toBe("15000000000000000000000")
  })

  it("kết quả rất lớn nạp lại rồi tính tiếp vẫn đúng: 1e22 + 1 không ra 24", () => {
    expect(evalExpr(toMachineString(1e22) + "+1")).toBe(1e22 + 1)
  })

  it("số 0 âm vẫn ra '0'", () => {
    expect(toMachineString(-0)).toBe("0")
  })
})
```

1.2. Thêm vào cuối `describe("CalculatorModal", ...)` trong `src/features/calc/__tests__/components/calculator-modal.test.tsx`:

```tsx
  it("bấm 2 phép tính liền nhau thì phép sau thay phép trước: 5 × × 2 = 10, 5 ÷ × 2 = 10", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["5", "×", "×", "2", "="])
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("10")

    click("Xoá hết")
    type(["5", "÷", "×", "2"])
    expect(screen.getByTestId("calculator-expr")).toHaveTextContent("5×2")
    click("=")
    expect(screen.getByTestId("calculator-result")).toHaveTextContent("10")
  })

  it("vẫn nhập được số âm sau × hoặc ÷: 5 × − 2 = -10", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    type(["5", "×", "−", "2", "="])

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("-10")
  })

  it("bàn phím thật: gõ '*' 2 lần cũng chỉ là 1 phép nhân", () => {
    render(<CalculatorModal open onOpenChange={vi.fn()} />)

    for (const key of ["5", "*", "*", "2"]) fireEvent.keyDown(window, { key })
    fireEvent.keyDown(window, { key: "Enter" })

    expect(screen.getByTestId("calculator-result")).toHaveTextContent("10")
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/calc/__tests__/calc-engine.test.ts src/features/calc/__tests__/components/calculator-modal.test.tsx`
Expected: FAIL 6 test — `5××2` (`expected 25 to be null`); `5÷×2×÷+3` (`expected 8 to be null`); `toMachineString(1e22)` (`expected '1e+22' to be '10000000000000000000000'`); `1e22 + 1` (`expected 24 to be 1e+22`); 2 test modal "bấm 2 phép tính liền nhau…" (kết quả "25") và "gõ '*' 2 lần…" (kết quả "25"). PASS sẵn: "vẫn nhân/chia được với số âm…", "số 0 âm vẫn ra '0'" (`String(-0)` là "0"), "vẫn nhập được số âm sau ×…" — khoá hành vi phải giữ. Mọi test cũ vẫn PASS (kể cả "1+1//comment" → null).

- [ ] **Step 3: `calc-engine.ts` — chặn cặp ký hiệu JS và bỏ dạng mũ**

3.1. Trong `src/features/calc/calc-engine.ts`, thay hàm

```ts
function toMachineString(n: number): string {
  return String(round6(n)).replace(".", ",")
}
```

bằng

```ts
function toMachineString(n: number): string {
  // String() đổi sang dạng mũ khi |n| ≥ 1e21 ("1e+22"), mà evalExpr lọc mất chữ "e" rồi cộng phần
  // định trị với số mũ (1e22 + 1 = 24) — in đủ chữ số, không dấu ngăn nghìn, tối đa 6 chữ số lẻ.
  // `|| 0` đổi -0 thành 0 (toLocaleString in -0 thành "-0").
  return (round6(n) || 0)
    .toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 6 })
    .replace(".", ",")
}
```

3.2. Trong `evalExpr`, thay dòng

```ts
  if (!clean) return null
```

bằng

```ts
  // "**" là luỹ thừa JS (5××2 = 25), "/*" và "*/" mở/đóng comment JS (5÷×2×÷+3 = 8), "//" là comment
  // tới hết dòng — không cặp nào là phép tính người dùng định gõ. use-calculator đã thay phép tính
  // bấm lặp; đây là lưới an toàn cho mọi đường nhập còn lại.
  if (!clean || /\*\*|\/\*|\*\/|\/\//.test(clean)) return null
```

- [ ] **Step 4: `use-calculator.ts` — phép sau thay phép trước**

4.1. Trong `src/features/calc/hooks/use-calculator.ts`, thêm ngay sau dòng `const MAX_HISTORY = 4`:

```ts

const OPERATORS = ["+", "−", "×", "÷"]

/**
 * Nối 1 phím vào biểu thức. Bấm 2 phép tính liền nhau thì phép sau THAY phép trước (như máy tính
 * điện thoại) — nối thẳng thì "××" thành luỹ thừa JS và "÷×" mở comment JS. Riêng "−" sau "×"/"÷"
 * được giữ để nhập số âm (5×−2); đang có cụm "×−"/"÷−" thì thêm "−" nữa không đổi gì, còn phép khác
 * thay cả cụm.
 */
function appendToken(expr: string, t: string): string {
  const last = expr.slice(-1)
  if (!OPERATORS.includes(t) || !OPERATORS.includes(last)) return expr + t
  if (/[×÷]−$/.test(expr)) return t === "−" ? expr : expr.slice(0, -2) + t
  if (t === "−" && (last === "×" || last === "÷")) return expr + t
  return expr.slice(0, -1) + t
}
```

(`OPERATORS` là mảng nên `includes("")` của biểu thức rỗng trả `false` — khác `String.prototype.includes("")` luôn `true`.)

4.2. Trong `push`, thay dòng

```ts
      const next = fresh ? (t === "," ? "0," : t) : expr + t
```

bằng

```ts
      const next = fresh ? (t === "," ? "0," : t) : appendToken(expr, t)
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/calc/__tests__/calc-engine.test.ts src/features/calc/__tests__/components/calculator-modal.test.tsx`
Expected: PASS toàn bộ (kể cả "chuỗi trả về nạp lại được vào evalExpr đúng giá trị ban đầu", "bấm '=' xong bấm tiếp 1 phép tính → nối tiếp từ kết quả cũ" và "800+200×2 = 1.200")

- [ ] **Step 6: Commit**

Tự review `git diff` của task rồi commit (mục **B.3**, **B.4** ở "Kiểm tra tay" của Task 19):

```bash
git add src/features/calc/calc-engine.ts src/features/calc/hooks/use-calculator.ts src/features/calc/__tests__/calc-engine.test.ts src/features/calc/__tests__/components/calculator-modal.test.tsx
git commit -m "fix: replace a repeated calculator operator and keep huge results out of exponent form"
```

---

### Task 17: Máy tính + nút Ẩn số tiền còn khi bất kỳ module có tiền nào bật; ghi `hide-money` lỗi không làm sập app (Quyết định 7)

**Files:**
- Modify: `src/app/(app)/_components/sidebar.tsx` (hằng mới `MONEY_MODULE_KEYS`, dòng `showMoneyTools`)
- Modify: `src/lib/money-visibility-storage.ts` (`setHideMoney`)
- Modify: `src/components/money-visibility-provider.tsx` (`toggle`)
- Create: `src/lib/__tests__/money-visibility-storage.test.ts`, `src/components/__tests__/money-visibility-provider.test.tsx`
- Test: `src/app/(app)/_components/__tests__/sidebar.test.tsx`

**Interfaces:**
- Consumes: `isModuleOn(key)` sẵn có trong `Sidebar`; mọi thay đổi của Plan 1b (`clearSyncSecret()` trong `handleLogout`) và Plan 5 (class layout, `SidebarActionButton` 44px) ở `sidebar.tsx` giữ nguyên — task này chỉ thêm 1 hằng và đổi 1 dòng.
- Produces: `MONEY_MODULE_KEYS = ["taichinh", "chitieu", "muctieu"] as const` (cấp module trong `sidebar.tsx`); `showMoneyTools = MONEY_MODULE_KEYS.some((key) => isModuleOn(key))` — 2 công cụ chỉ ẩn khi cả 3 module đều tắt (đảo lại lựa chọn của commit 0098df5). Thanh trên điện thoại vẫn tối đa 3 nút như hiện tại (Plan 5 đã tính chỗ cho đúng 3 nút). `setHideMoney(hidden)` nuốt lỗi ghi (bộ nhớ đầy/bị chặn); `MoneyVisibilityProvider.toggle` tính `next = !hidden`, `setHidden(next)` rồi mới ghi storage — NGOÀI updater của `setHidden` (updater phải thuần; React gọi lại nó lúc render).

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/app/(app)/_components/__tests__/sidebar.test.tsx`, thay nguyên test `"hides Máy tính and Ẩn số tiền when the Tài chính module is off"` bằng 2 test:

```tsx
  it("keeps Máy tính and Ẩn số tiền when Tài chính is off but Chi tiêu still shows money", () => {
    window.localStorage.setItem(
      "app-settings",
      JSON.stringify({
        modules: [
          { key: "taichinh", label: "Tài chính", hint: "", on: false },
          { key: "muctieu", label: "Mục tiêu", hint: "", on: false },
        ],
      })
    )

    render(<Sidebar />)

    expect(screen.getAllByLabelText("Máy tính").length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText("Ẩn số tiền").length).toBeGreaterThan(0)
  })

  it("hides Máy tính and Ẩn số tiền only when Tài chính, Chi tiêu and Mục tiêu are all off", () => {
    window.localStorage.setItem(
      "app-settings",
      JSON.stringify({
        modules: [
          { key: "taichinh", label: "Tài chính", hint: "", on: false },
          { key: "chitieu", label: "Chi tiêu", hint: "", on: false },
          { key: "muctieu", label: "Mục tiêu", hint: "", on: false },
        ],
      })
    )

    render(<Sidebar />)

    expect(screen.queryAllByLabelText("Máy tính")).toHaveLength(0)
    expect(screen.queryAllByLabelText("Ẩn số tiền")).toHaveLength(0)
  })
```

1.2. Tạo `src/lib/__tests__/money-visibility-storage.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { getHideMoney, setHideMoney } from "../money-visibility-storage"

describe("money-visibility-storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("remembers the hide-money choice", () => {
    setHideMoney(true)
    expect(getHideMoney()).toBe(true)

    setHideMoney(false)
    expect(getHideMoney()).toBe(false)
  })

  it("does not throw when the browser refuses the write (storage full or blocked)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError")
    })

    expect(() => setHideMoney(true)).not.toThrow()
  })
})
```

1.3. Tạo `src/components/__tests__/money-visibility-provider.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { MoneyVisibilityProvider, useMoneyVisibility } from "@/components/money-visibility-provider"

function ToggleProbe() {
  const { hidden, toggle } = useMoneyVisibility()
  return (
    <button type="button" onClick={toggle}>
      {hidden ? "Đang ẩn" : "Đang hiện"}
    </button>
  )
}

describe("MoneyVisibilityProvider", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("toggles and remembers the choice", async () => {
    render(
      <MoneyVisibilityProvider>
        <ToggleProbe />
      </MoneyVisibilityProvider>
    )

    fireEvent.click(await screen.findByRole("button", { name: "Đang hiện" }))

    expect(screen.getByRole("button", { name: "Đang ẩn" })).toBeInTheDocument()
    expect(window.localStorage.getItem("hide-money")).toBe("1")
  })

  it("keeps the app running and still hides amounts when saving the choice fails", async () => {
    render(
      <MoneyVisibilityProvider>
        <ToggleProbe />
      </MoneyVisibilityProvider>
    )
    const button = await screen.findByRole("button", { name: "Đang hiện" })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError")
    })

    fireEvent.click(button)

    expect(screen.getByRole("button", { name: "Đang ẩn" })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx" src/lib/__tests__/money-visibility-storage.test.ts src/components/__tests__/money-visibility-provider.test.tsx`
Expected: FAIL 3 test — "keeps Máy tính and Ẩn số tiền when Tài chính is off…" (`expected 0 to be greater than 0`); "does not throw when the browser refuses the write…" (`expected [Function] to not throw an error but 'QuotaExceededError: Quota exceeded' was thrown`); "keeps the app running…" (lỗi `QuotaExceededError` ném ra từ updater lúc render, cây bị gỡ nên không tìm thấy nút "Đang ẩn"). PASS sẵn: "hides … only when … all off", "remembers the hide-money choice", "toggles and remembers the choice". Mọi test cũ vẫn PASS (kể cả "toggles Ẩn số tiền and persists the choice" và test sidebar của Plan 1b/Plan 5).

- [ ] **Step 3: `showMoneyTools` theo 3 module có tiền**

Trong `src/app/(app)/_components/sidebar.tsx`:

- Thêm ngay sau khối `const NAV = [ ... ] as const`:

```tsx

// Máy tính và nút Ẩn/Hiện số tiền phục vụ mọi trang có số tiền (Tài chính, Chi tiêu, Mục tiêu và các
// thẻ tương ứng ở Tổng quan) — chỉ ẩn khi cả 3 module đều tắt, để không bao giờ kẹt "••••" ở /budget
// hay /goals mà không còn nút nào để hiện lại.
const MONEY_MODULE_KEYS = ["taichinh", "chitieu", "muctieu"] as const
```

- Thay dòng

```tsx
  const showMoneyTools = isModuleOn("taichinh")
```

bằng

```tsx
  const showMoneyTools = MONEY_MODULE_KEYS.some((key) => isModuleOn(key))
```

- [ ] **Step 4: Ghi `hide-money` an toàn, ngoài updater**

4.1. Trong `src/lib/money-visibility-storage.ts`, thay hàm

```ts
function setHideMoney(hidden: boolean) {
  window.localStorage.setItem(HIDE_MONEY_STORAGE_KEY, hidden ? "1" : "0")
}
```

bằng

```ts
function setHideMoney(hidden: boolean) {
  try {
    window.localStorage.setItem(HIDE_MONEY_STORAGE_KEY, hidden ? "1" : "0")
  } catch {
    // Bộ nhớ đầy hoặc bị chặn: chỉ mất việc nhớ lựa chọn cho lần tải sau — nút vẫn ẩn/hiện được ngay.
  }
}
```

4.2. Trong `src/components/money-visibility-provider.tsx`, thay hàm

```tsx
  function toggle() {
    setHidden((prev) => {
      const next = !prev
      setHideMoney(next)
      return next
    })
  }
```

bằng

```tsx
  function toggle() {
    // Ghi storage NGOÀI updater của setHidden: updater phải thuần (React gọi lại nó lúc render, và 1
    // lần ghi lỗi trong đó từng làm sập cả cây — không có error boundary nào bắt).
    const next = !hidden
    setHidden(next)
    setHideMoney(next)
  }
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run "src/app/(app)/_components/__tests__/sidebar.test.tsx" src/lib/__tests__/money-visibility-storage.test.ts src/components/__tests__/money-visibility-provider.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 6: Commit**

Tự review `git diff` của task rồi commit (mục **B.5** ở "Kiểm tra tay" của Task 19):

```bash
git add "src/app/(app)/_components/sidebar.tsx" src/lib/money-visibility-storage.ts src/components/money-visibility-provider.tsx "src/app/(app)/_components/__tests__/sidebar.test.tsx" src/lib/__tests__/money-visibility-storage.test.ts src/components/__tests__/money-visibility-provider.test.tsx
git commit -m "fix: keep the money tools while any money module is on and never crash on a failed hide-money write"
```

---

### Task 18: Đã đăng nhập mà mở /login thì về Tổng quan; test khoá "khoá nhập sai vẫn còn sau tải lại"

**Files:**
- Modify: `src/components/auth-guard.tsx` (nhánh `PUBLIC_PATHS` trong effect)
- Test: `src/components/__tests__/auth-guard.test.tsx`, `src/lib/__tests__/use-attempt-lockout.test.ts`

**Interfaces:**
- Consumes: `getStoredUser()` từ `@/lib/auth`, `useRouter().replace` từ `next/navigation` (cả 2 đã dùng sẵn trong file; `router.replace(href)` điều hướng mà không thêm mục lịch sử — `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`).
- Produces: `AuthGuard` ở `/login` mà đã có `auth-user` → `router.replace("/overview")` và giữ màn chờ (không hiện form), nên cả mở thẳng `/login` lẫn bấm Back sau khi đăng nhập đều không bắt nhập lại mật khẩu (và không có lần gõ sai nào cộng vào khoá 5 lần). Chưa đăng nhập thì `/login` hiện form như cũ. `useAttemptLockout` không đổi code — chỉ thêm 2 test khoá hành vi đọc `lockedUntil` từ storage sau khi mount lại (phần "khoá qua tải lại" của `area-shell-auth-calc#12`).

- [ ] **Step 1: Viết test**

1.1. Thêm vào cuối `describe("AuthGuard", ...)` trong `src/components/__tests__/auth-guard.test.tsx` (`replace`, biến `pathname`, `setStoredUser` có sẵn):

```tsx
  it("sends an already signed-in user from /login to /overview instead of showing the form again", async () => {
    pathname = "/login"
    setStoredUser({ email: "a@b.com" })

    render(
      <AuthGuard>
        <div>login page</div>
      </AuthGuard>
    )

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/overview"))
    expect(screen.queryByText("login page")).not.toBeInTheDocument()
  })
```

1.2. Thêm vào cuối `describe("useAttemptLockout", ...)` trong `src/lib/__tests__/use-attempt-lockout.test.ts`:

```ts
  it("stays locked after a reload while the stored lock has not expired yet", async () => {
    window.localStorage.setItem(
      "reload-lockout-test",
      JSON.stringify({ attempts: MAX_ATTEMPTS, lockedUntil: Date.now() + 5 * 60 * 1000 })
    )

    // Mount mới = tải lại trang: trạng thái chỉ có thể đến từ localStorage.
    const { result } = renderHook(() => useAttemptLockout("reload-lockout-test"))

    await waitFor(() => expect(result.current.isLocked).toBe(true))
    expect(result.current.remainingAttempts).toBe(0)
  })

  it("starts unlocked after a reload once the stored lock has expired", async () => {
    window.localStorage.setItem(
      "reload-lockout-test",
      JSON.stringify({ attempts: MAX_ATTEMPTS, lockedUntil: Date.now() - 1000 })
    )

    const { result } = renderHook(() => useAttemptLockout("reload-lockout-test"))

    await waitFor(() => expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS))
    expect(result.current.isLocked).toBe(false)
  })
```

- [ ] **Step 2: Chạy test — test AuthGuard FAIL, 2 test khoá PASS ngay**

Run: `npx vitest run src/components/__tests__/auth-guard.test.tsx src/lib/__tests__/use-attempt-lockout.test.ts`
Expected: FAIL đúng 1 test — "sends an already signed-in user from /login…" (`expected "spy" to be called with arguments: [ '/overview' ]`, và "login page" vẫn hiện). 2 test mới của `useAttemptLockout` PASS ngay (code đúng sẵn; chúng khoá hành vi để 1 lần sửa `readState` sau này không âm thầm mở khoá khi tải lại). Kiểm chứng chúng bắt được lỗi: tạm đổi điều kiện `parsed.lockedUntil <= Date.now()` trong `readState` (`src/lib/use-attempt-lockout.ts`) thành `parsed.lockedUntil > Date.now()` → chạy lại lệnh trên → "stays locked after a reload…" FAIL → hoàn tác bằng `git checkout src/lib/use-attempt-lockout.ts` (file này không thuộc diff của task).

- [ ] **Step 3: `AuthGuard` đưa người đã đăng nhập khỏi /login**

Trong `src/components/auth-guard.tsx`, thay

```tsx
    if (PUBLIC_PATHS.includes(pathname)) {
      setChecked(true)
      return
    }
```

bằng

```tsx
    if (PUBLIC_PATHS.includes(pathname)) {
      // Đã đăng nhập mà vẫn ở /login (gõ thẳng địa chỉ, hay bấm Back sau khi đăng nhập) thì về Tổng
      // quan — không bắt nhập lại mật khẩu, và không để lần gõ sai nào cộng vào khoá 5 lần. Giữ màn
      // chờ (checked=false) tới khi pathname đổi để không chớp form đăng nhập.
      if (getStoredUser()) {
        router.replace("/overview")
        return
      }
      setChecked(true)
      return
    }
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/components/__tests__/auth-guard.test.tsx src/lib/__tests__/use-attempt-lockout.test.ts src/features/login/__tests__/components/login-form.test.tsx`
Expected: PASS toàn bộ (kể cả "never redirects while already on /login" — chưa đăng nhập nên vẫn hiện form)

- [ ] **Step 5: Commit**

Tự review `git diff` của task (chỉ `auth-guard.tsx` và 2 file test) rồi commit (mục **B.6** ở "Kiểm tra tay" của Task 19):

```bash
git add src/components/auth-guard.tsx src/components/__tests__/auth-guard.test.tsx src/lib/__tests__/use-attempt-lockout.test.ts
git commit -m "fix: send a signed-in user away from /login and cover lockout persistence across reloads"
```

---

### Task 19: Checkpoint nhánh 2 — tsc, lint, toàn bộ test, kiểm tra tay

**Files:** không sửa file nào (nếu 1 bước dưới đây fail: quay về đúng task gây lỗi, sửa, chạy lại test của task đó, commit `fix: ...` riêng trên nhánh này).

**Interfaces:**
- Consumes: toàn bộ Task 15–18.
- Produces: nhánh `fix/small-bugs-calc` sạch tsc/lint/test, sẵn sàng cho chủ repo kiểm tra tay rồi merge vào `developer`.

- [ ] **Step 1: Kiểm kiểu**

Run: `npx tsc --noEmit`
Expected: không lỗi (exit 0) — đặc biệt ở `MONEY_MODULE_KEYS.some(...)`, `toggle` của provider và `appendToken`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error, 0 warning mới. `toggle` đọc `hidden` của lần render hiện tại là cố ý (không dùng updater có tác dụng phụ) — không cần thêm gì.

- [ ] **Step 3: Toàn bộ test**

Run: `npm run test`
Expected: PASS toàn bộ suite (mọi test cũ + test mới của Task 15–18).

- [ ] **Step 4: Tự review diff cả nhánh**

Run: `git diff developer --stat` rồi `git diff developer -- src/`
Kiểm: `sidebar.tsx` chỉ khác đúng hằng `MONEY_MODULE_KEYS` + dòng `showMoneyTools` (còn nguyên `clearSyncSecret()` của Plan 1b và class layout của Plan 5); `use-attempt-lockout.ts` không đổi; không đụng `/sandbox`, `auto-backup.tsx`, `EXPORT_VERSION`.

### Kiểm tra tay

Chạy `npm run dev`, đăng nhập như thường. Các mục dưới không sửa dữ liệu nào ngoài công tắc module (mục B.5 trả lại như cũ).

- [ ] **B.1 Phím tắt trình duyệt trong máy tính (Task 15)** — mở Máy tính (nút máy tính ở sidebar), gõ `12+3` rồi Enter → hiện `15`. Bôi đen số `15` ở dòng kết quả → Ctrl+C (Cmd+C trên Mac) → kết quả vẫn `15`, biểu thức không bị xoá; dán (Ctrl+V) vào ô tìm kiếm của trình duyệt → ra `15`. Ctrl+`-` rồi Ctrl+`=` rồi Ctrl+`0` → trang thu nhỏ/phóng to/về 100% như bình thường, biểu thức không mọc thêm `−` hay `0`, không thêm dòng lịch sử.
- [ ] **B.2 Enter trên dòng lịch sử (Task 15)** — trên màn hình cao hơn 640px (khung lịch sử chỉ hiện từ cỡ đó): tính `1+1` Enter, rồi `2+2` Enter. Bấm Tab nhiều lần tới dòng lịch sử "1+1 = 2" (viền focus hiện quanh dòng) → Enter → biểu thức thành `2` (nạp lại dòng đó), lịch sử KHÔNG thêm dòng mới. Bấm vào phím `5` bằng chuột rồi gõ `+3` và Enter → ra `8` (Enter vẫn là "=").
- [ ] **B.3 Bấm lặp phép tính (Task 16)** — bấm `5` `×` `×` `2` `=` → `10` (không phải `25`). Bấm `C`, rồi `5` `÷` `×` `2` → dòng biểu thức hiện `5×2`, `=` → `10`. Bấm `C`, rồi `5` `×` `−` `2` `=` → `-10`. Gõ phím thật `5` `*` `*` `2` Enter → `10`.
- [ ] **B.4 Số rất lớn (Task 16)** — gõ `999999999999` `×` `999999999999` `=` → kết quả hiện đủ chữ số (`999.999.999.998.000.000.000.000`); bấm tiếp `+` `1` `=` → kết quả vẫn quanh `999.999.999.998.000.000.000.000` (không phải `33,99…`). Bấm vào dòng lịch sử của phép nhân rồi `+1` `=` → như trên.
- [ ] **B.5 Công cụ tiền theo module (Task 17)** — bấm nút mắt để ẩn số tiền ("••••••••" khắp nơi). Cài đặt → "Module hiển thị": tắt "Tài chính" (giữ "Chi tiêu") → nút Máy tính và nút mắt vẫn còn ở sidebar (desktop) và thanh trên (điện thoại, thu cửa sổ < 768px); `/budget` vẫn che số; bấm nút mắt → số hiện lại. Tắt thêm "Chi tiêu" và "Mục tiêu" → 2 nút biến mất. Bật lại cả 3 module như cũ (và trả nút mắt về trạng thái quen dùng).
- [ ] **B.6 /login khi đã đăng nhập (Task 18)** — đang đăng nhập, gõ thẳng địa chỉ `/login` → về ngay `/overview`, không thấy form đăng nhập. Đăng xuất, đăng nhập lại, rồi bấm Back của trình duyệt → không quay lại form đăng nhập (về `/overview`).

- [ ] **Step 5: Báo lại để duyệt**

Báo chủ repo: kết quả Step 1–4, kết quả từng mục B.1–B.6, danh sách commit trên `fix/small-bugs-calc`. Chỉ merge vào `developer` khi chủ repo duyệt (CLAUDE.md mục 5); không `git push` nếu chủ repo chưa yêu cầu. Nhánh 3 chỉ tách sau khi nhánh này đã merge.

---

## Nhánh 3 — `fix/small-bugs-settings` (Task 20–25)

Tách nhánh (sau khi `fix/small-bugs-calc` đã merge): `git checkout developer && git pull --ff-only 2>/dev/null; git checkout -b fix/small-bugs-settings` (bỏ qua `git pull` nếu repo không có remote).

### Task 20: Tên file xuất theo ngày giờ máy; secret có ký tự ngoài Latin-1 được báo đúng lỗi

**Files:**
- Modify: `src/features/settings/data-transfer.ts` (import `dayKey`, hàm `exportFileName`)
- Modify: `src/features/settings/api.ts` (hằng `SECRET_CHARSET_ERROR`, hàm nội bộ `hasUnsendableChar`, dòng đầu `pushSnapshot`/`pullSnapshot`, khối export)
- Create: `src/features/settings/__tests__/api.test.ts`
- Test: `src/features/settings/__tests__/data-transfer.test.ts`

**Interfaces:**
- Consumes: `dayKey(d?: Date): string` từ `@/lib/date` (ngày theo giờ máy, `YYYY-MM-DD`); các thay đổi của Plan 1b trong `data-transfer.ts` (`parseImportPayload` dùng các hàm `parse*`, `ImportResult` nhánh ok có `exportedAt`) và trong `api.ts` (giữ nguyên — task này chỉ thêm 1 dòng chặn ở đầu 2 hàm).
- Produces: `exportFileName(exportedAt: string): string` giữ chữ ký, tên file mang NGÀY THEO GIỜ MÁY của thời điểm xuất (`orange-banana-${dayKey(new Date(exportedAt))}.json`); `exportedAt` trong file vẫn là ISO như cũ. `SECRET_CHARSET_ERROR` (export mới của `api.ts`); `pushSnapshot`/`pullSnapshot` trả `{ ok: false, error: SECRET_CHARSET_ERROR }` — không gọi `fetch` — khi secret có ký tự mã > 255 (header HTTP chỉ nhận Latin-1). `useDataManagement` (Plan 1b) đưa thẳng `error` này lên banner như mọi lỗi khác.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/settings/__tests__/data-transfer.test.ts`, thay nguyên khối

```ts
describe("exportFileName", () => {
  it("uses the date portion of the export timestamp", () => {
    expect(exportFileName("2026-08-14T09:00:00.000Z")).toBe("orange-banana-2026-08-14.json")
  })
})
```

bằng

```ts
describe("exportFileName", () => {
  it("names the file after the local day of the export", () => {
    const exportedAt = new Date(2026, 7, 14, 16, 0).toISOString()

    expect(exportFileName(exportedAt)).toBe("orange-banana-2026-08-14.json")
  })

  it("uses the local day even before 07:00 in Vietnam, when the UTC date is still yesterday", () => {
    // 06:30 sáng 28/09 theo giờ máy = 23:30 ngày 27/09 UTC khi máy đặt giờ Việt Nam (UTC+7).
    const exportedAt = new Date(2026, 8, 28, 6, 30).toISOString()

    expect(exportFileName(exportedAt)).toBe("orange-banana-2026-09-28.json")
  })
})
```

(Cả 2 test dựng thời điểm từ giờ máy nên đúng ở mọi múi giờ; test thứ 2 chỉ đỏ trước bản sửa khi máy chạy test ở múi giờ đi trước UTC từ 6,5 giờ trở lên — máy của chủ repo là UTC+7.)

1.2. Tạo `src/features/settings/__tests__/api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { pullSnapshot, pushSnapshot, SECRET_CHARSET_ERROR } from "../api"
import type { ExportPayload } from "../data-transfer"

// Các test chặn secret không bao giờ tới fetch, nên payload chỉ cần đúng kiểu.
const PAYLOAD = { version: 1, exportedAt: "2026-09-28T00:00:00.000Z" } as unknown as ExportPayload

describe("api — secret có ký tự ngoài Latin-1", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("pushSnapshot explains the secret problem instead of reporting a network failure, without calling fetch", async () => {
    const result = await pushSnapshot("bí mật đồng bộ", PAYLOAD)

    expect(result).toEqual({ ok: false, error: SECRET_CHARSET_ERROR })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("pullSnapshot does the same", async () => {
    const result = await pullSnapshot("bí mật đồng bộ")

    expect(result).toEqual({ ok: false, error: SECRET_CHARSET_ERROR })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("still sends a secret whose characters all fit in a header (Latin-1, vd. 'é')", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ summary: "Đã lưu" }) })

    const result = await pushSnapshot("café-secret", PAYLOAD)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ ok: true, summary: "Đã lưu" })
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/data-transfer.test.ts src/features/settings/__tests__/api.test.ts`
Expected: FAIL 3 test — "uses the local day even before 07:00…" (`expected 'orange-banana-2026-09-27.json' to be 'orange-banana-2026-09-28.json'` trên máy UTC+7); 2 test chặn secret (`fetchMock` đã được gọi, và kết quả là `{ ok: false, error: 'Không kết nối được máy chủ đồng bộ.' }` thay vì lỗi secret — `SECRET_CHARSET_ERROR` chưa có nên là `undefined`). PASS sẵn: "names the file after the local day of the export" và "still sends a secret whose characters all fit…". Mọi test cũ vẫn PASS.

- [ ] **Step 3: Tên file theo ngày giờ máy**

3.1. Trong `src/features/settings/data-transfer.ts`, thêm dòng import ngay sau dòng import cuối cùng của nhóm import đầu file:

```ts
import { dayKey } from "@/lib/date"
```

3.2. Thay hàm

```ts
function exportFileName(exportedAt: string): string {
  return `orange-banana-${exportedAt.slice(0, 10)}.json`
}
```

bằng

```ts
function exportFileName(exportedAt: string): string {
  // Ngày theo giờ máy (như mọi chỗ khác trong app), không theo UTC: trước 7:00 sáng giờ Việt Nam,
  // exportedAt.slice(0, 10) còn là ngày hôm qua — 2 bản sao khác ngày có thể trùng tên.
  return `orange-banana-${dayKey(new Date(exportedAt))}.json`
}
```

- [ ] **Step 4: Chặn secret không gửi được trước khi gọi `fetch`**

4.1. Trong `src/features/settings/api.ts`, thêm ngay sau dòng `type PushResult = ...`:

```ts

// Header HTTP chỉ nhận ký tự có mã ≤ 255 (Latin-1): secret có "ậ", "ồ", "đ"... làm fetch ném TypeError
// trước khi kịp gửi, và lỗi đó từng bị báo nhầm thành "Không kết nối được máy chủ đồng bộ.".
const SECRET_CHARSET_ERROR =
  "Secret đồng bộ có ký tự không gửi được (chữ có dấu như ậ, ồ, đ). Hãy dùng đúng chuỗi SYNC_SECRET đã đặt trên Vercel."

function hasUnsendableChar(secret: string): boolean {
  return Array.from(secret).some((char) => (char.codePointAt(0) ?? 0) > 255)
}
```

4.2. Ngay dòng đầu thân hàm `pushSnapshot` (trước `try {`), thêm:

```ts
  if (hasUnsendableChar(secret)) return { ok: false, error: SECRET_CHARSET_ERROR }
```

và ngay dòng đầu thân hàm `pullSnapshot` (trước `try {`), thêm đúng dòng đó.

4.3. Đổi dòng export cuối file thành (giữ mọi tên Plan 1b đã thêm nếu có):

```ts
export { pushSnapshot, pullSnapshot, SECRET_CHARSET_ERROR, type PushResult }
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/data-transfer.test.ts src/features/settings/__tests__/api.test.ts src/features/settings/__tests__/hooks/use-data-management.test.ts src/features/settings/__tests__/components/data-card.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 6: Commit**

Tự review `git diff` của task rồi commit (mục **C.1**, **C.2** ở "Kiểm tra tay" của Task 25):

```bash
git add src/features/settings/data-transfer.ts src/features/settings/api.ts src/features/settings/__tests__/data-transfer.test.ts src/features/settings/__tests__/api.test.ts
git commit -m "fix: name backups by local date and flag a sync secret that cannot be sent"
```

---

### Task 21: Không thêm được tâm trạng trùng tên; cặp trùng hẳn tên đã lưu được đổi thành "Tên (2)"

**Files:**
- Modify: `src/features/settings/hooks/use-settings.ts` (`addMood`)
- Modify: `src/lib/settings-storage.ts` (hàm mới `dedupeMoodLabels`, dòng `moods:` trong `parseAppSettings`)
- Modify: `src/features/settings/components/add-mood-form.tsx` (prop `existingLabels`, biến `duplicate`, Field "Tên", nút Thêm)
- Modify: `src/features/settings/components/moods-card.tsx` (truyền `existingLabels`)
- Create: `src/features/settings/__tests__/components/moods-card.test.tsx`
- Test: `src/features/settings/__tests__/hooks/use-settings.test.ts`, `src/lib/__tests__/settings-storage.test.ts`

**Interfaces:**
- Consumes: `useSettings` của Plan 1a — mọi mutation mở đầu bằng `const current = getStoredSettings()` (đọc tươi), deps `[persist]`; `parseAppSettings` của Plan 1b (mood lọc từng phần tử qua `safeArray(moodSchema, ...)`).
- Produces: `addMood` từ chối tên đã có (so sau khi trim, không phân biệt hoa/thường) trên bản đọc tươi `current.moods`, bằng toast `Đã có tâm trạng tên "<tên>". Vui lòng chọn tên khác.` — không ghi gì, không toast thành công (hàm vẫn trả `void`). `AddMoodForm` có prop tuỳ chọn `existingLabels?: string[]` (mặc định `[]`): trùng → `Field invalid` + hint `Đã có tâm trạng tên này — chọn tên khác`, nút Thêm khoá, chữ đã gõ được giữ. `MoodsCard` truyền `moods.map((m) => m.label)`. Hàm nội bộ `dedupeMoodLabels(moods: Mood[]): Mood[]` trong `settings-storage.ts`: mood trùng CHÍNH XÁC tên với 1 mood đứng trước được đổi thành "Tên (2)", "Tên (3)"... khi đọc (localStorage, nhập file, tải xuống — cùng đi qua `parseAppSettings`), đúng cách Quyết định 1 của Plan 1a xử lý quỹ/thẻ. Nhật ký không phải đổi gì: vẫn so mood theo `label` (Plan 4 giữ snapshot mood của bài đã lưu). Task 22 tạo tiếp describe xoá mood trong `moods-card.test.tsx` (dùng lại `MOODS`).

- [ ] **Step 1: Viết test thất bại**

1.1. Thêm vào cuối `describe("useSettings", ...)` trong `src/features/settings/__tests__/hooks/use-settings.test.ts` (`DEFAULT_SETTINGS`, `SETTINGS_STORAGE_KEY`, `getStoredSettings`, `toast` đã import sẵn; `beforeEach` đã xoá localStorage và mock):

```ts
  it("refuses a mood whose name is already taken (ignoring case and spaces) and explains why", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))
    const countBefore = result.current.settings.moods.length

    act(() => {
      result.current.addMood({ label: " vui ", desc: "Trùng tên", emoji: "🥳" })
    })

    expect(toast.error).toHaveBeenCalledWith('Đã có tâm trạng tên "vui". Vui lòng chọn tên khác.')
    expect(toast.success).not.toHaveBeenCalled()
    expect(result.current.settings.moods).toHaveLength(countBefore)
    expect(getStoredSettings().moods).toHaveLength(countBefore)
  })

  it("checks the name against moods another tab just saved, not only this tab's copy", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))
    // Tab khác vừa thêm "Hào hứng" — chưa bắn sự kiện storage nên state của tab này chưa có.
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        moods: [
          ...DEFAULT_SETTINGS.moods,
          { label: "Hào hứng", emoji: "🥳", desc: "", tint: "#FFF0B8", on: true, score: 3 },
        ],
      })
    )

    act(() => {
      result.current.addMood({ label: "Hào hứng", desc: "", emoji: "🥳" })
    })

    expect(toast.error).toHaveBeenCalledWith('Đã có tâm trạng tên "Hào hứng". Vui lòng chọn tên khác.')
    expect(getStoredSettings().moods.filter((m) => m.label === "Hào hứng")).toHaveLength(1)
  })
```

1.2. Thêm vào cuối `describe("getStoredSettings", ...)` trong `src/lib/__tests__/settings-storage.test.ts`:

```ts
  it("renames a mood that exactly repeats an earlier mood's name, so the journal can tell them apart", () => {
    const vui = DEFAULT_SETTINGS.moods[1]
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, moods: [vui, { ...vui, emoji: "🥳", score: 3 }, { ...vui, emoji: "🤩" }] })
    )

    expect(getStoredSettings().moods.map((m) => m.label)).toEqual(["Vui", "Vui (2)", "Vui (3)"])
    expect(getStoredSettings().moods[1].emoji).toBe("🥳")
  })
```

1.3. Tạo `src/features/settings/__tests__/components/moods-card.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { DEFAULT_SETTINGS } from "@/lib/settings-storage"
import { MoodsCard } from "../../components/moods-card"

// "Tuyệt vời" (điểm 5) và "Vui" (điểm 4).
const MOODS = DEFAULT_SETTINGS.moods.slice(0, 2)

describe("MoodsCard — thêm tâm trạng", () => {
  it("blocks adding a mood whose name is already taken (ignoring case) and keeps what was typed", () => {
    const onAdd = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={vi.fn()} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm tâm trạng" }))
    fireEvent.change(screen.getByLabelText("Tên", { exact: false }), { target: { value: " vui" } })

    expect(screen.getByText("Đã có tâm trạng tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Tên", { exact: false })).toHaveValue(" vui")
  })

  it("still adds a mood with a new name", () => {
    const onAdd = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={vi.fn()} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm tâm trạng" }))
    fireEvent.change(screen.getByLabelText("Tên", { exact: false }), { target: { value: "Hào hứng" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAdd).toHaveBeenCalledWith({ label: "Hào hứng", desc: "Tâm trạng của riêng bạn", emoji: "🙂" })
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/hooks/use-settings.test.ts src/lib/__tests__/settings-storage.test.ts src/features/settings/__tests__/components/moods-card.test.tsx`
Expected: FAIL 4 test — 2 test `addMood` (`expected "spy" to be called with arguments: [ 'Đã có tâm trạng tên "vui". …' ]` — mood trùng được thêm, toast thành công); `getStoredSettings` (`expected [ 'Vui', 'Vui', 'Vui' ] to deeply equal [ 'Vui', 'Vui (2)', 'Vui (3)' ]`); "blocks adding a mood whose name is already taken…" (`Unable to find an element with the text: Đã có tâm trạng tên này — chọn tên khác`). "still adds a mood with a new name" PASS sẵn. Mọi test cũ vẫn PASS.

- [ ] **Step 3: `addMood` chặn tên trùng trên bản đọc tươi**

Trong `src/features/settings/hooks/use-settings.ts` (bản của Plan 1a), trong `addMood` thay

```ts
      const current = getStoredSettings()
      try {
        const tint = TINT_PALETTE[current.moods.length % TINT_PALETTE.length]
```

bằng

```ts
      const current = getStoredSettings()
      // Nhật ký nhận diện mood bằng tên — 2 mood trùng tên thì chip mới không bao giờ chọn riêng được
      // (bài lưu luôn lấy mood đầu tiên). So không phân biệt hoa/thường, sau khi bỏ dấu cách 2 đầu.
      const label = mood.label.trim()
      if (current.moods.some((m) => m.label.trim().toLowerCase() === label.toLowerCase())) {
        toast.error(`Đã có tâm trạng tên "${label}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        const tint = TINT_PALETTE[current.moods.length % TINT_PALETTE.length]
```

- [ ] **Step 4: Đổi tên cặp mood trùng hẳn tên khi đọc**

Trong `src/lib/settings-storage.ts` (bản của Plan 1b):

- Thêm ngay trước `function parseAppSettings(value: unknown): AppSettings {`:

```ts
// Nhật ký nhận diện mood bằng `label` — 2 mood trùng hẳn tên (thêm trước khi addMood chặn trùng, hay
// từ 1 file sao lưu cũ) không chọn riêng được. Giữ tên mục đầu, các mục sau thành "Tên (2)",
// "Tên (3)"... (đúng cách Plan 1a xử lý quỹ/thẻ trùng tên); người dùng tự đặt lại tên nếu muốn.
function dedupeMoodLabels(moods: Mood[]): Mood[] {
  const used = new Set<string>()
  return moods.map((mood) => {
    let label = mood.label
    for (let n = 2; used.has(label); n++) label = `${mood.label} (${n})`
    used.add(label)
    return label === mood.label ? mood : { ...mood, label }
  })
}

```

- Trong `parseAppSettings`, thay dòng

```ts
    moods: Array.isArray(parsed.moods) ? safeArray(moodSchema, parsed.moods) : DEFAULT_MOODS,
```

bằng

```ts
    moods: Array.isArray(parsed.moods) ? dedupeMoodLabels(safeArray(moodSchema, parsed.moods)) : DEFAULT_MOODS,
```

- [ ] **Step 5: `AddMoodForm` chặn trùng ngay khi gõ, `MoodsCard` truyền danh sách tên**

5.1. Trong `src/features/settings/components/add-mood-form.tsx`, thay

```tsx
interface AddMoodFormProps {
  onAdd: (mood: Omit<Mood, "tint" | "on" | "score">) => void
}

function AddMoodForm({ onAdd }: AddMoodFormProps) {
```

bằng

```tsx
interface AddMoodFormProps {
  onAdd: (mood: Omit<Mood, "tint" | "on" | "score">) => void
  // Tên các tâm trạng đang có — chặn trùng ngay ở form (không phân biệt hoa/thường) để giữ chữ đã gõ;
  // useSettings.addMood vẫn kiểm lại trên bản đọc tươi.
  existingLabels?: string[]
}

function AddMoodForm({ onAdd, existingLabels = [] }: AddMoodFormProps) {
```

Ngay trước `return (` của nhánh form đang mở (sau khối `if (!open) { ... }`), thêm:

```tsx
  const trimmedLabel = label.trim()
  const duplicate =
    trimmedLabel !== "" && existingLabels.some((l) => l.trim().toLowerCase() === trimmedLabel.toLowerCase())

```

Field "Tên" (có `label="Tên"`) thêm 2 prop ngay sau `onChange={(e) => setLabel(e.target.value)}`:

```tsx
          invalid={duplicate}
          hint={duplicate ? "Đã có tâm trạng tên này — chọn tên khác" : undefined}
```

và nút Thêm đổi `disabled={!label.trim()}` thành:

```tsx
          disabled={!trimmedLabel || duplicate}
```

5.2. Trong `src/features/settings/components/moods-card.tsx`, đổi `<AddMoodForm onAdd={onAdd} />` thành:

```tsx
      <AddMoodForm onAdd={onAdd} existingLabels={moods.map((m) => m.label)} />
```

- [ ] **Step 6: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/hooks/use-settings.test.ts src/lib/__tests__/settings-storage.test.ts src/features/settings/__tests__/components/moods-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx src/features/settings/__tests__/data-transfer.test.ts`
Expected: PASS toàn bộ (kể cả "adds a mood with a tint from the palette and persists it" với tên mới "Hào hứng", và test lỗi ghi của `addMood` — kiểm trùng đứng trước `try` nên không đụng nhánh lỗi ghi)

- [ ] **Step 7: Commit**

Tự review `git diff` của task rồi commit (mục **C.3** ở "Kiểm tra tay" của Task 25):

```bash
git add src/features/settings/hooks/use-settings.ts src/lib/settings-storage.ts src/features/settings/components/add-mood-form.tsx src/features/settings/components/moods-card.tsx src/features/settings/__tests__/hooks/use-settings.test.ts src/lib/__tests__/settings-storage.test.ts src/features/settings/__tests__/components/moods-card.test.tsx
git commit -m "fix: block duplicate mood names and rename exact duplicates already saved"
```

---

### Task 22: Xoá tâm trạng phải qua hộp xác nhận (Quyết định 8)

**Files:**
- Modify: `src/features/settings/components/moods-card.tsx` (import, state `deleting`, `onClick` nút thùng rác, `AlertDialog` mới)
- Test: `src/features/settings/__tests__/components/moods-card.test.tsx`

**Interfaces:**
- Consumes: `AlertDialog` (`@/components/ui/alert-dialog`: `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `destructive`, `onConfirm`); hằng `MOODS` trong `moods-card.test.tsx` (Task 21); prop `existingLabels` của `AddMoodForm` (Task 21) giữ nguyên.
- Produces: `MoodsCard` giữ state `deleting: { index: number; label: string } | null`; nút thùng rác chỉ mở hộp "Xoá tâm trạng?" (mô tả nhắc không lấy lại được màu/điểm cũ và "Muốn ẩn khỏi màn Nhật ký thì chỉ cần tắt công tắc."), `confirmLabel="Xoá"`, `destructive`; bấm "Xoá" mới gọi `onRemove(index)`; "Huỷ"/Esc/bấm ra ngoài thì không xoá. Mô tả chỉ là phrasing content (chữ + `<strong>`) — Plan 6b (`area-components-lib#14`, `aria-describedby`) dựa vào điều này. Props của `MoodsCard` không đổi.

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/features/settings/__tests__/components/moods-card.test.tsx` (sau `})` đóng describe của Task 21):

```tsx
describe("MoodsCard — xoá tâm trạng", () => {
  it("asks for confirmation instead of deleting on the first tap, and points to the switch for hiding", () => {
    const onRemove = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá Tuyệt vời" }))

    expect(screen.getByText("Xoá tâm trạng?")).toBeInTheDocument()
    expect(screen.getByText("Tuyệt vời", { selector: "strong" }).closest("p")).toHaveTextContent(
      "Muốn ẩn khỏi màn Nhật ký thì chỉ cần tắt công tắc."
    )
    expect(onRemove).not.toHaveBeenCalled()
  })

  it("deletes the chosen mood by its index once confirmed", () => {
    const onRemove = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá Vui" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemove).toHaveBeenCalledWith(1)
    expect(screen.queryByText("Xoá tâm trạng?")).not.toBeInTheDocument()
  })

  it("keeps the mood when the dialog is cancelled", () => {
    const onRemove = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá Vui" }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onRemove).not.toHaveBeenCalled()
    expect(screen.queryByText("Xoá tâm trạng?")).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/components/moods-card.test.tsx`
Expected: FAIL 3 test — "asks for confirmation…" (`Unable to find an element with the text: Xoá tâm trạng?`, và `onRemove` đã bị gọi ngay); "deletes the chosen mood…" (`Unable to find an accessible element with the role "button" and name "Xoá"`); "keeps the mood when the dialog is cancelled" (`… name "Huỷ"` — không có hộp nào mở, `onRemove` đã chạy ngay ở lần chạm đầu). 2 test của Task 21 vẫn PASS.

- [ ] **Step 3: Hộp xác nhận trước khi xoá**

Trong `src/features/settings/components/moods-card.tsx`:

- Thay 2 dòng import đầu

```tsx
"use client"

import { Trash2 } from "lucide-react"

import { Card } from "@/components/ui/card"
```

bằng

```tsx
"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
```

- Ngay sau dòng `function MoodsCard({ moods, onToggle, onRemove, onAdd }: MoodsCardProps) {` thêm:

```tsx
  // Xoá hỏi lại trước (như mọi nút xoá ở trang Tài chính): thêm lại qua "Thêm tâm trạng" luôn ra điểm
  // 3 và màu khác, nên xoá nhầm "Tuyệt vời" (điểm 5) là gợi ý chi tiêu–tâm trạng lệch mãi về sau.
  const [deleting, setDeleting] = useState<{ index: number; label: string } | null>(null)
```

- Ở nút thùng rác, thay

```tsx
              onClick={() => onRemove(i)}
```

bằng

```tsx
              onClick={() => setDeleting({ index: i, label: m.label })}
```

- Ngay sau dòng `<AddMoodForm onAdd={onAdd} existingLabels={moods.map((m) => m.label)} />` (Task 21), thêm:

```tsx
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xoá tâm trạng?"
        description={
          <>
            Xoá &quot;<strong>{deleting?.label}</strong>&quot; sẽ không thể hoàn tác — thêm lại sau cũng không lấy
            lại được màu và điểm tâm trạng cũ. Muốn ẩn khỏi màn Nhật ký thì chỉ cần tắt công tắc.
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deleting) onRemove(deleting.index)
        }}
      />
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/components/moods-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **C.4** ở "Kiểm tra tay" của Task 25):

```bash
git add src/features/settings/components/moods-card.tsx src/features/settings/__tests__/components/moods-card.test.tsx
git commit -m "fix: confirm before deleting a mood"
```

---

### Task 23: Hộp xác nhận xoá dữ liệu quên mật khẩu đã gõ mỗi khi đóng

**Files:**
- Modify: `src/features/settings/components/confirm-wipe-modal.tsx` (1 dòng ngay sau `useState` của `password`)
- Test: `src/features/settings/__tests__/components/confirm-wipe-modal.test.tsx`, `src/features/settings/__tests__/components/reset-card.test.tsx`

**Interfaces:**
- Consumes: không có gì từ task trước.
- Produces: `ConfirmWipeModal` khi `open === false` mà `password` còn chữ thì tự xoá về `""` ngay trong lần render đó (mẫu "điều chỉnh state trong render" có điều kiện, như `EditGoldStoreModal`/`ResetCard` đang dùng) — áp cho mọi đường đóng: nút "Huỷ" của hộp, Esc, bấm ra ngoài, hay nơi cha tự đặt `open={false}`. Props không đổi.

- [ ] **Step 1: Viết test thất bại**

1.1. Thêm vào cuối `describe("ConfirmWipeModal", ...)` trong `src/features/settings/__tests__/components/confirm-wipe-modal.test.tsx` (`baseProps`, `MOCK_ACCOUNT` có sẵn):

```tsx
  it("forgets the typed password once closed, so reopening needs it typed again", () => {
    const props = baseProps()
    const { rerender } = render(<ConfirmWipeModal {...props} />)
    fireEvent.change(screen.getByLabelText("Mật khẩu", { exact: false }), {
      target: { value: MOCK_ACCOUNT.password },
    })

    // Đóng (vd. bấm "Huỷ" → ResetCard đặt open=false, hộp vẫn mounted) rồi mở lại.
    rerender(<ConfirmWipeModal {...props} open={false} />)
    rerender(<ConfirmWipeModal {...props} open />)

    expect(screen.getByLabelText("Mật khẩu", { exact: false })).toHaveValue("")
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
  })
```

1.2. Trong `src/features/settings/__tests__/components/reset-card.test.tsx`, đổi dòng import RTL

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react"
```

thành

```tsx
import { act, fireEvent, render, screen, within } from "@testing-library/react"
```

rồi thêm vào cuối `describe("ResetCard", ...)` (`MOCK_ACCOUNT` có sẵn):

```tsx
  it("asks for the password again after the confirm dialog was cancelled", () => {
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={vi.fn()} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))
    fireEvent.change(screen.getByLabelText("Mật khẩu", { exact: false }), {
      target: { value: MOCK_ACCOUNT.password },
    })
    // Bấm "Huỷ" của hộp mật khẩu (thẻ phía sau cũng có 1 nút "Huỷ" riêng).
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Huỷ" }))

    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))

    expect(screen.getByLabelText("Mật khẩu", { exact: false })).toHaveValue("")
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/components/confirm-wipe-modal.test.tsx src/features/settings/__tests__/components/reset-card.test.tsx`
Expected: FAIL 2 test — `expected the element to have value: (empty) Received: <mật khẩu mock>` ở cả 2 (state `password` sống qua lần đóng vì hộp chỉ `return null`). Mọi test cũ vẫn PASS.

- [ ] **Step 3: Xoá mật khẩu mỗi khi hộp đóng**

Trong `src/features/settings/components/confirm-wipe-modal.tsx`, ngay sau dòng

```tsx
  const [password, setPassword] = useState("")
```

(và trước `if (!open) return null`) thêm:

```tsx
  // Hộp ở lại mounted khi đóng (ResetCard vẫn đứng ở bước 1): mỗi lần đóng — "Huỷ", Esc hay bấm ra
  // ngoài — xoá mật khẩu đã gõ, để lần mở sau vẫn phải gõ lại mới xoá được dữ liệu.
  if (!open && password !== "") setPassword("")
```

- [ ] **Step 4: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/components/confirm-wipe-modal.test.tsx src/features/settings/__tests__/components/reset-card.test.tsx src/features/settings/__tests__/components/settings-view.test.tsx`
Expected: PASS toàn bộ (kể cả "renders nothing when closed" — hộp đóng vẫn `return null`)

- [ ] **Step 5: Commit**

Tự review `git diff` của task rồi commit (mục **C.5** ở "Kiểm tra tay" của Task 25):

```bash
git add src/features/settings/components/confirm-wipe-modal.tsx src/features/settings/__tests__/components/confirm-wipe-modal.test.tsx src/features/settings/__tests__/components/reset-card.test.tsx
git commit -m "fix: clear the wipe password whenever the confirm dialog closes"
```

---

### Task 24: "Bắt đầu lại" nói đúng những gì sẽ bị xoá

**Files:**
- Modify: `src/features/settings/components/settings-view.tsx` (3 dòng lấy dữ liệu từ `useStudy`/`useBudget`/`useNetWorthHistory`, mảng `counts`)
- Modify: `src/features/settings/components/reset-card.tsx` (đoạn mô tả ở bước 0, câu khi `counts` rỗng ở bước 1)
- Test: `src/features/settings/__tests__/components/settings-view.test.tsx`, `src/features/settings/__tests__/components/reset-card.test.tsx`

**Interfaces:**
- Consumes: `useStudy()` trả `tasks` (đã qua `tasksForDay` của Plan 3), `learned`, `gameHighScores`, `gameStreak`, `wordReviews`; `useBudget()` trả `salaries`, `expenses`, `settlements`; `useNetWorthHistory()` trả `history`. `wipeData` (Plan 1b) xoá: nhật ký; tài chính trừ danh sách cửa hàng vàng; học tập; chi tiêu kể cả lương và tất toán; lịch sử tài sản; liên kết quỹ của mục tiêu mua xe; secret đồng bộ — KHÔNG đụng cài đặt (hồ sơ, tâm trạng, nhãn, module).
- Produces: `counts` của `SettingsView` đếm thêm (đúng thứ tự này, sau các mục cũ tương ứng): `tiến độ ôn N từ` (từ có `lastReviewedAt`), `điểm cao mini-game` (có điểm > 0), `chuỗi ngày chơi mini-game` (`gameStreak.count > 0`), `N tháng lương` (tháng có lương > 0), `N lần tất toán`, `N ngày lịch sử tài sản`. `ResetCard` bước 0 mô tả đúng phạm vi xoá (kể cả secret đồng bộ — nhắc theo yêu cầu của Plan 1b); bước 1 khi `counts` rỗng không còn câu "Không còn gì để xoá." mà nói phần còn lại vẫn bị xoá và vẫn khuyên xuất bản sao. `ResetCardProps` không đổi.

- [ ] **Step 1: Viết test thất bại**

1.1. Trong `src/features/settings/__tests__/components/settings-view.test.tsx`, thêm 3 dòng import ngay sau dòng `import { setStoredFinance, DEFAULT_FINANCE_STATE } from "@/features/finance/finance-storage"`:

```tsx
import { setStoredBudget, DEFAULT_BUDGET_STATE } from "@/features/budget/budget-storage"
import { setStoredNetWorthHistory } from "@/features/overview/net-worth-history-storage"
import { setStoredStudy, DEFAULT_STUDY_STATE } from "@/features/study/study-storage"
```

rồi thêm vào cuối `describe("SettingsView", ...)`:

```tsx
  it("also counts salaries, settlements, net-worth history, review progress and mini-game records, since wiping deletes them", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 20_000_000 }],
      settlements: [
        { id: 1, month: "2026-08", at: "2026-08-31T12:00:00.000Z", direction: "deposit", amount: 500_000, fundName: "Quỹ A" },
      ],
    })
    setStoredNetWorthHistory([
      { date: "2026-09-20", net: 1_000_000, savingsTotal: 1_000_000 },
      { date: "2026-09-21", net: 1_000_000, savingsTotal: 1_000_000 },
    ])
    setStoredStudy({
      ...DEFAULT_STUDY_STATE,
      gameHighScores: { quiz: 7, match: 0, spelling: 0 },
      gameStreak: { count: 3, lastPlayedDayKey: "2026-09-21" },
      wordReviews: {
        "v-0001": {
          wordId: "v-0001",
          easeFactor: 2.5,
          intervalDays: 1,
          repetitions: 1,
          dueAt: "2026-09-22",
          lastReviewedAt: "2026-09-21T09:00:00.000Z",
        },
      },
    })

    render(<SettingsView />)
    await waitFor(() => expect(screen.getByText("Module hiển thị")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))

    expect(screen.queryByText("Không còn gì để xoá.")).not.toBeInTheDocument()
    expect(screen.getByText(/tháng lương/)).toHaveTextContent(
      "tiến độ ôn 1 từ, điểm cao mini-game, chuỗi ngày chơi mini-game, 1 tháng lương, 1 lần tất toán, 2 ngày lịch sử tài sản"
    )
  })
```

1.2. Trong `src/features/settings/__tests__/components/reset-card.test.tsx`:

- Trong test `"starts collapsed with just the warning copy and a button to begin"`, thay

```tsx
    expect(
      screen.getByText("Xoá sạch chi tiêu, nhật ký và chuỗi ngày. Không khôi phục được.")
    ).toBeInTheDocument()
```

bằng

```tsx
    expect(
      screen.getByText(
        "Xoá sạch tài chính, chi tiêu (cả lương và tất toán), nhật ký, học tập, lịch sử tài sản, quỹ gắn mục tiêu mua xe và secret đồng bộ trên máy này — chỉ giữ lại cài đặt và danh sách cửa hàng vàng. Không khôi phục được."
      )
    ).toBeInTheDocument()
```

- Thay nguyên test `"shows a message with no data to delete when counts is empty"` bằng:

```tsx
  it("never claims there is nothing to delete, and still suggests a backup, when counts is empty", () => {
    render(<ResetCard counts={[]} onWipe={vi.fn()} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))

    expect(screen.queryByText("Không còn gì để xoá.")).not.toBeInTheDocument()
    expect(
      screen.getByText(
        "Chưa thấy dữ liệu nào ở các mục chính — phần còn lại trên máy (kể cả secret đồng bộ) vẫn sẽ bị xoá. Không khôi phục được — nên xuất một bản sao trước."
      )
    ).toBeInTheDocument()
  })
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/features/settings/__tests__/components/settings-view.test.tsx src/features/settings/__tests__/components/reset-card.test.tsx`
Expected: FAIL 3 test — `SettingsView` (`expected element not to be in the document` cho "Không còn gì để xoá." — dữ liệu chỉ có lương/tất toán/lịch sử/tiến độ ôn/mini-game nên `counts` đang rỗng); 2 test `ResetCard` (`Unable to find an element with the text: Xoá sạch tài chính, …` / `… Chưa thấy dữ liệu nào ở các mục chính — …`). Mọi test cũ vẫn PASS (kể cả "shows the real content counts before wiping…" với "1 bài nhật ký", "1 quỹ tiết kiệm").

- [ ] **Step 3: `SettingsView` đếm đủ những gì `wipeData` xoá**

Trong `src/features/settings/components/settings-view.tsx`:

- Thay 3 dòng

```tsx
  const { tasks, learned, replaceStudy } = useStudy()
  const { expenses, replaceBudget } = useBudget()
  const { replaceHistory: replaceNetWorthHistory } = useNetWorthHistory()
```

bằng

```tsx
  const { tasks, learned, gameHighScores, gameStreak, wordReviews, replaceStudy } = useStudy()
  const { salaries, expenses, settlements, replaceBudget } = useBudget()
  const { history: netWorthHistory, replaceHistory: replaceNetWorthHistory } = useNetWorthHistory()
```

- Thay nguyên mảng `counts`

```tsx
  const counts = [
    entries.length ? `${entries.length} bài nhật ký` : null,
    gold.length ? `${gold.length} lần mua vàng` : null,
    invests.length ? `${invests.length} khoản đầu tư` : null,
    savings.length ? `${savings.length} quỹ tiết kiệm` : null,
    cards.length ? `${cards.length} thẻ tín dụng` : null,
    tasks.some((task) => task.done) ? "nhiệm vụ đã tick" : null,
    learned.length ? `${learned.length} từ đã học` : null,
    expenses.length ? `${expenses.length} khoản chi` : null,
  ].filter((count): count is string => count !== null)
```

bằng

```tsx
  // Đếm đủ mọi thứ wipeData sẽ xoá — thiếu mục nào thì ResetCard có thể báo như không còn gì trong khi
  // vẫn xoá lương, tất toán, lịch sử tài sản, tiến độ ôn từ hay điểm mini-game.
  const reviewedWords = Object.values(wordReviews).filter((review) => review.lastReviewedAt !== null).length
  const salaryMonths = salaries.filter((salary) => salary.amount > 0).length
  const counts = [
    entries.length ? `${entries.length} bài nhật ký` : null,
    gold.length ? `${gold.length} lần mua vàng` : null,
    invests.length ? `${invests.length} khoản đầu tư` : null,
    savings.length ? `${savings.length} quỹ tiết kiệm` : null,
    cards.length ? `${cards.length} thẻ tín dụng` : null,
    tasks.some((task) => task.done) ? "nhiệm vụ đã tick" : null,
    learned.length ? `${learned.length} từ đã học` : null,
    reviewedWords ? `tiến độ ôn ${reviewedWords} từ` : null,
    Object.values(gameHighScores).some((score) => score > 0) ? "điểm cao mini-game" : null,
    gameStreak.count > 0 ? "chuỗi ngày chơi mini-game" : null,
    expenses.length ? `${expenses.length} khoản chi` : null,
    salaryMonths ? `${salaryMonths} tháng lương` : null,
    settlements.length ? `${settlements.length} lần tất toán` : null,
    netWorthHistory.length ? `${netWorthHistory.length} ngày lịch sử tài sản` : null,
  ].filter((count): count is string => count !== null)
```

- [ ] **Step 4: `ResetCard` nói đúng phạm vi xoá**

Trong `src/features/settings/components/reset-card.tsx`:

- Ở bước 0, thay đoạn

```tsx
        Xoá sạch chi tiêu, nhật ký và chuỗi ngày. Không khôi phục được.
```

bằng

```tsx
        Xoá sạch tài chính, chi tiêu (cả lương và tất toán), nhật ký, học tập, lịch sử tài sản, quỹ gắn mục tiêu
        mua xe và secret đồng bộ trên máy này — chỉ giữ lại cài đặt và danh sách cửa hàng vàng. Không khôi phục
        được.
```

- Ở bước 1, thay

```tsx
            ) : (
              "Không còn gì để xoá."
            )}
```

bằng

```tsx
            ) : (
              // Không bao giờ nói "không còn gì để xoá": dù các mục đếm được đều trống, wipeData vẫn xoá phần
              // còn lại (secret đồng bộ, liên kết mục tiêu mua xe...) — và vẫn nên có 1 bản sao trước.
              "Chưa thấy dữ liệu nào ở các mục chính — phần còn lại trên máy (kể cả secret đồng bộ) vẫn sẽ bị xoá. Không khôi phục được — nên xuất một bản sao trước."
            )}
```

- [ ] **Step 5: Chạy lại test, xác nhận PASS**

Run: `npx vitest run src/features/settings/__tests__/components/settings-view.test.tsx src/features/settings/__tests__/components/reset-card.test.tsx`
Expected: PASS toàn bộ

- [ ] **Step 6: Commit**

Tự review `git diff` của task rồi commit (mục **C.6** ở "Kiểm tra tay" của Task 25):

```bash
git add src/features/settings/components/settings-view.tsx src/features/settings/components/reset-card.tsx src/features/settings/__tests__/components/settings-view.test.tsx src/features/settings/__tests__/components/reset-card.test.tsx
git commit -m "fix: count every kind of data the wipe deletes and stop saying there is nothing to delete"
```

---

### Task 25: Checkpoint nhánh 3 — tsc, lint, toàn bộ test, kiểm tra tay

**Files:** không sửa file nào (nếu 1 bước dưới đây fail: quay về đúng task gây lỗi, sửa, chạy lại test của task đó, commit `fix: ...` riêng trên nhánh này).

**Interfaces:**
- Consumes: toàn bộ Task 20–24.
- Produces: nhánh `fix/small-bugs-settings` sạch tsc/lint/test, sẵn sàng cho chủ repo kiểm tra tay rồi merge vào `developer` — xong toàn bộ Plan 6a, Plan 6b tách nhánh sau đó.

- [ ] **Step 1: Kiểm kiểu**

Run: `npx tsc --noEmit`
Expected: không lỗi (exit 0) — đặc biệt ở `PAYLOAD` ép kiểu trong `api.test.ts`, các literal `WordReviewState`/`Settlement` trong `settings-view.test.tsx` (spread `DEFAULT_STUDY_STATE` nên đã có `tasksDay` của Plan 3).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 0 error, 0 warning mới. Dòng `if (!open && password !== "") setPassword("")` trong render là mẫu "điều chỉnh state trong render" có điều kiện mà repo đã dùng (`EditGoldStoreModal`, `ResetCard`) — không cần `eslint-disable`.

- [ ] **Step 3: Toàn bộ test**

Run: `npm run test`
Expected: PASS toàn bộ suite (mọi test cũ + test mới của Task 20–24).

- [ ] **Step 4: Tự review diff cả nhánh**

Run: `git diff developer --stat` rồi `git diff developer -- src/`
Kiểm: mọi mutation của `useSettings` vẫn mở đầu bằng `const current = getStoredSettings()` và deps `[persist]` (Plan 1a); `parseAppSettings` vẫn lọc từng phần tử bằng `safeArray` (Plan 1b), chỉ bọc thêm `dedupeMoodLabels`; `api.ts` chỉ thêm hằng + hàm kiểm + 2 dòng chặn; `exportedAt` trong file xuất vẫn là ISO; không đụng `use-data-management.ts`, `EXPORT_VERSION`, `auto-backup.tsx`, `/sandbox`.

### Kiểm tra tay

Chạy `npm run dev`, đăng nhập như thường, mở Cài đặt. Chép secret đồng bộ thật ra chỗ khác trước mục C.2 (mục đó gõ đè ô secret). Không bấm "Xác nhận" ở hộp mật khẩu xoá dữ liệu trong cả checklist này.

- [ ] **C.1 Tên file xuất (Task 20)** — "Xuất file JSON" → file tải về tên `orange-banana-<ngày hôm nay theo đồng hồ máy>.json`. Tuỳ chọn, để thấy đúng trường hợp lỗi cũ: DevTools → ⋮ → More tools → Sensors → mục Location chọn "Other…"/override, ô Timezone ID gõ `Pacific/Kiritimati` (UTC+14) → tải lại trang → Console chạy `new Date().toLocaleDateString("vi-VN")` → "Xuất file JSON" → ngày trong tên file đúng bằng ngày Console vừa in (trước bản sửa, từ 0:00 tới 13:59 giờ UTC+14 file mang ngày hôm trước). Bỏ override sau khi kiểm.
- [ ] **C.2 Secret có dấu (Task 20)** — gõ `bí mật đồng bộ` vào ô "Secret đồng bộ" → "Tải lên" → banner đỏ "Secret đồng bộ có ký tự không gửi được (chữ có dấu như ậ, ồ, đ). Hãy dùng đúng chuỗi SYNC_SECRET đã đặt trên Vercel." (không phải "Không kết nối được máy chủ đồng bộ."). Bấm "Tải xuống" → cùng banner đó, không có hộp xác nhận nạp dữ liệu nào hiện ra. Dán lại secret thật vào ô.
- [ ] **C.3 Tâm trạng trùng tên (Task 21)** — "Tâm trạng dùng trong nhật ký" → "Thêm tâm trạng" → ô Tên gõ `vui` (trùng "Vui" có sẵn, khác hoa/thường) → chữ đỏ "Đã có tâm trạng tên này — chọn tên khác", nút "Thêm" khoá, chữ đã gõ còn nguyên. Đổi thành `Vui vẻ thử` → "Thêm" sáng → Thêm → mood mới xuất hiện cuối danh sách. Sang `/journal`: chip "Vui vẻ thử" chọn được riêng, không sáng cùng chip "Vui".
- [ ] **C.4 Xoá tâm trạng (Task 22)** — bấm thùng rác cạnh "Vui vẻ thử" → hộp "Xoá tâm trạng?" có tên in đậm và câu "Muốn ẩn khỏi màn Nhật ký thì chỉ cần tắt công tắc."; bấm "Huỷ" → mood vẫn còn. Mở lại hộp, bấm Esc → vẫn còn. Mở lại, bấm "Xoá" → mood biến mất, toast "Đã xoá tâm trạng "Vui vẻ thử"".
- [ ] **C.5 Mật khẩu xoá dữ liệu (Task 23)** — "Bắt đầu lại" → "Xoá toàn bộ dữ liệu" → "Xoá vĩnh viễn" → gõ mật khẩu đăng nhập vào ô "Mật khẩu" → bấm "Huỷ" của HỘP → bấm "Xoá vĩnh viễn" lần nữa → ô mật khẩu trống, nút "Xác nhận" khoá. Lặp lại, lần này đóng hộp bằng Esc, rồi bằng bấm ra vùng mờ ngoài hộp → mở lại vẫn trống. Bấm "Huỷ" của THẺ để về bước đầu (không xoá gì).
- [ ] **C.6 Phạm vi xoá (Task 24)** — thẻ "Bắt đầu lại" ở bước đầu ghi "Xoá sạch tài chính, chi tiêu (cả lương và tất toán), nhật ký, học tập, lịch sử tài sản, quỹ gắn mục tiêu mua xe và secret đồng bộ trên máy này — chỉ giữ lại cài đặt và danh sách cửa hàng vàng. Không khôi phục được.". Bấm "Xoá toàn bộ dữ liệu" → danh sách in đậm có thêm (tuỳ dữ liệu thật đang có) "N tháng lương", "N lần tất toán", "N ngày lịch sử tài sản", "tiến độ ôn N từ", "điểm cao mini-game", "chuỗi ngày chơi mini-game" bên cạnh các mục cũ. Bấm "Huỷ" (KHÔNG xoá).

- [ ] **Step 5: Báo lại để duyệt**

Báo chủ repo: kết quả Step 1–4, kết quả từng mục C.1–C.6, danh sách commit trên `fix/small-bugs-settings`. Chỉ merge vào `developer` khi chủ repo duyệt (CLAUDE.md mục 5); không `git push` nếu chủ repo chưa yêu cầu. Sau khi merge, Plan 6a xong — Plan 6b tách nhánh từ `developer` mới nhất.
