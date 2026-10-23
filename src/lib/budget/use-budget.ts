"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import {
  applyCardBalanceDelta,
  applySavingsFundDelta,
  type ApplyCardBalanceDeltaResult,
} from "@/lib/finance/finance-storage"
import { formatMonthKey } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { nextId } from "@/lib/next-id"
import { useStorageSync } from "@/lib/use-storage-sync"
import {
  BUDGET_STORAGE_KEY,
  DEFAULT_BUDGET_STATE,
  getStoredBudget,
  setStoredBudget,
  type BudgetState,
} from "@/lib/budget/budget-storage"
import { cardDebtDelta } from "@/lib/budget/card-link"
import type { CardLink, Expense, Settlement, SettlementDirection } from "@/lib/budget/types"

interface AddExpenseInput {
  dayKey: string
  amount: number
  note?: string
  tag: Expense["tag"]
  // Có thì `cardName` là tên 1 thẻ đang có ở trang Tài chính — nợ thẻ đó đổi theo khoản chi.
  card?: CardLink
}

interface UpdateExpenseInput {
  amount: number
  note?: string
  tag: Expense["tag"]
}

// applySavingsFundDelta ghi thẳng finance-data nên có thể ném (localStorage đầy) — gói lại để
// confirmSettlement luôn tự báo lỗi bằng toast thay vì để lỗi văng ra khỏi click handler.
function applyFundDeltaSafely(
  fundName: string,
  direction: SettlementDirection,
  amount: number
): ReturnType<typeof applySavingsFundDelta> | null {
  try {
    return applySavingsFundDelta(fundName, direction, amount)
  } catch {
    return null
  }
}

// Như applyFundDeltaSafely: applyCardBalanceDelta ghi thẳng finance-data nên có thể ném.
function applyCardDeltaSafely(cardName: string, delta: number): ApplyCardBalanceDeltaResult | null {
  try {
    return applyCardBalanceDelta(cardName, delta)
  } catch {
    return null
  }
}

// Kết quả bước 1 (ghi nợ thẻ) của 1 lần thêm/sửa/xoá khoản chi. "none": không đụng nợ thẻ — khoản
// không gắn thẻ (kể cả khoản "Trả nợ thẻ" cũ), thẻ đã xoá (cardName null), hoặc số tiền không đổi.
type CardDebtStep =
  | { status: "none" }
  | { status: "applied"; cardName: string; delta: number }
  | { status: "card-missing"; cardName: string }
  | { status: "insufficient-debt"; cardName: string; balance: number }
  | { status: "write-failed"; cardName: string }

// `amountChange`: số tiền khoản chi đổi bao nhiêu (thêm: +amount, sửa: mới − cũ, xoá: −amount).
function syncCardDebt(link: CardLink | undefined, amountChange: number): CardDebtStep {
  if (!link || link.cardName === null) return { status: "none" }
  const delta = cardDebtDelta(link.kind, amountChange)
  if (delta === 0) return { status: "none" }

  const { cardName } = link
  const result = applyCardDeltaSafely(cardName, delta)
  if (!result) return { status: "write-failed", cardName }
  if (result.ok) return { status: "applied", cardName, delta }
  if (result.reason === "card-not-found") return { status: "card-missing", cardName }
  return { status: "insufficient-debt", cardName, balance: result.balance }
}

function cardWriteFailedMessage(cardName: string): string {
  return `Không thể cập nhật nợ thẻ "${cardName}". Vui lòng thử lại.`
}

