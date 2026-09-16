"use client"

import { useState } from "react"

import { gameDefinition } from "../../game-registry"
import type { GameHighScores, GameStreak, GameType, VocabEntry } from "../../types"
import { GameMenuCard } from "./game-menu-card"
import { GameResultCard } from "./game-result-card"

interface GameTabProps {
  vocab: VocabEntry[]
  highScores: GameHighScores
  streak: GameStreak
  onFinish: (type: GameType, score: number) => { isNewHighScore: boolean }
}

// 1 union thay vì 2 state nullable độc lập (activeGame/result trước đây) — mỗi lần chỉ ở đúng 1
// trong 3 màn hình, không thể vô tình vừa có activeGame vừa có result cùng lúc.
type Screen =
  | { kind: "menu" }
  | { kind: "playing"; game: GameType }
  | { kind: "result"; type: GameType; score: number; isNewHighScore: boolean }

function GameTab({ vocab, highScores, streak, onFinish }: GameTabProps) {
  const [screen, setScreen] = useState<Screen>({ kind: "menu" })

  function handleGameFinish(type: GameType, score: number) {
    const { isNewHighScore } = onFinish(type, score)
    setScreen({ kind: "result", type, score, isNewHighScore })
  }

  if (screen.kind === "result") {
    return (
      <GameResultCard
        type={screen.type}
        score={screen.score}
        isNewHighScore={screen.isNewHighScore}
        onPlayAgain={() => setScreen({ kind: "playing", game: screen.type })}
        onBackToMenu={() => setScreen({ kind: "menu" })}
      />
    )
  }

  if (screen.kind === "playing") {
    const { Component } = gameDefinition(screen.game)
    return <Component vocab={vocab} onFinish={(score) => handleGameFinish(screen.game, score)} />
  }

  return (
    <GameMenuCard highScores={highScores} streak={streak} onSelect={(game) => setScreen({ kind: "playing", game })} />
  )
}

export { GameTab }
