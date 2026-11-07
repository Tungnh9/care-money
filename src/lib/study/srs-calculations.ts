import { shiftDay } from "@/lib/date"
import type { ReviewGrade, VocabEntry, WordReviewState } from "@/lib/study/types"

const SRS_EASE_START = 2.5
const SRS_EASE_FLOOR = 1.3
// Số thẻ mỗi lượt ôn trên card "Từ cần ôn hôm nay" (và số từ Tổng quan hiện). Ôn hết 1 lượt thì card
// mời "Ôn tiếp" lượt kế — đây không còn là giới hạn/ngày dù tên vẫn giữ chữ DAILY.
const DAILY_REVIEW_CAP = 5
// Số từ mới đưa vào mỗi ngày. Không giới hạn thì ngày đầu cả kho (~330 từ) cùng "tới hạn" và con số "cần ôn" vô
// nghĩa; từ mới quá số này chờ tới hôm sau.
const DAILY_NEW_WORDS = 10

function initialReviewState(wordId: string, today: string): WordReviewState {
  return { wordId, easeFactor: SRS_EASE_START, intervalDays: 0, repetitions: 0, dueAt: today, lastReviewedAt: null }
}

function seedLearnedReviewState(wordId: string, today: string): WordReviewState {
  return {
    wordId,
    easeFactor: SRS_EASE_START,
    intervalDays: 6,
    repetitions: 2,
    dueAt: shiftDay(today, 6),
    lastReviewedAt: null,
  }
}

const GRADE_QUALITY: Record<ReviewGrade, number> = { again: 0, hard: 3, good: 4, easy: 5 }

function applyGrade(state: WordReviewState, grade: ReviewGrade, today: string, now: string): WordReviewState {
  // Lần chấm đầu của 1 từ mới ghi lại ngày — getTodayQueue đếm để giữ đúng DAILY_NEW_WORDS từ mới mỗi ngày.
  const base = isNewWord(state) && state.introducedOn === undefined ? { ...state, introducedOn: today } : state
  const quality = GRADE_QUALITY[grade]
  const easeFactor = Math.max(SRS_EASE_FLOOR, base.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

  if (quality < 3) {
    // Quên: về lại lịch ôn ngắn nhất, không tính là 1 lần nhớ liên tiếp — nhưng easeFactor vẫn hạ
    // theo đúng công thức SM-2 (phạt nặng hơn Khó/Nhớ/Dễ), phản ánh từ này "khó" hơn trước.
    return { ...base, easeFactor, repetitions: 0, intervalDays: 1, dueAt: shiftDay(today, 1), lastReviewedAt: now }
  }

  const repetitions = base.repetitions + 1
  const intervalDays = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(base.intervalDays * easeFactor)
  return { ...base, easeFactor, repetitions, intervalDays, dueAt: shiftDay(today, intervalDays), lastReviewedAt: now }
}

function ensureReviewStates(
  wordReviews: Record<string, WordReviewState>,
  vocab: VocabEntry[],
  learned: string[],
  today: string
): Record<string, WordReviewState> {
  const missing = vocab.filter((v) => !wordReviews[v.id])
  if (!missing.length) return wordReviews
  const additions = Object.fromEntries(
    missing.map((v) => [
      v.id,
      learned.includes(v.id) ? seedLearnedReviewState(v.id, today) : initialReviewState(v.id, today),
    ])
  )
  return { ...wordReviews, ...additions }
}

// "Từ mới" = entry cold-seed chưa từng được chấm (initialReviewState). Từ đã chấm ít nhất 1 lần (kể
// cả "Quên": repetitions về 0 nhưng lastReviewedAt khác null) và từ seed "đã học" (repetitions 2)
// đều là lượt ôn thật.
function isNewWord(state: WordReviewState): boolean {
  return state.repetitions === 0 && state.lastReviewedAt === null
}

function getDueWords(wordReviews: Record<string, WordReviewState>, vocab: VocabEntry[], today: string): VocabEntry[] {
  const due = vocab.filter((v) => wordReviews[v.id] && wordReviews[v.id].dueAt <= today)
  // Lượt ôn thật luôn đứng trước từ mới: ngày đầu cả kho từ mới cùng tới hạn đúng ngày seed, còn mọi
  // lần chấm đều hẹn từ ngày hôm sau trở đi — chỉ xếp theo dueAt thì từ vừa chấm "Quên" hôm qua nằm
  // sau ~330 từ mới và không bao giờ lọt vào 5 thẻ đầu. Trong từng nhóm vẫn quá hạn lâu nhất trước;
  // sort ổn định nên cùng hạn thì giữ thứ tự kho từ.
  return [...due].sort((a, b) => {
    const groupDiff = Number(isNewWord(wordReviews[a.id])) - Number(isNewWord(wordReviews[b.id]))
    return groupDiff || wordReviews[a.id].dueAt.localeCompare(wordReviews[b.id].dueAt)
  })
}

interface TodayQueue {
  // Lượt ôn thật tới hạn (đã chấm ít nhất 1 lần, hay seed "đã học"), quá hạn lâu nhất trước.
  reviews: VocabEntry[]
  // Từ mới hôm nay: tối đa DAILY_NEW_WORDS trừ số từ mới đã chấm hôm nay, theo thứ tự kho từ.
  fresh: VocabEntry[]
  // Tổng số từ mới còn chờ (không giới hạn theo ngày) — để báo "mai học tiếp" khi đã đủ phần hôm nay.
  newLeft: number
}

// Hàng chờ của thẻ "Từ cần ôn hôm nay": ôn lại trước, rồi từ mới — tách 2 nhóm để đếm riêng.
function getTodayQueue(wordReviews: Record<string, WordReviewState>, vocab: VocabEntry[], today: string): TodayQueue {
  const due = getDueWords(wordReviews, vocab, today)
  const reviews = due.filter((entry) => !isNewWord(wordReviews[entry.id]))
  const allNew = due.filter((entry) => isNewWord(wordReviews[entry.id]))
  const introducedToday = Object.values(wordReviews).filter((state) => state.introducedOn === today).length
  const fresh = allNew.slice(0, Math.max(0, DAILY_NEW_WORDS - introducedToday))
  return { reviews, fresh, newLeft: allNew.length }
}

export {
  SRS_EASE_START,
  SRS_EASE_FLOOR,
  DAILY_REVIEW_CAP,
  DAILY_NEW_WORDS,
  initialReviewState,
  seedLearnedReviewState,
  applyGrade,
  ensureReviewStates,
  getDueWords,
  getTodayQueue,
  isNewWord,
  type TodayQueue,
}
