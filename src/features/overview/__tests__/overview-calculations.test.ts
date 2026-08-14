import { describe, it, expect } from "vitest"

import { greet, monthLabel, daysLeftInCycle, getMiniGoals } from "../overview-calculations"

describe("greet", () => {
  it("greets 'buổi sáng' before 11h", () => {
    expect(greet(new Date(2026, 7, 10, 8, 0))).toBe("Chào buổi sáng")
    expect(greet(new Date(2026, 7, 10, 10, 59))).toBe("Chào buổi sáng")
  })

  it("greets 'buổi trưa' from 11h to before 14h", () => {
    expect(greet(new Date(2026, 7, 10, 11, 0))).toBe("Chào buổi trưa")
    expect(greet(new Date(2026, 7, 10, 13, 59))).toBe("Chào buổi trưa")
  })

  it("greets 'buổi chiều' from 14h to before 18h", () => {
    expect(greet(new Date(2026, 7, 10, 14, 0))).toBe("Chào buổi chiều")
    expect(greet(new Date(2026, 7, 10, 17, 59))).toBe("Chào buổi chiều")
  })

  it("greets 'buổi tối' from 18h onward", () => {
    expect(greet(new Date(2026, 7, 10, 18, 0))).toBe("Chào buổi tối")
    expect(greet(new Date(2026, 7, 10, 23, 30))).toBe("Chào buổi tối")
  })
})

describe("monthLabel", () => {
  it("formats the 1-indexed month in Vietnamese", () => {
    expect(monthLabel(new Date(2026, 7, 10))).toBe("tháng 8")
    expect(monthLabel(new Date(2026, 0, 1))).toBe("tháng 1")
  })
})

describe("daysLeftInCycle", () => {
  it("counts days until this month's cycle-start day when it hasn't passed yet", () => {
    expect(daysLeftInCycle("15", new Date(2026, 7, 10, 9, 0))).toBe(5)
  })

  it("rolls over to next month's cycle-start day once this month's has passed", () => {
    expect(daysLeftInCycle("5", new Date(2026, 7, 10, 9, 0))).toBe(26)
  })

  it("rolls over even on the cycle-start day itself, once past midnight", () => {
    expect(daysLeftInCycle("1", new Date(2026, 7, 1, 9, 0))).toBe(31)
  })

  it("clamps an out-of-range cycle-start day to 1..28", () => {
    expect(daysLeftInCycle("0", new Date(2026, 7, 10, 9, 0))).toBe(
      daysLeftInCycle("1", new Date(2026, 7, 10, 9, 0))
    )
    expect(daysLeftInCycle("35", new Date(2026, 7, 10, 9, 0))).toBe(
      daysLeftInCycle("28", new Date(2026, 7, 10, 9, 0))
    )
  })

  it("falls back to day 1 when cycle-start is not a valid number", () => {
    expect(daysLeftInCycle("", new Date(2026, 7, 10, 9, 0))).toBe(
      daysLeftInCycle("1", new Date(2026, 7, 10, 9, 0))
    )
  })
})

describe("getMiniGoals", () => {
  it("returns all zeros when there is no data yet", () => {
    const goals = getMiniGoals({ savingsTotal: 0, goldPhan: 0, streak: 0 })

    expect(goals.map((g) => g.percent)).toEqual([0, 0, 0, 0])
    expect(goals.map((g) => g.name)).toEqual([
      "Tiết kiệm 100 triệu",
      "30 ngày liên tục",
      "10 chỉ vàng",
      "Mua xe ô tô",
    ])
    expect(goals.map((g) => g.icon)).toEqual(["pig", "flame", "gold", "car"])
  })

  it("computes percent progress toward each target", () => {
    const goals = getMiniGoals({ savingsTotal: 50_000_000, goldPhan: 50, streak: 15 })

    expect(goals.map((g) => g.percent)).toEqual([50, 50, 50, 0])
  })

  it("caps every percent at 100 even when overshooting the target", () => {
    const goals = getMiniGoals({ savingsTotal: 200_000_000, goldPhan: 150, streak: 60 })

    expect(goals.map((g) => g.percent)).toEqual([100, 100, 100, 0])
  })
})
