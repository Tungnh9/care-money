# Mini-game trong trang Học tập

## Context

Trang Học tập hiện tại (`src/features/study/`) chỉ có 1 cách tương tác với 333 từ vựng (`content/vocabulary.jsonl`) và 38 mẫu ngữ pháp (`content/grammar.jsonl`): toggle "đã học"/"chưa học" tĩnh, lưu vào `learned: string[]` trong `study-storage.ts`. Người dùng thấy cách học này nhàm chán, muốn thêm mini-game để học vui hơn.

Đã xác nhận qua brainstorming với người dùng:
- **3 kiểu game**: Trắc nghiệm nhanh, Ghép cặp (lật thẻ), Gõ lại từ — có màn chọn game.
- **Vị trí**: thêm 1 tab mới "Trò chơi" cạnh 3 tab hiện có (Hôm nay / Từ vựng / Ngữ pháp), không đụng gì luồng học tĩnh cũ.
- **Nguồn từ**: random từ toàn bộ 333 từ mỗi ván, không liên quan tới "5 từ hôm nay" hay danh sách đã học.
- **Lưu tiến bộ**: điểm cao nhất lưu riêng từng game + 1 chuỗi ngày chơi chung cho cả 3 game, dùng component `Streak` (`src/components/ob/streak.tsx`) đã được thiết kế sẵn từ bản Figma gốc nhưng chưa gắn vào tính năng thật nào (hiện chỉ demo ở `/sandbox`).

**Nguyên tắc thiết kế xuyên suốt**: 3 game dùng chung 1 khung điều phối (màn chọn game → 1 trong 3 game → màn kết quả dùng chung) để tránh trùng lặp code UI/kết quả — chỉ phần logic chấm điểm và tương tác chính khác nhau giữa 3 game.

## Data model

### `src/features/study/types.ts` — thêm mới

```ts
type GameType = "quiz" | "match" | "spelling"

interface GameHighScores {
  quiz: number
  match: number
  spelling: number
}

interface GameStreak {
  count: number
  lastPlayedDayKey: string | null
}
```

### `src/features/study/study-storage.ts` — mở rộng `StudyState`

```ts
interface StudyState {
  tasks: Task[]
  learned: string[]
  gameHighScores: GameHighScores
  gameStreak: GameStreak
}
```

`DEFAULT_STUDY_STATE` thêm `gameHighScores: {quiz: 0, match: 0, spelling: 0}`, `gameStreak: {count: 0, lastPlayedDayKey: null}`. Zod schema cho 2 field mới theo đúng pattern `safeField` đã có (mỗi field rơi về default riêng nếu hỏng, không kéo sập cả state) — dữ liệu cũ đã lưu trước tính năng này thiếu 2 field mới sẽ tự nhận default qua đúng cơ chế `parseStudyState` hiện tại (`parsed.gameHighScores`/`parsed.gameStreak` là `undefined` → `safeField` trả về fallback).

## `src/lib/date.ts` — thêm `shiftDay`

Cần 1 hàm dịch ngày (không phải tháng) để tính "hôm qua" khi kiểm tra chuỗi ngày chơi liên tục:

```ts
function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number)
  return dayKey(new Date(y, m - 1, d + delta))
}
```

Mirror đúng style `shiftMonth` đã có (dùng `Date` gốc JS để tự chuẩn hoá ngày âm/vượt tháng, ví dụ lùi 1 ngày từ mùng 1 sẽ tự nhảy về cuối tháng trước đúng).

## Logic thuần — `src/features/study/game-calculations.ts` (file mới)

Tất cả hàm dưới đây thuần, không phụ thuộc DOM/localStorage — test trước khi đụng tới UI, đúng thứ tự triển khai đã dùng ở các feature trước (budget-calculations.ts, v.v.).

