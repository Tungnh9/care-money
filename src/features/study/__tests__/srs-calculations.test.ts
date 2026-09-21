import { describe, it, expect } from "vitest"

import {
  SRS_EASE_START,
  SRS_EASE_FLOOR,
  initialReviewState,
  seedLearnedReviewState,
  applyGrade,
  ensureReviewStates,
  getDueWords,
} from "../srs-calculations"
import type { VocabEntry, WordReviewState } from "../types"

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
})
