# Ôn tập từ vựng theo lặp lại ngắt quãng (SRS)

## Context

Trang Học tập hiện có 2 cách tiếp cận 333 từ vựng (`content/vocabulary.jsonl`): (1) tab "Hôm nay" hiện cố định 5 từ/ngày qua `pickDaily(vocab, 5, dayKey(), "vocab")` — thuần hiển thị, không kiểm tra trí nhớ; (2) 3 mini-game (Trắc nghiệm/Ghép cặp/Gõ từ, `src/features/study/components/games/`) rút ngẫu nhiên thật mỗi ván, chỉ lưu điểm cao nhất + streak chơi, không lưu từ nào đúng/sai. Không có khái niệm "độ thuộc" hay lịch ôn riêng từng từ — mọi từ được đối xử như nhau mỗi ngày.

Đã xác nhận qua brainstorming với người dùng:
- **Nguồn tín hiệu "nhớ/quên"**: cả 2 — tự đánh giá thủ công (màn ôn tập mới, kiểu Anki) VÀ tự động từ kết quả mini-game.
- **Thuật toán**: SM-2 đầy đủ (ease factor + interval động theo công thức SuperMemo-2 gốc), rút gọn UI thành 4 nút chấm điểm (Quên/Khó/Nhớ/Dễ) — cách hầu hết app thẻ ghi nhớ hiện đại (kể cả Anki) làm, thay vì phơi thang 0-5 gốc ra UI.
- **Phạm vi**: toàn bộ 333 từ vào hệ SRS ngay khi tính năng lên, không cần người dùng chủ động "thêm vào ôn tập" từng từ.
- **Vị trí UI**: thay thế hẳn card "5 từ vựng hôm nay" hiện tại trong tab "Hôm nay" — không chạy song song 2 cơ chế.
- **Giới hạn hiển thị/ngày**: 5 từ (giữ đúng con số cũ, tránh dồn cục 333 từ ngày đầu — phần tồn đọng rã dần qua các ngày sau, giống cơ chế "new cards/day" của Anki).
- **Từ đã đánh dấu "learned" (thuộc) từ trước**: được seed đầu vào SRS với khoảng cách 6 ngày (thay vì tới hạn ngay hôm nay) — vì người dùng đã tự xác nhận biết từ đó rồi.
- **Ghép cặp chỉ tạo tín hiệu 1 chiều**: chỉ chấm "Nhớ" khi ăn đúng cặp; KHÔNG chấm "Quên" khi lật lệch — lật lệch thường do quên vị trí thẻ trên bàn chơi, không phải quên nghĩa từ, chấm sai sẽ làm nhiễu lịch ôn.

**Nguyên tắc thiết kế xuyên suốt**: mọi hàm tính lịch ôn (SM-2, chọn từ tới hạn, backfill state thiếu) đều thuần — nhận `today`/`now` làm tham số thay vì tự gọi `dayKey()`/`new Date()` bên trong, đúng quy ước đã dùng ở `nextStreak(current, today)` (`game-calculations.ts`). `use-study.ts` là nơi DUY NHẤT ghi `wordReviews` vào storage — màn ôn tập thủ công và 3 mini-game đều gọi vào đúng 1 hàm `gradeWord` của hook này, không tự ghi storage riêng.

## Data model

### `src/features/study/types.ts` — thêm mới

```ts
type ReviewGrade = "again" | "hard" | "good" | "easy"

interface WordReviewState {
  wordId: string
  easeFactor: number
  intervalDays: number
  repetitions: number
  dueAt: string // dayKey "YYYY-MM-DD"
  lastReviewedAt: string | null // ISO timestamp, null = chưa từng ôn thật (chỉ mới seed)
}
```

### `src/features/study/study-storage.ts` — mở rộng `StudyState`

```ts
interface StudyState {
  tasks: Task[]
  learned: string[]
  gameHighScores: GameHighScores
  gameStreak: GameStreak
  wordReviews: Record<string, WordReviewState> // key = VocabEntry.id
}
```

`DEFAULT_STUDY_STATE.wordReviews = {}`. Vì đây là 1 `Record` (không phải mảng), áp đúng nguyên tắc "lọc từng phần tử khi hỏng" đã dùng ở `budget-storage.ts` (khác `finance-storage.ts` cũ vốn fail cả mảng) — 1 entry hỏng không được kéo sập toàn bộ 333 entry còn lại:

