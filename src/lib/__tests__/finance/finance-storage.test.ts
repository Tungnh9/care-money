import { describe, it, expect, beforeEach } from "vitest"

import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  setStoredFinance,
  applySavingsFundDelta,
  applyCardBalanceDelta,
} from "@/lib/finance/finance-storage"
import type { CreditCard, MetalGift, MetalSale, SavingsFund, SilverPurchase, SilverStore } from "@/lib/finance/types"

describe("getStoredFinance", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("falls back to an empty array when a field holding a list is not an array at all", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, savings: "not an array" })
    )

    expect(getStoredFinance().savings).toEqual([])
  })

  it("keeps every field of a savings fund and a credit card through a stored round trip", () => {
    // Đọc trả về bản đã qua schema (field lạ bị bỏ) — field nào thiếu khỏi schema sẽ âm thầm rụng ở lần
    // ghi kế tiếp. Required<...>: thêm 1 field vào kiểu thì fixture này buộc phải đổi theo.
    const fund: Required<SavingsFund> = {
      name: "Quỹ khẩn cấp",
      amount: 5_000_000,
      target: 20_000_000,
      note: "Giữ đủ 6 tháng chi tiêu",
    }
    const card: Required<CreditCard> = {
      name: "Thẻ Visa",
      balance: 2_000_000,
      min: 200_000,
      limit: 15_000_000,
      due: "15",
      color: "#FF8A3D",
    }
    const state = { ...DEFAULT_FINANCE_STATE, savings: [fund], cards: [card] }

    setStoredFinance(state)

    expect(getStoredFinance()).toEqual(state)
  })

  it("drops only the malformed element of a list field, keeping its valid siblings", () => {
    const validCard = { name: "Thẻ tốt", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "15" }
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, cards: [{ name: "Thẻ lỗi" }, validCard] })
    )

    expect(getStoredFinance().cards).toEqual([validCard])
  })

  it("keeps every other gold purchase when one was saved with a non-finite weight (stored as null)", () => {
    const good = { id: 1, date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" }
    const broken = { id: 2, date: "12/08/2026", phan: Infinity, buy: 910_000, store: "SJC" }
    // JSON.stringify ghi Infinity thành null — đúng thứ localStorage giữ lại sau khi gõ "1e400".
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, gold: [good, broken], goldStores: [{ name: "SJC", price: "" }] })
    )

    expect(getStoredFinance().gold).toEqual([good])
  })

  it("keeps a valid field untouched even when a sibling field is malformed", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        savings: [{ name: "Quỹ hợp lệ", amount: 1_000_000, target: 2_000_000 }],
        gold: "corrupted",
      })
    )

    const state = getStoredFinance()
    expect(state.savings).toEqual([{ name: "Quỹ hợp lệ", amount: 1_000_000, target: 2_000_000 }])
    expect(state.gold).toEqual([])
  })

  it("falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, "{not valid json")

    expect(getStoredFinance()).toEqual(DEFAULT_FINANCE_STATE)
  })

  it("migrates a legacy single goldPrice + storeless purchases into one default store", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        savings: [],
        cards: [],
        gold: [
          { id: 1, date: "10/08/2026", phan: 20, buy: 900_000 },
          { id: 2, date: "12/08/2026", phan: 5, buy: 910_000 },
        ],
        goldPrice: "935.000",
        invests: [],
      })
    )

    const state = getStoredFinance()

    expect(state.goldStores).toEqual([{ name: "Chưa gắn cửa hàng", price: "935.000" }])
    expect(state.gold).toEqual([
      { id: 1, date: "10/08/2026", phan: 20, buy: 900_000, store: "Chưa gắn cửa hàng" },
      { id: 2, date: "12/08/2026", phan: 5, buy: 910_000, store: "Chưa gắn cửa hàng" },
    ])
  })

  it("leaves already-new-shape data untouched (does not re-migrate)", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        savings: [],
        cards: [],
        gold: [{ id: 1, date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" }],
        goldStores: [{ name: "SJC", price: "935.000" }],
        invests: [],
      })
    )

    const state = getStoredFinance()

    expect(state.goldStores).toEqual([{ name: "SJC", price: "935.000" }])
    expect(state.gold).toEqual([{ id: 1, date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" }])
  })

  it("stays empty (no synthetic store) when there is no legacy gold data at all", () => {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify({ savings: [], cards: [], invests: [] }))

    const state = getStoredFinance()

    expect(state.goldStores).toEqual([])
    expect(state.gold).toEqual([])
  })

  it("preserves the legacy price into a default store even when the purchase list itself is corrupted", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ savings: [], cards: [], gold: "corrupted", goldPrice: "935.000", invests: [] })
    )

    const state = getStoredFinance()

    expect(state.goldStores).toEqual([{ name: "Chưa gắn cửa hàng", price: "935.000" }])
    expect(state.gold).toEqual([])
  })
})

