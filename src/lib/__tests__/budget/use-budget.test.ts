import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { toast } from "sonner"

import { MoneyVisibilityProvider, useMoneyVisibility } from "@/components/money-visibility-provider"
import { useBudget } from "@/lib/budget/use-budget"
import { BUDGET_STORAGE_KEY, DEFAULT_BUDGET_STATE, getStoredBudget, setStoredBudget } from "@/lib/budget/budget-storage"
import { totalExpensesForMonth } from "@/lib/budget/budget-calculations"
import type { CardLink, Expense } from "@/lib/budget/types"
import { dayKeyFromIso } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  setStoredFinance,
} from "@/lib/finance/finance-storage"

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

  it("reports hydrated only once the stored data has been read", async () => {
    const seen: boolean[] = []
    renderHook(() => {
      const budget = useBudget()
      seen.push(budget.hydrated)
      return budget
    })

    expect(seen[0]).toBe(false)
    await waitFor(() => expect(seen[seen.length - 1]).toBe(true))
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

    it("stamps the settlement with the moment of confirmation as an ISO string", async () => {
      vi.setSystemTime(new Date(2026, 8, 30, 23, 30))
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      act(() => {
        result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 50_000)
      })

      const at = result.current.settlements[0].at
      expect(at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(dayKeyFromIso(at)).toBe("2026-09-30")
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

    it("hides the amount in the not-enough-balance toast while money is hidden", async () => {
      window.localStorage.setItem("hide-money", "1")
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(MoneyVisibilityProvider, null, children)
      const { result } = renderHook(() => ({ budget: useBudget(), visibility: useMoneyVisibility() }), {
        wrapper,
      })
      await waitFor(() => expect(result.current.visibility.hidden).toBe(true))

      act(() => {
        result.current.budget.confirmSettlement("2026-09", "Quỹ A", "withdraw", 999_999)
      })

      expect(toast.error).toHaveBeenCalledWith('Quỹ "Quỹ A" không đủ số dư để rút •••••••• ₫.')
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
      expect(toast.success).toHaveBeenCalledTimes(1)
    })

    it("names the settled month in the success toast", async () => {
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      act(() => {
        result.current.confirmSettlement("2026-08", "Quỹ A", "deposit", 50_000)
      })

      expect(toast.success).toHaveBeenCalledWith("Đã tất toán tháng 8, 2026")
    })

    it("takes a deposit back out of the fund when the settlement history cannot be saved", async () => {
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
      expect(toast.success).not.toHaveBeenCalled()
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
      expect(toast.success).not.toHaveBeenCalled()
      expect(getStoredFinance().savings[0].amount).toBe(100_000)
      expect(getStoredBudget().settlements).toEqual([])
    })

    it("keeps the settlement after a reload when the fund balance had a fraction of a đồng", async () => {
      setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 150_000.5, target: 500_000 }] })
      const { result } = renderHook(() => useBudget())
      await waitFor(() => expect(result.current.settlements).toEqual([]))

      act(() => {
        result.current.confirmSettlement("2026-09", "Quỹ A", "deposit", 300_000)
      })

      expect(getStoredBudget().settlements).toHaveLength(1)
      expect(getStoredBudget().settlements[0]).toMatchObject({ fundAmountBefore: 150_000.5, fundAmountAfter: 450_000.5 })
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

describe("useBudget — nợ thẻ", () => {
  const TAG_SWIPE = { label: "Quẹt thẻ", emoji: "🧾", tint: "#F0ECFE" }
  const TAG_PAYMENT = { label: "Trả nợ thẻ", emoji: "🏦", tint: "#FFE0C7" }
  const TAG_FOOD = { label: "Ăn uống", emoji: "🍜", tint: "#FFF4D6" }
  const CARDS = [
    { name: "Visa", balance: 2_000_000, min: 0, limit: 50_000_000, due: "15" },
    { name: "Master", balance: 0, min: 0, limit: 10_000_000, due: "5" },
  ]

  const debt = (name: string) => getStoredFinance().cards.find((c) => c.name === name)?.balance
  const swipeLink = (cardName: string | null = "Visa"): CardLink => ({ kind: "swipe", cardName })
  const paymentLink = (cardName: string | null = "Visa"): CardLink => ({ kind: "payment", cardName })
  const swipe = (amount: number, cardName = "Visa") => ({
    dayKey: "2026-11-03",
    amount,
    tag: TAG_SWIPE,
    card: swipeLink(cardName),
  })
  const payment = (amount: number) => ({ dayKey: "2026-11-01", amount, tag: TAG_PAYMENT, card: paymentLink() })
  const storedExpense = (id: number) => getStoredBudget().expenses.find((e) => e.id === id)
  const setVisaDebt = (balance: number) => {
    const finance = getStoredFinance()
    setStoredFinance({ ...finance, cards: finance.cards.map((c) => (c.name === "Visa" ? { ...c, balance } : c)) })
  }

  // act() không trả giá trị của callback — lấy giá trị trả về của addExpense/updateExpense/removeExpense.
  function run<T>(fn: () => T): T {
    let out: T | undefined
    act(() => {
      out = fn()
    })
    return out as T
  }

  async function renderBudget() {
    const { result } = renderHook(() => useBudget())
    await waitFor(() => expect(result.current.hydrated).toBe(true))
    return result
  }

  // Thêm 1 khoản rồi trả id của nó (khoản mới nằm đầu mảng).
  function addAndGetId(
    result: { current: ReturnType<typeof useBudget> },
    input: ReturnType<typeof swipe> | ReturnType<typeof payment>
  ) {
    expect(run(() => result.current.addExpense(input))).toBe(true)
    return getStoredBudget().expenses[0].id
  }

  function seedExpenses(expenses: Expense[]) {
    setStoredBudget({ ...DEFAULT_BUDGET_STATE, expenses })
  }

  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, cards: CARDS })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("a swipe raises the card's debt and is saved with its link", async () => {
    const result = await renderBudget()

    const ok = run(() => result.current.addExpense(swipe(500_000)))

    expect(ok).toBe(true)
    expect(debt("Visa")).toBe(2_500_000)
    expect(debt("Master")).toBe(0)
    expect(getStoredBudget().expenses).toEqual([
      expect.objectContaining({ dayKey: "2026-11-03", amount: 500_000, tag: TAG_SWIPE, card: swipeLink() }),
    ])
    expect(result.current.expenses).toHaveLength(1)
  })

  it("a payment lowers the card's debt and still counts as spending", async () => {
    const result = await renderBudget()

    const ok = run(() => result.current.addExpense(payment(800_000)))

    expect(ok).toBe(true)
    expect(debt("Visa")).toBe(1_200_000)
    expect(getStoredBudget().expenses).toEqual([expect.objectContaining({ amount: 800_000, card: paymentLink() })])
    expect(totalExpensesForMonth(getStoredBudget().expenses, "2026-11")).toBe(800_000)
  })

  it("refuses a payment larger than the debt and writes nothing", async () => {
    const result = await renderBudget()

    const ok = run(() => result.current.addExpense(payment(2_000_001)))

    expect(ok).toBe(false)
    expect(debt("Visa")).toBe(2_000_000)
    expect(getStoredBudget().expenses).toEqual([])
    expect(toast.error).toHaveBeenCalledWith(`Thẻ "Visa" chỉ còn nợ ${formatMoney(2_000_000)}.`)
  })

  it("refuses a swipe on a card that no longer exists", async () => {
    const result = await renderBudget()

    const ok = run(() => result.current.addExpense(swipe(500_000, "Amex")))

    expect(ok).toBe(false)
    expect(getStoredFinance().cards).toEqual(CARDS)
    expect(getStoredBudget().expenses).toEqual([])
    expect(toast.error).toHaveBeenCalledWith('Không tìm thấy thẻ "Amex" ở trang Tài chính.')
  })

  it("editing a swipe's amount moves the debt by the difference only", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, swipe(500_000))

    expect(run(() => result.current.updateExpense(id, { amount: 700_000, tag: TAG_SWIPE }))).toBe(true)
    expect(debt("Visa")).toBe(2_700_000)
    expect(storedExpense(id)).toMatchObject({ amount: 700_000, card: swipeLink() })

    expect(run(() => result.current.updateExpense(id, { amount: 200_000, tag: TAG_SWIPE }))).toBe(true)
    expect(debt("Visa")).toBe(2_200_000)
    expect(getStoredBudget().expenses).toHaveLength(1)
    expect(storedExpense(id)).toMatchObject({ amount: 200_000, card: swipeLink() })
    expect(toast.success).toHaveBeenCalledWith("Đã cập nhật khoản chi")
  })

  it("editing a payment's amount moves the debt the other way", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, payment(500_000))
    expect(debt("Visa")).toBe(1_500_000)

    expect(run(() => result.current.updateExpense(id, { amount: 600_000, tag: TAG_PAYMENT }))).toBe(true)

    expect(debt("Visa")).toBe(1_400_000)
    expect(storedExpense(id)).toMatchObject({ amount: 600_000, card: paymentLink() })
  })

  it("does not touch the debt when an edit only changes the note", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, swipe(500_000))

    const ok = run(() => result.current.updateExpense(id, { amount: 500_000, note: "Cà phê", tag: TAG_SWIPE }))

    expect(ok).toBe(true)
    expect(debt("Visa")).toBe(2_500_000)
    expect(storedExpense(id)).toMatchObject({ amount: 500_000, note: "Cà phê", card: swipeLink() })
    expect(toast.success).toHaveBeenCalledWith("Đã cập nhật khoản chi")
  })

  it("refuses an edit that would push the debt below zero", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, payment(2_000_000))
    expect(debt("Visa")).toBe(0)

    const ok = run(() => result.current.updateExpense(id, { amount: 2_100_000, tag: TAG_PAYMENT }))

    expect(ok).toBe(false)
    expect(debt("Visa")).toBe(0)
    expect(storedExpense(id)).toMatchObject({ amount: 2_000_000 })
    expect(toast.error).toHaveBeenCalledWith(`Không thể lưu: thẻ "Visa" chỉ còn nợ ${formatMoney(0)}.`)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("keeps a linked expense's tag and card when an edit passes a different tag", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, swipe(500_000))

    const ok = run(() => result.current.updateExpense(id, { amount: 600_000, note: "Sửa", tag: TAG_FOOD }))

    expect(ok).toBe(true)
    expect(debt("Visa")).toBe(2_600_000)
    expect(storedExpense(id)).toEqual({
      id,
      dayKey: "2026-11-03",
      amount: 600_000,
      note: "Sửa",
      tag: TAG_SWIPE,
      card: swipeLink(),
    })
  })

  it("deleting a swipe takes it back off the debt", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, swipe(500_000))
    expect(debt("Visa")).toBe(2_500_000)

    expect(run(() => result.current.removeExpense(id))).toBe(true)

    expect(debt("Visa")).toBe(2_000_000)
    expect(getStoredBudget().expenses).toEqual([])
    expect(toast.success).toHaveBeenCalledWith("Đã xoá khoản chi")
  })

  it("deleting a payment puts it back on the debt", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, payment(500_000))
    expect(debt("Visa")).toBe(1_500_000)

    expect(run(() => result.current.removeExpense(id))).toBe(true)

    expect(debt("Visa")).toBe(2_000_000)
    expect(getStoredBudget().expenses).toEqual([])
  })

  it("refuses to delete a swipe the card no longer owes, writing nothing", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, swipe(500_000))
    expect(debt("Visa")).toBe(2_500_000)
    // Đã trả bớt ở nơi khác (trang Tài chính / tab khác).
    act(() => setVisaDebt(200_000))

    const ok = run(() => result.current.removeExpense(id))

    expect(ok).toBe(false)
    expect(storedExpense(id)).toMatchObject({ amount: 500_000, card: swipeLink() })
    expect(debt("Visa")).toBe(200_000)
    expect(toast.error).toHaveBeenCalledWith(
      `Không thể xoá: thẻ "Visa" chỉ còn nợ ${formatMoney(200_000)}, ít hơn khoản quẹt ${formatMoney(500_000)} này.`
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("edits and deletes a linked expense whose card was deleted without touching any debt", async () => {
    seedExpenses([
      { id: 1, dayKey: "2026-11-03", amount: 500_000, tag: TAG_SWIPE, card: swipeLink(null) },
      { id: 2, dayKey: "2026-11-04", amount: 300_000, tag: TAG_PAYMENT, card: paymentLink(null) },
    ])
    const result = await renderBudget()

    expect(run(() => result.current.updateExpense(1, { amount: 900_000, tag: TAG_SWIPE }))).toBe(true)
    expect(run(() => result.current.updateExpense(2, { amount: 100_000, tag: TAG_PAYMENT }))).toBe(true)
    expect(storedExpense(1)).toMatchObject({ amount: 900_000, card: swipeLink(null) })
    expect(storedExpense(2)).toMatchObject({ amount: 100_000, card: paymentLink(null) })
    expect(getStoredFinance().cards).toEqual(CARDS)

    expect(run(() => result.current.removeExpense(1))).toBe(true)
    expect(run(() => result.current.removeExpense(2))).toBe(true)
    expect(getStoredBudget().expenses).toEqual([])
    expect(getStoredFinance().cards).toEqual(CARDS)
    expect(toast.success).toHaveBeenCalledWith("Đã cập nhật khoản chi")
    expect(toast.success).toHaveBeenCalledWith("Đã xoá khoản chi")
  })

  it("edits and deletes when the linked card is missing, telling the debt did not change", async () => {
    seedExpenses([{ id: 1, dayKey: "2026-11-03", amount: 500_000, tag: TAG_SWIPE, card: swipeLink("Amex") }])
    const result = await renderBudget()

    expect(run(() => result.current.updateExpense(1, { amount: 600_000, tag: TAG_SWIPE }))).toBe(true)
    expect(storedExpense(1)).toMatchObject({ amount: 600_000, card: swipeLink("Amex") })
    expect(getStoredFinance().cards).toEqual(CARDS)
    expect(toast.success).toHaveBeenCalledWith(
      'Đã cập nhật khoản chi. Thẻ "Amex" không còn ở trang Tài chính nên nợ thẻ không đổi.'
    )

    expect(run(() => result.current.removeExpense(1))).toBe(true)
    expect(getStoredBudget().expenses).toEqual([])
    expect(getStoredFinance().cards).toEqual(CARDS)
    expect(toast.success).toHaveBeenCalledWith(
      'Đã xoá khoản chi. Thẻ "Amex" không còn ở trang Tài chính nên nợ thẻ không đổi.'
    )
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("never touches the debt for an old Trả nợ thẻ expense without a card link", async () => {
    seedExpenses([{ id: 1, dayKey: "2026-10-05", amount: 5_317_725, tag: TAG_PAYMENT }])
    const result = await renderBudget()
    expect(totalExpensesForMonth(getStoredBudget().expenses, "2026-10")).toBe(5_317_725)

    expect(run(() => result.current.updateExpense(1, { amount: 5_000_000, tag: TAG_PAYMENT }))).toBe(true)
    expect(storedExpense(1)).toEqual({ id: 1, dayKey: "2026-10-05", amount: 5_000_000, tag: TAG_PAYMENT })
    expect(totalExpensesForMonth(getStoredBudget().expenses, "2026-10")).toBe(5_000_000)
    expect(getStoredFinance().cards).toEqual(CARDS)

    expect(run(() => result.current.removeExpense(1))).toBe(true)
    expect(getStoredBudget().expenses).toEqual([])
    expect(getStoredFinance().cards).toEqual(CARDS)
  })

  it("does not link a plain expense to a card when an edit passes extra fields", async () => {
    seedExpenses([{ id: 1, dayKey: "2026-11-05", amount: 100_000, tag: TAG_FOOD }])
    const result = await renderBudget()
    const withStrayCard = { amount: 200_000, tag: TAG_SWIPE, card: swipeLink() }

    expect(run(() => result.current.updateExpense(1, withStrayCard))).toBe(true)

    expect(storedExpense(1)).toEqual({ id: 1, dayKey: "2026-11-05", amount: 200_000, tag: TAG_SWIPE })
    expect(getStoredFinance().cards).toEqual(CARDS)
  })

  describe("when budget-data cannot be saved", () => {
    let financeWritesLeft: number
    let spy: { mockRestore: () => void } | undefined

    // Ghi budget-data luôn lỗi; ghi finance-data chỉ qua được `financeWrites` lần đầu (Infinity = luôn qua).
    function breakBudgetWrites(financeWrites = Infinity) {
      financeWritesLeft = financeWrites
      const realSetItem = Storage.prototype.setItem
      spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
        if (key === BUDGET_STORAGE_KEY) throw new Error("QuotaExceededError")
        if (key === FINANCE_STORAGE_KEY && financeWritesLeft-- <= 0) throw new Error("QuotaExceededError")
        realSetItem.call(window.localStorage, key, value)
      })
    }

    afterEach(() => {
      spy?.mockRestore()
      spy = undefined
    })

    it("puts the debt back when the expense cannot be saved", async () => {
      const result = await renderBudget()

      breakBudgetWrites()
      const ok = run(() => result.current.addExpense(swipe(500_000)))

      expect(ok).toBe(false)
      expect(debt("Visa")).toBe(2_000_000)
      expect(getStoredBudget().expenses).toEqual([])
      expect(toast.error).toHaveBeenCalledWith(
        'Không thể lưu khoản chi — nợ thẻ "Visa" vẫn giữ nguyên. Vui lòng thử lại.'
      )
    })

    it("puts the debt back when an edit or a delete cannot be saved", async () => {
      const result = await renderBudget()
      const swipeId = addAndGetId(result, swipe(500_000))
      const paymentId = addAndGetId(result, payment(300_000))
      expect(debt("Visa")).toBe(2_200_000)

      breakBudgetWrites()
      const outcomes = [
        run(() => result.current.updateExpense(swipeId, { amount: 900_000, tag: TAG_SWIPE })),
        run(() => result.current.updateExpense(paymentId, { amount: 100_000, tag: TAG_PAYMENT })),
        run(() => result.current.removeExpense(swipeId)),
        run(() => result.current.removeExpense(paymentId)),
      ]

      expect(outcomes).toEqual([false, false, false, false])
      expect(debt("Visa")).toBe(2_200_000)
      expect(storedExpense(swipeId)).toMatchObject({ amount: 500_000 })
      expect(storedExpense(paymentId)).toMatchObject({ amount: 300_000 })
      expect(toast.error).toHaveBeenCalledTimes(4)
      expect(toast.error).toHaveBeenCalledWith(
        'Không thể lưu khoản chi — nợ thẻ "Visa" vẫn giữ nguyên. Vui lòng thử lại.'
      )
      expect(toast.success).not.toHaveBeenCalled()
    })

    it("tells the user to check the debt when neither the expense nor the rollback can be saved", async () => {
      const result = await renderBudget()

      // Lần ghi nợ đầu (cộng nợ) qua được, lần thứ 2 (đảo lại) cũng lỗi.
      breakBudgetWrites(1)
      const ok = run(() => result.current.addExpense(swipe(500_000)))

      expect(ok).toBe(false)
      expect(toast.error).toHaveBeenCalledWith(
        'Không thể lưu khoản chi và không trả lại được nợ thẻ "Visa". Kiểm tra lại dư nợ ở màn Tài chính.'
      )
      expect(debt("Visa")).toBe(2_500_000)
      expect(getStoredBudget().expenses).toEqual([])
    })

    it("keeps the plain error for an expense without a card link", async () => {
      const result = await renderBudget()

      breakBudgetWrites()
      const ok = run(() => result.current.addExpense({ dayKey: "2026-11-05", amount: 100_000, tag: TAG_FOOD }))

      expect(ok).toBe(false)
      expect(toast.error).toHaveBeenCalledWith("Không thể ghi khoản chi. Vui lòng thử lại.")
      expect(getStoredFinance().cards).toEqual(CARDS)
    })
  })

  it("shows an error instead of throwing when the debt itself cannot be saved", async () => {
    const result = await renderBudget()
    const id = addAndGetId(result, swipe(500_000))
    expect(debt("Visa")).toBe(2_500_000)

    const realSetItem = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
      if (key === FINANCE_STORAGE_KEY) throw new Error("QuotaExceededError")
      realSetItem.call(window.localStorage, key, value)
    })
    const outcomes = [
      run(() => result.current.addExpense(swipe(100_000))),
      run(() => result.current.updateExpense(id, { amount: 700_000, tag: TAG_SWIPE })),
      run(() => result.current.removeExpense(id)),
    ]
    spy.mockRestore()

    expect(outcomes).toEqual([false, false, false])
    expect(toast.error).toHaveBeenCalledTimes(3)
    expect(toast.error).toHaveBeenCalledWith('Không thể cập nhật nợ thẻ "Visa". Vui lòng thử lại.')
    expect(toast.success).not.toHaveBeenCalled()
    expect(debt("Visa")).toBe(2_500_000)
    expect(getStoredBudget().expenses).toEqual([expect.objectContaining({ id, amount: 500_000 })])
  })

  it("hides amounts in the debt toasts while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    const wrapper = ({ children }: { children: ReactNode }) => createElement(MoneyVisibilityProvider, null, children)
    const { result } = renderHook(() => ({ budget: useBudget(), visibility: useMoneyVisibility() }), { wrapper })
    await waitFor(() => expect(result.current.visibility.hidden).toBe(true))
    await waitFor(() => expect(result.current.budget.hydrated).toBe(true))

    expect(run(() => result.current.budget.addExpense(payment(2_000_001)))).toBe(false)
    expect(toast.error).toHaveBeenLastCalledWith('Thẻ "Visa" chỉ còn nợ •••••••• ₫.')

    expect(run(() => result.current.budget.addExpense(payment(2_000_000)))).toBe(true)
    const paymentId = getStoredBudget().expenses[0].id
    const editOk = run(() => result.current.budget.updateExpense(paymentId, { amount: 2_100_000, tag: TAG_PAYMENT }))
    expect(editOk).toBe(false)
    expect(toast.error).toHaveBeenLastCalledWith('Không thể lưu: thẻ "Visa" chỉ còn nợ •••••••• ₫.')

    expect(run(() => result.current.budget.addExpense(swipe(500_000)))).toBe(true)
    const swipeId = getStoredBudget().expenses[0].id
    act(() => setVisaDebt(200_000))
    expect(run(() => result.current.budget.removeExpense(swipeId))).toBe(false)
    expect(toast.error).toHaveBeenLastCalledWith(
      'Không thể xoá: thẻ "Visa" chỉ còn nợ •••••••• ₫, ít hơn khoản quẹt •••••••• ₫ này.'
    )
  })

  it("ends with the hand-computed debt after swipes, a start-of-month payment, an edit and a delete", async () => {
    const result = await renderBudget()

    const first = addAndGetId(result, swipe(300_000))
    const second = addAndGetId(result, swipe(450_000))
    addAndGetId(result, swipe(1_250_000))
    expect(debt("Visa")).toBe(4_000_000)

    addAndGetId(result, payment(2_000_000))
    expect(debt("Visa")).toBe(2_000_000)

    expect(run(() => result.current.updateExpense(second, { amount: 500_000, tag: TAG_SWIPE }))).toBe(true)
    expect(debt("Visa")).toBe(2_050_000)

    expect(run(() => result.current.removeExpense(first))).toBe(true)

    expect(debt("Visa")).toBe(1_750_000)
    expect(debt("Master")).toBe(0)
    const expenses = getStoredBudget().expenses
    expect(expenses.map((e) => e.amount).sort((a, b) => a - b)).toEqual([500_000, 1_250_000, 2_000_000])
    expect(totalExpensesForMonth(expenses, "2026-11")).toBe(2_000_000)
  })

  it("keeps a swipe another tab saved when adding one here", async () => {
    const result = await renderBudget()

    // Tab khác vừa quẹt 300.000 ₫: ghi thẳng cả hai key, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_BUDGET_STATE,
        expenses: [{ id: 1, dayKey: "2026-11-02", amount: 300_000, tag: TAG_SWIPE, card: swipeLink() }],
      })
    )
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...getStoredFinance(),
        cards: CARDS.map((c) => (c.name === "Visa" ? { ...c, balance: 2_300_000 } : c)),
      })
    )
    const ok = run(() => result.current.addExpense(swipe(500_000)))

    expect(ok).toBe(true)
    expect(debt("Visa")).toBe(2_800_000)
    const stored = getStoredBudget().expenses
    expect(stored.map((e) => e.id).sort((a, b) => a - b)).toEqual([1, 2])
    expect(stored.map((e) => e.amount).sort((a, b) => a - b)).toEqual([300_000, 500_000])
  })
})
