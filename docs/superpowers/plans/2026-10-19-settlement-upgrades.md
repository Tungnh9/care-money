# Nâng cấp tất toán tháng — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trang Chi tiêu có khối "Chốt sổ" liệt kê các lần tất toán bấm trong tháng; tháng cũ có lương mà còn lệch không bao giờ tự biến mất; nút chọn sổ hiện số dư rút gọn.

**Architecture:**
- Phần tính toán là hàm thuần trong `src/lib/` và có test riêng:
  - `formatMoneyCompact` trong `format.ts`;
  - `dayKeyFromIso` trong `date.ts`;
  - `settlementsMadeInMonth`, `unsettledPastMonths` (đổi chữ ký) và `hasSalaryRecord` trong `budget/budget-calculations.ts`.
- Giao diện chỉ gọi các hàm đó:
  - `FundPicker` tự đọc chế độ ẩn số;
  - `ClosingBlock` mới được `ExpenseListCard` vẽ ở đầu danh sách;
  - `BudgetView` nối dữ liệu, khoá nút tháng chưa có lương và giữ focus.
- Không đổi hình dạng dữ liệu đã lưu. Chỉ nới `fundAmountBefore/After` trong `settlementSchema`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, zod 4, Vitest + React Testing Library + jest-dom.

**Spec:** `docs/superpowers/specs/2026-10-19-settlement-upgrades-design.md` (commit `aacec5f`).

## Global Constraints

Áp dụng cho mọi task:

- **Dòng tất toán không được cộng vào** "đã chi", tổng chi trong ngày, biểu đồ, gợi ý ở Tổng quan hay số cần tất toán. Không biến tất toán thành `Expense`, không gộp vào `monthExpenses`.
- **Schema dữ liệu đã lưu không được thắt chặt.** Chỉ nới `fundAmountBefore` / `fundAmountAfter` của `settlementSchema` thành `z.number()`.
- Không thêm thư viện.
- **"xu" cho dải 10.000–99.999 là lựa chọn của chủ repo** (cách A, 19/10/2026). Không đổi thành "k".
- **Số dư rút gọn cắt xuống, không làm tròn lên.** Với số dư ≥ 0, nút không bao giờ hiện nhiều hơn số tiền sổ đang có. Khi ẩn số tiền thì trả `•••`.
- **Mọi con số tiền khác** đi qua `formatMoney(…, hidden)` hoặc `signedMoney(…, hidden)` để bị che khi bật "Ẩn số tiền".
- **Chữ hiển thị chốt nguyên văn:**
  - nhãn khối: `Chốt sổ`;
  - tiêu đề dòng: `Tất toán tháng {m}`, hoặc `Tất toán tháng {m}, {yyyy}` khi khác năm;
  - dòng phụ: `Rút từ sổ {X}` / `Nạp vào sổ {X}`, thêm ` (đã xoá)` khi sổ đã xoá, rồi ` · dd/mm` hoặc ` · bấm ngày dd/mm` khi chốt trễ;
  - câu cho trình đọc màn hình: `Số dư sổ từ {a} thành {b}`;
  - mô tả nút sổ: `Số dư {formatMoney(amount)}`;
  - lời nhắc: `Chưa nhập lương tháng này. Nhập lương (kể cả 0 đ) ở thẻ Lương tháng này rồi mới tất toán.`;
  - toast: `Đã tất toán tháng {m}, {yyyy}`.
- **Quy ước code:** tên định danh tiếng Anh, chữ hiển thị tiếng Việt, màu và khoảng cách dùng token `--ob-*`. Trong `Card` dùng container query (`@xs:`/`@md:`/`@xl:`), không dùng `sm:`/`md:`/`lg:`. Không ghép `[font:var(--ob-text-*)]` với class độ đậm.
- **Hook gọi trước mọi `return` sớm.** ESLint `react-hooks/rules-of-hooks` chặn trường hợp sai, nên `npm run lint` phải sạch.
- **Kiểm kiểu:** Vitest không kiểm kiểu. Task nào đổi chữ ký hàm phải chạy thêm `npx tsc --noEmit`, vì `tsconfig.json` có cả file test.
  - Trong worktree hoặc bản checkout mới chưa có thư mục `.next/` (bị gitignore), `tsc` báo sẵn `src/app/layout.tsx(30,50): error TS2304: Cannot find name 'LayoutProps'`. Đây là lỗi môi trường, không do plan.
  - Chạy `npx next typegen` một lần (hoặc chép `.next/types` từ bản checkout chính) trước khi kiểm kiểu.
- **Không sửa** `docs/superpowers/plans/2026-09-29-fix-2-budget.md`. Spec đã ghi rằng nó thay thế "Quyết định 1" trong đó.
- **Commit** theo CLAUDE.md (`feat:` / `fix:` / `change:` / `docs:`), message tiếng Anh, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. Không push.

## Review Focus

1. **Tất toán lúc 00:00–06:59 ngày mùng 1 (giờ Việt Nam).** Ngày UTC của `at` lúc đó thuộc tháng trước, nhưng dòng phải nằm trong khối của tháng mới. Test ở Task 4: `settlementsMadeInMonth` với `new Date(2026, 8, 1, 0, 30)`.
2. **`at` lạ trong file nhập** (chuỗi hỏng, hoặc có offset `+07:00`). Không lỗi trang; chuỗi hỏng thì không có dòng; thứ tự theo thời điểm thật. Test ở Task 4.
3. **Số dư sổ lẻ dưới 1 đồng** (chỉ đến từ file nhập). Nút hiện số đã cắt, không nhảy sang mốc kế tiếp; lần tất toán từ sổ như vậy vẫn còn sau khi tải lại. Test ở Task 1 và Task 3.
4. **Tên sổ có dấu cách hoặc dấu nháy, và sổ bị xoá sau khi đã tất toán.** Mỗi nút giữ đúng mô tả của nó; dòng của sổ đã xoá ghi "(đã xoá)". Test ở Task 2, Task 4 và Task 5.
5. **Dữ liệu lương nhập vào bị trùng tháng hoặc sai định dạng tháng.** Mỗi tháng chỉ một dòng, tháng sai định dạng bị bỏ, không có cảnh báo trùng key. Test ở Task 6.

---

### Task 1: `formatMoneyCompact`

**Files:**
- Modify: `src/lib/format.ts` (thêm hàm cạnh `formatMoney`, thêm vào export)
- Test: `src/lib/__tests__/format.test.ts`

**Interfaces:**
- Produces: `formatMoneyCompact(n: number, hidden?: boolean): string` (`hidden` mặc định `false`).

- [ ] **Step 1: Viết test đỏ** — thêm `formatMoneyCompact` vào import dòng 3, rồi thêm khối sau cuối file:

```ts
describe("formatMoneyCompact", () => {
  it("writes the owner's examples", () => {
    expect(formatMoneyCompact(8_000)).toBe("8k")
    expect(formatMoneyCompact(50_000)).toBe("50xu")
    expect(formatMoneyCompact(500_000)).toBe("500k")
    expect(formatMoneyCompact(1_500_000)).toBe("1,5tr")
    expect(formatMoneyCompact(5_000_000)).toBe("5tr")
    expect(formatMoneyCompact(2_000_000_000)).toBe("2 tỷ")
  })

  it("uses 'xu' for tens of thousands, as the owner chose (not 'k')", () => {
    expect(formatMoneyCompact(10_000)).toBe("10xu")
    expect(formatMoneyCompact(20_000)).toBe("20xu")
    expect(formatMoneyCompact(99_999)).toBe("99xu")
  })

  it("cuts down at every band edge instead of carrying into the next unit", () => {
    expect(formatMoneyCompact(9_999)).toBe("9,9k")
    expect(formatMoneyCompact(100_000)).toBe("100k")
    expect(formatMoneyCompact(999_999)).toBe("999k")
    expect(formatMoneyCompact(1_000_000)).toBe("1tr")
    expect(formatMoneyCompact(999_999_999)).toBe("999,9tr")
    expect(formatMoneyCompact(1_000_000_000)).toBe("1 tỷ")
  })

  it("keeps at most one decimal, with a comma, and drops ',0'", () => {
    expect(formatMoneyCompact(1_500)).toBe("1,5k")
    expect(formatMoneyCompact(12_500)).toBe("12xu")
    expect(formatMoneyCompact(123_456)).toBe("123k")
    expect(formatMoneyCompact(1_050_000)).toBe("1tr")
    expect(formatMoneyCompact(1_990_000)).toBe("1,9tr")
    expect(formatMoneyCompact(12_500_000)).toBe("12,5tr")
    expect(formatMoneyCompact(1_500_000_000)).toBe("1,5 tỷ")
    expect(formatMoneyCompact(1_234_567_000_000)).toBe("1.234,5 tỷ")
  })

  it("shows amounts under 1.000 in whole đồng", () => {
    expect(formatMoneyCompact(0)).toBe("0đ")
    expect(formatMoneyCompact(500)).toBe("500đ")
    expect(formatMoneyCompact(999)).toBe("999đ")
  })

  it("drops fractions of a đồng instead of rounding up", () => {
    expect(formatMoneyCompact(999.5)).toBe("999đ")
    expect(formatMoneyCompact(9_999.6)).toBe("9,9k")
    expect(formatMoneyCompact(99_999.5)).toBe("99xu")
    expect(formatMoneyCompact(150_000.5)).toBe("150k")
  })

  it("puts '-' in front of a negative balance but never prints '-0'", () => {
    expect(formatMoneyCompact(-8_000)).toBe("-8k")
    expect(formatMoneyCompact(-1_500_000)).toBe("-1,5tr")
    expect(formatMoneyCompact(-500)).toBe("-500đ")
    expect(formatMoneyCompact(-0)).toBe("0đ")
    expect(formatMoneyCompact(-0.4)).toBe("0đ")
  })

  it("treats NaN as 0", () => {
    expect(formatMoneyCompact(Number.NaN)).toBe("0đ")
  })

  it("masks the amount and its unit while money is hidden", () => {
    expect(formatMoneyCompact(50_000, true)).toBe("•••")
    expect(formatMoneyCompact(2_000_000_000, true)).toBe("•••")
  })
})
```

