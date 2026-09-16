"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { GameType } from "../../types"

const GAME_LABELS: Record<GameType, string> = {
  quiz: "Trắc nghiệm",
  match: "Ghép cặp",
  spelling: "Gõ từ",
}

interface GameResultCardProps {
  type: GameType
  score: number
  isNewHighScore: boolean
  onPlayAgain: () => void
  onBackToMenu: () => void
}

function GameResultCard({ type, score, isNewHighScore, onPlayAgain, onBackToMenu }: GameResultCardProps) {
  return (
    <Card label={GAME_LABELS[type]} tone="soft" className="min-w-0 flex-[1_1_300px]">
      <p className="mb-2 [font-family:var(--ob-font-num)] text-3xl font-bold">{score}/10</p>
      {isNewHighScore ? (
        <p className="mb-4 text-sm font-bold text-[var(--ob-color-income)]">🎉 Kỷ lục mới!</p>
      ) : null}
      <div className="flex flex-wrap gap-[10px]">
        <Button variant="primary" size="sm" type="button" onClick={onPlayAgain}>
          Chơi lại
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onBackToMenu}>
          Về màn chọn
        </Button>
      </div>
    </Card>
  )
}

export { GameResultCard }
