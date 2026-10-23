# Quẹt thẻ tín dụng ở trang Chi tiêu: không tính vào chi tiêu tháng, tự cộng/trừ nợ thẻ

## Bối cảnh

Trang Chi tiêu (`/budget`) ghi mọi khoản chi vào "đã chi" của tháng. Con số đó bị trừ thẳng vào lương, ở các chỗ sau:
- `totalExpensesForMonth` → dòng "Lương X · đã chi Y";
- `remainingToSettle` → thẻ "Tất toán tháng";
- các biểu đồ;
- thẻ "Chi tiêu tháng này" và các gợi ý ở Tổng quan.

Chủ repo hay quẹt thẻ tín dụng khi mua sắm. Hiện có hai vấn đề:

1. **Khoản quẹt thẻ bị tính như tiền đã ra khỏi túi.** Thực ra tiền chưa đi đâu, chỉ có nợ thẻ tăng.
   - Vì vậy "đã chi" phồng lên và số dư/thiếu ở thẻ Tất toán bị sai, có tháng thành âm dù thực tế không thiếu.
   - Đầu tháng sau, chủ repo trả nợ thẻ và ghi một khoản nhãn "Trả nợ thẻ". Lúc đó cùng một khoản tiền bị tính lần thứ hai.
2. **Nợ thẻ bên Tài chính phải nhập tay riêng.** Khoản quẹt thì sửa dư nợ thẻ, lần trả thì bấm "Ghi một lần trả". Một khoản phải nhập hai nơi, quên một bên là lệch.

Dữ liệu liên quan:
- Khoản chi: `Expense` trong `src/lib/budget/types.ts`, lưu ở key `budget-data`.
- Thẻ tín dụng: `CreditCard` trong `src/lib/finance/types.ts`, lưu ở key `finance-data`. Thẻ được định danh bằng **tên**.
- Nhãn chi tiêu: `DEFAULT_TAGS` trong `src/lib/settings/settings-storage.ts`. Cài đặt chỉ cho **bật/tắt** nhãn, không thêm/sửa/xoá được (`TagsCard` chỉ có `onToggle`).
- Đã có sẵn một luồng ghi chéo hai key: tất toán tháng (`confirmSettlement` trong `src/lib/budget/use-budget.ts` gọi `applySavingsFundDelta` trong `src/lib/finance/finance-storage.ts`).
  - Luồng đó ghi `finance-data` trước, rồi ghi `budget-data`.
  - Bước sau lỗi thì đảo lại bước trước.
  - Luồng mới làm theo đúng mẫu này.

## Chủ repo đã chốt (trao đổi ngày 23/10/2026)

**Nhãn "Quẹt thẻ"**
- **"🧾 Quẹt thẻ" là một nhãn mới trong Cài đặt**, cùng danh sách và bật/tắt như mọi nhãn khác.
  - Mọi khoản quẹt thẻ gom vào nhãn này, không nằm dưới "Ăn uống", "Mua sắm"…
  - Chủ repo chọn gom riêng, không chọn kiểu "nhãn thường + dấu quẹt thẻ".
- **Khoản quẹt thẻ vẫn nằm trong danh sách chi tiêu của tháng**, để chủ repo biết tháng này đã mua gì. Nhưng nó **tính 0 đ vào chi tiêu tháng**.
- **Nợ của thẻ được quẹt tự tăng** đúng số tiền quẹt.
- **Ở phần tổng kết, dòng Quẹt thẻ hiện "0 đ / số tiền đã quẹt"**, ví dụ `0 ₫ / 1.200.000 ₫`.
  - "Phần tổng kết" là danh sách tổng theo nhãn có dòng "Tổng cộng", nằm dưới biểu đồ "Xu hướng chi tiêu (6 tháng gần nhất)" (`MonthlyTagTrendChart`). Chủ repo gửi ảnh chụp đúng danh sách này.

