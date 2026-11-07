import { describe, it, expect } from "vitest"

import {
  SRS_EASE_START,
  SRS_EASE_FLOOR,
  DAILY_NEW_WORDS,
  initialReviewState,
  seedLearnedReviewState,
  applyGrade,
  ensureReviewStates,
  getDueWords,
  getTodayQueue,
  isNewWord,
} from "@/lib/study/srs-calculations"
import type { VocabEntry, WordReviewState } from "@/lib/study/types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

describe("initialReviewState", () => {
  it("seeds a brand-new word due today with no history", () => {
    expect(initialReviewState("v-1", "2026-01-01")).toEqual({
      wordId: "v-1",
      easeFactor: SRS_EASE_START,
      intervalDays: 0,
      repetitions: 0,
      dueAt: "2026-01-01",
      lastReviewedAt: null,
    })
  })
})

describe("seedLearnedReviewState", () => {
  it("seeds an already-learned word 6 days out, as if it had passed review twice", () => {
    expect(seedLearnedReviewState("v-1", "2026-01-01")).toEqual({
      wordId: "v-1",
      easeFactor: SRS_EASE_START,
      intervalDays: 6,
      repetitions: 2,
      dueAt: "2026-01-07",
      lastReviewedAt: null,
    })
  })
})

describe("applyGrade", () => {
  it("sets a 1-day interval on the first successful review", () => {
    const state = initialReviewState("v-1", "2026-01-01")
    const next = applyGrade(state, "good", "2026-01-01", "2026-01-01T10:00:00.000Z")

    expect(next.repetitions).toBe(1)
    expect(next.intervalDays).toBe(1)
    expect(next.dueAt).toBe("2026-01-02")
    expect(next.lastReviewedAt).toBe("2026-01-01T10:00:00.000Z")
  })

  it("sets a 6-day interval on the second successful review", () => {
    const first = applyGrade(initialReviewState("v-1", "2026-01-01"), "good", "2026-01-01", "t1")
    const second = applyGrade(first, "good", "2026-01-02", "t2")

    expect(second.repetitions).toBe(2)
    expect(second.intervalDays).toBe(6)
    expect(second.dueAt).toBe("2026-01-08")
  })

  it("multiplies the interval by the ease factor from the third successful review onward", () => {
    const first = applyGrade(initialReviewState("v-1", "2026-01-01"), "good", "2026-01-01", "t1")
    const second = applyGrade(first, "good", "2026-01-02", "t2")
    const third = applyGrade(second, "good", "2026-01-08", "t3")

    expect(third.repetitions).toBe(3)
    expect(third.easeFactor).toBe(2.5)
    expect(third.intervalDays).toBe(15) // round(6 * 2.5)
    expect(third.dueAt).toBe("2026-01-23")
  })

  it("resets repetitions and drops the interval to 1 day on 'again', regardless of prior progress", () => {
    const veteran: WordReviewState = {
      wordId: "v-1",
      easeFactor: 2.5,
      intervalDays: 30,
      repetitions: 5,
      dueAt: "2026-01-01",
      lastReviewedAt: "2025-12-01T00:00:00.000Z",
    }
    const next = applyGrade(veteran, "again", "2026-01-01", "2026-01-01T10:00:00.000Z")

    expect(next.repetitions).toBe(0)
    expect(next.intervalDays).toBe(1)
    expect(next.dueAt).toBe("2026-01-02")
    expect(next.easeFactor).toBeCloseTo(1.7) // 2.5 - 0.8
  })

  it("never lets the ease factor drop below the floor, even after repeated 'again' grades", () => {
    let state = initialReviewState("v-1", "2026-01-01")
    state = applyGrade(state, "again", "2026-01-01", "t1")
    state = applyGrade(state, "again", "2026-01-02", "t2")
    state = applyGrade(state, "again", "2026-01-03", "t3")

    expect(state.easeFactor).toBe(SRS_EASE_FLOOR)
  })
})

