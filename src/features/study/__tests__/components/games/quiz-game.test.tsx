import { StrictMode } from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

import { QuizGame } from "../../../components/games/quiz-game"
import type { VocabEntry } from "../../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 20 }, (_, i) => vocab(`${i}`))

describe("QuizGame", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the first question with 4 options", () => {
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(screen.getByText("Câu 1/10", { exact: false })).toBeInTheDocument()
    expect(screen.getAllByRole("button")).toHaveLength(4)
  })

  it("calls onFinish with a numeric score after answering all 10 questions", () => {
    const onFinish = vi.fn()
    render(<QuizGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getAllByRole("button")[0])
    }

    expect(onFinish).toHaveBeenCalledWith(expect.any(Number))
  })

  it("scores 10/10 when the correct meaning is clicked for every question", () => {
    const onFinish = vi.fn()
    render(<QuizGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      const heading = screen.getByRole("heading", { level: 3 })
      const correctEntry = VOCAB.find((entry) => entry.word === heading.textContent)
      expect(correctEntry).toBeDefined()

      const correctButton = screen.getByRole("button", { name: correctEntry!.meaning })
      fireEvent.click(correctButton)
    }

    expect(onFinish).toHaveBeenCalledWith(10)
  })

  it("scores 0/10 when a wrong meaning is clicked for every question", () => {
    const onFinish = vi.fn()
    render(<QuizGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      const heading = screen.getByRole("heading", { level: 3 })
      const correctEntry = VOCAB.find((entry) => entry.word === heading.textContent)
      expect(correctEntry).toBeDefined()

      const wrongButton = screen
        .getAllByRole("button")
        .find((button) => button.textContent !== correctEntry!.meaning)
      expect(wrongButton).toBeDefined()
      fireEvent.click(wrongButton!)
    }

    expect(onFinish).toHaveBeenCalledWith(0)
  })

  it("auto-advances to the next question when the 10-second timer runs out", () => {
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByText("Câu 2/10", { exact: false })).toBeInTheDocument()
  })

  it("calls onFinish exactly once when every question times out, even under React Strict Mode", () => {
    const onFinish = vi.fn()
    render(
      <StrictMode>
        <QuizGame vocab={VOCAB} onFinish={onFinish} />
      </StrictMode>
    )

    for (let round = 0; round < 10; round++) {
      act(() => {
        vi.advanceTimersByTime(10_000)
      })
    }

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith(0)
  })

  it("shows an empty-state message instead of crashing when there is no vocab", () => {
    render(<QuizGame vocab={[]} onFinish={vi.fn()} />)

    expect(screen.getByText("Chưa đủ từ vựng để chơi")).toBeInTheDocument()
  })
})
