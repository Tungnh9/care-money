import { describe, it, expect } from "vitest"

import { formatMoney } from "@/lib/format"
import { formatChi, getGoals } from "../get-goals"
import type { GoalsInput } from "../types"

const GOALS_INPUT: GoalsInput = {
  savingsTotal: 44_000_000,
  goldPhan: 60,
  goldPricePerPhan: 935_000,
}

describe("getGoals", () => {
  it("computes the percent for each goal from the mock data", () => {
    const { goals } = getGoals(GOALS_INPUT)

    expect(goals.map((g) => [g.key, g.percent])).toEqual([
      ["savings", 44],
      ["gold", 60],
      ["car", 0],
    ])
  })

  it("computes the overall average from the raw ratios, not the rounded percents", () => {
    const { avg } = getGoals(GOALS_INPUT)

    expect(avg).toBe(35)
  })

  it("marks a goal as done only once now reaches its target", () => {
    const { goals } = getGoals({ ...GOALS_INPUT, savingsTotal: 100_000_000 })

    const savingsGoal = goals.find((g) => g.key === "savings")
    expect(savingsGoal?.done).toBe(true)
    expect(savingsGoal?.percent).toBe(100)

    const untouched = getGoals(GOALS_INPUT).goals.find((g) => g.key === "savings")
    expect(untouched?.done).toBe(false)
  })

  it("caps percent at 100 even when now overshoots target", () => {
    const { goals } = getGoals({ ...GOALS_INPUT, goldPhan: 140 })

    const goldGoal = goals.find((g) => g.key === "gold")
    expect(goldGoal?.percent).toBe(100)
    expect(goldGoal?.done).toBe(true)
  })
})

describe("formatMoney", () => {
  it("formats with Vietnamese thousands separators and the đ suffix", () => {
    expect(formatMoney(44_000_000)).toBe("44.000.000 ₫")
  })
})

describe("formatChi", () => {
  it("formats an exact multiple of 10 phân as whole chỉ", () => {
    expect(formatChi(60)).toBe("6 chỉ")
  })

  it("includes the remaining phân when not an exact multiple of 10", () => {
    expect(formatChi(63)).toBe("6 chỉ 3 phân")
  })
})
