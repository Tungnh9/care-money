# Bán vàng/bạc lấy tiền — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghi được một lần bán vàng/bạc lấy ra từ một lần mua. Tiền thực nhận được cộng vào sổ tiết kiệm trong cùng một lần ghi; có lãi/lỗ đã chốt, lịch sử bán (huỷ được), và khối "Vàng/bạc tháng này" ở Chi tiêu.

**Architecture:** Làm theo khuôn của tính năng Tặng.
- `MetalSale` là bản ghi riêng, mỗi kim loại một danh sách (`goldSales`, `silverSales`) trong `"finance-data"`, cùng chỗ với sổ tiết kiệm.
- Số còn lại tính bằng `heldQuantityOf(quantityOf, [...gifts, ...sales])`.
- `useMetalActions` có thêm `addSale`/`removeSale`; mỗi hàm sửa sổ tiết kiệm và danh sách bán trong **một** lần `persist`.
- Khối Chi tiêu gộp lần tặng và lần bán.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, zod 4, Vitest + RTL, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-26-metal-sell-design.md`

## Global Constraints

- Tên định danh tiếng Anh, chữ hiển thị tiếng Việt. Chi tiêu chỉ đọc qua `src/lib/finance`.
- Mọi lần ghi đọc tươi `getStoredFinance()`. Mảng mới parse bằng `safeArray` trong `parseFinanceState`.
- `received` là số nguyên từ 1 đến `MAX_BUDGET_AMOUNT` (999.999.999.999 đ, ở `src/lib/budget/budget-calculations.ts`). Schema đọc bằng `z.number()`.
- "Ẩn số tiền" áp dụng cho mọi số tiền mới, kể cả trong hộp xác nhận. Toast **không** ghi số tiền.
- `src/` phải qua `npm run format:check`. Hook pre-commit chặn nếu lệch; chạy `npm run format` trước khi commit.
- Mỗi task: `npx tsc --noEmit`, `npm run lint`, `npm run test` xanh trước khi commit.

## Review Focus

1. Xoá sổ đã nhận tiền, rồi tạo sổ mới trùng tên → lần bán cũ vẫn **không** huỷ được, không rút tiền từ sổ mới (Task 2).
2. Đổi tên sổ đã nhận tiền → huỷ lần bán rút đúng sổ đó, dưới tên mới (Task 2).
3. Sổ đã tiêu bớt, còn ít hơn số đã nhận → huỷ bị từ chối, sổ và lịch sử giữ nguyên (Task 2).
4. Lần mua đã tặng 1 và bán 2 → mọi chỗ tính số còn lại đều trừ cả hai: bảng, modal Tặng, modal Bán, modal sửa lần mua (Task 3).
5. "Ẩn số tiền" → tiền nhận và lãi/lỗ bị che ở Lịch sử bán, hộp huỷ và khối Chi tiêu (Task 3, Task 4).

---

### Task 1: Dữ liệu lần bán và số còn lại

**Files:**
- Modify: `src/lib/finance/types.ts`, `finance-storage.ts`, `metal-calculations.ts`, `finance-calculations.ts`, `metal-naming.ts`, `use-finance.ts` (chỉ trả state)
- Modify: 3 chỗ gọi `summarizeFinance` (`finance-view.tsx`, `goals-view.tsx`, `overview-view.tsx`), cộng `use-finance.ts`, `metal-tab.tsx` và `src/lib/budget/budget-calculations.ts` (`giftsMadeInMonth` đang gọi `giftsInMonth`) vì đổi tên hàm.
- Test: `finance-storage.test.ts`, `metal-calculations.test.ts`, `finance-calculations.test.ts`, `metal-naming.test.ts`; object kỳ vọng của test "wipeData" thêm `goldSales: []`, `silverSales: []`.

**Interfaces — Produces:**
- `interface MetalSale { id: number; purchaseId: number; date: string; qty: number; store: string; buy: number; received: number; fundName: string; fundRemoved?: boolean; note?: string }`
- `type MetalSaleInput = Pick<MetalSale, "date" | "qty" | "received" | "fundName" | "note">`
- `FinanceState` thêm `goldSales` (sau `goldGifts`) và `silverSales` (sau `silverGifts`), mặc định `[]`; thêm `metalSaleSchema`.
- `metal-calculations.ts`:
  - đổi tên `earliestGiftDate` → `earliestTakeoutDate(takeouts: Pick<MetalGift, "purchaseId" | "date">[], purchaseId: number): string | null`;
  - đổi tên `giftsInMonth` → `takeoutsInMonth<T extends Pick<MetalGift, "id" | "date">>(items: T[], month: string): (T & { dayKey: string })[]`;
  - thêm `metalSalePL(sale: Pick<MetalSale, "qty" | "buy" | "received">): number` = `received − qty × buy`;
  - `heldQuantityOf` giữ nguyên, nhận cả lần tặng lẫn lần bán.
- `metal-naming.ts`: `formatTakenOut(naming: MetalNaming, gifted: number, sold: number): string | null` → "đã tặng 1 phân" / "đã bán 2 phân" / "đã tặng 1 phân · đã bán 2 phân"; cả hai bằng 0 thì null.
- `summarizeFinance` dùng `heldQuantityOf(…, [...state.goldGifts, ...state.goldSales])`, bạc tương tự.
- `useFinance` trả thêm `goldSales`, `silverSales`.

- [ ] **Step 1: Test (đỏ)**
  - lần bán qua được vòng lưu → đọc (`Required<MetalSale>`, gồm `fundRemoved` và `note`);
  - lần bán hỏng bị bỏ riêng; dữ liệu cũ đọc ra `[]`;
  - `received: 1_500_000_000_000` vẫn đọc được (không bị rơi);
  - `metalSalePL({ qty: 2, buy: 900_000, received: 1_900_000 }) === 100_000`;
  - `earliestTakeoutDate` lấy mốc sớm nhất trong cả lần tặng lẫn lần bán;
  - `takeoutsInMonth` lọc lần bán theo tháng, mới nhất trước;
  - `formatTakenOut` cho đủ 4 trường hợp;
  - `summarizeFinance`: 10 phân, đã tặng 1, đã bán 2 → `goldPhan` 7.
- [ ] **Step 2–4:** đỏ → viết code → xanh (tsc, lint, test, format).
- [ ] **Step 5: Commit** `feat: store gold and silver sales and hold only what is left after gifts and sales`

### Task 2: Hàm ghi lần bán trong `useFinance`

**Files:**
- Modify: `src/lib/finance/use-finance.ts`
- Test: `src/lib/__tests__/finance/use-finance.test.ts` (describe mới "useFinance — bán vàng/bạc")

**Interfaces:**
- Consumes: Task 1.
- `MetalLens<P>` thêm `sales`, `withSales`.
- `useMetalActions` thêm `addSale(purchaseId: number, input: MetalSaleInput): boolean` và `removeSale(id: number): void`.
- `useFinance` trả `addGoldSale`, `removeGoldSale`, `addSilverSale`, `removeSilverSale`.

**Hành vi** (đọc tươi; mọi thay đổi sổ + danh sách bán nằm trong một `persist`):
- `addSale`: lần lượt kiểm tra, sai ở bước nào thì toast lỗi và trả false:
  1. lần mua không còn → `Không tìm thấy lần mua này nữa.`;
  2. số lượng không phải số nguyên > 0 → `Số lượng bán phải là số nguyên lớn hơn 0.`;
  3. vượt số còn lại (mua − tặng − bán) → ``Lần mua này chỉ còn ${q(còn)} — không đủ để bán ${q(qty)}.``;
  4. `received` không phải số nguyên trong 1..`MAX_BUDGET_AMOUNT` → `Số tiền nhận phải là số nguyên lớn hơn 0.`;
  5. không có sổ tên `fundName` → ``Không tìm thấy sổ "${fundName}".``.

  Hợp lệ: cộng `received` vào sổ, chèn lần bán lên đầu (`nextId(sales)`, chụp `store` và `buy`). Toast ``Đã ghi lần bán ${q(qty)} ${noun} ngày ${date} vào sổ "${fundName}"``, trả true. Ghi lỗi → ``Không thể ghi lần bán ${noun}. Vui lòng thử lại.``.
- `removeSale`:
  - `fundRemoved`, hoặc không còn sổ tên đó → ``Sổ "${fundName}" đã bị xoá — không huỷ được lần bán này.``;
  - số dư sổ < `received` → ``Sổ "${fundName}" không còn đủ tiền để rút lại số đã nhận — không huỷ được lần bán này.``;
  - hợp lệ: trừ `received` khỏi sổ, bỏ lần bán. Toast ``Đã huỷ lần bán ${noun} ngày ${date}``.
- Hàm cũ phải tính cả lần bán:
  - `removePurchase`: còn lần tặng thì giữ câu cũ; chỉ còn lần bán → `Không thể xoá lần mua này vì đã có lần bán lấy từ đây. Huỷ các lần bán trước.`;
  - `updatePurchase`: số lượng mới < tặng + bán → ``Lần mua này ${formatTakenOut(...)} — không sửa số lượng xuống thấp hơn.`` (chỉ có tặng thì ra đúng câu cũ). Ngày mua sau `earliestTakeoutDate` của cả tặng lẫn bán → ``Ngày mua không được sau lần tặng hoặc bán sớm nhất (${d}).``;
  - `addPurchase`: `nextId` tính cả `purchaseId` của lần bán;
  - `updateGift`: giới hạn trừ cả phần đã bán.
- Sổ tiết kiệm, trong cùng `persist` của hàm sổ:
  - `updateSavingsFund` đổi tên → đổi `fundName` ở mọi lần bán (cả hai kim loại) đang trỏ tên cũ và chưa `fundRemoved`;
  - `removeSavingsFund` → đặt `fundRemoved: true` cho các lần bán đang trỏ tên đó.

- [ ] **Step 1: Test (đỏ)**
  - bán 2 phân, nhận 1.900.000 vào "Quỹ A" → sổ cộng đúng; `goldSales[0]` đúng bản chụp; toast đúng; vàng không đổi gì khác;
  - từ chối lần lượt: vượt số còn lại (gồm phần đã tặng), số lượng 0, tiền nhận 0 hoặc vượt trần, sổ không tồn tại;
  - huỷ → sổ trừ đúng, lần bán mất;
  - huỷ khi sổ không đủ tiền → từ chối, không đổi gì (Review Focus 3);
  - đổi tên sổ → `fundName` đổi theo; huỷ rút đúng sổ (Review Focus 2);
  - xoá sổ rồi tạo sổ mới trùng tên → lần bán có `fundRemoved`, huỷ bị từ chối, sổ mới không bị trừ (Review Focus 1);
  - xoá lần mua đã có lần bán bị chặn; sửa số lượng dưới tặng + bán bị chặn; dời ngày mua qua ngày bán bị chặn;
  - lần mua mới không lấy id mà lần bán còn trỏ tới; sửa lần tặng không vượt phần còn lại sau khi trừ phần đã bán;
  - bán bạc chỉ ghi vào `silverSales`, toast có "bạc".
- [ ] **Step 2–4:** đỏ → viết code → xanh. Các test cũ của phần Tặng có câu thông báo được tổng quát hoá thì cập nhật câu chữ (ghi vào ledger).
- [ ] **Step 5: Commit** `feat: sell from a purchase into a savings fund and undo a sale through the shared metal actions`

### Task 3: Tab Tích lũy — nút Bán, modal Bán, Lịch sử bán

**Files:**
- Create: `metal-sale-modal.tsx`, `metal-sale-history-card.tsx`, cùng test của hai file.
- Modify: `metal-transactions-table.tsx`, `metal-transactions-cards.tsx`, `edit-metal-purchase-modal.tsx`, `metal-tab.tsx`, `gold-tab.tsx`, `silver-tab.tsx`, `finance-view.tsx`
- Test: `gold-tab.test.tsx`, `silver-tab.test.tsx` (thêm vào `noopHandlers` các key `goldSales`/`silverSales`, `savings` và 2 handler; cộng test mới), `finance-view.test.tsx` (luồng bán end-to-end).

**Interfaces:**
- **Bảng và thẻ giao dịch** thêm props tuỳ chọn:
  - `sold?: Map<number, number>`;
  - `onSell?: (purchase: P) => void`;
  - `sellBlockedReason?: string`: khác rỗng thì nút Bán bị khoá với title đó.

  Theo từng dòng:
  - số lượng = mua − tặng − bán;
  - dòng phụ dùng `formatTakenOut`;
  - nút Bán (`HandCoins`), aria ``Bán từ lần mua ${noun} ${label}``. Khoá khi còn < 1 (title ``Còn dưới 1 ${unit} — không bán được.``) hoặc khi có `sellBlockedReason`;
  - nút Xoá khoá khi có tặng hoặc bán. Chỉ có tặng thì giữ title cũ; có bán thì `Không thể xoá — lần mua này đã có lần tặng hoặc lần bán. Huỷ chúng trước.`
- **`EditMetalPurchaseModal`**:
  - thêm `minQuantityHint?: string`, là câu báo lỗi dựng sẵn khi số lượng < `minQuantity`. Không truyền thì giữ câu "Đã tặng … từ lần mua này — …";
  - câu `latestDate` đổi thành ``Ngày mua không được sau lần tặng hoặc bán sớm nhất (${latestDate})``.
- **`MetalSaleModal`**:
  - props:
    - `metal`
    - `target: { purchaseDate: string; store: string; buy: number; available: number } | null`
    - `savings: SavingsFund[]`
    - `onOpenChange`
    - `onSave: (input: MetalSaleInput) => boolean`
  - tiêu đề ``Bán ${noun}``; dòng thông tin ``Lần mua ngày ${purchaseDate} ở ${store} · bán được tối đa ${q(floor(available))}``;
  - các ô:
    - "Ngày bán": điền sẵn hôm nay, không trước ngày mua;
    - ``Số lượng bán (${unit})``;
    - "Tiền thực nhận": `numeric group`, hậu tố "đ";
    - `FundPicker` có nhãn "Sổ nhận tiền";
    - "Ghi chú (không bắt buộc)";
  - đủ số lượng và tiền thì hiện ``Lãi/lỗ sẽ chốt: ${signedMoney(received − qty×buy, hidden)}``, tô theo `metalPLTone`;
  - Lưu khoá tới khi mọi ô hợp lệ và đã chọn sổ; đóng khi `onSave` trả true;
  - ô điền một lần mỗi lần mở (cờ `seeded`, như `MetalGiftModal`).
- **`MetalSaleHistoryCard`**:
  - props: `metal`, `sales: MetalSale[]`, `onRemove: (sale) => void`; rỗng thì trả null;
  - Card label ``Lịch sử bán · ${n} lần``; dòng tổng ``Lãi/lỗ đã chốt: ${signedMoney(Σ metalSalePL, hidden)}``, tô màu;
  - mỗi dòng ``Bán ${q(qty)}``, dòng phụ ``${date} · ${store} · vào ${fundName}`` cộng " (đã xoá)" nếu `fundRemoved` và `` · ${note}`` nếu có. Tiền nhận `formatMoney(received, hidden)` và `MetalPLBadge` của `metalSalePL`;
  - nút Huỷ (`Undo2`), aria ``Huỷ lần bán ${label}``, khoá khi `fundRemoved` với title `Sổ nhận tiền đã bị xoá — không huỷ được lần bán này.`;
  - bố cục lưới theo bề rộng Card như `MetalGiftHistoryCard`.
- **`MetalTab`** thêm props `sales`, `savings`, `onAddSale`, `onRemoveSale`. Bên trong:
  - `heldQty = heldQuantityOf(metal.quantityOf, [...gifts, ...sales])`;
  - map `sold`;
  - `sellBlockedReason` = `savings.length ? undefined : "Chưa có sổ tiết kiệm nào để nhận tiền — tạo 1 sổ ở tab Tiết kiệm trước."`;
  - câu "hết lần mua": chỉ tặng thì giữ câu cũ; chỉ bán → ``Đã bán hết các lần mua ${noun} — xem lại ở mục Lịch sử bán.``; cả hai → ``Đã tặng và bán hết các lần mua ${noun} — xem lại ở mục Lịch sử tặng và Lịch sử bán.``;
  - modal sửa lần mua: `minQuantity` = tặng + bán, `minQuantityHint` dựng từ `formatTakenOut` (viết hoa chữ đầu), `latestDate` = `earliestTakeoutDate([...gifts, ...sales], id)`;
  - hộp huỷ lần bán:
    - tiêu đề "Huỷ lần bán này?";
    - nội dung ``${q} sẽ trả về lần mua ngày ${d} ở ${store}, và ${formatMoney(received, hidden)} được rút lại khỏi sổ "${fundName}".``;
    - nút "Huỷ lần bán", nút thoát "Giữ lại";
  - trạng thái modal/hộp bị bỏ khi bản ghi biến mất, như phần Tặng.
- **`GoldTab`/`SilverTab`** thêm `goldSales`/`silverSales`, `savings`, `onAddGoldSale`, `onRemoveGoldSale` (bạc tương tự). `FinanceView` truyền từ hook.

- [ ] **Step 1: Test (đỏ)**
  - **modal:**
    - điền sẵn hôm nay;
    - từ chối "1,5", "0", số vượt mức, ngày trước ngày mua, tiền 0 hoặc vượt trần;
    - Lưu khoá khi chưa chọn sổ;
    - xem trước lãi/lỗ; lưu ra đúng input; không đóng khi `onSave` trả false.
  - **lịch sử:**
    - dòng, tổng lãi/lỗ, "(đã xoá)" và nút huỷ bị khoá;
    - "Ẩn số tiền" che tiền nhận và lãi/lỗ (Review Focus 5).
  - **GoldTab:**
    - lần mua 10 phân, tặng 1, bán 2 → "7 phân", "đã tặng 1 phân · đã bán 2 phân";
    - modal Tặng và modal Bán tối đa 7; sửa lần mua xuống 2 bị chặn với câu có cả "đã bán" (Review Focus 4);
    - nút Bán khoá khi chưa có sổ;
    - hộp huỷ lần bán có tiền và tên sổ, gọi `onRemoveGoldSale`.
  - **FinanceView:** có sổ "Quỹ A" 1.000.000, bán 2 phân nhận 1.900.000 → trụ vàng giảm, trụ Tiết kiệm 2.900.000, "Lịch sử bán · 1 lần"; huỷ → về như cũ.
- [ ] **Step 2–4:** đỏ → viết code → xanh.
- [ ] **Step 5: Commit** `feat: sell from a gold or silver purchase into a savings fund and review the sale history`

### Task 4: Khối "Vàng/bạc tháng này" ở Chi tiêu

**Files:**
- `git mv src/features/budget/components/gift-block.tsx metal-month-block.tsx`
- Modify: `src/lib/budget/budget-calculations.ts`, `expense-list-card.tsx`, `budget-view.tsx`
- Test: `budget-calculations.test.ts`, `expense-list-card.test.tsx`, `budget-view.test.tsx` (đổi test id và tiêu đề của khối quà cũ)

**Interfaces:**
- `type MetalMonthItem = (MetalGift & { kind: "gift"; dayKey: string; naming: MetalNaming }) | (MetalSale & { kind: "sale"; dayKey: string; naming: MetalNaming })`
- `metalMovesMadeInMonth({ goldGifts, silverGifts, goldSales, silverSales }, month): MetalMonthItem[]`, thay `giftsMadeInMonth`. Mới nhất trước; cùng ngày thì giữ thứ tự vàng tặng, bạc tặng, vàng bán, bạc bán.
- `MetalMonthBlock({ items })`:
  - `data-testid="metal-month-block"`, tiêu đề "Vàng/bạc tháng này", mỗi dòng có `data-testid="metal-month-row"`;
  - dòng tặng giữ nguyên như hiện nay;
  - dòng bán: ``Bán ${q} ${noun}``, dòng phụ ``${dd/mm} · ${store} · vào ${fundName}``, bên phải `formatMoney(received, hidden)`;
  - icon `HandCoins` cho dòng bán, `Gift` cho dòng tặng.
- `ExpenseListCard` đổi prop `gifts` → `metalMoves?: MetalMonthItem[]`.

- [ ] **Step 1: Test (đỏ)**
  - gộp tặng + bán của cả hai kim loại theo tháng;
  - khối có cả dòng tặng lẫn dòng bán với đúng chữ;
  - "Ẩn số tiền" che tiền;
  - `BudgetView`: lần bán tháng 9 hiện, lần bán tháng 8 không hiện; "đã chi" không đổi.
- [ ] **Step 2–4:** đỏ → viết code → xanh.
- [ ] **Step 5: Commit** `feat: list this month's gold and silver sales next to gifts on the spending page`

### Task 5: README

- [ ] README:
  - dòng `/finance`: thêm nút Bán (tiền vào sổ tiết kiệm, lãi/lỗ đã chốt, Lịch sử bán huỷ được);
  - dòng `/budget`: khối đổi tên "Vàng/bạc tháng này", gồm cả lần bán.
- [ ] `npm run build` sạch. Commit `docs: describe selling gold and silver`.
