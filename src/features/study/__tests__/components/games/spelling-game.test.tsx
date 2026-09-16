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

  it("never asks the player to type a word containing a literal ... placeholder", () => {
    const templateEntry: VocabEntry = {
      id: "tmpl",
      word: "offer ... (to ...)",
      meaning: "mẫu câu không thể gõ đúng",
      addedAt: "2026-01-01",
    }
    render(<SpellingGame vocab={[...VOCAB, templateEntry]} onFinish={vi.fn()} />)

    for (let i = 0; i < 10; i++) {
      expect(screen.getByTestId("spelling-meaning").textContent).not.toBe(templateEntry.meaning)
      fireEvent.change(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false }), { target: { value: "x" } })
      fireEvent.click(screen.getByRole("button"))
    }
  })

  it("shows an empty-state message instead of crashing when there is no typable vocab", () => {
    const templateOnly: VocabEntry[] = [
      { id: "tmpl", word: "go to ...", meaning: "đi học ở đâu đó", addedAt: "2026-01-01" },
    ]
    render(<SpellingGame vocab={templateOnly} onFinish={vi.fn()} />)

    expect(screen.getByText("Chưa đủ từ vựng để chơi")).toBeInTheDocument()
  })

  it("submits when Enter is pressed inside the input, not just via button click", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    const input = screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false })
    fireEvent.change(input, { target: { value: currentWord().word } })
    fireEvent.submit(input.closest("form")!)

    expect(screen.getByText("Từ 2/10", { exact: false })).toBeInTheDocument()
  })

  it("keeps the input focused after moving to the next word", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false }), { target: { value: "x" } })
    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByLabelText("Gõ lại từ tiếng Anh", { exact: false })).toHaveFocus()
  })
})
