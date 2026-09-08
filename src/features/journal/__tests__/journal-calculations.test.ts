import { describe, it, expect } from "vitest"

import { findOnThisDay, isSameCalendarDay } from "../journal-calculations"
import type { JournalEntry } from "../types"

function entry(id: number, text: string): JournalEntry {
  return { id, text, time: "09:00", date: "01/01", words: 1, mood: null }
}

describe("isSameCalendarDay", () => {
  it("returns true for two dates on the same year/month/day, ignoring time", () => {
    expect(isSameCalendarDay(new Date(2026, 7, 10, 8, 0), new Date(2026, 7, 10, 23, 59))).toBe(true)
  })

  it("returns false when the day, month or year differs", () => {
    expect(isSameCalendarDay(new Date(2026, 7, 10), new Date(2026, 7, 11))).toBe(false)
    expect(isSameCalendarDay(new Date(2026, 7, 10), new Date(2026, 8, 10))).toBe(false)
    expect(isSameCalendarDay(new Date(2026, 7, 10), new Date(2025, 7, 10))).toBe(false)
  })
})

describe("findOnThisDay", () => {
  const now = new Date(2026, 7, 10, 9, 0)

  it("matches an entry from exactly 1 year ago", () => {
    const yearAgo = entry(new Date(2025, 7, 10, 9, 0).getTime(), "Năm ngoái")
    const result = findOnThisDay([yearAgo], now)

    expect(result).toEqual({ entry: yearAgo, label: "1 năm trước" })
  })

  it("matches an entry from exactly 1 month ago", () => {
    const monthAgo = entry(new Date(2026, 6, 10, 9, 0).getTime(), "Tháng trước")
    const result = findOnThisDay([monthAgo], now)

    expect(result).toEqual({ entry: monthAgo, label: "1 tháng trước" })
  })

  it("handles the 1-month-ago boundary across a year change (Jan -> Dec of previous year)", () => {
    const january = new Date(2026, 0, 15, 9, 0)
    const decemberEntry = entry(new Date(2025, 11, 15, 9, 0).getTime(), "Tháng 12 năm ngoái")

    const result = findOnThisDay([decemberEntry], january)

    expect(result).toEqual({ entry: decemberEntry, label: "1 tháng trước" })
  })

  it("matches an entry from exactly 1 week ago", () => {
    const weekAgo = entry(new Date(2026, 7, 3, 9, 0).getTime(), "Tuần trước")
    const result = findOnThisDay([weekAgo], now)

    expect(result).toEqual({ entry: weekAgo, label: "1 tuần trước" })
  })

  it("returns null when no entry matches any anniversary", () => {
    const unrelated = entry(new Date(2026, 7, 9, 9, 0).getTime(), "Hôm qua")

    expect(findOnThisDay([unrelated], now)).toBeNull()
  })

  it("returns null when there are no entries at all", () => {
    expect(findOnThisDay([], now)).toBeNull()
  })

  it("prefers the 1-year-ago match over a 1-week-ago match when both exist", () => {
    const yearAgo = entry(new Date(2025, 7, 10, 9, 0).getTime(), "Năm ngoái")
    const weekAgo = entry(new Date(2026, 7, 3, 9, 0).getTime(), "Tuần trước")

    const result = findOnThisDay([weekAgo, yearAgo], now)

    expect(result).toEqual({ entry: yearAgo, label: "1 năm trước" })
  })
})
