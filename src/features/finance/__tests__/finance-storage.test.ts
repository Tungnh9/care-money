import { describe, it, expect, beforeEach } from "vitest"

import { DEFAULT_FINANCE_STATE, FINANCE_STORAGE_KEY, getStoredFinance } from "../finance-storage"

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
})
