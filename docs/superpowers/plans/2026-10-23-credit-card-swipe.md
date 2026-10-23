# Quẹt thẻ tín dụng ở trang Chi tiêu — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ở trang Chi tiêu:
- ghi được khoản "Quẹt thẻ": tính 0 đ vào chi tiêu tháng, tự cộng vào nợ thẻ;
- khoản "Trả nợ thẻ" mới ghi tự trừ nợ thẻ;
- sửa/xoá thì nợ thẻ đổi theo, không bao giờ lệch hay âm.

**Architecture:**
- **Dữ liệu:** `Expense` có thêm field tuỳ chọn `card: { kind: "swipe" | "payment"; cardName: string | null }`. Chỉ field này quyết định khoản chi có đụng nợ thẻ hay không, và có tính vào chi tiêu hay không. Khoản cũ không có `card` nên giữ nguyên nghĩa.
- **Tính toán** đi qua một nguồn duy nhất là `countedAmount(e)`.
- **Ghi chéo hai key** (`finance-data` rồi `budget-data`, lỗi thì đảo lại) theo đúng mẫu `confirmSettlement`, ở cả `useBudget` (thêm/sửa/xoá khoản chi) lẫn `useFinance` (đổi tên/xoá thẻ).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, zod 4, Vitest + React Testing Library + jest-dom, sonner, ApexCharts.

**Spec:** `docs/superpowers/specs/2026-10-23-credit-card-swipe-design.md` (commit `2217832`). Đọc spec trước. Plan này chốt tên, chữ ký và chữ hiển thị.

## Global Constraints

Áp dụng cho mọi task:

**Dữ liệu và nợ thẻ**
- **Nợ thẻ không bao giờ lệch hay âm vì các luồng mới.**
  - Mọi lần ghi nợ thẻ đi qua `applyCardBalanceDelta`, hàm này đọc tươi.
  - Mọi lần ghi khoản chi dựng từ `getStoredBudget()` đọc tươi.
  - Bước ghi thứ hai lỗi thì đảo bước thứ nhất.
- **Khoản cũ không có `card` không bao giờ đụng nợ thẻ**, và vẫn tính đủ vào chi tiêu, kể cả khoản mang nhãn "Trả nợ thẻ".
- **Schema không được làm mất khoản chi.**
  - `card` là `.optional()`.
  - `card` sai dạng thì rơi về `undefined` (`.catch(undefined)`), không bỏ cả khoản.

**Hiển thị**
- **Emoji của nhãn Quẹt thẻ là `🧾`**, không phải 💳. Xem commit 4a17348.
- **Mọi con số tiền mới** đi qua `formatMoney(…, hidden)`. Số dư rút gọn trên nút chọn thẻ đi qua `formatMoneyCompact(…, hidden)`.

**Chữ hiển thị chốt nguyên văn.** `{money(x)}` = `formatMoney(x, hidden)`.

*Nhãn mới trong Cài đặt*
- label `Quẹt thẻ`
- emoji `🧾`
- desc `Chi bằng thẻ tín dụng — cộng vào nợ thẻ, không tính vào chi tiêu tháng`
- tint `#F0ECFE`

*Form ghi khoản chi*
- 0 thẻ, nhãn Quẹt thẻ đang bật: `Chưa có thẻ tín dụng. Thêm thẻ ở trang Tài chính để ghi khoản quẹt thẻ.`
- Chọn Trả nợ thẻ khi 0 thẻ: `Chưa có thẻ tín dụng nên khoản này không trừ nợ thẻ.`
- 1 thẻ: `Thẻ: {tên}`
- Trả quá dư nợ (form ghi và modal sửa): `Thẻ "{tên}" chỉ còn nợ {money(balance)}`

*Danh sách khoản chi*
- Số tiền khoản quẹt: `{money(0)} / {money(amount)}`
- Dòng phụ: `Thẻ {tên}` / `Thẻ đã xoá`
- Hộp xoá: `Nợ thẻ "{tên}" sẽ giảm {money(amount)}.` (quẹt) / `Nợ thẻ "{tên}" sẽ tăng {money(amount)}.` (trả)

*Modal sửa (khoản đã gắn thẻ)*
- `Muốn đổi nhãn hay thẻ thì xoá khoản này rồi ghi lại.`

*Toast của `useBudget`*
- Ghi nợ thẻ ném lỗi: `Không thể cập nhật nợ thẻ "{tên}". Vui lòng thử lại.`
- Thêm mà không thấy thẻ: `Không tìm thấy thẻ "{tên}" ở trang Tài chính.`
- Thêm khoản trả quá nợ: `Thẻ "{tên}" chỉ còn nợ {money(balance)}.`
- Sửa làm nợ âm: `Không thể lưu: thẻ "{tên}" chỉ còn nợ {money(balance)}.`
- Xoá làm nợ âm: `Không thể xoá: thẻ "{tên}" chỉ còn nợ {money(balance)}, ít hơn khoản quẹt {money(amount)} này.`
- Ghi khoản chi lỗi, đã đảo được nợ thẻ: `Không thể lưu khoản chi — nợ thẻ "{tên}" vẫn giữ nguyên. Vui lòng thử lại.`
- Ghi khoản chi lỗi, không đảo được: `Không thể lưu khoản chi và không trả lại được nợ thẻ "{tên}". Kiểm tra lại dư nợ ở màn Tài chính.`
- Sửa/xoá khi thẻ không còn: `Đã cập nhật khoản chi. Thẻ "{tên}" không còn ở trang Tài chính nên nợ thẻ không đổi.` / `Đã xoá khoản chi. Thẻ "{tên}" không còn ở trang Tài chính nên nợ thẻ không đổi.`

**Quy ước code**
- Theo CLAUDE.md: tên tiếng Anh, chữ hiển thị tiếng Việt, token `--ob-*`.
- Trong `Card` dùng container query, không dùng `sm:`/`md:`/`lg:`.
- Không ghép `[font:var(--ob-text-*)]` với class độ đậm.
- Feature không import feature khác.
- Không thêm thư viện.

**Kiểm tra và commit**
- **Kiểm kiểu:** Vitest không kiểm kiểu. Task nào đổi chữ ký hay type phải chạy thêm `npx tsc --noEmit`.
  - Nếu báo `Cannot find name 'LayoutProps'` thì chạy `npx next typegen` một lần.
