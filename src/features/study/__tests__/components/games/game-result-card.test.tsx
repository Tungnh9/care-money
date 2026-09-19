import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GameResultCard } from "../../../components/games/game-result-card"

describe("GameResultCard", () => {
  it("shows the score against the round's total, and the game's label", () => {
    render(
      <GameResultCard
        type="quiz"
        score={7}
        total={10}
        isNewHighScore={false}
        onPlayAgain={vi.fn()}
        onBackToMenu={vi.fn()}
      />
    )

    expect(screen.getByText("7/10")).toBeInTheDocument()
    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()
  })

  it("shows the round's actual total, not the game's configured max, when they differ", () => {
    render(
      <GameResultCard
        type="spelling"
        score={4}
        total={4}
        isNewHighScore={false}
        onPlayAgain={vi.fn()}
        onBackToMenu={vi.fn()}
      />
    )

    expect(screen.getByText("4/4")).toBeInTheDocument()
    expect(screen.queryByText("4/10")).not.toBeInTheDocument()
  })

  it("shows the new-high-score banner only when isNewHighScore is true", () => {
    const { rerender } = render(
      <GameResultCard
        type="match"
        score={9}
        total={10}
        isNewHighScore={false}
        onPlayAgain={vi.fn()}
        onBackToMenu={vi.fn()}
      />
    )
    expect(screen.queryByText("🎉 Kỷ lục mới!")).not.toBeInTheDocument()

    rerender(
      <GameResultCard
        type="match"
        score={9}
        total={10}
        isNewHighScore
        onPlayAgain={vi.fn()}
        onBackToMenu={vi.fn()}
      />
    )
    expect(screen.getByText("🎉 Kỷ lục mới!")).toBeInTheDocument()
  })

  it("calls onPlayAgain and onBackToMenu from their buttons", () => {
    const onPlayAgain = vi.fn()
    const onBackToMenu = vi.fn()
    render(
      <GameResultCard
        type="spelling"
        score={5}
        total={10}
        isNewHighScore={false}
        onPlayAgain={onPlayAgain}
        onBackToMenu={onBackToMenu}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Chơi lại" }))
    fireEvent.click(screen.getByRole("button", { name: "Về màn chọn" }))

    expect(onPlayAgain).toHaveBeenCalled()
    expect(onBackToMenu).toHaveBeenCalled()
  })
})
