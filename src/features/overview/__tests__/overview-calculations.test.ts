import { describe, it, expect } from "vitest"

import { monthLabel, splitGreeting } from "../overview-calculations"

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
