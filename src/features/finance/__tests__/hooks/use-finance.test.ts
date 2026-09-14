import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useFinance } from "../../hooks/use-finance"
import { DEFAULT_FINANCE_STATE, FINANCE_STORAGE_KEY, getStoredFinance } from "../../finance-storage"
import { getCarGoalFundName, setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { DEFAULT_BUDGET_STATE, getStoredBudget, setStoredBudget } from "@/features/budget/budget-storage"
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
    expect(result.current.goldStores).toEqual([])
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

  it("updateSavingsFund keeps the car-goal link pointed at the fund when it's renamed", async () => {
    setCarGoalFundName("Quỹ dự phòng")
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

    expect(getCarGoalFundName()).toBe("Quỹ khẩn cấp")
  })

  it("updateSavingsFund does not touch the car-goal link when renaming an unrelated fund", async () => {
    setCarGoalFundName("Quỹ mua xe")
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

    expect(getCarGoalFundName()).toBe("Quỹ mua xe")
  })

  it("updateSavingsFund cascades a rename into historical budget settlements", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      settlements: [
        {
          id: 1,
          month: "2026-09",
          at: "2026-09-30T00:00:00.000Z",
          direction: "deposit",
          amount: 50_000,
          fundName: "Quỹ dự phòng",
          fundAmountBefore: 0,
          fundAmountAfter: 50_000,
        },
      ],
    })
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

    expect(getStoredBudget().settlements[0].fundName).toBe("Quỹ khẩn cấp")
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

  it("addGoldStore appends a store and persists it", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })

    expect(result.current.goldStores).toEqual([{ name: "SJC", price: "935.000" }])
    expect(getStoredFinance().goldStores).toEqual([{ name: "SJC", price: "935.000" }])
  })

  it("addGoldStore refuses to add a store whose name already exists", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "800.000" })
    })

    expect(result.current.goldStores).toEqual([{ name: "SJC", price: "935.000" }])
  })

  it("setGoldStorePrice updates and persists just that store's price", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.setGoldStorePrice("SJC", "950.000")
    })

    expect(result.current.goldStores).toEqual([{ name: "SJC", price: "950.000" }])
    expect(getStoredFinance().goldStores).toEqual([{ name: "SJC", price: "950.000" }])
  })

  it("updateGoldStore renames a store, keyed by its original name", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.updateGoldStore("SJC", { name: "SJC 9999", price: "940.000" })
    })

    expect(result.current.goldStores).toEqual([{ name: "SJC 9999", price: "940.000" }])
  })

  it("updateGoldStore cascades the new name to every purchase referencing the old store", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    act(() => {
      result.current.updateGoldStore("SJC", { name: "SJC 9999", price: "940.000" })
    })

    expect(result.current.gold[0].store).toBe("SJC 9999")
  })

  it("updateGoldStore leaves purchases from unrelated stores untouched", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.addGoldStore({ name: "PNJ", price: "800.000" })
    })
    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "PNJ" })
    })
    act(() => {
      result.current.updateGoldStore("SJC", { name: "SJC 9999", price: "940.000" })
    })

    expect(result.current.gold[0].store).toBe("PNJ")
  })

  it("removeGoldStore deletes a store that has no purchases attached", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.removeGoldStore("SJC")
    })

    expect(result.current.goldStores).toEqual([])
  })

  it("removeGoldStore refuses to delete a store that still has purchases attached", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    act(() => {
      result.current.removeGoldStore("SJC")
    })

    expect(result.current.goldStores).toEqual([{ name: "SJC", price: "935.000" }])
  })

  it("addGold prepends a purchase with a generated id", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })

    expect(result.current.gold).toHaveLength(1)
    expect(result.current.gold[0]).toMatchObject({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    expect(typeof result.current.gold[0].id).toBe("number")
  })

  it("removeGold deletes only the matching purchase", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    vi.setSystemTime(new Date(2026, 7, 10, 9, 5))
    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 10, buy: 910_000, store: "SJC" })
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
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    const id = result.current.gold[0].id

    act(() => {
      result.current.updateGold(id, { date: "12/08/2026", phan: 25, buy: 950_000, store: "SJC" })
    })

    expect(result.current.gold).toHaveLength(1)
    expect(result.current.gold[0]).toEqual({
      id,
      date: "12/08/2026",
      phan: 25,
      buy: 950_000,
      store: "SJC",
    })
    expect(getStoredFinance().gold[0].buy).toBe(950_000)
  })

  it("addGold assigns distinct ids to two purchases added at the exact same instant", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 10, buy: 910_000, store: "SJC" })
    })

    expect(result.current.gold).toHaveLength(2)
    expect(result.current.gold[0].id).not.toBe(result.current.gold[1].id)
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

  it("addInvest assigns distinct ids to two investments added at the exact same instant", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.invests).toEqual([]))

    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    act(() => {
      result.current.addInvest({ name: "Quỹ cổ phiếu", cost: 10_000_000, value: 12_000_000 })
    })
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    act(() => {
      result.current.addInvest({ name: "Quỹ trái phiếu", cost: 5_000_000, value: 5_200_000 })
    })

    expect(result.current.invests).toHaveLength(2)
    expect(result.current.invests[0].id).not.toBe(result.current.invests[1].id)
  })

  it("replaceFinance overwrites the whole state and persists it, e.g. after restoring a backup", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    const restored = {
      savings: [{ name: "Quỹ mới", amount: 1, target: 2 }],
      cards: [],
      gold: [],
      goldStores: [{ name: "SJC", price: "935.000" }],
      invests: [],
    }
    act(() => {
      result.current.replaceFinance(restored)
    })

    expect(result.current.savings).toEqual(restored.savings)
    expect(getStoredFinance().goldStores).toEqual([{ name: "SJC", price: "935.000" }])
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

  it("updateSavingsFund shows a success toast when the write succeeds", async () => {
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

    expect(toast.success).toHaveBeenCalledWith('Đã cập nhật quỹ tiết kiệm "Quỹ khẩn cấp"')
  })

  it("updateSavingsFund shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.savings).toEqual([]))

    act(() => {
      result.current.addSavingsFund({ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 })
    })

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.updateSavingsFund("Quỹ dự phòng", {
        name: "Quỹ khẩn cấp",
        amount: 8_000_000,
        target: 25_000_000,
      })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith(
      'Không thể cập nhật quỹ tiết kiệm "Quỹ khẩn cấp". Vui lòng thử lại.'
    )
    expect(result.current.savings[0].name).toBe("Quỹ dự phòng")
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

  it("updateCard shows a success toast when the write succeeds", async () => {
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

    expect(toast.success).toHaveBeenCalledWith('Đã cập nhật thẻ tín dụng "Thẻ A Visa"')
  })

  it("updateCard shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "15" })
    })

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
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
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith(
      'Không thể cập nhật thẻ tín dụng "Thẻ A Visa". Vui lòng thử lại.'
    )
    expect(result.current.cards[0].name).toBe("Thẻ A")
  })

  it("payCard shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "15" })
    })
    act(() => {
      result.current.payCard("Thẻ A", 500_000)
    })

    expect(toast.success).toHaveBeenCalledWith('Đã ghi nhận thanh toán cho thẻ "Thẻ A"')
  })

  it("payCard shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.cards).toEqual([]))

    act(() => {
      result.current.addCard({ name: "Thẻ A", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "15" })
    })

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.payCard("Thẻ A", 500_000)
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith("Không thể ghi nhận thanh toán. Vui lòng thử lại.")
    expect(result.current.cards[0].balance).toBe(2_000_000)
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
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
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
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith("Không thể thêm lần mua vàng. Vui lòng thử lại.")
    expect(result.current.gold).toEqual([])
  })

  it("updateGold shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    const id = result.current.gold[0].id

    act(() => {
      result.current.updateGold(id, { date: "12/08/2026", phan: 25, buy: 950_000, store: "SJC" })
    })

    expect(toast.success).toHaveBeenCalledWith("Đã cập nhật giao dịch vàng ngày 12/08/2026")
  })

  it("updateGold shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    const id = result.current.gold[0].id

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.updateGold(id, { date: "12/08/2026", phan: 25, buy: 950_000, store: "SJC" })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith("Không thể cập nhật giao dịch vàng. Vui lòng thử lại.")
    expect(result.current.gold[0].date).toBe("10/08/2026")
  })

  it("removeGold shows a success toast with the purchase's date when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.gold).toEqual([]))

    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
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
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
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

  it("setGoldStorePrice does not throw and leaves the price unchanged when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "900.000" })
    })

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    expect(() => {
      act(() => {
        result.current.setGoldStorePrice("SJC", "935.000")
      })
    }).not.toThrow()
    spy.mockRestore()

    expect(result.current.goldStores).toEqual([{ name: "SJC", price: "900.000" }])
  })

  it("addGoldStore shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })

    expect(toast.success).toHaveBeenCalledWith('Đã thêm cửa hàng "SJC"')
  })

  it("addGoldStore shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith('Không thể thêm cửa hàng "SJC". Vui lòng thử lại.')
    expect(result.current.goldStores).toEqual([])
  })

  it("addGoldStore shows an error toast when the name is already taken", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "800.000" })
    })

    expect(toast.error).toHaveBeenCalledWith('Đã có cửa hàng tên "SJC". Vui lòng chọn tên khác.')
  })

  it("updateGoldStore shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.updateGoldStore("SJC", { name: "SJC 9999", price: "940.000" })
    })

    expect(toast.success).toHaveBeenCalledWith('Đã cập nhật cửa hàng "SJC 9999"')
  })

  it("updateGoldStore shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.updateGoldStore("SJC", { name: "SJC 9999", price: "940.000" })
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith('Không thể cập nhật cửa hàng "SJC 9999". Vui lòng thử lại.')
    expect(result.current.goldStores).toEqual([{ name: "SJC", price: "935.000" }])
  })

  it("removeGoldStore shows a success toast when the write succeeds", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.removeGoldStore("SJC")
    })

    expect(toast.success).toHaveBeenCalledWith('Đã xoá cửa hàng "SJC"')
  })

  it("removeGoldStore shows an error toast and does not update state when storage write fails", async () => {
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    act(() => {
      result.current.removeGoldStore("SJC")
    })
    spy.mockRestore()

    expect(toast.error).toHaveBeenCalledWith('Không thể xoá cửa hàng "SJC". Vui lòng thử lại.')
    expect(result.current.goldStores).toEqual([{ name: "SJC", price: "935.000" }])
  })

  it("removeGoldStore shows an error toast when the store still has purchases attached", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useFinance())
    await waitFor(() => expect(result.current.goldStores).toEqual([]))

    act(() => {
      result.current.addGoldStore({ name: "SJC", price: "935.000" })
    })
    act(() => {
      result.current.addGold({ date: "10/08/2026", phan: 20, buy: 900_000, store: "SJC" })
    })
    act(() => {
      result.current.removeGoldStore("SJC")
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Không thể xoá "SJC" vì vẫn còn giao dịch mua vàng gắn với cửa hàng này.'
    )
  })
})
