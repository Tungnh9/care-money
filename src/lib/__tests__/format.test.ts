import { describe, it, expect } from "vitest"

import { formatMoney, formatMoneyCompact, groupVN, pastedMoneyDigits } from "../format"

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

describe("formatMoneyCompact", () => {
  it("writes the owner's examples", () => {
    expect(formatMoneyCompact(8_000)).toBe("8k")
    expect(formatMoneyCompact(50_000)).toBe("50xu")
    expect(formatMoneyCompact(500_000)).toBe("500k")
    expect(formatMoneyCompact(1_500_000)).toBe("1,5tr")
    expect(formatMoneyCompact(5_000_000)).toBe("5tr")
    expect(formatMoneyCompact(2_000_000_000)).toBe("2 tỷ")
  })

  it("uses 'xu' for tens of thousands, as the owner chose (not 'k')", () => {
    expect(formatMoneyCompact(10_000)).toBe("10xu")
    expect(formatMoneyCompact(20_000)).toBe("20xu")
    expect(formatMoneyCompact(99_999)).toBe("99xu")
  })

  it("cuts down at every band edge instead of carrying into the next unit", () => {
    expect(formatMoneyCompact(1_000)).toBe("1k")
    expect(formatMoneyCompact(9_999)).toBe("9,9k")
    expect(formatMoneyCompact(100_000)).toBe("100k")
    expect(formatMoneyCompact(999_999)).toBe("999k")
    expect(formatMoneyCompact(1_000_000)).toBe("1tr")
    expect(formatMoneyCompact(999_999_999)).toBe("999,9tr")
    expect(formatMoneyCompact(1_000_000_000)).toBe("1 tỷ")
  })

  it("keeps at most one decimal, with a comma, and drops ',0'", () => {
    expect(formatMoneyCompact(1_500)).toBe("1,5k")
    expect(formatMoneyCompact(12_500)).toBe("12xu")
    expect(formatMoneyCompact(123_456)).toBe("123k")
    expect(formatMoneyCompact(1_050_000)).toBe("1tr")
    expect(formatMoneyCompact(1_990_000)).toBe("1,9tr")
    expect(formatMoneyCompact(12_500_000)).toBe("12,5tr")
    expect(formatMoneyCompact(1_500_000_000)).toBe("1,5 tỷ")
    expect(formatMoneyCompact(1_234_567_000_000)).toBe("1.234,5 tỷ")
  })

  it("shows amounts under 1.000 in whole đồng", () => {
    expect(formatMoneyCompact(0)).toBe("0đ")
    expect(formatMoneyCompact(500)).toBe("500đ")
    expect(formatMoneyCompact(999)).toBe("999đ")
  })

  it("drops fractions of a đồng instead of rounding up", () => {
    expect(formatMoneyCompact(999.5)).toBe("999đ")
    expect(formatMoneyCompact(9_999.6)).toBe("9,9k")
    expect(formatMoneyCompact(99_999.5)).toBe("99xu")
    expect(formatMoneyCompact(150_000.5)).toBe("150k")
  })

  it("puts '-' in front of a negative balance but never prints '-0'", () => {
    expect(formatMoneyCompact(-8_000)).toBe("-8k")
    expect(formatMoneyCompact(-1_500_000)).toBe("-1,5tr")
    expect(formatMoneyCompact(-500)).toBe("-500đ")
    expect(formatMoneyCompact(-0)).toBe("0đ")
    expect(formatMoneyCompact(-0.4)).toBe("0đ")
  })

  it("treats NaN as 0", () => {
    expect(formatMoneyCompact(Number.NaN)).toBe("0đ")
  })

  it("masks the amount and its unit while money is hidden", () => {
    expect(formatMoneyCompact(50_000, true)).toBe("•••")
    expect(formatMoneyCompact(2_000_000_000, true)).toBe("•••")
  })
})