- **Commit:**
  - mỗi task một commit, trên nhánh `feat/credit-card-swipe`;
  - tiền tố theo CLAUDE.md;
  - message tiếng Anh, kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  - không push, không merge vào `developer`. Chủ repo tự bấm thử trước khi merge.

## Review Focus

1. **Hai tab: một tab đang mở "Sửa thẻ", tab kia ghi một khoản quẹt.** Lưu "Sửa thẻ" mà không đổi ô Dư nợ phải giữ dư nợ mới. Test ở Task 5.
2. **Xoá một khoản quẹt sau khi thẻ đã được trả bớt.** Phải bị chặn, không ghi gì ở cả hai key. Test ở Task 4.
3. **Đổi tên thẻ sau khi đã quẹt, rồi xoá khoản quẹt đó.** Nợ của thẻ (tên mới) phải giảm đúng. Test ở Task 5.
4. **Xoá thẻ, tạo thẻ mới cùng tên, rồi xoá khoản quẹt cũ.** Thẻ mới không được bị đụng. Test ở Task 5.
5. **Khoản "Trả nợ thẻ" cũ không có `card`, ví dụ 5.317.725 ₫ của tháng 10.** Sửa hay xoá không đụng nợ thẻ, và vẫn tính vào "đã chi". Test ở Task 1 và Task 4.

---

### Task 1: Liên kết thẻ trên khoản chi và "số tiền tính vào chi tiêu"

**Files:**
- Modify: `src/lib/budget/types.ts`
- Create: `src/lib/budget/card-link.ts`
- Modify: `src/lib/budget/budget-storage.ts`: thêm `cardLinkSchema`, field `card` trong `expenseSchema`.
- Modify: `src/lib/budget/budget-calculations.ts`: `totalExpensesForMonth`, `breakdownByTag`, `groupExpensesByDay`, thêm 3 hàm.
- Modify: `src/features/overview/insights-calculations.ts:176`: `daySpend` dùng `countedAmount`.
- Test:
  - `src/lib/__tests__/budget/card-link.test.ts` (mới)
  - `src/lib/__tests__/budget/budget-calculations.test.ts`
  - `src/lib/__tests__/budget/budget-storage.test.ts`
  - `src/features/overview/__tests__/insights-calculations.test.ts`, trong `describe("detectMoodSpendingCorrelation")` (dòng ~276)

**Interfaces:**
- Produces, trong `types.ts`:
  - `type CardLinkKind = "swipe" | "payment"`
  - `interface CardLink { kind: CardLinkKind; cardName: string | null }`
  - `Expense.card?: CardLink`
- Produces, trong `card-link.ts`:
  - `CARD_SWIPE_TAG_LABEL = "Quẹt thẻ"`, `CARD_SWIPE_TAG_EMOJI = "🧾"`, `CARD_PAYMENT_TAG_LABEL = "Trả nợ thẻ"`
  - `cardLinkKindForTag(label: string | null | undefined): CardLinkKind | null`
  - `cardDebtDelta(kind: CardLinkKind, amountChange: number): number`: quẹt trả `+amountChange`, trả nợ trả `-amountChange`.
- Produces, trong `budget-calculations.ts`:
  - `countedAmount(e: Expense): number`
  - `swipedAmount(e: Expense): number`
  - `swipedTotal(expenses: Expense[], months: string[]): number`

**Lưu ý so với spec §2.** Spec gợi ý thêm field `swiped` vào `TagBreakdownEntry`/`MonthlyTagSeries`. Plan làm cách khác: `breakdownByTag` (và vì vậy cả `monthlyTagBreakdown`) **bỏ hẳn** khoản quẹt thẻ, còn tổng quẹt tính riêng bằng `swipedTotal`.
- Kết quả nhìn thấy giống spec §8: donut không có lát Quẹt thẻ, cột chồng không có series Quẹt thẻ.
- Không có mục 0 đ nào phải lọc.
- Không đổi type mà các test chart đang dựng tay.

- [ ] **Step 1: Viết test hỏng.**

`card-link.test.ts`:
```ts
it("maps only the two card tags to a link kind", () => {
  expect(cardLinkKindForTag("Quẹt thẻ")).toBe("swipe")
  expect(cardLinkKindForTag("Trả nợ thẻ")).toBe("payment")
  expect(cardLinkKindForTag("Ăn uống")).toBeNull()
  expect(cardLinkKindForTag(null)).toBeNull()
})
it("raises the debt for a swipe and lowers it for a payment", () => {
  expect(cardDebtDelta("swipe", 500_000)).toBe(500_000)
  expect(cardDebtDelta("payment", 500_000)).toBe(-500_000)
  expect(cardDebtDelta("swipe", -200_000)).toBe(-200_000)
})
```

`budget-calculations.test.ts`. Dùng helper `expense()` sẵn có, cộng thêm các mẫu:
- `SWIPE = { kind: "swipe", cardName: "Visa" }`
- `PAY = { kind: "payment", cardName: "Visa" }`
- `TAG_SWIPE = { label: "Quẹt thẻ", emoji: "🧾", tint: "#F0ECFE" }`
- `TAG_PAY = { label: "Trả nợ thẻ", emoji: "🏦", tint: "#FFE0C7" }`

Các test:
- `describe("card swipes")`:
  - `totalExpensesForMonth` của `[expense({amount:100_000}), expense({id:2, amount:500_000, tag:TAG_SWIPE, card:SWIPE})]` ở `"2026-09"` là `100_000`.
  - `remainingToSettle([{month:"2026-09", amount:1_000_000}], <cùng mảng>, [], "2026-09")` là `900_000`.
  - `groupExpensesByDay(<cùng mảng, cùng ngày>)[0]`: `total` là `100_000`, `expenses` dài `2`.
  - `breakdownByTag(<cùng mảng>, "2026-09")` không có mục nào `label === "Quẹt thẻ"`.
  - `monthlyTagBreakdown(<cùng mảng>, ["2026-09"])` không có series `"Quẹt thẻ"`.
  - `swipedTotal(<cùng mảng>, ["2026-09"])` là `500_000`; tháng khác là `0`.
