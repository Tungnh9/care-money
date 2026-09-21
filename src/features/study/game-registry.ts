import type { ComponentType } from "react"

import { GAME_ICONS, GAME_LABELS, GAME_MAX_SCORES } from "./game-config"
import { MatchGame } from "./components/games/match-game"
import { QuizGame } from "./components/games/quiz-game"
import { SpellingGame } from "./components/games/spelling-game"
import type { GameType, VocabEntry } from "./types"

interface GameDefinition {
  type: GameType
  icon: string
  label: string
  maxScore: number
  Component: ComponentType<{
    vocab: VocabEntry[]
    onFinish: (score: number, total?: number) => void
    onWordReviewed?: (wordId: string, correct: boolean) => void
  }>
}

// Nguồn duy nhất cho danh sách mini-game (icon/nhãn/điểm tối đa/component render) — thêm 1 game
// mới chỉ cần thêm đúng 1 phần tử ở đây (cộng entry trong game-config.ts) thay vì sửa rải rác
// nhiều nơi như GameMenuCard/GameResultCard/GameTab từng làm riêng lẻ.
const GAME_TYPES: GameType[] = ["quiz", "match", "spelling"]
const GAME_COMPONENTS: Record<GameType, GameDefinition["Component"]> = {
  quiz: QuizGame,
  match: MatchGame,
  spelling: SpellingGame,
}

const GAME_REGISTRY: GameDefinition[] = GAME_TYPES.map((type) => ({
  type,
  icon: GAME_ICONS[type],
  label: GAME_LABELS[type],
  maxScore: GAME_MAX_SCORES[type],
  Component: GAME_COMPONENTS[type],
}))

function gameDefinition(type: GameType): GameDefinition {
  const def = GAME_REGISTRY.find((g) => g.type === type)
  if (!def) throw new Error(`Không tìm thấy định nghĩa cho game "${type}"`)
  return def
}

export { GAME_REGISTRY, gameDefinition, type GameDefinition }
