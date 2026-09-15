import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { BudgetSummarySection } from "../../components/budget-summary-section"
import { formatMoney } from "@/lib/format"

describe("BudgetSummarySection", () => {
  it("shows salary, spent and a surplus framing when remaining is positive", () => {
    render(<BudgetSummarySection salary={20_000_000} spent={5_000_000} remaining={15_000_000} />)

    expect(screen.getByText(formatMoney(20_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(5_000_000))).toBeInTheDocument()
    expect(screen.getByText("Còn dư")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(15_000_000))).toBeInTheDocument()
  })

  it("shows a deficit framing when remaining is negative", () => {
    render(<BudgetSummarySection salary={5_000_000} spent={6_000_000} remaining={-1_000_000} />)

    expect(screen.getByText("Đang thiếu")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(1_000_000))).toBeInTheDocument()
  })
})