- `it("still counts a card payment and an old Trả nợ thẻ expense without a card link")`: `totalExpensesForMonth([expense({amount:300_000, tag:TAG_PAY, card:PAY}), expense({id:2, amount:5_317_725, tag:TAG_PAY})], "2026-09")` là `5_617_725`.
- `it("counts a swipe whose card was deleted as 0 too")`: khoản có `card: { kind: "swipe", cardName: null }` cho `countedAmount` là `0`, `swipedAmount` là `amount`.

`budget-storage.test.ts`:
- `it("keeps an expense's card link through a stored round trip")`: `setStoredBudget` một khoản có `card: { kind: "swipe", cardName: "Visa" }`, đọc lại `toEqual`. Làm lại với `cardName: null`.
- `it("keeps an expense whose card link is malformed, dropping only the link")`: ghi raw JSON khoản có `card: { kind: "nope" }`. `getStoredBudget().expenses` dài `1`, `expenses[0].card` là `undefined`, các field khác giữ nguyên.
- `it("reads old expenses without a card link unchanged")`: khoản không có `card` đọc lại `toEqual` bản gốc, `not.toHaveProperty("card")`.

`insights-calculations.test.ts`: `it("leaves card swipes out of the mood–spending comparison")`.
- Dựng ≥ 5 ngày tâm trạng thấp và ≥ 5 ngày tâm trạng cao theo đúng mẫu test sẵn có của `detectMoodSpendingCorrelation`.
- Thêm một khoản quẹt thẻ rất lớn vào một ngày tâm trạng thấp.
- Kết quả phải `toEqual` kết quả của cùng dữ liệu không có khoản quẹt.

- [ ] **Step 2: Chạy test, xác nhận hỏng.**

Run: `npx vitest run src/lib/__tests__/budget src/features/overview`
Expected: FAIL ở các test mới, vì module `card-link` chưa có, tổng còn cộng khoản quẹt, `card` bị schema lược.

- [ ] **Step 3: Làm code.**
- Thêm type và `card-link.ts` theo Interfaces.
- `cardLinkSchema = z.object({ kind: z.enum(["swipe", "payment"]), cardName: z.string().nullable() })`.
- Trong `expenseSchema`: `card: cardLinkSchema.optional().catch(undefined)`. Thêm chú thích tiếng Việt: hỏng thì chỉ mất liên kết, không mất khoản chi.
- `countedAmount`: `e.card?.kind === "swipe" ? 0 : e.amount`. `swipedAmount` ngược lại.
- `totalExpensesForMonth` và `total` trong `groupExpensesByDay` cộng `countedAmount`.
- `breakdownByTag` bỏ qua khoản có `card?.kind === "swipe"`.
- `swipedTotal` cộng `swipedAmount` của các khoản thuộc `months`.
- `insights-calculations.ts:176` cộng `countedAmount`.
- Cập nhật chú thích đầu các hàm có đổi.

- [ ] **Step 4: Chạy test.**

Run: `npx vitest run src/lib/__tests__/budget src/features/overview && npx tsc --noEmit`
Expected: PASS, không lỗi kiểu.

- [ ] **Step 5: Commit**
```bash
git add src/lib/budget src/lib/__tests__/budget src/features/overview
git commit -m "feat: link expenses to a credit card and keep swipes out of monthly spending" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Nhãn "Quẹt thẻ" trong Cài đặt và màu biểu đồ thứ 12

**Files:**
- Modify: `src/lib/settings/settings-storage.ts`: `DEFAULT_TAGS`, `parseAppSettings`, export `CARD_SWIPE_DEFAULT_TAG`.
- Modify: `src/lib/budget/budget-calculations.ts`: `CHART_PALETTE` thêm `"#1C7ED6"`, sửa chú thích "11 màu".
- Test:
  - `src/lib/__tests__/settings/settings-storage.test.ts`
  - `src/lib/__tests__/budget/budget-calculations.test.ts`

**Interfaces:**
- Consumes: `CARD_SWIPE_TAG_LABEL`, `CARD_SWIPE_TAG_EMOJI` (Task 1).
- Produces: `CARD_SWIPE_DEFAULT_TAG: BudgetTag`, giá trị ở Global Constraints. Phần tử cuối của `DEFAULT_TAGS`.

- [ ] **Step 1: Viết/sửa test.**
- Sửa `"seeds the 11 default expense tags"` thành `"seeds the 12 default expense tags"`:
  - `toHaveLength(12)`;
  - danh sách label thêm `"Quẹt thẻ"` ở cuối;
  - `DEFAULT_TAGS[11]` `toEqual` `{ label: "Quẹt thẻ", emoji: "🧾", desc: "Chi bằng thẻ tín dụng — cộng vào nợ thẻ, không tính vào chi tiêu tháng", tint: "#F0ECFE", on: true }`.
- Sửa `"keeps the user's own tags list untouched when it is a valid array"` thành `"keeps the user's own tags and appends Quẹt thẻ at the end when it is missing"`: kỳ vọng `[...customTags, CARD_SWIPE_DEFAULT_TAG]`.
- Mới: `it("does not append Quẹt thẻ again or turn it back on when it is already stored, even turned off")`. Lưu 11 nhãn mặc định cộng `{ ...CARD_SWIPE_DEFAULT_TAG, on: false }`. Đọc lại dài `12`, phần tử cuối có `on: false`.
- Mới: `it("appends Quẹt thẻ after the 11 tags a machine saved before this feature")`. Lưu `DEFAULT_TAGS.slice(0, 11)`. Đọc lại `toEqual(DEFAULT_TAGS)`.
- `budget-calculations.test.ts`: đổi tên `"never repeats a colour among the 11 default tags"` thành `"... the 12 default tags"`. Thân giữ nguyên, nó tự hỏng vì palette mới có 11 màu.

- [ ] **Step 2: Chạy test, xác nhận hỏng.**

Run: `npx vitest run src/lib/__tests__/settings src/lib/__tests__/budget/budget-calculations.test.ts`
Expected: FAIL.

- [ ] **Step 3: Làm code.**
- `parseAppSettings`: `tags: Array.isArray(parsed.tags) ? withCardSwipeTag(safeArray(tagSchema, parsed.tags)) : DEFAULT_TAGS`.
- `withCardSwipeTag(tags: BudgetTag[]): BudgetTag[]` (không export): nối `CARD_SWIPE_DEFAULT_TAG` khi chưa có label `"Quẹt thẻ"`. Có chú thích lý do nối ở cuối: màu biểu đồ theo vị trí.

- [ ] **Step 4: Chạy toàn bộ test.**

Run: `npm run test`
Expected: PASS. Test nào khác đếm số nhãn mặc định (ví dụ ở Cài đặt) thì sửa theo 12 nhãn, và ghi rõ trong commit.

- [ ] **Step 5: Commit**
```bash
git add src/lib/settings src/lib/budget/budget-calculations.ts src/lib/__tests__
git commit -m "feat: add a Quẹt thẻ expense tag with its own chart colour" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Ghi nợ thẻ, đổi tên/gỡ thẻ trong khoản chi (tầng storage)

