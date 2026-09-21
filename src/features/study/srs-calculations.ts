import { shiftDay } from "@/lib/date"
import type { ReviewGrade, VocabEntry, WordReviewState } from "./types"

const SRS_EASE_START = 2.5
const SRS_EASE_FLOOR = 1.3
const DAILY_REVIEW_CAP = 5

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

function getDueWords(wordReviews: Record<string, WordReviewState>, vocab: VocabEntry[], today: string): VocabEntry[] {
  const due = vocab.filter((v) => wordReviews[v.id] && wordReviews[v.id].dueAt <= today)
  return [...due].sort((a, b) => wordReviews[a.id].dueAt.localeCompare(wordReviews[b.id].dueAt))
}

export {
  SRS_EASE_START,
  SRS_EASE_FLOOR,
  DAILY_REVIEW_CAP,
  initialReviewState,
  seedLearnedReviewState,
  applyGrade,
  ensureReviewStates,
  getDueWords,
}
