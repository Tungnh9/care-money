import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useStudy } from "../../hooks/use-study"
import { DEFAULT_STUDY_STATE, STUDY_STORAGE_KEY, getStoredStudy } from "../../study-storage"
import { dayKey } from "@/lib/date"

describe("useStudy", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("seeds from defaults when localStorage is empty", async () => {
    const { result } = renderHook(() => useStudy())

    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))
    expect(result.current.learned).toEqual([])
  })

  it("toggles a task and persists it", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    act(() => {
      result.current.toggleTask(0)
    })

    expect(result.current.tasks[0].done).toBe(true)
    expect(getStoredStudy().tasks[0].done).toBe(true)

    act(() => {
      result.current.toggleTask(0)
    })
    expect(result.current.tasks[0].done).toBe(false)
  })

  it("adds an id to learned when marked, and removes it when unmarked", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    act(() => {
      result.current.toggleLearned("v-0001")
    })
    expect(result.current.learned).toEqual(["v-0001"])
    expect(getStoredStudy().learned).toEqual(["v-0001"])

    act(() => {
      result.current.toggleLearned("v-0002")
    })
    expect(result.current.learned).toEqual(["v-0001", "v-0002"])

    act(() => {
      result.current.toggleLearned("v-0001")
    })
    expect(result.current.learned).toEqual(["v-0002"])
  })

  it("replaceStudy overwrites the whole state and persists it, e.g. after restoring a backup", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    const restored = {
      tasks: [{ label: "Việc mới", done: true }],
      learned: ["v-0009"],
      gameHighScores: { quiz: 0, match: 0, spelling: 0 },
      gameStreak: { count: 0, lastPlayedDayKey: null },
      wordReviews: {},
    }
    act(() => {
      result.current.replaceStudy(restored)
    })

    expect(result.current.tasks).toEqual(restored.tasks)
    expect(getStoredStudy().learned).toEqual(["v-0009"])
  })

  it("getStoredStudy falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(STUDY_STORAGE_KEY, "{not valid json")

    expect(getStoredStudy()).toEqual(DEFAULT_STUDY_STATE)
  })

  it("records a game result, returns isNewHighScore, and only raises the stored high score when beaten", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    let outcome: { isNewHighScore: boolean } | undefined
    act(() => {
      outcome = result.current.recordGameResult("quiz", 7)
    })
    expect(outcome).toEqual({ isNewHighScore: true })
    expect(result.current.gameHighScores.quiz).toBe(7)
    expect(getStoredStudy().gameHighScores.quiz).toBe(7)

    act(() => {
      outcome = result.current.recordGameResult("quiz", 5)
    })
    expect(outcome).toEqual({ isNewHighScore: false })
    expect(result.current.gameHighScores.quiz).toBe(7)
  })

  it("does not write to storage again when recording an unchanged result on the same day", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    act(() => {
      result.current.recordGameResult("quiz", 7)
    })

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem")
    act(() => {
      // Cùng ngày, không phá kỷ lục (7) → cả gameHighScores lẫn gameStreak đều không đổi.
      result.current.recordGameResult("quiz", 5)
    })

    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it("advances the play streak via nextStreak when recording a game result", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    act(() => {
      result.current.recordGameResult("spelling", 3)
    })

    expect(result.current.gameStreak).toEqual({ count: 1, lastPlayedDayKey: dayKey() })
    expect(getStoredStudy().gameStreak).toEqual({ count: 1, lastPlayedDayKey: dayKey() })
  })

  it("wordReviews starts empty and gradeWord creates a fresh entry for a never-graded word", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    expect(result.current.wordReviews).toEqual({})

    act(() => {
      result.current.gradeWord("v-0001", "good")
    })

    expect(result.current.wordReviews["v-0001"]).toBeDefined()
    expect(result.current.wordReviews["v-0001"].repetitions).toBe(1)
    expect(getStoredStudy().wordReviews["v-0001"].repetitions).toBe(1)
  })

  it("seeds an already-learned word with a 6-day head start before grading it", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    act(() => {
      result.current.toggleLearned("v-0002")
    })
    act(() => {
      result.current.gradeWord("v-0002", "good")
    })

    // Từ "learned" bắt đầu từ repetitions=2 (seedLearnedReviewState), chấm "good" 1 lần nữa → 3.
    expect(result.current.wordReviews["v-0002"].repetitions).toBe(3)
  })

  it("updates an existing wordReviews entry via applyGrade instead of re-seeding it", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    act(() => {
      result.current.gradeWord("v-0001", "good")
    })
    act(() => {
      result.current.gradeWord("v-0001", "good")
    })

    expect(result.current.wordReviews["v-0001"].repetitions).toBe(2)
    expect(result.current.wordReviews["v-0001"].intervalDays).toBe(6)
  })

  it("does not lose a grade when gradeWord and recordGameResult are called in the same tick", async () => {
    const { result } = renderHook(() => useStudy())
    await waitFor(() => expect(result.current.tasks).toEqual(DEFAULT_STUDY_STATE.tasks))

    act(() => {
      result.current.gradeWord("v-9", "good")
      result.current.recordGameResult("quiz", 10)
    })

    expect(result.current.wordReviews["v-9"]).toBeDefined()
    expect(result.current.wordReviews["v-9"].repetitions).toBe(1)
    expect(result.current.gameHighScores.quiz).toBe(10)
    expect(getStoredStudy().wordReviews["v-9"]).toBeDefined()
    expect(getStoredStudy().gameHighScores.quiz).toBe(10)
  })
})
