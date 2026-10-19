# Tất toán tháng: dòng tất toán trong danh sách chi, tháng cũ không biến mất, số dư trên nút chọn sổ

## Bối cảnh

Trang Chi tiêu (`/budget`) có thẻ "Tất toán tháng". Cuối tháng, phần dư được nạp vào một sổ tiết kiệm, phần thiếu được rút từ một sổ, qua hộp `SettleMonthModal`.

Số cần tất toán của một tháng luôn được tính lại từ dữ liệu gốc: `remainingToSettle = lương − tổng chi − (đã nạp − đã rút ở các lần tất toán trước của chính tháng đó)` (`src/lib/budget/budget-calculations.ts`). App không lưu trạng thái "đã tất toán" riêng, cũng không khoá tháng.

Chủ repo thấy ba chỗ khó dùng. Cả ba đã được kiểm trong code:

1. **Mỗi lần tất toán được lưu nhưng không xem lại được.** Bản ghi nằm trong `BudgetState.settlements`, gồm `id, month, at, direction, amount, fundName, fundAmountBefore, fundAmountAfter` (`Settlement` trong `src/lib/budget/types.ts`, `BudgetState` trong `src/lib/budget/budget-storage.ts`). Không màn nào hiện chúng ra, nên anh không biết tháng nào đã nạp/rút sổ nào, bao nhiêu.
2. **Thẻ chỉ nhắc đúng một tháng trước.** Đó là `PAST_MONTHS_TO_SETTLE = 1` trong `src/features/budget/components/budget-view.tsx`. Qua thêm một tháng, tháng chưa tất toán biến mất khỏi giao diện và không còn tất toán được.
3. **Nút chọn sổ (`FundPicker`, `src/components/ob/fund-picker.tsx`) chỉ có tên sổ.** Phải chọn xong mới biết sổ có đủ tiền hay không.

## Chủ repo đã chốt (trao đổi ngày 19/10/2026, có duyệt bản phác)

- **Lịch sử tất toán chỉ để xem lại.** Không cần hoàn tác.
- **Lịch sử nằm ngay trong danh sách "Khoản chi tháng này".** Mỗi lần tất toán là một dòng, đặt ở đúng ngày anh bấm tất toán. Không làm thẻ lịch sử riêng.
  - Chủ repo biết và chấp nhận một hệ quả: danh sách chỉ hiện tháng đang chạy, nên sang tháng sau, dòng tất toán của tháng trước không còn chỗ xem lại.
  - Ban đầu chủ repo chọn một thẻ lịch sử riêng gom theo tháng, sau đó đổi sang cách này.
- **Nội dung một dòng tất toán:**
  - tất toán cho tháng nào;
  - nạp vào hay rút từ sổ nào;
  - số dư của sổ trước → sau lần đó;
  - nằm ở ngày bấm;
  - số tiền có dấu và có màu;
  - bật "Ẩn số tiền" thì mọi con số bị che;
  - sổ đã đổi tên thì hiện tên mới; sổ đã xoá thì hiện tên cũ kèm "(đã xoá)";
  - số tiền trong dòng ghi đầy đủ (ví dụ `1.500.000 ₫`), không rút gọn.
- **Chỉ những tháng đã nhập lương mới tất toán.** Tháng cũ có lương mà chưa tất toán thì **không tự mất** sau một tháng.
- **Không làm:** nhập lương cho tháng đã qua, nút "Bỏ qua" một tháng, thẻ lịch sử riêng, hoàn tác.
- **Số dư hiện ngay cạnh tên sổ trên nút chọn sổ, theo kiểu rút gọn "A"** (chủ repo chọn trên bản phác):
  - 8.000 → `8k`
  - 50.000 → `50xu`. Hàng chục nghìn ghi "xu" là chủ repo **cố ý chọn**, không phải gõ nhầm "k". Đừng "sửa" thành "k".
  - 500.000 → `500k`
  - 1.500.000 → `1,5tr`
  - 5.000.000 → `5tr`
  - 2.000.000.000 → `2 tỷ`

