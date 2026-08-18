import { describe, it, expect } from "vitest"

import { formatMoney } from "../format"

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