**Files:**
- Modify: `src/lib/finance/finance-storage.ts`
- Modify: `src/lib/budget/budget-storage.ts`
- Test:
  - `src/lib/__tests__/finance/finance-storage.test.ts`
  - `src/lib/__tests__/budget/budget-storage.test.ts`

**Interfaces:**
- Produces, trong `finance-storage.ts`:
  ```ts
  type ApplyCardBalanceDeltaResult =
    | { ok: true; before: number; after: number }
    | { ok: false; reason: "card-not-found" }
    | { ok: false; reason: "insufficient-debt"; balance: number }
  function applyCardBalanceDelta(name: string, delta: number): ApplyCardBalanceDeltaResult
  ```
- Produces, trong `budget-storage.ts`:
  - `renameCardInExpenses(oldName: string, newName: string): void`
  - `detachCardFromExpenses(name: string): void`: đặt `cardName: null`, giữ `kind`.

- [ ] **Step 1: Viết test hỏng.** `describe("applyCardBalanceDelta")`, theo mẫu `describe("applySavingsFundDelta")`:
- `"raises the debt and returns before/after"`: thẻ `Visa` nợ `1_000_000`, delta `500_000` cho `{ ok: true, before: 1_000_000, after: 1_500_000 }`, storage `1_500_000`.
- `"lowers the debt down to exactly zero"`: delta `-1_000_000` cho `after: 0`.
- `"refuses to push the debt below zero and leaves storage untouched"`: delta `-1_000_001` cho `{ ok: false, reason: "insufficient-debt", balance: 1_000_000 }`, storage không đổi.
- `"refuses an unknown card and leaves storage untouched"` cho `{ ok: false, reason: "card-not-found" }`.
- `"always reads the current stored value, not a stale one"`, theo mẫu test cùng tên của quỹ.
- `"touches only the named card"`.

`describe("renameCardInExpenses")` / `describe("detachCardFromExpenses")`:
- Đổi `cardName` ở mọi khoản gắn đúng thẻ đó, ở mọi tháng.
- Khoản gắn thẻ khác và khoản không gắn thẻ giữ nguyên.
- Detach giữ `kind`.

- [ ] **Step 2: Chạy test, xác nhận hỏng.**

Run: `npx vitest run src/lib/__tests__/finance/finance-storage.test.ts src/lib/__tests__/budget/budget-storage.test.ts`

- [ ] **Step 3: Làm code.**
- `applyCardBalanceDelta`: theo mẫu `applySavingsFundDelta`, so `before + delta < 0`.
- Hai hàm `budget-storage`: theo mẫu `renameFundInSettlements`, dựng từ `getStoredBudget()`.
- Chú thích tiếng Việt nói rõ ai gọi các hàm này, và vì sao detach chứ không xoá khoản chi.

- [ ] **Step 4: Chạy lại** lệnh Step 2. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git commit -am "feat: add card debt deltas and card rename/detach for expenses" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `useBudget` tự cộng/trừ nợ thẻ khi thêm/sửa/xoá

**Files:**
- Modify: `src/lib/budget/use-budget.ts`
- Test: `src/lib/__tests__/budget/use-budget.test.ts`, thêm `describe("useBudget — nợ thẻ")`.

**Interfaces:**
- Consumes: `applyCardBalanceDelta` (Task 3); `cardDebtDelta`, `CardLink` (Task 1).
- Produces:
  - `AddExpenseInput` có thêm `card?: CardLink`. Khi có, `cardName` là tên thẻ, không phải `null`.
  - `addExpense(input: AddExpenseInput): boolean`
  - `updateExpense(id: number, input: UpdateExpenseInput): boolean`
  - `removeExpense(id: number): boolean`
  - `true` nghĩa là khoản chi (và nợ thẻ nếu có) đã ghi xong. Mọi nhánh lỗi tự toast.

**Hành vi**
- Thêm: `delta = cardDebtDelta(kind, amount)`.
- Sửa: `delta = cardDebtDelta(kind, amountMới − amountCũ)`, bằng 0 thì không gọi thẻ.
- Xoá: `delta = cardDebtDelta(kind, −amount)`.
- Thứ tự ghi: `applyCardBalanceDelta` trước (gói `try`, ném lỗi thì toast "Ghi nợ thẻ ném lỗi"), rồi `persist` khoản chi. `persist` ném lỗi thì `applyCardBalanceDelta(name, −delta)` để đảo, rồi toast một trong hai câu "Ghi khoản chi lỗi…".
- `cardName === null`, hoặc khoản không có `card`: không gọi thẻ.
- Sửa/xoá gặp `card-not-found`: vẫn ghi khoản chi, toast câu "khi thẻ không còn".
- Thêm gặp `card-not-found`: chặn.
- `insufficient-debt` ở cả ba thao tác: chặn, không ghi gì, toast đúng câu của thao tác đó.
- `updateExpense` với khoản có `card`: giữ nguyên `tag` và `card` gốc, chỉ nhận `amount` và `note`.
- Toast thành công cũ ("Đã cập nhật khoản chi", "Đã xoá khoản chi") giữ nguyên.
- Gợi ý chia code (người làm quyết): một helper nội bộ `syncCardDebt(link, delta, onMissing: "block" | "proceed")` trả kết quả để ba thao tác dùng chung.