**Chọn thẻ**
- Có **1 thẻ** thì tự dùng thẻ đó.
- Có **từ 2 thẻ trở lên** thì phải chọn.

**Nhãn "Trả nợ thẻ"**
- Giữ nguyên trong Cài đặt: cùng tên, emoji, mô tả, bật/tắt như cũ.
- Khoản "Trả nợ thẻ" **vẫn tính vào chi tiêu tháng** như hiện nay, vì đây là lúc tiền thật ra khỏi túi.
- **Từ nay, ghi một khoản "Trả nợ thẻ" thì nợ của thẻ đó tự giảm** đúng số tiền.
  - Chủ repo chọn tự trừ vì cách này nhất quán với việc quẹt thẻ tự cộng: chỉ nhập một nơi.
  - Thói quen của chủ repo: trả nợ thẻ vào đầu mỗi tháng. Lấy số tiền trả đó trừ vào nợ thẻ là đúng nhất.
- Chọn thẻ theo cùng quy tắc như Quẹt thẻ.
- **Các khoản đã ghi trước khi có tính năng này giữ nguyên, không đụng tới nợ thẻ.**
  - Trong đó có khoản "Trả nợ thẻ" 5.317.725 ₫ của tháng 10/2026: chủ repo đã tự trả và tự cập nhật nợ thẻ.
  - Chỉ khoản ghi mới mới tự cộng/trừ. Lần trả đầu tiên tự trừ là đầu tháng 11/2026.
- Nút "Ghi một lần trả" ở trang Tài chính giữ nguyên.

**Tháng chuyển tiếp: không xử lý riêng**
- Các khoản quẹt thẻ ghi trước khi có tính năng đã tính vào chi tiêu tháng 10. Lần trả đầu tháng 11 cho chính các khoản đó, nếu ghi "Trả nợ thẻ", sẽ tính thêm một lần vào chi tiêu tháng 11.
- Chủ repo chọn: **app cứ tính như bình thường**. Chủ repo tự chỉnh tay các con số cho khớp, ví dụ sửa dư nợ thẻ hay dùng "Ghi một lần trả" ở Tài chính.
- Không làm công cụ hay trường hợp đặc biệt nào cho tháng chuyển tiếp.

**Yêu cầu chất lượng**
- Chủ repo nhấn mạnh: phần tự cộng/trừ phải kiểm thật kỹ, **nợ thẻ không được lệch**.

Những điểm ghi **(Claude)** là do Claude tự quyết khi chủ repo không nói tới. Chủ repo kiểm lại các điểm này lúc duyệt.

## Mục tiêu

1. Ghi được khoản "Quẹt thẻ" gắn với một thẻ. Khoản này tính 0 đ vào mọi con số chi tiêu, và nợ thẻ đó tăng đúng số tiền.
2. Ghi được khoản "Trả nợ thẻ" gắn với một thẻ. Khoản này vẫn tính vào chi tiêu, và nợ thẻ đó giảm đúng số tiền.
3. Sửa số tiền hay xoá một khoản đã gắn thẻ thì nợ thẻ đổi theo đúng phần chênh. Từ lúc ghi, nợ thẻ luôn bằng: nợ trước đó + các lần quẹt − các lần trả.
4. Danh sách tổng kết 6 tháng có dòng "🧾 Quẹt thẻ · 0 ₫ / X ₫". Dòng "Tổng cộng" không cộng X.

## Không làm

- Không đổi nút "Ghi một lần trả" ở trang Tài chính. Nút đó vẫn chỉ trừ nợ, không tạo khoản chi.
- Không tự trừ ngược các khoản "Trả nợ thẻ" đã ghi, không gắn thẻ cho khoản cũ.
- Không có công cụ hay quy tắc riêng cho tháng chuyển tiếp 10 → 11/2026. Chủ repo tự chỉnh tay.
- Không theo dõi kỳ sao kê, lãi thẻ, hay hạn mức còn lại.
- Không cho chọn ngày khi ghi khoản chi. Khoản chi vẫn luôn ghi vào hôm nay như hiện nay.
- Không đổi tên, emoji hay mô tả của nhãn "Trả nợ thẻ". Không thêm khả năng sửa/xoá nhãn trong Cài đặt.
- Không đổi cách tính `remainingToSettle` hay luồng tất toán. Chúng tự đúng vì đọc qua `totalExpensesForMonth`.

