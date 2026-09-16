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

  it("auto-advances to the next question when the 10-second timer runs out", () => {
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByText("Câu 2/10", { exact: false })).toBeInTheDocument()
  })
})
