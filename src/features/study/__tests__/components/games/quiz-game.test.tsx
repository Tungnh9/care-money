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

  it("calls onFinish with a numeric score and the round's total after answering all 10 questions", () => {
    const onFinish = vi.fn()
    render(<QuizGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getAllByRole("button")[0])
    }

    expect(onFinish).toHaveBeenCalledWith(expect.any(Number), 10)
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

    expect(onFinish).toHaveBeenCalledWith(10, 10)
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

    expect(onFinish).toHaveBeenCalledWith(0, 10)
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
    expect(onFinish).toHaveBeenCalledWith(0, 10)
  })

  it("shows an empty-state message and never calls onFinish when there is no vocab", () => {
    const onFinish = vi.fn()
    render(<QuizGame vocab={[]} onFinish={onFinish} />)

    expect(screen.getByText("Chưa đủ từ vựng để chơi")).toBeInTheDocument()

    // Trước có lỗi: countdown vẫn chạy ngầm dù đang hiện màn hình rỗng, hết 10s là tự gọi
    // onFinish(0) — advance qua nhiều hơn 10s để chắc chắn bẫy được lỗi đó nếu tái diễn.
    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(onFinish).not.toHaveBeenCalled()
  })

  it("reports the correct word id and outcome via onWordReviewed for every question, including on timeout", () => {
    const onWordReviewed = vi.fn()
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} onWordReviewed={onWordReviewed} />)

    const heading = screen.getByRole("heading", { level: 3 })
    const correctEntry = VOCAB.find((entry) => entry.word === heading.textContent)!
    fireEvent.click(screen.getByRole("button", { name: correctEntry.meaning }))

    expect(onWordReviewed).toHaveBeenCalledWith(correctEntry.id, true)

    const nextHeading = screen.getByRole("heading", { level: 3 })
    const nextCorrectEntry = VOCAB.find((entry) => entry.word === nextHeading.textContent)!
    const wrongButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent !== nextCorrectEntry.meaning)!
    fireEvent.click(wrongButton)

    expect(onWordReviewed).toHaveBeenCalledWith(nextCorrectEntry.id, false)
  })

  it("still reports onWordReviewed for the final question, not just the first 9", () => {
    const onWordReviewed = vi.fn()
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} onWordReviewed={onWordReviewed} />)

    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getAllByRole("button")[0])
    }

    expect(onWordReviewed).toHaveBeenCalledTimes(10)
  })

  it("reports onWordReviewed(id, false) when a question times out without an answer", () => {
    const onWordReviewed = vi.fn()
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} onWordReviewed={onWordReviewed} />)

    const heading = screen.getByRole("heading", { level: 3 })
    const correctEntry = VOCAB.find((entry) => entry.word === heading.textContent)!

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(onWordReviewed).toHaveBeenCalledWith(correctEntry.id, false)
  })

  it("does not crash when onWordReviewed is omitted", () => {
    render(<QuizGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(() => fireEvent.click(screen.getAllByRole("button")[0])).not.toThrow()
  })
})