## Không được xảy ra

- **Nợ thẻ lệch** so với "nợ trước đó + quẹt − trả". Đường nào cũng phải giữ đúng:
  - thêm, sửa, xoá khoản chi;
  - đổi tên thẻ, xoá thẻ;
  - ghi storage lỗi giữa chừng;
  - hai tab cùng mở;
  - nhập file sao lưu.
- **Ghi lệch một bên:** nợ thẻ đã đổi mà khoản chi không được lưu, hoặc ngược lại, mà không đảo lại bên kia.
- **Nợ thẻ bị đẩy xuống dưới 0** bởi các luồng mới.
- **Khoản quẹt thẻ lọt vào bất kỳ con số "đã chi" nào**, gồm:
  - dòng "Lương · đã chi";
  - số cần tất toán (tháng này và các tháng cũ);
  - tổng của một ngày trong danh sách;
  - donut "Chi theo nhãn";
  - biểu đồ "Chi tiêu theo tháng";
  - cột chồng 6 tháng và dòng "Tổng cộng";
  - thẻ "Chi tiêu tháng này" và cả ba gợi ý chi tiêu ở Tổng quan.
- **Khoản cũ đổi nghĩa**, ví dụ khoản "Trả nợ thẻ" đã ghi bỗng trừ nợ thẻ, hay bỗng không còn tính vào chi tiêu.
- **Mất khoản chi sau khi tải lại trang** vì schema mới chặt hơn dữ liệu cũ.
- **Lộ số tiền khi bật "Ẩn số tiền"**, kể cả số dư nợ trên nút chọn thẻ.
- **Trang bị cuộn ngang** ở màn rộng 320px.
- **Phá test đang có** mà không chủ đích sửa, hoặc để `npm run lint`, `tsc --noEmit`, `npm run build` báo lỗi.

## Ràng buộc

- Theo đúng CLAUDE.md:
  - dữ liệu dùng chung nằm trong `src/lib/budget/`, `src/lib/finance/`, `src/lib/settings/`;
  - giao diện nằm trong `src/features/budget/`;
  - feature không import feature khác;
  - test đặt trong `__tests__/` theo cấu trúc nguồn;
  - tên định danh tiếng Anh, chữ hiển thị tiếng Việt;
  - token `--ob-*`;
  - bố cục trong `Card` dùng container query.
- Quy tắc hook localStorage (CLAUDE.md mục 3):
  - mọi lần ghi dựng từ bản đọc tươi `getStored*()`;
  - mọi lần ghi đi qua `setStored*()`;
  - mảng parse theo từng phần tử bằng `safeArray`.
- Không thêm thư viện.
- Làm trên nhánh mới `feat/credit-card-swipe` tách từ `developer`.

## Thiết kế

### 1. Dữ liệu

**Liên kết thẻ trên khoản chi.** Thêm một field tuỳ chọn vào `Expense`:

```ts
type CardLinkKind = "swipe" | "payment"   // swipe = Quẹt thẻ, payment = Trả nợ thẻ
interface CardLink {
  kind: CardLinkKind
  cardName: string | null                 // null = thẻ đã bị xoá ở Tài chính
}
interface Expense { /* field cũ giữ nguyên */ card?: CardLink }
```

- **Chỉ `card` quyết định khoản chi có đụng nợ thẻ hay không, và có tính vào chi tiêu hay không. Nhãn không quyết định.**
  - Khoản cũ không có `card`, nên luôn tính vào chi tiêu như trước và không bao giờ đụng nợ thẻ. Khoản "Trả nợ thẻ" 5.317.725 ₫ được giữ đúng nhờ quy tắc này.