- [ ] **Step 2: Chạy, thấy đỏ**

Run: `npx vitest run src/lib/__tests__/format.test.ts`
Expected: FAIL. Các test mới báo `formatMoneyCompact is not a function` hoặc không import được; các test cũ vẫn xanh.

- [ ] **Step 3: Viết `formatMoneyCompact(n: number, hidden = false): string` trong `src/lib/format.ts`**

Thuật toán (test không tự chọn được cách cắt, nên ghi rõ):

```ts
// Bảng dải, xét từ lớn xuống: lấy dải đầu tiên có |số| >= min, value = Math.floor(|số| / step) / divisor
// (cắt xuống bằng phép chia số nguyên, không để toLocaleString làm tròn, không dùng Intl "compact").
// "xu" cho hàng chục nghìn là lựa chọn của chủ repo (cách A, 19/10/2026) — đừng đổi thành "k".
const COMPACT_BANDS = [
  { min: 1_000_000_000, step: 100_000_000, divisor: 10, suffix: " tỷ" },
  { min: 1_000_000, step: 100_000, divisor: 10, suffix: "tr" },
  { min: 100_000, step: 1_000, divisor: 1, suffix: "k" },
  { min: 10_000, step: 1_000, divisor: 1, suffix: "xu" },
  { min: 1_000, step: 100, divisor: 10, suffix: "k" },
]
```

- `hidden` → `"•••"`.
- `whole = Math.trunc(n) || 0`, nên `NaN` và `-0` thành 0.
- `|whole| < 1_000` → `` `${whole}đ` ``.
- Còn lại: `value.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + suffix`, thêm `"-"` phía trước khi `whole < 0 && value > 0`.
- Thêm `formatMoneyCompact` vào dòng `export { … }` của file.

- [ ] **Step 4: Chạy, thấy xanh**

Run: `npx vitest run src/lib/__tests__/format.test.ts`
Expected: PASS (mọi test trong file).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/__tests__/format.test.ts
git commit -m "feat: add a compact money label for fund balances" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Số dư rút gọn trên `FundPicker`

**Files:**
- Modify: `src/components/ob/fund-picker.tsx`
- Modify: `README.md` (dòng `FundPicker` ~137, dòng `format.ts` ~161)
- Test: `src/components/__tests__/ob/fund-picker.test.tsx`, `src/features/budget/__tests__/components/settle-month-modal.test.tsx`, `src/features/goals/__tests__/components/goals-view.test.tsx`

**Interfaces:**
- Consumes: `formatMoneyCompact(n, hidden)` (Task 1), `formatMoney(n, hidden)` (`@/lib/format`), `useMoneyVisibility()` (`@/components/money-visibility-provider`).
- Produces:
  - Props của `FundPicker` giữ nguyên.
  - Hợp đồng DOM: tên truy cập của mỗi nút **vẫn đúng bằng tên sổ**. Mô tả truy cập là `Số dư {formatMoney(amount, hidden)}`. Số rút gọn nằm trong nút nhưng `aria-hidden`.

- [ ] **Step 1: Viết test đỏ cho `FundPicker`**
  - Thêm `beforeEach` vào import của `vitest` (`import { describe, it, expect, vi, beforeEach } from "vitest"`), và `waitFor, within` vào import của `@testing-library/react`. File không bật `globals`, thiếu import là cả file không tải được.
  - Import `MoneyVisibilityProvider` từ `@/components/money-visibility-provider`.
  - Thêm `beforeEach(() => window.localStorage.clear())` vào `describe("FundPicker")`, rồi thêm:

```tsx
it("shows each fund's compact balance on its chip while the chip's name stays the fund name", () => {
  render(<FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />)

  expect(within(screen.getByRole("button", { name: "Quỹ dự phòng" })).getByText("50tr")).toBeInTheDocument()
  expect(within(screen.getByRole("button", { name: "Quỹ mua xe" })).getByText("20tr")).toBeInTheDocument()
})

it("reads the full balance to screen readers as the chip's description", () => {
  render(<FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />)

  expect(screen.getByRole("button", { name: "Quỹ dự phòng" })).toHaveAccessibleDescription("Số dư 50.000.000 ₫")
  expect(screen.getByRole("button", { name: "Quỹ mua xe" })).toHaveAccessibleDescription("Số dư 20.000.000 ₫")
})

it("masks the balances while money is hidden", async () => {
  window.localStorage.setItem("hide-money", "1")
  render(
    <MoneyVisibilityProvider>
      <FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />
    </MoneyVisibilityProvider>
  )

  const chip = screen.getByRole("button", { name: "Quỹ dự phòng" })
  await waitFor(() => expect(within(chip).getByText("•••")).toBeInTheDocument())
  expect(screen.queryByText("50tr")).not.toBeInTheDocument()
  expect(chip).toHaveAccessibleDescription("Số dư •••••••• ₫")
})

it("gives each chip its own description even when fund names contain spaces or quotes", () => {
  const savings: SavingsFund[] = [
    { name: 'Quỹ "A" mới', amount: 50_000, target: 1 },
    { name: "Quỹ B b", amount: 500_000, target: 1 },
  ]
  render(<FundPicker savings={savings} selected={null} onSelect={vi.fn()} />)

  expect(screen.getByRole("button", { name: 'Quỹ "A" mới' })).toHaveAccessibleDescription("Số dư 50.000 ₫")
  expect(screen.getByRole("button", { name: "Quỹ B b" })).toHaveAccessibleDescription("Số dư 500.000 ₫")
  expect(within(screen.getByRole("button", { name: 'Quỹ "A" mới' })).getByText("50xu")).toBeInTheDocument()
})

it("switches from no funds to funds without errors", () => {
  const { rerender } = render(<FundPicker savings={[]} selected={null} onSelect={vi.fn()} />)
  rerender(<FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />)

  expect(screen.getAllByRole("button")).toHaveLength(2)
})
```

Test cuối chỉ là test khói. Thứ tự hook do ESLint giữ.

- [ ] **Step 2: Viết test đỏ ở hai nơi dùng `FundPicker`**
  - `settle-month-modal.test.tsx`: thêm `within` vào import, rồi thêm:

```tsx
it("shows each fund's balance on its chip", () => {
  render(
    <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={-150_000} savings={SAVINGS} onConfirm={vi.fn()} />
  )

  expect(within(screen.getByRole("button", { name: "Quỹ A" })).getByText("100k")).toBeInTheDocument()
  expect(within(screen.getByRole("button", { name: "Quỹ B" })).getByText("20xu")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Quỹ B" })).toHaveAccessibleDescription("Số dư 20.000 ₫")
})

it("masks the fund balances on the chips while money is hidden", async () => {
  window.localStorage.setItem("hide-money", "1")
  render(
    <MoneyVisibilityProvider>
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={-150_000} savings={SAVINGS} onConfirm={vi.fn()} />
    </MoneyVisibilityProvider>
  )

  await waitFor(() => expect(screen.getAllByText("•••")).toHaveLength(2))
  expect(screen.queryByText("100k")).not.toBeInTheDocument()
  expect(screen.queryByText("20xu")).not.toBeInTheDocument()
})
```

  - `goals-view.test.tsx`:

