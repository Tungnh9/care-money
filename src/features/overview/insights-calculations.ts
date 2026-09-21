import { monthKeyFromDayKey, shiftMonth } from "@/lib/date"
import { monthlyExpenseTotals, monthlyTagBreakdown, totalExpensesForMonth } from "@/features/budget/budget-calculations"
import type { Expense } from "@/features/budget/types"

interface Insight {
  id: string
  text: string
}

const ANOMALY_LOOKBACK_MONTHS = 3
const ANOMALY_Z_SCORE_THRESHOLD = 1.5
const TAG_ANOMALY_PCT_THRESHOLD = 0.5

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

export {
  ANOMALY_LOOKBACK_MONTHS,
  ANOMALY_Z_SCORE_THRESHOLD,
  TAG_ANOMALY_PCT_THRESHOLD,
  detectSpendingAnomaly,
  detectTagAnomaly,
  type Insight,
}
