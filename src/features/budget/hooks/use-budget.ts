"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { applySavingsFundDelta } from "@/features/finance/finance-storage"
import { nextId } from "@/lib/next-id"
import { DEFAULT_BUDGET_STATE, getStoredBudget, setStoredBudget, type BudgetState } from "../budget-storage"
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

function useBudget() {
  const [state, setState] = useState<BudgetState>(DEFAULT_BUDGET_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredBudget())
  }, [])

  const persist = useCallback((next: BudgetState) => {
    setStoredBudget(next)
    setState(next)
  }, [])

  const setSalary = useCallback(
    (month: string, amount: number) => {
      try {
        const exists = state.salaries.some((s) => s.month === month)
        persist({
          ...state,
          salaries: exists
            ? state.salaries.map((s) => (s.month === month ? { ...s, amount } : s))
            : [...state.salaries, { month, amount }],
        })
        toast.success(`Đã lưu lương tháng ${month}`)
      } catch {
        toast.error("Không thể lưu lương. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const addExpense = useCallback(
    (input: AddExpenseInput) => {
      try {
        const expense: Expense = { ...input, id: nextId(state.expenses) }
        persist({ ...state, expenses: [expense, ...state.expenses] })
      } catch {
        toast.error("Không thể ghi khoản chi. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const updateExpense = useCallback(
    (id: number, input: UpdateExpenseInput) => {
      try {
        persist({
          ...state,
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...input } : e)),
        })
        toast.success("Đã cập nhật khoản chi")
      } catch {
        toast.error("Không thể cập nhật khoản chi. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const removeExpense = useCallback(
    (id: number) => {
      try {
        persist({ ...state, expenses: state.expenses.filter((e) => e.id !== id) })
        toast.success("Đã xoá khoản chi")
      } catch {
        toast.error("Không thể xoá khoản chi. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const confirmSettlement = useCallback(
    (month: string, fundName: string, direction: SettlementDirection, amount: number) => {
      const result = applySavingsFundDelta(fundName, direction, amount)
      if (!result.ok) {
        toast.error(
          result.reason === "fund-not-found"
            ? `Không tìm thấy quỹ "${fundName}".`
            : `Quỹ "${fundName}" không đủ số dư để rút ${amount.toLocaleString("vi-VN")} đ.`
        )
        return
      }

      try {
        const settlement: Settlement = {
          id: nextId(state.settlements),
          month,
          at: new Date().toISOString(),
          direction,
          amount,
          fundName,
          fundAmountBefore: result.before,
          fundAmountAfter: result.after,
        }
        persist({ ...state, settlements: [...state.settlements, settlement] })
        toast.success("Đã tất toán tháng")
      } catch {
        toast.error("Không thể ghi lại lịch sử tất toán. Vui lòng thử lại.")
      }
    },
    [state, persist]
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
