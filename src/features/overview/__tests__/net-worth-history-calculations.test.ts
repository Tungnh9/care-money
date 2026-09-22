import { describe, it, expect } from "vitest"

import { shouldRecordSnapshot, appendSnapshot } from "../net-worth-history-calculations"
import type { NetWorthSnapshot } from "../net-worth-history-storage"

describe("shouldRecordSnapshot", () => {
  it("returns true when history is empty", () => {
    expect(shouldRecordSnapshot([], "2026-09-21")).toBe(true)
  })

  it("returns false when the last entry is already today", () => {
    const history: NetWorthSnapshot[] = [{ date: "2026-09-21", net: 1, savingsTotal: 1 }]
    expect(shouldRecordSnapshot(history, "2026-09-21")).toBe(false)
  })

  it("returns true when the last entry is an earlier day", () => {
    const history: NetWorthSnapshot[] = [{ date: "2026-09-20", net: 1, savingsTotal: 1 }]
    expect(shouldRecordSnapshot(history, "2026-09-21")).toBe(true)
  })
})

describe("appendSnapshot", () => {
  it("appends a new snapshot when today is not yet recorded", () => {
    const history: NetWorthSnapshot[] = [{ date: "2026-09-20", net: 1_000, savingsTotal: 500 }]
    const next = appendSnapshot(history, { date: "2026-09-21", net: 1_100, savingsTotal: 550 })

    expect(next).toHaveLength(2)
    expect(next[1]).toEqual({ date: "2026-09-21", net: 1_100, savingsTotal: 550 })
  })

  it("returns the same reference when today is already recorded with identical values", () => {
    const history: NetWorthSnapshot[] = [{ date: "2026-09-21", net: 1_000, savingsTotal: 500 }]
    const next = appendSnapshot(history, { date: "2026-09-21", net: 1_000, savingsTotal: 500 })

    expect(next).toBe(history)
    expect(next).toHaveLength(1)
  })

  it("replaces today's entry with newer values instead of duplicating it", () => {
    // Trường hợp thật: lần gọi đầu trong ngày chạy trước khi 1 hook khác (vd. useFinance) kịp
    // hydrate xong, ghi tạm giá trị 0/sai — lần gọi sau trong CÙNG ngày mang giá trị đúng phải
    // ghi đè, không được bị coi là "đã ghi hôm nay rồi" và bỏ qua.
    const history: NetWorthSnapshot[] = [{ date: "2026-09-21", net: 0, savingsTotal: 0 }]
    const next = appendSnapshot(history, { date: "2026-09-21", net: 9_999, savingsTotal: 9_999 })

    expect(next).toHaveLength(1)
    expect(next[0]).toEqual({ date: "2026-09-21", net: 9_999, savingsTotal: 9_999 })
    expect(next).not.toBe(history)
  })

  it("does not append a duplicate day when replacing — earlier days stay intact", () => {
    const history: NetWorthSnapshot[] = [
      { date: "2026-09-19", net: 1, savingsTotal: 1 },
      { date: "2026-09-20", net: 2, savingsTotal: 2 },
      { date: "2026-09-21", net: 0, savingsTotal: 0 },
    ]
    const next = appendSnapshot(history, { date: "2026-09-21", net: 3, savingsTotal: 3 })

    expect(next).toHaveLength(3)
    expect(next[0]).toEqual({ date: "2026-09-19", net: 1, savingsTotal: 1 })
    expect(next[1]).toEqual({ date: "2026-09-20", net: 2, savingsTotal: 2 })
    expect(next[2]).toEqual({ date: "2026-09-21", net: 3, savingsTotal: 3 })
  })
})