function useBudget() {
  const [state, setState] = useState<BudgetState>(DEFAULT_BUDGET_STATE)
  // false cho tới khi effect mount đọc xong localStorage: trước đó `state` là DEFAULT_BUDGET_STATE nên
  // "chưa có lương" chỉ là chưa đọc, không phải chưa nhập — chỗ nào hiện lời nhắc thì chờ cờ này.
  const [hydrated, setHydrated] = useState(false)
  const { hidden } = useMoneyVisibility()

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredBudget())
    setHydrated(true)
  }, [])

  // Tab khác thêm khoản chi, hay 1 lần tải xuống/nhập file ghi budget-data sau khi trang này đã mở.
  const reload = useCallback(() => setState(getStoredBudget()), [])
  useStorageSync(BUDGET_STORAGE_KEY, reload)

  const persist = useCallback((next: BudgetState) => {
    setStoredBudget(next)
    setState(next)
  }, [])

  // Mọi thao tác ghi dựng từ getStoredBudget() đọc tươi, không từ `state` trong closure — kể cả
  // nextId, để khoản chi mới không trùng id với khoản tab khác vừa thêm.

  const setSalary = useCallback(
    (month: string, amount: number) => {
      const current = getStoredBudget()
      try {
        const exists = current.salaries.some((s) => s.month === month)
        persist({
          ...current,
          salaries: exists
            ? current.salaries.map((s) => (s.month === month ? { ...s, amount } : s))
            : [...current.salaries, { month, amount }],
        })
        toast.success(`Đã lưu lương ${formatMonthKey(month).toLowerCase()}`)
      } catch {
        toast.error("Không thể lưu lương. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  // Bước 2 của thêm/sửa/xoá khoản chi: ghi budget-data. Ghi lỗi mà bước 1 đã đổi nợ thẻ thì đảo đúng
  // `delta` vừa áp, để nợ thẻ không lệch với danh sách khoản chi. Trả true khi ghi được.
  const persistExpenses = useCallback(
    (next: BudgetState, step: CardDebtStep, plainErrorMessage: string): boolean => {
      try {
        persist(next)
        return true
      } catch {
        if (step.status !== "applied") {
          toast.error(plainErrorMessage)
          return false
        }
        const reverted = applyCardDeltaSafely(step.cardName, -step.delta)
        toast.error(
          reverted?.ok
            ? `Không thể lưu khoản chi — nợ thẻ "${step.cardName}" vẫn giữ nguyên. Vui lòng thử lại.`
            : `Không thể lưu khoản chi và không trả lại được nợ thẻ "${step.cardName}". Kiểm tra lại dư nợ ở màn Tài chính.`
        )
        return false
      }
    },
    [persist]
  )

  // addExpense/updateExpense/removeExpense trả true khi khoản chi (và nợ thẻ nếu có) đã ghi xong — form
  // chỉ xoá ô nhập, modal chỉ đóng khi true. Mọi nhánh lỗi đã tự báo toast. Thứ tự ghi như
  // confirmSettlement: nợ thẻ trước (applyCardBalanceDelta đọc tươi finance-data), rồi khoản chi.

  const addExpense = useCallback(
    (input: AddExpenseInput): boolean => {
      // Thêm mà không thấy thẻ thì chặn: thẻ có thể vừa bị xoá ở tab khác.
      const step = syncCardDebt(input.card, input.amount)
      if (step.status === "write-failed") {
        toast.error(cardWriteFailedMessage(step.cardName))
        return false
      }
      if (step.status === "card-missing") {
        toast.error(`Không tìm thấy thẻ "${step.cardName}" ở trang Tài chính.`)
        return false
      }
      if (step.status === "insufficient-debt") {
        toast.error(`Thẻ "${step.cardName}" chỉ còn nợ ${formatMoney(step.balance, hidden)}.`)
        return false
      }

      const current = getStoredBudget()
      const expense: Expense = { ...input, id: nextId(current.expenses) }
      return persistExpenses(
        { ...current, expenses: [expense, ...current.expenses] },
        step,
        "Không thể ghi khoản chi. Vui lòng thử lại."
      )
    },
    [persistExpenses, hidden]
  )

  const updateExpense = useCallback(
    (id: number, input: UpdateExpenseInput): boolean => {
      const current = getStoredBudget()
      const original = current.expenses.find((e) => e.id === id)
      const step = syncCardDebt(original?.card, original ? input.amount - original.amount : 0)
      if (step.status === "write-failed") {
        toast.error(cardWriteFailedMessage(step.cardName))
        return false
      }
      if (step.status === "insufficient-debt") {
        toast.error(`Không thể lưu: thẻ "${step.cardName}" chỉ còn nợ ${formatMoney(step.balance, hidden)}.`)
        return false
      }

      // Khoản đã gắn thẻ giữ nguyên tag và card gốc (đổi nhãn/thẻ = xoá rồi ghi lại). Chỉ lấy đúng các
      // trường của UpdateExpenseInput, không spread `input`: 1 `card` lọt vào sẽ gắn thẻ mà chưa cộng nợ.
      const edited = (e: Expense): Expense => ({
        ...e,
        amount: input.amount,
        note: input.note,
        tag: e.card ? e.tag : input.tag,
      })
      const saved = persistExpenses(
        { ...current, expenses: current.expenses.map((e) => (e.id === id ? edited(e) : e)) },
        step,
        "Không thể cập nhật khoản chi. Vui lòng thử lại."
      )
      if (!saved) return false
      // Thẻ không còn (dữ liệu nhập file không khớp): vẫn sửa khoản chi, nói rõ nợ thẻ không đổi.
      toast.success(
        step.status === "card-missing"
          ? `Đã cập nhật khoản chi. Thẻ "${step.cardName}" không còn ở trang Tài chính nên nợ thẻ không đổi.`
          : "Đã cập nhật khoản chi"
      )
      return true
    },
    [persistExpenses, hidden]
  )

  const removeExpense = useCallback(
    (id: number): boolean => {
      const current = getStoredBudget()
      const original = current.expenses.find((e) => e.id === id)
      const amount = original?.amount ?? 0
      const step = syncCardDebt(original?.card, -amount)
      if (step.status === "write-failed") {
        toast.error(cardWriteFailedMessage(step.cardName))
        return false
      }
      if (step.status === "insufficient-debt") {
        // Xoá chỉ làm nợ giảm khi đó là khoản quẹt, nên chỉ khoản quẹt tới được nhánh này.
        toast.error(
          `Không thể xoá: thẻ "${step.cardName}" chỉ còn nợ ${formatMoney(step.balance, hidden)}, ít hơn khoản quẹt ${formatMoney(amount, hidden)} này.`
        )
        return false
      }

      const saved = persistExpenses(
        { ...current, expenses: current.expenses.filter((e) => e.id !== id) },
        step,
        "Không thể xoá khoản chi. Vui lòng thử lại."
      )
      if (!saved) return false
      toast.success(
        step.status === "card-missing"
          ? `Đã xoá khoản chi. Thẻ "${step.cardName}" không còn ở trang Tài chính nên nợ thẻ không đổi.`
          : "Đã xoá khoản chi"
      )
      return true
    },
    [persistExpenses, hidden]
  )

  // Trả true khi CẢ số dư quỹ lẫn lịch sử tất toán đã ghi xong — SettleMonthModal chỉ đóng khi true.
  // Mọi nhánh lỗi đã tự báo toast.
  const confirmSettlement = useCallback(
    (month: string, fundName: string, direction: SettlementDirection, amount: number): boolean => {
      const result = applyFundDeltaSafely(fundName, direction, amount)
      if (!result) {
        toast.error(`Không thể cập nhật số dư quỹ "${fundName}". Vui lòng thử lại.`)
        return false
      }
      if (!result.ok) {
        toast.error(
          result.reason === "fund-not-found"
            ? `Không tìm thấy quỹ "${fundName}".`
            : `Quỹ "${fundName}" không đủ số dư để rút ${formatMoney(amount, hidden)}.`
        )
        return false
      }

      const current = getStoredBudget()
      try {
        const settlement: Settlement = {
          id: nextId(current.settlements),
          month,
          at: new Date().toISOString(),
          direction,
          amount,
          fundName,
          fundAmountBefore: result.before,
          fundAmountAfter: result.after,
        }
        persist({ ...current, settlements: [...current.settlements, settlement] })
      } catch {
        // Quỹ đã đổi mà lịch sử không ghi được: số còn phải tất toán không đổi, nút vẫn sáng — bấm lại
        // sẽ cộng/trừ quỹ thêm 1 lần nữa. Đảo lại đúng số tiền vừa áp để quỹ về như trước.
        const reverted = applyFundDeltaSafely(fundName, direction === "deposit" ? "withdraw" : "deposit", amount)
        toast.error(
          reverted?.ok
            ? "Không thể ghi lại lịch sử tất toán — số dư quỹ vẫn giữ nguyên. Vui lòng thử lại."
            : `Không thể ghi lại lịch sử tất toán và không trả lại được số dư quỹ "${fundName}". Kiểm tra lại số dư ở màn Tài chính.`
        )
        return false
      }
      toast.success(`Đã tất toán ${formatMonthKey(month).toLowerCase()}`)
      return true
    },
    [persist, hidden]
  )

  return {
    salaries: state.salaries,
    expenses: state.expenses,
    settlements: state.settlements,
    hydrated,
    setSalary,
    addExpense,
    updateExpense,
    removeExpense,
    confirmSettlement,
    replaceBudget: persist,
  }
}

export { useBudget }