- [ ] **Step 1: Viết test hỏng.**
- Dựng tài chính bằng `setStoredFinance({ ...DEFAULT_FINANCE_STATE, cards: [{ name: "Visa", balance: 2_000_000, min: 0, limit: 50_000_000, due: "15" }, { name: "Master", balance: 0, min: 0, limit: 10_000_000, due: "5" }] })`.
- Hàm đọc nợ: `debt = (n) => getStoredFinance().cards.find((c) => c.name === n)?.balance`.
- Mỗi test kiểm **cả** `debt(...)` **lẫn** `getStoredBudget().expenses`, và giá trị trả về.

Các test:
- `"a swipe raises the card's debt and is saved with its link"`: thêm `{ dayKey: "2026-11-03", amount: 500_000, tag: TAG_SWIPE, card: { kind: "swipe", cardName: "Visa" } }`. Trả `true`; `debt("Visa")` là `2_500_000`; khoản lưu có `card` đúng.
- `"a payment lowers the card's debt and still counts as spending"`: trả `800_000`. Nợ `1_200_000`; `totalExpensesForMonth(getStoredBudget().expenses, "2026-11")` là `800_000`.
- `"refuses a payment larger than the debt and writes nothing"`: trả `2_000_001`. Trả `false`; nợ `2_000_000`; không có khoản chi; `toast.error` gọi với `` `Thẻ "Visa" chỉ còn nợ ${formatMoney(2_000_000)}.` ``.
- `"refuses a swipe on a card that no longer exists"`: tên `"Amex"`. Trả `false`; không ghi gì; toast `Không tìm thấy thẻ "Amex" ở trang Tài chính.`
- `"editing a swipe's amount moves the debt by the difference only"`: quẹt `500_000` rồi sửa thành `700_000` cho nợ `2_700_000`. Sửa tiếp xuống `200_000` cho nợ `2_200_000`.
- `"editing a payment's amount moves the debt the other way"`: trả `500_000` (nợ `1_500_000`), sửa thành `600_000` cho nợ `1_400_000`.
- `"refuses an edit that would push the debt below zero"`: trả `2_000_000` (nợ `0`), sửa thành `2_100_000`. Trả `false`; nợ `0`; amount lưu vẫn `2_000_000`; toast `` `Không thể lưu: thẻ "Visa" chỉ còn nợ ${formatMoney(0)}.` ``.
- `"keeps a linked expense's tag and card when an edit passes a different tag"`.
- `"deleting a swipe takes it back off the debt"` và `"deleting a payment puts it back on the debt"`.
- `"refuses to delete a swipe the card no longer owes, writing nothing"` (Review Focus 2): quẹt `500_000` (nợ `2_500_000`), rồi `setStoredFinance` nợ Visa `200_000` (giả lập đã trả ở nơi khác), xoá. Trả `false`; khoản còn; nợ `200_000`; toast `` `Không thể xoá: thẻ "Visa" chỉ còn nợ ${formatMoney(200_000)}, ít hơn khoản quẹt ${formatMoney(500_000)} này.` ``.
- `"edits and deletes a linked expense whose card was deleted without touching any debt"`: khoản có `cardName: null`. Sửa/xoá trả `true`; mọi thẻ không đổi.
- `"edits and deletes when the linked card is missing, telling the debt did not change"`: `cardName: "Amex"`. Trả `true`; toast success đúng câu "khi thẻ không còn".
- `"never touches the debt for an old Trả nợ thẻ expense without a card link"` (Review Focus 5): khoản `5_317_725` nhãn Trả nợ thẻ, không `card`. Sửa rồi xoá; mọi thẻ không đổi.
- `"puts the debt back when the expense cannot be saved"`: theo mẫu test `"takes a deposit back out of the fund when the settlement history cannot be saved"`. Mock `setItem` ném lỗi chỉ khi key là `BUDGET_STORAGE_KEY`. Thêm quẹt cho kết quả `false`; nợ `2_000_000`; toast `Không thể lưu khoản chi — nợ thẻ "Visa" vẫn giữ nguyên. Vui lòng thử lại.`
- `"tells the user to check the debt when neither the expense nor the rollback can be saved"`: theo mẫu test tương ứng của tất toán.
- `"shows an error instead of throwing when the debt itself cannot be saved"`: toast `Không thể cập nhật nợ thẻ "Visa". Vui lòng thử lại.`
- `"hides amounts in the debt toasts while money is hidden"`: theo mẫu test ẩn số của tất toán.
- `"ends with the hand-computed debt after swipes, a start-of-month payment, an edit and a delete"`:
  - quẹt `300_000`, `450_000`, `1_250_000` vào Visa → nợ `4_000_000`;
  - trả `2_000_000`;
  - sửa khoản `450_000` thành `500_000`;
  - xoá khoản `300_000`;
  - kết quả: `debt("Visa")` là `1_750_000`; `debt("Master")` là `0`; `totalExpensesForMonth` của tháng là `2_000_000`.
- `"keeps a swipe another tab saved when adding one here"`: theo mẫu `describe("useBudget — dữ liệu do nơi khác ghi")`. Cả hai khoản đều có mặt và nợ cộng cả hai.

Test có sẵn gọi `addExpense/updateExpense/removeExpense` (không gắn thẻ) phải vẫn qua.

- [ ] **Step 2: Chạy test, xác nhận hỏng.**

Run: `npx vitest run src/lib/__tests__/budget/use-budget.test.ts`

- [ ] **Step 3: Làm code** theo phần Hành vi. Callback dùng `hidden` thì thêm vào dependency, như `confirmSettlement`.

- [ ] **Step 4: Chạy lại.**

Run: `npx vitest run src/lib/__tests__/budget && npx tsc --noEmit`
Expected: PASS. `budget-view.tsx` đang truyền `onAdd={(input) => addExpense(...)}` nên vẫn hợp kiểu, vì hàm trả `boolean` gán được cho kiểu trả `void`.

