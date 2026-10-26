import { describe, it, expect } from "vitest"

import { phanToChi, summarizeFinance } from "@/lib/finance/finance-calculations"
import {
  earliestTakeoutDate,
  takenOutByPurchase,
  takeoutsInMonth,
  heldQuantityOf,
  metalMarketPrice,
  metalPLTone,
  metalPurchaseLabels,
  metalPurchasePL,
  metalSalePL,
  metalStorePrice,
  normalizePurchaseDate,
  parseMetalPrice,
  parsePurchaseDate,
  parseWholeQuantity,
  purchaseDateToDayKey,
  sortByPurchaseDate,
  summarizeMetalByStore,
  summarizeMetalHolding,
  toPurchaseDate,
  unpricedMetalStores,
} from "@/lib/finance/metal-calculations"
import type { GoldPurchase, MetalGift } from "@/lib/finance/types"
import { DEFAULT_FINANCE_STATE, type FinanceState } from "@/lib/finance/finance-storage"

describe("parseMetalPrice", () => {
  it("strips thousands separators and parses to a number", () => {
    expect(parseMetalPrice("935.000")).toBe(935000)
  })

  it("returns 0 for an empty string", () => {
    expect(parseMetalPrice("")).toBe(0)
  })
})

describe("metalStorePrice", () => {
  it("returns the parsed price of the matching store", () => {
    const stores = [
      { name: "SJC", price: "1.000.000" },
      { name: "PNJ", price: "800.000" },
    ]
    expect(metalStorePrice(stores, "PNJ")).toBe(800_000)
  })

  it("returns 0 when no store matches the given name", () => {
    expect(metalStorePrice([{ name: "SJC", price: "1.000.000" }], "DOJI")).toBe(0)
  })
})

