import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi } from "../../finance-calculations"
import { GoldStoreSummaryTable } from "../../components/gold-store-summary-table"

const ZERO_TOTAL = { store: "Tổng cộng", phan: 0, avgBuy: 0, cost: 0, value: 0, pl: 0 }

describe("GoldStoreSummaryTable", () => {
  it("renders nothing when there are no store summaries", () => {
    const { container } = render(<GoldStoreSummaryTable summaries={[]} total={ZERO_TOTAL} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders one row per store with quantity, average buy price, cost, value and P&L", () => {
    render(
      <GoldStoreSummaryTable
        summaries={[
          { store: "SJC", phan: 10, avgBuy: 900_000, cost: 9_000_000, value: 10_000_000, pl: 1_000_000 },
          { store: "PNJ", phan: 8, avgBuy: 900_000, cost: 7_200_000, value: 6_400_000, pl: -800_000 },
        ]}
        total={{ store: "Tổng cộng", phan: 18, avgBuy: 900_000, cost: 16_200_000, value: 16_400_000, pl: 200_000 }}
      />
    )

    expect(screen.getByText("SJC")).toBeInTheDocument()
    expect(screen.getByText(phanToChi(10))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(9_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(10_000_000))).toBeInTheDocument()
    const gainBadge = screen.getByText(formatMoney(1_000_000))
    expect(gainBadge).toHaveClass("text-[var(--ob-color-income)]")

    expect(screen.getByText("PNJ")).toBeInTheDocument()
    expect(screen.getByText(phanToChi(8))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(7_200_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(6_400_000))).toBeInTheDocument()
    const lossBadge = screen.getByText(formatMoney(800_000))
    expect(lossBadge).toHaveClass("text-[var(--ob-color-expense)]")
  })

  it("shows a grand-total footer row across all stores", () => {
    render(
      <GoldStoreSummaryTable
        summaries={[{ store: "SJC", phan: 10, avgBuy: 900_000, cost: 9_000_000, value: 10_000_000, pl: 1_000_000 }]}
        total={{ store: "Tổng cộng", phan: 10, avgBuy: 900_000, cost: 9_000_000, value: 10_000_000, pl: 1_000_000 }}
      />
    )

    expect(screen.getByText("Tổng cộng")).toBeInTheDocument()
    const footerRow = screen.getByText("Tổng cộng").closest("tr") as HTMLTableRowElement
    expect(footerRow.closest("tfoot")).not.toBeNull()
    expect(screen.getAllByText(phanToChi(10)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(formatMoney(9_000_000)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(formatMoney(10_000_000)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(formatMoney(1_000_000)).length).toBeGreaterThan(0)
  })
})