```ts
const wordReviewStateSchema: z.ZodType<WordReviewState> = z.object({
  wordId: z.string(),
  easeFactor: z.number(),
  intervalDays: z.number(),
  repetitions: z.number(),
  dueAt: z.string(),
  lastReviewedAt: z.string().nullable(),
})

function safeWordReviews(value: unknown): Record<string, WordReviewState> {
  if (typeof value !== "object" || value === null) return {}
  const out: Record<string, WordReviewState> = {}
  for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
    const result = wordReviewStateSchema.safeParse(entry)
    if (result.success) out[id] = result.data
  }
  return out
}
```

`parseStudyState` gọi `safeWordReviews(parsed.wordReviews)` thay vì `safeField(...)` (khác 4 field còn lại — vì đây không phải "đúng shape hay fallback nguyên field", mà là "giữ từng entry hợp lệ, bỏ từng entry hỏng"). Backup cũ trước khi có tính năng này thiếu hẳn field `wordReviews` → `Object.entries({})` rỗng → trả về `{}` đúng như default, không cần bump `EXPORT_VERSION` trong `data-transfer.ts` (field mới tự fallback, đúng cách các field khác đã làm).

## Thuật toán SM-2 thuần — `src/features/study/srs-calculations.ts` (file mới)

```ts
const SRS_EASE_START = 2.5
const SRS_EASE_FLOOR = 1.3
const DAILY_REVIEW_CAP = 5

const GRADE_QUALITY: Record<ReviewGrade, number> = { again: 0, hard: 3, good: 4, easy: 5 }
```

```ts
function initialReviewState(wordId: string, today: string): WordReviewState {
  return { wordId, easeFactor: SRS_EASE_START, intervalDays: 0, repetitions: 0, dueAt: today, lastReviewedAt: null }
}
```
Từ hoàn toàn mới (hoặc chưa từng đánh dấu "learned") — tới hạn ngay hôm nay, chưa có lịch sử.

```ts
function seedLearnedReviewState(wordId: string, today: string): WordReviewState {
  return { wordId, easeFactor: SRS_EASE_START, intervalDays: 6, repetitions: 2, dueAt: shiftDay(today, 6), lastReviewedAt: null }
}
```
Từ đã đánh dấu "learned" trước khi có SRS — coi như đã "nhớ" 2 lần liên tiếp đúng nhịp SM-2 chuẩn (`repetitions: 2` → khoảng ôn 6 ngày là giá trị interval thật sự của SM-2 ở mốc lần nhớ thứ 2, không phải số tuỳ chọn riêng) để không dồn thêm vào backlog ngày đầu.

```ts
function applyGrade(state: WordReviewState, grade: ReviewGrade, today: string, now: string): WordReviewState {
  const quality = GRADE_QUALITY[grade]
  const easeFactor = Math.max(
    SRS_EASE_FLOOR,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  if (quality < 3) {
    // Quên: về lại lịch ôn ngắn nhất, không tính là 1 lần nhớ liên tiếp — nhưng easeFactor vẫn hạ
    // theo đúng công thức SM-2 (phạt nặng hơn Khó/Nhớ/Dễ), phản ánh từ này "khó" hơn trước.
    return { ...state, easeFactor, repetitions: 0, intervalDays: 1, dueAt: shiftDay(today, 1), lastReviewedAt: now }
  }

  const repetitions = state.repetitions + 1
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(state.intervalDays * easeFactor)
  return { ...state, easeFactor, repetitions, intervalDays, dueAt: shiftDay(today, intervalDays), lastReviewedAt: now }
}
```
Đúng công thức SuperMemo-2 gốc không rút gọn/xấp xỉ — `easeFactor` không bao giờ xuống dưới `SRS_EASE_FLOOR` (1.3, giá trị chuẩn của thuật toán gốc). Nhận `today`/`now` làm tham số (không tự gọi `dayKey()`/`new Date()`) để test được bằng giá trị cố định, không cần mock Date.

