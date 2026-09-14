import { describe, it, expect } from "vitest"

import {
  totalExpensesForMonth,
  salaryForMonth,
  signedSettledForMonth,
  remainingToSettle,
  breakdownByTag,
  lastNMonthKeys,
  monthlyTrend,
  trendMonthKeys,
} from "../budget-calculations"
import type { Expense, MonthlySalary, Settlement } from "../types"

const TAG_RENT = { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8" }
const TAG_SHOPPING = { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" }

function expense(overrides: Partial<Expense>): Expense {
  return { id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null, ...overrides }
}

function settlement(overrides: Partial<Settlement>): Settlement {
  return {
    id: 1,
    month: "2026-09",
    at: "2026-09-15T00:00:00.000Z",
    direction: "deposit",
    amount: 100_000,
    fundName: "Quỹ A",
    fundAmountBefore: 0,
    fundAmountAfter: 100_000,
    ...overrides,
  }
}

describe("totalExpensesForMonth", () => {
  it("sums amounts of expenses within the given month", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 100_000 }),
      expense({ id: 2, dayKey: "2026-09-15", amount: 200_000 }),
    ]
    expect(totalExpensesForMonth(expenses, "2026-09")).toBe(300_000)
  })

  it("ignores expenses from a different month", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 100_000 }),
      expense({ id: 2, dayKey: "2026-08-15", amount: 999_999 }),
    ]
    expect(totalExpensesForMonth(expenses, "2026-09")).toBe(100_000)
  })

  it("returns 0 for a month with no expenses", () => {
    expect(totalExpensesForMonth([], "2026-09")).toBe(0)
  })
})

describe("salaryForMonth", () => {
  it("returns the salary amount for the matching month", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 20_000_000 }]
    expect(salaryForMonth(salaries, "2026-09")).toBe(20_000_000)
  })

  it("returns 0 when no salary is set for that month", () => {
    expect(salaryForMonth([], "2026-09")).toBe(0)
  })
})

describe("signedSettledForMonth", () => {
  it("returns 0 with no settlements", () => {
    expect(signedSettledForMonth([], "2026-09")).toBe(0)
  })

  it("sums deposits as positive", () => {
    const settlements = [settlement({ direction: "deposit", amount: 100_000 })]
    expect(signedSettledForMonth(settlements, "2026-09")).toBe(100_000)
  })

  it("sums withdraws as negative", () => {
    const settlements = [settlement({ direction: "withdraw", amount: 40_000 })]
    expect(signedSettledForMonth(settlements, "2026-09")).toBe(-40_000)
  })

  it("nets mixed deposit and withdraw settlements", () => {
    const settlements = [
      settlement({ id: 1, direction: "deposit", amount: 100_000 }),
      settlement({ id: 2, direction: "withdraw", amount: 30_000 }),
    ]
    expect(signedSettledForMonth(settlements, "2026-09")).toBe(70_000)
  })

  it("ignores settlements from a different month", () => {
    const settlements = [settlement({ month: "2026-08", direction: "deposit", amount: 999_999 })]
    expect(signedSettledForMonth(settlements, "2026-09")).toBe(0)
  })
})

describe("remainingToSettle", () => {
  it("equals the full net (salary - expenses) with no prior settlements", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const expenses = [expense({ dayKey: "2026-09-01", amount: 300_000 })]
    expect(remainingToSettle(salaries, expenses, [], "2026-09")).toBe(700_000)
  })

  it("hits exactly 0 after one settlement matching the full surplus", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const settlements = [settlement({ direction: "deposit", amount: 1_000_000 })]
    expect(remainingToSettle(salaries, [], settlements, "2026-09")).toBe(0)
  })

  it("leaves a nonzero remainder after one partial deposit", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const settlements = [settlement({ direction: "deposit", amount: 500_000 })]
    expect(remainingToSettle(salaries, [], settlements, "2026-09")).toBe(500_000)
  })

  it("goes negative when new expenses arrive after a partial deposit overshoots the true surplus", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const settlements = [settlement({ direction: "deposit", amount: 500_000 })]
    const expenses = [expense({ dayKey: "2026-09-20", amount: 700_000 })]
    // net = 1,000,000 - 700,000 = 300,000 ; signedSettled = 500,000 ; remaining = 300,000 - 500,000 = -200,000
    expect(remainingToSettle(salaries, expenses, settlements, "2026-09")).toBe(-200_000)
  })

  it("leaves a nonzero-negative remainder after one partial withdraw", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const expenses = [expense({ dayKey: "2026-09-01", amount: 1_500_000 })]
    const settlements = [settlement({ direction: "withdraw", amount: 300_000 })]
    // net = 1,000,000 - 1,500,000 = -500,000 ; signedSettled = -300,000 ; remaining = -500,000 - (-300,000) = -200,000
    expect(remainingToSettle(salaries, expenses, settlements, "2026-09")).toBe(-200_000)
  })

  it("reaches exactly 0 after multiple partial settlements summing to the full net", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const settlements = [
      settlement({ id: 1, direction: "deposit", amount: 400_000 }),
      settlement({ id: 2, direction: "deposit", amount: 600_000 }),
    ]
    expect(remainingToSettle(salaries, [], settlements, "2026-09")).toBe(0)
  })

  it("is unaffected by the order expenses vs. settlements were logged in", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const expenses = [expense({ dayKey: "2026-09-01", amount: 200_000 })]
    const settlements = [settlement({ direction: "deposit", amount: 300_000 })]
    const a = remainingToSettle(salaries, expenses, settlements, "2026-09")
    const b = remainingToSettle(salaries, [...expenses].reverse(), [...settlements].reverse(), "2026-09")
    expect(a).toBe(b)
    expect(a).toBe(500_000)
  })

  it("is fully isolated from other months' expenses/settlements", () => {
    const salaries: MonthlySalary[] = [
      { month: "2026-09", amount: 1_000_000 },
      { month: "2026-08", amount: 5_000_000 },
    ]
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 200_000 }),
      expense({ id: 2, dayKey: "2026-08-01", amount: 4_999_999 }),
    ]
    const settlements = [settlement({ id: 1, month: "2026-08", direction: "deposit", amount: 1 })]
    expect(remainingToSettle(salaries, expenses, settlements, "2026-09")).toBe(800_000)
  })

  it("returns 0 for an untouched month with no salary, no expenses, and no settlements", () => {
    expect(remainingToSettle([], [], [], "2026-09")).toBe(0)
  })
})

