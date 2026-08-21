import { describe, it, expect } from "vitest"

import { formatMoney, groupVN } from "../format"

describe("formatMoney", () => {
  it("formats a number as Vietnamese currency by default", () => {
    expect(formatMoney(20_000_000)).toBe("20.000.000 ₫")
  })

  it("masks the amount when hidden is true", () => {
    expect(formatMoney(20_000_000, true)).toBe("•••••••• ₫")
  })

  it("shows the real amount when hidden is explicitly false", () => {
    expect(formatMoney(20_000_000, false)).toBe("20.000.000 ₫")
  })
})

describe("groupVN", () => {
  it("groups digits with Vietnamese thousands separators", () => {
    expect(groupVN("1234")).toBe("1.234")
  })

  it("strips non-digit characters before grouping", () => {
    expect(groupVN("1a2b3c4")).toBe("1.234")
  })

  it("returns an empty string for empty or undefined input", () => {
    expect(groupVN("")).toBe("")
    expect(groupVN(undefined)).toBe("")
  })
})
