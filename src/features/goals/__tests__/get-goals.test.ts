import { describe, it, expect } from "vitest"

import { formatMoney } from "@/lib/format"
import { formatChi, getGoals } from "../get-goals"
import type { GoalsInput } from "../types"

const GOALS_INPUT: GoalsInput = {
  savingsTotal: 44_000_000,
  goldPhan: 60,
  goldPricePerPhan: 935_000,
  savings: [],
  carFundName: null,
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

  it("defaults the car goal to zeroed placeholder when no fund is linked", () => {
    const { goals } = getGoals(GOALS_INPUT)

    const carGoal = goals.find((g) => g.key === "car")
    expect(carGoal).toMatchObject({ now: 0, target: 1, percent: 0, linked: false })
  })

  it("computes the car goal from the linked savings fund when carFundName matches", () => {
    const { goals } = getGoals({
      ...GOALS_INPUT,
      savings: [{ name: "Quỹ mua xe", amount: 30_000_000, target: 200_000_000 }],
      carFundName: "Quỹ mua xe",
    })

    const carGoal = goals.find((g) => g.key === "car")
    expect(carGoal).toMatchObject({
      now: 30_000_000,
      target: 200_000_000,
      percent: 15,
      linked: true,
    })
  })

  it("falls back to the unlinked placeholder when carFundName points to a deleted fund", () => {
    const { goals } = getGoals({
      ...GOALS_INPUT,
      savings: [{ name: "Quỹ mua xe", amount: 30_000_000, target: 200_000_000 }],
      carFundName: "Quỹ đã xóa",
    })

    const carGoal = goals.find((g) => g.key === "car")
    expect(carGoal).toMatchObject({ now: 0, target: 1, percent: 0, linked: false })
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
