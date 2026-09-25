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
  it("lists each mistake with the word, the wrongly chosen meaning and the correct meaning", () => {
    render(
      <GameResultCard
        type="quiz"
        score={8}
        total={10}
        isNewHighScore={false}
        mistakes={[
          { wordId: "a", word: "apple", correctMeaning: "quả táo", chosenMeaning: "quả cam" },
          { wordId: "r", word: "river", correctMeaning: "dòng sông", chosenMeaning: null },
        ]}
        onPlayAgain={vi.fn()}
        onBackToMenu={vi.fn()}
      />
    )

    expect(screen.getByText("Các câu làm sai")).toBeInTheDocument()
    expect(screen.getByText("apple")).toBeInTheDocument()
    expect(screen.getByText("quả cam")).toHaveClass("line-through")
    expect(screen.getByText("quả táo")).toBeInTheDocument()
    expect(screen.getByText("river")).toBeInTheDocument()
    expect(screen.getByText("Hết giờ")).toBeInTheDocument()
    expect(screen.getByText("dòng sông")).toBeInTheDocument()
  })

  it("shows a perfect-round message instead of a list when there are no mistakes", () => {
    render(
      <GameResultCard
        type="quiz"
        score={10}
        total={10}
        isNewHighScore={false}
        mistakes={[]}
        onPlayAgain={vi.fn()}
        onBackToMenu={vi.fn()}
      />
    )

    expect(screen.getByText("Chính xác tuyệt đối 🎉")).toBeInTheDocument()
    expect(screen.queryByText("Các câu làm sai")).not.toBeInTheDocument()
  })

  it("shows no mistakes section at all for games that don't report mistakes", () => {
    render(
      <GameResultCard type="match" score={6} total={10} isNewHighScore={false} onPlayAgain={vi.fn()} onBackToMenu={vi.fn()} />
    )

    expect(screen.queryByText("Các câu làm sai")).not.toBeInTheDocument()
    expect(screen.queryByText("Chính xác tuyệt đối 🎉")).not.toBeInTheDocument()
  })
  it("renders two mistakes that share the same word (different vocab entries) without a React key clash", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <GameResultCard
        type="quiz"
        score={8}
        total={10}
        isNewHighScore={false}
        mistakes={[
          { wordId: "pay-1", word: "pay", correctMeaning: "trả tiền", chosenMeaning: "quả cam" },
          { wordId: "pay-2", word: "pay", correctMeaning: "tiền lương", chosenMeaning: null },
        ]}
        onPlayAgain={vi.fn()}
        onBackToMenu={vi.fn()}
      />
    )

    expect(screen.getAllByText("pay")).toHaveLength(2)
    expect(consoleError.mock.calls.some((c) => String(c[0]).includes("same key"))).toBe(false)
    consoleError.mockRestore()
  })
})
