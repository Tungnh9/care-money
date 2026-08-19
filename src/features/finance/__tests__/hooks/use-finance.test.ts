import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useFinance } from "../../hooks/use-finance"
import { DEFAULT_FINANCE_STATE, FINANCE_STORAGE_KEY, getStoredFinance } from "../../finance-storage"
import { toast } from "sonner"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

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

  it("updateSavingsFund replaces the matching fund's fields, keyed by its original name", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    act(() => {
      result.current.addSavingsFund({ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 })
    })
    act(() => {
      result.current.updateSavingsFund("Quỹ dự phòng", {
        name: "Quỹ khẩn cấp",
        amount: 8_000_000,
        target: 25_000_000,
      })
    })

    expect(result.current.savings).toHaveLength(1)
    expect(result.current.savings[0]).toEqual({
      name: "Quỹ khẩn cấp",
      amount: 8_000_000,
      target: 25_000_000,
    })
    expect(getStoredFinance().savings[0].amount).toBe(8_000_000)
  })

  it("removeSavingsFund deletes only the matching fund", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    act(() => {
      result.current.addSavingsFund({ name: "Quỹ A", amount: 1, target: 2 })
    })
    act(() => {
      result.current.addSavingsFund({ name: "Quỹ B", amount: 3, target: 4 })
    })
    act(() => {
      result.current.removeSavingsFund("Quỹ A")
    })

    expect(result.current.savings).toHaveLength(1)
    expect(result.current.savings[0].name).toBe("Quỹ B")
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

  it("updateCard replaces the matching card's fields, keyed by its original name", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "15" })
    })
    act(() => {
      result.current.updateCard("Thẻ A", {
        name: "Thẻ A Visa",
        balance: 1_000_000,
        min: 100_000,
        limit: 15_000_000,
        due: "20",
      })
    })

    expect(result.current.cards).toHaveLength(1)
    expect(result.current.cards[0]).toEqual({
      name: "Thẻ A Visa",
      balance: 1_000_000,
      min: 100_000,
      limit: 15_000_000,
      due: "20",
    })
    expect(getStoredFinance().cards[0].limit).toBe(15_000_000)
  })

  it("removeCard deletes only the matching card", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 1, min: 1, limit: 1, due: "1" })
    })
    act(() => {
      result.current.addCard({ name: "Thẻ B", balance: 2, min: 2, limit: 2, due: "2" })
    })
    act(() => {
      result.current.removeCard("Thẻ A")
    })

    expect(result.current.cards).toHaveLength(1)
    expect(result.current.cards[0].name).toBe("Thẻ B")
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

  it("updateGold replaces the matching purchase's fields, keyed by its id", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000 })
    })
    const id = result.current.gold[0].id

    act(() => {
      result.current.updateGold(id, { date: "12/08/2026", phan: 25, buy: 950_000 })
    })

    expect(result.current.gold).toHaveLength(1)
    expect(result.current.gold[0]).toEqual({
      id,
      date: "12/08/2026",
      phan: 25,
      buy: 950_000,
    })
    expect(getStoredFinance().gold[0].buy).toBe(950_000)
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

  it("replaceFinance overwrites the whole state and persists it, e.g. after restoring a backup", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    const restored = {
      savings: [{ name: "Quỹ mới", amount: 1, target: 2 }],
      cards: [],
      gold: [],
      goldPrice: "935.000",
      invests: [],
    }
    act(() => {
      result.current.replaceFinance(restored)
    })

    expect(result.current.savings).toEqual(restored.savings)
    expect(getStoredFinance().goldPrice).toBe("935.000")
  })

  it("getStoredFinance falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(FINANCE_STORAGE_KEY, "{not valid json")

    expect(getStoredFinance()).toEqual(DEFAULT_FINANCE_STATE)
  })
})

describe("useFinance toast notifications", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("addSavingsFund shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    act(() => {
      result.current.addSavingsFund({ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 })
    })

    expect(toast.success).toHaveBeenCalledWith('Đã thêm quỹ tiết kiệm "Quỹ dự phòng"')
  })

  it("addSavingsFund shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.addSavingsFund({ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith(
      'Không thể thêm quỹ tiết kiệm "Quỹ dự phòng". Vui lòng thử lại.'
    )
    expect(result.current.savings).toEqual([])
  })

  it("removeSavingsFund shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    act(() => {
      result.current.addSavingsFund({ name: "Quỹ A", amount: 1, target: 2 })
    })
    act(() => {
      result.current.removeSavingsFund("Quỹ A")
    })

    expect(toast.success).toHaveBeenCalledWith('Đã xoá quỹ tiết kiệm "Quỹ A"')
  })

  it("removeSavingsFund shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    act(() => {
      result.current.addSavingsFund({ name: "Quỹ A", amount: 1, target: 2 })
    })

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.removeSavingsFund("Quỹ A")
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith(
      'Không thể xoá quỹ tiết kiệm "Quỹ A". Vui lòng thử lại.'
    )
    expect(result.current.savings).toHaveLength(1)
  })

  it("addCard shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 1, min: 1, limit: 1, due: "1" })
    })

    expect(toast.success).toHaveBeenCalledWith('Đã thêm thẻ tín dụng "Thẻ A"')
  })

  it("addCard shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 1, min: 1, limit: 1, due: "1" })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith(
      'Không thể thêm thẻ tín dụng "Thẻ A". Vui lòng thử lại.'
    )
    expect(result.current.cards).toEqual([])
  })

  it("removeCard shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 1, min: 1, limit: 1, due: "1" })
    })
    act(() => {
      result.current.removeCard("Thẻ A")
    })

    expect(toast.success).toHaveBeenCalledWith('Đã xoá thẻ tín dụng "Thẻ A"')
  })

  it("removeCard shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 1, min: 1, limit: 1, due: "1" })
    })

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.removeCard("Thẻ A")
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith(
      'Không thể xoá thẻ tín dụng "Thẻ A". Vui lòng thử lại.'
    )
    expect(result.current.cards).toHaveLength(1)
  })

  it("addGold shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000 })
    })

    expect(toast.success).toHaveBeenCalledWith("Đã thêm lần mua vàng ngày 10/08/2026")
  })

  it("addGold shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000 })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith("Không thể thêm lần mua vàng. Vui lòng thử lại.")
    expect(result.current.gold).toEqual([])
  })

  it("removeGold shows a success toast with the purchase's date when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000 })
    })
    const id = result.current.gold[0].id

    act(() => {
      result.current.removeGold(id)
    })

    expect(toast.success).toHaveBeenCalledWith("Đã xoá giao dịch vàng ngày 10/08/2026")
  })

  it("removeGold shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000 })
    })
    const id = result.current.gold[0].id

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.removeGold(id)
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith("Không thể xoá giao dịch vàng. Vui lòng thử lại.")
    expect(result.current.gold).toHaveLength(1)
  })

  it("addInvest shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.invests).toEqual([]))

    act(() => {
      result.current.addInvest({ name: "Quỹ cổ phiếu", cost: 10_000_000, value: 12_000_000 })
    })

    expect(toast.success).toHaveBeenCalledWith('Đã thêm khoản đầu tư "Quỹ cổ phiếu"')
  })

  it("addInvest shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.invests).toEqual([]))

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.addInvest({ name: "Quỹ cổ phiếu", cost: 10_000_000, value: 12_000_000 })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith("Không thể thêm khoản đầu tư. Vui lòng thử lại.")
    expect(result.current.invests).toEqual([])
  })
})
