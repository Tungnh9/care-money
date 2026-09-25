"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { gameDefinition } from "../../game-registry"
import type { GameMistake, GameType } from "../../types"

interface GameResultCardProps {
  type: GameType
  score: number
  total: number
  isNewHighScore: boolean
  // undefined = game không báo lỗi sai (Ghép cặp, Gõ từ) → không hiện mục này.
  mistakes?: GameMistake[]
  onPlayAgain: () => void
  onBackToMenu: () => void
}

function GameResultCard({ type, score, total, isNewHighScore, mistakes, onPlayAgain, onBackToMenu }: GameResultCardProps) {
  const { label } = gameDefinition(type)

  return (
    <Card label={label} tone="soft" className="min-w-0 flex-[1_1_300px]">
      <p className="mb-2 [font-family:var(--ob-font-num)] text-3xl font-bold">
        {score}/{total}
      </p>
      {isNewHighScore ? (
        <p className="mb-4 text-sm font-bold text-[var(--ob-color-income)]">🎉 Kỷ lục mới!</p>
      ) : null}
      {mistakes && mistakes.length === 0 ? (
        <p className="mb-4 text-sm font-semibold text-[var(--ob-color-income)]">Chính xác tuyệt đối 🎉</p>
      ) : null}
      {mistakes && mistakes.length > 0 ? (
        <div className="mb-4">
          <p className="mb-2 text-sm font-bold">Các câu làm sai</p>
          <ul className="flex flex-col gap-2">
            {mistakes.map((m) => (
              <li
                key={m.wordId}
                className="rounded-[var(--ob-radius-md)] bg-[#FEE6E2] px-[14px] py-[10px] text-[13.5px] leading-[1.5]"
              >
                <p className="font-bold">{m.word}</p>
                <p>
                  <span className="text-[var(--ob-color-text-subtle)]">Bạn chọn: </span>
                  {m.chosenMeaning === null ? (
                    <span className="text-[var(--ob-color-expense)]">Hết giờ</span>
                  ) : (
                    <span className="text-[var(--ob-color-expense)] line-through">{m.chosenMeaning}</span>
                  )}
                </p>
                <p>
                  <span className="text-[var(--ob-color-text-subtle)]">Đáp án đúng: </span>
                  <span className="font-semibold text-[var(--ob-color-income)]">{m.correctMeaning}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
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
