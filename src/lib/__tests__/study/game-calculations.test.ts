import { describe, it, expect } from "vitest"

import {
  activeStreakCount,
  isTypableWord,
  matchScoreFromFlips,
  nextStreak,
  pickMatchEntries,
  pickQuizOptions,
  pickRandomSet,
} from "@/lib/study/game-calculations"
import type { VocabEntry } from "@/lib/study/types"

function vocab(id: string, word?: string): VocabEntry {
  return { id, word: word ?? `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

function entry(id: string, word: string, meaning: string): VocabEntry {
  return { id, word, meaning, addedAt: "2026-01-01" }
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

  it("never offers a wrong option that shares the answer's meaning or spelling", () => {
    const correct = entry("v-0051", "light", "sáng (màu sắc)")
    const pool = [
      correct,
      entry("v-0138", "bright", "sáng (màu sắc)"), // cùng nghĩa — chọn trúng nút này vẫn bị chấm "Quên"
      entry("v-0123", "Light", "đèn"), // cùng chữ — "đèn" cũng là 1 nghĩa đúng của "light"
      vocab("1"),
      vocab("2"),
      vocab("3"),
    ]

    // Phương án được rút ngẫu nhiên: lặp nhiều lần để trước bản sửa gần như chắc chắn có lần rút trúng
    // v-0138/v-0123. Chỉ còn đúng 3 phương án sai hợp lệ nên lần nào cũng phải ra đúng bộ này.
    for (let i = 0; i < 20; i++) {
      const ids = pickQuizOptions(pool, correct, 4).map((option) => option.id)
      expect(ids.sort()).toEqual(["1", "2", "3", "v-0051"])
    }
  })

  it("never shows two options with the same meaning", () => {
    const correct = vocab("1")
    const pool = [correct, entry("v-0064", "famous", "nổi tiếng"), entry("v-0062", "popular", "nổi tiếng"), vocab("2"), vocab("3")]

    for (let i = 0; i < 20; i++) {
      const meanings = pickQuizOptions(pool, correct, 4).map((option) => option.meaning)
      expect(new Set(meanings).size).toBe(meanings.length)
      expect(meanings).toHaveLength(4)
    }
  })

  it("offers fewer options rather than a duplicate when the pool runs out of distinct meanings", () => {
    const correct = entry("v-0004", "pay", "mức lương")
    const options = pickQuizOptions([correct, entry("v-0179", "pay", "mức lương"), vocab("1")], correct, 4)

    expect(options.map((option) => option.id).sort()).toEqual(["1", "v-0004"])
  })
})

describe("pickMatchEntries", () => {
  it("never picks two entries with the same word or the same meaning", () => {
    const pool = [
      entry("v-0004", "pay", "mức lương"),
      entry("v-0179", "pay", "mức lương"),
      entry("v-0064", "famous", "nổi tiếng"),
      entry("v-0062", "popular", "nổi tiếng"),
      entry("v-0051", "light", "sáng (màu sắc)"),
      entry("v-0123", "light", "đèn"),
      vocab("1"),
      vocab("2"),
    ]

    // 3 nhóm trùng (pay/pay, famous/popular, light/light) mỗi nhóm chỉ được góp 1 mục → luôn đúng 5 mục.
    for (let i = 0; i < 20; i++) {
      const picked = pickMatchEntries(pool, 6)
      expect(picked).toHaveLength(5)
      expect(new Set(picked.map((v) => v.word.toLowerCase())).size).toBe(5)
      expect(new Set(picked.map((v) => v.meaning)).size).toBe(5)
    }
  })

  it("returns exactly count entries when the pool has enough distinct ones", () => {
    expect(pickMatchEntries(POOL, 6)).toHaveLength(6)
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

describe("isTypableWord", () => {
  it("rejects a word containing a literal ... collocation placeholder", () => {
    expect(isTypableWord(vocab("tmpl1", "offer ... (to ...)"))).toBe(false)
    expect(isTypableWord(vocab("tmpl2", "go to ..."))).toBe(false)
  })

  it("accepts a normal word with no placeholder", () => {
    expect(isTypableWord(vocab("normal", "hello"))).toBe(true)
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

describe("activeStreakCount", () => {
  it("keeps the count while the last play was today or yesterday, across a month boundary too", () => {
    expect(activeStreakCount({ count: 4, lastPlayedDayKey: "2026-09-29" }, "2026-09-29")).toBe(4)
    expect(activeStreakCount({ count: 4, lastPlayedDayKey: "2026-09-28" }, "2026-09-29")).toBe(4)
    expect(activeStreakCount({ count: 2, lastPlayedDayKey: "2026-09-30" }, "2026-10-01")).toBe(2)
  })

  it("is 0 once a whole day was skipped, or before the first play", () => {
    expect(activeStreakCount({ count: 6, lastPlayedDayKey: "2026-09-20" }, "2026-09-29")).toBe(0)
    expect(activeStreakCount({ count: 0, lastPlayedDayKey: null }, "2026-09-29")).toBe(0)
  })
})