```ts
function ensureReviewStates(
  wordReviews: Record<string, WordReviewState>,
  vocab: VocabEntry[],
  learned: string[],
  today: string
): Record<string, WordReviewState> {
  const missing = vocab.filter((v) => !wordReviews[v.id])
  if (!missing.length) return wordReviews // cùng reference — gọi nơi cần biết có gì đổi thật không
  const additions = Object.fromEntries(
    missing.map((v) => [
      v.id,
      learned.includes(v.id) ? seedLearnedReviewState(v.id, today) : initialReviewState(v.id, today),
    ])
  )
  return { ...wordReviews, ...additions }
}
```
Xử lý ĐỒNG THỜI 2 tình huống bằng 1 hàm: migrate lần đầu (toàn bộ 333 từ đều "missing" khi tính năng vừa lên) và từ mới thêm vào `content/vocabulary.jsonl` về sau (theo đúng quy trình đã ghi ở `content/README.md`) — cả 2 chỉ là "từ chưa có `WordReviewState`", xử lý giống hệt nhau.

```ts
function getDueWords(wordReviews: Record<string, WordReviewState>, vocab: VocabEntry[], today: string): VocabEntry[] {
  const due = vocab.filter((v) => wordReviews[v.id] && wordReviews[v.id].dueAt <= today)
  return [...due].sort((a, b) => wordReviews[a.id].dueAt.localeCompare(wordReviews[b.id].dueAt))
}
```
Trả về TOÀN BỘ từ tới hạn, sắp xếp từ quá hạn lâu nhất trước, KHÔNG cắt theo `DAILY_REVIEW_CAP` ở đây — cắt là việc của nơi hiển thị (để còn biết tổng số từ đang tồn đọng, không chỉ số hiện ra). So sánh chuỗi `dueAt <= today` đúng vì `dayKey()` có định dạng `YYYY-MM-DD` (zero-pad), so sánh string tương đương so sánh thời gian thật — không cần thư viện ngày tháng nào thêm, đúng quy ước có sẵn của `date.ts`.

## Hook — `src/features/study/hooks/use-study.ts` — thêm `wordReviews`, `gradeWord`

```ts
function gradeWord(wordId: string, grade: ReviewGrade): void
```
- Nếu `wordId` chưa có entry trong `state.wordReviews` (chưa từng được `ensureReviewStates` chạm tới) → tự tạo tại chỗ (`initialReviewState`/`seedLearnedReviewState` tuỳ `state.learned.includes(wordId)`) rồi chấm luôn trong 1 bước, KHÔNG cần 1 effect backfill riêng chạy trước. Nhờ vậy `use-study.ts` không cần biết `vocab` (nó vốn không có, giống các hàm khác trong hook này) — nơi hiển thị mới cần `vocab` để tính "từ nào tới hạn", còn ghi thì luôn tự đủ dữ liệu.
- Gọi `applyGrade(current, grade, dayKey(), new Date().toISOString())`, persist 1 lần (giống `toggleLearned`/`recordGameResult`).

`wordReviews: state.wordReviews` được export thẳng (raw, chưa `ensureReviewStates`) — nơi hiển thị (`StudyView`) tự gọi `ensureReviewStates` với `vocab` nó đang có để tính "hiệu lực" tại thời điểm render, không persist phần backfill-chỉ-để-xem này (chỉ `gradeWord` mới thật sự ghi storage). Giữ đúng nguyên tắc đã nêu ở Context: "hook là nơi duy nhất ghi storage", còn tính toán hiển thị là việc của component qua hàm thuần.

## Wiring vào `study-view.tsx`

```ts
const today = dayKey()
const effectiveReviews = ensureReviewStates(wordReviews, vocab, learned, today)
const dueWords = getDueWords(effectiveReviews, vocab, today)
```
- Dòng thống kê đầu trang: thay `{learnedToday}/5 từ hôm nay` bằng `{dueWords.length} từ cần ôn`.
- Trong tab "Hôm nay": bỏ hẳn `<VocabCard label="5 từ vựng hôm nay" entries={daily} .../>`, thay bằng `<ReviewDueCard dueWords={dueWords} onGrade={gradeWord} className="min-w-0 flex-[1_1_100%]" />`. Phần ngữ pháp (`dailyGrammar = pickDaily(grammar, 1, key, "grammar")[0]`) và `pickDaily` cho vocab (`daily = pickDaily(vocab, 5, key, "vocab")`) — **xoá dòng `pickDaily` cho vocab vì không còn dùng**, **giữ nguyên dòng `pickDaily` cho grammar**.

