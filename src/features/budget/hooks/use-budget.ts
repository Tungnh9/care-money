"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { applySavingsFundDelta } from "@/features/finance/finance-storage"
import { formatMonthKey } from "@/lib/date"
import { nextId } from "@/lib/next-id"
import { useStorageSync } from "@/lib/use-storage-sync"
import {
  BUDGET_STORAGE_KEY,
  DEFAULT_BUDGET_STATE,
  getStoredBudget,
  setStoredBudget,
  type BudgetState,
} from "../budget-storage"
import type { Expense, Settlement, SettlementDirection } from "../types"

interface AddExpenseInput {
  dayKey: string
  amount: number
  note?: string
  tag: Expense["tag"]
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

function useBudget() {
  const [state, setState] = useState<BudgetState>(DEFAULT_BUDGET_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredBudget())
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

  const addExpense = useCallback(
    (input: AddExpenseInput) => {
      const current = getStoredBudget()
      try {
        const expense: Expense = { ...input, id: nextId(current.expenses) }
        persist({ ...current, expenses: [expense, ...current.expenses] })
      } catch {
        toast.error("Không thể ghi khoản chi. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const updateExpense = useCallback(
    (id: number, input: UpdateExpenseInput) => {
      const current = getStoredBudget()
      try {
        persist({
          ...current,
          expenses: current.expenses.map((e) => (e.id === id ? { ...e, ...input } : e)),
        })
        toast.success("Đã cập nhật khoản chi")
      } catch {
        toast.error("Không thể cập nhật khoản chi. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const removeExpense = useCallback(
    (id: number) => {
      const current = getStoredBudget()
      try {
        persist({ ...current, expenses: current.expenses.filter((e) => e.id !== id) })
        toast.success("Đã xoá khoản chi")
      } catch {
        toast.error("Không thể xoá khoản chi. Vui lòng thử lại.")
      }
    },
    [persist]
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
            : `Quỹ "${fundName}" không đủ số dư để rút ${amount.toLocaleString("vi-VN")} đ.`
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
      toast.success("Đã tất toán tháng")
      return true
    },
    [persist]
  )

  return {
    salaries: state.salaries,
    expenses: state.expenses,
    settlements: state.settlements,
    setSalary,
    addExpense,
    updateExpense,
    removeExpense,
    confirmSettlement,
    replaceBudget: persist,
  }
}

export { useBudget }
