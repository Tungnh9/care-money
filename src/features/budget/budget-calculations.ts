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

// lastNMonthKeys(6) luôn trả về đúng 6 tháng bất kể có dữ liệu hay không — với người dùng
// mới chỉ có 1-2 tháng dữ liệu thật, biểu đồ sẽ đầy tháng trống gây rối mắt. Hàm này thu hẹp
// khung về đúng phần có dữ liệu (bắt đầu từ tháng sớm nhất có lương hoặc khoản chi), vẫn giữ
// tối đa n tháng nếu lịch sử thật sự dài hơn khung, và luôn giữ tối thiểu 2 tháng để còn ra
// được 1 đường xu hướng (1 điểm dữ liệu không thể hiện xu hướng gì).
function trendMonthKeys(
  salaries: MonthlySalary[],
  expenses: Expense[],
  n: number,
  now: Date = new Date()
): string[] {
  const fullWindow = lastNMonthKeys(n, now)
  const dataMonths = [...salaries.map((s) => s.month), ...expenses.map((e) => monthKeyFromDayKey(e.dayKey))]

  if (dataMonths.length === 0) return fullWindow.slice(-3)

  const earliest = dataMonths.reduce((min, m) => (m < min ? m : min), fullWindow[fullWindow.length - 1])
  const trimmed = fullWindow.filter((m) => m >= earliest)
  return trimmed.length >= 2 ? trimmed : fullWindow.slice(-2)
}

export {
  totalExpensesForMonth,
  salaryForMonth,
  signedSettledForMonth,
  remainingToSettle,
  breakdownByTag,
  lastNMonthKeys,
  monthlyTrend,
  trendMonthKeys,
  type TagBreakdownEntry,
  type MonthlyTrendPoint,
}
