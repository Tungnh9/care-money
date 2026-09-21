# Bộ phát hiện mẫu hình (Insights) cho trang Tổng quan

## Context

Trang Tổng quan (`src/features/overview/`) hiện chỉ tổng hợp số liệu TỨC THỜI của từng module riêng lẻ (Tài chính, Chi tiêu, Nhật ký, Học tập, Mục tiêu) — không có gì liên kết dữ liệu GIỮA các module, và không có gì chủ động "phát hiện" điều gì cho người dùng ngoài việc hiển thị số liệu thô. Người dùng muốn có 1 lớp "gợi ý thông minh" phát hiện mẫu hình thật trong dữ liệu đã có, kể lại bằng câu tiếng Việt.

Đã xác nhận qua brainstorming với người dùng:
- **Không dùng AI sinh văn bản** (từ chối vì tốn phí + phải gửi dữ liệu cá nhân ra ngoài) — toàn bộ tính toán chạy 100% phía client bằng công thức thống kê thật, ghép vào câu mẫu dựng sẵn.
- **4 insight cụ thể cho v1**: chi tiêu tháng bất thường (tổng), chi tiêu bất thường theo 1 tag, tương quan chi tiêu↔tâm trạng, dự báo ngày đạt mục tiêu tiết kiệm.
- **Chấp nhận xây thêm cơ chế lưu snapshot** để phục vụ riêng insight dự báo (khác 3 insight còn lại — dùng được ngay dữ liệu đã có) — và chấp nhận rằng insight này sẽ "im lặng" cho tới khi tích luỹ đủ ≥14 ngày dữ liệu.
- **Thêm điểm số (`score`) cho Mood** — hiện `Mood` chỉ có nhãn/emoji tự đặt tuỳ ý, không có cách nào biết mood nào "thấp"/"cao" nếu không có 1 con số đại diện mức độ.

**Phát hiện quan trọng khi khảo sát dữ liệu hiện có** (đã xác nhận qua đọc trực tiếp code, không đoán):
- **Chi tiêu**: đã có lịch sử thật, đầy đủ (`Expense[]` không giới hạn thời gian, có sẵn `monthlyExpenseTotals`/`monthlyTagBreakdown` trong `budget-calculations.ts`) — dùng được ngay.
- **Nhật ký**: có timestamp thật (`JournalEntry.id = Date.now()` lúc lưu) nhưng KHÔNG có hàm tổng hợp mood theo ngày nào có sẵn — phải tự viết.
- **Tài chính/Mục tiêu**: hoàn toàn KHÔNG có lịch sử theo thời gian — `summarizeFinance`/`getGoals` luôn tính từ trạng thái sống hiện tại, không có snapshot nào được lưu lại trước đây. Đây là lý do phải xây thêm cơ chế snapshot mới cho riêng insight #4.

**Một điều chỉnh so với mô tả ban đầu trong buổi trao đổi** (phát hiện khi thiết kế chi tiết, đã tự sửa trước khi viết spec): buổi trao đổi mô tả insight #4 là "hồi quy trên lịch sử TÀI SẢN RÒNG (net worth) rồi ngoại suy tới khi đạt mục tiêu Tiết kiệm" — nhưng mục tiêu "Tiết kiệm" (trong `get-goals.ts`) đo đúng `savingsTotal` (tổng các quỹ tiết kiệm), KHÔNG phải `net` (tài sản ròng, gồm cả vàng/đầu tư/nợ thẻ). Nếu hồi quy trên `net` rồi so với mục tiêu đo bằng `savingsTotal` sẽ ra dự báo sai (vd. giá vàng tăng làm `net` tăng nhưng không liên quan gì tới việc có tiết kiệm thêm hay không). **Snapshot sẽ lưu CẢ 2 con số** (`net` và `savingsTotal`) trong cùng 1 bản ghi/ngày — `net` giữ lại cho các insight tương lai có thể cần, `savingsTotal` mới là con số insight #4 thực sự dùng để hồi quy/dự báo, khớp đúng đơn vị với mục tiêu đang so sánh.

## Data model

### `src/lib/settings-storage.ts` — thêm `score` vào `Mood`

```ts
interface Mood {
  label: string
  emoji: string
  desc: string
  tint: string
  on: boolean
  score: number // 1 (rất tệ) – 5 (rất tốt), dùng để tính tương quan chi tiêu-tâm trạng
}
```