```tsx
it("shows the fund's compact balance on the car fund picker", async () => {
  setStoredFinance({
    ...DEFAULT_FINANCE_STATE,
    savings: [{ name: "Quỹ mua xe", amount: 30_000_000, target: 200_000_000 }],
  })

  render(<GoalsView />)

  await waitFor(() => expect(screen.getByText("Mua xe ô tô")).toBeInTheDocument())
  const carCard = screen.getByText("Mua xe ô tô").closest("section") as HTMLElement
  const chip = within(carCard).getByRole("button", { name: "Quỹ mua xe" })
  expect(within(chip).getByText("30tr")).toBeInTheDocument()
  expect(chip).toHaveAccessibleDescription("Số dư 30.000.000 ₫")
})
```

- [ ] **Step 3: Chạy, thấy đỏ**

Run: `npx vitest run src/components/__tests__/ob/fund-picker.test.tsx src/features/budget/__tests__/components/settle-month-modal.test.tsx src/features/goals/__tests__/components/goals-view.test.tsx`
Expected: FAIL ở các test mới vì không thấy `50tr` / `100k` / `30tr` / mô tả. Test khói "switches from no funds to funds without errors" đã xanh từ trước. Các test cũ vẫn xanh.

- [ ] **Step 4: Sửa `src/components/ob/fund-picker.tsx`**
  - Gọi `const { hidden } = useMoneyVisibility()` và `const idPrefix = useId()` **trên** chỗ `return` của trạng thái "chưa có sổ".
  - Đổi thành `savings.map((fund, index) => …)`. Mỗi nút có `aria-describedby={`${idPrefix}-balance-${index}`}`, không dựng id từ tên sổ.
  - Nội dung nút theo thứ tự:
    1. `{fund.name}`;
    2. `<span aria-hidden="true">` chứa `formatMoneyCompact(fund.amount, hidden)`, class `ml-1.5 whitespace-nowrap [font-family:var(--ob-font-num)] tabular-nums`, thêm `text-[var(--ob-color-text-subtle)]` khi nút chưa được chọn;
    3. `<span id={…} hidden>` chứa `` `Số dư ${formatMoney(fund.amount, hidden)}` ``, một phần tử duy nhất.
  - Giữ nguyên các class viền và màu đang có, vì test cũ kiểm chúng.

- [ ] **Step 5: Cập nhật `README.md`**
  - Dòng `FundPicker` thành:
    `` | `FundPicker` | `savings` · `selected` · `onSelect` — chọn 1 quỹ tiết kiệm, dùng chung ở Mục tiêu (gắn quỹ mua xe) và Chi tiêu (tất toán tháng); mỗi nút hiện số dư rút gọn cạnh tên quỹ (`formatMoneyCompact`: 8k · 50xu · 500k · 1,5tr · 2 tỷ), số dư đầy đủ đọc qua `aria-describedby`, tự che khi bật "ẩn số tiền" | ``
  - Dòng `format.ts`: thêm `` · `formatMoneyCompact(n, hidden)` (rút gọn, cắt xuống: 8k · 50xu · 500k · 1,5tr · 2 tỷ; ẩn → `•••`) · `pastedMoneyDigits(text)` (lấy chữ số từ số tiền dán vào) ``.

- [ ] **Step 6: Chạy, thấy xanh**

Run: `npx vitest run src/components/__tests__/ob/fund-picker.test.tsx src/features/budget/__tests__/components/settle-month-modal.test.tsx src/features/budget/__tests__/components/budget-view.test.tsx src/features/goals/__tests__/components/goals-view.test.tsx && npm run lint`
Expected: PASS hết, lint sạch. Các test cũ tìm nút theo tên `Quỹ A`, `Quỹ mua xe` vẫn qua.

- [ ] **Step 7: Commit**

```bash
git add src/components/ob/fund-picker.tsx src/components/__tests__/ob/fund-picker.test.tsx src/features/budget/__tests__/components/settle-month-modal.test.tsx src/features/goals/__tests__/components/goals-view.test.tsx README.md
git commit -m "feat: show each fund's balance on the fund picker chips" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Lần tất toán từ sổ có số dư lẻ không bị mất khi tải lại

**Files:**
- Modify: `src/lib/budget/budget-storage.ts` (`settlementSchema`, ~dòng 36-45)
- Test: `src/lib/__tests__/budget/budget-storage.test.ts`, `src/lib/__tests__/budget/use-budget.test.ts`

**Interfaces:** không đổi chữ ký nào.

- [ ] **Step 1: Viết test**
  - Trong `describe("getStoredBudget")` của `budget-storage.test.ts`:

```ts
it("keeps a settlement whose fund balances are fractional, as a fund read from an imported file can be", () => {
  const settlement = {
    id: 1,
    month: "2026-09",
    at: "2026-09-30T00:00:00.000Z",
    direction: "deposit",
    amount: 300_000,
    fundName: "Quỹ A",
    fundAmountBefore: 150_000.5,
    fundAmountAfter: 450_000.5,
  }
  window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify({ ...DEFAULT_BUDGET_STATE, settlements: [settlement] }))

  expect(getStoredBudget().settlements).toEqual([settlement])
})

