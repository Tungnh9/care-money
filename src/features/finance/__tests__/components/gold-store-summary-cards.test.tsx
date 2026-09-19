import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi } from "../../finance-calculations"
import { GoldStoreSummaryCards } from "../../components/gold-store-summary-cards"

const ZERO_TOTAL = { store: "Tổng cộng", phan: 0, avgBuy: 0, cost: 0, value: 0, pl: 0 }

describe("GoldStoreSummaryCards", () => {
  it("renders nothing when there are no store summaries", () => {
    const { container } = render(<GoldStoreSummaryCards summaries={[]} total={ZERO_TOTAL} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders one card per store with quantity, average buy price, cost, value and P&L", () => {
    render(
      <GoldStoreSummaryCards
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
    const gainBox = screen.getByText(formatMoney(1_000_000)).closest("div") as HTMLElement
    expect(gainBox).toHaveStyle({ color: "var(--ob-color-income)" })

    expect(screen.getByText("PNJ")).toBeInTheDocument()
    expect(screen.getByText(phanToChi(8))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(7_200_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(6_400_000))).toBeInTheDocument()
    const lossBox = screen.getByText(formatMoney(800_000)).closest("div") as HTMLElement
    expect(lossBox).toHaveStyle({ color: "var(--ob-color-expense)" })
  })

  it("shows a distinct grand-total card across all stores", () => {
    render(
      <GoldStoreSummaryCards
        summaries={[{ store: "SJC", phan: 10, avgBuy: 900_000, cost: 9_000_000, value: 10_000_000, pl: 1_000_000 }]}
        total={{ store: "Tổng cộng", phan: 10, avgBuy: 900_000, cost: 9_000_000, value: 10_000_000, pl: 1_000_000 }}
      />
    )

    const totalLabel = screen.getByText("Tổng cộng")
    expect(totalLabel).toHaveStyle({ color: "var(--ob-color-action-strong)" })
    expect(screen.getAllByText(phanToChi(10)).length).toBeGreaterThan(1)
    expect(screen.getAllByText(formatMoney(1_000_000)).length).toBeGreaterThan(1)
  })
})