- [ ] **Step 5: Commit**
```bash
git commit -am "feat: keep card debt in sync when adding, editing or deleting a linked expense" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Sửa / đổi tên / xoá thẻ ở Tài chính không làm lệch nợ hay khoản chi

**Files:**
- Modify: `src/lib/finance/use-finance.ts`: `updateCard`, `removeCard`.
- Modify: `src/features/finance/components/edit-credit-card-modal.tsx`
- Modify: `src/features/finance/components/credit-cards-tab.tsx`
- Test:
  - `src/lib/__tests__/finance/use-finance.test.ts`
  - `src/features/finance/__tests__/components/edit-credit-card-modal.test.tsx`

**Interfaces:**
- Consumes: `renameCardInExpenses`, `detachCardFromExpenses`, `applyCardBalanceDelta` (Task 3).
- Produces:
  - `updateCard(originalName: string, card: CreditCard, balanceEdited = true): void`. Khi `balanceEdited === false`, dùng `balance` của thẻ đọc tươi từ `getStoredFinance()` thay cho `card.balance`.
  - `EditCreditCardModal.onSave: (card: CreditCard, balanceEdited: boolean) => void`. `balanceEdited` là ô Dư nợ khác giá trị đã chép lúc mở hộp (lưu thành state lúc reseed, không so với prop `card` đang sống).
  - `CreditCardsTab.onUpdateCard: (originalName: string, card: CreditCard, balanceEdited: boolean) => void`. `FinanceView` truyền thẳng `updateCard`, không đổi.

**Hành vi**
- Đổi tên: ghi `finance-data`, rồi `renameCardInExpenses`.
- Xoá: ghi `finance-data` không còn thẻ, rồi `detachCardFromExpenses`.
- Bước sau ném lỗi:
  - đọc tươi `getStoredFinance()`;
  - đặt lại thẻ gốc: đổi tên thì thay thẻ tên mới bằng bản gốc; xoá thì chèn bản gốc lại đúng vị trí cũ;
  - `persist`, rồi toast lỗi cũ (`Không thể cập nhật thẻ tín dụng "…". Vui lòng thử lại.` / `Không thể xoá thẻ tín dụng "…". Vui lòng thử lại.`);
  - không toast thành công.

- [ ] **Step 1: Viết test hỏng.**

`use-finance.test.ts`, `describe("useFinance — thẻ gắn với khoản chi")`:
- `"renaming a card renames it on every linked expense"`.
- `"deleting a card detaches its expenses but keeps them counted as swipes"`: `cardName: null`, `kind` giữ nguyên.
- `"puts the card back when its expenses cannot be renamed"`: mock `setItem` ném lỗi với `BUDGET_STORAGE_KEY`. Thẻ còn tên cũ ở cả storage lẫn `result.current.cards`; khoản chi còn tên cũ; `toast.error` gọi.
- `"puts the card back in the same place when its expenses cannot be detached"`.
- `"saving Sửa thẻ without touching the debt keeps a swipe recorded meanwhile"` (Review Focus 1):
  - Visa nợ `1_000_000`;
  - `applyCardBalanceDelta("Visa", 500_000)` (giả lập tab khác quẹt);
  - `updateCard("Visa", { name: "Visa", balance: 1_000_000, min: 0, limit: 50_000_000, due: "20" }, false)`;
  - kết quả: nợ `1_500_000`, `due` là `"20"`.
- `"saving Sửa thẻ with an edited debt takes the new figure"`: như trên nhưng `balanceEdited = true`, `balance: 900_000`. Nợ `900_000`.
- `"a swipe made before a card rename comes off the renamed card when deleted"` (Review Focus 3):
  - quẹt `500_000` vào Visa qua `useBudget` (nợ `1_500_000`);
  - đổi tên Visa → "Visa Gold" qua `useFinance`;
  - xoá khoản quẹt qua `useBudget`;
  - kết quả: `debt("Visa Gold")` là `1_000_000`.
  - Hai hook render riêng bằng hai `renderHook`.
- `"deleting an old swipe never touches a new card with the deleted card's name"` (Review Focus 4):
  - quẹt vào Visa;
  - xoá thẻ Visa;
  - thêm thẻ mới "Visa" nợ `0`;
  - xoá khoản quẹt cũ: trả `true`, nợ thẻ mới vẫn `0`.

`edit-credit-card-modal.test.tsx`:
- Sửa test `toHaveBeenCalledWith({...})` ở dòng ~41 thành `toHaveBeenCalledWith({...}, false)` nếu test đó không đổi ô Dư nợ, hoặc `true` nếu có.
- Thêm `"reports the debt as untouched when only the due day changes"` (`onSave` nhận `false` ở tham số 2).
- Thêm `"reports the debt as edited when the Dư nợ field changes"` (`true`).

- [ ] **Step 2: Chạy test, xác nhận hỏng.**

Run: `npx vitest run src/lib/__tests__/finance/use-finance.test.ts src/features/finance`

- [ ] **Step 3: Làm code** theo phần Hành vi và Interfaces.

- [ ] **Step 4: Chạy lại.**

Run: `npx vitest run src/lib/__tests__ src/features/finance && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git commit -am "fix: keep card debt and linked expenses consistent when a card is edited, renamed or deleted" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Form ghi khoản chi: chọn thẻ cho "Quẹt thẻ" / "Trả nợ thẻ"

**Files:**
- Modify: `src/features/budget/components/tag-picker.tsx`
- Create: `src/features/budget/components/card-picker.tsx`
- Modify: `src/features/budget/components/expense-entry-form.tsx`
- Test:
  - `src/features/budget/__tests__/components/tag-picker.test.tsx`
  - `src/features/budget/__tests__/components/card-picker.test.tsx` (mới)
  - `src/features/budget/__tests__/components/expense-entry-form.test.tsx`

**Interfaces:**
- Consumes: `cardLinkKindForTag`, `CARD_SWIPE_TAG_LABEL`, `CardLink` (Task 1).
- Produces:
  - `TagPicker` có thêm `disabledLabels?: string[]` (chip hiện nhưng `disabled`) và `hiddenLabels?: string[]` (chip không hiện).
    - `extraTag` hiện khi label của nó không nằm trong các chip đang hiện.
  - `CardPicker({ cards: CreditCard[]; selected: string | null; onSelect: (name: string | null) => void })`, mẫu `FundPicker`:
    - mỗi nút có tên truy cập đúng bằng tên thẻ;
    - dư nợ rút gọn `formatMoneyCompact(balance, hidden)` nằm `aria-hidden`;
    - mô tả `Dư nợ {formatMoney(balance, hidden)}` qua `aria-describedby`, id dựng từ `useId()` + chỉ số;
    - hook gọi trước mọi `return` sớm.
  - `ExpenseEntryForm` props:
    - `{ tags: BudgetTag[]; cards?: CreditCard[]; onAdd: (input: { amount: number; tag: TagSnapshot | null; note?: string; card?: CardLink }) => boolean }`;
    - `cards` mặc định `[]`;
    - chỉ xoá ô nhập khi `onAdd` trả `true`.

