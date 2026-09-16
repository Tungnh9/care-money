import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GameTab } from "../../../components/games/game-tab"
import type { VocabEntry } from "../../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 20 }, (_, i) => vocab(`${i}`))
const HIGH_SCORES = { quiz: 0, match: 0, spelling: 0 }
const STREAK = { count: 0, lastPlayedDayKey: null }

function playSpellingBadlyToTheEnd() {
  for (let i = 0; i < 10; i++) {
    fireEvent.change(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false }), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button"))
  }
}

describe("GameTab", () => {
  it("starts on the menu and enters a game when a card is selected", () => {
    render(
      <GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={vi.fn(() => ({ isNewHighScore: false }))} />
    )

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Gõ từ"))

    expect(screen.getByText("Từ 1/10", { exact: false })).toBeInTheDocument()
  })

  it("calls onFinish exactly once with (type, score) when a game ends, then shows the result screen", () => {
    const onFinish = vi.fn(() => ({ isNewHighScore: true }))
    render(<GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={onFinish} />)

    fireEvent.click(screen.getByText("Gõ từ"))
    playSpellingBadlyToTheEnd()

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith("spelling", 0)
    expect(screen.getByText("🎉 Kỷ lục mới!")).toBeInTheDocument()
  })

  it("returns to the menu from the result screen", () => {
    const onFinish = vi.fn(() => ({ isNewHighScore: false }))
    render(<GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={onFinish} />)

    fireEvent.click(screen.getByText("Gõ từ"))
    playSpellingBadlyToTheEnd()
    fireEvent.click(screen.getByRole("button", { name: "Về màn chọn" }))

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()
  })
})