Những điểm dưới đây ghi **(Claude)** là do Claude tự quyết khi chủ repo không nói tới. Chủ repo kiểm lại các điểm này lúc duyệt.

## Mục tiêu

1. Mỗi lần tất toán hiện thành một dòng trong "Khoản chi tháng này", ở ngày bấm tất toán, theo đúng nội dung ở trên.
2. Thẻ "Tất toán tháng" liệt kê **mọi** tháng đã qua có lương mà số cần tất toán ≠ 0, tháng mới nhất ở trên. Tháng đó còn lệch thì còn hiện, không có hạn chót.
3. Nút chọn sổ hiện số dư rút gọn theo kiểu A, ở cả hai nơi đang dùng `FundPicker`: hộp tất toán và phần chọn sổ của mục tiêu "Mua xe ô tô".

## Không làm

- Hoàn tác, sửa hay xoá một lần tất toán.
- Thẻ hoặc trang lịch sử riêng; xem lại dòng tất toán của các tháng đã qua.
- Nhập hoặc sửa lương cho tháng đã qua; nút "Bỏ qua" một tháng.
- Tự động tất toán, hoặc chuyển phần dư/thiếu sang tháng sau.
- Đổi cách tính `remainingToSettle`, đổi trang Tổng quan, đổi xuất/nhập file hay đồng bộ cloud. Dữ liệu tất toán vốn đã có trong bản sao, không cần thêm trường mới.
- Sửa lỗi có từ trước: trang để mở qua nửa đêm cuối tháng vẫn coi tháng cũ là "tháng này" cho tới lần vẽ lại kế tiếp (`currentMonth = monthKey()` tính lúc render).

## Không được xảy ra

- Dòng tất toán bị cộng vào bất kỳ con số nào: "đã chi", tổng chi trong ngày, các biểu đồ, gợi ý ở Tổng quan, hay số cần tất toán.
- Một lần tất toán biến khỏi dữ liệu sau khi tải lại trang. Khi đó tháng mở lại và dễ bị tất toán lần hai, tức tiền bị cộng/trừ sổ hai lần.
- Nút chọn sổ hiện số dư **lớn hơn** số tiền sổ đang có (với số dư ≥ 0; số âm xem mục 3).
- Lộ số tiền khi đang bật "Ẩn số tiền", kể cả lộ độ lớn qua đơn vị k/xu/tr/tỷ.
- Trang bị cuộn ngang ở màn rộng 320px.
- Phá test đang có mà không chủ đích sửa, hoặc để `tsc --noEmit` / `npm run build` báo lỗi kiểu. Vitest không kiểm kiểu, nhưng `tsconfig.json` có cả file test, và `next build` kiểm kiểu toàn bộ.

## Ràng buộc

- Theo đúng CLAUDE.md:
  - phần dữ liệu dùng chung nằm trong `src/lib/budget/`, `src/lib/format.ts`, `src/lib/date.ts`;
  - giao diện nằm trong `src/features/budget/` và `src/components/ob/`;
  - test đặt trong `__tests__/` theo cấu trúc thư mục nguồn;
  - tên định danh bằng tiếng Anh, chữ hiển thị bằng tiếng Việt;
  - màu và khoảng cách dùng token `--ob-*`;
  - bố cục trong `Card` dùng container query (`@xs:`/`@md:`/`@xl:`), không dùng breakpoint màn hình.
- Không thêm thư viện.
- Không thắt chặt schema zod của dữ liệu cũ. Nếu thắt chặt, `safeArray` sẽ lặng lẽ bỏ bản ghi, tháng mở lại và dễ bị tất toán hai lần.
- Không đổi hình dạng `Settlement` / `BudgetState`, trừ phần nới schema ở mục 4.

## Thiết kế

### 1. Dòng tất toán trong "Khoản chi tháng này"

**Dòng nào được hiện**
- Là những lần tất toán có **ngày theo giờ máy** của `at` nằm trong tháng đang chạy. Lọc theo `at`, không theo `month`, vì `month` là tháng được tất toán.
  - Ví dụ: tất toán tháng 9 vào 01/10 thì dòng nằm ở ngày 01/10, trong danh sách tháng 10.
