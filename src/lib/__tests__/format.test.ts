import { describe, it, expect } from "vitest"

import { formatMoney, groupVN, pastedMoneyDigits } from "../format"

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

  it("rounds to whole đồng, so a fractional amount never shows a decimal part", () => {
    // 2,5 phân × 8.123.457 đ/phân = 20.308.642,5 đ
    expect(formatMoney(2.5 * 8_123_457)).toBe("20.308.643 ₫")
    expect(formatMoney(0.5 * 8_123_457)).toBe("4.061.729 ₫")
  })

  it("never prints a negative zero", () => {
    expect(formatMoney(-0)).toBe("0 ₫")
    expect(formatMoney(-0.4)).toBe("0 ₫")
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

describe("pastedMoneyDigits", () => {
  it("drops a Vietnamese decimal part (after the last comma) before keeping the digits", () => {
    expect(pastedMoneyDigits("1.500.000,00")).toBe("1500000")
    expect(pastedMoneyDigits("1.234.567,5 ₫")).toBe("1234567")
  })

  it("drops an English-style decimal part (after the last dot) too", () => {
    expect(pastedMoneyDigits("1,500,000.00")).toBe("1500000")
    expect(pastedMoneyDigits("1500000.5")).toBe("1500000")
  })

  it("treats a separator followed by exactly 3 digits as a thousands separator", () => {
    expect(pastedMoneyDigits("1.500.000")).toBe("1500000")
    expect(pastedMoneyDigits("20.000.000đ")).toBe("20000000")
    expect(pastedMoneyDigits("1,500")).toBe("1500")
  })

  it("returns an empty string when the text has no digits", () => {
    expect(pastedMoneyDigits("abc")).toBe("")
  })
})
