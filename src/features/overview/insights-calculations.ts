import { dayKey, daysBetween, formatDayKeyWithYear, monthKeyFromDayKey, shiftDay, shiftMonth } from "@/lib/date"
import {
  monthlyExpenseTotals,
  monthlyTagBreakdown,
  totalExpensesForMonth,
  UNTAGGED_LABEL,
} from "@/lib/budget/budget-calculations"
import type { Expense } from "@/lib/budget/types"
import type { JournalEntry } from "@/lib/journal/types"
import type { NetWorthSnapshot } from "@/lib/net-worth/net-worth-history-storage"

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
const FORECAST_MIN_POINTS = 14
const FORECAST_MIN_SPAN_DAYS = 30
const FORECAST_MAX_DAYS = 5 * 365
// Gợi ý chi tiêu tổng chỉ báo khi lệch ít nhất 10%: 3 tháng nền đều quá (std rất nhỏ) thì chênh 2% —
// hay "khoảng 0%" — cũng vượt ngưỡng z-score, mà không phải điều đáng báo.
const ANOMALY_MIN_PCT = 10
// Đầu tháng chưa đủ ngày để so cùng kỳ — chưa ghi khoản nào vẫn bị báo "thấp hơn 100%".
const SAME_PERIOD_MIN_DAY = 7

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

// Tháng đang chạy dở luôn có tổng chi-tới-nay THẤP hơn 1 tháng trọn vẹn, nên 2 hướng so khác nhau:
// "cao hơn/tăng" so với cả tháng trọn vẹn của 3 tháng trước (đã vượt cả 1 tháng bình thường thì báo
// sớm được), còn "thấp hơn/giảm" so với CÙNG KỲ — ngày 1 → cùng ngày-trong-tháng của hôm nay — của 3
// tháng đó. Khoản trả cố định cuối tháng (vd. cước điện thoại ngày 28) chưa tới hạn tháng này thì
// cùng kỳ tháng trước cũng chưa có, nên không còn báo nhầm "giảm" vào mấy ngày cuối tháng.
function samePeriodExpenses(expenses: Expense[], today: string): Expense[] {
  const cutoff = Number(today.slice(8, 10))
  return expenses.filter((e) => Number(e.dayKey.slice(8, 10)) <= cutoff)
}

// Độ lệch của `current` so với 3 tháng nền: z-score và % (đã làm tròn); null khi chưa so được.
function compareToBaseline(current: number, baseline: number[]): { z: number; pct: number } | null {
  // Cần CẢ 3 tháng nền đều có chi tiêu thật — nếu chỉ 1-2 tháng có (tài khoản mới, hoặc có tháng
  // không ghi gì), trung bình bị pha loãng bởi các tháng = 0, khiến % lệch báo ra bị thổi phồng
  // sai lệch (ví dụ 1 tháng thật + 2 tháng rỗng khiến tăng thật 20% bị báo thành tăng 260%).
  if (baseline.some((v) => v === 0)) return null
  const std = sampleStdDev(baseline)
  if (std === 0) return null
  const avg = mean(baseline)
  return { z: (current - avg) / std, pct: Math.round((Math.abs(current - avg) / avg) * 100) }
}

function detectSpendingAnomaly(expenses: Expense[], month: string, today: string): Insight | null {
  if (!expenses.length) return null

  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const currentTotal = totalExpensesForMonth(expenses, month)

  const fullMonths = compareToBaseline(
    currentTotal,
    monthlyExpenseTotals(expenses, priorMonths).map((p) => p.total)
  )
  if (fullMonths && fullMonths.z >= ANOMALY_Z_SCORE_THRESHOLD && fullMonths.pct >= ANOMALY_MIN_PCT) {
    return {
      id: `spending-anomaly-${month}`,
      text: `Tháng này bạn chi tiêu cao hơn khoảng ${fullMonths.pct}% so với trung bình 3 tháng gần đây.`,
    }
  }

  if (Number(today.slice(8, 10)) < SAME_PERIOD_MIN_DAY) return null
  const samePeriod = compareToBaseline(
    currentTotal,
    monthlyExpenseTotals(samePeriodExpenses(expenses, today), priorMonths).map((p) => p.total)
  )
  if (samePeriod && samePeriod.z <= -ANOMALY_Z_SCORE_THRESHOLD && samePeriod.pct >= ANOMALY_MIN_PCT) {
    return {
      id: `spending-anomaly-${month}`,
      text: `Tính tới hôm nay, tháng này bạn chi tiêu thấp hơn khoảng ${samePeriod.pct}% so với cùng kỳ 3 tháng gần đây.`,
    }
  }
  return null
}

