import { describe, it, expect } from "vitest"

import { monthLabel } from "../overview-calculations"

describe("monthLabel", () => {
  it("formats the 1-indexed month in Vietnamese", () => {
    expect(monthLabel(new Date(2026, 7, 10))).toBe("tháng 8")
    expect(monthLabel(new Date(2026, 0, 1))).toBe("tháng 1")
  })
})