## Component mới

### `src/features/study/components/review-word-card.tsx`

```ts
interface ReviewWordCardProps {
  entry: VocabEntry
  onGrade: (wordId: string, grade: ReviewGrade) => void
}
```
State nội bộ riêng từng thẻ: `revealed: boolean` (mặc định `false`), `graded: ReviewGrade | null` (mặc định `null`).
- Chưa `revealed`: hiện `word` + `phonetic` + `SpeakButton` + nút "Hiện nghĩa" (bấm → `setRevealed(true)`).
- `revealed`, chưa `graded`: thêm `meaning`/`example`/ảnh (`ImageWithFallback`, tái dùng đúng layout `VocabWordCard` đang có) + 4 nút Quên/Khó/Nhớ/Dễ, bấm 1 nút → `onGrade(entry.id, grade)` + `setGraded(grade)`.
- Đã `graded`: thẻ chuyển trạng thái mờ + dấu tích + nhãn grade đã chọn, 4 nút biến mất/disable — thẻ KHÔNG biến mất khỏi lưới (tránh giật layout giữa phiên ôn).

### `src/features/study/components/review-due-card.tsx`

```ts
interface ReviewDueCardProps {
  dueWords: VocabEntry[] // đã tính sẵn ở study-view.tsx, KHÔNG cắt theo cap
  onGrade: (wordId: string, grade: ReviewGrade) => void
  className?: string
}
```
`const [shown] = useState(() => dueWords.slice(0, DAILY_REVIEW_CAP))` — đóng băng đúng 1 lần lúc mount theo đúng idiom `useState(() => ...)` đã dùng ở `SpellingGame`'s `queue`/`MatchGame`'s `cards` — chấm điểm 1 thẻ không làm 4 thẻ còn lại xáo trộn hay đổi số lượng giữa phiên. Header: `Card label="Từ cần ôn hôm nay" action={\`${dueWords.length} từ đang chờ\`}`. Nếu `dueWords.length === 0` → `<Empty pose="cheer" title="Không có từ nào cần ôn hôm nay" hint="Quay lại vào ngày mai nhé!" />`. Ngược lại render lưới `ReviewWordCard` cho từng phần tử `shown` (grid class giống `VocabCard` mặc định).

## Mini-game báo tín hiệu tự động

### `src/features/study/game-registry.ts` — mở rộng kiểu `Component`

```ts
interface GameDefinition {
  type: GameType
  icon: string
  label: string
  maxScore: number
  Component: ComponentType<{
    vocab: VocabEntry[]
    onFinish: (score: number, total?: number) => void
    onWordReviewed: (wordId: string, correct: boolean) => void
  }>
}
```

### `src/features/study/components/games/game-tab.tsx` — thêm prop, forward xuống game đang chơi

```ts
interface GameTabProps {
  vocab: VocabEntry[]
  highScores: GameHighScores
  streak: GameStreak
  onFinish: (type: GameType, score: number) => { isNewHighScore: boolean }
  onWordReviewed: (wordId: string, correct: boolean) => void
}
```
`<Component vocab={vocab} onFinish={...} onWordReviewed={onWordReviewed} />` — forward thẳng, không xử lý gì thêm (`GameTab` không biết SM-2, chỉ chuyển tiếp).

### 3 game — thêm lời gọi `onWordReviewed` đúng đúng thời điểm xảy ra sự kiện (không gộp cuối ván)

| Game | Khi nào gọi | Chi tiết |
|---|---|---|
| `quiz-game.tsx` | Mỗi câu, ngay khi trả lời (kể cả hết giờ) | Trong `advance(gainedPoint)`: `onWordReviewed(question.correct.id, gainedPoint)` — cả 2 chiều đúng/sai đều chấm, vì mỗi câu gắn chặt với đúng 1 từ. |
| `spelling-game.tsx` | Từ bị diệt (gõ đúng) → đúng; từ rơi hết giờ mà chưa gõ xong → sai | Nhánh diệt từ (`exact` match): `onWordReviewed(exact.entry.id, true)`. Nhánh `missedNow` (có thể nhiều từ rơi cùng lúc 1 tick): loop gọi `onWordReviewed(w.entry.id, false)` cho từng từ trong `missedNow`. |
| `match-game.tsx` | CHỈ khi ăn đúng cặp | Trong nhánh `first.vocabId === second.vocabId`: `onWordReviewed(first.vocabId, true)`. Nhánh lệch cặp (`mismatchTimerRef...`) **KHÔNG gọi** — đúng quyết định đã chốt ở Context. |

