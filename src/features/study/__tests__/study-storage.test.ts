import { describe, it, expect, beforeEach } from "vitest"

import { DEFAULT_STUDY_STATE, STUDY_STORAGE_KEY, getStoredStudy } from "../study-storage"

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
})
