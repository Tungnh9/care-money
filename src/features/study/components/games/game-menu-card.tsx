"use client"

import { Card } from "@/components/ui/card"
import { Streak } from "@/components/ob/streak"
import { GAME_REGISTRY } from "../../game-registry"
import type { GameHighScores, GameStreak, GameType } from "../../types"

interface GameMenuCardProps {
  highScores: GameHighScores
  streak: GameStreak
  onSelect: (type: GameType) => void
}

function GameMenuCard({ highScores, streak, onSelect }: GameMenuCardProps) {
  return (
    <div className="flex flex-col gap-5">
      <Card label="Chuỗi ngày chơi" className="min-w-0">
        <Streak days={7} done={Math.min(streak.count, 7)} icon="🔥" />
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {GAME_REGISTRY.map((game) => (
          <button
            key={game.type}
            type="button"
            onClick={() => onSelect(game.type)}
            className="flex flex-col items-center gap-2 rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-5 text-center transition-colors duration-[var(--ob-dur-fast)] hover:bg-[var(--ob-color-surface-sunken)]"
          >
            <span className="text-3xl">{game.icon}</span>
            <span className="font-bold">{game.label}</span>
            <span className="text-[12.5px] text-[var(--ob-color-text-subtle)]">
              Kỷ lục: {highScores[game.type]}/{game.maxScore}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export { GameMenuCard }