- `at` là chuỗi ISO giờ UTC, do `confirmSettlement` ghi bằng `new Date().toISOString()`.
- Cần thêm một hàm chung trong `src/lib/date.ts` để đổi chuỗi ISO sang `dayKey` theo giờ máy. Hàm này trả `null` nếu chuỗi không hợp lệ.
  - **Cấm** dùng `at.slice(0, 10)`: cách đó lấy ngày UTC, nên lần tất toán lúc 06:30 sáng 01/10 (giờ Việt Nam) sẽ rơi sang ngày 30/09.
- `at` không hợp lệ (chỉ có thể đến từ file sửa tay hoặc file nhập) thì bỏ dòng đó khỏi danh sách. Bản ghi vẫn được tính vào số cần tất toán như trước.
- **Không** biến lần tất toán thành `Expense`, và không gộp vào `monthExpenses`. Gộp vào là nó lọt vào "đã chi", biểu đồ và gợi ý.

**Xếp vào ngày**
- Dòng tất toán nằm trong đúng nhóm ngày của khoản chi cùng ngày: mỗi `dayKey` chỉ có một nhóm. Nhờ vậy:
  - trạng thái mở/đóng của từng ngày (`openDays` theo `dayKey`) giữ nguyên;
  - quy tắc "ngày mới nhất mở sẵn" giữ nguyên.
- Ngày chỉ có tất toán mà không có khoản chi vẫn thành một nhóm riêng.
- Dòng tất toán nằm trong cùng khung thu/mở với khoản chi, nên khi ngày bị đóng thì dòng cũng bị `inert` như khoản chi.
- **(Claude)** Trong một ngày, dòng tất toán nằm **dưới** các khoản chi.
  - Lý do: khoản chi không có giờ nên không xen kẽ đúng thứ tự được, và tổng tiền trên tiêu đề ngày đứng sát những dòng được cộng.
  - Giữa các dòng tất toán với nhau thì lần mới nhất ở trên. So `at` bằng thời điểm thật (`Date.parse`), không so chuỗi. Bằng nhau thì so `id` lớn hơn.

**Tiêu đề ngày** (Claude)
- Tổng tiền chỉ cộng khoản chi. Ngày chỉ có tất toán thì hiện `0 ₫`.
- Phần tóm tắt khi ngày đang đóng giữ "· N khoản", nhưng bỏ đi khi N = 0, rồi thêm "· M tất toán" khi M > 0. Ví dụ: "· 2 khoản · 1 tất toán".

**Câu báo trống** (Claude)
- "Chưa có khoản chi nào trong tháng này." vẫn hiện khi tháng có tất toán mà chưa có khoản chi, vì câu đó vẫn đúng. Thêm khoảng cách phía trên khi đã có nhóm ngày phía trên.

**Nội dung một dòng**
- **Biểu tượng:** chỉ để trang trí, ẩn với trình đọc màn hình.
- **Tiêu đề:** "Tất toán tháng 9".
  - **(Claude)** Thêm năm khi năm của tháng được tất toán khác năm hiện tại, ví dụ "Tất toán tháng 12, 2025". Không còn hạn chót nên tháng được tất toán có thể thuộc năm trước.
  - `month` sai định dạng thì chỉ ghi "Tất toán".
- **Dòng phụ:** "Nạp vào sổ X" hoặc "Rút từ sổ X". Thêm " (đã xoá)" nếu X không còn trong danh sách sổ hiện tại.
  - Danh sách sổ lấy từ `useFinance().savings`, mà `budget-view.tsx` đã có sẵn.
  - Sổ đổi tên thì không cần làm gì: `updateSavingsFund` đã tự đổi tên trong các bản ghi tất toán (`renameFundInSettlements`).
