import { describe, it, expect } from "vitest"

import { GAME_REGISTRY, gameDefinition } from "../game-registry"
import { MatchGame } from "../components/games/match-game"
import { QuizGame } from "../components/games/quiz-game"
import { SpellingGame } from "../components/games/spelling-game"
import type { GameType } from "../types"

describe("GAME_REGISTRY", () => {
  it("has exactly one entry per GameType", () => {
    const types: GameType[] = GAME_REGISTRY.map((g) => g.type)
    expect(types.sort()).toEqual(["match", "quiz", "spelling"])
  })

  it("wires each type to its own component", () => {
    expect(gameDefinition("quiz").Component).toBe(QuizGame)
    expect(gameDefinition("match").Component).toBe(MatchGame)
    expect(gameDefinition("spelling").Component).toBe(SpellingGame)
  })

  it("gives every game a label, icon and positive maxScore", () => {
    GAME_REGISTRY.forEach((game) => {
      expect(game.label).not.toBe("")
      expect(game.icon).not.toBe("")
      expect(game.maxScore).toBeGreaterThan(0)
    })
  })
})