- **`kind` vẫn giữ khi thẻ bị xoá**, để khoản quẹt thẻ cũ vẫn tính 0 đ vào chi tiêu.
- **Schema zod:** `card` là `.optional()`.
  - Không được làm một khoản chi cũ (không có `card`) bị `safeArray` bỏ.
  - **(Claude)** Nếu `card` có mà sai dạng (chỉ có thể từ file sửa tay), field `card` rơi về `undefined` thay vì bỏ cả khoản chi. Khi đó khoản chi tính như khoản thường. Mất một khoản chi thì tệ hơn.

**Hai nhãn đặc biệt.** Đặt hằng số dùng chung trong `src/lib/budget/`:
- `CARD_SWIPE_TAG_LABEL = "Quẹt thẻ"`
- `CARD_PAYMENT_TAG_LABEL = "Trả nợ thẻ"`

Nhãn chỉ dùng **lúc ghi** để biết phải hỏi thẻ và gắn `card` loại nào. Cài đặt không cho đổi tên nhãn, nên so theo label là an toàn.

**Nhãn "Quẹt thẻ" trong Cài đặt**
- Thêm vào **cuối** `DEFAULT_TAGS`: `{ label: "Quẹt thẻ", emoji: "🧾", desc: "Chi bằng thẻ tín dụng — cộng vào nợ thẻ, không tính vào chi tiêu tháng", tint: <một màu trong TINT_PALETTE>, on: true }`.
- `parseAppSettings` tự **nối thêm** nhãn này vào cuối danh sách nhãn đã lưu nếu chưa có nhãn nào tên "Quẹt thẻ". Máy đang dùng đều có sẵn `tags` cũ, nên không nối thì sẽ không bao giờ thấy nhãn mới.
  - Nhãn đã có (kể cả đang tắt) thì giữ nguyên, không bật lại.
- **(Claude) Emoji là 🧾, không dùng 💳.** Commit 4a17348 (14/09/2026) đã cố ý đổi "Trả nợ thẻ" từ 💳 sang 🏦, vì 💳 hiển thị nghiêng, trông lệch cạnh chữ ở ô chọn nhãn và danh sách chi. Dùng lại 💳 sẽ quay lại đúng lỗi đó.
- **(Claude)** Nối ở cuối để vị trí của 11 nhãn cũ không đổi. Màu biểu đồ gán theo vị trí trong Cài đặt (`tagChartColors`), nên nhãn cũ không đổi màu.
- `CHART_PALETTE` hiện có đúng 11 màu. Thêm màu thứ 12, khác hẳn 11 màu kia, để "Quẹt thẻ" không trùng màu nhãn đầu.
  - Sửa chú thích "11 màu = 11 nhãn mặc định" cho khớp.

### 2. Tính toán: một nguồn duy nhất cho "số tiền tính vào chi tiêu"

Thêm vào `budget-calculations.ts`:
- `countedAmount(e)`: `e.card?.kind === "swipe" ? 0 : e.amount`.
- `swipedAmount(e)`: `e.card?.kind === "swipe" ? e.amount : 0`.

Mọi chỗ đang cộng `e.amount` để ra "chi tiêu" chuyển sang `countedAmount`:
- `totalExpensesForMonth`. Từ đây `remainingToSettle`, `unsettledPastMonths`, `monthlyExpenseTotals`, dòng "đã chi", Tổng quan và gợi ý chi tiêu tổng tự đúng theo.
- `groupExpensesByDay`: `total` của ngày. "· N khoản" vẫn đếm mọi khoản, kể cả quẹt thẻ.
- `breakdownByTag` / `TagBreakdownEntry`:
  - `total` là số tính vào chi tiêu;
  - thêm `swiped` là tổng tiền quẹt.
- `monthlyTagBreakdown` / `MonthlyTagSeries`:
  - `data` là số tính vào chi tiêu theo tháng;
  - thêm `swiped` theo tháng, hoặc tổng; cách nào là việc của người làm.
