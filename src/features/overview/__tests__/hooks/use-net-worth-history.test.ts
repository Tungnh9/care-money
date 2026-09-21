import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useNetWorthHistory } from "../../hooks/use-net-worth-history"
import { getStoredNetWorthHistory } from "../../net-worth-history-storage"

describe("useNetWorthHistory", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("starts empty and records a snapshot for today", async () => {
    const { result } = renderHook(() => useNetWorthHistory())
    await waitFor(() => expect(result.current.history).toEqual([]))

    act(() => {
      result.current.recordSnapshot(10_000_000, 5_000_000)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].net).toBe(10_000_000)
    expect(result.current.history[0].savingsTotal).toBe(5_000_000)
    expect(getStoredNetWorthHistory()).toHaveLength(1)
  })

  it("does not record a second snapshot for the same day", async () => {
    const { result } = renderHook(() => useNetWorthHistory())
    await waitFor(() => expect(result.current.history).toEqual([]))

    act(() => {
      result.current.recordSnapshot(10_000_000, 5_000_000)
    })
    act(() => {
      result.current.recordSnapshot(20_000_000, 9_000_000)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].net).toBe(10_000_000)
  })
})
