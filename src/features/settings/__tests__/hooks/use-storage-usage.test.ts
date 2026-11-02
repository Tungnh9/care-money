import { beforeEach, describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { BUDGET_STORAGE_KEY, DEFAULT_BUDGET_STATE, setStoredBudget } from "@/lib/budget/budget-storage"
import { useStorageUsage } from "../../hooks/use-storage-usage"

describe("useStorageUsage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("measures localStorage once mounted", () => {
    window.localStorage.setItem("k", "abc")

    const { result } = renderHook(() => useStorageUsage())

    expect(result.current).toBe((1 + 3) * 2)
  })

  it("measures again after any write in this tab", () => {
    const { result } = renderHook(() => useStorageUsage())
    expect(result.current).toBe(0)

    act(() => setStoredBudget(DEFAULT_BUDGET_STATE))

    const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY) ?? ""
    expect(result.current).toBe((BUDGET_STORAGE_KEY.length + raw.length) * 2)
  })

  it("measures again when another tab writes", () => {
    const { result } = renderHook(() => useStorageUsage())

    act(() => {
      // Tab khác ghi: tab này không được báo qua data-change-bus, chỉ nhận sự kiện "storage".
      window.localStorage.setItem("k", "abcd")
      window.dispatchEvent(new StorageEvent("storage", { key: "k" }))
    })

    expect(result.current).toBe((1 + 4) * 2)
  })
})
