import { describe, it, expect, beforeEach } from "vitest"

import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  setStoredFinance,
  applySavingsFundDelta,
} from "../finance-storage"
import type { CreditCard, SavingsFund } from "../types"

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
