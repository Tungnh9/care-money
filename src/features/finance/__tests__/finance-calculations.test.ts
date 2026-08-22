import { describe, it, expect } from "vitest"

import {
  phanToChi,
  pct1,
  parseGoldPrice,
  summarizeFinance,
  goldPurchasePL,
} from "../finance-calculations"
import { DEFAULT_FINANCE_STATE, type FinanceState } from "../finance-storage"

describe("phanToChi", () => {
  it("formats an exact multiple of 10 phân as whole chỉ", () => {
    expect(phanToChi(60)).toBe("6 chỉ")
  })

  it("includes the remaining phân when not an exact multiple of 10", () => {
    expect(phanToChi(63)).toBe("6 chỉ 3 phân")
  })

  it("shows only phân, with no leading 0 chỉ, when under 1 chỉ", () => {
    expect(phanToChi(7)).toBe("7 phân")
  })
})

describe("pct1", () => {
  it("formats a positive number with a leading plus and comma decimal", () => {
    expect(pct1(12.34)).toBe("+12,3%")
  })

  it("formats a negative number with a minus sign and no double sign", () => {
    expect(pct1(-4.06)).toBe("−4,1%")
  })

  it("formats zero as positive", () => {
    expect(pct1(0)).toBe("+0,0%")
  })
})

describe("parseGoldPrice", () => {
  it("strips thousands separators and parses to a number", () => {
    expect(parseGoldPrice("935.000")).toBe(935000)
  })

  it("returns 0 for an empty string", () => {
    expect(parseGoldPrice("")).toBe(0)
  })
})

describe("summarizeFinance", () => {
  it("returns all zeros when there is no data yet", () => {
    const summary = summarizeFinance(DEFAULT_FINANCE_STATE)

    expect(summary).toEqual({
      savingsTotal: 0,
      debtTotal: 0,
      goldPhan: 0,
      goldCost: 0,
      goldValue: 0,
      goldPL: 0,
      goldPct: 0,
      investCost: 0,
      investValue: 0,
      investPL: 0,
      investPct: 0,
      net: 0,
      netPct: 0,
    })
  })

  it("sums savings and debt across multiple entries", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      savings: [
        { name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 },
        { name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000 },
      ],
      cards: [{ name: "Thẻ A", balance: 1_500_000, min: 200_000, limit: 10_000_000, due: "15" }],
    }

    const summary = summarizeFinance(state)
    expect(summary.savingsTotal).toBe(7_000_000)
    expect(summary.debtTotal).toBe(1_500_000)
    expect(summary.net).toBe(5_500_000)
  })

  it("computes gold P&L from cost basis vs. current market price", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      gold: [
        { id: 1, date: "01/01/2026", phan: 20, buy: 900_000 },
        { id: 2, date: "02/01/2026", phan: 10, buy: 950_000 },
      ],
      goldPrice: "1.000.000",
    }

    const summary = summarizeFinance(state)
    expect(summary.goldPhan).toBe(30)
    expect(summary.goldCost).toBe(20 * 900_000 + 10 * 950_000)
    expect(summary.goldValue).toBe(30 * 1_000_000)
    expect(summary.goldPL).toBe(summary.goldValue - summary.goldCost)
    expect(summary.goldPct).toBeCloseTo((summary.goldPL / summary.goldCost) * 100)
  })

  it("computes investment P&L and rolls everything into net worth", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 }],
      cards: [{ name: "Thẻ A", balance: 1_000_000, min: 100_000, limit: 5_000_000, due: "10" }],
      gold: [{ id: 1, date: "01/01/2026", phan: 10, buy: 900_000 }],
      goldPrice: "950.000",
      invests: [{ id: 1, name: "Quỹ cổ phiếu", cost: 10_000_000, value: 12_000_000 }],
    }

    const summary = summarizeFinance(state)
    expect(summary.investCost).toBe(10_000_000)
    expect(summary.investValue).toBe(12_000_000)
    expect(summary.investPL).toBe(2_000_000)
    expect(summary.investPct).toBeCloseTo(20)
    expect(summary.net).toBe(
      5_000_000 + 10 * 950_000 + 12_000_000 - 1_000_000
    )
    expect(summary.netPct).toBeCloseTo(
      ((summary.goldPL + summary.investPL) / (summary.goldCost + summary.investCost)) * 100
    )
  })
})

describe("goldPurchasePL", () => {
  it("returns a positive number equal to phan*(price-buy) when the market price is above buy price", () => {
    const purchase = { id: 1, date: "01/01/2026", phan: 10, buy: 900_000 }
    const pl = goldPurchasePL(purchase, 950_000)

    expect(pl).toBe(10 * (950_000 - 900_000))
    expect(pl).toBeGreaterThan(0)
  })

  it("returns a negative number when the market price is below buy price", () => {
    const purchase = { id: 2, date: "02/01/2026", phan: 10, buy: 950_000 }
    const pl = goldPurchasePL(purchase, 900_000)

    expect(pl).toBe(10 * (900_000 - 950_000))
    expect(pl).toBeLessThan(0)
  })

  it("returns exactly 0 when the market price equals the buy price", () => {
    const purchase = { id: 3, date: "03/01/2026", phan: 10, buy: 900_000 }

    expect(goldPurchasePL(purchase, 900_000)).toBe(0)
  })
})
