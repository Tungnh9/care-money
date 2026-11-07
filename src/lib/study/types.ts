import type { CefrLevel } from "@/lib/study/cefr"

interface VocabEntry {
  id: string
  word: string
  pos?: string
  phonetic?: string
  meaning: string
  topic?: string
  // File nội dung bắt buộc có (content-loader kiểm lúc build); để tuỳ chọn ở kiểu cho dữ liệu test viết tay.
  level?: CefrLevel
  addedAt: string
  example?: string
  image?: string
}

interface GrammarEntry {
  id: string
  title: string
  explanation: string
  examples?: string[]
  translations?: string[]
  structure?: string
  addedAt: string
}

interface Task {
  label: string
  done: boolean
}

type GameType = "quiz" | "match" | "spelling"

// chosenMeaning = null nghĩa là hết giờ mà chưa chọn đáp án nào.
interface GameMistake {
  // Kho từ vựng có từ trùng chữ khác nghĩa (vd. "pay") — định danh bằng id, không bằng word.
  wordId: string
  word: string
  correctMeaning: string
  chosenMeaning: string | null
}

interface GameHighScores {
  quiz: number
  match: number
  spelling: number
}

interface GameStreak {
  count: number
  lastPlayedDayKey: string | null
}

type ReviewGrade = "again" | "hard" | "good" | "easy"

interface WordReviewState {
  wordId: string
  easeFactor: number
  intervalDays: number
  repetitions: number
  dueAt: string // dayKey "YYYY-MM-DD"
  lastReviewedAt: string | null
  // dayKey lần đầu 1 từ MỚI được chấm (thẻ ôn hay mini-game) — để đếm số từ mới đã học hôm nay. Từ chấm trước khi
  // có field này, hay từ seed "đã học", không có.
  introducedOn?: string
}

export type {
  VocabEntry,
  GrammarEntry,
  Task,
  GameType,
  GameMistake,
  GameHighScores,
  GameStreak,
  ReviewGrade,
  WordReviewState,
}