- `detectMoodSpendingCorrelation` trong `src/features/overview/insights-calculations.ts`: chỗ đang tự cộng `e.amount` theo ngày cũng dùng `countedAmount`.

Khoản "Trả nợ thẻ" có `card.kind = "payment"` vẫn tính đủ, vì tiền thật đã ra khỏi túi.

### 3. Ghi nợ thẻ: hàm trong `finance-storage.ts`

Thêm `applyCardBalanceDelta(name, delta)`:
- Mẫu giống `applySavingsFundDelta`: đọc tươi `getStoredFinance()` ngay lúc gọi, ghi bằng `setStoredFinance`.
- Trả về:
  - `{ ok: true, before, after }` khi ghi được;
  - `{ ok: false, reason: "card-not-found" }` khi không có thẻ tên đó;
  - `{ ok: false, reason: "insufficient-debt" }` khi `before + delta < 0`. Nợ thẻ không bao giờ bị đẩy xuống dưới 0.
- `delta > 0` là tăng nợ (quẹt), `delta < 0` là giảm nợ (trả, hoặc đảo lại một lần quẹt).

### 4. Luồng ghi trong `useBudget`

Mọi luồng có `card.cardName` khác `null` theo đúng thứ tự của `confirmSettlement`:
1. Gọi `applyCardBalanceDelta` trước.
2. Rồi ghi `budget-data` từ `getStoredBudget()` đọc tươi.
3. Bước 2 ném lỗi thì gọi lại `applyCardBalanceDelta` với `-delta` để đảo, rồi báo toast:
   - đảo được thì báo nợ thẻ giữ nguyên;
   - đảo không được thì báo rõ để chủ repo kiểm lại ở trang Tài chính.

Dấu của `delta`: `sign = kind === "swipe" ? +1 : -1`.

| Thao tác | delta |
| --- | --- |
| Thêm khoản | `sign × amount` |
| Sửa số tiền | `sign × (amount mới − amount cũ)`; bằng 0 thì không gọi |
| Xoá khoản | `−sign × amount` |

Khi một bước bị từ chối:
- `insufficient-debt`: chặn thao tác, **không ghi gì**, toast nói rõ lý do. Ví dụ:
  - "Thẻ "Visa" chỉ còn nợ 1.200.000 ₫." khi trả quá số nợ;
  - "Không thể xoá: thẻ "Visa" chỉ còn nợ 200.000 ₫, ít hơn khoản quẹt 500.000 ₫ này." khi xoá một lần quẹt mà thẻ đã được trả.
  - Số tiền trong toast đi qua `formatMoney(…, hidden)`.
- `card-not-found` khi **thêm**: chặn và báo, vì thẻ có thể vừa bị xoá ở tab khác.
- `card-not-found` khi **sửa/xoá** (dữ liệu nhập file không khớp): **(Claude)** vẫn sửa/xoá khoản chi, không đụng nợ thẻ, kèm toast cho biết nợ thẻ không đổi.

Khoản có `cardName: null` (thẻ đã xoá): sửa/xoá bình thường, không đụng nợ thẻ.

Kết quả trả về:
- `addExpense`, `updateExpense`, `removeExpense` trả `boolean`, giống `confirmSettlement`.
- Form chỉ xoá ô nhập, modal chỉ đóng khi kết quả là `true`.
- Mọi nhánh lỗi tự báo toast.

`updateExpense` với khoản đã gắn thẻ **giữ nguyên `tag` và `card` gốc**, chỉ đổi `amount` và `note`. Hook tự bảo đảm điều này, không chỉ dựa vào giao diện.

### 5. Sửa / đổi tên / xoá thẻ ở trang Tài chính

