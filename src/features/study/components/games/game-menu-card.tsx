"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Streak } from "@/components/ob/streak"
import { dayKey } from "@/lib/date"
import { activeStreakCount } from "@/lib/study/game-calculations"
import { GAME_REGISTRY } from "../../game-registry"
import type { GameHighScores, GameStreak, GameType } from "@/lib/study/types"

interface GameMenuCardProps {
  highScores: GameHighScores
  streak: GameStreak
  onSelect: (type: GameType) => void
}

function GameMenuCard({ highScores, streak, onSelect }: GameMenuCardProps) {
  return (
    <div className="flex flex-col gap-5">
      <Card label="Chuỗi ngày chơi" className="min-w-0">
        {/* Chuỗi đã đứt (bỏ quá 1 ngày) hiện 0 ngay, không đợi tới ván kế tiếp mới tụt về 1. */}
        <Streak days={7} done={Math.min(activeStreakCount(streak, dayKey()), 7)} icon="🔥" />
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {GAME_REGISTRY.map((game) => (
          <Button
            key={game.type}
            type="button"
            variant="outline"
            onClick={() => onSelect(game.type)}
            className="flex-col gap-2 rounded-[var(--ob-radius-lg)] p-5 text-center"
          >
            <span className="text-3xl">{game.icon}</span>
            <span className="font-bold">{game.label}</span>
            <span className="text-[12.5px] text-[var(--ob-color-text-subtle)]">
              Kỷ lục: {highScores[game.type]}/{game.maxScore}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export { GameMenuCard }