// % thay đổi của `current` so với trung bình `prior` (vd. -0.6 = giảm 60%); null khi chưa so được.
function relativeChange(current: number, prior: number[]): number | null {
  // Cần CẢ 3 tháng nền đều có chi tiêu thật cho tag này — nếu chỉ 1-2 tháng có (tag mới thêm gần
  // đây, hoặc người dùng mới), trung bình bị pha loãng bởi các tháng = 0, khiến % lệch báo ra bị
  // thổi phồng sai lệch (vd. tag chỉ có ở 1/3 tháng, tăng nhẹ thật vẫn báo tăng gấp 3 lần).
  if (prior.length < ANOMALY_LOOKBACK_MONTHS || prior.some((v) => v === 0)) return null
  const avgPrior = mean(prior)
  return (current - avgPrior) / avgPrior
}

function detectTagAnomaly(expenses: Expense[], month: string, today: string): Insight | null {
  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const allMonths = [...priorMonths, month]
  const series = monthlyTagBreakdown(expenses, allMonths)
  // Hướng "giảm" so với cùng kỳ của 3 tháng trước (xem samePeriodExpenses). Tag không có khoản nào
  // trong cùng kỳ thì không có trong map → không có nền để báo "giảm".
  const samePeriodByLabel = new Map(
    monthlyTagBreakdown(samePeriodExpenses(expenses, today), priorMonths).map((s) => [s.label, s.data] as const)
  )
  const samePeriodReady = Number(today.slice(8, 10)) >= SAME_PERIOD_MIN_DAY

  let worst: { label: string; emoji: string; pct: number } | null = null
  for (const tagSeries of series) {
    // "Không gắn thẻ" là nhóm gộp tự động (không phải 1 tag người dùng thật chọn) — báo bất
    // thường cho nó vừa đọc kỳ lạ ("chi tiêu cho Không gắn thẻ"), vừa trùng lặp với insight chi
    // tiêu bất thường tổng (detectSpendingAnomaly) khi hầu hết chi tiêu chưa gắn thẻ, lại thường
    // là nhóm ồn nhất nên hay "thắng" và che mất 1 tag thật sự đáng chú ý hơn.
    if (tagSeries.label === UNTAGGED_LABEL) continue
    const currentValue = tagSeries.data[ANOMALY_LOOKBACK_MONTHS]
    const increase = relativeChange(currentValue, tagSeries.data.slice(0, ANOMALY_LOOKBACK_MONTHS))
    const decrease = samePeriodReady
      ? relativeChange(currentValue, samePeriodByLabel.get(tagSeries.label) ?? [])
      : null
    const pct =
      increase !== null && increase >= TAG_ANOMALY_PCT_THRESHOLD
        ? increase
        : decrease !== null && decrease <= -TAG_ANOMALY_PCT_THRESHOLD
          ? decrease
          : null
    if (pct === null) continue
    if (!worst || Math.abs(pct) > Math.abs(worst.pct)) {
      worst = { label: tagSeries.label, emoji: tagSeries.emoji, pct }
    }
  }
  if (!worst) return null

  const pctText = Math.round(Math.abs(worst.pct) * 100)
  return {
    id: `tag-anomaly-${month}`,
    text:
      worst.pct > 0
        ? `Chi tiêu cho "${worst.emoji} ${worst.label}" tháng này tăng ${pctText}% so với trung bình 3 tháng trước.`
        : `Tính tới hôm nay, chi tiêu cho "${worst.emoji} ${worst.label}" tháng này giảm ${pctText}% so với cùng kỳ 3 tháng trước.`,
  }
}