describe("metalPurchasePL", () => {
  it("returns a positive number equal to phan*(price-buy) when the market price is above buy price", () => {
    const purchase = { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" }
    const pl = metalPurchasePL(purchase.phan, purchase.buy, 950_000)

    expect(pl).toBe(10 * (950_000 - 900_000))
    expect(pl).toBeGreaterThan(0)
  })

  it("returns a negative number when the market price is below buy price", () => {
    const purchase = { id: 2, date: "02/01/2026", phan: 10, buy: 950_000, store: "SJC" }
    const pl = metalPurchasePL(purchase.phan, purchase.buy, 900_000)

    expect(pl).toBe(10 * (900_000 - 950_000))
    expect(pl).toBeLessThan(0)
  })

  it("returns exactly 0 when the market price equals the buy price", () => {
    const purchase = { id: 3, date: "03/01/2026", phan: 10, buy: 900_000, store: "SJC" }

    expect(metalPurchasePL(purchase.phan, purchase.buy, 900_000)).toBe(0)
  })
})

describe("parsePurchaseDate", () => {
  it("parses a dd/mm/yyyy string into an ascending-comparable timestamp", () => {
    expect(parsePurchaseDate("10/08/2026")).toBeLessThan(parsePurchaseDate("11/08/2026"))
    expect(parsePurchaseDate("31/12/2025")).toBeLessThan(parsePurchaseDate("01/01/2026"))
  })

  it("falls back to 0 for an empty or malformed date string", () => {
    expect(parsePurchaseDate("")).toBe(0)
    expect(parsePurchaseDate("not-a-date")).toBe(0)
  })

  it("sorts other ways of writing the same day exactly like dd/mm/yyyy", () => {
    const expected = parsePurchaseDate("10/08/2026")
    expect(parsePurchaseDate("10-08-2026")).toBe(expected)
    expect(parsePurchaseDate("10.08.2026")).toBe(expected)
    expect(parsePurchaseDate("2026-08-10")).toBe(expected)
  })

  it("does not turn a 2-digit year into the 1900s or roll 31/02 over into March", () => {
    expect(parsePurchaseDate("10/08/26")).toBe(0)
    expect(parsePurchaseDate("31/02/2026")).toBe(0)
  })
})

describe("sortByPurchaseDate", () => {
  it("sorts purchases from the latest date to the earliest, regardless of input order", () => {
    const gold = [
      { id: 1, date: "03/06/2026", phan: 5, buy: 1_436_000, store: "SJC" },
      { id: 2, date: "05/05/2026", phan: 2, buy: 1_649_000, store: "SJC" },
      { id: 3, date: "28/07/2026", phan: 5, buy: 1_420_000, store: "SJC" },
    ]

    expect(sortByPurchaseDate(gold).map((p) => p.id)).toEqual([3, 1, 2])
  })

  it("does not mutate the original array", () => {
    const gold = [
      { id: 1, date: "28/07/2026", phan: 5, buy: 1_420_000, store: "SJC" },
      { id: 2, date: "05/05/2026", phan: 2, buy: 1_649_000, store: "SJC" },
    ]
    const original = [...gold]

    sortByPurchaseDate(gold)

    expect(gold).toEqual(original)
  })
})

describe("summarizeMetalByStore", () => {
  it("returns an empty array when there are no purchases", () => {
    expect(summarizeMetalByStore([], [], (p: GoldPurchase) => p.phan)).toEqual([])
  })

  it("groups multiple purchases from the same store into one row", () => {
    const gold = [
      { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" },
      { id: 2, date: "02/01/2026", phan: 5, buy: 950_000, store: "SJC" },
    ]
    const stores = [{ name: "SJC", price: "1.000.000" }]

    const result = summarizeMetalByStore(gold, stores, (p) => p.phan)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      store: "SJC",
      qty: 15,
      avgBuy: Math.round((10 * 900_000 + 5 * 950_000) / 15),
      cost: 10 * 900_000 + 5 * 950_000,
      value: 15 * 1_000_000,
      pl: 15 * 1_000_000 - (10 * 900_000 + 5 * 950_000),
    })
  })

  it("keeps purchases from different stores as separate rows, sorted alphabetically by store name", () => {
    const gold = [
      { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" },
      { id: 2, date: "02/01/2026", phan: 8, buy: 900_000, store: "PNJ" },
    ]
    const stores = [
      { name: "SJC", price: "1.000.000" },
      { name: "PNJ", price: "800.000" },
    ]

    const result = summarizeMetalByStore(gold, stores, (p) => p.phan)

    expect(result.map((s) => s.store)).toEqual(["PNJ", "SJC"])
    expect(result.find((s) => s.store === "PNJ")).toMatchObject({ qty: 8, cost: 7_200_000, value: 6_400_000 })
    expect(result.find((s) => s.store === "SJC")).toMatchObject({ qty: 10, cost: 9_000_000, value: 10_000_000 })
  })

  it("sums to the same totals summarizeFinance computes from the same gold/store data", () => {
    const state: FinanceState = {
      ...DEFAULT_FINANCE_STATE,
      gold: [
        { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" },
        { id: 2, date: "02/01/2026", phan: 5, buy: 920_000, store: "SJC" },
        { id: 3, date: "03/01/2026", phan: 8, buy: 900_000, store: "PNJ" },
      ],
      goldStores: [
        { name: "SJC", price: "950.000" },
        { name: "PNJ", price: "880.000" },
      ],
    }

    const summary = summarizeFinance(state)
    const byStore = summarizeMetalByStore(state.gold, state.goldStores, (p) => p.phan)

    expect(byStore.reduce((sum, s) => sum + s.qty, 0)).toBe(summary.goldPhan)
    expect(byStore.reduce((sum, s) => sum + s.cost, 0)).toBe(summary.goldCost)
    expect(byStore.reduce((sum, s) => sum + s.value, 0)).toBe(summary.goldValue)
    expect(byStore.reduce((sum, s) => sum + s.pl, 0)).toBe(summary.goldPL)
  })
})

describe("metalMarketPrice", () => {
  const purchase = { id: 1, date: "10/08/2026", phan: 10, buy: 8_000_000, store: "SJC" }

  it("uses the store's price today when it has one", () => {
    expect(metalMarketPrice([{ name: "SJC", price: "8.500.000" }], purchase)).toBe(8_500_000)
  })

  it("falls back to the purchase's own buy price while the store has no price yet", () => {
    expect(metalMarketPrice([{ name: "SJC", price: "" }], purchase)).toBe(8_000_000)
  })

  it("falls back to the buy price when the store no longer exists", () => {
    expect(metalMarketPrice([], purchase)).toBe(8_000_000)
  })
})

describe("unpricedMetalStores", () => {
  it("lists each store without a price once, and only stores that hold gold", () => {
    const gold = [
      { id: 1, date: "01/08/2026", phan: 10, buy: 8_000_000, store: "SJC" },
      { id: 2, date: "02/08/2026", phan: 5, buy: 8_100_000, store: "SJC" },
      { id: 3, date: "03/08/2026", phan: 5, buy: 8_000_000, store: "PNJ" },
    ]
    const stores = [
      { name: "SJC", price: "" },
      { name: "PNJ", price: "8.200.000" },
      { name: "DOJI", price: "" },
    ]

    expect(unpricedMetalStores(gold, stores)).toEqual(["SJC"])
  })
})

describe("normalizePurchaseDate", () => {
  it("keeps a dd/mm/yyyy date as is", () => {
    expect(normalizePurchaseDate("10/08/2026")).toBe("10/08/2026")
  })

  it("accepts 1-digit day/month and '-' or '.' separators, trims spaces and pads to dd/mm/yyyy", () => {
    expect(normalizePurchaseDate("1/8/2026")).toBe("01/08/2026")
    expect(normalizePurchaseDate("10-08-2026")).toBe("10/08/2026")
    expect(normalizePurchaseDate(" 10.08.2026 ")).toBe("10/08/2026")
  })

  it("accepts an ISO yyyy-mm-dd date", () => {
    expect(normalizePurchaseDate("2026-08-10")).toBe("10/08/2026")
  })

  it("rejects a 2-digit year, a day that does not exist, mixed separators and free text", () => {
    expect(normalizePurchaseDate("10/08/26")).toBeNull()
    expect(normalizePurchaseDate("31/02/2026")).toBeNull()
    expect(normalizePurchaseDate("10/08-2026")).toBeNull()
    expect(normalizePurchaseDate("hôm qua")).toBeNull()
    expect(normalizePurchaseDate("")).toBeNull()
  })
})

describe("metalPLTone", () => {
  it("treats a P/L that rounds to 0 đ as break-even, not gain or loss", () => {
    expect(metalPLTone(0)).toBe("even")
    expect(metalPLTone(0.3)).toBe("even")
    expect(metalPLTone(-0.4)).toBe("even")
    expect(metalPLTone(1)).toBe("gain")
    expect(metalPLTone(-1)).toBe("loss")
  })
})

describe("metalPurchaseLabels", () => {
  const purchase = (id: number, date: string, store: string, phan: number): GoldPurchase => ({
    id,
    date,
    store,
    phan,
    buy: 9_000_000,
  })

  const goldLabels = (gold: GoldPurchase[]) => metalPurchaseLabels(gold, (p) => phanToChi(p.phan))

  it("uses just the date when no other purchase shares it", () => {
    const labels = goldLabels([purchase(1, "01/02/2026", "SJC", 10)])

    expect(labels.get(1)).toBe("01/02/2026")
  })

  it("adds store and weight for purchases on the same date, and a counter for exact repeats", () => {
    const labels = goldLabels([
      purchase(1, "01/02/2026", "SJC", 10),
      purchase(2, "01/02/2026", "PNJ", 10),
      purchase(3, "01/02/2026", "SJC", 10),
    ])

    expect(labels.get(1)).toBe(`01/02/2026 · SJC · ${phanToChi(10)}`)
    expect(labels.get(2)).toBe(`01/02/2026 · PNJ · ${phanToChi(10)}`)
    expect(labels.get(3)).toBe(`01/02/2026 · SJC · ${phanToChi(10)} (lần 2)`)
    expect(new Set(labels.values()).size).toBe(3)
  })
})

describe("summarizeMetalHolding", () => {
  const stores = [
    { name: "SJC", price: "950.000" },
    { name: "PNJ", price: "" },
  ]
  // Lần mua ở PNJ (chưa có giá hôm nay) được tính theo giá mua của chính nó.
  const gold: GoldPurchase[] = [
    { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" },
    { id: 2, date: "02/01/2026", phan: 5, buy: 920_000, store: "SJC" },
    { id: 3, date: "03/01/2026", phan: 8, buy: 900_000, store: "PNJ" },
  ]

  it("returns zeros, with no division by zero, when nothing is held", () => {
    expect(summarizeMetalHolding([], stores, (p: GoldPurchase) => p.phan)).toEqual({
      qty: 0,
      cost: 0,
      value: 0,
      pl: 0,
      pct: 0,
    })
  })

  it("adds up quantity, cost and value at each purchase's own store price", () => {
    expect(summarizeMetalHolding(gold, stores, (p) => p.phan)).toEqual({
      qty: 23,
      cost: 10 * 900_000 + 5 * 920_000 + 8 * 900_000,
      value: 15 * 950_000 + 8 * 900_000,
      pl: 15 * 950_000 + 8 * 900_000 - (10 * 900_000 + 5 * 920_000 + 8 * 900_000),
      pct: ((15 * 950_000 - 10 * 900_000 - 5 * 920_000) / (10 * 900_000 + 5 * 920_000 + 8 * 900_000)) * 100,
    })
  })

  it("reads the quantity through the accessor, whatever the metal's field is called", () => {
    const lots = [{ id: 1, date: "01/01/2026", luong: 2, buy: 1_800_000, store: "Phú Quý" }]
    const holding = summarizeMetalHolding(lots, [{ name: "Phú Quý", price: "2.000.000" }], (p) => p.luong)

    expect(holding).toEqual({
      qty: 2,
      cost: 3_600_000,
      value: 4_000_000,
      pl: 400_000,
      pct: (400_000 / 3_600_000) * 100,
    })
  })

  it("gives bit-for-bit the gold figures of the three separate reduces it replaced, fractional phân included", () => {
    const fractional: GoldPurchase[] = [
      { id: 1, date: "01/01/2026", phan: 0.1, buy: 912_345, store: "SJC" },
      { id: 2, date: "02/01/2026", phan: 0.2, buy: 933_333, store: "SJC" },
      { id: 3, date: "03/01/2026", phan: 12.3, buy: 901_111, store: "PNJ" },
    ]
    // Đúng công thức summarizeFinance dùng trước khi gom về summarizeMetalHolding.
    const phan = fractional.reduce((sum, p) => sum + p.phan, 0)
    const cost = fractional.reduce((sum, p) => sum + p.phan * p.buy, 0)
    const value = fractional.reduce((sum, p) => sum + p.phan * metalMarketPrice(stores, p), 0)
    const pl = value - cost
    const pct = (pl / cost) * 100

    expect(summarizeMetalHolding(fractional, stores, (p) => p.phan)).toEqual({ qty: phan, cost, value, pl, pct })
    const summary = summarizeFinance({ ...DEFAULT_FINANCE_STATE, gold: fractional, goldStores: stores })
    expect([summary.goldPhan, summary.goldCost, summary.goldValue, summary.goldPL, summary.goldPct]).toEqual([
      phan,
      cost,
      value,
      pl,
      pct,
    ])
  })
})

describe("parseWholeQuantity", () => {
  it("accepts a positive whole number, spaces around it included", () => {
    expect(parseWholeQuantity("10")).toBe(10)
    expect(parseWholeQuantity(" 3 ")).toBe(3)
  })

  it("rejects zero, negatives, decimals with either separator, free text and an empty box", () => {
    for (const text of ["0", "-3", "12.3", "1,5", "abc", "", "  "]) {
      expect(parseWholeQuantity(text), text).toBeNull()
    }
  })

  it("rejects a number too large to store, which JSON would save as null", () => {
    expect(parseWholeQuantity("1e400")).toBeNull()
  })
})

describe("takenOutByPurchase", () => {
  it("adds up the quantity given away from each purchase", () => {
    const gifted = takenOutByPurchase([
      { purchaseId: 1, qty: 1 },
      { purchaseId: 2, qty: 3 },
      { purchaseId: 1, qty: 2 },
    ])

    expect(gifted.get(1)).toBe(3)
    expect(gifted.get(2)).toBe(3)
    expect(gifted.has(3)).toBe(false)
  })
})

describe("heldQuantityOf", () => {
  it("subtracts what was given away from each purchase, and leaves the others as bought", () => {
    const held = heldQuantityOf((p: GoldPurchase) => p.phan, [{ purchaseId: 1, qty: 1 }])

    expect(held({ id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" })).toBe(9)
    expect(held({ id: 2, date: "11/08/2026", phan: 5, buy: 900_000, store: "SJC" })).toBe(5)
  })
})

describe("purchaseDateToDayKey", () => {
  it("turns a typed purchase date into a day key", () => {
    expect(purchaseDateToDayKey("10/08/2026")).toBe("2026-08-10")
    expect(purchaseDateToDayKey("1/8/2026")).toBe("2026-08-01")
  })

  it("returns null for a date that does not exist or cannot be read", () => {
    expect(purchaseDateToDayKey("31/02/2026")).toBeNull()
    expect(purchaseDateToDayKey("abc")).toBeNull()
  })
})

describe("toPurchaseDate", () => {
  it("writes a local date the way purchase dates are typed", () => {
    expect(toPurchaseDate(new Date(2026, 7, 1))).toBe("01/08/2026")
    expect(toPurchaseDate(new Date(2026, 11, 25, 23, 59))).toBe("25/12/2026")
  })
})

describe("takeoutsInMonth", () => {
  const gift = (id: number, date: string): MetalGift => ({
    id,
    purchaseId: 1,
    date,
    qty: 1,
    store: "SJC",
    buy: 900_000,
  })

  it("keeps the gifts dated in the month, newest first, and skips dates it cannot read", () => {
    const gifts = [
      gift(1, "02/09/2026"),
      gift(2, "15/09/2026"),
      gift(3, "31/08/2026"),
      gift(4, "abc"),
      gift(5, "02/09/2026"),
    ]

    expect(takeoutsInMonth(gifts, "2026-09")).toEqual([
      { ...gift(2, "15/09/2026"), dayKey: "2026-09-15" },
      { ...gift(5, "02/09/2026"), dayKey: "2026-09-02" },
      { ...gift(1, "02/09/2026"), dayKey: "2026-09-02" },
    ])
  })
})

describe("normalizePurchaseDate — năm", () => {
  it("rejects a year before 1000 instead of writing it back unpadded", () => {
    expect(normalizePurchaseDate("01/01/0999")).toBeNull()
    expect(normalizePurchaseDate("0100-01-01")).toBeNull()
    expect(normalizePurchaseDate("01/01/1000")).toBe("01/01/1000")
  })
})

describe("metalSalePL", () => {
  it("is what was received minus what that quantity cost at its purchase price", () => {
    expect(metalSalePL({ qty: 2, buy: 900_000, received: 1_900_000 })).toBe(100_000)
    expect(metalSalePL({ qty: 2, buy: 900_000, received: 1_700_000 })).toBe(-100_000)
  })
})

describe("earliestTakeoutDate", () => {
  it("takes the earliest date among a purchase's gifts and sales, ignoring other purchases and unreadable dates", () => {
    const takeouts = [
      { purchaseId: 1, date: "12/10/2026" },
      { purchaseId: 1, date: "05/10/2026" },
      { purchaseId: 2, date: "01/10/2026" },
      { purchaseId: 1, date: "abc" },
    ]

    expect(earliestTakeoutDate(takeouts, 1)).toBe("05/10/2026")
    expect(earliestTakeoutDate(takeouts, 3)).toBeNull()
  })
})

describe("takeoutsInMonth — lần bán", () => {
  it("keeps sales dated in the month, newest first", () => {
    const sale = (id: number, date: string) => ({ id, date, qty: 1, received: 900_000 })

    expect(takeoutsInMonth([sale(1, "02/09/2026"), sale(2, "31/08/2026"), sale(3, "20/09/2026")], "2026-09")).toEqual([
      { ...sale(3, "20/09/2026"), dayKey: "2026-09-20" },
      { ...sale(1, "02/09/2026"), dayKey: "2026-09-02" },
    ])
  })
})
