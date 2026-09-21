import { describe, it, expect } from "vitest"

import { detectSpendingAnomaly, detectTagAnomaly } from "../insights-calculations"
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

function taggedExpense(id: number, dayKey: string, amount: number, label: string): Expense {
  return { id, dayKey, amount, tag: { label, emoji: "🛍️", tint: "#E7F6EF" } }
}

describe("detectTagAnomaly", () => {
  it("reports only the single most-deviated tag, ignoring one within threshold", () => {
    const expenses = [
      // "Ăn uống" ổn định quanh 500k mỗi tháng — KHÔNG lệch.
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 510_000, "Ăn uống"),
      // "Mua sắm" tăng vọt tháng 4 — LỆCH mạnh.
      taggedExpense(5, "2026-01-12", 200_000, "Mua sắm"),
      taggedExpense(6, "2026-02-12", 200_000, "Mua sắm"),
      taggedExpense(7, "2026-03-12", 200_000, "Mua sắm"),
      taggedExpense(8, "2026-04-12", 500_000, "Mua sắm"),
    ]

    const insight = detectTagAnomaly(expenses, "2026-04")

    expect(insight).toEqual({
      id: "tag-anomaly-2026-04",
      text: 'Chi tiêu cho "🛍️ Mua sắm" tháng này tăng 150% so với trung bình 3 tháng trước.',
    })
  })

  it("returns null when no tag exceeds the threshold", () => {
    const expenses = [
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 510_000, "Ăn uống"),
    ]

    expect(detectTagAnomaly(expenses, "2026-04")).toBeNull()
  })

  it("ignores a tag with no spending in the prior 3 months (no baseline to compare)", () => {
    const expenses = [taggedExpense(1, "2026-04-05", 1_000_000, "Du lịch")]

    expect(detectTagAnomaly(expenses, "2026-04")).toBeNull()
  })
})