`StudyView` truyền `onWordReviewed={(wordId, correct) => gradeWord(wordId, correct ? "good" : "again")}` xuống `GameTab` — quy đổi tín hiệu nhị phân của game thành 1 trong 2 grade "chuẩn" (Nhớ/Quên), không có Khó/Dễ vì máy không biết mức độ khó chủ quan của người chơi (nhánh sắc thái này chỉ có ở màn tự đánh giá thủ công).

## Test (TDD — viết trước theo đúng convention CLAUDE.md)

- `srs-calculations.test.ts` (mới): `applyGrade` — lần nhớ đầu tiên ra interval 1, lần nhớ thứ 2 ra interval 6, lần nhớ thứ 3 trở đi ra `round(interval * easeFactor)`, chấm "Quên" bất kỳ lúc nào đưa `repetitions` về 0 và interval về 1, `easeFactor` không bao giờ xuống dưới 1.3 dù chấm "Quên" liên tục nhiều lần; `initialReviewState`/`seedLearnedReviewState` seed đúng giá trị (đặc biệt `seedLearnedReviewState` ra `dueAt = today + 6 ngày`, `repetitions = 2`); `ensureReviewStates` chỉ thêm entry còn thiếu (trả nguyên reference khi không thiếu gì), seed đúng loại (cold/learned) theo `learned`; `getDueWords` lọc đúng theo `dueAt <= today`, sắp xếp quá hạn lâu nhất lên đầu, bỏ qua từ chưa tới hạn.
- `study-storage.test.ts`: mở rộng — `wordReviews` thiếu hẳn (backup cũ trước tính năng này) fallback `{}`; 1 entry trong `wordReviews` sai shape bị loại còn các entry hợp lệ khác giữ nguyên (không mất cả field).
- `use-study.test.ts`: mở rộng — `gradeWord` tạo entry mới đúng loại (cold/learned) khi từ đó chưa từng có trong `wordReviews`, cập nhật đúng theo `applyGrade` khi đã có, persist đúng 1 lần.
- `review-word-card.test.tsx` (mới): mặc định ẩn nghĩa; bấm "Hiện nghĩa" hiện nghĩa + 4 nút; bấm 1 nút gọi đúng `onGrade(id, grade)` và chuyển sang trạng thái đã chấm (nút biến mất/disable).
- `review-due-card.test.tsx` (mới): render đúng tối đa `DAILY_REVIEW_CAP` thẻ dù `dueWords` dài hơn; hiện đúng tổng số "đang chờ"; trạng thái rỗng khi `dueWords` rỗng; chấm 1 thẻ không làm thẻ khác biến mất/xáo trộn.
- `study-view.test.tsx`: cập nhật — tab "Hôm nay" render `ReviewDueCard` thay vì `VocabCard` cũ cho phần từ vựng; dòng thống kê đầu trang hiện đúng số từ cần ôn.
- 3 file test game mở rộng: `quiz-game.test.tsx` (chọn đúng/sai gọi đúng `onWordReviewed(id, true/false)`), `spelling-game.test.tsx` (diệt từ gọi `true`, để rơi hết giờ gọi `false`), `match-game.test.tsx` (ăn cặp gọi `true`, lật lệch KHÔNG gọi `onWordReviewed` — assert `not.toHaveBeenCalled()` ngay sau 1 lần lật lệch).
- `game-tab.test.tsx`: mở rộng — `onWordReviewed` được forward đúng xuống game đang chơi và gọi lên tới `GameTab`'s prop.

## Thứ tự triển khai

