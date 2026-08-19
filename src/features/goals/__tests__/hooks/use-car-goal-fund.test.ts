import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { getCarGoalFundName } from "../../car-goal-storage"
import { useCarGoalFund } from "../../hooks/use-car-goal-fund"

describe("useCarGoalFund", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("hydrates the saved fund name after mount", async () => {
    window.localStorage.setItem("car-goal-fund-name", "Quỹ mua xe")

    const { result } = renderHook(() => useCarGoalFund())

    await waitFor(() => expect(result.current.fundName).toBe("Quỹ mua xe"))
  })

  it("selecting a fund updates state and persists it", async () => {
    const { result } = renderHook(() => useCarGoalFund())
    await waitFor(() => expect(result.current.fundName).toBeNull())

    act(() => {
      result.current.selectFund("Quỹ mua xe")
    })

    expect(result.current.fundName).toBe("Quỹ mua xe")
    expect(getCarGoalFundName()).toBe("Quỹ mua xe")
  })

  it("selecting null clears the persisted fund", async () => {
    const { result } = renderHook(() => useCarGoalFund())
    act(() => {
      result.current.selectFund("Quỹ mua xe")
    })

    act(() => {
      result.current.selectFund(null)
    })

    expect(result.current.fundName).toBeNull()
    expect(getCarGoalFundName()).toBeNull()
  })
})