it("still drops a settlement whose fund balance is not a number", () => {
  const settlement = {
    id: 1,
    month: "2026-09",
    at: "2026-09-30T00:00:00.000Z",
    direction: "deposit",
    amount: 300_000,
    fundName: "Quỹ A",
    fundAmountBefore: "150000",
    fundAmountAfter: 450_000,
  }
  window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify({ ...DEFAULT_BUDGET_STATE, settlements: [settlement] }))

  expect(getStoredBudget().settlements).toEqual([])
})
```

  - Trong `describe("confirmSettlement")` của `use-budget.test.ts`:

```ts
it("keeps the settlement after a reload when the fund balance had a fraction of a đồng", async () => {
  setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 150_000.5, target: 500_000 }] })
  const { result } = renderHook(() => useBudget())
  await waitFor(() => expect(result.current.settlements).toEqual([]))

  act(() => {
    result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 300_000)
  })

  expect(getStoredBudget().settlements).toHaveLength(1)
  expect(getStoredBudget().settlements[0]).toMatchObject({ fundAmountBefore: 150_000.5, fundAmountAfter: 450_000.5 })
})
```

- [ ] **Step 2: Chạy, thấy đỏ**

Run: `npx vitest run src/lib/__tests__/budget/budget-storage.test.ts src/lib/__tests__/budget/use-budget.test.ts`
Expected: FAIL. Test số dư lẻ và test tải lại báo mảng rỗng. Test "still drops…" đã xanh từ trước: nó giữ cho bước nới không đi quá xa.

- [ ] **Step 3: Trong `settlementSchema`, đổi `fundAmountBefore` và `fundAmountAfter` từ `z.number().int()` thành `z.number()`**

`amount` giữ nguyên `z.number().int().positive()`. Thêm một dòng chú thích: số dư sổ có thể lẻ khi nhập từ file (`savingsFundSchema.amount` là `z.number()`), và bỏ bản ghi thì tháng mở lại, dễ bị tất toán hai lần.

- [ ] **Step 4: Chạy, thấy xanh**

Run: `npx vitest run src/lib/__tests__/budget`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/budget/budget-storage.ts src/lib/__tests__/budget/budget-storage.test.ts src/lib/__tests__/budget/use-budget.test.ts
git commit -m "fix: keep settlements made from a fund with a fractional balance" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Lấy các lần tất toán bấm trong một tháng

**Files:**
- Modify: `src/lib/date.ts` (thêm hàm, thêm vào export)
- Modify: `src/lib/budget/budget-calculations.ts` (thêm kiểu và hàm, thêm vào export)
- Modify: `README.md` (dòng `date.ts` ~160)
- Test: `src/lib/__tests__/date.test.ts`, `src/lib/__tests__/budget/budget-calculations.test.ts`, `src/lib/__tests__/budget/use-budget.test.ts`

**Interfaces:**
- Produces:
  - `dayKeyFromIso(iso: string): string | null` trong `src/lib/date.ts`: ngày `YYYY-MM-DD` theo giờ máy của thời điểm đó; `null` khi chuỗi không đọc được.
  - `type SettlementListItem = Settlement & { dayKey: string; fundDeleted: boolean }` trong `budget-calculations.ts`, có export type.
  - `settlementsMadeInMonth(settlements: Settlement[], month: string, fundNames: string[]): SettlementListItem[]` trong `budget-calculations.ts`:
    - giữ lần có `monthKeyFromDayKey(dayKey) === month`;
    - bỏ lần `dayKeyFromIso(at)` trả `null`;
    - xếp `Date.parse(b.at) - Date.parse(a.at)`, bằng nhau thì `b.id - a.id`;
    - `fundDeleted = !fundNames.includes(s.fundName)`.

- [ ] **Step 1: Viết test đỏ**
  - `date.test.ts`: import thêm `dayKeyFromIso`.

```ts
describe("dayKeyFromIso", () => {
  it("returns the local day of the instant, not its UTC date", () => {
    expect(dayKeyFromIso(new Date(2026, 9, 1, 0, 30).toISOString())).toBe("2026-10-01")
    expect(dayKeyFromIso(new Date(2026, 8, 30, 23, 30).toISOString())).toBe("2026-09-30")
  })

  it("returns null for an empty or unreadable string", () => {
    expect(dayKeyFromIso("")).toBeNull()
    expect(dayKeyFromIso("not a date")).toBeNull()
  })
})
```

  - `budget-calculations.test.ts`: import thêm `settlementsMadeInMonth`, dùng helper `settlement()` sẵn có ở đầu file.

```ts
describe("settlementsMadeInMonth", () => {
  it("keeps the settlements made in the month by local day, whatever month they settled", () => {
    const madeSep1 = settlement({ id: 1, month: "2026-08", at: new Date(2026, 8, 1, 0, 30).toISOString() })
    const madeAug31 = settlement({ id: 2, month: "2026-08", at: new Date(2026, 7, 31, 23, 30).toISOString() })
    const madeOct1 = settlement({ id: 3, month: "2026-09", at: new Date(2026, 9, 1, 0, 30).toISOString() })

    expect(settlementsMadeInMonth([madeSep1, madeAug31, madeOct1], "2026-09", ["Quỹ A"])).toEqual([
      { ...madeSep1, dayKey: "2026-09-01", fundDeleted: false },
    ])
  })

  it("leaves out a settlement whose time cannot be read", () => {
    expect(settlementsMadeInMonth([settlement({ at: "garbage" })], "2026-09", ["Quỹ A"])).toEqual([])
  })

  it("puts the newest first by real instant, then the higher id", () => {
    const sameInstantOffset = settlement({ id: 1, at: "2026-09-10T09:00:00+07:00" })
    const sameInstantUtc = settlement({ id: 2, at: "2026-09-10T02:00:00.000Z" })
    const later = settlement({ id: 3, at: new Date(2026, 8, 12, 8).toISOString() })

    const ids = settlementsMadeInMonth([sameInstantOffset, later, sameInstantUtc], "2026-09", ["Quỹ A"]).map((s) => s.id)

    expect(ids).toEqual([3, 2, 1])
  })

  it("flags a settlement whose fund is no longer among the savings funds", () => {
    const made = settlement({ fundName: "Quỹ A", at: new Date(2026, 8, 10, 9).toISOString() })

    expect(settlementsMadeInMonth([made], "2026-09", ["Quỹ B"])[0].fundDeleted).toBe(true)
    expect(settlementsMadeInMonth([made], "2026-09", ["Quỹ A"])[0].fundDeleted).toBe(false)
  })
})
```

  - `use-budget.test.ts`, trong `describe("confirmSettlement")`: import `dayKeyFromIso` từ `@/lib/date`. File đã bật fake timer trong `beforeEach`.

```ts
it("stamps the settlement with the moment of confirmation as an ISO string", async () => {
  vi.setSystemTime(new Date(2026, 8, 30, 23, 30))
  const { result } = renderHook(() => useBudget())
  await waitFor(() => expect(result.current.settlements).toEqual([]))

  act(() => {
    result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 50_000)
  })

  const at = result.current.settlements[0].at
  expect(at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  expect(dayKeyFromIso(at)).toBe("2026-09-30")
})
```

- [ ] **Step 2: Chạy, thấy đỏ**

Run: `npx vitest run src/lib/__tests__/date.test.ts src/lib/__tests__/budget/budget-calculations.test.ts src/lib/__tests__/budget/use-budget.test.ts`
Expected: FAIL vì `dayKeyFromIso` và `settlementsMadeInMonth` chưa có.

- [ ] **Step 3: Viết hai hàm theo Interfaces ở trên**
  - `dayKeyFromIso` dùng `dayKey(new Date(iso))` sau khi kiểm `Number.isNaN(date.getTime())`. Cấm `iso.slice(0, 10)`.
  - Export cả hai, kèm `type SettlementListItem`.

- [ ] **Step 4: Cập nhật `README.md`**

Dòng `date.ts`: thêm `` · `dayKeyFromIso` (chuỗi ISO → ngày theo giờ máy) `` vào sau `` `dayKey` ``.

- [ ] **Step 5: Chạy, thấy xanh**

Run: `npx vitest run src/lib/__tests__/date.test.ts src/lib/__tests__/budget`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/date.ts src/lib/budget/budget-calculations.ts src/lib/__tests__/date.test.ts src/lib/__tests__/budget/budget-calculations.test.ts src/lib/__tests__/budget/use-budget.test.ts README.md
git commit -m "feat: list the settlements made in a month by their local day" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Khối "Chốt sổ" ở đầu "Khoản chi tháng này"

**Files:**
- Create: `src/features/budget/components/closing-block.tsx`
- Modify: `src/features/budget/components/expense-list-card.tsx` (prop mới, vẽ khối trên nhóm ngày đầu tiên)
- Modify: `src/features/budget/components/budget-view.tsx` (tính và truyền danh sách)
- Test: `src/features/budget/__tests__/components/expense-list-card.test.tsx`, `src/features/budget/__tests__/components/budget-view.test.tsx`

**Interfaces:**
- Consumes:
  - `SettlementListItem`, `settlementsMadeInMonth` (Task 4);
  - `signedMoney(n, hidden)` từ `@/lib/finance/finance-calculations`, cho ra `"+ 300.000 ₫"` hoặc `"− 300.000 ₫"`, dấu trừ là U+2212;
  - `formatMoney`, `useMoneyVisibility`.
- Produces:
  - `interface ClosingBlockProps { settlements: SettlementListItem[] }` và `function ClosingBlock({ settlements }: ClosingBlockProps)` (CLAUDE.md §4: props có kiểu đặt tên riêng): trả `null` khi rỗng; vẽ các dòng theo đúng thứ tự nhận được.
  - Prop `settlements?: SettlementListItem[]` của `ExpenseListCard`, tuỳ chọn, mặc định `[]`.
  - `data-testid`: `closing-block` cho khối, `settlement-row` cho mỗi dòng.

- [ ] **Step 1: Viết test đỏ cho `ExpenseListCard`**
  - Import `type SettlementListItem` từ `@/lib/budget/budget-calculations`.
  - Thêm helper `closing()` và các test sau vào `describe("ExpenseListCard")`:

```tsx
function closing(overrides: Partial<SettlementListItem> = {}): SettlementListItem {
  return {
    id: 1,
    month: "2026-09",
    at: new Date(2026, 8, 30, 21, 0).toISOString(),
    direction: "withdraw",
    amount: 1_500_000,
    fundName: "Dự phòng",
    fundAmountBefore: 10_000_000,
    fundAmountAfter: 8_500_000,
    dayKey: "2026-09-30",
    fundDeleted: false,
    ...overrides,
  }
}

