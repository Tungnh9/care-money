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

// Ghép cặp không cần fake timer để chơi hết ván (khác Gõ từ, chạy theo setInterval/thời gian
// rơi) — chỉ cần luôn bấm đúng cặp liền kề theo data-vocab-id đã sắp xếp, không bao giờ lệch cặp
// nên không đụng tới setTimeout lật úp lại của MatchGame.
function playMatchGameToCompletion() {
  const cards = screen.getAllByRole("button").filter((b) => b.hasAttribute("data-vocab-id"))
  const sorted = [...cards].sort((a, b) =>
    (a.getAttribute("data-vocab-id") ?? "").localeCompare(b.getAttribute("data-vocab-id") ?? "")
  )
  for (let i = 0; i < sorted.length; i += 2) {
    fireEvent.click(sorted[i])
    fireEvent.click(sorted[i + 1])
  }
}

describe("GameTab", () => {
  it("starts on the menu and enters a game when a card is selected", () => {
    render(
      <GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={vi.fn(() => ({ isNewHighScore: false }))} />
    )

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Ghép cặp"))

    expect(screen.getAllByRole("button").filter((b) => b.hasAttribute("data-vocab-id"))).toHaveLength(12)
  })

  it("calls onFinish exactly once with (type, score) when a game ends, then shows the result screen", () => {
    const onFinish = vi.fn(() => ({ isNewHighScore: true }))
    render(<GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={onFinish} />)

    fireEvent.click(screen.getByText("Ghép cặp"))
    playMatchGameToCompletion()

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith("match", expect.any(Number))
    expect(screen.getByText("🎉 Kỷ lục mới!")).toBeInTheDocument()
  })

  it("returns to the menu from the result screen", () => {
    const onFinish = vi.fn(() => ({ isNewHighScore: false }))
    render(<GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={onFinish} />)

    fireEvent.click(screen.getByText("Ghép cặp"))
    playMatchGameToCompletion()
    fireEvent.click(screen.getByRole("button", { name: "Về màn chọn" }))

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()
  })

  it("shows the round's actual size, not the game's configured max, on the result screen when the vocab pool is small", () => {
    const smallVocab: VocabEntry[] = Array.from({ length: 3 }, (_, i) => vocab(`${i}`))
    const onFinish = vi.fn(() => ({ isNewHighScore: false }))
    render(<GameTab vocab={smallVocab} highScores={HIGH_SCORES} streak={STREAK} onFinish={onFinish} />)

    fireEvent.click(screen.getByText("Trắc nghiệm"))
    for (let i = 0; i < 3; i++) {
      const options = screen.getAllByRole("button").filter((b) => b.textContent !== "Về màn chọn")
      fireEvent.click(options[0])
    }

    // Điểm số (tử số) phụ thuộc thứ tự ngẫu nhiên của đáp án nên không cố định — chỉ cần khẳng
    // định mẫu số là 3 (số câu thật của ván), không phải maxScore mặc định (10).
    expect(
      screen.getByText((_, element) => element?.tagName === "P" && /\/3$/.test(element.textContent ?? ""))
    ).toBeInTheDocument()
  })

  it("lets the player quit back to the menu while a game is in progress, without calling onFinish", () => {
    const onFinish = vi.fn(() => ({ isNewHighScore: false }))
    render(<GameTab vocab={VOCAB} highScores={HIGH_SCORES} streak={STREAK} onFinish={onFinish} />)

    fireEvent.click(screen.getByText("Ghép cặp"))
    expect(screen.getAllByRole("button").filter((b) => b.hasAttribute("data-vocab-id"))).toHaveLength(12)

    fireEvent.click(screen.getByRole("button", { name: "Về màn chọn" }))

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()
    expect(onFinish).not.toHaveBeenCalled()
  })

  it("forwards onWordReviewed down to the active game", () => {
    const onWordReviewed = vi.fn()
    render(
      <GameTab
        vocab={VOCAB}
        highScores={HIGH_SCORES}
        streak={STREAK}
        onFinish={vi.fn(() => ({ isNewHighScore: false }))}
        onWordReviewed={onWordReviewed}
      />
    )

    fireEvent.click(screen.getByText("Ghép cặp"))
    const cards = screen.getAllByRole("button").filter((b) => b.hasAttribute("data-vocab-id"))
    const sorted = [...cards].sort((a, b) =>
      (a.getAttribute("data-vocab-id") ?? "").localeCompare(b.getAttribute("data-vocab-id") ?? "")
    )
    fireEvent.click(sorted[0])
    fireEvent.click(sorted[1])

    expect(onWordReviewed).toHaveBeenCalledWith(sorted[0].getAttribute("data-vocab-id"), true)
  })

  it("does not crash when onWordReviewed is omitted", () => {
    render(
      <GameTab
        vocab={VOCAB}
        highScores={HIGH_SCORES}
        streak={STREAK}
        onFinish={vi.fn(() => ({ isNewHighScore: false }))}
      />
    )

    expect(() => fireEvent.click(screen.getByText("Ghép cặp"))).not.toThrow()
  })
})
