import { monthKeyFromDayKey, shiftMonth } from "@/lib/date"
import type { Expense, MonthlySalary, Settlement } from "./types"

const UNTAGGED_LABEL = "Không gắn thẻ"
const UNTAGGED_EMOJI = "🏷️"
const UNTAGGED_TINT = "#F2E9DC"

// Trần số tiền gõ tay ở 3 form Chi tiêu (lương, ghi khoản chi, sửa khoản chi). budget-storage đọc số
// tiền bằng z.number().int(), mà zod 4 coi số > Number.MAX_SAFE_INTEGER là không hợp lệ — 1 số 16–17
// chữ số gõ nhầm sẽ hiện bình thường cho tới lần tải lại trang rồi mất hẳn. Chặn ở form, xa dưới
// ngưỡng đó (không thêm .max() vào schema: sẽ âm thầm bỏ luôn bản ghi cũ vượt trần đang có trong máy).
const MAX_BUDGET_AMOUNT = 999_999_999_999
const BUDGET_AMOUNT_LIMIT_HINT = `Tối đa ${MAX_BUDGET_AMOUNT.toLocaleString("vi-VN")} đ`

// `amount` là chuỗi chữ số của ô Field (group) — chuỗi rỗng là 0, không vượt.
function exceedsBudgetAmountLimit(amount: string): boolean {
  return Number(amount) > MAX_BUDGET_AMOUNT
}

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

interface UnsettledMonth {
  month: string
  remaining: number
}

// Tháng đã qua còn dư/thiếu ≠ 0 trong `lookback` tháng liền trước `currentMonth`, mới nhất trước.
// Khoản chi luôn ghi vào hôm nay nên tháng đã qua chỉ còn đổi được qua tất toán — phần lệch phát sinh
// sát lúc sang tháng (ghi thêm khoản chi sau khi đã tất toán, hay quên tất toán trước nửa đêm) chỉ
// còn đường này để nạp/rút. Tính lại từ dữ liệu gốc như remainingToSettle, không lưu trạng thái gì.
function unsettledPastMonths(
  salaries: MonthlySalary[],
  expenses: Expense[],
  settlements: Settlement[],
  currentMonth: string,
  lookback: number
): UnsettledMonth[] {
  return Array.from({ length: lookback }, (_, i) => shiftMonth(currentMonth, -(i + 1)))
    .map((month) => ({ month, remaining: remainingToSettle(salaries, expenses, settlements, month) }))
    .filter((entry) => entry.remaining !== 0)
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

interface DayGroup {
  dayKey: string
  expenses: Expense[]
  total: number
}

function groupExpensesByDay(expenses: Expense[]): DayGroup[] {
  const buckets = new Map<string, Expense[]>()

  for (const e of expenses) {
    const list = buckets.get(e.dayKey)
    if (list) list.push(e)
    else buckets.set(e.dayKey, [e])
  }

  return [...buckets.entries()]
    .map(([dayKey, list]) => ({ dayKey, expenses: list, total: list.reduce((sum, e) => sum + e.amount, 0) }))
    .sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1))
}

interface MonthlyExpensePoint {
  month: string
  total: number
}

function monthlyExpenseTotals(expenses: Expense[], months: string[]): MonthlyExpensePoint[] {
  return months.map((month) => ({ month, total: totalExpensesForMonth(expenses, month) }))
}

// tag.tint là màu pastel rất nhạt (dùng cho badge tròn nhỏ trong Cài đặt/danh sách chi tiêu),
// không đủ rực để phân biệt trên chart — dùng chung 1 bảng màu rực cố định cho mọi chart liên quan
// tới nhãn (donut "Chi theo nhãn" + cột "Xu hướng theo nhãn"). 11 màu = 11 nhãn mặc định trong Cài
// đặt, không màu nào lặp lại giữa chúng; xám để riêng cho "Không gắn thẻ".
const CHART_PALETTE = [
  "#FF6B9D",
  "#3DCFB6",
  "#FFA94D",
  "#748FFC",
  "#9775FA",
  "#51CF66",
  "#FCC419",
  "#FA5252",
  "#22B8CF",
  "#94D82D",
  "#E599F7",
]
const UNTAGGED_CHART_COLOR = "#A0AEC0"

// Màu của mỗi nhãn theo VỊ TRÍ của nhãn trong Cài đặt (tính cả nhãn đang tắt — tắt 1 nhãn không làm
// nhãn khác đổi màu), không theo thứ tự xuất hiện trong từng chart: donut xếp nhãn theo khoản chi
// đầu tiên của tháng này, chart 6 tháng theo lần xuất hiện đầu tiên trong 6 tháng — tô theo thứ tự
// đó thì cùng 1 nhãn mang 2 màu trên cùng 1 trang. Nhãn không còn trong Cài đặt (đã xoá/đổi tên,
// chỉ còn trong snapshot cũ) lấy các màu kế tiếp sau nhãn cuối của Cài đặt.
function tagChartColors(labels: string[], tags: { label: string }[]): Map<string, string> {
  const order = tags.map((t) => t.label)
  for (const label of labels) {
    if (label !== UNTAGGED_LABEL && !order.includes(label)) order.push(label)
  }

  const colors = new Map<string, string>()
  for (const label of labels) {
    colors.set(
      label,
      label === UNTAGGED_LABEL ? UNTAGGED_CHART_COLOR : CHART_PALETTE[order.indexOf(label) % CHART_PALETTE.length]
    )
  }
  return colors
}

interface MonthlyTagSeries {
  label: string
  emoji: string
  tint: string
  data: number[]
}

// Pivot breakdownByTag (theo TỪNG tháng) thành 1 series/nhãn xuyên suốt nhiều tháng — nhãn nào
// không phát sinh chi tiêu ở 1 tháng bất kỳ trong khoảng vẫn có mặt, giá trị tháng đó = 0 (thay vì
// bị thiếu điểm dữ liệu, gây lệch trục X khi vẽ stacked bar).
function monthlyTagBreakdown(expenses: Expense[], months: string[]): MonthlyTagSeries[] {
  const perMonth = months.map((month) => breakdownByTag(expenses, month))

  const order: string[] = []
  const meta = new Map<string, { emoji: string; tint: string }>()
  for (const entries of perMonth) {
    for (const entry of entries) {
      if (!meta.has(entry.label)) {
        meta.set(entry.label, { emoji: entry.emoji, tint: entry.tint })
        order.push(entry.label)
      }
    }
  }

  return order.map((label) => {
    const { emoji, tint } = meta.get(label) as { emoji: string; tint: string }
    return {
      label,
      emoji,
      tint,
      data: perMonth.map((entries) => entries.find((e) => e.label === label)?.total ?? 0),
    }
  })
}

export {
  totalExpensesForMonth,
  salaryForMonth,
  signedSettledForMonth,
  remainingToSettle,
  unsettledPastMonths,
  breakdownByTag,
  groupExpensesByDay,
  monthlyExpenseTotals,
  monthlyTagBreakdown,
  tagChartColors,
  exceedsBudgetAmountLimit,
  CHART_PALETTE,
  UNTAGGED_CHART_COLOR,
  UNTAGGED_LABEL,
  UNTAGGED_EMOJI,
  MAX_BUDGET_AMOUNT,
  BUDGET_AMOUNT_LIMIT_HINT,
  type TagBreakdownEntry,
  type UnsettledMonth,
  type DayGroup,
  type MonthlyExpensePoint,
  type MonthlyTagSeries,
}
