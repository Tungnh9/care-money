import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

import { DEFAULT_FINANCE_STATE, setStoredFinance } from "@/features/finance/finance-storage"
import { formatMoney } from "@/lib/format"
import { GoalsView } from "../../components/goals-view"

describe("GoalsView", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("stagger-animates the overall-progress and goal cards in on mount, like the Tài chính page", () => {
    render(<GoalsView />)

    const overallSection = screen.getByText("Tiến độ chung").closest("section") as HTMLElement
    expect(overallSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("computes goal progress from real Tài chính data via useFinance(), not mock data", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ dự phòng", amount: 50_000_000, target: 100_000_000 }],
      gold: [{ id: 1, date: "10/08/2026", phan: 30, buy: 900_000 }],
      goldPrice: "950000",
    })

    render(<GoalsView />)

    await waitFor(() => expect(screen.getByText(formatMoney(50_000_000))).toBeInTheDocument())
    expect(screen.getByText("3 chỉ")).toBeInTheDocument()
    // Số liệu mock cũ (44 triệu / 6 chỉ) không còn xuất hiện.
    expect(screen.queryByText(formatMoney(44_000_000))).not.toBeInTheDocument()
    expect(screen.queryByText("6 chỉ")).not.toBeInTheDocument()
  })
})
