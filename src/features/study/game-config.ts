import type { GameType } from "./types"

// Hằng số dùng chung giữa từng game component (số câu/từ mỗi lượt chơi) và game-registry.ts
// (điểm tối đa hiển thị dạng "x/maxScore") — tách riêng file này (không import component nào)
// để tránh vòng lặp import với game-registry.ts, vốn phải import ngược lại các component.
const QUIZ_QUESTION_COUNT = 10
const SPELLING_WORD_COUNT = 10
// matchScoreFromFlips (game-calculations.ts) luôn chuẩn hoá điểm về thang 0-10 bất kể chơi bao
// nhiêu cặp thật (PAIR_COUNT trong match-game.tsx) — không phải trùng hợp với 2 hằng số trên.
const MATCH_MAX_SCORE = 10

const GAME_LABELS: Record<GameType, string> = {
  quiz: "Trắc nghiệm",
  match: "Ghép cặp",
  spelling: "Gõ từ",
}

const GAME_ICONS: Record<GameType, string> = {
  quiz: "❓",
  match: "🃏",
  spelling: "⌨️",
}

const GAME_MAX_SCORES: Record<GameType, number> = {
  quiz: QUIZ_QUESTION_COUNT,
  match: MATCH_MAX_SCORE,
  spelling: SPELLING_WORD_COUNT,
}

export {
  QUIZ_QUESTION_COUNT,
  SPELLING_WORD_COUNT,
  MATCH_MAX_SCORE,
  GAME_LABELS,
  GAME_ICONS,
  GAME_MAX_SCORES,
}