function detectMoodSpendingCorrelation(expenses: Expense[], entries: JournalEntry[], today: string): Insight | null {
  // -(MOOD_WINDOW_DAYS - 1) chứ không phải -MOOD_WINDOW_DAYS — khoảng [windowStart, today] gồm
  // CẢ 2 đầu mút, nên trừ đi (N-1) mới cho đúng N ngày, khớp với câu chữ "trong 60 ngày qua".
  const windowStart = shiftDay(today, -(MOOD_WINDOW_DAYS - 1))
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

function forecastSavingsGoal(history: NetWorthSnapshot[], target: number, today: string): Insight | null {
  // Lần đầu mở Tổng quan (hay ngay sau "Xoá toàn bộ dữ liệu") đã ghi 1 điểm savingsTotal = 0 trước khi
  // người dùng kịp nhập các quỹ đang có; bước nhảy 0 → số dư sẵn có đó không phải nhịp tiết kiệm, mà
  // vì hồi quy luôn dùng cả lịch sử nên nó làm dự báo lạc quan sai suốt nhiều tháng. Bỏ mọi điểm 0
  // ở ĐẦU chuỗi rồi mới xét đủ điểm/đủ ngày và hồi quy.
  const firstSaved = history.findIndex((h) => h.savingsTotal !== 0)
  const points = firstSaved === -1 ? [] : history.slice(firstSaved)
  if (points.length < FORECAST_MIN_POINTS) return null

  const n = points.length
  // Tiết kiệm thường dồn theo lương (1 lần/tháng), không đều mỗi ngày — nếu khoảng dữ liệu còn
  // quá ngắn (vd. chỉ 13-14 ngày), 1 lần nhận lương rơi đúng giữa khoảng đó có thể làm độ dốc bị
  // thổi phồng rất nhiều (trông như tiết kiệm nhanh hơn hẳn thực tế). Cần ít nhất 1 chu kỳ lương
  // thật (~30 ngày) đã trôi qua mới đủ tin cậy để dự báo.
  if (daysBetween(points[0].date, points[n - 1].date) < FORECAST_MIN_SPAN_DAYS) return null

  // Hồi quy theo SỐ NGÀY THỰC đã trôi qua kể từ điểm đầu tiên, KHÔNG theo chỉ số phần tử — snapshot
  // chỉ được ghi khi người dùng mở app, nên có thể có khoảng trống (bỏ lỡ vài ngày không mở app).
  // Nếu hồi quy theo chỉ số, độ dốc sẽ bị tính theo "đơn vị/lần ghi" thay vì "đơn vị/ngày", làm dự
  // báo sai lệch (nhanh hơn thực tế) đúng theo tỷ lệ mật độ ghi thưa hay dày.
  const xs = points.map((h) => daysBetween(points[0].date, h.date))
  const ys = points.map((h) => h.savingsTotal)
  const meanX = mean(xs)
  const meanY = mean(ys)
  const numerator = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0)
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)
  const slope = denominator === 0 ? 0 : numerator / denominator

  const currentSavings = points[n - 1].savingsTotal
  if (currentSavings >= target || slope <= 0) return null

  const daysToTarget = Math.ceil((target - currentSavings) / slope)
  // Độ dốc nhỏ dương (gần như đi ngang) có thể ngoại suy ra hàng trăm/nghìn năm — 1 con số vô
  // nghĩa với người dùng thật, chặn lại thay vì hiện 1 ngày xa không thực tế.
  if (daysToTarget > FORECAST_MAX_DAYS) return null
  const targetDate = shiftDay(today, daysToTarget)

  return {
    // Theo tháng (không cố định) — nếu người dùng ẩn đi, gợi ý chỉ ẩn tới hết tháng đó, sang
    // tháng mới sẽ tự hiện lại nếu vẫn còn đúng điều kiện (giống 3 loại gợi ý còn lại), thay vì
    // ẩn vĩnh viễn dù sau này mục tiêu/ngày dự báo đã thay đổi hoàn toàn.
    id: `savings-forecast-${monthKeyFromDayKey(today)}`,
    text: `Với nhịp tiết kiệm hiện tại, bạn có thể đạt mục tiêu tiết kiệm vào khoảng ${formatDayKeyWithYear(targetDate)}.`,
  }
}

export {
  ANOMALY_LOOKBACK_MONTHS,
  ANOMALY_Z_SCORE_THRESHOLD,
  ANOMALY_MIN_PCT,
  TAG_ANOMALY_PCT_THRESHOLD,
  MOOD_WINDOW_DAYS,
  MOOD_MIN_DAYS_PER_GROUP,
  MOOD_LOW_SCORE_MAX,
  MOOD_HIGH_SCORE_MIN,
  MOOD_PCT_THRESHOLD,
  FORECAST_MIN_POINTS,
  samePeriodExpenses,
  detectSpendingAnomaly,
  detectTagAnomaly,
  detectMoodSpendingCorrelation,
  forecastSavingsGoal,
  type Insight,
}
