import { beforeEach, describe, expect, it, vi } from "vitest"

import { formatStorageSize, measureLocalStorageBytes } from "../storage-usage"

describe("measureLocalStorageBytes", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("is 0 for an empty localStorage", () => {
    expect(measureLocalStorageBytes()).toBe(0)
  })

  it("adds up every key and value at 2 bytes a character, the way Safari counts", () => {
    window.localStorage.setItem("budget-data", "abc")
    window.localStorage.setItem("hide-money", "1")

    expect(measureLocalStorageBytes()).toBe(("budget-data".length + 3 + "hide-money".length + 1) * 2)
  })

  it("counts UTF-16 code units, so an emoji takes 4 bytes", () => {
    window.localStorage.setItem("k", "🍔")

    expect(measureLocalStorageBytes()).toBe((1 + 2) * 2)
  })

  it("is null when the browser refuses to read localStorage", () => {
    window.localStorage.setItem("k", "abc")
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError")
    })
    try {
      expect(measureLocalStorageBytes()).toBeNull()
    } finally {
      spy.mockRestore()
    }
  })
})

describe("formatStorageSize", () => {
  it("shows whole KB under 1 MB", () => {
    expect(formatStorageSize(0)).toBe("0 KB")
    expect(formatStorageSize(420 * 1024)).toBe("420 KB")
    expect(formatStorageSize(1023 * 1024)).toBe("1023 KB")
  })

  it("shows MB with 2 decimals and a decimal comma from 1 MB, including what rounds up to 1024 KB", () => {
    expect(formatStorageSize(1024 * 1024 - 1)).toBe("1,00 MB")
    expect(formatStorageSize(1024 * 1024)).toBe("1,00 MB")
    expect(formatStorageSize(1.5 * 1024 * 1024)).toBe("1,50 MB")
    expect(formatStorageSize(6 * 1024 * 1024)).toBe("6,00 MB")
  })
})