describe("applySavingsFundDelta", () => {
  beforeEach(() => {
    window.localStorage.clear()
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }],
    })
  })

  it("deposits and returns the correct before/after balance", () => {
    const result = applySavingsFundDelta("Quỹ A", "deposit", 50_000)

    expect(result).toEqual({ ok: true, before: 100_000, after: 150_000 })
    expect(getStoredFinance().savings[0].amount).toBe(150_000)
  })

  it("withdraws and decreases the balance", () => {
    const result = applySavingsFundDelta("Quỹ A", "withdraw", 40_000)

    expect(result).toEqual({ ok: true, before: 100_000, after: 60_000 })
    expect(getStoredFinance().savings[0].amount).toBe(60_000)
  })

  it("allows a withdraw exactly equal to the balance, zeroing the fund", () => {
    const result = applySavingsFundDelta("Quỹ A", "withdraw", 100_000)

    expect(result).toEqual({ ok: true, before: 100_000, after: 0 })
  })

  it("rejects a withdraw greater than the balance and leaves storage untouched", () => {
    const result = applySavingsFundDelta("Quỹ A", "withdraw", 200_000)

    expect(result).toEqual({ ok: false, reason: "insufficient-balance" })
    expect(getStoredFinance().savings[0].amount).toBe(100_000)
  })

  it("rejects an unknown fund name and leaves storage untouched", () => {
    const result = applySavingsFundDelta("Quỹ không tồn tại", "deposit", 10_000)

    expect(result).toEqual({ ok: false, reason: "fund-not-found" })
    expect(getStoredFinance().savings).toHaveLength(1)
  })

  it("always reads the current stored value, not a stale one", () => {
    // Mô phỏng 1 tab khác đã ghi đè quỹ trước khi lệnh này chạy.
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ A", amount: 9_000, target: 500_000 }],
    })

    const result = applySavingsFundDelta("Quỹ A", "deposit", 1_000)

    expect(result).toEqual({ ok: true, before: 9_000, after: 10_000 })
  })
})

describe("applyCardBalanceDelta", () => {
  const visa = { name: "Visa", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "15" }
  const master = { name: "Master", balance: 300_000, min: 50_000, limit: 5_000_000, due: "20" }

  beforeEach(() => {
    window.localStorage.clear()
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, cards: [visa, master] })
  })

  it("raises the debt and returns before/after", () => {
    const result = applyCardBalanceDelta("Visa", 500_000)

    expect(result).toEqual({ ok: true, before: 1_000_000, after: 1_500_000 })
    expect(getStoredFinance().cards[0].balance).toBe(1_500_000)
  })

  it("lowers the debt down to exactly zero", () => {
    const result = applyCardBalanceDelta("Visa", -1_000_000)

    expect(result).toEqual({ ok: true, before: 1_000_000, after: 0 })
    expect(getStoredFinance().cards[0].balance).toBe(0)
  })

  it("refuses to push the debt below zero and leaves storage untouched", () => {
    const result = applyCardBalanceDelta("Visa", -1_000_001)

    expect(result).toEqual({ ok: false, reason: "insufficient-debt", balance: 1_000_000 })
    expect(getStoredFinance().cards[0].balance).toBe(1_000_000)
  })

  it("refuses an unknown card and leaves storage untouched", () => {
    const result = applyCardBalanceDelta("Không có", 10_000)

    expect(result).toEqual({ ok: false, reason: "card-not-found" })
    expect(getStoredFinance().cards).toEqual([visa, master])
  })

  it("always reads the current stored value, not a stale one", () => {
    // Mô phỏng 1 tab khác đã ghi đè dư nợ trước khi lệnh này chạy.
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, cards: [{ ...visa, balance: 9_000 }] })

    const result = applyCardBalanceDelta("Visa", 1_000)

    expect(result).toEqual({ ok: true, before: 9_000, after: 10_000 })
  })

  it("touches only the named card", () => {
    applyCardBalanceDelta("Visa", 1_000)

    expect(getStoredFinance().cards).toEqual([{ ...visa, balance: 1_001_000 }, master])
  })

  it("refuses a delta that is not a finite number and leaves storage untouched", () => {
    // NaN ghi vào JSON thành null — lần đọc sau creditCardSchema bỏ luôn cả thẻ.
    for (const delta of [NaN, Infinity, -Infinity]) {
      expect(applyCardBalanceDelta("Visa", delta)).toEqual({ ok: false, reason: "invalid-delta" })
    }

    expect(getStoredFinance().cards).toEqual([visa, master])
  })

  it("lets a debt increase through on a card whose imported balance is already negative", () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, cards: [{ ...visa, balance: -500_000 }, master] })

    expect(applyCardBalanceDelta("Visa", 300_000)).toEqual({ ok: true, before: -500_000, after: -200_000 })
    expect(getStoredFinance().cards[0].balance).toBe(-200_000)
  })

  it("still refuses to lower a debt that is already negative", () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, cards: [{ ...visa, balance: -500_000 }, master] })

    expect(applyCardBalanceDelta("Visa", -1)).toEqual({ ok: false, reason: "insufficient-debt", balance: -500_000 })
    expect(getStoredFinance().cards[0].balance).toBe(-500_000)
  })
})