**Hai hàm mới trong `budget-storage.ts`**
- `renameCardInExpenses(oldName, newName)`: `updateCard` trong `useFinance` gọi khi tên thẻ đổi.
- `detachCardFromExpenses(name)`: `removeCard` gọi. Hàm này đặt `cardName: null` cho mọi khoản gắn thẻ đó và giữ `kind`.
  - Nhờ vậy, một thẻ mới tạo sau trùng tên không bị các khoản cũ âm thầm đụng vào.

**Ghi hai key phải đi cùng nhau.** **Không** chép nguyên cách `updateSavingsFund` gọi `renameFundInSettlements`: cách đó ghi `finance-data` xong mới cập nhật `budget-data`, và không đảo lại khi bước sau lỗi. Với thẻ, làm như sau:
- Ghi `finance-data` trước, rồi đổi tên/gỡ thẻ trong `budget-data`.
- Bước sau lỗi thì ghi lại thẻ như cũ vào `finance-data`, đọc tươi rồi đặt lại đúng thẻ gốc ở đúng vị trí. Sau đó báo toast lỗi.
- Không bao giờ để lại tình trạng thẻ đã đổi tên/đã xoá mà khoản chi vẫn trỏ tên cũ, hay ngược lại.

**Hộp "Sửa thẻ" không được ghi đè dư nợ cũ.** **(Claude)**
- Hiện `EditCreditCardModal` chép `balance` vào form lúc mở, và `updateCard` thay cả thẻ bằng giá trị của form. Nếu trong lúc hộp đang mở, một khoản quẹt/trả được ghi (ở tab khác, hoặc trước khi trang kịp đọc lại), bấm Lưu sẽ ghi dư nợ cũ đè lên và làm mất khoản đó.
- Ô "Dư nợ" **vẫn giữ để sửa tay**. Cần nó để chỉnh theo sao kê: lãi, phí, khoản quẹt không ghi trong app.
- Lưu mà **không đổi** ô "Dư nợ" thì giữ dư nợ đọc tươi trong `finance-data`, không dùng số đã chép lúc mở hộp.
- Lưu mà **có đổi** ô "Dư nợ" thì số mới là mốc "nợ trước đó" mới. Từ đó các khoản quẹt/trả cộng/trừ tiếp trên mốc này.
- Cách nhận biết "có đổi" (so với số lúc mở hộp, hay một cờ riêng) là việc của người làm.

### 6. Giao diện ghi khoản chi (`ExpenseEntryForm`)

`BudgetView` lấy thêm `cards` từ `useFinance()` và truyền xuống form.

Khi chọn chip "Quẹt thẻ" hoặc "Trả nợ thẻ":

| Số thẻ | "Quẹt thẻ" | "Trả nợ thẻ" |
| --- | --- | --- |
| 0 | Chip bị khoá; lời nhắc "Chưa có thẻ tín dụng. Thêm thẻ ở trang Tài chính để ghi khoản quẹt thẻ." **(Claude)** | **(Claude)** Vẫn ghi được như khoản thường, không gắn `card`, kèm dòng nhắc "Chưa có thẻ tín dụng nên khoản này không trừ nợ thẻ." |
| 1 | Tự chọn thẻ đó; hiện một dòng "Thẻ: <tên>" để biết khoản ghi vào đâu | như cột bên |
| ≥ 2 | Hiện hàng nút chọn thẻ, **bắt buộc chọn** trước khi bấm "Ghi khoản chi" | như cột bên |

**Nút chọn thẻ** **(Claude)**
- Giống `FundPicker`: tên thẻ kèm dư nợ rút gọn (`formatMoneyCompact`).
- Tên truy cập của nút chỉ là tên thẻ. Dư nợ đầy đủ đọc qua `aria-describedby`. Ẩn số tiền thì che.
- Có thể tổng quát hoá `FundPicker` hay viết component riêng trong `src/features/budget/components/`, tuỳ người làm.

**Trả nợ thẻ** vượt dư nợ của thẻ đang chọn: ô số tiền báo lỗi "Thẻ "<tên>" chỉ còn nợ <số>", và nút ghi bị khoá.

