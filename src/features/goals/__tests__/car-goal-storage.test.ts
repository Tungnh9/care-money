import { describe, it, expect, beforeEach, vi } from "vitest"

import { getCarGoalFundName, setCarGoalFundName } from "../car-goal-storage"

describe("car-goal-storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("returns null when nothing has been saved yet", () => {
    expect(getCarGoalFundName()).toBeNull()
  })

  it("roundtrips a saved fund name", () => {
    setCarGoalFundName("Quỹ mua xe")
    expect(getCarGoalFundName()).toBe("Quỹ mua xe")
  })

  it("clears the saved fund name when set to null", () => {
    setCarGoalFundName("Quỹ mua xe")
    setCarGoalFundName(null)
    expect(getCarGoalFundName()).toBeNull()
  })

  it("returns null instead of throwing when localStorage read fails", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("blocked")
    })

    expect(getCarGoalFundName()).toBeNull()

    spy.mockRestore()
  })
})
