import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useStudy } from "../../hooks/use-study"
import { DEFAULT_STUDY_STATE, STUDY_STORAGE_KEY, getStoredStudy } from "../../study-storage"

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

    const restored = { tasks: [{ label: "Việc mới", done: true }], learned: ["v-0009"] }
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
})
