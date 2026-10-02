import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { notifyDataChanged } from "../data-change-bus"
import { useStorageSync } from "../use-storage-sync"

const KEY = "sync-test-key"

describe("useStorageSync", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("does not call reload just for mounting", () => {
    window.localStorage.setItem(KEY, "1")
    const reload = vi.fn()

    renderHook(() => useStorageSync(KEY, reload))

    expect(reload).not.toHaveBeenCalled()
  })

  it("calls reload when this tab writes a new value to the watched key", () => {
    const reload = vi.fn()
    renderHook(() => useStorageSync(KEY, reload))

    act(() => {
      window.localStorage.setItem(KEY, "1")
      notifyDataChanged()
    })

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it("does not call reload when a write to another key leaves the watched key unchanged", () => {
    window.localStorage.setItem(KEY, "1")
    const reload = vi.fn()
    renderHook(() => useStorageSync(KEY, reload))

    act(() => {
      window.localStorage.setItem("other-key", "x")
      notifyDataChanged()
    })

    expect(reload).not.toHaveBeenCalled()
  })

  it("calls reload when another tab changes the watched key or clears all storage", () => {
    window.localStorage.setItem(KEY, "1")
    const reload = vi.fn()
    renderHook(() => useStorageSync(KEY, reload))

    act(() => {
      window.localStorage.setItem(KEY, "2")
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }))
    })
    expect(reload).toHaveBeenCalledTimes(1)

    act(() => {
      window.localStorage.clear()
      window.dispatchEvent(new StorageEvent("storage", { key: null }))
    })
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it("ignores storage events for other keys", () => {
    const reload = vi.fn()
    renderHook(() => useStorageSync(KEY, reload))

    act(() => {
      window.localStorage.setItem("other-key", "x")
      window.dispatchEvent(new StorageEvent("storage", { key: "other-key" }))
    })

    expect(reload).not.toHaveBeenCalled()
  })

  it("stops listening after unmount", () => {
    const reload = vi.fn()
    const { unmount } = renderHook(() => useStorageSync(KEY, reload))
    unmount()

    window.localStorage.setItem(KEY, "1")
    notifyDataChanged()
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }))

    expect(reload).not.toHaveBeenCalled()
  })
})