describe("breakdownByTag", () => {
  it("groups expenses by the snapshotted tag label within the given month", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 100_000, tag: TAG_RENT }),
      expense({ id: 2, dayKey: "2026-09-02", amount: 50_000, tag: TAG_RENT }),
      expense({ id: 3, dayKey: "2026-09-03", amount: 30_000, tag: TAG_SHOPPING }),
    ]
    const result = breakdownByTag(expenses, "2026-09")
    expect(result).toEqual(
      expect.arrayContaining([
        { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 150_000 },
        { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", total: 30_000 },
      ])
    )
  })

  it("buckets untagged (null) expenses into a separate 'Không gắn thẻ' group instead of dropping them", () => {
    const expenses = [expense({ id: 1, dayKey: "2026-09-01", amount: 40_000, tag: null })]
    const result = breakdownByTag(expenses, "2026-09")
    expect(result).toEqual([{ label: "Không gắn thẻ", emoji: "🏷️", tint: "#F2E9DC", total: 40_000 }])
  })

  it("keeps a correct bucket for a tag whose label no longer exists in current Settings (still snapshotted)", () => {
    const goneTag = { label: "Tag đã xoá", emoji: "❓", tint: "#EEE" }
    const expenses = [expense({ id: 1, dayKey: "2026-09-01", amount: 10_000, tag: goneTag })]
    expect(breakdownByTag(expenses, "2026-09")).toEqual([
      { label: "Tag đã xoá", emoji: "❓", tint: "#EEE", total: 10_000 },
    ])
  })

  it("only sums expenses within the requested month", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 10_000, tag: TAG_RENT }),
      expense({ id: 2, dayKey: "2026-08-01", amount: 999_999, tag: TAG_RENT }),
    ]
    expect(breakdownByTag(expenses, "2026-09")).toEqual([
      { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 10_000 },
    ])
  })
})

describe("lastNMonthKeys", () => {
  it("returns n month keys ending at the given date's month, oldest first", () => {
    expect(lastNMonthKeys(3, new Date(2026, 8, 15))).toEqual(["2026-07", "2026-08", "2026-09"])
  })

  it("correctly wraps across a year boundary", () => {
    expect(lastNMonthKeys(3, new Date(2026, 1, 1))).toEqual(["2025-12", "2026-01", "2026-02"])
  })
})

describe("monthlyTrend", () => {
  it("produces one data point per month in the window, even for a month with zero expenses", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const expenses = [expense({ dayKey: "2026-09-01", amount: 200_000 })]
    const result = monthlyTrend(salaries, expenses, ["2026-08", "2026-09"])
    expect(result).toEqual([
      { month: "2026-08", salary: 0, spent: 0 },
      { month: "2026-09", salary: 1_000_000, spent: 200_000 },
    ])
  })

  it("attributes each expense to its month via dayKey, not any stored field", () => {
    const expenses = [expense({ dayKey: "2026-08-31", amount: 50_000 })]
    const result = monthlyTrend([], expenses, ["2026-08", "2026-09"])
    expect(result).toEqual([
      { month: "2026-08", salary: 0, spent: 50_000 },
      { month: "2026-09", salary: 0, spent: 0 },
    ])
  })

  it("excludes months outside the requested window", () => {
    const expenses = [expense({ dayKey: "2026-01-01", amount: 999_999 })]
    const result = monthlyTrend([], expenses, ["2026-09"])
    expect(result).toEqual([{ month: "2026-09", salary: 0, spent: 0 }])
  })
})

describe("trendMonthKeys", () => {
  const now = new Date(2026, 8, 15) // 2026-09

  it("trims leading empty months, starting from the earliest month with any data", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-06", amount: 10_000_000 }]
    expect(trendMonthKeys(salaries, [], 6, now)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09"])
  })

  it("finds the earliest data point across both salaries and expenses", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-08", amount: 10_000_000 }]
    const expenses = [expense({ dayKey: "2026-07-01" })]
    expect(trendMonthKeys(salaries, expenses, 6, now)).toEqual(["2026-07", "2026-08", "2026-09"])
  })

  it("still returns the full N-month trailing window when data is older than the window", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-01", amount: 10_000_000 }]
    expect(trendMonthKeys(salaries, [], 6, now)).toEqual(lastNMonthKeys(6, now))
  })

  it("guarantees at least 2 months so a single data point still reads as a trend", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 10_000_000 }]
    const expenses = [expense({ dayKey: "2026-09-01" })]
    expect(trendMonthKeys(salaries, expenses, 6, now)).toEqual(["2026-08", "2026-09"])
  })

  it("falls back to a short default window when there is no data at all", () => {
    expect(trendMonthKeys([], [], 6, now)).toEqual(["2026-07", "2026-08", "2026-09"])
  })
})
