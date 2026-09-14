import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react"

import { setStoredFinance, DEFAULT_FINANCE_STATE, getStoredFinance } from "@/features/finance/finance-storage"
import { formatMoney } from "@/lib/format"
import { setStoredBudget, DEFAULT_BUDGET_STATE } from "../../budget-storage"
import { BudgetView } from "../../components/budget-view"

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

  it("temporarily hides the monthly trend chart", async () => {
    render(<BudgetView />)

    await waitFor(() => expect(screen.getAllByText("Lương tháng này").length).toBeGreaterThan(0))
    expect(screen.queryByText(/Xu hướng/)).not.toBeInTheDocument()
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
    await waitFor(() => expect(within(listCard).getByText(formatMoney(350_000))).toBeInTheDocument())
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
})
