import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useFinance } from "../hooks/use-finance"
import { DEFAULT_FINANCE_STATE, getStoredFinance } from "../finance-storage"

describe("useFinance", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("seeds an empty state when localStorage is empty", async () => {
    const { result } = renderHook(() => useFinance())

    await waitFor(() => expect(result.current.savings).toEqual(DEFAULT_FINANCE_STATE.savings))
    expect(result.current.cards).toEqual([])
    expect(result.current.gold).toEqual([])
    expect(result.current.goldPrice).toBe("")
    expect(result.current.invests).toEqual([])
  })

  it("addSavingsFund appends a fund and persists it", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    act(() => {
      result.current.addSavingsFund({ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 })
    })

    expect(result.current.savings).toHaveLength(1)
    expect(result.current.savings[0].name).toBe("Quỹ dự phòng")
    expect(getStoredFinance().savings).toHaveLength(1)
  })

  it("addCard appends a card", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "15" })
    })

    expect(result.current.cards).toHaveLength(1)
    expect(result.current.cards[0].balance).toBe(2_000_000)
  })

  it("payCard reduces the matching card's balance and never goes below zero", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "15" })
    })
    act(() => {
      result.current.payCard("Thẻ A", 500_000)
    })
    expect(result.current.cards[0].balance).toBe(1_500_000)

    act(() => {
      result.current.payCard("Thẻ A", 10_000_000)
    })
    expect(result.current.cards[0].balance).toBe(0)
  })

  it("setGoldPrice updates and persists the raw string", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldPrice).toBe(""))

    act(() => {
      result.current.setGoldPrice("935.000")
    })

    expect(result.current.goldPrice).toBe("935.000")
    expect(getStoredFinance().goldPrice).toBe("935.000")
  })

  it("addGold prepends a purchase with a generated id", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000 })
    })

    expect(result.current.gold).toHaveLength(1)
    expect(result.current.gold[0]).toMatchObject({ date: "10/08/2026", phan: 20, buy: 900_000 })
    expect(typeof result.current.gold[0].id).toBe("number")
  })

  it("removeGold deletes only the matching purchase", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000 })
    })
    vi.setSystemTime(new Date(2026, 7, 10, 9, 5))
    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 10, buy: 910_000 })
    })
    expect(result.current.gold).toHaveLength(2)

    const idToRemove = result.current.gold[1].id
    act(() => {
      result.current.removeGold(idToRemove)
    })

    expect(result.current.gold).toHaveLength(1)
    expect(result.current.gold[0].phan).toBe(10)
  })

  it("addInvest appends an investment with a generated id", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.invests).toEqual([]))

    act(() => {
      result.current.addInvest({ name: "Quỹ cổ phiếu", cost: 10_000_000, value: 12_000_000 })
    })

    expect(result.current.invests).toHaveLength(1)
    expect(result.current.invests[0]).toMatchObject({ name: "Quỹ cổ phiếu", cost: 10_000_000, value: 12_000_000 })
    expect(typeof result.current.invests[0].id).toBe("number")
  })
})
