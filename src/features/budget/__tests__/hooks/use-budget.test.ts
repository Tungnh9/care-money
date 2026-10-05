import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { useBudget } from "../../hooks/use-budget"
import { BUDGET_STORAGE_KEY, DEFAULT_BUDGET_STATE, getStoredBudget, setStoredBudget } from "../../budget-storage"
import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  setStoredFinance,
} from "@/features/finance/finance-storage"

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

  it("names the month in words in the salary toast", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.salaries).toEqual([]))

    act(() => result.current.setSalary("2026-09", 20_000_000))

    expect(toast.success).toHaveBeenCalledWith("Đã lưu lương tháng 9, 2026")
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

    it("reports whether the settlement went through", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      const outcomes: boolean[] = []
      act(() => {
        outcomes.push(result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 50_000))
        outcomes.push(result.current.confirmSettlement("2026-09", "Quỹ không tồn tại", "deposit", 50_000))
        outcomes.push(result.current.confirmSettlement("2026-09", "Quỹ A", "withdraw", 999_999))
      })

      expect(outcomes).toEqual([true, false, false])
    })

    it("takes a deposit back out of the fund when the settlement history cannot be saved, so a retry cannot deposit twice", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      const realSetItem = Storage.prototype.setItem
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
        if (key === BUDGET_STORAGE_KEY) throw new Error("QuotaExceededError")
        realSetItem.call(window.localStorage, key, value)
      })
      let ok: boolean | undefined
      act(() => {
        ok = result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 50_000)
      })
      spy.mockRestore()

      expect(ok).toBe(false)
      expect(getStoredFinance().savings[0].amount).toBe(100_000)
      expect(getStoredBudget().settlements).toEqual([])
      expect(toast.error).toHaveBeenCalledWith(
        "Không thể ghi lại lịch sử tất toán — số dư quỹ vẫn giữ nguyên. Vui lòng thử lại."
      )
    })

    it("puts a withdrawal back when the settlement history cannot be saved", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      const realSetItem = Storage.prototype.setItem
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
        if (key === BUDGET_STORAGE_KEY) throw new Error("QuotaExceededError")
        realSetItem.call(window.localStorage, key, value)
      })
      let ok: boolean | undefined
      act(() => {
        ok = result.current.confirmSettlement("2026-09", "Quỹ A", "withdraw", 30_000)
      })
      spy.mockRestore()

      expect(ok).toBe(false)
      expect(getStoredFinance().savings[0].amount).toBe(100_000)
      expect(getStoredBudget().settlements).toEqual([])
    })

    it("tells the user to check the fund when neither the history nor the fund rollback can be saved", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      const realSetItem = Storage.prototype.setItem
      let financeWrites = 0
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
        if (key === BUDGET_STORAGE_KEY) throw new Error("QuotaExceededError")
        // Lần ghi quỹ đầu (áp tiền) qua được, lần thứ 2 (trả lại) cũng lỗi.
        if (key === FINANCE_STORAGE_KEY && ++financeWrites > 1) throw new Error("QuotaExceededError")
        realSetItem.call(window.localStorage, key, value)
      })
      let ok: boolean | undefined
      act(() => {
        ok = result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 50_000)
      })
      spy.mockRestore()

      expect(ok).toBe(false)
      expect(toast.error).toHaveBeenCalledWith(
        'Không thể ghi lại lịch sử tất toán và không trả lại được số dư quỹ "Quỹ A". Kiểm tra lại số dư ở màn Tài chính.'
      )
      expect(getStoredFinance().savings[0].amount).toBe(150_000)
    })

    it("shows an error instead of throwing when the fund balance itself cannot be saved", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      // Lần setItem đầu tiên trong confirmSettlement là lần ghi quỹ của applySavingsFundDelta.
      const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError")
      })
      let ok: boolean | undefined
      act(() => {
        ok = result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 50_000)
      })
      spy.mockRestore()

      expect(ok).toBe(false)
      expect(toast.error).toHaveBeenCalledWith('Không thể cập nhật số dư quỹ "Quỹ A". Vui lòng thử lại.')
      expect(getStoredFinance().savings[0].amount).toBe(100_000)
      expect(getStoredBudget().settlements).toEqual([])
    })
  })
})

describe("useBudget — dữ liệu do nơi khác ghi", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps the salary and expenses another tab saved when adding an expense here, with a fresh id", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.expenses).toEqual([]))

    // Ghi thẳng, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_BUDGET_STATE,
        salaries: [{ month: "2026-09", amount: 20_000_000 }],
        expenses: [{ id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null }],
      })
    )
    act(() => {
      result.current.addExpense({ dayKey: "2026-09-02", amount: 10_000, tag: null })
    })

    expect(getStoredBudget().salaries).toEqual([{ month: "2026-09", amount: 20_000_000 }])
    expect(getStoredBudget().expenses.map((e) => e.id).sort((a, b) => a - b)).toEqual([1, 2])
  })

  it("keeps the expense and settlement another tab saved when confirming a settlement here, with a fresh id", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ A", amount: 100_000, target: 500_000 }],
    })
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.settlements).toEqual([]))

    // Ghi thẳng, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_BUDGET_STATE,
        expenses: [{ id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null }],
        settlements: [
          {
            id: 1,
            month: "2026-08",
            at: "2026-08-31T00:00:00.000Z",
            direction: "deposit",
            amount: 20_000,
            fundName: "Quỹ A",
            fundAmountBefore: 80_000,
            fundAmountAfter: 100_000,
          },
        ],
      })
    )
    act(() => {
      result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 50_000)
    })

    const stored = getStoredBudget()
    expect(stored.expenses.map((e) => e.id)).toEqual([1])
    expect(stored.settlements.map((s) => s.id)).toEqual([1, 2])
    expect(stored.settlements[1]).toMatchObject({
      month: "2026-09",
      fundName: "Quỹ A",
      fundAmountBefore: 100_000,
      fundAmountAfter: 150_000,
    })
  })

  it("shows expenses another tab added without reloading the page", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.expenses).toEqual([]))

    act(() => {
      window.localStorage.setItem(
        BUDGET_STORAGE_KEY,
        JSON.stringify({
          ...DEFAULT_BUDGET_STATE,
          expenses: [{ id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null }],
        })
      )
      window.dispatchEvent(new StorageEvent("storage", { key: BUDGET_STORAGE_KEY }))
    })

    expect(result.current.expenses).toHaveLength(1)
  })

  it("shows budget data written after this page mounted, e.g. a cloud pull that finished late", async () => {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.salaries).toEqual([]))

    // Trang Cài đặt đã unmount nhưng lần ghi của "Tải xuống" vẫn đi qua setStoredBudget (có notifyDataChanged).
    act(() => {
      setStoredBudget({ ...DEFAULT_BUDGET_STATE, salaries: [{ month: "2026-09", amount: 20_000_000 }] })
    })

    expect(result.current.salaries).toEqual([{ month: "2026-09", amount: 20_000_000 }])
  })
})
