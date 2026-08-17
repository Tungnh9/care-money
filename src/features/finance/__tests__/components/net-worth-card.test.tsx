import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { NetWorthCard } from "../../components/net-worth-card"
import { pct1, type FinanceSummary } from "../../finance-calculations"

function buildSummary(overrides: Partial<FinanceSummary> = {}): FinanceSummary {
  return {
    savingsTotal: 20_000_000,
    debtTotal: 5_000_000,
    goldPhan: 3,
    goldCost: 15_000_000,
    goldValue: 18_000_000,
    goldPL: 3_000_000,
    goldPct: 20,
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
  it("renders the card label, the formatted net worth and the percent", () => {
    const summary = buildSummary()
    render(<NetWorthCard summary={summary} />)

    expect(screen.getByText("Tài sản ròng")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(summary.net))).toBeInTheDocument()
    expect(screen.getByText(pct1(summary.netPct), { exact: false })).toBeInTheDocument()
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
    render(
      <NetWorthCard
        summary={buildSummary({ savingsTotal: 0, goldValue: 0, investValue: 0, debtTotal: 0 })}
      />
    )

    expect(screen.queryByTestId("segment-savings")).not.toBeInTheDocument()
    expect(screen.queryByTestId("segment-gold")).not.toBeInTheDocument()
    expect(screen.queryByTestId("segment-debt")).not.toBeInTheDocument()
  })
})