it("shows the month's settlements in a 'Chốt sổ' block above the first day", () => {
  render(<ExpenseListCard expenses={EXPENSES} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  const block = screen.getByTestId("closing-block")
  expect(within(block).getByText("Chốt sổ")).toBeInTheDocument()
  const firstDay = screen.getAllByTestId("expense-day-header")[0]
  expect(block.compareDocumentPosition(firstDay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it("has no 'Chốt sổ' block when nothing was settled this month", () => {
  render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)

  expect(screen.queryByTestId("closing-block")).not.toBeInTheDocument()
})

it("describes a withdrawal: settled month, fund, day, balances and a red minus amount", () => {
  render(<ExpenseListCard expenses={[]} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  const row = screen.getByTestId("settlement-row")
  expect(within(row).getByText("Tất toán tháng 9")).toBeInTheDocument()
  expect(within(row).getByText("Rút từ sổ Dự phòng · 30/09")).toBeInTheDocument()
  expect(within(row).getByText("10.000.000 ₫ → 8.500.000 ₫")).toHaveAttribute("aria-hidden", "true")
  expect(within(row).getByText("Số dư sổ từ 10.000.000 ₫ thành 8.500.000 ₫")).toBeInTheDocument()
  expect(within(row).getByText("− 1.500.000 ₫")).toHaveStyle({ color: "var(--ob-color-expense)" })
})

it("describes a deposit with a green plus amount", () => {
  const deposit = closing({ direction: "deposit", amount: 300_000, fundName: "Du lịch", fundAmountBefore: 100_000, fundAmountAfter: 400_000 })
  render(<ExpenseListCard expenses={[]} settlements={[deposit]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  const row = screen.getByTestId("settlement-row")
  expect(within(row).getByText("Nạp vào sổ Du lịch · 30/09")).toBeInTheDocument()
  expect(within(row).getByText("+ 300.000 ₫")).toHaveStyle({ color: "var(--ob-color-income)" })
})

it("labels a late settlement with the day it was made", () => {
  const late = closing({ month: "2026-08", dayKey: "2026-09-02", at: new Date(2026, 8, 2, 9).toISOString() })
  render(<ExpenseListCard expenses={[]} settlements={[late]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  const row = screen.getByTestId("settlement-row")
  expect(within(row).getByText("Tất toán tháng 8")).toBeInTheDocument()
  expect(within(row).getByText("Rút từ sổ Dự phòng · bấm ngày 02/09")).toBeInTheDocument()
})

it("adds the year when the settled month is in another year", () => {
  const lastYear = closing({ month: "2025-12", dayKey: "2026-01-05", at: new Date(2026, 0, 5, 9).toISOString() })
  render(<ExpenseListCard expenses={[]} settlements={[lastYear]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  expect(within(screen.getByTestId("settlement-row")).getByText("Tất toán tháng 12, 2025")).toBeInTheDocument()
})

it("marks a fund that no longer exists", () => {
  render(<ExpenseListCard expenses={[]} settlements={[closing({ fundDeleted: true })]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  expect(screen.getByText("Rút từ sổ Dự phòng (đã xoá) · 30/09")).toBeInTheDocument()
})

it("keeps the settlements in the order given and offers no buttons on them", () => {
  const rows = [closing({ id: 2, fundName: "Mua xe" }), closing({ id: 1 })]
  render(<ExpenseListCard expenses={[]} settlements={rows} onRemove={vi.fn()} onEdit={vi.fn()} />)

  const rendered = screen.getAllByTestId("settlement-row")
  expect(rendered.map((r) => within(r).getByText(/^Rút từ sổ/).textContent)).toEqual([
    "Rút từ sổ Mua xe · 30/09",
    "Rút từ sổ Dự phòng · 30/09",
  ])
  rendered.forEach((r) => expect(within(r).queryAllByRole("button")).toHaveLength(0))
})

it("leaves the day groups, their totals and counts as they were", () => {
  render(<ExpenseListCard expenses={EXPENSES} settlements={[closing({ dayKey: "2026-09-02" })]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  const headers = screen.getAllByTestId("expense-day-header")
  expect(headers).toHaveLength(2)
  expect(headers[0]).toHaveTextContent(formatMoney(50_000))
  expect(headers[1]).toHaveTextContent("1 khoản")
})

it("masks every amount in the block while money is hidden", async () => {
  window.localStorage.setItem("hide-money", "1")
  render(
    <MoneyVisibilityProvider>
      <ExpenseListCard expenses={[]} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />
    </MoneyVisibilityProvider>
  )

  const row = screen.getByTestId("settlement-row")
  await waitFor(() => expect(within(row).getByText("− •••••••• ₫")).toBeInTheDocument())
  expect(row.textContent).not.toMatch(/\d{1,3}(\.\d{3})+/)
})

it("still shows the empty-state sentence under the block when no expense is recorded yet", () => {
  render(<ExpenseListCard expenses={[]} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  const block = screen.getByTestId("closing-block")
  const empty = screen.getByText(/Chưa có khoản chi nào/)
  expect(block.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(block).not.toContainElement(empty)
})

it("wraps a long unbroken fund name inside the row instead of widening the page", () => {
  const longName = "QuỹDựPhòngKhẩnCấpChoCảGiaĐìnhNămNay"
  render(<ExpenseListCard expenses={[]} settlements={[closing({ fundName: longName })]} onRemove={vi.fn()} onEdit={vi.fn()} />)

  const line = screen.getByText(`Rút từ sổ ${longName} · 30/09`)
  expect(line).toHaveClass("wrap-anywhere")
  expect(line.parentElement).toHaveClass("min-w-0")
})
```

- [ ] **Step 2: Viết test đỏ cho `BudgetView`**

Thêm vào `describe("BudgetView")` của `budget-view.test.tsx`:

```tsx
it("shows a settlement in the 'Chốt sổ' block right after confirming it, without counting it as spent", async () => {
  setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [{ month: "2026-09", amount: 1_000_000 }],
    expenses: [{ id: 1, dayKey: "2026-09-01", amount: 200_000, tag: null }],
  })

  render(<BudgetView />)
  await waitFor(() => expect(screen.getByRole("button", { name: "Tất toán tháng" })).not.toBeDisabled())
  fireEvent.click(screen.getByRole("button", { name: "Tất toán tháng" }))
  fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

  const block = await screen.findByTestId("closing-block")
  expect(within(block).getByText("Tất toán tháng 9")).toBeInTheDocument()
  expect(within(block).getByText("Nạp vào sổ Quỹ A · 15/09")).toBeInTheDocument()
  expect(screen.getByText(`Lương ${formatMoney(1_000_000)} · đã chi ${formatMoney(200_000)} tháng này`)).toBeInTheDocument()
})

it("lists only the settlements made this month, by the local day they were made", async () => {
  setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    settlements: [
      settlement({ id: 1, month: "2026-08", at: new Date(2026, 7, 31, 23, 30).toISOString() }),
      settlement({ id: 2, month: "2026-08", at: new Date(2026, 8, 1, 0, 30).toISOString() }),
    ],
  })

  render(<BudgetView />)

  const block = await screen.findByTestId("closing-block")
  expect(within(block).getAllByTestId("settlement-row")).toHaveLength(1)
  expect(within(block).getByText("Nạp vào sổ Quỹ A · bấm ngày 01/09")).toBeInTheDocument()
})

it("marks the fund of a settlement as deleted when it is no longer among the savings funds", async () => {
  setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    settlements: [settlement({ fundName: "Quỹ cũ", at: new Date(2026, 8, 10, 9).toISOString() })],
  })

  render(<BudgetView />)

  expect(await screen.findByText("Nạp vào sổ Quỹ cũ (đã xoá) · 10/09")).toBeInTheDocument()
})
```

- [ ] **Step 3: Chạy, thấy đỏ**

Run: `npx vitest run src/features/budget/__tests__/components/expense-list-card.test.tsx src/features/budget/__tests__/components/budget-view.test.tsx`
Expected: FAIL ở các test mới vì không có `closing-block` / `settlement-row`. Riêng hai test canh "has no 'Chốt sổ' block when nothing was settled this month" và "leaves the day groups, their totals and counts as they were" đã xanh từ trước (React bỏ qua prop `settlements` lạ, Vitest không kiểm kiểu) và phải giữ xanh. Các test cũ vẫn xanh.

- [ ] **Step 4: Viết `ClosingBlock` trong `closing-block.tsx`**
  - Nhãn `Chốt sổ` theo kiểu nhãn nhỏ của app. Khung có viền `--ob-color-border` và nền `--ob-color-surface-sunken`, không thu/mở.
  - Mỗi dòng:
    - biểu tượng `aria-hidden`;
    - tiêu đề `Tất toán tháng {Number(mm)}`, thêm `, {yyyy}` khi năm của `month` khác năm của `dayKey`; nếu `month` không khớp `/^\d{4}-(0[1-9]|1[0-2])$/` thì chỉ ghi `Tất toán`;
    - dòng phụ là **một phần tử**: `{Rút từ sổ|Nạp vào sổ} {fundName}{ (đã xoá)} · {dd/mm}`. Khi `month !== monthKeyFromDayKey(dayKey)` thì phần ngày là `bấm ngày {dd/mm}`;
    - phần tử `aria-hidden="true"` chỉ chứa `{formatMoney(before)} → {formatMoney(after)}`. Câu `<span className="sr-only">Số dư sổ từ {…} thành {…}</span>` đứng **cạnh** phần tử đó, không nằm bên trong;
    - số tiền `signedMoney(deposit ? amount : -amount, hidden)`, `style={{ color: "var(--ob-color-income)" }}` khi nạp, `"var(--ob-color-expense)"` khi rút, có `whitespace-nowrap`.
  - Cột chữ (tiêu đề, dòng phụ, phần trước → sau, câu sr-only) nằm trong `<div className="min-w-0 flex-1">`. Dòng phụ thêm `wrap-anywhere` để tên sổ dài liền mạch tự xuống dòng. Không đặt bề rộng hay khoảng đệm cố định.
  - Không có nút, không có `tabIndex`.

- [ ] **Step 5: Nối vào `ExpenseListCard` và `BudgetView`**
  - `ExpenseListCard` nhận `settlements = []`, vẽ `<ClosingBlock settlements={settlements} />` ngay trên `days.map(…)`. Câu báo trống thêm `mt-3` khi `settlements.length > 0`.
  - `BudgetView`: `const monthSettlements = settlementsMadeInMonth(settlements, currentMonth, savings.map((f) => f.name))` đặt cạnh `monthExpenses`, rồi truyền `settlements={monthSettlements}`. Không đụng `spent`, `remaining` hay dữ liệu biểu đồ.

- [ ] **Step 6: Chạy, thấy xanh**

Run: `npx vitest run src/features/budget src/lib/__tests__/budget && npx tsc --noEmit && npm run lint`
Expected: PASS hết, `tsc` không lỗi, lint sạch.

- [ ] **Step 7: Commit**

```bash
git add src/features/budget/components/closing-block.tsx src/features/budget/components/expense-list-card.tsx src/features/budget/components/budget-view.tsx src/features/budget/__tests__/components/expense-list-card.test.tsx src/features/budget/__tests__/components/budget-view.test.tsx
git commit -m "feat: show this month's settlements in a closing block above the expense list" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Tháng cũ có lương không bao giờ tự biến mất

**Files:**
- Modify: `src/lib/budget/budget-calculations.ts` (`unsettledPastMonths` ~dòng 53-67, thêm `hasSalaryRecord`, bỏ `shiftMonth` khỏi import nếu không còn dùng)
- Modify: `src/features/budget/components/budget-view.tsx` (xoá `PAST_MONTHS_TO_SETTLE` ~dòng 41-43 cùng chú thích, gọi chữ ký mới, thêm `items-start` cho lưới chứa thẻ Lương và thẻ Tất toán, `recorded` của `SalaryCard` dùng `hasSalaryRecord`)
- Test: `src/lib/__tests__/budget/budget-calculations.test.ts`, `src/features/budget/__tests__/components/budget-view.test.tsx`

**Interfaces:**
- Produces:
  - `unsettledPastMonths(salaries: MonthlySalary[], expenses: Expense[], settlements: Settlement[], currentMonth: string): UnsettledMonth[]` (bỏ tham số `lookback`). Tháng được xét:
    - các tháng **khác nhau** trong `salaries`;
    - khớp `/^\d{4}-(0[1-9]|1[0-2])$/`;
    - nhỏ hơn `currentMonth`;
    - giữ `remaining !== 0`;
    - xếp mới nhất trước.
  - `hasSalaryRecord(salaries: MonthlySalary[], month: string): boolean`: true khi có bản ghi, kể cả 0 đ.

- [ ] **Step 1: Viết lại `describe("unsettledPastMonths")` (test đỏ)**
  - Thay toàn bộ khối `describe("unsettledPastMonths")` hiện có (ngay trước `describe("tagChartColors")`, khoảng dòng 314-357 sau Task 4) bằng khối dưới đây.
  - Import thêm `hasSalaryRecord`.

```ts
describe("unsettledPastMonths", () => {
  it("lists every past month with a salary record that is still off, newest first, however far back", () => {
    const salaries: MonthlySalary[] = [
      { month: "2024-03", amount: 500_000 },
      { month: "2026-07", amount: 1_000_000 },
      { month: "2026-08", amount: 1_000_000 },
    ]
    const expenses = [expense({ dayKey: "2026-08-20", amount: 850_000 })]

    expect(unsettledPastMonths(salaries, expenses, [], "2026-09")).toEqual([
      { month: "2026-08", remaining: 150_000 },
      { month: "2026-07", remaining: 1_000_000 },
      { month: "2024-03", remaining: 500_000 },
    ])
  })

  it("never lists the current or a future month", () => {
    const salaries: MonthlySalary[] = [
      { month: "2026-08", amount: 1_000_000 },
      { month: "2026-09", amount: 1_000_000 },
      { month: "2026-11", amount: 1_000_000 },
    ]

    expect(unsettledPastMonths(salaries, [], [], "2026-09")).toEqual([{ month: "2026-08", remaining: 1_000_000 }])
  })

  it("leaves out a past month without a salary record, even with spending or a settlement", () => {
    const expenses = [expense({ dayKey: "2026-08-20", amount: 500_000 })]
    const settlements = [settlement({ month: "2026-08", direction: "withdraw", amount: 200_000 })]

    expect(unsettledPastMonths([], expenses, settlements, "2026-09")).toEqual([])
  })

  it("counts a salary record of 0 đ", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-08", amount: 0 }]

    expect(unsettledPastMonths(salaries, [expense({ dayKey: "2026-08-20", amount: 70_000 })], [], "2026-09")).toEqual([
      { month: "2026-08", remaining: -70_000 },
    ])
    expect(unsettledPastMonths(salaries, [], [], "2026-09")).toEqual([])
  })

  it("leaves out a fully settled month but keeps what is left of a partly settled one", () => {
    const salaries: MonthlySalary[] = [
      { month: "2026-07", amount: 1_000_000 },
      { month: "2026-08", amount: 1_000_000 },
    ]
    const expenses = [expense({ dayKey: "2026-08-20", amount: 850_000 })]
    const settlements = [
      settlement({ id: 1, month: "2026-08", direction: "deposit", amount: 150_000 }),
      settlement({ id: 2, month: "2026-07", direction: "deposit", amount: 400_000 }),
    ]

    expect(unsettledPastMonths(salaries, expenses, settlements, "2026-09")).toEqual([{ month: "2026-07", remaining: 600_000 }])
  })

  it("lists a month only once when its salary was recorded twice", () => {
    const salaries: MonthlySalary[] = [
      { month: "2026-08", amount: 1_000_000 },
      { month: "2026-08", amount: 2_000_000 },
    ]

    expect(unsettledPastMonths(salaries, [], [], "2026-09")).toEqual([{ month: "2026-08", remaining: 1_000_000 }])
  })

  it("ignores salary records whose month is not a YYYY-MM key", () => {
    // Tháng hiện tại 2027-01 để "2026-9", "2026-13", "2026-00" đều nhỏ hơn nó khi so chuỗi:
    // chỉ phép kiểm định dạng mới loại được chúng.
    const salaries: MonthlySalary[] = [
      { month: "", amount: 1 },
      { month: "2026-9", amount: 1 },
      { month: "2026-13", amount: 1 },
      { month: "2026-00", amount: 1 },
    ]

    expect(unsettledPastMonths(salaries, [], [], "2027-01")).toEqual([])
  })

  it("orders months across the new year", () => {
    const salaries: MonthlySalary[] = [
      { month: "2025-11", amount: 1 },
      { month: "2026-01", amount: 1 },
      { month: "2025-12", amount: 1 },
    ]

    expect(unsettledPastMonths(salaries, [], [], "2026-02").map((m) => m.month)).toEqual(["2026-01", "2025-12", "2025-11"])
  })
})

describe("hasSalaryRecord", () => {
  it("is true for a recorded salary, even 0 đ, and false when the month has none", () => {
    expect(hasSalaryRecord([{ month: "2026-09", amount: 0 }], "2026-09")).toBe(true)
    expect(hasSalaryRecord([{ month: "2026-08", amount: 1_000_000 }], "2026-09")).toBe(false)
  })
})
```

- [ ] **Step 2: Viết test đỏ cho `BudgetView`**
  - Xoá test `"does not bring up months older than last month"`, thay bằng các test dưới đây.
  - Import `MoneyVisibilityProvider` từ `@/components/money-visibility-provider`.

```tsx
it("lists every past month that has a salary record, newest first", async () => {
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [
      { month: "2025-12", amount: 1_000_000 },
      { month: "2026-06", amount: 1_000_000 },
      { month: "2026-08", amount: 1_000_000 },
    ],
  })

  render(<BudgetView />)
  await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" })

  expect(screen.getAllByRole("button", { name: /^Tất toán tháng \d/ }).map((b) => b.textContent)).toEqual([
    "Tất toán tháng 8, 2026",
    "Tất toán tháng 6, 2026",
    "Tất toán tháng 12, 2025",
  ])
})

it("does not offer a past month that has spending but no salary record", async () => {
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [{ month: "2026-09", amount: 1_000_000 }],
    expenses: [{ id: 1, dayKey: "2026-08-10", amount: 300_000, tag: null }],
  })

  render(<BudgetView />)
  await waitFor(() => expect(screen.getByRole("button", { name: "Tất toán tháng" })).not.toBeDisabled())

  expect(screen.queryByRole("button", { name: "Tất toán tháng 8, 2026" })).not.toBeInTheDocument()
  expect(screen.queryByText(/còn thiếu/)).not.toBeInTheDocument()
})

it("settles a month several months back and removes only its row", async () => {
  setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [
      { month: "2026-06", amount: 1_000_000 },
      { month: "2026-08", amount: 1_000_000 },
    ],
    expenses: [
      { id: 1, dayKey: "2026-06-10", amount: 900_000, tag: null },
      { id: 2, dayKey: "2026-08-20", amount: 850_000, tag: null },
    ],
  })

  render(<BudgetView />)
  fireEvent.click(await screen.findByRole("button", { name: "Tất toán tháng 6, 2026" }))
  const modal = screen.getByRole("dialog")
  fireEvent.click(within(modal).getByRole("button", { name: "Quỹ A" }))
  fireEvent.click(within(modal).getByRole("button", { name: "Xác nhận" }))

  await waitFor(() => expect(getStoredBudget().settlements).toHaveLength(1))
  expect(getStoredBudget().settlements[0]).toMatchObject({ month: "2026-06", direction: "deposit", amount: 100_000 })
  expect(getStoredFinance().savings[0].amount).toBe(200_000)
  await waitFor(() => expect(screen.queryByRole("button", { name: "Tất toán tháng 6, 2026" })).not.toBeInTheDocument())
  expect(screen.getByRole("button", { name: "Tất toán tháng 8, 2026" })).toBeInTheDocument()
})

it("masks the amounts of past months while money is hidden", async () => {
  window.localStorage.setItem("hide-money", "1")
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [{ month: "2026-06", amount: 1_000_000 }],
    expenses: [{ id: 1, dayKey: "2026-06-20", amount: 850_000, tag: null }],
  })

  render(
    <MoneyVisibilityProvider>
      <BudgetView />
    </MoneyVisibilityProvider>
  )
  await screen.findByRole("button", { name: "Tất toán tháng 6, 2026" })

  await waitFor(() => expect(screen.queryByText(formatMoney(150_000))).not.toBeInTheDocument())
  expect(screen.getAllByText("•••••••• ₫").length).toBeGreaterThan(0)
})

it("shows a past month once, without a duplicate-key warning, when its salary was imported twice", async () => {
  const consoleError = vi.spyOn(console, "error")
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [
      { month: "2026-08", amount: 1_000_000 },
      { month: "2026-08", amount: 2_000_000 },
    ],
  })

  render(<BudgetView />)
  await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" })

  expect(screen.getAllByRole("button", { name: "Tất toán tháng 8, 2026" })).toHaveLength(1)
  expect(consoleError).not.toHaveBeenCalled()
})
```

- [ ] **Step 3: Chạy, thấy đỏ**

Run: `npx vitest run src/lib/__tests__/budget/budget-calculations.test.ts src/features/budget/__tests__/components/budget-view.test.tsx`
Expected: FAIL.
  - Các test mong có tháng cũ nhận `[]`: hàm cũ nhận `lookback = undefined` nên `Array.from({ length: undefined })` rỗng.
  - `hasSalaryRecord is not a function`.
  - Bốn test `BudgetView` đỏ: "lists every past month…", "does not offer…", "settles a month several months back…", "masks the amounts…".
  - Ba test đã xanh từ trước, đúng lý do và phải giữ xanh vì chúng canh bản viết mới:
    - "leaves out a past month without a salary record…" và "ignores salary records whose month is not a YYYY-MM key": hàm cũ trả `[]`;
    - "shows a past month once…": tháng trước vốn đã hiện một dòng.

- [ ] **Step 4: Viết theo Interfaces ở trên**
  - Đổi chữ ký `unsettledPastMonths`, viết lại chú thích của hàm:
    - mọi tháng đã qua có bản ghi lương, kể cả 0 đ;
    - không giới hạn khoảng cách, thay "Quyết định 1" của plan `2026-09-29-fix-2-budget`;
    - tháng hiện tại và tương lai không vào danh sách;
    - vẫn tính lại từ dữ liệu gốc.
  - Thêm `hasSalaryRecord`.
  - Trong `BudgetView`:
    - xoá hằng `PAST_MONTHS_TO_SETTLE` cùng chú thích;
    - gọi `unsettledPastMonths(salaries, expenses, settlements, currentMonth)`;
    - `recorded={hasSalaryRecord(salaries, currentMonth)}`;
    - thêm `items-start` vào lưới `grid grid-cols-1 gap-5 sm:grid-cols-2` chứa thẻ Lương và thẻ Tất toán.

- [ ] **Step 5: Chạy, thấy xanh, kiểm kiểu**

Run: `npx vitest run src/lib/__tests__/budget src/features/budget && npx tsc --noEmit && npm run lint`
Expected: PASS. `tsc` không còn lỗi TS2554 (sai số tham số) nào; lint không cảnh báo `shiftMonth` thừa.

- [ ] **Step 6: Commit**

```bash
git add src/lib/budget/budget-calculations.ts src/features/budget/components/budget-view.tsx src/lib/__tests__/budget/budget-calculations.test.ts src/features/budget/__tests__/components/budget-view.test.tsx
git commit -m "feat: keep every past month with a salary settleable until it is settled" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Khoá tháng chưa có lương, toast ghi rõ tháng, giữ focus sau khi một tháng cũ biến mất

**Files:**
- Modify: `src/lib/budget/use-budget.ts`
  - thêm cờ `hydrated` theo đúng mẫu `useFinance`: `useState(false)`, bật `true` trong effect lúc mount sau khi đọc storage, trả ra trong object;
  - toast thành công `` `Đã tất toán ${formatMonthKey(month).toLowerCase()}` ``.
- Modify: `src/features/budget/components/budget-view.tsx`
- Modify: `README.md` (dòng `/budget` ~83)
- Test: `src/lib/__tests__/budget/use-budget.test.ts`, `src/features/budget/__tests__/components/budget-view.test.tsx`

**Interfaces:**
- Consumes: `hasSalaryRecord`, `unsettledPastMonths` (Task 6).
- Produces:
  - `useBudget()` trả thêm `hydrated: boolean`;
  - toast `Đã tất toán tháng {m}, {yyyy}`;
  - thẻ Tất toán (`Card`) có `tabIndex={-1}` và `aria-label="Tất toán tháng"`. Đây là đích focus cuối cùng.

- [ ] **Step 1: Viết test đỏ cho `useBudget`**

Đặt trong `use-budget.test.ts`, test thứ hai nằm trong `describe("confirmSettlement")`:

```ts
it("reports hydrated only once the stored data has been read", async () => {
  const seen: boolean[] = []
  renderHook(() => {
    const budget = useBudget()
    seen.push(budget.hydrated)
    return budget
  })

  expect(seen[0]).toBe(false)
  await waitFor(() => expect(seen[seen.length - 1]).toBe(true))
})

it("names the settled month in the success toast", async () => {
  const { result } = renderHook(() => useBudget())
  await waitFor(() => expect(result.current.settlements).toEqual([]))

  act(() => {
    result.current.confirmSettlement("2026-08", "Quỹ A", "deposit", 50_000)
  })

  expect(toast.success).toHaveBeenCalledWith("Đã tất toán tháng 8, 2026")
})
```

- [ ] **Step 2: Viết test đỏ cho `BudgetView`**

```tsx
it("locks this month's settle button and asks for the salary when this month has no salary record", async () => {
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    expenses: [{ id: 1, dayKey: "2026-09-02", amount: 200_000, tag: null }],
  })

  render(<BudgetView />)

  expect(
    await screen.findByText("Chưa nhập lương tháng này. Nhập lương (kể cả 0 đ) ở thẻ Lương tháng này rồi mới tất toán.")
  ).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Tất toán tháng" })).toBeDisabled()
  expect(screen.queryByText(/Bạn đang thiếu/)).not.toBeInTheDocument()
})

it("unlocks this month's settle button once a salary is saved, even 0 đ", async () => {
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    expenses: [{ id: 1, dayKey: "2026-09-02", amount: 200_000, tag: null }],
  })

  render(<BudgetView />)
  await screen.findByText(/Chưa nhập lương tháng này/)
  const salaryCard = screen.getByText("Lương tháng này").closest("section") as HTMLElement
  fireEvent.change(within(salaryCard).getByLabelText("Số tiền", { exact: false }), { target: { value: "0" } })
  fireEvent.click(within(salaryCard).getByRole("button", { name: "Lưu" }))

  await waitFor(() => expect(screen.getByRole("button", { name: "Tất toán tháng" })).not.toBeDisabled())
  expect(screen.queryByText(/Chưa nhập lương tháng này/)).not.toBeInTheDocument()
  expect(screen.getByText(/Bạn đang thiếu/)).toBeInTheDocument()
})

it("moves focus to the next past month's button after a past month is settled in full", async () => {
  setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [
      { month: "2026-07", amount: 1_000_000 },
      { month: "2026-08", amount: 1_000_000 },
    ],
    expenses: [{ id: 1, dayKey: "2026-08-20", amount: 850_000, tag: null }],
  })

  render(<BudgetView />)
  // Trình duyệt focus nút khi bấm, fireEvent.click thì không — focus tay để Modal nhớ đúng nút mở nó.
  const opener = await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" })
  opener.focus()
  fireEvent.click(opener)
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Quỹ A" }))
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }))

  await waitFor(() => expect(screen.getByRole("button", { name: "Tất toán tháng 7, 2026" })).toHaveFocus())
  // Modal trả focus trong setTimeout(0): chờ qua lượt đó rồi kiểm lại, để bắt trường hợp focus bị giật lại.
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(screen.getByRole("button", { name: "Tất toán tháng 7, 2026" })).toHaveFocus()
})

it("moves focus to this month's settle button when the last past month is settled and this month can be settled", async () => {
  setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [
      { month: "2026-08", amount: 1_000_000 },
      { month: "2026-09", amount: 1_000_000 },
    ],
    expenses: [
      { id: 1, dayKey: "2026-08-20", amount: 850_000, tag: null },
      { id: 2, dayKey: "2026-09-02", amount: 200_000, tag: null },
    ],
  })

  render(<BudgetView />)
  // Trình duyệt focus nút khi bấm, fireEvent.click thì không — focus tay để Modal nhớ đúng nút mở nó.
  const opener = await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" })
  opener.focus()
  fireEvent.click(opener)
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Quỹ A" }))
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }))

  await waitFor(() => expect(screen.getByRole("button", { name: "Tất toán tháng" })).toHaveFocus())
  // Modal trả focus trong setTimeout(0): chờ qua lượt đó rồi kiểm lại, để bắt trường hợp focus bị giật lại.
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(screen.getByRole("button", { name: "Tất toán tháng" })).toHaveFocus()
})

