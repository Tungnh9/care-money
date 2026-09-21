import { describe, it, expect } from "vitest"

import { detectSpendingAnomaly } from "../insights-calculations"
import type { Expense } from "@/features/budget/types"

function expense(id: number, dayKey: string, amount: number): Expense {
  return { id, dayKey, amount, tag: null }
}

describe("detectSpendingAnomaly", () => {
  it("returns null when there is less than 3 months of prior history", () => {
    const expenses = [expense(1, "2026-03-01", 1_000_000), expense(2, "2026-04-01", 1_000_000)]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-15")).toBeNull()
  })

  it("returns null when the current month is within normal variance", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      expense(4, "2026-04-15", 1_050_000),
    ]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("returns null when the 3 prior months have zero variance (std = 0)", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_000_000),
      expense(3, "2026-03-15", 1_000_000),
      expense(4, "2026-04-15", 5_000_000),
    ]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("reports a high anomaly with the correct id, direction and percentage", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      expense(4, "2026-04-15", 3_000_000),
    ]
    const insight = detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")

    expect(insight).toEqual({
      id: "spending-anomaly-2026-04",
      text: "Tháng này bạn chi tiêu cao hơn khoảng 200% so với trung bình 3 tháng gần đây.",
    })
  })
})
