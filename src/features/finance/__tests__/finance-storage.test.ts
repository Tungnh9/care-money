import { describe, it, expect, beforeEach } from "vitest"

import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  setStoredFinance,
  applySavingsFundDelta,
} from "../finance-storage"

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

  it("falls back to an empty array when a list field contains elements missing required fields", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_FINANCE_STATE, cards: [{ name: "Thẻ lỗi" }] })
    )

    expect(getStoredFinance().cards).toEqual([])
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
