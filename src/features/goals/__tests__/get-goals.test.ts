import { describe, it, expect } from "vitest"

import { BADGE_AT, formatChi, formatMoney, getGoals } from "../get-goals"
import { MOCK_GOALS_DATA } from "../mock-data"

describe("getGoals", () => {
  it("computes the percent for each goal from the mock data", () => {
    const { goals } = getGoals(MOCK_GOALS_DATA)

    expect(goals.map((g) => [g.key, g.percent])).toEqual([
      ["savings", 44],
      ["gold", 60],
      ["car", 0],
      ["streak", 47],
    ])
  })

  it("computes the overall average from the raw ratios, not the rounded percents", () => {
    const { avg } = getGoals(MOCK_GOALS_DATA)

    expect(avg).toBe(38)
  })

  it("marks a goal as done only once now reaches its target", () => {
    const { goals } = getGoals({ ...MOCK_GOALS_DATA, streak: BADGE_AT })

    const streakGoal = goals.find((g) => g.key === "streak")
    expect(streakGoal?.done).toBe(true)
    expect(streakGoal?.percent).toBe(100)

    const untouched = getGoals(MOCK_GOALS_DATA).goals.find((g) => g.key === "streak")
    expect(untouched?.done).toBe(false)
  })

  it("caps percent at 100 even when now overshoots target", () => {
    const { goals } = getGoals({ ...MOCK_GOALS_DATA, goldPhan: 140 })

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
