import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"

import {
  setStoredFinance,
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
} from "@/features/finance/finance-storage"
import { formatMoney } from "@/lib/format"
import { setStoredBudget, DEFAULT_BUDGET_STATE, getStoredBudget } from "../../budget-storage"
import { BudgetView } from "../../components/budget-view"
import type { Settlement } from "../../types"

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
      await screen.findByText(`Lương ${formatMoney(1_000_000)} · đã chi ${formatMoney(200_000)} tháng này`)
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
      await screen.findByText(`Lương ${formatMoney(500_000)} · đã chi ${formatMoney(800_000)} tháng này`)
    ).toBeInTheDocument()
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
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(getStoredBudget().settlements).toEqual([])
    expect(getStoredFinance().savings[0].amount).toBe(0)
  })
})