`DEFAULT_MOODS` gán `score` hợp lý cho 8 mood có sẵn:
```ts
const DEFAULT_MOODS: Mood[] = [
  { label: "Tuyệt vời", emoji: "😄", desc: "Mọi thứ đều trôi chảy", tint: "#FFF0B8", on: true, score: 5 },
  { label: "Vui", emoji: "🙂", desc: "Tâm trạng tốt, nhẹ người", tint: "#FFE0C7", on: true, score: 4 },
  { label: "Bình yên", emoji: "😌", desc: "Thư thái, không vướng bận", tint: "#E7F6EF", on: true, score: 4 },
  { label: "Bình thường", emoji: "😐", desc: "Không vui cũng không buồn", tint: "#F2E9DC", on: true, score: 3 },
  { label: "Mệt", emoji: "😴", desc: "Cần nghỉ, thiếu năng lượng", tint: "#EAF1FE", on: true, score: 2 },
  { label: "Lo lắng", emoji: "😟", desc: "Có chuyện đang nghĩ", tint: "#F0ECFE", on: false, score: 2 },
  { label: "Buồn", emoji: "😔", desc: "Hôm nay hơi trũng", tint: "#E4E9F2", on: false, score: 1 },
  { label: "Căng thẳng", emoji: "😣", desc: "Áp lực, quá tải", tint: "#FDEBF2", on: false, score: 1 },
]
```

`getStoredSettings()` hiện đọc `moods` bằng `Array.isArray(parsed.moods) ? parsed.moods : DEFAULT_SETTINGS.moods` — KHÔNG có validate từng phần tử (khác `budget-storage.ts`). Mood cũ đã lưu trước tính năng này thiếu hẳn `score` sẽ đi qua nguyên vẹn. Thêm 1 bước backfill nhẹ ngay sau dòng đó:
```ts
const moodsWithScore = (Array.isArray(parsed.moods) ? parsed.moods : DEFAULT_SETTINGS.moods).map(
  (m: Partial<Mood>) => ({ ...m, score: typeof m.score === "number" ? m.score : 3 }) as Mood
)
```
(giữ nguyên phong cách hiện tại của file — không đổi sang zod chỉ vì 1 field mới).

Thêm field mới cho cơ chế dismiss insight (chi tiết ở mục "Cơ chế dismiss" bên dưới):
```ts
interface AppSettings {
  profile: Profile
  moods: Mood[]
  modules: ModuleToggle[]
  tags: BudgetTag[]
  dismissedInsights: string[] // các insight id người dùng đã ẩn
}
```
Đọc theo đúng convention hiện có của `moods`/`tags` (whole-array fallback, không validate từng phần tử): `Array.isArray(parsed.dismissedInsights) ? parsed.dismissedInsights : []`.

### `src/features/journal/types.ts` — thêm `score` vào `MoodSnapshot`

```ts
interface MoodSnapshot {
  emoji: string
  label: string
  tint: string
  score: number
}
```
Giữ đúng nguyên tắc snapshot đã có (đông cứng tại thời điểm ghi, không đổi theo taxonomy sau này) — áp dụng luôn cho `score`, không chỉ label/emoji/tint. Entry Nhật ký cũ đã lưu trước tính năng này sẽ có `mood.score === undefined` — các hàm tính insight phải chủ động BỎ QUA những entry như vậy (không mặc định về 3), vì gán điểm trung tính giả sẽ làm loãng tín hiệu tương quan thay vì phản ánh đúng "không biết".

### `src/features/journal/components/journal-view.tsx` — 1 dòng đổi

```ts
const selectedMoodSnapshot = selectedMood
  ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint, score: selectedMood.score }
  : null
```

### Snapshot tài sản ròng — mới, thuộc feature `overview` (không phải `finance`)

Lý do đặt ở `overview` chứ không phải `finance`: đây là dữ liệu quan sát/lịch sử phục vụ riêng cho insight, không phải dữ liệu người dùng trực tiếp CRUD như phần còn lại của `FinanceState` — trang Tài chính không cần biết gì về nó, chỉ trang Tổng quan (nơi `summarizeFinance` đã được gọi sẵn) cần đọc/ghi.