- **Số dư sổ:** phần nhìn thấy là "100.000 ₫ → 400.000 ₫", ẩn với trình đọc màn hình. Kèm một câu chỉ trình đọc màn hình đọc: "Số dư sổ từ 100.000 ₫ thành 400.000 ₫".
- **Số tiền:** nạp ghi "+ 300.000 ₫" màu xanh (`--ob-color-income`), rút ghi "− 300.000 ₫" màu đỏ (`--ob-color-expense`). Dùng lại `signedMoney` trong `src/lib/finance/finance-calculations.ts`. Màu không phải tín hiệu duy nhất, vì dấu +/− và chữ "Nạp/Rút" đã nói rõ hướng.
- **Không có nút nào**, không bấm được, không nhận focus. Hàng Sửa/Xoá chỉ thuộc về khoản chi.
- **Che số:** bật "Ẩn số tiền" thì mọi con số đi qua `formatMoney(…, hidden)` / `signedMoney(…, hidden)`. Tên sổ và chữ "(đã xoá)" không phải tiền nên vẫn hiện.
- **Kỹ thuật:**
  - Key của React phải có tiền tố, ví dụ `settlement-${id}`, vì `id` khoản chi và `id` tất toán là hai dãy số riêng và có thể trùng nhau.
  - `data-testid` khác với dòng khoản chi, để các test đang có về dòng khoản chi không đếm nhầm.
  - Đường kẻ và bo góc của dòng cuối trong ngày tính trên cả hai loại dòng.
  - Prop mới của `ExpenseListCard` (các dòng tất toán, danh sách tên sổ nếu cần) là **tuỳ chọn, mặc định rỗng**. Nếu bắt buộc, 18 lần render trong `expense-list-card.test.tsx` sẽ lỗi kiểu (TS2739). Vitest vẫn qua, nhưng `tsc` và `next build` thì không.
- **Màn hẹp:** không thêm khoảng đệm cố định để canh số tiền với cột Sửa/Xoá. Số tiền không xuống dòng; tên sổ dài được xuống dòng.

**Giới hạn đã biết** (Claude chấp nhận, không làm thêm)
- App nhận diện sổ chỉ bằng tên. Giả sử xoá sổ "X", sau đó tạo sổ mới cũng tên "X" hoặc đổi tên sổ khác thành "X":
  - các dòng cũ mất chữ "(đã xoá)" và trông như lịch sử của sổ mới;
  - đổi tên sổ mới thì các dòng cũ cũng đổi theo.
- Trường hợp này hiếm, và sửa tận gốc phải thêm định danh sổ vào dữ liệu.

### 2. Tháng cũ không biến mất

**Danh sách tháng cũ**
- `unsettledPastMonths` bỏ tham số `lookback` và đổi thành `unsettledPastMonths(salaries, expenses, settlements, currentMonth)`. Tháng được xét là:
  - những tháng **có bản ghi lương**, kể cả bản ghi 0 đ;
  - mỗi tháng chỉ tính một lần, kể cả khi dữ liệu nhập vào bị trùng;
  - đúng định dạng `YYYY-MM`. Kiểm định dạng ngay trong hàm, không đưa vào schema;
  - **trước** tháng hiện tại. Tháng hiện tại và tháng tương lai không vào danh sách;
  - giữ tháng có số cần tất toán ≠ 0;
  - xếp tháng mới nhất trước.
- Xoá hằng `PAST_MONTHS_TO_SETTLE` cùng chú thích của nó. Bỏ `shiftMonth` khỏi import của `budget-calculations.ts` nếu không còn dùng.
- Bản thiết kế này **thay thế "Quyết định 1"** trong `docs/superpowers/plans/2026-09-29-fix-2-budget.md` (chỉ nhắc tháng liền trước). Không sửa file plan cũ.
- Thêm `hasSalaryRecord(salaries, month)`: trả true khi có bản ghi lương, kể cả 0 đ. Đây là định nghĩa duy nhất của "tháng đã có lương" cho trang Chi tiêu. Phần đếm "tháng lương" khi xoá dữ liệu ở Cài đặt (đang dùng `amount > 0`) giữ nguyên.