it("moves focus to the settle card when nothing is left to settle", async () => {
  setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
  setStoredBudget({
    ...DEFAULT_BUDGET_STATE,
    salaries: [{ month: "2026-08", amount: 1_000_000 }],
    expenses: [{ id: 1, dayKey: "2026-08-20", amount: 850_000, tag: null }],
  })

  render(<BudgetView />)
  // Trình duyệt focus nút khi bấm, fireEvent.click thì không — focus tay để Modal nhớ đúng nút mở nó.
  const opener = await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" })
  opener.focus()
  fireEvent.click(opener)
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Quỹ A" }))
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }))

  await waitFor(() => expect(screen.getByRole("region", { name: "Tất toán tháng" })).toHaveFocus())
  // Modal trả focus trong setTimeout(0): chờ qua lượt đó rồi kiểm lại, để bắt trường hợp focus bị giật lại.
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(screen.getByRole("region", { name: "Tất toán tháng" })).toHaveFocus()
})

it("does not flash the missing-salary hint before the stored salary has been read", () => {
  setStoredBudget({ ...DEFAULT_BUDGET_STATE, salaries: [{ month: "2026-09", amount: 1_000_000 }] })

  // render của RTL chạy effect trước khi trả về nên không thấy lần vẽ đầu; vẽ phía server thì thấy.
  expect(renderToString(<BudgetView />)).not.toContain("Chưa nhập lương tháng này")
})
```

Test cuối cần `import { renderToString } from "react-dom/server"` trong `budget-view.test.tsx`.

- [ ] **Step 3: Chạy, thấy đỏ**

Run: `npx vitest run src/lib/__tests__/budget/use-budget.test.ts src/features/budget/__tests__/components/budget-view.test.tsx`
Expected: FAIL. Chưa có `hydrated`; toast còn là "Đã tất toán tháng"; chưa có lời nhắc; focus rơi về `body`. Test "does not flash…" đã xanh từ trước (chưa có lời nhắc nào) và phải giữ xanh: nó chặn việc bỏ điều kiện `hydrated &&`.

- [ ] **Step 4: Sửa `useBudget` theo phần Files ở trên**

- [ ] **Step 5: Sửa `BudgetView`**
  - **Khoá tháng chưa có lương:**
    - `const salaryRecorded = hasSalaryRecord(salaries, currentMonth)`;
    - nút "Tất toán tháng" có `disabled={remaining === 0 || !salaryRecorded}`;
    - khi `hydrated && !salaryRecorded`, câu "Bạn đang dư/thiếu …" thay bằng lời nhắc nguyên văn ở Global Constraints. Tên nút giữ đúng `Tất toán tháng`.
  - **Giữ focus:**
    - Trong `onConfirm` của `SettleMonthModal`, khi tất toán thành công và tháng đó khác `currentMonth`, ghi tháng vào `useRef<string | null>`.
    - Một `useEffect` chạy sau mỗi lần render. Nếu ref có tháng mà tháng đó không còn trong `pastUnsettled`, chuyển focus theo thứ tự:
      1. nút của tháng cũ đầu tiên còn lại (gắn `data-settle-month={past.month}` cho các nút tháng cũ và tìm trong thẻ);
      2. nếu không còn tháng cũ: nút "Tất toán tháng" khi nút không bị khoá;
      3. nếu nút bị khoá: chính thẻ Tất toán (`ref`, `tabIndex={-1}`, `aria-label="Tất toán tháng"`).
    - Sau đó xoá ref. Tháng vẫn còn trong danh sách (tất toán một phần) thì chỉ xoá ref: `Modal` tự trả focus về nút đã mở nó.
    - `Modal` trả focus trong `setTimeout(0)` về phần tử giữ focus lúc mở hộp. Đó là nút tháng cũ vừa bị gỡ (trình duyệt focus nút khi bấm), nên lệnh đó không có tác dụng. Nếu lúc mở focus đang ở `body` thì `body.focus()` cũng không làm gì. Test focus tay vào nút trước khi bấm và kiểm lại sau lượt `setTimeout(0)` đó.

- [ ] **Step 6: Cập nhật `README.md`, dòng `/budget`**

Thay đoạn từ `"chốt" tháng:` tới hết dòng (gồm cả dấu `|` cuối dòng) bằng:
`"tất toán" tháng: dư thì cộng vào 1 quỹ tiết kiệm, thiếu thì rút từ 1 quỹ (nút chọn quỹ hiện số dư rút gọn) — số tiền còn phải tất toán luôn tính lại từ dữ liệu gốc; mọi tháng cũ có lương mà còn lệch đều được nhắc tới khi tất toán xong; tháng đang chạy phải có lương (kể cả 0 đ) mới tất toán được; các lần tất toán bấm trong tháng hiện ở khối "Chốt sổ" đầu danh sách "Khoản chi tháng này" (không cộng vào số đã chi) |`

- [ ] **Step 7: Chạy, thấy xanh**

Run: `npx vitest run src/lib/__tests__/budget src/features/budget && npx tsc --noEmit && npm run lint`
Expected: PASS hết. Các test cũ vẫn xanh, kể cả "offers to settle last month's leftover…" (nút tháng này vẫn khoá vì tháng 9 chưa có lương) và "disables the settle button when there is nothing to settle".

- [ ] **Step 8: Commit**

```bash
git add src/lib/budget/use-budget.ts src/features/budget/components/budget-view.tsx src/lib/__tests__/budget/use-budget.test.ts src/features/budget/__tests__/components/budget-view.test.tsx README.md
git commit -m "feat: require this month's salary before settling and keep focus after a past month is settled" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Kiểm tra toàn bộ

