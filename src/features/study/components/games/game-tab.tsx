"use client"

import { useState } from "react"

import type { GameHighScores, GameStreak, GameType, VocabEntry } from "../../types"
import { GameMenuCard } from "./game-menu-card"
import { GameResultCard } from "./game-result-card"
import { MatchGame } from "./match-game"
import { QuizGame } from "./quiz-game"
import { SpellingGame } from "./spelling-game"

interface GameTabProps {
  vocab: VocabEntry[]
  highScores: GameHighScores
  streak: GameStreak
  onFinish: (type: GameType, score: number) => { isNewHighScore: boolean }
}

interface GameResult {
  type: GameType
  score: number
  isNewHighScore: boolean
}

function GameTab({ vocab, highScores, streak, onFinish }: GameTabProps) {
  const [activeGame, setActiveGame] = useState<GameType | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)

  function handleGameFinish(type: GameType, score: number) {
    const { isNewHighScore } = onFinish(type, score)
    setActiveGame(null)
    setResult({ type, score, isNewHighScore })
  }

  if (result) {
    return (
      <GameResultCard
        type={result.type}
        score={result.score}
        isNewHighScore={result.isNewHighScore}
        onPlayAgain={() => {
          const type = result.type
          setResult(null)
          setActiveGame(type)
        }}
        onBackToMenu={() => setResult(null)}
      />
    )
  }

  if (activeGame === "quiz") {
    return <QuizGame vocab={vocab} onFinish={(score) => handleGameFinish("quiz", score)} />
  }
  if (activeGame === "match") {
    return <MatchGame vocab={vocab} onFinish={(score) => handleGameFinish("match", score)} />
  }
  if (activeGame === "spelling") {
    return <SpellingGame vocab={vocab} onFinish={(score) => handleGameFinish("spelling", score)} />
  }

  return <GameMenuCard highScores={highScores} streak={streak} onSelect={setActiveGame} />
}

export { GameTab }
