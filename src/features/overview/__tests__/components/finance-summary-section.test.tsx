import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import type { FinanceSummary } from "@/features/finance/finance-calculations"
import { formatMoney } from "@/lib/format"
import type { Budget } from "@/lib/settings-storage"
import { FinanceSummarySection } from "../../components/finance-summary-section"

const ZERO_SUMMARY: FinanceSummary = {
  savingsTotal: 0,
  debtTotal: 0,
  goldPhan: 0,
  goldCost: 0,
  goldValue: 0,
  goldPL: 0,
  goldPct: 0,
  investCost: 0,
  investValue: 0,
  investPL: 0,
  investPct: 0,
  net: 0,
  netPct: 0,
}

const BUDGET: Budget = { amount: "20.000.000", cycleStart: "1" }

describe("FinanceSummarySection", () => {
  it("shows the zero-spend caption, 0% progress, and every asset's empty-state hint when there is no data", () => {
    render(
      <FinanceSummarySection budget={BUDGET} savings={[]} cards={[]} invests={[]} summary={ZERO_SUMMARY} />
    )

    expect(screen.getByText(formatMoney(20_000_000))).toBeInTheDocument()
    expect(screen.getByText("chưa có chi tiêu nào tháng này")).toBeInTheDocument()
    expect(screen.getByText("Đã dùng 0% ngân sách")).toBeInTheDocument()
    expect(screen.getByText("chưa có quỹ")).toBeInTheDocument()
    expect(screen.getByText("chưa có")).toBeInTheDocument()
    expect(screen.getByText("chưa có khoản nào")).toBeInTheDocument()
    expect(screen.getByText("không nợ")).toBeInTheDocument()
  })

  it("shows real totals and hints, color-coding gold P&L and any outstanding debt", () => {
    const summary: FinanceSummary = {
      ...ZERO_SUMMARY,
      savingsTotal: 10_000_000,
      debtTotal: 2_000_000,
      goldPhan: 20,
      goldValue: 18_000_000,
      goldPL: -1_000_000,
      investValue: 5_000_000,
    }

    render(
      <FinanceSummarySection
        budget={BUDGET}
        savings={[{ name: "Quỹ dự phòng", amount: 10_000_000, target: 20_000_000 }]}
        cards={[{ name: "Thẻ A", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "15/08" }]}
        invests={[{ id: 1, name: "Quỹ cổ phiếu", cost: 4_000_000, value: 5_000_000 }]}
        summary={summary}
      />
    )

    expect(screen.getByText(formatMoney(10_000_000))).toBeInTheDocument()
    expect(screen.getByText("1 quỹ")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(18_000_000))).toBeInTheDocument()
    expect(screen.getByText("20 phân · lỗ " + formatMoney(1_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(5_000_000))).toBeInTheDocument()
    expect(screen.getByText("1 khoản")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(2_000_000))).toBeInTheDocument()
    expect(screen.getByText("hạn 15/08")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(2_000_000))).toHaveStyle({ color: "var(--ob-color-expense)" })
  })
})