```ts
function pickRandomSet<T>(pool: T[], count: number): T[]
```
Lấy ngẫu nhiên `count` phần tử không trùng từ `pool` (dùng `Math.random()` thật, KHÔNG dùng `pickDaily`'s seeded-random — mini-game cần mỗi ván ra bộ từ khác nhau để chơi lại không bị lặp, khác hẳn mục đích "cố định theo ngày" của `pickDaily`). Nếu `pool.length <= count`, trả về toàn bộ `pool` đã xáo trộn.

```ts
function pickQuizOptions(pool: VocabEntry[], correct: VocabEntry, optionCount = 4): VocabEntry[]
```
Trả về mảng `optionCount` phần tử gồm đúng 1 `correct` + `optionCount - 1` từ sai lấy ngẫu nhiên từ `pool` (loại trừ chính `correct`), đã xáo trộn vị trí.

```ts
function matchScoreFromFlips(pairCount: number, flipsUsed: number): number
```
Số lượt lật tối thiểu về lý thuyết để ăn hết `pairCount` cặp là `pairCount * 2` (mỗi lượt ăn cặp tốn đúng 2 lần lật, chơi hoàn hảo không có lượt lật thừa). Điểm quy về thang 0-10:
```
score = clamp(round(10 * (pairCount * 2) / flipsUsed), 0, 10)
```
Chơi hoàn hảo (`flipsUsed = pairCount*2`) → 10 điểm; lật gấp đôi mức tối thiểu → ~5 điểm; lật càng nhiều điểm càng thấp, không bao giờ âm.

```ts
function nextStreak(current: GameStreak, today: string): GameStreak
```
- `current.lastPlayedDayKey === today` → trả nguyên `current` (đã chơi hôm nay rồi, chơi thêm ván nữa trong ngày không cộng thêm chuỗi).
- `current.lastPlayedDayKey === shiftDay(today, -1)` (chơi liên tục từ hôm qua) → `{count: current.count + 1, lastPlayedDayKey: today}`.
- Còn lại (lần đầu chơi, hoặc bỏ lỡ ≥1 ngày) → `{count: 1, lastPlayedDayKey: today}`.

## Hook — `src/features/study/hooks/use-study.ts` — thêm `recordGameResult`

```ts
function recordGameResult(type: GameType, score: number): void
```
- `gameHighScores[type] = Math.max(gameHighScores[type], score)`.
- `gameStreak = nextStreak(gameStreak, dayKey())`.
- Persist 1 lần (gộp cả 2 thay đổi vào 1 lần `setStoredStudy`, giống cách `toggleLearned`/`toggleTask` đang persist).
- Trả về `{ isNewHighScore: boolean }` (so sánh `score` với high score CŨ trước khi ghi đè) để component kết quả biết có hiện banner "Kỷ lục mới!" hay không.

## Component — `src/features/study/components/games/` (thư mục con mới trong `components/`)

| File | Vai trò |
|---|---|
| `game-tab.tsx` | Orchestrator: state `mode: "menu" \| GameType \| "result"` + `lastResult: {type, score, isNewHighScore} \| null`. Render `GameMenuCard` / 1 trong 3 game / `GameResultCard` theo `mode`. |
| `game-menu-card.tsx` | `Streak` (7 ô, `done` = số ngày gần nhất có chơi — tính từ `gameStreak.count`, capped ở 7) + 3 thẻ game (icon, tên, "Kỷ lục: X/10"), bấm vào gọi `onSelect(type)`. |
| `quiz-game.tsx` | 10 câu, mỗi câu 1 từ + 4 đáp án (`pickQuizOptions`), đếm ngược 10s/câu (hết giờ = sai, tự chuyển câu tiếp). Xong 10 câu gọi `onFinish(score)` với `score = số câu đúng`. |
| `match-game.tsx` | 6 cặp (12 thẻ) từ `pickRandomSet(vocab, 6)`, lật 2 thẻ/lượt, đúng cặp giữ mở, sai thì lật úp lại sau ~800ms. Ăn hết 6 cặp gọi `onFinish(matchScoreFromFlips(6, flipsUsed))`. |
| `spelling-game.tsx` | 10 từ từ `pickRandomSet(vocab, 10)`, hiện nghĩa + phiên âm, input gõ lại từ tiếng Anh, so sánh không phân biệt hoa/thường (`.trim().toLowerCase()`). Xong 10 từ gọi `onFinish(score)` với `score = số từ gõ đúng`. |
| `game-result-card.tsx` | Nhận `{type, score, isNewHighScore}` — hiện điểm, banner "🎉 Kỷ lục mới!" nếu `isNewHighScore`, 2 nút "Chơi lại" (gọi lại `onSelect(type)` ở tab cha) / "Về màn chọn" (`mode = "menu"`). |

**Điểm chung giữa 3 game**: input duy nhất là `vocab: VocabEntry[]` (toàn bộ 333 từ, lấy mẫu random bên trong từng game qua `pickRandomSet`/`pickQuizOptions`) và `onFinish: (score: number) => void`. `GameTab` là nơi DUY NHẤT gọi `recordGameResult` (trong callback `onFinish`), không game con nào tự ghi storage — giữ đúng nguyên tắc "1 nơi sở hữu state" đã rút ra từ bug đồng bộ lockout ở tính năng xoá dữ liệu vừa xong.

## Wiring vào `study-view.tsx`

- `TABS` thêm `"Trò chơi"` vào cuối mảng.
- `useStudy()` đã có `gameHighScores`, `gameStreak`, `recordGameResult` — truyền xuống `<GameTab vocab={vocab} highScores={gameHighScores} streak={gameStreak} onFinish={recordGameResult} />` khi `tab === "Trò chơi"`.

## Test (TDD — viết trước theo đúng convention CLAUDE.md)

- `date.test.ts`: thêm test `shiftDay` (lùi 1 ngày bình thường, lùi qua đầu tháng, lùi qua đầu năm).
- `game-calculations.test.ts` (mới): `pickRandomSet` (đúng số lượng, không trùng phần tử, pool nhỏ hơn count trả hết pool), `pickQuizOptions` (đúng 1 đáp án đúng, đủ số lượng, không trùng đáp án sai), `matchScoreFromFlips` (chơi hoàn hảo = 10, gấp đôi ≈ 5, lật rất nhiều vẫn ≥ 0, không âm), `nextStreak` (chơi lại trong ngày không đổi, liên tục hôm qua +1, bỏ lỡ ngày reset về 1, lần đầu chơi từ `lastPlayedDayKey: null`).
- `study-storage.test.ts`: mở rộng — backfill `gameHighScores`/`gameStreak` cho dữ liệu cũ thiếu 2 field này, giữ nguyên state hợp lệ đã có.
- `use-study.test.ts`: mở rộng — `recordGameResult` cập nhật đúng high score (chỉ khi điểm mới cao hơn), gọi đúng `nextStreak`, trả về `isNewHighScore` đúng, persist đúng 1 lần.
- Component test mỗi game: chỉ smoke-test tương tác chính (chọn đáp án trắc nghiệm, lật thẻ ghép cặp, gõ từ) bằng fake timer khi cần (đếm giờ trắc nghiệm, delay lật úp thẻ sai) — logic chấm điểm thật đã test kỹ ở `game-calculations.test.ts`, không lặp lại ở đây.
- `game-tab.test.tsx`: luồng menu → chọn game → chơi xong → màn kết quả → chơi lại/về màn chọn, xác nhận `onFinish` (tức `recordGameResult`) chỉ được gọi đúng 1 lần khi kết thúc ván.
- `study-view.test.tsx`: thêm test tab "Trò chơi" render được `GameTab`.

## Thứ tự triển khai

1. `lib/date.ts` (`shiftDay`) + test.
2. `types.ts` (`GameType`/`GameHighScores`/`GameStreak`).
3. `study-storage.ts` mở rộng `StudyState` + schema + test.
4. `game-calculations.ts` (toàn bộ hàm thuần) + test — làm trước UI vì đây là nơi đáng test nhất, đúng thứ tự đã áp dụng ở feature Chi tiêu trước đó.
5. `use-study.ts` thêm `recordGameResult` + test.
6. `game-result-card.tsx` + `game-menu-card.tsx` (2 phần dùng chung, đơn giản nhất) + test.
7. `quiz-game.tsx` (game đầu tiên, làm mẫu pattern) + test.
8. `match-game.tsx` + test (áp lại đúng pattern từ bước 7).
9. `spelling-game.tsx` + test (áp lại đúng pattern).
10. `game-tab.tsx` (orchestrator ghép toàn bộ) + test.
11. Wire vào `study-view.tsx` + cập nhật `study-view.test.tsx`.
12. Chạy toàn bộ `npm run test` + `npm run lint` + `npx tsc --noEmit`, kiểm tra tay qua `npm run dev`: chơi thử cả 3 game, xác nhận điểm cao nhất lưu đúng riêng từng game, chuỗi ngày chơi tăng đúng khi chơi liên tục ngày kế tiếp (giả lập bằng cách sửa tay `lastPlayedDayKey` trong localStorage lùi 1 ngày rồi chơi lại).

## Rủi ro / điểm cần chú ý khi triển khai

- **Timer trắc nghiệm** dùng `setInterval` ephemeral (không persist qua reload, khác `Pomodoro` vốn cố tình sống sót qua việc đóng tab) — mất tiến trình câu đang làm nếu refresh giữa chừng là chấp nhận được, không cần xử lý gì thêm.
- **`Math.random()`** dùng trực tiếp trong `pickRandomSet`/`pickQuizOptions` — đây là code chạy trong component React bình thường (không phải workflow script), nên không có hạn chế gì về `Math.random()`.
- **Không tái sử dụng `pickDaily`** cho việc chọn từ trong game — cố ý, vì `pickDaily` cho ra kết quả cố định theo ngày (đúng cho "5 từ hôm nay"), còn mini-game cần ngẫu nhiên thật mỗi ván để chơi lại không nhàm.