**Hành vi**: theo spec §6 và chữ ở Global Constraints.
- Thẻ đã chọn không còn trong `cards` (bị xoá ở tab khác) thì coi như chưa chọn.
- Chỗ hiện lỗi trên ô số tiền: lỗi "Tối đa…" (`BUDGET_AMOUNT_LIMIT_HINT`) được ưu tiên trước lỗi trả quá nợ.
- Lời nhắc và dòng "Thẻ: …" nằm ngay dưới hàng chip nhãn.

- [ ] **Step 1: Viết test hỏng.**

Cho các test dưới đây:
- `TAGS` thêm `{ label: "Quẹt thẻ", emoji: "🧾", desc: "", tint: "#F0ECFE", on: true }` và `{ label: "Trả nợ thẻ", emoji: "🏦", desc: "", tint: "#FFE0C7", on: true }`.
- `VISA = { name: "Visa", balance: 2_000_000, min: 0, limit: 50_000_000, due: "15" }`, `MASTER` tương tự với nợ `0`.
- Test sẵn có dùng `vi.fn()` cho `onAdd` và kiểm form được xoá thì đổi thành `vi.fn(() => true)`.

`tag-picker.test.tsx`:
- `"disables a chip listed in disabledLabels"`.
- `"hides a chip listed in hiddenLabels but still shows it as the extra tag of the expense being edited"`.

`card-picker.test.tsx`:
- `"names each button by the card name and describes it with the full debt"`.
- `"hides the debt while money is hidden"`: render trong `MoneyVisibilityProvider` theo mẫu test của `FundPicker`.

`expense-entry-form.test.tsx`:
- `"locks Quẹt thẻ and says to add a card when there is no card"`.
- `"records a swipe on the only card without asking"`: chọn Quẹt thẻ, thấy `Thẻ: Visa`, ghi. `onAdd` nhận `card: { kind: "swipe", cardName: "Visa" }`.
- `"asks which card when there are two and blocks until one is picked"`.
- `"records a payment with its card"`.
- `"lets Trả nợ thẻ through without a card when there is none, saying the debt will not change"`: `onAdd` nhận object không có `card`.
- `"blocks a payment above the picked card's debt"`: `500` trên Master (nợ 0). Thấy `` `Thẻ "Master" chỉ còn nợ ${formatMoney(0)}` ``, nút khoá.
- `"drops the picked card when switching to an ordinary tag"`: `onAdd` không có `card`.
- `"keeps what was typed when the expense could not be saved"`: `onAdd` trả `false`, ô số tiền giữ `"50.000"`.

- [ ] **Step 2: Chạy test, xác nhận hỏng.**

Run: `npx vitest run src/features/budget/__tests__/components/tag-picker.test.tsx src/features/budget/__tests__/components/card-picker.test.tsx src/features/budget/__tests__/components/expense-entry-form.test.tsx`

- [ ] **Step 3: Làm code** theo Interfaces và Hành vi.

- [ ] **Step 4: Chạy lại** lệnh Step 2, rồi `npx tsc --noEmit`. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/budget
git commit -m "feat: pick a credit card when recording a Quẹt thẻ or Trả nợ thẻ expense" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Sửa khoản chi đã gắn thẻ

**Files:**
- Modify: `src/features/budget/components/edit-expense-modal.tsx`
- Test: `src/features/budget/__tests__/components/edit-expense-modal.test.tsx`

**Interfaces:**
- Consumes: `TagPicker.hiddenLabels` (Task 6); `cardDebtDelta`, `CARD_SWIPE_TAG_LABEL`, `CARD_PAYMENT_TAG_LABEL` (Task 1).
- Produces: `EditExpenseModal` props `{ expense; tags; cards?: CreditCard[]; onOpenChange; onSave: (id, input) => boolean }`. `cards` mặc định `[]`. Chỉ đóng khi `onSave` trả `true`.

**Hành vi**
- **Khoản có `card`:**
  - không có `TagPicker`;
  - hiện nhãn dạng chữ (`{emoji} {label}`) và dòng `Thẻ {tên}` / `Thẻ đã xoá`;
  - kèm câu `Muốn đổi nhãn hay thẻ thì xoá khoản này rồi ghi lại.`;
  - `onSave` nhận `tag` gốc.
  - Lỗi số tiền: tìm thẻ trong `cards` theo `cardName`. Nếu `balance + cardDebtDelta(kind, mới − cũ) < 0` thì ô báo `Thẻ "{tên}" chỉ còn nợ {money(balance)}`, nút Lưu khoá.
- **Khoản không có `card`:** `TagPicker` với `hiddenLabels={[CARD_SWIPE_TAG_LABEL, CARD_PAYMENT_TAG_LABEL]}`. Khoản cũ nhãn "Trả nợ thẻ" vẫn hiện chip của nó qua `extraTag`.

- [ ] **Step 1: Viết test hỏng.** Test sẵn có kiểm "then closes" thì đổi mock thành `vi.fn(() => true)`.
- `"shows a linked expense's tag and card as text, with no tag chips"`.
- `"shows Thẻ đã xoá for a linked expense whose card was deleted"`.
- `"blocks raising a payment above the card's debt"`.
- `"blocks lowering a swipe by more than the card still owes"`.
- `"does not offer Quẹt thẻ or Trả nợ thẻ when editing an ordinary expense"`.
- `"keeps an old Trả nợ thẻ expense's own tag selectable"`.
- `"stays open when the save is refused"`.

- [ ] **Step 2–4:** chạy `npx vitest run src/features/budget/__tests__/components/edit-expense-modal.test.tsx` (hỏng), làm code, chạy lại cộng `npx tsc --noEmit` (PASS).

