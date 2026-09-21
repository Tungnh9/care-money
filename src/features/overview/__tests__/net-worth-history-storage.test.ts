import { describe, it, expect, beforeEach } from "vitest"

import {
  NET_WORTH_HISTORY_KEY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
} from "../net-worth-history-storage"

describe("net-worth-history-storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns an empty array when nothing is stored", () => {
    expect(getStoredNetWorthHistory()).toEqual([])
  })

  it("round-trips a valid history through get/set", () => {
    const history = [
      { date: "2026-09-01", net: 10_000_000, savingsTotal: 5_000_000 },
      { date: "2026-09-02", net: 10_100_000, savingsTotal: 5_100_000 },
    ]
    setStoredNetWorthHistory(history)

    expect(getStoredNetWorthHistory()).toEqual(history)
  })

  it("drops only the malformed entries, keeping the valid ones", () => {
    window.localStorage.setItem(
      NET_WORTH_HISTORY_KEY,
      JSON.stringify([
        { date: "2026-09-01", net: 10_000_000, savingsTotal: 5_000_000 },
        { date: "2026-09-02" }, // thiếu field bắt buộc
      ])
    )

    const history = getStoredNetWorthHistory()

    expect(history).toHaveLength(1)
    expect(history[0].date).toBe("2026-09-01")
  })

  it("falls back to an empty array when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(NET_WORTH_HISTORY_KEY, "{not valid json")

    expect(getStoredNetWorthHistory()).toEqual([])
  })
})
