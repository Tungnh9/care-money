import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, render, screen, waitFor, fireEvent, within } from "@testing-library/react"
import { renderToString } from "react-dom/server"

import {
  setStoredFinance,
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
} from "@/lib/finance/finance-storage"
import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { setStoredBudget, DEFAULT_BUDGET_STATE, getStoredBudget } from "@/lib/budget/budget-storage"
import { BudgetView } from "../../components/budget-view"
import { CHART_PALETTE } from "@/lib/budget/budget-calculations"
import type { Settlement } from "@/lib/budget/types"

function settlement(overrides: Partial<Settlement>): Settlement {
  return {
    id: 1,
    month: "2026-09",
    at: "2026-09-10T00:00:00.000Z",
    direction: "deposit",
    amount: 100_000,
    fundName: "Quỹ A",
    fundAmountBefore: 0,
    fundAmountAfter: 100_000,
    ...overrides,
  }
}

// Dòng tóm tắt dưới tiêu đề tách số đã chi ra một <span> riêng để tô màu, nên so cả nội dung của đoạn
// (getByText mặc định chỉ đọc chữ nằm trực tiếp trong phần tử).
function summaryLine(text: string) {
  return (_: string, element: Element | null) => element?.tagName === "P" && element.textContent === text
}

function stubChartMeasurement() {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width: 600,
    height: 300,
    top: 0,
    left: 0,
    right: 600,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect)
}

// Màu của 1 nhãn trên vòng donut: badge nằm cùng nhóm <g> với chữ tên nhãn.
function donutColor(label: string) {
  const badge = screen
    .getAllByTestId("tag-badge")
    .find((el) => el.parentElement?.textContent?.includes(label))
  return badge?.getAttribute("fill")
}

// Chấm màu của 1 nhãn trong bảng tổng dưới chart 6 tháng: chấm nằm cùng hàng với tên nhãn.
function trendDot(label: string): HTMLElement {
  const dot = screen
    .getAllByTestId("tag-trend-dot")
    .find((el) => el.parentElement?.textContent?.includes(label))
  if (!dot) throw new Error(`Không thấy chấm màu của nhãn "${label}"`)
  return dot
}

