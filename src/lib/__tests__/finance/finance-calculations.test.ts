import { describe, it, expect } from "vitest"

import {
  phanToChi,
  formatPhan,
  pct1,
  summarizeFinance,
  parseDueDay,
  nearestDueCard,
  goldReferencePricePerPhan,
} from "@/lib/finance/finance-calculations"
import { DEFAULT_FINANCE_STATE, type FinanceState } from "@/lib/finance/finance-storage"

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

  it("rounds a fractional phân left over from old data to 1 decimal with a comma, not floating-point noise", () => {
    expect(phanToChi(12.3)).toBe("1 chỉ 2,3 phân")
    expect(phanToChi(0.1 + 0.2)).toBe("0,3 phân")
  })

  it("carries a value that rounds up to 10 phân into a whole chỉ", () => {
    expect(phanToChi(9.96)).toBe("1 chỉ")
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

  it("computes gold P&L from cost basis vs. each purchase's own store price", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      gold: [
        { id: 1, date: "01/01/2026", phan: 20, buy: 900_000, store: "SJC" },
        { id: 2, date: "02/01/2026", phan: 10, buy: 950_000, store: "SJC" },
      ],
      goldStores: [{ name: "SJC", price: "1.000.000" }],
    }

    const summary = summarizeFinance(state)
    expect(summary.goldPhan).toBe(30)
    expect(summary.goldCost).toBe(20 * 900_000 + 10 * 950_000)
    expect(summary.goldValue).toBe(30 * 1_000_000)
    expect(summary.goldPL).toBe(summary.goldValue - summary.goldCost)
    expect(summary.goldPct).toBeCloseTo((summary.goldPL / summary.goldCost) * 100)
  })

  it("values each purchase against its OWN store's price, not one price for everyone", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      gold: [
        { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" },
        { id: 2, date: "02/01/2026", phan: 10, buy: 900_000, store: "PNJ" },
      ],
      goldStores: [
        { name: "SJC", price: "1.000.000" },
        { name: "PNJ", price: "800.000" },
      ],
    }

    const summary = summarizeFinance(state)
    // SJC: 10*1.000.000 = 10.000.000 | PNJ: 10*800.000 = 8.000.000 -> tổng 18.000.000,
    // KHÔNG PHẢI 20 phân * 1 giá chung nào cả.
    expect(summary.goldValue).toBe(10_000_000 + 8_000_000)
    expect(summary.goldCost).toBe(9_000_000 + 9_000_000)
    expect(summary.goldPL).toBe(18_000_000 - 18_000_000)
  })

  it("computes investment P&L and rolls everything into net worth", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 }],
      cards: [{ name: "Thẻ A", balance: 1_000_000, min: 100_000, limit: 5_000_000, due: "10" }],
      gold: [{ id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" }],
      goldStores: [{ name: "SJC", price: "950.000" }],
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

describe("goldReferencePricePerPhan", () => {
  const STORES = [
    { name: "SJC", price: "1.000.000" },
    { name: "PNJ", price: "800.000" },
    { name: "DOJI", price: "" },
  ]

  it("uses the holdings-weighted price while some gold is held", () => {
    expect(goldReferencePricePerPhan({ goldPhan: 20, goldValue: 19_000_000 }, STORES)).toBe(950_000)
  })

  it("falls back to the average price of the stores that have one when no gold is held yet", () => {
    expect(goldReferencePricePerPhan({ goldPhan: 0, goldValue: 0 }, STORES)).toBe(900_000)
  })

  it("returns 0 when no gold is held and no store has a price", () => {
    expect(goldReferencePricePerPhan({ goldPhan: 0, goldValue: 0 }, [{ name: "DOJI", price: "" }])).toBe(0)
    expect(goldReferencePricePerPhan({ goldPhan: 0, goldValue: 0 }, [])).toBe(0)
  })
})

describe("summarizeFinance — cửa hàng chưa nhập giá", () => {
  it("values gold from a store without a price at cost, so net worth does not drop by the whole holding", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      gold: [{ id: 1, date: "10/08/2026", phan: 10, buy: 8_000_000, store: "SJC" }],
      goldStores: [{ name: "SJC", price: "" }],
    }

    const summary = summarizeFinance(state)

    expect(summary.goldValue).toBe(80_000_000)
    expect(summary.goldPL).toBe(0)
    expect(summary.goldPct).toBe(0)
    expect(summary.net).toBe(80_000_000)
  })
})

describe("formatPhan", () => {
  it("prints whole phân as is and rounds a fractional one to 1 decimal with a comma", () => {
    expect(formatPhan(30)).toBe("30")
    expect(formatPhan(0.1 + 0.2)).toBe("0,3")
    expect(formatPhan(12.34)).toBe("12,3")
  })
})

describe("parseDueDay", () => {
  it("reads the day of the month from the usual ways of writing a due date", () => {
    expect(parseDueDay("15")).toBe(15)
    expect(parseDueDay("15 hàng tháng")).toBe(15)
    expect(parseDueDay("05/10")).toBe(5)
    expect(parseDueDay("ngày 25")).toBe(25)
  })

  it("returns null when the first number is not a day of the month, or there is none", () => {
    expect(parseDueDay("0")).toBeNull()
    expect(parseDueDay("45")).toBeNull()
    expect(parseDueDay("cuối tháng")).toBeNull()
  })
})

describe("nearestDueCard", () => {
  // 30/09/2026
  const TODAY = new Date(2026, 8, 30)

  function card(name: string, due: string, balance: number) {
    return { name, balance, min: 0, limit: 10_000_000, due }
  }

  it("picks the card whose next due date comes first, not the first card added", () => {
    const cards = [card("Thẻ A", "25/10", 1_000_000), card("Thẻ B", "05/10", 2_000_000)]

    // A: ngày 25 đã qua trong tháng 9 → 25/10 (25 ngày nữa); B: ngày 5 → 05/10 (5 ngày nữa).
    expect(nearestDueCard(cards, TODAY)?.name).toBe("Thẻ B")
  })

  it("ignores cards that are already paid off, and returns null when none still owes", () => {
    const paid = card("Thẻ C", "01", 0)
    const owing = card("Thẻ A", "25", 1_000_000)

    expect(nearestDueCard([paid, owing], TODAY)?.name).toBe("Thẻ A")
    expect(nearestDueCard([paid], TODAY)).toBeNull()
    expect(nearestDueCard([], TODAY)).toBeNull()
  })

  it("puts a card whose due date cannot be read after every readable one", () => {
    const cards = [card("Thẻ không rõ", "cuối tháng", 1_000_000), card("Thẻ rõ", "28", 1_000_000)]

    expect(nearestDueCard(cards, TODAY)?.name).toBe("Thẻ rõ")
    expect(nearestDueCard([cards[0]], TODAY)?.name).toBe("Thẻ không rõ")
  })

  it("moves a due day that a short month does not have to that month's last day", () => {
    // 27/02/2026: hạn "31" rơi vào 28/02 (1 ngày nữa), sớm hơn hạn "5" (05/03, 6 ngày nữa).
    const cards = [card("Hạn 5", "5", 1_000_000), card("Hạn 31", "31", 1_000_000)]

    expect(nearestDueCard(cards, new Date(2026, 1, 27))?.name).toBe("Hạn 31")
  })
})