**Mỗi dòng tháng cũ**
- Chữ giữ như hiện nay: "Tháng 8, 2026 còn dư/thiếu X chưa tất toán." kèm nút "Tất toán tháng 8, 2026".
- Nút mở hộp tất toán của đúng tháng đó. Luồng này đã chạy được với bất kỳ tháng nào, không phải sửa.
- Số tiền vẫn bị che khi ẩn số.
- **(Claude)** Không thu gọn: hiện tất cả các dòng. Chỉ tháng có lương mới vào danh sách, và module Chi tiêu mới có từ 09/2026, nên thực tế chỉ có vài dòng.

**Tháng đang chạy chưa nhập lương** (Claude, suy ra từ quy tắc "chỉ tháng đã nhập lương mới tất toán")
- Nút "Tất toán tháng" bị khoá. Câu "Bạn đang dư/thiếu …" thay bằng lời nhắc: "Chưa nhập lương tháng này. Nhập lương (kể cả 0 đ) ở thẻ Lương tháng này rồi mới tất toán."
- Lý do: nếu cho tất toán một tháng không có lương, phần còn lệch của tháng đó sẽ biến mất hẳn khi sang tháng, vì danh sách tháng cũ chỉ lấy tháng có lương và không có cách nhập lương cho tháng cũ.
- Lưu ý khi viết:
  - tên nút giữ đúng "Tất toán tháng";
  - lời nhắc không chứa "còn thiếu" hay số tiền định dạng ₫, vì test đang tìm `/còn thiếu/` và `formatMoney(…)`; tránh luôn "còn dư" cho đối xứng;
  - không nói "bên cạnh" hay "bên trái", vì trên điện thoại thẻ lương nằm phía trên.
- Lời nhắc không được chớp hiện lúc tải trang, trước khi dữ liệu thật được đọc. Hiện `useBudget` chưa có cờ `hydrated` như `useFinance`.

**Phần khác** (Claude)
- Toast sau khi tất toán ghi rõ tháng, ví dụ "Đã tất toán tháng 8, 2026", thay cho "Đã tất toán tháng". Có nhiều dòng thì cần biết vừa tất toán tháng nào.
- Thẻ tất toán dài ra theo số dòng. Hàng chứa thẻ Lương và thẻ Tất toán không được kéo thẻ Lương cao theo (dùng `items-start` hoặc cách tương đương).
- Tất toán xong một tháng cũ thì dòng đó biến mất và nút đang giữ focus cũng mất theo. Focus không được rơi về đầu trang.

### 3. Số dư rút gọn trên nút chọn sổ

**Hàm định dạng:** thêm `formatMoneyCompact(n: number, hidden = false): string` vào `src/lib/format.ts`, cạnh `formatMoney`.

| Số dư | Hiện | Quy tắc |
| --- | --- | --- |
| dưới 1.000 | `0đ`, `500đ` | (Claude) ghi đủ đồng kèm "đ" |
| 1.000 – 9.999 | `8k`, `1,5k`, `9,9k` | chia 1.000, tối đa 1 chữ số lẻ, "k" |
| 10.000 – 99.999 | `50xu`, `12xu`, `99xu` | chia 1.000, số nguyên, "xu" |
| 100.000 – 999.999 | `500k`, `999k` | chia 1.000, số nguyên, "k" |
| 1.000.000 – 999.999.999 | `1tr`, `1,5tr`, `5tr`, `1,9tr`, `999,9tr` | chia 1.000.000, tối đa 1 chữ số lẻ, "tr" |
| từ 1.000.000.000 | `1 tỷ`, `1,5 tỷ`, `2 tỷ`, `1.234,5 tỷ` | chia 1.000.000.000, tối đa 1 chữ số lẻ, " tỷ" (có dấu cách) |

- Trước tiên cắt phần lẻ dưới 1 đồng (`Math.trunc`, không làm tròn như `formatMoney`, để 999,5 ra `999đ` chứ không ra `1k`); `NaN` và `-0` tính là 0.
- **(Claude) Cắt xuống, không làm tròn lên.** Ví dụ 1.990.000 → `1,9tr`, 99.999 → `99xu`.
  - Như vậy nút không bao giờ cho thấy sổ nhiều tiền hơn thực tế, và không bao giờ nhảy sang mốc kế tiếp (không có `100xu`, `1.000k`, `1.000tr`).
  - Tính bằng phép chia số nguyên theo bước. Không để `toLocaleString` tự làm tròn, cũng không dùng `Intl` ở chế độ `compact`: tiếng Việt của Intl ra "N/Tr/T" và làm tròn theo chữ số có nghĩa.