**Files:** không sửa file nào. Lỗi phát hiện ở đây được sửa trong task sở hữu đoạn code đó, kèm test.

- [ ] **Step 1: Chạy toàn bộ**

Run: `npm run test && npm run lint && npx tsc --noEmit && npm run build`
Expected: test xanh hết, lint sạch, `tsc` không lỗi, build thành công và có route `/budget`.

- [ ] **Step 2: Danh sách kiểm tay cho chủ repo** (chạy `npm run dev`, **không bấm "Tải lên"** trên localhost)
  1. Bấm "Tất toán tháng" và chọn sổ. Nút sổ hiện số dư rút gọn: sổ 50.000 ghi `50xu`. Xác nhận xong, khối "Chốt sổ" hiện ở đầu "Khoản chi tháng này", còn "đã chi" không đổi.
  2. Bật "Ẩn số tiền": số dư trên nút sổ, các dòng tháng cũ và khối "Chốt sổ" đều bị che.
  3. Tháng đang chạy chưa nhập lương: nút khoá, có lời nhắc. Nhập 0 đ thì nút mở.
  4. Tháng cũ có lương mà còn lệch hiện đủ và mới nhất ở trên. Tất toán xong thì dòng đó biến mất và focus không nhảy về đầu trang.
  5. Màn 320px với tên sổ dài: không cuộn ngang. Số tiền trong khối "Chốt sổ" không bị xuống dòng giữa chừng.