describe("ensureReviewStates", () => {
  const vocabList = [vocab("v-1"), vocab("v-2"), vocab("v-3")]

  it("adds a cold entry for every word missing from wordReviews", () => {
    const result = ensureReviewStates({}, vocabList, [], "2026-01-01")

    expect(Object.keys(result).sort()).toEqual(["v-1", "v-2", "v-3"])
    expect(result["v-1"].dueAt).toBe("2026-01-01")
    expect(result["v-1"].repetitions).toBe(0)
  })

  it("seeds an already-learned word 6 days out instead of due today", () => {
    const result = ensureReviewStates({}, vocabList, ["v-2"], "2026-01-01")

    expect(result["v-2"].dueAt).toBe("2026-01-07")
    expect(result["v-2"].repetitions).toBe(2)
  })

  it("returns the same reference when nothing is missing", () => {
    const existing = ensureReviewStates({}, vocabList, [], "2026-01-01")
    const result = ensureReviewStates(existing, vocabList, [], "2026-01-02")

    expect(result).toBe(existing)
  })

  it("leaves existing entries untouched, only adding the missing ones", () => {
    const existing = { "v-1": { ...initialReviewState("v-1", "2025-12-01"), repetitions: 4 } }
    const result = ensureReviewStates(existing, vocabList, [], "2026-01-01")

    expect(result["v-1"]).toEqual(existing["v-1"])
    expect(result["v-2"]).toBeDefined()
    expect(result["v-3"]).toBeDefined()
  })
})

describe("getDueWords", () => {
  it("returns only words whose dueAt is today or earlier, oldest due first", () => {
    const wordReviews: Record<string, WordReviewState> = {
      "v-1": { ...initialReviewState("v-1", "2026-01-05"), dueAt: "2026-01-05" },
      "v-2": { ...initialReviewState("v-2", "2026-01-01"), dueAt: "2026-01-01" },
      "v-3": { ...initialReviewState("v-3", "2026-01-10"), dueAt: "2026-01-10" }, // chưa tới hạn
    }
    const vocabList = [vocab("v-1"), vocab("v-2"), vocab("v-3")]

    const due = getDueWords(wordReviews, vocabList, "2026-01-05")

    expect(due.map((v) => v.id)).toEqual(["v-2", "v-1"])
  })

  it("returns an empty array when nothing is due", () => {
    expect(getDueWords({}, [vocab("v-1")], "2026-01-01")).toEqual([])
  })

  it("puts real reviews ahead of never-studied words, even when the new words have been due longer", () => {
    const wordReviews: Record<string, WordReviewState> = {
      // Cold-seed ngày 01-01, chưa từng chấm — "từ mới".
      "v-1": initialReviewState("v-1", "2026-01-01"),
      "v-2": initialReviewState("v-2", "2026-01-01"),
      // Chấm "Nhớ" ngày 01-01 → hẹn 01-02.
      "v-3": applyGrade(initialReviewState("v-3", "2026-01-01"), "good", "2026-01-01", "2026-01-01T10:00:00.000Z"),
      // Chấm "Quên" ngày 01-01 → repetitions về 0 nhưng vẫn là lượt ôn thật, hẹn 01-02.
      "v-4": applyGrade(initialReviewState("v-4", "2026-01-01"), "again", "2026-01-01", "2026-01-01T10:00:00.000Z"),
      // Seed "đã học" ngày 2025-12-27 → tới hạn 01-02; chưa từng chấm nhưng không phải từ mới.
      "v-5": seedLearnedReviewState("v-5", "2025-12-27"),
    }
    const vocabList = [vocab("v-1"), vocab("v-2"), vocab("v-3"), vocab("v-4"), vocab("v-5")]

    const due = getDueWords(wordReviews, vocabList, "2026-01-02")

    expect(due.map((v) => v.id)).toEqual(["v-3", "v-4", "v-5", "v-1", "v-2"])
  })

  it("still orders real reviews among themselves by oldest due first", () => {
    const wordReviews: Record<string, WordReviewState> = {
      // Chấm "Nhớ" ngày 01-03 → hẹn 01-04.
      "v-1": applyGrade(initialReviewState("v-1", "2026-01-03"), "good", "2026-01-03", "2026-01-03T10:00:00.000Z"),
      // Chấm "Nhớ" ngày 01-01 → hẹn 01-02, quá hạn lâu hơn.
      "v-2": applyGrade(initialReviewState("v-2", "2026-01-01"), "good", "2026-01-01", "2026-01-01T10:00:00.000Z"),
    }

    const due = getDueWords(wordReviews, [vocab("v-1"), vocab("v-2")], "2026-01-05")

    expect(due.map((v) => v.id)).toEqual(["v-2", "v-1"])
  })
})