- Dấu thập phân là dấu phẩy, bỏ ",0". Phần nghìn của số tỷ lớn dùng dấu chấm.
- Số âm chỉ có thể đến từ file nhập: thêm "-" phía trước, không bao giờ ra "-0…". Phần trị tuyệt đối vẫn bị cắt về 0, nên số âm có thể hiện hơi lớn hơn thực tế (−1.990.000 → `-1,9tr`). Chấp nhận, vì app không tự tạo số dư âm.
- Khi ẩn số tiền: trả `•••` cố định, không kèm đơn vị để không lộ độ lớn.
- Viết một chú thích tiếng Việt trong code nói rằng "xu" cho hàng chục nghìn là lựa chọn của chủ repo (19/10/2026).

**Nút chọn sổ (`FundPicker`)**
- Mỗi nút hiện tên sổ, rồi số dư rút gọn ngay sau tên. Số dư màu nhạt hơn khi nút chưa được chọn, và dùng font số `--ob-font-num` với `tabular-nums`. Không ghép shorthand `[font:var(--ob-text-*)]` với class độ đậm.
- **Trình đọc màn hình:**
  - **tên của nút vẫn chỉ là tên sổ**, nên các test đang tìm nút theo tên giữ nguyên;
  - số dư rút gọn ẩn với trình đọc màn hình. Đọc "50xu" thành "năm mươi xu" là sai, vì xu là đơn vị thật bằng 1/100 đồng;
  - số dư đầy đủ "Số dư 8.000.000 ₫" là **mô tả** của nút (`aria-describedby`). Phần chữ "Số dư " và số tiền nằm chung **một** phần tử, vì test ở Mục tiêu tìm đúng số tiền theo cả chuỗi;
  - id tạo bằng `useId()` cộng chỉ số, **không** dựng từ tên sổ, vì tên có dấu cách sẽ vỡ danh sách id.
- `FundPicker` tự đọc "Ẩn số tiền" qua `useMoneyVisibility()`, giống `CountMoney`. Props giữ nguyên.
  - Hook phải gọi **trước** chỗ `return` sớm của trạng thái "chưa có sổ". Gọi sau là vi phạm rules-of-hooks: ESLint (`react-hooks/rules-of-hooks`) báo lỗi, nên `npm run lint` và pre-commit sẽ chặn. React 19 không ném lỗi trong trường hợp này, vì lần vẽ rỗng chưa gọi hook nào, nên lint mới là thứ giữ quy tắc này.
  - Khi ẩn số tiền, phần mô tả là "Số dư •••••••• ₫".
- Số dư không được xuống dòng giữa chừng (`2 tỷ` có dấu cách), vì hộp tất toán chỉ rộng khoảng 277px trên màn 360px.
- **(Claude)** Áp dụng cho cả hai nơi dùng `FundPicker`. Ở thẻ "Mua xe ô tô", trang vốn đã hiện số tiền và cũng che theo "Ẩn số tiền", nên không lộ thêm gì.

### 4. Sửa kèm: lần tất toán không được mất khi tải lại (Claude)

- **Lỗi có từ trước:** số dư sổ có thể là số lẻ thập phân. `savingsFundSchema.amount` là `z.number()`, chỉ có thể lẻ khi dữ liệu đến từ file nhập hoặc cloud.
  - Khi đó `fundAmountBefore/After` của bản ghi tất toán cũng lẻ, mà `settlementSchema` đòi `.int()`.
  - Lần đọc sau, bản ghi bị bỏ, tháng mở lại và có thể bị tất toán lần hai.
  - Với mục 1, dòng tất toán còn biến mất trước mắt người dùng.
