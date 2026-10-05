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
      ["gold", 33],
      ["car", 0],
    ])
  })

  it("computes the overall average from the raw ratios, not the rounded percents", () => {
    const { avg } = getGoals(GOALS_INPUT)

    expect(avg).toBe(26)
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
    const { goals } = getGoals({ ...GOALS_INPUT, goldPhan: 200 })

    const goldGoal = goals.find((g) => g.key === "gold")
    expect(goldGoal?.percent).toBe(100)
    expect(goldGoal?.done).toBe(true)
    expect(goldGoal?.note).toBe("Đã đạt mục tiêu 18 chỉ")
  })

  it("says the gold goal is reached instead of showing a zero or negative remainder, from exactly 18 chỉ up", () => {
    for (const goldPhan of [180, 185]) {
      const goldGoal = getGoals({ ...GOALS_INPUT, goldPhan }).goals.find((g) => g.key === "gold")
      expect(goldGoal?.note).toBe("Đã đạt mục tiêu 18 chỉ")
    }
  })

  it("estimates the value of the gold still to buy when a price is known", () => {
    const goldGoal = getGoals(GOALS_INPUT).goals.find((g) => g.key === "gold")

    expect(goldGoal?.note).toBe(`Còn 12 chỉ · tương đương ${formatMoney(120 * 935_000)}`)
  })

  it("leaves out the value estimate when no gold price is known", () => {
    const goldGoal = getGoals({ ...GOALS_INPUT, goldPricePerPhan: 0 }).goals.find((g) => g.key === "gold")

    expect(goldGoal?.note).toBe("Còn 12 chỉ")
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

  it("shows 0% and not done for a linked car fund with no target, without turning the average into NaN", () => {
    const { goals, avg } = getGoals({
      ...GOALS_INPUT,
      savings: [{ name: "Quỹ mua xe", amount: 0, target: 0 }],
      carFundName: "Quỹ mua xe",
    })

    const carGoal = goals.find((g) => g.key === "car")
    expect(carGoal).toMatchObject({ percent: 0, done: false, linked: true })
    expect(carGoal?.note).toBe(
      'Quỹ "Quỹ mua xe" chưa có mục tiêu. Đặt mục tiêu cho quỹ ở màn Tài chính để theo dõi tiến độ.'
    )
    expect(avg).toBe(26)
  })

  it("does not mark a car fund that holds money but has no target as done", () => {
    const { goals } = getGoals({
      ...GOALS_INPUT,
      savings: [{ name: "Quỹ mua xe", amount: 5_000_000, target: 0 }],
      carFundName: "Quỹ mua xe",
    })

    expect(goals.find((g) => g.key === "car")).toMatchObject({ percent: 0, done: false })
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
