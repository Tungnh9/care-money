import { monthKeyFromDayKey } from "@/lib/date"
import type { Expense, MonthlySalary, Settlement } from "./types"

const UNTAGGED_LABEL = "Không gắn thẻ"
const UNTAGGED_EMOJI = "🏷️"
const UNTAGGED_TINT = "#F2E9DC"

function totalExpensesForMonth(expenses: Expense[], month: string): number {
  return expenses
    .filter((e) => monthKeyFromDayKey(e.dayKey) === month)
    .reduce((sum, e) => sum + e.amount, 0)
}

function salaryForMonth(salaries: MonthlySalary[], month: string): number {
  return salaries.find((s) => s.month === month)?.amount ?? 0
}

function signedSettledForMonth(settlements: Settlement[], month: string): number {
  return settlements
    .filter((s) => s.month === month)
    .reduce((sum, s) => sum + (s.direction === "deposit" ? s.amount : -s.amount), 0)
}

// Luôn tính lại từ dữ liệu gốc (không cache) — đúng với mọi số lần chốt (0, 1, hoặc nhiều lần
// từng phần) mà không cần khoá tháng hay theo dõi trạng thái riêng.
function remainingToSettle(
  salaries: MonthlySalary[],
  expenses: Expense[],
  settlements: Settlement[],
  month: string
): number {
  const net = salaryForMonth(salaries, month) - totalExpensesForMonth(expenses, month)
  return net - signedSettledForMonth(settlements, month)
}

interface TagBreakdownEntry {
  label: string
  emoji: string
  tint: string
  total: number
}

function breakdownByTag(expenses: Expense[], month: string): TagBreakdownEntry[] {
  const buckets = new Map<string, TagBreakdownEntry>()

  for (const e of expenses) {
    if (monthKeyFromDayKey(e.dayKey) !== month) continue
    const label = e.tag?.label ?? UNTAGGED_LABEL
    const emoji = e.tag?.emoji ?? UNTAGGED_EMOJI
    const tint = e.tag?.tint ?? UNTAGGED_TINT
    const existing = buckets.get(label)
    if (existing) {
      existing.total += e.amount
    } else {
      buckets.set(label, { label, emoji, tint, total: e.amount })
    }
  }

  return [...buckets.values()]
}

function lastNMonthKeys(n: number, now: Date = new Date()): string[] {
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return keys
}

interface MonthlyTrendPoint {
  month: string
  salary: number
  spent: number
}

function monthlyTrend(salaries: MonthlySalary[], expenses: Expense[], months: string[]): MonthlyTrendPoint[] {
  return months.map((month) => ({
    month,
    salary: salaryForMonth(salaries, month),
    spent: totalExpensesForMonth(expenses, month),
  }))
}

export {
  totalExpensesForMonth,
  salaryForMonth,
  signedSettledForMonth,
  remainingToSettle,
  breakdownByTag,
  lastNMonthKeys,
  monthlyTrend,
  type TagBreakdownEntry,
  type MonthlyTrendPoint,
}
