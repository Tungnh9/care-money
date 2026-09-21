import { dayKey, monthKeyFromDayKey, shiftDay, shiftMonth } from "@/lib/date"
import { monthlyExpenseTotals, monthlyTagBreakdown, totalExpensesForMonth } from "@/features/budget/budget-calculations"
import type { Expense } from "@/features/budget/types"
import type { JournalEntry } from "@/features/journal/types"

interface Insight {
  id: string
  text: string
}

const ANOMALY_LOOKBACK_MONTHS = 3
const ANOMALY_Z_SCORE_THRESHOLD = 1.5
const TAG_ANOMALY_PCT_THRESHOLD = 0.5
const MOOD_WINDOW_DAYS = 60
const MOOD_MIN_DAYS_PER_GROUP = 5
const MOOD_LOW_SCORE_MAX = 2
const MOOD_HIGH_SCORE_MIN = 4
const MOOD_PCT_THRESHOLD = 0.2

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function detectSpendingAnomaly(expenses: Expense[], month: string, today: string): Insight | null {
  if (!expenses.length) return null
  const earliestMonth = expenses.reduce(
    (min, e) => (monthKeyFromDayKey(e.dayKey) < min ? monthKeyFromDayKey(e.dayKey) : min),
    monthKeyFromDayKey(expenses[0].dayKey)
  )
  const requiredEarliest = shiftMonth(month, -ANOMALY_LOOKBACK_MONTHS)
  if (earliestMonth > requiredEarliest) return null

  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const priorTotals = monthlyExpenseTotals(expenses, priorMonths).map((p) => p.total)
  const currentTotal = totalExpensesForMonth(expenses, month)
  const std = sampleStdDev(priorTotals)
  if (std === 0) return null

  const z = (currentTotal - mean(priorTotals)) / std
  if (Math.abs(z) < ANOMALY_Z_SCORE_THRESHOLD) return null

  const pct = Math.round((Math.abs(currentTotal - mean(priorTotals)) / mean(priorTotals)) * 100)
  const direction = z > 0 ? "cao hơn" : "thấp hơn"
  return {
    id: `spending-anomaly-${month}`,
    text: `Tháng này bạn chi tiêu ${direction} khoảng ${pct}% so với trung bình 3 tháng gần đây.`,
  }
}

function detectTagAnomaly(expenses: Expense[], month: string): Insight | null {
  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const allMonths = [...priorMonths, month]
  const series = monthlyTagBreakdown(expenses, allMonths)

  let worst: { label: string; emoji: string; pct: number; direction: string } | null = null
  for (const tagSeries of series) {
    const priorValues = tagSeries.data.slice(0, ANOMALY_LOOKBACK_MONTHS)
    const currentValue = tagSeries.data[ANOMALY_LOOKBACK_MONTHS]
    const avgPrior = mean(priorValues)
    if (avgPrior === 0) continue
    const pct = (currentValue - avgPrior) / avgPrior
    if (Math.abs(pct) < TAG_ANOMALY_PCT_THRESHOLD) continue
    if (!worst || Math.abs(pct) > Math.abs(worst.pct)) {
      worst = { label: tagSeries.label, emoji: tagSeries.emoji, pct, direction: pct > 0 ? "tăng" : "giảm" }
    }
  }
  if (!worst) return null

  return {
    id: `tag-anomaly-${month}`,
    text: `Chi tiêu cho "${worst.emoji} ${worst.label}" tháng này ${worst.direction} ${Math.round(Math.abs(worst.pct) * 100)}% so với trung bình 3 tháng trước.`,
  }
}

function detectMoodSpendingCorrelation(expenses: Expense[], entries: JournalEntry[], today: string): Insight | null {
  const windowStart = shiftDay(today, -MOOD_WINDOW_DAYS)
  const moodByDay = new Map<string, number[]>()
  for (const entry of entries) {
    if (entry.mood?.score === undefined) continue
    const day = dayKey(new Date(entry.id))
    if (day < windowStart || day > today) continue
    const scores = moodByDay.get(day) ?? []
    scores.push(entry.mood.score)
    moodByDay.set(day, scores)
  }

  const lowDaySpends: number[] = []
  const highDaySpends: number[] = []
  for (const [day, scores] of moodByDay) {
    const avgScore = mean(scores)
    const daySpend = expenses.filter((e) => e.dayKey === day).reduce((sum, e) => sum + e.amount, 0)
    if (avgScore <= MOOD_LOW_SCORE_MAX) lowDaySpends.push(daySpend)
    else if (avgScore >= MOOD_HIGH_SCORE_MIN) highDaySpends.push(daySpend)
  }

  if (lowDaySpends.length < MOOD_MIN_DAYS_PER_GROUP || highDaySpends.length < MOOD_MIN_DAYS_PER_GROUP) return null

  const avgLow = mean(lowDaySpends)
  const avgHigh = mean(highDaySpends)
  if (avgHigh === 0) return null
  const pct = (avgLow - avgHigh) / avgHigh
  if (Math.abs(pct) < MOOD_PCT_THRESHOLD) return null

  const direction = pct > 0 ? "nhiều hơn" : "ít hơn"
  return {
    // monthKeyFromDayKey (cắt chuỗi, không parse Date) — KHÔNG dùng `new Date(today)` ở đây:
    // `today` là chuỗi "YYYY-MM-DD", `new Date("YYYY-MM-DD")` bị parse theo UTC (không phải giờ
    // local) trong JS, có thể lệch ngày/tháng tuỳ múi giờ máy chạy — đúng lỗi date.ts's các hàm
    // khác (shiftDay/formatDayKey) đã cố ý tránh bằng cách tự parse tay từng phần.
    id: `mood-spending-${monthKeyFromDayKey(today)}`,
    text: `Trong 60 ngày qua, những ngày tâm trạng thấp bạn chi tiêu ${direction} khoảng ${Math.round(Math.abs(pct) * 100)}% so với những ngày tâm trạng cao.`,
  }
}

export {
  ANOMALY_LOOKBACK_MONTHS,
  ANOMALY_Z_SCORE_THRESHOLD,
  TAG_ANOMALY_PCT_THRESHOLD,
  MOOD_WINDOW_DAYS,
  MOOD_MIN_DAYS_PER_GROUP,
  MOOD_LOW_SCORE_MAX,
  MOOD_HIGH_SCORE_MIN,
  MOOD_PCT_THRESHOLD,
  detectSpendingAnomaly,
  detectTagAnomaly,
  detectMoodSpendingCorrelation,
  type Insight,
}
