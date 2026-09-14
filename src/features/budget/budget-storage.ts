import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import type { Expense, MonthlySalary, Settlement } from "./types"

interface BudgetState {
  salaries: MonthlySalary[]
  expenses: Expense[]
  settlements: Settlement[]
}

const BUDGET_STORAGE_KEY = "budget-data"

const DEFAULT_BUDGET_STATE: BudgetState = { salaries: [], expenses: [], settlements: [] }

const tagSnapshotSchema = z.object({
  label: z.string(),
  emoji: z.string(),
  tint: z.string(),
})

const expenseSchema: z.ZodType<Expense> = z.object({
  id: z.number(),
  dayKey: z.string(),
  amount: z.number().int().nonnegative(),
  note: z.string().optional(),
  tag: tagSnapshotSchema.nullable(),
})

const monthlySalarySchema: z.ZodType<MonthlySalary> = z.object({
  month: z.string(),
  amount: z.number().int().nonnegative(),
})

const settlementSchema: z.ZodType<Settlement> = z.object({
  id: z.number(),
  month: z.string(),
  at: z.string(),
  direction: z.enum(["deposit", "withdraw"]),
  amount: z.number().int().positive(),
  fundName: z.string(),
  fundAmountBefore: z.number().int(),
  fundAmountAfter: z.number().int(),
})

// Khác finance-storage.ts: expenses/settlements là lịch sử tích luỹ dài hạn, 1 bản ghi hỏng
// làm mất cả mảng là cái giá quá đắt — nên lọc bỏ đúng phần tử hỏng, giữ lại phần còn hợp lệ.
function safeArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is T => schema.safeParse(item).success)
}

function parseBudgetState(value: unknown): BudgetState {
  const parsed = (value ?? {}) as Record<string, unknown>
  return {
    salaries: safeArray(monthlySalarySchema, parsed.salaries),
    expenses: safeArray(expenseSchema, parsed.expenses),
    settlements: safeArray(settlementSchema, parsed.settlements),
  }
}

function getStoredBudget(): BudgetState {
  try {
    const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY)
    if (!raw) return DEFAULT_BUDGET_STATE
    return parseBudgetState(JSON.parse(raw))
  } catch {
    return DEFAULT_BUDGET_STATE
  }
}

function setStoredBudget(state: BudgetState) {
  window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(state))
  notifyDataChanged()
}

// Settlement chỉ là lịch sử đã đóng băng (fundAmountBefore/After đã lưu đủ) — đổi tên quỹ
// vẫn cascade để lịch sử hiển thị đúng tên hiện tại, nhưng xoá quỹ thì không cần chặn gì
// (khác removeGoldStore) vì không có tính toán sống nào phụ thuộc quỹ còn tồn tại.
function renameFundInSettlements(oldName: string, newName: string) {
  const state = getStoredBudget()
  setStoredBudget({
    ...state,
    settlements: state.settlements.map((s) => (s.fundName === oldName ? { ...s, fundName: newName } : s)),
  })
}

export {
  BUDGET_STORAGE_KEY,
  DEFAULT_BUDGET_STATE,
  getStoredBudget,
  setStoredBudget,
  parseBudgetState,
  renameFundInSettlements,
  type BudgetState,
}
