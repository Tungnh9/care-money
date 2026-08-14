import { describe, it, expect } from "vitest"

import { dayKey } from "../date"

describe("dayKey", () => {
  it("formats as yyyy-mm-dd with zero-padded month and day", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05")
    expect(dayKey(new Date(2026, 10, 20))).toBe("2026-11-20")
  })
})