- **Sửa:** nới `fundAmountBefore` và `fundAmountAfter` trong `settlementSchema` (`src/lib/budget/budget-storage.ts`) từ `z.number().int()` thành `z.number()`. Zod 4 vẫn từ chối `NaN`/`Infinity`. Nới ra thì không bản ghi hợp lệ nào bị bỏ. `amount` giữ `.int().positive()`, vì số tiền tất toán luôn là số nguyên người dùng gõ.

## Kiểm thử

Phần kiểm thử bắt buộc. Chi tiết từng test để cho plan.

- **Kiểm kiểu:** chạy `npx tsc --noEmit` hoặc `npm run build` cùng với `npm run test` và `npm run lint`. Vitest không bắt được lỗi sai số tham số (TS2554) trong file test.
- **Hàm đổi ISO sang `dayKey`:**
  - ra ngày theo giờ máy, không phải ngày UTC. Dựng `at` bằng `new Date(y, m, d, h).toISOString()` để test đúng ở mọi múi giờ;
  - chuỗi rỗng hoặc sai trả `null`.
- **Lấy và xếp dòng tất toán của tháng:**
  - lọc theo ngày giờ máy của `at`. Lần tất toán lúc 00:30 ngày 01/09 thuộc tháng 9; lúc 23:30 ngày 31/08 thì không;
  - bỏ `at` sai;
  - thứ tự mới nhất trước, so theo thời điểm thật; bằng nhau thì xét `id`;
  - cờ "(đã xoá)";
  - nhóm theo ngày: tổng ngày không cộng tất toán; ngày chỉ có tất toán vẫn thành nhóm.
- **`ExpenseListCard`:**
  - dòng nạp và dòng rút: chữ, dấu, màu, câu cho trình đọc màn hình;
  - dòng không có nút;
  - tổng tiền trên tiêu đề ngày;
  - ngày chỉ có tất toán: mở sẵn nếu là ngày mới nhất, tóm tắt "1 tất toán";
  - đường kẻ và bo góc của dòng cuối;
  - che số khi ẩn số tiền;
  - "(đã xoá)";
  - năm trong tiêu đề khi khác năm;
  - không có cảnh báo trùng key khi `id` khoản chi và `id` tất toán trùng nhau;
  - câu báo trống.
  - Lưu ý: chữ dành cho trình đọc màn hình cũng nằm trong `textContent`, nên đừng so cả chuỗi "A → B" trên cả dòng.
- **`BudgetView`:**
  - tất toán xong thì dòng tất toán hiện dưới ngày hôm đó, còn "đã chi" không đổi;
  - lần tất toán làm lúc 31/08 không hiện trong tháng 9;
  - liệt kê mọi tháng cũ có lương, mới nhất trước, và có thể khác năm;
  - tháng cũ không có lương thì không hiện;
  - tất toán một tháng cách vài tháng thì ghi đúng `month` và chỉ dòng đó biến mất;
  - che số ở các dòng tháng cũ;
  - tháng đang chạy chưa có lương thì nút khoá và có lời nhắc; nhập 0 đ thì mở khoá;
  - toast ghi rõ tháng;
  - focus không rơi về đầu trang sau khi một dòng tháng cũ biến mất.
- **`unsettledPastMonths`:**
  - không còn giới hạn khoảng cách;
  - bỏ tháng hiện tại và tháng tương lai;
  - bỏ tháng không có bản ghi lương;
  - bản ghi lương 0 đ có tính;
  - tháng có số cần tất toán bằng 0 thì bỏ;
  - tháng trùng chỉ ra một dòng;
  - tháng sai định dạng bị bỏ;
  - đúng thứ tự khi qua năm mới.
- **`hasSalaryRecord`**.
- **`formatMoneyCompact`:**
  - toàn bộ bảng ở mục 3;
  - các mốc biên 9.999 / 10.000 / 99.999 / 100.000 / 999.999 / 1.000.000 / 999.999.999 / 1.000.000.000;
  - số lẻ thập phân, số 0, số âm;
  - ẩn số trả `•••`;
  - có một test mang tên lựa chọn "xu" của chủ repo.
