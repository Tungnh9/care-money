import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { useBudget } from "../../hooks/use-budget"
import { DEFAULT_BUDGET_STATE, getStoredBudget } from "../../budget-storage"
import { DEFAULT_FINANCE_STATE, setStoredFinance } from "@/features/finance/finance-storage"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("useBudget", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("seeds an empty state when localStorage is empty", async () => {
    const { result } = renderHook(() => useBudget())

    await waitFor(() => expect(result.current.salaries).toEqual(DEFAULT_BUDGET_STATE.salaries))
    expect(result.current.expenses).toEqual([])
    expect(result.current.settlements).toEqual([])
  })

  it("setSalary creates a new entry when none exists for that month", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.salaries).toEqual([]))

    act(() => {
      result.current.setSalary("2026-09", 20_000_000)
    })

    expect(result.current.salaries).toEqual([{ month: "2026-09", amount: 20_000_000 }])
    expect(getStoredBudget().salaries).toEqual([{ month: "2026-09", amount: 20_000_000 }])
  })

  it("setSalary upserts (updates) the existing entry for that month instead of duplicating it", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.salaries).toEqual([]))

    act(() => result.current.setSalary("2026-09", 20_000_000))
    act(() => result.current.setSalary("2026-09", 22_000_000))

    expect(result.current.salaries).toEqual([{ month: "2026-09", amount: 22_000_000 }])
  })

  it("addExpense appends an expense with a freshly generated unique id", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.expenses).toEqual([]))

    act(() => {
      result.current.addExpense({ dayKey: "2026-09-01", amount: 50_000, tag: null })
    })

    expect(result.current.expenses).toHaveLength(1)
    expect(result.current.expenses[0]).toMatchObject({ dayKey: "2026-09-01", amount: 50_000, tag: null })
    expect(typeof result.current.expenses[0].id).toBe("number")
  })

  it("removeExpense removes only the targeted id", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.expenses).toEqual([]))

    act(() => result.current.addExpense({ dayKey: "2026-09-01", amount: 10_000, tag: null }))
    act(() => result.current.addExpense({ dayKey: "2026-09-02", amount: 20_000, tag: null }))
    const keepId = result.current.expenses[0].id
    const removeId = result.current.expenses[1].id

    act(() => result.current.removeExpense(removeId))

    expect(result.current.expenses.map((e) => e.id)).toEqual([keepId])
  })

  it("updateExpense changes only the targeted expense's fields, leaving its id and others untouched", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.expenses).toEqual([]))

    act(() => result.current.addExpense({ dayKey: "2026-09-01", amount: 10_000, tag: null }))
    act(() => result.current.addExpense({ dayKey: "2026-09-02", amount: 20_000, tag: null }))
    const keepId = result.current.expenses[0].id
    const editId = result.current.expenses[1].id

    act(() =>
      result.current.updateExpense(editId, {
        amount: 99_000,
        tag: { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" },
        note: "Sửa rồi",
      })
    )

    expect(result.current.expenses.find((e) => e.id === editId)).toMatchObject({
      amount: 99_000,
      tag: { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" },
      note: "Sửa rồi",
    })
    expect(result.current.expenses.find((e) => e.id === keepId)).toMatchObject({ amount: 20_000 })
    expect(getStoredBudget().expenses.find((e) => e.id === editId)).toMatchObject({ amount: 99_000 })
  })

  describe("confirmSettlement", () => {
    beforeEach(() => {
      setStoredFinance({
        ...DEFAULT_FINANCE_STATE,
        savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }],
      })
    })

    it("writes fundAmountBefore/After from a fresh read of the fund and appends a settlement", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      act(() => {
        result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 50_000)
      })

      expect(result.current.settlements).toHaveLength(1)
      expect(result.current.settlements[0]).toMatchObject({
        month: "2026-09",
        fundName: "Quỹ A",
        direction: "deposit",
        amount: 50_000,
        fundAmountBefore: 100_000,
        fundAmountAfter: 150_000,
      })
    })

    it("aborts and writes nothing to budget storage when the fund no longer exists", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      act(() => {
        result.current.confirmSettlement("2026-09", "Quỹ không tồn tại", "deposit", 50_000)
      })

      expect(result.current.settlements).toEqual([])
      expect(toast.error).toHaveBeenCalled()
    })

    it("aborts when the fund's current balance is insufficient for a withdraw", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      act(() => {
        result.current.confirmSettlement("2026-09", "Quỹ A", "withdraw", 999_999)
      })

      expect(result.current.settlements).toEqual([])
      expect(toast.error).toHaveBeenCalled()
    })

    it("two settlements in the same month for the same fund both persist", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      act(() => result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 10_000))
      act(() => result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 20_000))

      expect(result.current.settlements).toHaveLength(2)
    })
  })
})