describe("applyGrade — ngày học từ mới", () => {
  it("records the day a new word is first graded, whatever the grade", () => {
    for (const grade of ["again", "hard", "good", "easy"] as const) {
      expect(applyGrade(initialReviewState("v-1", "2026-01-01"), grade, "2026-01-03", "t").introducedOn).toBe(
        "2026-01-03"
      )
    }
  })

  it("keeps that first day on later grades", () => {
    const first = applyGrade(initialReviewState("v-1", "2026-01-01"), "again", "2026-01-03", "t1")
    const second = applyGrade(first, "good", "2026-01-04", "t2")

    expect(second.introducedOn).toBe("2026-01-03")
  })

  it("does not mark a review of a word learned elsewhere, or graded before the field existed", () => {
    const seeded = applyGrade(seedLearnedReviewState("v-1", "2026-01-01"), "good", "2026-01-07", "t")
    const older = applyGrade(
      { ...initialReviewState("v-2", "2026-01-01"), repetitions: 1, lastReviewedAt: "t0" },
      "good",
      "2026-01-07",
      "t"
    )

    expect(seeded.introducedOn).toBeUndefined()
    expect(older.introducedOn).toBeUndefined()
  })
})

describe("isNewWord", () => {
  it("is true only for a word never graded", () => {
    const fresh = initialReviewState("v-1", "2026-01-01")
    expect(isNewWord(fresh)).toBe(true)
    expect(isNewWord(applyGrade(fresh, "again", "2026-01-01", "t"))).toBe(false)
    expect(isNewWord(seedLearnedReviewState("v-2", "2026-01-01"))).toBe(false)
  })
})

describe("getTodayQueue", () => {
  const TODAY = "2026-01-10"

  function newWords(count: number) {
    const entries = Array.from({ length: count }, (_, i) => vocab(`n-${i}`))
    const states = Object.fromEntries(entries.map((v) => [v.id, initialReviewState(v.id, "2026-01-01")]))
    return { entries, states }
  }

  it("splits real reviews from new words, and caps new words for the day", () => {
    const { entries, states } = newWords(30)
    const review = vocab("r-1")
    const wordReviews = {
      ...states,
      [review.id]: {
        ...initialReviewState(review.id, "2026-01-01"),
        repetitions: 1,
        lastReviewedAt: "t",
        dueAt: TODAY,
      },
    }

    const queue = getTodayQueue(wordReviews, [...entries, review], TODAY)

    expect(queue.reviews.map((v) => v.id)).toEqual(["r-1"])
    expect(queue.fresh).toHaveLength(DAILY_NEW_WORDS)
    expect(queue.fresh.map((v) => v.id)).toEqual(entries.slice(0, DAILY_NEW_WORDS).map((v) => v.id))
    expect(queue.newLeft).toBe(30)
  })

  it("counts a word forgotten yesterday as a review, not a new word", () => {
    const word = vocab("v-1")
    const forgotten = applyGrade(initialReviewState(word.id, "2026-01-08"), "again", "2026-01-09", "t")

    expect(getTodayQueue({ [word.id]: forgotten }, [word], TODAY)).toEqual({ reviews: [word], fresh: [], newLeft: 0 })
  })

  it("gives fewer new words once some were already learned today, and none after the daily amount", () => {
    const { entries, states } = newWords(30)
    let wordReviews = states
    for (const entry of entries.slice(0, 4)) {
      wordReviews = { ...wordReviews, [entry.id]: applyGrade(wordReviews[entry.id], "good", TODAY, "t") }
    }

    const queue = getTodayQueue(wordReviews, entries, TODAY)
    expect(queue.fresh.map((v) => v.id)).toEqual(entries.slice(4, DAILY_NEW_WORDS).map((v) => v.id))

    for (const entry of entries.slice(4, DAILY_NEW_WORDS)) {
      wordReviews = { ...wordReviews, [entry.id]: applyGrade(wordReviews[entry.id], "good", TODAY, "t") }
    }
    expect(getTodayQueue(wordReviews, entries, TODAY)).toMatchObject({ fresh: [], newLeft: 30 - DAILY_NEW_WORDS })
  })

  it("starts a fresh allowance of new words the next day", () => {
    const { entries, states } = newWords(30)
    let wordReviews = states
    for (const entry of entries.slice(0, DAILY_NEW_WORDS)) {
      wordReviews = { ...wordReviews, [entry.id]: applyGrade(wordReviews[entry.id], "good", "2026-01-09", "t") }
    }

    const queue = getTodayQueue(wordReviews, entries, TODAY)

    expect(queue.fresh).toHaveLength(DAILY_NEW_WORDS)
    expect(queue.reviews).toHaveLength(DAILY_NEW_WORDS)
  })
})
