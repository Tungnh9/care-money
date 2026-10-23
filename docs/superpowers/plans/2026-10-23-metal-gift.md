# Tặng vàng/bạc từ tích lũy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghi được một lần tặng vàng/bạc lấy ra từ một lần mua cụ thể. Số đang giữ và Tài sản ròng giảm theo phần đã tặng; lịch sử tặng xem/sửa/huỷ ở tab Tích lũy; trang Chi tiêu chỉ hiện các lần tặng trong tháng để xem, không đụng vào tiền tháng đó.

**Architecture:** Lần tặng là bản ghi riêng `MetalGift`, mỗi kim loại một danh sách (`goldGifts`, `silverGifts`) trong `"finance-data"`. Số còn lại của một lần mua không lưu mà tính ra: `heldQuantityOf(quantityOf, gifts)` trừ phần đã tặng. `summarizeFinance` và `MetalTab` đều dùng hàm này, nên mọi số đang giữ, giá vốn, giá trị và Tài sản ròng tự giảm theo. Hook có thêm 3 hàm ghi cho mỗi kim loại qua `useMetalActions` sẵn có. Chi tiêu đọc lần tặng qua `useFinance()` và vẽ khối "Quà tặng từ tích lũy" theo mẫu khối "Chốt sổ".

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, zod 4, Vitest + RTL, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-23-metal-gift-design.md`

## Global Constraints

- Tên định danh tiếng Anh, chữ hiển thị tiếng Việt. Chi tiêu không import `src/features/finance`; phần dùng chung đặt ở `src/lib/`.
- Mọi lần ghi đọc tươi `getStoredFinance()`. Mảng mới parse theo từng phần tử bằng `safeArray`, trong `parseFinanceState` sẵn có.
- Tab vàng hiện có giữ nguyên chữ, DOM và số liệu khi không có lần tặng nào. Các test vàng đang có chỉ được sửa fixture/props, không sửa assertion.
- Trị giá lần tặng = `qty × buy` của bản chụp lúc tặng. Không chạy theo giá thị trường.
- "Ẩn số tiền" áp dụng cho mọi số tiền mới (`formatMoney(…, hidden)`).
- Mỗi task: `npx tsc --noEmit`, `npm run lint`, `npm run test` đều xanh trước khi commit.

## Review Focus

1. Sửa số lượng một lần mua xuống dưới tổng đã tặng → bị chặn, cả ở hook (Task 2) lẫn ở modal sửa (Task 3).
2. Lần tặng có ngày thuộc tháng trước → không hiện trong khối của tháng này ở Chi tiêu, vẫn có trong lịch sử (Task 4).
3. Bật "Ẩn số tiền" → trị giá lần tặng bị che ở lịch sử và ở Chi tiêu (Task 3, Task 4).
4. Tab khác vừa tặng bớt từ cùng lần mua → lần tặng mới vượt số còn lại bị từ chối, vì hook đọc tươi (Task 2).
5. Bản sao lưu có lần tặng trỏ tới lần mua không còn → lịch sử vẫn hiện, không lỗi (Task 3).

---

### Task 1: Dữ liệu lần tặng, số còn lại, tên gọi dùng chung

**Files:**
- Modify: `src/lib/finance/types.ts`, `src/lib/finance/finance-storage.ts`, `src/lib/finance/metal-calculations.ts`, `src/lib/finance/finance-calculations.ts`
- Create: `src/lib/finance/metal-naming.ts`
- Modify: `src/features/finance/metal-config.ts`; 3 chỗ gọi `summarizeFinance` (`finance-view.tsx`, `goals-view.tsx`, `overview-view.tsx`) truyền thêm `goldGifts`, `silverGifts`
- Test: `src/lib/__tests__/finance/finance-storage.test.ts`, `metal-calculations.test.ts`, `finance-calculations.test.ts`, `src/lib/__tests__/finance/metal-naming.test.ts`; sửa object kỳ vọng của test "wipeData" trong `use-data-management.test.ts` (thêm `goldGifts: []`, `silverGifts: []`)

**Interfaces — Produces:**
- `interface MetalGift { id: number; purchaseId: number; date: string; qty: number; store: string; buy: number; note?: string }`. `date` là dd/mm/yyyy như ngày mua. `store`, `buy` chụp lại từ lần mua lúc tặng.
- `type MetalGiftInput = Pick<MetalGift, "date" | "qty" | "note">`
- `FinanceState` thêm `goldGifts: MetalGift[]` (sau `goldStores`) và `silverGifts: MetalGift[]` (sau `silverStores`); `DEFAULT_FINANCE_STATE` có `[]`; `metalGiftSchema`.
- `metal-calculations.ts`:
  - `giftedByPurchase(gifts: Pick<MetalGift, "purchaseId" | "qty">[]): Map<number, number>`
  - `heldQuantityOf<P extends MetalPurchaseBase>(quantityOf: (p: P) => number, gifts: Pick<MetalGift, "purchaseId" | "qty">[]): (p: P) => number`, trả `quantityOf(p) - (đã tặng ?? 0)`
  - `purchaseDateToDayKey(date: string): string | null`: "10/08/2026" → "2026-08-10", không đọc được → null
  - `toPurchaseDate(d: Date): string`: ngày máy → "dd/mm/yyyy"
  - `giftsInMonth(gifts: MetalGift[], month: string): (MetalGift & { dayKey: string })[]`: lọc theo tháng của `date`, bỏ ngày không đọc được, mới nhất trước (dayKey giảm dần, bằng nhau thì id giảm dần)
- `metal-naming.ts`: `interface MetalNaming { noun: string; unit: string; formatQuantity: (qty: number) => string }`, `GOLD_NAMING` ("vàng", "phân", `phanToChi`), `SILVER_NAMING` ("bạc", "lượng", `` `${formatLuong(q)} lượng` ``). Trong `metal-config.ts`: `MetalDisplay extends MetalNaming`, còn `GOLD_METAL`/`SILVER_METAL` spread phần naming.
- `summarizeFinance` tính vàng/bạc bằng `heldQuantityOf((p) => p.phan, state.goldGifts)` / `heldQuantityOf((p) => p.luong, state.silverGifts)`.

- [ ] **Step 1: Test (đỏ)**
  - storage: lần tặng vàng/bạc qua được vòng lưu → đọc (`Required<MetalGift>`); một lần tặng hỏng (`qty: null`) chỉ bỏ riêng nó; dữ liệu cũ không có key → `[]`.
  - `giftedByPurchase` cộng dồn theo `purchaseId`; `heldQuantityOf` trừ đúng, lần mua không có lần tặng thì giữ nguyên.
  - `purchaseDateToDayKey("1/8/2026") === "2026-08-01"`, `("31/02/2026") === null`; `toPurchaseDate(new Date(2026, 7, 1)) === "01/08/2026"`.
  - `giftsInMonth` với 3 lần tặng (09/2026, 09/2026, 08/2026, cộng một ngày "abc") trả đúng 2 lần của tháng 9, mới nhất trước.
  - `summarizeFinance`: 10 phân mua 900.000, SJC hôm nay 1.000.000, đã tặng 1 phân → `goldPhan` 9, `goldCost` 8.100.000, `goldValue` 9.000.000, `net` 9.000.000. Bạc: 3 lượng, tặng 1 → `silverLuong` 2.
  - naming: `GOLD_NAMING.formatQuantity(12) === "1 chỉ 2 phân"`, `SILVER_NAMING.formatQuantity(3) === "3 lượng"`.
- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: Viết code** theo Interfaces.
- [ ] **Step 4: tsc + lint + test xanh.** Không test vàng hiện có nào đổi assertion.
- [ ] **Step 5: Commit** `feat: store gifts taken out of gold and silver purchases and hold only what is left`

### Task 2: Hàm ghi lần tặng trong `useFinance`

**Files:**
- Modify: `src/lib/finance/use-finance.ts`
- Test: `src/lib/__tests__/finance/use-finance.test.ts` (describe mới "useFinance — tặng vàng/bạc")

**Interfaces:**
- Consumes: Task 1.
- `MetalLens<P>` thêm `naming: MetalNaming` (thay `noun`; toast dùng `lens.naming.noun`), `quantityOf: (p: P) => number`, `gifts`, `withGifts`.
- `useMetalActions` thêm:
  - `addGift(purchaseId: number, input: MetalGiftInput): boolean`
  - `updateGift(id: number, input: MetalGiftInput): boolean`
  - `removeGift(id: number): void`
- `useFinance` trả thêm `goldGifts`, `silverGifts`, `addGoldGift`, `updateGoldGift`, `removeGoldGift`, `addSilverGift`, `updateSilverGift`, `removeSilverGift`.

**Hành vi** (đọc tươi `getStoredFinance()` ở mọi hàm):
- `addGift`:
  - lần mua không còn → toast lỗi `Không tìm thấy lần mua này nữa.`, trả false;
  - `qty` không phải số nguyên > 0, hoặc lớn hơn số còn lại → toast lỗi ``Lần mua này chỉ còn ${formatQuantity(còn lại)} — không đủ để tặng ${formatQuantity(qty)}.``, trả false;
  - hợp lệ: lần tặng mới chèn lên đầu, `id = nextId(gifts)`, chụp `store` và `buy` của lần mua. Toast ``Đã ghi lần tặng ${formatQuantity(qty)} ${noun} ngày ${date}``, trả true;
  - ghi lỗi → ``Không thể ghi lần tặng ${noun}. Vui lòng thử lại.``, trả false.
- `updateGift`: giới hạn = số còn lại + `qty` cũ của chính lần tặng đó. Giữ nguyên `purchaseId`, `store`, `buy`. Toast ``Đã cập nhật lần tặng ${noun} ngày ${date}``. Lỗi tương tự `addGift`.
- `removeGift`: toast ``Đã huỷ lần tặng ${noun} ngày ${date}``.
- Chặn ở hai hàm cũ:
  - `removePurchase` khi còn lần tặng gắn vào → ``Không thể xoá lần mua này vì đã có lần tặng lấy từ đây. Huỷ các lần tặng trước.``
  - `updatePurchase` khi số lượng mới < tổng đã tặng → ``Lần mua này đã tặng ${formatQuantity(đã tặng)} — không sửa số lượng xuống thấp hơn.``

- [ ] **Step 1: Test (đỏ)**
  - tặng 1 phân từ lần mua 10 phân → `goldGifts[0]` đúng bản chụp, toast đúng chữ;
  - tặng vượt số còn lại bị từ chối;
  - tab khác vừa ghi lần tặng 9 phân thẳng vào storage → tặng thêm 2 bị từ chối (Review Focus 4);
  - sửa và huỷ lần tặng, kèm toast;
  - xoá lần mua còn lần tặng bị chặn;
  - sửa lần mua 10 → 0 phân khi đã tặng 1 bị chặn;
  - tặng bạc chỉ ghi vào `silverGifts`, toast có "bạc";
  - các test vàng cũ (toast "vàng") vẫn xanh.
- [ ] **Step 2–4:** đỏ → viết code → xanh (tsc, lint, test).
- [ ] **Step 5: Commit** `feat: add, edit and undo gifts through the shared metal actions`

### Task 3: Tab Tích lũy — nút Tặng, modal, lịch sử

**Files:**
- Create:
  - `src/features/finance/components/metal-gift-modal.tsx`
  - `src/features/finance/components/metal-gift-history-card.tsx`
  - test cho hai file trên
- Modify:
  - `metal-transactions-table.tsx`, `metal-transactions-cards.tsx`
  - `edit-metal-purchase-modal.tsx`
  - `metal-tab.tsx`, `gold-tab.tsx`, `silver-tab.tsx`, `finance-view.tsx`
- Test:
  - `gold-tab.test.tsx`, `silver-tab.test.tsx`: chỉ thêm vào `noopHandlers` các key `goldGifts: []` / `silverGifts: []` và 3 handler, cộng test mới;
  - `finance-view.test.tsx`: luồng tặng end-to-end.

**Interfaces:**
- **Bảng và thẻ giao dịch** thêm props tuỳ chọn:
  - `gifted?: Map<number, number>` (mặc định rỗng);
  - `onGift?: (purchase: P) => void` (không truyền thì không có nút Tặng).

  Theo từng dòng:
  - `qty` hiện = số còn lại; giá vốn, giá trị và lãi/lỗ của dòng đều tính theo số còn lại;
  - có đã tặng thì thêm dòng nhỏ ``đã tặng ${metal.formatQuantity(đã tặng)}``;
  - nút `Gift` (lucide) có aria ``Tặng từ lần mua ${noun} ${label}``. Khoá khi còn < 1, title ``Còn dưới 1 ${unit} — không tặng được.``;
  - nút Xoá khoá khi đã có lần tặng, title `Không thể xoá — lần mua này đã có lần tặng. Huỷ các lần tặng trước.`;
  - tên nút (label) vẫn tính theo khối lượng gốc, để không đổi khi tặng.
- **`EditMetalPurchaseModal`** thêm `minQuantity?: number`. Số lượng nhỏ hơn thì báo đỏ ``Đã tặng ${formatQuantity(min)} từ lần mua này — số lượng không được nhỏ hơn.`` và khoá Lưu.
- **`MetalGiftModal`**:
  - props:
    - `metal: MetalDisplay`
    - `target: { purchaseDate: string; store: string; available: number; gift: MetalGift | null } | null`
    - `onOpenChange`
    - `onSave: (input: MetalGiftInput) => boolean`
  - tiêu đề: ``Tặng ${noun}`` khi thêm, ``Sửa lần tặng ${noun}`` khi sửa;
  - dòng thông tin: ``Lần mua ngày ${purchaseDate} ở ${store} · tặng được tối đa ${formatQuantity(available)}``;
  - các ô:
    - "Ngày tặng": điền sẵn `toPurchaseDate(new Date())`, hoặc ngày của lần tặng khi sửa;
    - ``Số lượng tặng (${unit})``: `numeric`;
    - "Ghi chú (không bắt buộc)": placeholder "vd: tặng mẹ sinh nhật";
  - lỗi ô số lượng: ``Nhập số ${unit} nguyên từ 1 đến ${Math.floor(available)}``;
  - lỗi ô ngày:
    - sai dạng: "Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026";
    - trước ngày mua: ``Ngày tặng không được trước ngày mua (${purchaseDate})``;
  - nút Huỷ / Lưu. Lưu gọi `onSave`, đóng modal khi trả true.
- **`MetalGiftHistoryCard`**:
  - props:
    - `metal: MetalDisplay`
    - `gifts: MetalGift[]`
    - `purchases: P[]`, để tra ngày mua
    - `onEdit: (gift: MetalGift) => void`
    - `onRemove: (gift: MetalGift) => void`
  - không có lần tặng thì trả null;
  - Card label ``Lịch sử tặng · ${n} lần``, mới nhất trước (`sortByPurchaseDate`);
  - mỗi dòng:
    - ``Tặng ${formatQuantity(qty)}``;
    - dòng phụ ``${date} · ${store}`` cộng `` · ${note}`` nếu có;
    - trị giá `formatMoney(qty * buy, hidden)`;
    - nút Sửa/Huỷ, aria ``Sửa lần tặng ${label}`` / ``Huỷ lần tặng ${label}``, với `label` lấy từ `metalPurchaseLabels(gifts, (g) => formatQuantity(g.qty))`.
- **`MetalTab`** thêm props:
  - `gifts: MetalGift[]`
  - `onAddGift: (purchaseId: number, input: MetalGiftInput) => boolean`
  - `onUpdateGift: (id: number, input: MetalGiftInput) => boolean`
  - `onRemoveGift: (id: number) => void`

  Bên trong:
  - tính `heldQty = heldQuantityOf(metal.quantityOf, gifts)` và `heldPurchases = purchases.filter((p) => heldQty(p) > 0)`;
  - các chỗ dùng `heldPurchases`/`heldQty`: danh sách, đếm "· N lần", "Xem thêm", lãi/lỗ từng lần, tổng hợp theo cửa hàng, nhắc cửa hàng chưa có giá;
  - thẻ Giá thị trường vẫn nhận **mọi** lần mua, để giữ chặn xoá cửa hàng;
  - huỷ lần tặng hỏi lại qua `AlertDialog`: tiêu đề "Huỷ lần tặng này?", nội dung ``${formatQuantity(qty)} sẽ trả về lần mua ngày ${purchaseDate} ở ${store}.``, nút "Huỷ lần tặng".
- **`GoldTab` / `SilverTab`** thêm `goldGifts`/`silverGifts` và `onAddGoldGift`, `onUpdateGoldGift`, `onRemoveGoldGift` (bạc tương tự). `FinanceView` truyền từ hook.

- [ ] **Step 1: Test (đỏ)**
  - **modal:**
    - điền sẵn hôm nay;
    - từ chối "1,5", "0" và số vượt `available`;
    - từ chối ngày trước ngày mua;
    - lưu ra `{ date, qty, note }`;
    - `onSave` trả false thì modal không đóng.
  - **lịch sử:**
    - đủ dòng, mới nhất trước;
    - trị giá theo giá mua;
    - lần tặng trỏ tới lần mua không còn vẫn hiện (Review Focus 5);
    - "Ẩn số tiền" che trị giá (Review Focus 3).
  - **GoldTab:**
    - lần mua 10 phân, đã tặng 1 → bảng hiện "9 phân" và "đã tặng 1 phân";
    - "Đang giữ" vẫn theo `summary`;
    - nút Xoá của lần mua đó bị khoá;
    - lần mua đã tặng hết không còn trong danh sách;
    - bấm Tặng → modal → Lưu gọi `onAddGoldGift(1, …)`;
    - sửa lần mua xuống 0 phân bị chặn bằng `minQuantity` (Review Focus 1).
  - **SilverTab:** nút Tặng có aria chứa "bạc".
  - **FinanceView:** mua 10 phân, tặng 1 → trụ vàng "9 phân", Tài sản ròng giảm, có "Lịch sử tặng · 1 lần"; huỷ lần tặng → về lại 10 phân.
- [ ] **Step 2–4:** đỏ → viết code → xanh (tsc, lint, test). Các test vàng cũ vẫn xanh, không đổi assertion.
- [ ] **Step 5: Commit** `feat: gift from a gold or silver purchase and review the gift history`

### Task 4: Khối "Quà tặng từ tích lũy" ở Chi tiêu

**Files:**
- Modify:
  - `src/lib/date.ts`: `formatShortDayKey(key: string): string`, "2026-09-30" → "30/09";
  - `closing-block.tsx` dùng hàm này thay hàm `shortDay` nội bộ;
  - `src/lib/budget/budget-calculations.ts`;
  - `expense-list-card.tsx`, `budget-view.tsx`.
- Create: `src/features/budget/components/gift-block.tsx`
- Test: `src/lib/__tests__/date.test.ts`, `src/lib/__tests__/budget/budget-calculations.test.ts`, `expense-list-card.test.tsx`, `budget-view.test.tsx`

**Interfaces:**
- `type GiftListItem = MetalGift & { dayKey: string; naming: MetalNaming }`
- `giftsMadeInMonth(goldGifts: MetalGift[], silverGifts: MetalGift[], month: string): GiftListItem[]`: gộp `giftsInMonth` của hai kim loại, mới nhất trước.
- `GiftBlock({ gifts }: { gifts: GiftListItem[] })`:
  - rỗng thì trả null; khung giống `ClosingBlock`;
  - `data-testid="gift-block"`, tiêu đề "Quà tặng từ tích lũy";
  - mỗi dòng có `data-testid="gift-row"` và key ``${naming.noun}-${id}``:
    - icon `Gift`, ẩn dưới `@xs` như khối Chốt sổ;
    - dòng chính ``Tặng ${naming.formatQuantity(qty)} ${naming.noun}``;
    - dòng phụ ``${formatShortDayKey(dayKey)} · ${store}`` cộng `` · ${note}``;
    - bên phải `formatMoney(qty * buy, hidden)` màu chữ thường, không dấu +/−.
- `ExpenseListCard` thêm `gifts?: GiftListItem[]`:
  - render `GiftBlock` ngay sau `ClosingBlock`;
  - câu "Chưa có khoản chi nào…" thêm `mt-3` khi có khối nào phía trên.
- `BudgetView` đọc `goldGifts`, `silverGifts` từ `useFinance()` và truyền `giftsMadeInMonth(…, currentMonth)`.

- [ ] **Step 1: Test (đỏ)**
  - `giftsMadeInMonth` gộp vàng + bạc, mới nhất trước, chỉ trong tháng;
  - `GiftBlock`:
    - dòng "Tặng 1 phân vàng", "15/09 · SJC · tặng mẹ", trị giá 900.000 ₫;
    - bạc thì "Tặng 2 lượng bạc";
    - "Ẩn số tiền" che trị giá;
  - `BudgetView`, ngày giả 15/09/2026:
    - lần tặng ngày 15/09 hiện trong khối;
    - lần tặng ngày 20/08 không hiện (Review Focus 2);
    - dòng "Lương … · đã chi …" và số nhóm ngày không đổi.
- [ ] **Step 2–4:** đỏ → viết code → xanh.
- [ ] **Step 5: Commit** `feat: list this month's gold and silver gifts on the spending page without counting them`

### Task 5: README

- [ ] README:
  - dòng `/finance`: thêm "nút Tặng trên từng lần mua vàng/bạc, lịch sử tặng";
  - dòng `/budget`: thêm "khối Quà tặng từ tích lũy (chỉ để xem)".
- [ ] `npm run build` sạch. Commit `docs: describe gifting gold and silver`.
