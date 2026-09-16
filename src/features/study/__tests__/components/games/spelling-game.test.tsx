import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { SpellingGame } from "../../../components/games/spelling-game"
import type { VocabEntry } from "../../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 15 }, (_, i) => vocab(`${i}`))

function currentWord(): VocabEntry {
  const meaning = screen.getByTestId("spelling-meaning").textContent
  const entry = VOCAB.find((v) => v.meaning === meaning)
  if (!entry) throw new Error("test setup error: current meaning not found in VOCAB")
  return entry
}

describe("SpellingGame", () => {
  it("shows the meaning for the first word and an input to type the answer", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(screen.getByText("Từ 1/10", { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false })).toBeInTheDocument()
  })

  it("accepts a correct answer regardless of case, and calls onFinish with 10 after 10 correct words", () => {
    const onFinish = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      const entry = currentWord()
      fireEvent.change(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false }), {
        target: { value: entry.word.toUpperCase() },
      })
      fireEvent.click(screen.getByRole("button"))
    }

    expect(onFinish).toHaveBeenCalledWith(10)
  })

  it("does not count a wrong spelling as correct", () => {
    const onFinish = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={onFinish} />)

    for (let i = 0; i < 10; i++) {
      fireEvent.change(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false }), {
        target: { value: "definitely-wrong-answer" },
      })
      fireEvent.click(screen.getByRole("button"))
    }

    expect(onFinish).toHaveBeenCalledWith(0)
  })
})