describe("parseFinanceState — tên quỹ/thẻ trùng đã lưu", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renames later savings funds and cards that share a name so each one can be edited on its own", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        savings: [
          { name: "Quỹ A", amount: 100, target: 1_000 },
          { name: "Quỹ A", amount: 5_000, target: 9_000 },
          { name: "Quỹ A (2)", amount: 7, target: 8 },
        ],
        cards: [
          { name: "Visa", balance: 1, min: 1, limit: 10, due: "5" },
          { name: "Visa", balance: 2, min: 2, limit: 20, due: "6" },
        ],
      })
    )

    const state = getStoredFinance()

    // Mục đầu giữ tên (là mục FundPicker/mục tiêu xe/tất toán vốn đang chọn); "Quỹ A (2)" đã có sẵn
    // nên bản trùng thứ 2 nhận "Quỹ A (3)". Không số dư nào bị mất.
    expect(state.savings.map((f) => [f.name, f.amount])).toEqual([
      ["Quỹ A", 100],
      ["Quỹ A (3)", 5_000],
      ["Quỹ A (2)", 7],
    ])
    expect(state.cards.map((c) => [c.name, c.balance])).toEqual([
      ["Visa", 1],
      ["Visa (2)", 2],
    ])
  })

  it("deposits a settlement into one fund only, even when the stored data had two funds with that name", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        savings: [
          { name: "Quỹ A", amount: 100, target: 1_000 },
          { name: "Quỹ A", amount: 5_000, target: 9_000 },
        ],
      })
    )

    const result = applySavingsFundDelta("Quỹ A", "deposit", 10)

    expect(result).toEqual({ ok: true, before: 100, after: 110 })
    expect(getStoredFinance().savings.map((f) => [f.name, f.amount])).toEqual([
      ["Quỹ A", 110],
      ["Quỹ A (2)", 5_000],
    ])
  })
})

