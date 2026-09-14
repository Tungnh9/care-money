import { describe, it, expect } from "vitest"

import { dayKey, monthKey, monthKeyFromDayKey } from "../date"

describe("dayKey", () => {
  it("formats as yyyy-mm-dd with zero-padded month and day", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05")
    expect(dayKey(new Date(2026, 10, 20))).toBe("2026-11-20")
  })
})

describe("monthKey", () => {
  it("formats as yyyy-mm with zero-padded month", () => {
    expect(monthKey(new Date(2026, 0, 5))).toBe("2026-01")
    expect(monthKey(new Date(2026, 10, 20))).toBe("2026-11")
  })
})

describe("monthKeyFromDayKey", () => {
  it("derives the yyyy-mm prefix from a yyyy-mm-dd day key", () => {
    expect(monthKeyFromDayKey("2026-01-05")).toBe("2026-01")
    expect(monthKeyFromDayKey("2026-11-20")).toBe("2026-11")
  })
})