- **`FundPicker`:**
  - số dư rút gọn nằm trong nút nhưng tên nút vẫn là tên sổ;
  - mô tả "Số dư …" đầy đủ;
  - che khi ẩn số;
  - id đúng với tên sổ có dấu cách hoặc dấu nháy;
  - đổi từ "chưa có sổ" sang có sổ không bị lỗi. Đây chỉ là test khói: thứ tự hook do ESLint giữ, không phải test này.
  - Thêm một kiểm tra ở hộp tất toán (có một sổ rơi vào dải "xu") và một ở thẻ Mua xe trang Mục tiêu.
- **`useBudget`:** ghi lại hợp đồng của `at` (chuỗi ISO của thời điểm xác nhận).
- **Schema:** bản ghi tất toán có `fundAmountBefore/After` lẻ thập phân vẫn đọc được.
- **Test đang có phải sửa** (đã chạy thử trên bản nháp):
  - `budget-calculations.test.ts`: 5 test của `unsettledPastMonths` (gọi 5 tham số, fixture có lương tháng 7), và test `groupExpensesByDay` so khớp tuyệt đối với `toEqual` nếu `DayGroup` được thêm trường;
  - `budget-view.test.tsx`: "does not bring up months older than last month" phải đảo lại thành "liệt kê mọi tháng cũ có lương".
  - Mọi test tìm nút sổ theo tên giữ nguyên, với điều kiện số dư không lọt vào tên nút.

## Tài liệu cần cập nhật

- `README.md`, dòng mô tả `/budget`: thẻ tất toán liệt kê mọi tháng cũ có lương; dòng tất toán nằm trong "Khoản chi tháng này"; nút chọn sổ hiện số dư rút gọn. Dùng chữ "tất toán" thay cho "chốt".
- `README.md`, dòng `FundPicker`: thêm số dư rút gọn, mô tả đầy đủ qua `aria-describedby`, tự che khi ẩn số; đổi "Chi tiêu (chốt tháng)" thành "Chi tiêu (tất toán tháng)".
- `README.md`, dòng `date.ts`: thêm hàm đổi chuỗi ISO sang `dayKey` theo giờ máy.
- `README.md`, dòng `src/lib/format.ts`: thêm `formatMoneyCompact`, và bổ sung `pastedMoneyDigits` đang thiếu.
- `CLAUDE.md`: không cần đổi.

## Để lại cho người làm

- Tách dòng tất toán thành component riêng hay viết ngay trong `ExpenseListCard`.
- Tên chính xác của hàm đổi ISO sang `dayKey` và của hàm lấy dòng tất toán trong tháng.
- Class Tailwind cụ thể và biểu tượng, miễn dùng token `--ob-*`.
- Cách chặn lời nhắc "chưa nhập lương" chớp hiện lúc tải. Ví dụ thêm cờ `hydrated` cho `useBudget` như `useFinance`.
- Focus chuyển tới đâu sau khi một dòng tháng cũ biến mất, ví dụ nút của dòng kế tiếp hoặc thẻ tất toán.
- Có dùng `<ul>`/`<li>` cho các dòng tháng cũ hay không.
- Tên test và cách chia test.

## Rủi ro đã biết

- **Nhận diện sổ chỉ bằng tên:** xem "Giới hạn đã biết" ở mục 1.
- **Hai tab đang mở:** khi đổi tên sổ hoặc nhập dữ liệu ở tab khác, sự kiện của dữ liệu Tài chính tới trước dữ liệu Chi tiêu, nên một dòng có thể hiện "(đã xoá)" trong một lần vẽ rồi tự đúng lại.
- **Số dòng tháng cũ khi lên bản mới:** mọi tháng có lương mà còn lệch sẽ hiện cùng lúc. Module Chi tiêu mới có từ 09/2026 nên hiện tại nhiều nhất chỉ vài dòng.
- **Tháng thiếu nhiều hơn tổng các sổ:** phần còn lại không tất toán hết được, vì sổ không được âm, nên dòng đó sẽ nằm mãi. Đây là hệ quả của việc không làm nút "Bỏ qua". Claude ghi lại để chủ repo biết khi duyệt.