describe("getStoredFinance — tích lũy bạc", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("keeps every field of a silver purchase and a silver store through a stored round trip", () => {
    const purchase: Required<SilverPurchase> = { id: 1, date: "10/08/2026", luong: 2, buy: 1_800_000, store: "Phú Quý" }
    const store: Required<SilverStore> = { name: "Phú Quý", price: "2.000.000" }
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, silver: [purchase], silverStores: [store] })

    expect(getStoredFinance().silver).toEqual([purchase])
    expect(getStoredFinance().silverStores).toEqual([store])
  })

  it("drops only the malformed silver purchase, keeping its valid siblings", () => {
    const valid = { id: 2, date: "11/08/2026", luong: 5, buy: 1_900_000, store: "Phú Quý" }
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, silver: [{ id: 1, date: "10/08/2026", luong: null }, valid] })
    )

    expect(getStoredFinance().silver).toEqual([valid])
  })

  it("reads no silver from data saved before silver existed, leaving gold as it was", () => {
    const gold = [{ id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }]
    const goldStores = [{ name: "SJC", price: "950.000" }]
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ savings: [], cards: [], gold, goldStores, invests: [] })
    )

    const stored = getStoredFinance()
    expect(stored.silver).toEqual([])
    expect(stored.silverStores).toEqual([])
    expect(stored.gold).toEqual(gold)
    expect(stored.goldStores).toEqual(goldStores)
  })

  it("leaves silver alone while migrating legacy gold data", () => {
    const silver = [{ id: 1, date: "10/08/2026", luong: 2, buy: 1_800_000, store: "Phú Quý" }]
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        goldPrice: "950.000",
        gold: [{ id: 1, date: "10/08/2026", phan: 10, buy: 900_000 }],
        silver,
        silverStores: [{ name: "Phú Quý", price: "2.000.000" }],
      })
    )

    const stored = getStoredFinance()
    expect(stored.goldStores).toEqual([{ name: "Chưa gắn cửa hàng", price: "950.000" }])
    expect(stored.silver).toEqual(silver)
    expect(stored.silverStores).toEqual([{ name: "Phú Quý", price: "2.000.000" }])
  })
})

describe("getStoredFinance — lần tặng vàng/bạc", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("keeps every field of a gold and a silver gift through a stored round trip", () => {
    const goldGift: Required<MetalGift> = {
      id: 1,
      purchaseId: 3,
      date: "12/10/2026",
      qty: 1,
      store: "SJC",
      buy: 900_000,
      note: "tặng mẹ",
    }
    const silverGift: Required<MetalGift> = {
      id: 1,
      purchaseId: 1,
      date: "13/10/2026",
      qty: 2,
      store: "Phú Quý",
      buy: 1_800_000,
      note: "tặng bạn",
    }
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, goldGifts: [goldGift], silverGifts: [silverGift] })

    expect(getStoredFinance().goldGifts).toEqual([goldGift])
    expect(getStoredFinance().silverGifts).toEqual([silverGift])
  })

  it("drops only the malformed gift, keeping its valid siblings", () => {
    const valid = { id: 2, purchaseId: 1, date: "12/10/2026", qty: 1, store: "SJC", buy: 900_000 }
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        goldGifts: [{ id: 1, purchaseId: 1, date: "11/10/2026", qty: null, store: "SJC", buy: 900_000 }, valid],
      })
    )

    expect(getStoredFinance().goldGifts).toEqual([valid])
  })

  it("reads no gifts from data saved before gifts existed", () => {
    const gold = [{ id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }]
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ savings: [], cards: [], gold, goldStores: [], silver: [], silverStores: [], invests: [] })
    )

    const stored = getStoredFinance()
    expect(stored.goldGifts).toEqual([])
    expect(stored.silverGifts).toEqual([])
    expect(stored.gold).toEqual(gold)
  })
})

describe("getStoredFinance — lần bán vàng/bạc", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  const SALE: Required<MetalSale> = {
    id: 1,
    purchaseId: 3,
    date: "15/09/2026",
    qty: 2,
    store: "SJC",
    buy: 900_000,
    received: 1_900_000,
    fundName: "Quỹ A",
    fundRemoved: true,
    note: "bán bớt",
  }

  it("keeps every field of a gold and a silver sale through a stored round trip", () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, goldSales: [SALE], silverSales: [{ ...SALE, store: "Phú Quý" }] })

    expect(getStoredFinance().goldSales).toEqual([SALE])
    expect(getStoredFinance().silverSales).toEqual([{ ...SALE, store: "Phú Quý" }])
  })

  it("drops only the malformed sale, keeping its valid siblings", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, goldSales: [{ ...SALE, id: 2, received: null }, SALE] })
    )

    expect(getStoredFinance().goldSales).toEqual([SALE])
  })

  it("reads no sales from data saved before sales existed", () => {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify({ savings: [], gold: [], goldGifts: [] }))

    expect(getStoredFinance().goldSales).toEqual([])
    expect(getStoredFinance().silverSales).toEqual([])
  })

  it("never drops a recorded sale because of a large amount received", () => {
    const big = { ...SALE, received: 1_500_000_000_000 }
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, goldSales: [big] })

    expect(getStoredFinance().goldSales).toEqual([big])
  })
})