`src/features/overview/net-worth-history-storage.ts` (file mới, mirror đúng phong cách `finance-storage.ts`):
```ts
interface NetWorthSnapshot {
  date: string // dayKey "YYYY-MM-DD"
  net: number
  savingsTotal: number
}

type NetWorthHistory = NetWorthSnapshot[]

const NET_WORTH_HISTORY_KEY = "net-worth-history"
const DEFAULT_NET_WORTH_HISTORY: NetWorthHistory = []
```
Schema Zod đầy đủ (khác `settings-storage.ts` — đây là dữ liệu lịch sử tích luỹ dài hạn không giới hạn số điểm, nên áp đúng nguyên tắc lọc-từng-phần-tử đã dùng ở `budget-storage.ts`/`study-storage.ts`'s `wordReviews`, không phải whole-array fallback): 1 bản ghi hỏng bị loại, các bản ghi hợp lệ khác giữ nguyên.

## Logic thuần

### `src/features/overview/net-worth-history-calculations.ts` (file mới)

```ts
function shouldRecordSnapshot(history: NetWorthSnapshot[], today: string): boolean {
  const last = history[history.length - 1]
  return !last || last.date !== today
}

function appendSnapshot(history: NetWorthSnapshot[], snapshot: NetWorthSnapshot): NetWorthSnapshot[] {
  if (!shouldRecordSnapshot(history, snapshot.date)) return history
  return [...history, snapshot]
}
```
`shouldRecordSnapshot`/`appendSnapshot` nhận `today` làm tham số (không tự gọi `dayKey()`) — đúng nguyên tắc hàm thuần đã áp dụng xuyên suốt (SM-2 trong tính năng SRS). Chỉ append khi bản ghi CUỐI CÙNG khác ngày hôm nay — dữ liệu vốn đã sắp xếp theo thời gian ghi (append-only), không cần tìm kiếm toàn mảng.

### `src/features/overview/insights-calculations.ts` (file mới) — 4 hàm phát hiện + type dùng chung

```ts
interface Insight {
  id: string
  text: string
}
```

Hằng số ngưỡng:
```ts
const ANOMALY_LOOKBACK_MONTHS = 3
const ANOMALY_Z_SCORE_THRESHOLD = 1.5
const TAG_ANOMALY_PCT_THRESHOLD = 0.5 // 50%
const MOOD_WINDOW_DAYS = 60
const MOOD_MIN_DAYS_PER_GROUP = 5
const MOOD_LOW_SCORE_MAX = 2
const MOOD_HIGH_SCORE_MIN = 4
const MOOD_PCT_THRESHOLD = 0.2 // 20%
const FORECAST_MIN_POINTS = 14
```

Hàm thống kê nội bộ (không export, chỉ dùng trong file này):
```ts
function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}
```

**Insight 1 — chi tiêu tháng bất thường (tổng):**
```ts
function detectSpendingAnomaly(expenses: Expense[], month: string, today: string): Insight | null {
  if (!expenses.length) return null
  const earliestMonth = expenses.reduce(
    (min, e) => (monthKeyFromDayKey(e.dayKey) < min ? monthKeyFromDayKey(e.dayKey) : min),
    monthKeyFromDayKey(expenses[0].dayKey)
  )
  const requiredEarliest = shiftMonth(month, -ANOMALY_LOOKBACK_MONTHS)
  if (earliestMonth > requiredEarliest) return null // chưa đủ 3 tháng dữ liệu trước tháng này

  const priorMonths = Array.from({ length: ANOMALY_LOOKBACK_MONTHS }, (_, i) =>
    shiftMonth(month, -(ANOMALY_LOOKBACK_MONTHS - i))
  )
  const priorTotals = monthlyExpenseTotals(expenses, priorMonths).map((p) => p.total)
  const currentTotal = totalExpensesForMonth(expenses, month)
  const std = sampleStdDev(priorTotals)
  if (std === 0) return null // không có biến động để so sánh (vd. 3 tháng trước chi giống hệt nhau)

  const z = (currentTotal - mean(priorTotals)) / std
  if (Math.abs(z) < ANOMALY_Z_SCORE_THRESHOLD) return null

  const pct = Math.round((Math.abs(currentTotal - mean(priorTotals)) / mean(priorTotals)) * 100)
  const direction = z > 0 ? "cao hơn" : "thấp hơn"
  return {
    id: `spending-anomaly-${month}`,
    text: `Tháng này bạn chi tiêu ${direction} khoảng ${pct}% so với trung bình 3 tháng gần đây.`,
  }
}
```

**Insight 2 — chi tiêu bất thường theo 1 tag:**
```ts
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
    if (avgPrior === 0) continue // tag mới xuất hiện tháng này, không có nền để so sánh
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
```
Chỉ báo ĐÚNG 1 tag lệch nhiều nhất mỗi tháng (không liệt kê hết mọi tag vượt ngưỡng) — tránh spam nhiều insight cùng lúc.

**Insight 3 — tương quan chi tiêu ↔ tâm trạng:**
```ts
function detectMoodSpendingCorrelation(expenses: Expense[], entries: JournalEntry[], today: string): Insight | null {
  const windowStart = shiftDay(today, -MOOD_WINDOW_DAYS)
  const moodByDay = new Map<string, number[]>()
  for (const entry of entries) {
    if (entry.mood?.score === undefined) continue // entry cũ trước khi có score — bỏ qua, không đoán
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
    id: `mood-spending-${monthKey(new Date(today))}`,
    text: `Trong 60 ngày qua, những ngày tâm trạng thấp bạn chi tiêu ${direction} khoảng ${Math.round(Math.abs(pct) * 100)}% so với những ngày tâm trạng cao.`,
  }
}
```

**Insight 4 — dự báo ngày đạt mục tiêu tiết kiệm:**
```ts
function forecastSavingsGoal(history: NetWorthSnapshot[], target: number, today: string): Insight | null {
  if (history.length < FORECAST_MIN_POINTS) return null

  // Hồi quy tuyến tính đơn giản (least squares) trên (chỉ số ngày, savingsTotal).
  const n = history.length
  const xs = history.map((_, i) => i)
  const ys = history.map((h) => h.savingsTotal)
  const meanX = mean(xs)
  const meanY = mean(ys)
  const numerator = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0)
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0)
  const slope = denominator === 0 ? 0 : numerator / denominator // đơn vị: đồng/ngày

  const currentSavings = history[n - 1].savingsTotal
  if (currentSavings >= target || slope <= 0) return null // đã đạt, hoặc xu hướng không tăng — không dự báo

  const daysToTarget = Math.ceil((target - currentSavings) / slope)
  const targetDate = shiftDay(today, daysToTarget)

  return {
    id: "savings-forecast",
    text: `Với nhịp tiết kiệm hiện tại, bạn có thể đạt mục tiêu tiết kiệm vào khoảng ${formatDayKey(targetDate)}.`,
  }
}
```
`id` cố định (không gắn theo tháng) vì đây là 1 dự báo liên tục, không phải sự kiện riêng của 1 tháng — dismiss xong thì ẩn hẳn cho tới khi người dùng chủ động bật lại (xem mục Cơ chế dismiss).

## Cơ chế dismiss

`useSettings()` thêm:
```ts
function dismissInsight(id: string): void
```
Thêm `id` vào `settings.dismissedInsights` nếu chưa có (giữ nguyên nếu đã có — không cần toggle 2 chiều, mirror đúng cách `addMood`/`addTag` chỉ append). Không có UI "un-dismiss" trong v1 (YAGNI — nếu người dùng cần bỏ ẩn 1 insight, xoá cache dữ liệu hoặc chờ kỳ sau id đổi).

## Wiring

### `src/features/overview/hooks/use-net-worth-history.ts` (hook mới, mirror `useFinance`)

```ts
function useNetWorthHistory(): {
  history: NetWorthSnapshot[]
  recordSnapshot(net: number, savingsTotal: number): void
}
```
`recordSnapshot` gọi `appendSnapshot(history, {date: dayKey(), net, savingsTotal})`, chỉ `setStoredNetWorthHistory` khi kết quả thực sự khác reference (giống pattern `seedReviews` bên Study — tránh ghi thừa).

### `src/features/overview/components/overview-view.tsx`

```ts
const { history, recordSnapshot } = useNetWorthHistory()
const { salary... } = useBudget() // đã có sẵn
const { entries } = useJournal() // đã có sẵn
const summary = summarizeFinance({ savings, cards, gold, goldStores, invests }) // đã có sẵn

useEffect(() => {
  recordSnapshot(summary.net, summary.savingsTotal)
}, [recordSnapshot, summary.net, summary.savingsTotal])
```
`recordSnapshot` tự no-op nếu hôm nay đã ghi rồi (qua `appendSnapshot`'s early-return) — effect có thể chạy lại nhiều lần vô hại.

```ts
const today = dayKey()
const savingsGoal = goals.find((g) => g.key === "savings")
const insights = [
  enabled("chitieu") ? detectSpendingAnomaly(expenses, monthKey(), today) : null,
  enabled("chitieu") ? detectTagAnomaly(expenses, monthKey()) : null,
  enabled("chitieu") && enabled("nhatky") ? detectMoodSpendingCorrelation(expenses, entries, today) : null,
  enabled("muctieu") && savingsGoal ? forecastSavingsGoal(history, savingsGoal.target, today) : null,
]
  .filter((i): i is Insight => i !== null)
  .filter((i) => !settings.dismissedInsights.includes(i.id))
```
(`expenses` cần lấy thêm từ `useBudget()` — hiện `overview-view.tsx` đã gọi `useBudget()` nhưng có thể chưa destructure `expenses`, cần bổ sung.)

### `src/features/overview/components/insights-section.tsx` (component mới)

```ts
interface InsightsSectionProps {
  insights: Insight[]
  onDismiss: (id: string) => void
}
```
Không render gì (`return null`) khi `insights.length === 0` — khác các section khác luôn hiện (kể cả rỗng), vì đây là gợi ý chủ động, không có gì thì không nên chiếm chỗ. Mỗi insight là 1 hàng trong 1 `Card` chung, icon 💡, text, nút "×" gọi `onDismiss(insight.id)`. Đặt ngay sau khối lời chào, trước mọi `SectionHead`/section theo module (vì insight liên module, không thuộc riêng section nào).

## Ngoài phạm vi

- Không có UI "bật/tắt từng LOẠI insight" trong Cài đặt (khác dismiss-theo-instance) — có thể làm sau nếu cần.
- Không có UI "bỏ ẩn" 1 insight đã dismiss.
- Không mở rộng sang các loại tương quan khác (vd. học tập ↔ tâm trạng) — chỉ đúng 4 insight đã chốt.
- Không tối ưu hiệu năng (memoization) — tính lại mỗi lần render, chấp nhận được ở quy mô dữ liệu cá nhân.
- Không backfill snapshot cho các ngày TRƯỚC KHI tính năng này tồn tại — `netWorthHistory` bắt đầu từ 0 điểm, tích luỹ dần từ ngày triển khai.

## Test (TDD)

- `net-worth-history-calculations.test.ts`: `shouldRecordSnapshot`/`appendSnapshot` (chưa có bản ghi nào → ghi; đã có bản ghi hôm nay → không ghi thêm; bản ghi cuối khác ngày → ghi thêm).
- `net-worth-history-storage.test.ts`: lọc từng phần tử hỏng (mirror `budget-storage.test.ts`), backfill mảng rỗng khi thiếu key.
- `insights-calculations.test.ts` (file lớn nhất, test kỹ từng hàm):
  - `detectSpendingAnomaly`: chưa đủ 3 tháng lịch sử → null; đủ dữ liệu nhưng không lệch → null; lệch tăng/giảm vượt ngưỡng → đúng text + đúng chiều; std=0 (3 tháng chi giống hệt nhau) → null.
  - `detectTagAnomaly`: nhiều tag cùng lệch → chỉ trả về tag lệch nhiều nhất; tag mới xuất hiện tháng này (không có nền) → bỏ qua tag đó.
  - `detectMoodSpendingCorrelation`: entry thiếu `score` (dữ liệu cũ) → bị bỏ qua, không tính; chưa đủ 5 ngày mỗi nhóm → null; chênh lệch dưới ngưỡng → null; nhiều entry cùng ngày → lấy trung bình đúng.
  - `forecastSavingsGoal`: chưa đủ 14 điểm → null; xu hướng giảm/đi ngang → null; đã đạt target rồi → null; xu hướng tăng đủ dữ liệu → đúng công thức hồi quy (so khớp bằng tay 1 bộ số đơn giản, vd. tăng đều 100k/ngày).
- `settings-storage.test.ts` mở rộng: backfill `score` cho Mood cũ thiếu field; đọc/ghi `dismissedInsights`.
- `use-settings.test.ts` mở rộng: `dismissInsight` thêm đúng id, không thêm trùng lần 2.
- `use-net-worth-history.test.ts` (mới): `recordSnapshot` ghi đúng 1 lần/ngày, không ghi thêm khi gọi lại trong cùng ngày.
- `insights-section.test.tsx` (mới): không render gì khi rỗng; render đúng text; bấm "×" gọi đúng `onDismiss(id)`.
- `overview-view.test.tsx` mở rộng: test tích hợp — seed dữ liệu Chi tiêu 4 tháng (3 tháng nền + 1 tháng lệch hẳn), xác nhận insight chi tiêu bất thường hiện đúng; dismiss xong reload thì insight đó biến mất.

## Thứ tự triển khai

1. `settings-storage.ts` — thêm `score` vào `Mood`, `dismissedInsights` vào `AppSettings`, backfill + test.
2. `journal/types.ts` + `journal-view.tsx` — thêm `score` vào `MoodSnapshot` + test.
3. `use-settings.ts` — thêm `dismissInsight` + test.
4. `net-worth-history-storage.ts` (mới) + test.
5. `net-worth-history-calculations.ts` (mới) — `shouldRecordSnapshot`/`appendSnapshot` + test.
6. `use-net-worth-history.ts` (hook mới) + test.
7. `insights-calculations.ts` (mới) — 4 hàm phát hiện, làm từng hàm kèm test riêng theo đúng thứ tự đã liệt kê ở trên (đơn giản nhất trước): `detectSpendingAnomaly` → `detectTagAnomaly` → `detectMoodSpendingCorrelation` → `forecastSavingsGoal`.
8. `insights-section.tsx` (component mới) + test.
9. Wire vào `overview-view.tsx` (gọi `recordSnapshot`, tính 4 insight, lọc dismissed, render `InsightsSection`) + test tích hợp.
10. Chạy toàn bộ `npm run test` + `npm run lint` + `npx tsc --noEmit`, kiểm tra tay qua `npm run dev`: seed dữ liệu Chi tiêu/Nhật ký đủ điều kiện qua DevTools localStorage, xác nhận từng insight hiện đúng, dismiss rồi reload xác nhận biến mất.

## Rủi ro / điểm cần chú ý khi triển khai

- **`forecastSavingsGoal`'s `history.length < 14` khiến insight này hoàn toàn im lặng trong ít nhất 14 ngày đầu triển khai** — đã được người dùng chấp nhận trước, không phải thiếu sót.
- **Mọi hàm phát hiện đều nhận `today`/`month` làm tham số**, không tự gọi `dayKey()`/`monthKey()` bên trong — bắt buộc để test được bằng ngày cố định, đúng nguyên tắc đã áp dụng cho toàn bộ tính năng SRS.
- **`detectTagAnomaly` chỉ báo 1 tag/tháng** (tag lệch nhiều nhất) — nếu 2 tag cùng lệch mạnh, tag còn lại sẽ không được báo tháng đó. Đây là quyết định chủ ý (tránh spam), không phải giới hạn kỹ thuật.
- **Snapshot `net-worth-history` không có UI xoá/sửa nào** — chỉ tự động ghi, không có cách người dùng can thiệp tay nếu 1 ngày bị ghi sai số (vd. do lỗi tạm thời khi tính `summarizeFinance`). Chấp nhận được vì đây là dữ liệu quan sát, không phải dữ liệu người dùng trực tiếp nhập.
- **Đổi `Mood`/`MoodSnapshot` là thay đổi vào 2 tính năng đã public (Cài đặt, Nhật ký)** — đã kiểm tra `add-mood-form.tsx` hiện tại: `AddMoodFormProps.onAdd: (mood: Omit<Mood, "tint" | "on">) => void` không có UI chọn điểm số, và v1 KHÔNG thêm UI này (YAGNI, đúng tinh thần mục "Ngoài phạm vi"). Đổi type thành `Omit<Mood, "tint" | "on" | "score">`, và `addMood` trong `use-settings.ts` tự gán `score: 3` (trung tính) cho mọi mood người dùng tự thêm — người dùng có thể sửa lại điểm số sau này nếu tính năng đó được thêm ở bản sau, nhưng không bắt buộc phải quyết định ngay lúc thêm mood mới.
