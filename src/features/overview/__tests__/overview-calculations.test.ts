import { describe, it, expect } from "vitest"

import { monthLabel, getMiniGoals, splitGreeting } from "../overview-calculations"

describe("monthLabel", () => {
  it("formats the 1-indexed month in Vietnamese", () => {
    expect(monthLabel(new Date(2026, 7, 10))).toBe("tháng 8")
    expect(monthLabel(new Date(2026, 0, 1))).toBe("tháng 1")
  })
})

describe("splitGreeting", () => {
  it("splits the greeting phrase from the trailing display name", () => {
    expect(splitGreeting("Chào buổi sáng, Tungnh2k1", "Tungnh2k1")).toEqual({
      prefix: "Chào buổi sáng",
      name: "Tungnh2k1",
    })
  })

  it("falls back to the full greeting with no name when it doesn't end with the display name", () => {
    expect(splitGreeting("Xin chào", "Tungnh2k1")).toEqual({
      prefix: "Xin chào",
      name: "",
    })
  })
})

describe("getMiniGoals", () => {
  it("returns all zeros when there is no data yet", () => {
    const goals = getMiniGoals({ savingsTotal: 0, goldPhan: 0 })

    expect(goals.map((g) => g.percent)).toEqual([0, 0, 0])
    expect(goals.map((g) => g.name)).toEqual([
      "Tiết kiệm 100 triệu",
      "10 chỉ vàng",
      "Mua xe ô tô",
    ])
    expect(goals.map((g) => g.icon)).toEqual(["pig", "gold", "car"])
  })

  it("computes percent progress toward each target", () => {
    const goals = getMiniGoals({ savingsTotal: 50_000_000, goldPhan: 50 })

    expect(goals.map((g) => g.percent)).toEqual([50, 50, 0])
  })

  it("caps every percent at 100 even when overshooting the target", () => {
    const goals = getMiniGoals({ savingsTotal: 200_000_000, goldPhan: 150 })

    expect(goals.map((g) => g.percent)).toEqual([100, 100, 0])
  })
})