describe("BudgetView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    stubChartMeasurement()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 15))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("renders the salary card, expense entry form, expense list and the tag breakdown chart", async () => {
    render(<BudgetView />)

    await waitFor(() => expect(screen.getAllByText("Lương tháng này").length).toBeGreaterThan(0))
    expect(screen.getAllByText("Ghi khoản chi").length).toBeGreaterThan(0)
    expect(screen.getByText("Khoản chi tháng này")).toBeInTheDocument()
    expect(screen.getByText(/Chi theo nhãn/)).toBeInTheDocument()
  })

  it("renders the monthly expense bar chart", async () => {
    render(<BudgetView />)

    await waitFor(() => expect(screen.getAllByText("Lương tháng này").length).toBeGreaterThan(0))
    expect(screen.getByText("Chi tiêu theo tháng")).toBeInTheDocument()
  })

  it("renders the 6-month tag trend chart", async () => {
    render(<BudgetView />)

    await waitFor(() => expect(screen.getAllByText("Lương tháng này").length).toBeGreaterThan(0))
    expect(screen.getByText("Xu hướng chi tiêu (6 tháng gần nhất)")).toBeInTheDocument()
  })

  it("disables the settle button when there is nothing to settle", async () => {
    render(<BudgetView />)

    await waitFor(() => expect(screen.getAllByText("Lương tháng này").length).toBeGreaterThan(0))

    expect(screen.getByRole("button", { name: "Tất toán tháng" })).toBeDisabled()
  })

  it("highlights the surplus amount in the settle card, distinct from the surrounding sentence", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 200_000, tag: null }],
    })

    render(<BudgetView />)

    const amount = await screen.findByText(formatMoney(800_000))
    expect(amount).toHaveStyle({ color: "var(--ob-color-income)" })
  })

  it("highlights the deficit amount in the settle card with the expense color", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 500_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 800_000, tag: null }],
    })

    render(<BudgetView />)

    const amount = await screen.findByText(formatMoney(300_000))
    expect(amount).toHaveStyle({ color: "var(--ob-color-expense)" })
  })

  it("edits an existing expense's amount from the list", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 200_000, tag: null, note: "Ăn trưa" }],
    })

    render(<BudgetView />)
    await screen.findByText("Ăn trưa")

    fireEvent.click(screen.getByRole("button", { name: /Sửa/ }))
    const modal = screen.getByRole("dialog")
    fireEvent.change(within(modal).getByLabelText("Số tiền", { exact: false }), { target: { value: "350000" } })
    fireEvent.click(within(modal).getByRole("button", { name: "Lưu" }))

    const listCard = screen.getByText("Khoản chi tháng này").closest("section") as HTMLElement
    await waitFor(() =>
      expect(within(listCard).getAllByText(formatMoney(350_000)).length).toBeGreaterThan(0)
    )
    expect(screen.queryByText("Sửa khoản chi")).not.toBeInTheDocument()
  })

  it("enables the settle button and completes a deposit settlement into a chosen fund", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }],
    })
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

    await waitFor(() => expect(getStoredFinance().savings[0].amount).toBe(900_000))
  })

  it("counts only this month's expenses as 'đã chi' in the header, even after a deposit settlement", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 200_000, tag: null }],
      settlements: [settlement({ direction: "deposit", amount: 300_000, fundAmountAfter: 300_000 })],
    })

    render(<BudgetView />)

    expect(
      await screen.findByText(summaryLine(`Lương ${formatMoney(1_000_000)} · đã chi ${formatMoney(200_000)} tháng này`))
    ).toBeInTheDocument()
  })

  it("counts only this month's expenses as 'đã chi' in the header after a withdraw settlement too", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 500_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 800_000, tag: null }],
      settlements: [
        settlement({ direction: "withdraw", amount: 300_000, fundAmountBefore: 1_000_000, fundAmountAfter: 700_000 }),
      ],
    })

    render(<BudgetView />)

    expect(
      await screen.findByText(summaryLine(`Lương ${formatMoney(500_000)} · đã chi ${formatMoney(800_000)} tháng này`))
    ).toBeInTheDocument()
  })

  it("shows the amount spent in green while it is within the salary", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 200_000, tag: null }],
    })

    render(<BudgetView />)

    const summary = await screen.findByText(
      summaryLine(`Lương ${formatMoney(1_000_000)} · đã chi ${formatMoney(200_000)} tháng này`)
    )
    expect(within(summary).getByText(formatMoney(200_000))).toHaveStyle({ color: "var(--ob-color-income)" })
  })

  it("still shows the amount spent in green when it equals the salary exactly", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 1_000_000, tag: null }],
    })

    render(<BudgetView />)

    const summary = await screen.findByText(
      summaryLine(`Lương ${formatMoney(1_000_000)} · đã chi ${formatMoney(1_000_000)} tháng này`)
    )
    // Số lương là chữ thường trong đoạn, chỉ số đã chi nằm trong phần tử riêng được tô màu.
    expect(within(summary).getByText(formatMoney(1_000_000))).toHaveStyle({ color: "var(--ob-color-income)" })
  })

  it("turns the amount spent red once it goes over the salary", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 500_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 800_000, tag: null }],
    })

    render(<BudgetView />)

    const summary = await screen.findByText(
      summaryLine(`Lương ${formatMoney(500_000)} · đã chi ${formatMoney(800_000)} tháng này`)
    )
    expect(within(summary).getByText(formatMoney(800_000))).toHaveStyle({ color: "var(--ob-color-expense)" })
  })

  it("previews a second settlement from the balance the first one left, without reloading the page", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ A", amount: 100_000, target: 5_000_000 }],
    })
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 200_000, tag: null }],
    })

    render(<BudgetView />)
    await waitFor(() => expect(screen.getByRole("button", { name: "Tất toán tháng" })).not.toBeDisabled())

    // Lần 1: gửi 300.000 trong số 800.000 đang dư → quỹ còn 400.000.
    fireEvent.click(screen.getByRole("button", { name: "Tất toán tháng" }))
    let modal = screen.getByRole("dialog")
    fireEvent.click(within(modal).getByRole("button", { name: "Quỹ A" }))
    fireEvent.change(within(modal).getByLabelText("Số tiền", { exact: false }), { target: { value: "300000" } })
    fireEvent.click(within(modal).getByRole("button", { name: "Xác nhận" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    // Lần 2: còn dư 500.000 → gửi tiếp vào quỹ đang có 400.000 (không phải 100.000 lúc mở trang).
    fireEvent.click(screen.getByRole("button", { name: "Tất toán tháng" }))
    modal = screen.getByRole("dialog")
    fireEvent.click(within(modal).getByRole("button", { name: "Quỹ A" }))

    expect(within(modal).getByText(formatMoney(900_000))).toBeInTheDocument()
  })

  it("keeps the settle modal open when the fund turns out to be short at confirm time", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ B", amount: 3_000_000, target: 5_000_000 }],
    })
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 500_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-01", amount: 2_500_000, tag: null }],
    })

    render(<BudgetView />)
    await waitFor(() => expect(screen.getByRole("button", { name: "Tất toán tháng" })).not.toBeDisabled())

    // Tab khác vừa rút hết quỹ mà trang này chưa kịp đọc lại (ghi thẳng, KHÔNG bắn sự kiện).
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ B", amount: 0, target: 5_000_000 }] })
    )

    fireEvent.click(screen.getByRole("button", { name: "Tất toán tháng" }))
    fireEvent.click(screen.getByRole("button", { name: "Quỹ B" }))
    expect(screen.getByRole("button", { name: "Xác nhận" })).not.toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(getStoredBudget().settlements).toEqual([])
    expect(getStoredFinance().savings[0].amount).toBe(0)
  })

  it("offers to settle last month's leftover and records it against that month", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }],
    })
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-08", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-08-20", amount: 850_000, tag: null }],
    })

    render(<BudgetView />)
    fireEvent.click(await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" }))

    const modal = screen.getByRole("dialog")
    expect(within(modal).getByText("Tất toán Tháng 8, 2026")).toBeInTheDocument()
    expect(within(modal).getByLabelText("Số tiền", { exact: false })).toHaveValue("150.000")
    fireEvent.click(within(modal).getByRole("button", { name: "Quỹ A" }))
    fireEvent.click(within(modal).getByRole("button", { name: "Xác nhận" }))

    await waitFor(() => expect(getStoredBudget().settlements).toHaveLength(1))
    expect(getStoredBudget().settlements[0]).toMatchObject({ month: "2026-08", direction: "deposit", amount: 150_000 })
    expect(getStoredFinance().savings[0].amount).toBe(250_000)
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Tất toán tháng 8, 2026" })).not.toBeInTheDocument()
    )
    // Tháng này chưa có gì để tất toán — nút của tháng này vẫn khoá.
    expect(screen.getByRole("button", { name: "Tất toán tháng" })).toBeDisabled()
  })

  it("shows last month's shortfall in the expense colour", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-08", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-08-20", amount: 1_200_000, tag: null }],
    })

    render(<BudgetView />)
    await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" })

    expect(screen.getByText(/còn thiếu/)).toBeInTheDocument()
    expect(screen.getByText(formatMoney(200_000))).toHaveStyle({ color: "var(--ob-color-expense)" })
  })

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

  it("gives the same tag the same colour in the donut and in the 6-month chart, by its place in Settings", async () => {
    // Donut xếp nhãn theo khoản chi tháng này (Ăn uống trước), chart 6 tháng xếp theo lần xuất hiện
    // đầu tiên (Tiền trọ từ tháng 5) — trước bản sửa 2 nhãn bị tráo màu cho nhau giữa 2 chart.
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      expenses: [
        { id: 1, dayKey: "2026-05-03", amount: 3_000_000, tag: { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8" } },
        { id: 2, dayKey: "2026-09-02", amount: 100_000, tag: { label: "Ăn uống", emoji: "🍔", tint: "#F0ECFE" } },
        { id: 3, dayKey: "2026-09-03", amount: 3_000_000, tag: { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8" } },
      ],
    })

    render(<BudgetView />)
    await waitFor(() => expect(screen.getAllByTestId("tag-badge")).toHaveLength(2))

    // Cài đặt mặc định: "Tiền trọ" là nhãn thứ 1, "Ăn uống" là nhãn thứ 6.
    expect(donutColor("Tiền trọ")).toBe(CHART_PALETTE[0])
    expect(donutColor("Ăn uống")).toBe(CHART_PALETTE[5])
    expect(trendDot("Tiền trọ")).toHaveStyle({ backgroundColor: CHART_PALETTE[0] })
    expect(trendDot("Ăn uống")).toHaveStyle({ backgroundColor: CHART_PALETTE[5] })
  })

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
    // Khoản chi duy nhất ở 01/09, lần tất toán ở 15/09: nếu tất toán lọt vào monthExpenses sẽ có thêm nhóm ngày thứ 2.
    expect(screen.getAllByTestId("expense-day-header")).toHaveLength(1)
    expect(within(block).getByText("Tất toán tháng 9")).toBeInTheDocument()
    expect(within(block).getByText("Nạp vào sổ Quỹ A · 15/09")).toBeInTheDocument()
    expect(screen.getByText(summaryLine(`Lương ${formatMoney(1_000_000)} · đã chi ${formatMoney(200_000)} tháng này`))).toBeInTheDocument()
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

  it("tells screen readers why this month's settle button is locked when there is no salary record", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      expenses: [{ id: 1, dayKey: "2026-09-02", amount: 200_000, tag: null }],
    })

    render(<BudgetView />)
    await screen.findByText(/Chưa nhập lương tháng này/)

    expect(screen.getByRole("button", { name: "Tất toán tháng" })).toHaveAccessibleDescription(
      "Chưa nhập lương tháng này. Nhập lương (kể cả 0 đ) ở thẻ Lương tháng này rồi mới tất toán."
    )
  })

  it("gives this month's settle button no description once a salary is recorded, even while it stays locked", async () => {
    // Lương đã nhập, chi vừa hết: nút vẫn khoá (không còn gì để tất toán) nhưng không còn lời nhắc để làm mô tả.
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-02", amount: 1_000_000, tag: null }],
    })

    render(<BudgetView />)
    await screen.findByText(summaryLine(`Lương ${formatMoney(1_000_000)} · đã chi ${formatMoney(1_000_000)} tháng này`))

    const button = screen.getByRole("button", { name: "Tất toán tháng" })
    expect(button).toBeDisabled()
    expect(button).not.toHaveAccessibleDescription()
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

  it("leaves focus on a past month's button when that month is only partly settled", async () => {
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
    // Tháng 7 đứng sau tháng 8 trong danh sách: nếu focus bị chuyển đi thì nó sẽ sang nút tháng 8.
    const opener = await screen.findByRole("button", { name: "Tất toán tháng 7, 2026" })
    opener.focus()
    fireEvent.click(opener)
    const modal = screen.getByRole("dialog")
    fireEvent.click(within(modal).getByRole("button", { name: "Quỹ A" }))
    fireEvent.change(within(modal).getByLabelText("Số tiền", { exact: false }), { target: { value: "400000" } })
    fireEvent.click(within(modal).getByRole("button", { name: "Xác nhận" }))

    expect(getStoredBudget().settlements).toHaveLength(1)
    expect(getStoredBudget().settlements[0]).toMatchObject({ month: "2026-07", amount: 400_000 })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    // Chưa tới lượt setTimeout(0) của Modal: focus không được nhảy sang nút khác dù chỉ trong chốc lát.
    expect(opener).toHaveFocus()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(opener).toHaveFocus()
  })

  it("leaves focus on this month's settle button after settling this month, even with a past month listed", async () => {
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
    await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" })
    const opener = screen.getByRole("button", { name: "Tất toán tháng" })
    await waitFor(() => expect(opener).not.toBeDisabled())
    opener.focus()
    fireEvent.click(opener)
    const modal = screen.getByRole("dialog")
    fireEvent.click(within(modal).getByRole("button", { name: "Quỹ A" }))
    // Tháng này còn dư 800.000: chỉ tất toán 300.000 để nút vẫn bấm được và còn giữ được focus.
    fireEvent.change(within(modal).getByLabelText("Số tiền", { exact: false }), { target: { value: "300000" } })
    fireEvent.click(within(modal).getByRole("button", { name: "Xác nhận" }))

    expect(getStoredBudget().settlements).toHaveLength(1)
    expect(getStoredBudget().settlements[0]).toMatchObject({ month: "2026-09", amount: 300_000 })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    // Chưa tới lượt setTimeout(0) của Modal: focus không được nhảy sang nút tháng cũ dù chỉ trong chốc lát.
    expect(opener).toHaveFocus()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(opener).toHaveFocus()
  })

  it("moves focus to the settle card when this month is settled in full", async () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-09-02", amount: 200_000, tag: null }],
    })

    render(<BudgetView />)
    const opener = screen.getByRole("button", { name: "Tất toán tháng" })
    await waitFor(() => expect(opener).not.toBeDisabled())
    opener.focus()
    fireEvent.click(opener)
    const modal = screen.getByRole("dialog")
    fireEvent.click(within(modal).getByRole("button", { name: "Quỹ A" }))
    // Trình duyệt focus nút khi bấm: focus nằm TRONG hộp thoại lúc nó đóng, và rơi theo nút "Xác nhận" bị gỡ.
    const confirm = within(modal).getByRole("button", { name: "Xác nhận" })
    confirm.focus()
    fireEvent.click(confirm)

    // Tất toán đủ 800.000 đang dư: nút "Tất toán tháng" tự khoá nên Modal không trả focus về nó được.
    expect(getStoredBudget().settlements[0]).toMatchObject({ month: "2026-09", amount: 800_000 })
    expect(opener).toBeDisabled()
    await waitFor(() => expect(screen.getByRole("region", { name: "Tất toán tháng" })).toHaveFocus())
    // Modal trả focus trong setTimeout(0): chờ qua lượt đó rồi kiểm lại, để bắt trường hợp focus bị giật lại.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.getByRole("region", { name: "Tất toán tháng" })).toHaveFocus()
  })

  it("does not pull focus back to the settle card on later renders", async () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }] })
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-08", amount: 1_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-08-20", amount: 850_000, tag: null }],
    })

    render(<BudgetView />)
    const opener = await screen.findByRole("button", { name: "Tất toán tháng 8, 2026" })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Quỹ A" }))
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }))
    await waitFor(() => expect(screen.getByRole("region", { name: "Tất toán tháng" })).toHaveFocus())
    await new Promise((resolve) => setTimeout(resolve, 20))

    // Người dùng chuyển sang gõ ở ô khác; 1 lần ghi dữ liệu (vd. từ tab khác) làm BudgetView vẽ lại.
    const salaryCard = screen.getByText("Lương tháng này").closest("section") as HTMLElement
    const salaryInput = within(salaryCard).getByLabelText("Số tiền", { exact: false })
    salaryInput.focus()
    act(() => {
      setStoredBudget({
        ...getStoredBudget(),
        expenses: [...getStoredBudget().expenses, { id: 2, dayKey: "2026-09-03", amount: 50_000, tag: null }],
      })
    })

    // Dòng đầu trang đổi theo khoản chi mới: BudgetView đã vẽ lại rồi mới kiểm focus.
    await screen.findByText(summaryLine(`Lương ${formatMoney(0)} · đã chi ${formatMoney(50_000)} tháng này`))
    expect(salaryInput).toHaveFocus()
  })
})