- [ ] **Step 5: Commit**
```bash
git commit -am "feat: edit a card-linked expense's amount without changing its tag or card" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Hiển thị và nối vào trang Chi tiêu

**Files:**
- Modify: `src/features/budget/components/expense-list-card.tsx`
- Modify: `src/features/budget/components/monthly-tag-trend-chart.tsx`
- Modify: `src/features/budget/components/budget-view.tsx`
- Modify: `README.md`: dòng `/budget` ở bảng tính năng (dòng ~83).
- Test:
  - `src/features/budget/__tests__/components/expense-list-card.test.tsx`
  - `src/features/budget/__tests__/components/monthly-tag-trend-chart.test.tsx`
  - `src/features/budget/__tests__/components/budget-view.test.tsx`

**Interfaces:**
- Consumes: `swipedTotal`, `CARD_SWIPE_TAG_LABEL`, `CARD_SWIPE_TAG_EMOJI` (Task 1); form/modal props (Task 6, 7); hook trả `boolean` (Task 4).
- Produces: `MonthlyTagTrendChart` prop tuỳ chọn `swiped?: { label: string; emoji: string; total: number }`.

**Hành vi**

*Danh sách khoản chi*
- Khoản quẹt hiện `{money(0)} / {money(amount)}` trong một phần tử. Được xuống dòng ở `/`, không đẩy nút Sửa/Xoá ra ngoài.
- Khoản gắn thẻ có dòng `Thẻ {tên}` / `Thẻ đã xoá`, cạnh ghi chú.
- Hộp xoá thêm câu nợ thẻ ở Global Constraints, chỉ khi `cardName` khác `null`.

*Danh sách tổng kết 6 tháng*
- Khi `swiped.total > 0`, thêm dòng `data-testid="tag-trend-swiped"` ngay trên "Tổng cộng":
  - chấm màu `colors?.get(label) ?? CHART_PALETTE[series.length % CHART_PALETTE.length]`;
  - emoji, label;
  - số `{money(0)} / {money(total)}`.
- Phần tổng kết hiện khi có series **hoặc** có khoản quẹt.
- "Tổng cộng" không cộng `total`.

*`BudgetView`*
- Lấy `cards` từ `useFinance()`.
- `swiped = { label: CARD_SWIPE_TAG_LABEL, emoji: <emoji của nhãn đó trong settings.tags, không có thì CARD_SWIPE_TAG_EMOJI>, total: swipedTotal(expenses, trendMonths) }`.
- Thêm `CARD_SWIPE_TAG_LABEL` vào danh sách label truyền cho `tagChartColors`.
- Truyền `cards` cho form và modal sửa.
- `onAdd={(input) => addExpense({ ...input, dayKey: dayKey() })}` trả luôn kết quả.

*README*
- Dòng `/budget` thêm ý: nhãn "Quẹt thẻ" gắn thẻ tín dụng, tính 0 đ vào chi tiêu và cộng vào nợ thẻ; "Trả nợ thẻ" mới ghi tự trừ nợ thẻ.

- [ ] **Step 1: Viết test hỏng.**

`expense-list-card.test.tsx`:
- `"shows a swipe as 0 out of its amount"`.
- `"leaves swipes out of the day total but counts them in the number of expenses"`.
- `"shows which card a linked expense went on, or that the card was deleted"`.
- `"tells how the card debt will change before deleting a linked expense"`.
- `"hides both amounts of a swipe while money is hidden"`.

`monthly-tag-trend-chart.test.tsx`:
- `"adds a Quẹt thẻ row showing 0 out of the swiped total, outside the grand total"`:
  - series Tiền trọ `[3_000_000, 3_000_000]`;
  - `swiped={{ label: "Quẹt thẻ", emoji: "🧾", total: 1_200_000 }}`;
  - trong `getByTestId("tag-trend-swiped")` có `` `${formatMoney(0)} / ${formatMoney(1_200_000)}` ``;
  - "Tổng cộng" vẫn `formatMoney(6_000_000)`.
- `"shows no Quẹt thẻ row when nothing was swiped"`.
- `"shows the summary with only the Quẹt thẻ row when the months had swipes only"`.

`budget-view.test.tsx`, theo cách các test sẵn có dựng localStorage:
- `"keeps a swipe out of đã chi and the settle card, and raises the card debt"`:
  - lương `10_000_000`, một khoản thường `1_000_000`, thẻ Visa nợ `0`;
  - qua giao diện: nhập `500000`, chọn Quẹt thẻ, ghi;
  - dòng "đã chi" vẫn `formatMoney(1_000_000)`;
  - thẻ Tất toán vẫn "Bạn đang dư" `formatMoney(9_000_000)`;
  - `getStoredFinance().cards[0].balance` là `500_000`.
- `"lowers the card debt when a Trả nợ thẻ is recorded and counts it as spending"`.

- [ ] **Step 2: Chạy test, xác nhận hỏng.**

Run: `npx vitest run src/features/budget`

- [ ] **Step 3: Làm code** theo Hành vi.

- [ ] **Step 4: Chạy lại** lệnh Step 2, rồi `npx tsc --noEmit`. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/budget README.md
git commit -m "feat: show card swipes as 0 đ on the budget page and wire card debt sync into it" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Kiểm tra toàn bộ

- [ ] **Step 1:** `npm run test`. Expected: mọi test PASS.
- [ ] **Step 2:** `npm run lint`. Expected: không lỗi, không cảnh báo mới.
- [ ] **Step 3:** `npx tsc --noEmit`. Expected: không lỗi.
- [ ] **Step 4:** `npm run build`. Expected: build thành công.
- [ ] **Step 5:** Đối chiếu spec từng mục "Không được xảy ra":
  - mỗi dòng có test nào giữ;
  - dòng nào chưa có test thì thêm vào task sở hữu code đó và commit `test: …`.
- [ ] **Step 6:** Báo chủ repo:
  - nhánh sẵn sàng để bấm thử;
  - liệt kê các luồng nên thử: quẹt 1 thẻ / 2 thẻ, trả nợ, sửa, xoá, đổi tên thẻ, ẩn số tiền, màn 320px;
  - nhắc tải lại mọi tab đang mở app.
  - Không merge.
