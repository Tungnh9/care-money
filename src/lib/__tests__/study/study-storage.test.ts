import { describe, it, expect, beforeEach } from "vitest"

import { DEFAULT_STUDY_STATE, STUDY_STORAGE_KEY, getStoredStudy, tasksForDay } from "@/lib/study/study-storage"
import type { Task } from "@/lib/study/types"

describe("getStoredStudy", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("falls back to the default tasks when the stored tasks field is not an array at all", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_STUDY_STATE, tasks: "not an array" })
    )

    expect(getStoredStudy().tasks).toEqual(DEFAULT_STUDY_STATE.tasks)
  })

  it("falls back to the default tasks when a task element is missing required fields", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_STUDY_STATE, tasks: [{ label: "Thiếu done" }] })
    )

    expect(getStoredStudy().tasks).toEqual(DEFAULT_STUDY_STATE.tasks)
  })

  it("keeps valid learned words even when tasks is malformed", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ tasks: "corrupted", learned: ["v-1", "v-2"] })
    )

    const state = getStoredStudy()
    expect(state.tasks).toEqual(DEFAULT_STUDY_STATE.tasks)
    expect(state.learned).toEqual(["v-1", "v-2"])
  })

  it("falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(STUDY_STORAGE_KEY, "{not valid json")

    expect(getStoredStudy()).toEqual(DEFAULT_STUDY_STATE)
  })

  it("backfills default game high scores and streak for data saved before this feature existed", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ tasks: DEFAULT_STUDY_STATE.tasks, learned: ["v-1"] })
    )

    const state = getStoredStudy()
    expect(state.gameHighScores).toEqual({ quiz: 0, match: 0, spelling: 0 })
    expect(state.gameStreak).toEqual({ count: 0, lastPlayedDayKey: null })
    expect(state.learned).toEqual(["v-1"])
  })

  it("keeps valid game high scores and streak already in storage", () => {
    const saved = {
      ...DEFAULT_STUDY_STATE,
      gameHighScores: { quiz: 8, match: 6, spelling: 10 },
      gameStreak: { count: 4, lastPlayedDayKey: "2026-09-15" },
    }
    window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(saved))

    expect(getStoredStudy().gameHighScores).toEqual({ quiz: 8, match: 6, spelling: 10 })
    expect(getStoredStudy().gameStreak).toEqual({ count: 4, lastPlayedDayKey: "2026-09-15" })
  })

  it("backfills an empty wordReviews map for data saved before this feature existed", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ tasks: DEFAULT_STUDY_STATE.tasks, learned: [] })
    )

    expect(getStoredStudy().wordReviews).toEqual({})
  })

  it("keeps valid wordReviews entries and drops only the malformed ones", () => {
    const saved = {
      ...DEFAULT_STUDY_STATE,
      wordReviews: {
        "v-1": {
          wordId: "v-1",
          easeFactor: 2.5,
          intervalDays: 6,
          repetitions: 2,
          dueAt: "2026-01-01",
          lastReviewedAt: null,
        },
        "v-2": { wordId: "v-2" }, // thiếu field bắt buộc
      },
    }
    window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(saved))

    const state = getStoredStudy()
    expect(state.wordReviews["v-1"]).toEqual(saved.wordReviews["v-1"])
    expect(state.wordReviews["v-2" as keyof typeof state.wordReviews]).toBeUndefined()
  })

  it("keeps valid learned ids and drops only a wrong-typed element (and duplicates)", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_STUDY_STATE, learned: ["v-0001", null, "v-0002", "v-0001"] })
    )

    expect(getStoredStudy().learned).toEqual(["v-0001", "v-0002"])
  })

  it("backfills tasksDay as null for data saved before ticks were tied to a day", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ tasks: DEFAULT_STUDY_STATE.tasks, learned: [] })
    )

    expect(getStoredStudy().tasksDay).toBeNull()
  })

  it("keeps the stored day the task ticks belong to", () => {
    window.localStorage.setItem(
      STUDY_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_STUDY_STATE, tasksDay: "2026-09-28" })
    )

    expect(getStoredStudy().tasksDay).toBe("2026-09-28")
  })
})

describe("tasksForDay", () => {
  const ticked: Task[] = [
    { label: "Ôn 20 từ vựng", done: true },
    { label: "Đọc 10 trang", done: false },
  ]

  it("keeps the ticks as they are when they belong to today", () => {
    expect(tasksForDay(ticked, "2026-09-29", "2026-09-29")).toBe(ticked)
  })

  it("unticks every task when the ticks belong to another day, or to no known day", () => {
    const unticked = [
      { label: "Ôn 20 từ vựng", done: false },
      { label: "Đọc 10 trang", done: false },
    ]

    expect(tasksForDay(ticked, "2026-09-28", "2026-09-29")).toEqual(unticked)
    expect(tasksForDay(ticked, null, "2026-09-29")).toEqual(unticked)
  })
})