Bỏ chọn chip, hay đổi sang nhãn khác, thì bỏ luôn thẻ đã chọn.

### 7. Sửa khoản chi (`EditExpenseModal`)

**Khoản đã gắn thẻ** (`card` có mặt) **(Claude)**:
- Không đổi được nhãn và thẻ. Hiện nhãn và tên thẻ dạng chữ, không bấm được.
- Sửa được số tiền và ghi chú.
- Muốn đổi nhãn hay thẻ thì xoá rồi ghi lại.
- Lý do: đổi qua lại giữa quẹt/trả/khoản thường hay giữa hai thẻ sinh ra nhiều đường cộng/trừ chéo, dễ lệch. Chủ repo cần nợ thẻ không lệch.

**Khoản thường**: không có chip "Quẹt thẻ" và "Trả nợ thẻ" để chọn.
- Riêng khoản cũ đang mang nhãn "Trả nợ thẻ" vẫn hiện chip của chính nó (cơ chế `extraTag` sẵn có) và giữ nguyên nhãn khi lưu.

**Kiểm tra trước khi lưu:** áp đúng ràng buộc nợ ≥ 0 của mục 4 ngay trên form. Ví dụ tăng một khoản trả quá dư nợ, hay giảm một khoản quẹt nhiều hơn dư nợ còn lại, thì báo lỗi tại ô số tiền và khoá nút Lưu.

### 8. Hiển thị

**Dòng khoản chi** (`ExpenseListCard`)
- Khoản quẹt thẻ hiện số tiền dạng `0 ₫ / 500.000 ₫`.
- **(Claude)** Khoản gắn thẻ (quẹt hay trả) có dòng phụ "Thẻ <tên>". Khi `cardName` là `null` thì tên thẻ đã mất lúc xoá thẻ, nên chỉ ghi "Thẻ đã xoá".
- Dòng phụ đứng cạnh ghi chú nếu có.
- Hộp xác nhận xoá một khoản gắn thẻ nói thêm nợ thẻ sẽ thay đổi bao nhiêu. Ví dụ "Nợ thẻ "Visa" sẽ giảm 500.000 ₫."

**Tổng ngày**: chỉ cộng phần tính vào chi tiêu (mục 2).

**Donut "Chi theo nhãn (tháng này)"**
- **(Claude)** Bỏ hẳn mục có `total = 0` (tức Quẹt thẻ), để không có lát 0% và callout "0%".
- Số "Tổng chi" ở giữa chỉ là chi tiêu thật.

**Biểu đồ cột chồng 6 tháng và danh sách tổng kết** (`MonthlyTagTrendChart`)
- Không vẽ series "Quẹt thẻ" trên cột, vì nó luôn 0.
- Danh sách tổng kết có dòng "🧾 Quẹt thẻ" với số tiền `0 ₫ / X ₫`, trong đó X là tổng quẹt thẻ của 6 tháng. Dòng chỉ hiện khi X > 0.
- **(Claude)** Dòng này đứng **cuối danh sách**, ngay trên "Tổng cộng". Nó không có trong legend của biểu đồ, nên không theo thứ tự legend.
- "Tổng cộng" không cộng X.

**Chung**
- Mọi con số đi qua `formatMoney(…, hidden)`. Ẩn số tiền thì cả hai vế của `0 ₫ / X ₫` đều bị che.
- Màn hẹp: `0 ₫ / 500.000 ₫` không được làm vỡ dòng hay đẩy nút Sửa/Xoá ra ngoài. Cho phép xuống dòng ở dấu `/`.

### 9. Kiểm thử (chủ repo yêu cầu kiểm kỹ phần nợ thẻ)

Tối thiểu phải có test cho:

**Tính toán** (`src/lib/__tests__/budget/budget-calculations.test.ts`)
- Khoản quẹt thẻ không vào: `totalExpensesForMonth`, `remainingToSettle`, `unsettledPastMonths`, tổng ngày, `breakdownByTag.total`, `monthlyTagBreakdown.data`, `monthlyExpenseTotals`.
- Khoản trả nợ thẻ có vào.
- Khoản cũ không có `card` có vào.

