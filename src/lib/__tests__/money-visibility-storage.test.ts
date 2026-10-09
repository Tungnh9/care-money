import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { getHideMoney, setHideMoney } from "../money-visibility-storage"

describe("money-visibility-storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("remembers the hide-money choice", () => {
    setHideMoney(true)
    expect(getHideMoney()).toBe(true)

    setHideMoney(false)
    expect(getHideMoney()).toBe(false)
  })

  it("does not throw when the browser refuses the write (storage full or blocked)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError")
    })

    expect(() => setHideMoney(true)).not.toThrow()
  })
})
