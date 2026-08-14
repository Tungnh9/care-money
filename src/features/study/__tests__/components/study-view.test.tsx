import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { StudyView } from "../../components/study-view"
import { dayKey, pickDaily } from "../../daily-pick"
import type { GrammarEntry, VocabEntry } from "../../types"

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => ({
  id: `v-${i}`,
  word: `word-${i}`,
  pos: "n.",
  phonetic: `/word-${i}/`,
  meaning: `nghĩa ${i}`,
  addedAt: "2026-08-14",
}))

const GRAMMAR: GrammarEntry[] = Array.from({ length: 5 }, (_, i) => ({
  id: `g-${i}`,
  title: `Cấu trúc ${i}`,
  explanation: `Giải thích ${i}`,
  examples: [`Ví dụ ${i}.`],
  addedAt: "2026-08-14",
}))

describe("StudyView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows today's 5 vocab words and 1 grammar highlight on the Hôm nay tab", async () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    const key = dayKey()
    const dailyWords = pickDaily(VOCAB, 5, key, "vocab")
    const dailyGrammar = pickDaily(GRAMMAR, 1, key, "grammar")[0]

    for (const word of dailyWords) {
      expect(screen.getByText(word.word)).toBeInTheDocument()
    }
    expect(screen.getByText(dailyGrammar.title)).toBeInTheDocument()
    expect(screen.getByText("0/3 nhiệm vụ · 0/5 từ hôm nay · ngày 14/08")).toBeInTheDocument()
  })

  it("marking a word as learned updates the progress card", async () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    const markButtons = screen.getAllByRole("button", { name: "Đánh dấu đã học" })
    fireEvent.click(markButtons[0])

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Bỏ đánh dấu đã học" })).toHaveLength(1)
    )
    expect(screen.getByText("Thuộc 10% kho từ")).toBeInTheDocument()
  })

  it("ticking a task updates the header count", async () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByText("Ôn 20 từ vựng"))

    await waitFor(() =>
      expect(screen.getByText("1/3 nhiệm vụ · 0/5 từ hôm nay · ngày 14/08")).toBeInTheDocument()
    )
  })

  it("lists every vocab word on the Từ vựng tab", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Từ vựng" }))

    expect(screen.getByText("Kho từ vựng giao tiếp · 10 từ")).toBeInTheDocument()
    VOCAB.forEach((v) => expect(screen.getByText(v.word)).toBeInTheDocument())
  })

  it("lists every grammar entry on the Ngữ pháp tab", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Ngữ pháp" }))

    expect(screen.getByText("Ngữ pháp tiếng Anh · 5 mục")).toBeInTheDocument()
    GRAMMAR.forEach((g) => expect(screen.getByText(g.title)).toBeInTheDocument())
  })
})