**Gợi ý ở Tổng quan**: gợi ý tâm trạng–chi tiêu không cộng khoản quẹt thẻ.

**Storage**
- Đọc dữ liệu cũ không có `card` giữ nguyên mọi khoản.
- `card` sai dạng không làm mất khoản chi.
- `applyCardBalanceDelta`: tăng, giảm, chặn khi xuống dưới 0, không có thẻ.
- `renameCardInExpenses`, `detachCardFromExpenses`.
- Cài đặt cũ không có "Quẹt thẻ" được nối thêm vào cuối; đã có (kể cả đang tắt) thì không nối trùng, không bật lại.

**Hook `useBudget`**, mỗi trường hợp kiểm **cả** nợ thẻ trong `finance-data` **lẫn** khoản chi trong `budget-data`:
- thêm quẹt, thêm trả;
- sửa tăng, sửa giảm;
- xoá quẹt, xoá trả;
- trả quá nợ bị chặn;
- xoá quẹt khi thẻ đã được trả bị chặn;
- thẻ đã xoá;
- ghi `budget-data` lỗi thì nợ thẻ được đảo về như cũ;
- chuỗi đầy đủ: quẹt nhiều lần → trả đầu tháng → sửa → xoá, kết thúc với nợ thẻ đúng bằng phép tính tay.

**Hook `useFinance`**
- Đổi tên thẻ thì khoản chi đổi theo.
- Xoá thẻ thì khoản chi về `cardName: null` và giữ `kind`.
- Ghi `budget-data` lỗi thì thẻ về như cũ (tên, vị trí, dư nợ).
- "Sửa thẻ" không đổi ô dư nợ thì giữ dư nợ đọc tươi, kể cả khi `finance-data` vừa bị một khoản quẹt ghi sau lúc mở hộp. Có đổi thì lấy số mới.

**Giao diện**
- Form: 0, 1, 2 thẻ; khoá nút khi chưa chọn thẻ; khoá nút khi trả quá nợ; không xoá ô nhập khi ghi thất bại.
- Modal sửa: khoá nhãn/thẻ; báo lỗi số tiền.
- Danh sách: `0 ₫ / X ₫`, tổng ngày, dòng thẻ.
- Danh sách tổng kết 6 tháng: dòng Quẹt thẻ và "Tổng cộng".
- Ẩn số tiền ở mọi chỗ mới.

**Trước khi bàn giao:** chạy `npm run test`, `npm run lint`, `tsc --noEmit`, `npm run build` đều sạch. Sau đó chủ repo tự bấm thử trên trình duyệt trước khi commit tính năng.

## Giới hạn đã biết (Claude chấp nhận, không làm thêm)

- Một tab trình duyệt **còn chạy bản app cũ** (mở từ trước khi cập nhật, chưa tải lại) sẽ bỏ field `card` của mọi khoản chi ở lần ghi kế tiếp, vì schema cũ lược field lạ.
  - Hậu quả: khoản quẹt thẻ bị tính lại vào chi tiêu, nhưng nợ thẻ không đổi.
  - Code mới không chặn được việc này. Sau khi cập nhật, tải lại mọi tab đang mở app.

## Để người làm tự quyết

- Tên chính xác của hàm, type, prop; tách component chọn thẻ hay tổng quát hoá `FundPicker`.
- Màu thứ 12 của `CHART_PALETTE` và `tint` của nhãn "Quẹt thẻ" (trong `TINT_PALETTE`).
- `MonthlyTagSeries.swiped` lưu theo tháng hay chỉ tổng.
- Câu chữ chính xác của toast và lời nhắc, miễn đúng ý ở trên và không lộ số khi ẩn số tiền.
- Cập nhật README/CLAUDE.md nếu có phần mô tả trang Chi tiêu hay Tài chính.
