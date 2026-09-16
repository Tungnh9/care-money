import { describe, it, expect } from "vitest"

import { matchScoreFromFlips, nextStreak, pickQuizOptions, pickRandomSet } from "../game-calculations"
import type { VocabEntry } from "../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const POOL: VocabEntry[] = Array.from({ length: 10 }, (_, i) => vocab(`${i}`))

describe("pickRandomSet", () => {
  it("returns the requested count with no duplicates", () => {
    const result = pickRandomSet(POOL, 5)
    expect(result).toHaveLength(5)
    expect(new Set(result.map((v) => v.id)).size).toBe(5)
  })

  it("returns the whole pool, shuffled, when count exceeds the pool size", () => {
    const result = pickRandomSet(POOL, 100)
    expect(result).toHaveLength(POOL.length)
    expect(new Set(result.map((v) => v.id)).size).toBe(POOL.length)
  })

  it("returns an empty array when the pool is empty", () => {
    expect(pickRandomSet([], 5)).toEqual([])
  })
})

describe("pickQuizOptions", () => {
  it("includes the correct entry exactly once among optionCount options", () => {
    const correct = POOL[0]
    const options = pickQuizOptions(POOL, correct, 4)
    expect(options).toHaveLength(4)
    expect(options.filter((o) => o.id === correct.id)).toHaveLength(1)
  })

  it("never repeats an option", () => {
    const correct = POOL[0]
    const options = pickQuizOptions(POOL, correct, 4)
    expect(new Set(options.map((o) => o.id)).size).toBe(4)
  })
})

describe("matchScoreFromFlips", () => {
  it("scores 10 for a perfect game at the theoretical minimum flip count", () => {
    expect(matchScoreFromFlips(6, 12)).toBe(10)
  })

  it("scores about half for double the minimum flips", () => {
    expect(matchScoreFromFlips(6, 24)).toBe(5)
  })

  it("never goes below 0 even with a very high flip count", () => {
    expect(matchScoreFromFlips(6, 1000)).toBeGreaterThanOrEqual(0)
  })
})

describe("nextStreak", () => {
  it("stays unchanged when playing again on the same day", () => {
    const current = { count: 3, lastPlayedDayKey: "2026-09-15" }
    expect(nextStreak(current, "2026-09-15")).toEqual(current)
  })

  it("increments when playing on the very next day", () => {
    const current = { count: 3, lastPlayedDayKey: "2026-09-15" }
    expect(nextStreak(current, "2026-09-16")).toEqual({ count: 4, lastPlayedDayKey: "2026-09-16" })
  })

  it("resets to 1 after skipping a day", () => {
    const current = { count: 5, lastPlayedDayKey: "2026-09-10" }
    expect(nextStreak(current, "2026-09-16")).toEqual({ count: 1, lastPlayedDayKey: "2026-09-16" })
  })

  it("starts at 1 on the very first play (lastPlayedDayKey is null)", () => {
    const current = { count: 0, lastPlayedDayKey: null }
    expect(nextStreak(current, "2026-09-16")).toEqual({ count: 1, lastPlayedDayKey: "2026-09-16" })
  })
})
