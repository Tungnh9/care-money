import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { BudgetSummarySection } from "../../components/budget-summary-section"

describe("BudgetSummarySection", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the card label, the amount spent and the salary caption", () => {
    render(<BudgetSummarySection salary={20_000_000} spent={5_000_000} remaining={15_000_000} />)

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByText("Chi tiêu tháng này")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(5_000_000))).toBeInTheDocument()
    expect(screen.getByText(`trên lương ${formatMoney(20_000_000)}`)).toBeInTheDocument()
  })

  it("counts the spent figure up from 0 on mount", () => {
    render(<BudgetSummarySection salary={20_000_000} spent={5_000_000} remaining={15_000_000} />)

    expect(screen.getByText(formatMoney(0))).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByText(formatMoney(5_000_000))).toBeInTheDocument()
  })

  it("shows an upward surplus delta and both bar segments when there's still headroom", () => {
    render(<BudgetSummarySection salary={20_000_000} spent={5_000_000} remaining={15_000_000} />)

    expect(screen.getByText("▲", { exact: false })).toBeInTheDocument()
    expect(screen.getByText(formatMoney(15_000_000), { exact: false })).toBeInTheDocument()
    expect(screen.getByTestId("segment-spent")).toBeInTheDocument()
    expect(screen.getByTestId("segment-headroom")).toBeInTheDocument()
    expect(screen.getByText("Còn lại")).toBeInTheDocument()
  })

  it("shows a downward deficit delta when remaining is negative", () => {
    render(<BudgetSummarySection salary={5_000_000} spent={6_000_000} remaining={-1_000_000} />)

    expect(screen.getByText("▼", { exact: false })).toBeInTheDocument()
    expect(screen.getByText(formatMoney(1_000_000), { exact: false })).toBeInTheDocument()
  })

  it("fills the whole bar as spent, with no headroom segment or legend entry, when spending exceeds salary", () => {
    render(<BudgetSummarySection salary={5_000_000} spent={6_000_000} remaining={-1_000_000} />)

    expect(screen.getByTestId("segment-spent")).toBeInTheDocument()
    expect(screen.queryByTestId("segment-headroom")).not.toBeInTheDocument()
    expect(screen.queryByText("Còn lại")).not.toBeInTheDocument()
  })

  it("renders a neutral empty bar instead of dividing by zero when salary is 0", () => {
    render(<BudgetSummarySection salary={0} spent={0} remaining={0} />)

    expect(screen.queryByTestId("segment-spent")).not.toBeInTheDocument()
    expect(screen.queryByTestId("segment-headroom")).not.toBeInTheDocument()
  })

  it("hides the legend entirely alongside the neutral empty bar when salary is 0", () => {
    render(<BudgetSummarySection salary={0} spent={0} remaining={0} />)

    expect(screen.queryByText("Đã chi")).not.toBeInTheDocument()
    expect(screen.queryByText("Còn lại")).not.toBeInTheDocument()
  })
})
