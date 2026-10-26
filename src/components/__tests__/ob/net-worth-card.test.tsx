import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { NetWorthCard } from "@/components/ob/net-worth-card"
import { pct1, type FinanceSummary } from "@/lib/finance/finance-calculations"

function buildSummary(overrides: Partial<FinanceSummary> = {}): FinanceSummary {
  return {
    savingsTotal: 20_000_000,
    debtTotal: 5_000_000,
    goldPhan: 3,
    goldCost: 15_000_000,
    goldValue: 18_000_000,
    goldPL: 3_000_000,
    goldPct: 20,
    silverLuong: 0,
    silverCost: 0,
    silverValue: 0,
    silverPL: 0,
    silverPct: 0,
    investCost: 0,
    investValue: 0,
    investPL: 0,
    investPct: 0,
    net: 33_000_000,
    netPct: 12.3,
    ...overrides,
  }
}

describe("NetWorthCard", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the card label, the formatted net worth and the percent", () => {
    const summary = buildSummary()
    render(<NetWorthCard summary={summary} />)

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByText("Tài sản ròng")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(summary.net))).toBeInTheDocument()
    expect(screen.getByText(pct1(summary.netPct), { exact: false })).toBeInTheDocument()
  })

  it("counts the net worth figure up from 0 on mount, each time the page is entered", () => {
    const summary = buildSummary()
    render(<NetWorthCard summary={summary} />)

    expect(screen.getByText(formatMoney(0))).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByText(formatMoney(summary.net))).toBeInTheDocument()
  })

  it("renders the legend entries for savings, gold and debt", () => {
    render(<NetWorthCard summary={buildSummary()} />)

    expect(screen.getByText("Tiết kiệm")).toBeInTheDocument()
    expect(screen.getByText("Vàng")).toBeInTheDocument()
    expect(screen.getByText("Nợ thẻ")).toBeInTheDocument()
  })

  it("omits the investment segment and legend entry when investValue is 0", () => {
    render(<NetWorthCard summary={buildSummary({ investValue: 0 })} />)

    expect(screen.queryByTestId("segment-invest")).not.toBeInTheDocument()
    expect(screen.queryByText("Đầu tư")).not.toBeInTheDocument()
  })

  it("includes the investment segment and legend entry when investValue is greater than 0", () => {
    render(<NetWorthCard summary={buildSummary({ investValue: 10_000_000 })} />)

    expect(screen.getByTestId("segment-invest")).toBeInTheDocument()
    expect(screen.getByText("Đầu tư")).toBeInTheDocument()
  })

  it("renders a neutral empty bar instead of dividing by zero when every total is 0", () => {
    render(<NetWorthCard summary={buildSummary({ savingsTotal: 0, goldValue: 0, investValue: 0, debtTotal: 0 })} />)

    expect(screen.queryByTestId("segment-savings")).not.toBeInTheDocument()
    expect(screen.queryByTestId("segment-gold")).not.toBeInTheDocument()
    expect(screen.queryByTestId("segment-debt")).not.toBeInTheDocument()
  })

  it("leaves zero-value parts out of the bar so it has no stray gaps, but keeps the full legend", () => {
    render(<NetWorthCard summary={buildSummary({ goldValue: 0, debtTotal: 0 })} />)

    expect(screen.getByTestId("segment-savings")).toBeInTheDocument()
    expect(screen.queryByTestId("segment-gold")).not.toBeInTheDocument()
    expect(screen.queryByTestId("segment-debt")).not.toBeInTheDocument()
    expect(screen.getByText("Vàng")).toBeInTheDocument()
    expect(screen.getByText("Nợ thẻ")).toBeInTheDocument()
  })

  it("settles on whole đồng instead of growing a ',5' when the count-up finishes", () => {
    render(<NetWorthCard summary={buildSummary({ net: 20_308_642.5 })} />)

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByText("20.308.643 ₫")).toBeInTheDocument()
  })
  it("omits the silver segment and legend entry when there is no silver", () => {
    render(<NetWorthCard summary={buildSummary({ silverValue: 0 })} />)

    expect(screen.queryByTestId("segment-silver")).not.toBeInTheDocument()
    expect(screen.queryByText("Bạc")).not.toBeInTheDocument()
  })

  it("adds a silver-coloured Bạc segment right after gold once silver is held", () => {
    render(<NetWorthCard summary={buildSummary({ silverValue: 4_000_000 })} />)

    const segment = screen.getByTestId("segment-silver")
    expect(segment).toHaveStyle({ background: "var(--ob-bac-300)" })
    expect(screen.getByTestId("segment-gold").nextElementSibling).toBe(segment)
    const legend = screen.getByText("Bạc")
    expect(screen.getByText("Vàng").nextElementSibling).toBe(legend)
  })

  it("draws the bar from silver alone when silver is the only holding", () => {
    render(
      <NetWorthCard
        summary={buildSummary({ savingsTotal: 0, goldValue: 0, investValue: 0, debtTotal: 0, silverValue: 4_000_000 })}
      />
    )

    expect(screen.getByTestId("segment-silver")).toBeInTheDocument()
  })
})