1. `types.ts` — thêm `ReviewGrade`, `WordReviewState`.
2. `srs-calculations.ts` (toàn bộ hàm thuần) + test — làm trước UI, đúng thứ tự đã áp dụng ở các feature trước.
3. `study-storage.ts` mở rộng `StudyState.wordReviews` + `safeWordReviews` + test.
4. `use-study.ts` thêm `wordReviews`, `gradeWord` + test.
5. `review-word-card.tsx` + test.
6. `review-due-card.tsx` + test.
7. Wire vào `study-view.tsx` (thay `VocabCard` cũ, cập nhật dòng thống kê) + cập nhật `study-view.test.tsx`.
8. `game-registry.ts` mở rộng kiểu `Component` (thêm `onWordReviewed`) — chạy lại `game-registry.test.ts`.
9. `quiz-game.tsx` thêm `onWordReviewed` + test.
10. `spelling-game.tsx` thêm `onWordReviewed` + test.
11. `match-game.tsx` thêm `onWordReviewed` (chỉ chiều đúng) + test.
12. `game-tab.tsx` forward `onWordReviewed` + test.
13. Wire `onWordReviewed` từ `study-view.tsx` xuống `GameTab` (quy đổi qua `gradeWord`).
14. Chạy toàn bộ `npm run test` + `npm run lint` + `npx tsc --noEmit`, kiểm tra tay qua `npm run dev`: xem tab "Hôm nay" hiện đúng 5 từ cần ôn (hoặc ít hơn nếu backlog < 5), ẩn/hiện nghĩa + chấm điểm 1 từ xong thẻ đó chuyển trạng thái "đã ôn"; chơi thử cả 3 mini-game, xác nhận sau khi chơi thẻ tương ứng trong "Hôm nay" đổi lịch ôn đúng hướng (chơi đúng → lịch ôn giãn ra; chơi sai → lịch ôn hôm sau).

## Ngoài phạm vi

- Không đổi cách chọn 1 điểm ngữ pháp ngẫu nhiên mỗi ngày (`pickDaily(grammar, 1, key, "grammar")` giữ nguyên).
- Không thêm thông báo/nhắc nhở đẩy (push notification) nhắc ôn tập.
- Không đổi hành vi/giao diện toggle "learned" ở tab "Từ vựng" — vẫn là tính năng độc lập, song song, chỉ được SRS ĐỌC 1 lần lúc seed ban đầu (`ensureReviewStates`/`gradeWord` tra `learned` để chọn loại seed), không ghi ngược lại.
- Không cần sửa `data-transfer.ts`/`use-data-management.ts` — `wordReviews` là 1 field của `StudyState`, tự động đi theo export/import/cloud-sync sẵn có của cả cục `StudyState`.

## Rủi ro / điểm cần chú ý khi triển khai

- **Backlog ngày đầu tiên là CHỦ Ý**: toàn bộ 333 từ (trừ phần đã "learned" được seed lùi 6 ngày) sẽ tới hạn ngay khi tính năng lên, rã dần theo `DAILY_REVIEW_CAP = 5`/ngày trong hàng chục ngày đầu — đây là hệ quả trực tiếp của lựa chọn "toàn bộ 333 từ ngay từ đầu", không phải bug cần sửa.
- **Ghép cặp là tín hiệu 1 chiều**: 1 từ chỉ được ôn qua Ghép cặp sẽ không bao giờ nhận "Quên" dù người chơi liên tục đoán sai vị trí thẻ — lịch ôn của từ đó chỉ giãn ra, không bao giờ bị đẩy lùi bởi riêng game này. Đây là đánh đổi đã chốt (tránh nhiễu do quên vị trí thẻ ≠ quên nghĩa), không phải thiếu sót.
- **Đổi interface của cả 3 game component** (thêm `onWordReviewed` bắt buộc) phá vỡ tương thích ngược với mọi test hiện dựng game trực tiếp — cần cập nhật toàn bộ, giống đúng việc test từng phải cập nhật khi `onFinish` đổi chữ ký `(score)` → `(score, total)` trước đây.
- **`applyGrade`/`ensureReviewStates`/`getDueWords` đều thuần**, nhận `today`/`now` làm tham số thay vì tự gọi `dayKey()`/`new Date()` — bắt buộc để test được bằng giá trị cố định, đúng quy ước `nextStreak` đã đặt ra.
- **`ReviewDueCard` đóng băng danh sách hiện ra bằng lazy `useState`**, không phải mảng cố định truyền từ prop trực tiếp render lại mỗi lần `dueWords` đổi — nếu implement nhầm thành đọc `dueWords` trực tiếp mỗi render, thẻ đang ôn dở sẽ biến mất ngay sau khi chấm điểm nó (vì nó không còn "tới hạn" nữa), gây giật layout giữa phiên.
