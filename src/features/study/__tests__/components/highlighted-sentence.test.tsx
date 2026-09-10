import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { HighlightedSentence } from "../../components/highlighted-sentence"
import type { VocabEntry } from "../../types"

function makeVocab(entries: Array<{ id: string; word: string }>): VocabEntry[] {
  return entries.map(({ id, word }) => ({
    id,
    word,
    meaning: "nghĩa",
    addedAt: "2026-08-11",
  }))
}

describe("HighlightedSentence", () => {
  it("renders the matched vocab word inside a <mark>", () => {
    const vocab = makeVocab([{ id: "v-0030", word: "skirt" }])
    render(<HighlightedSentence sentence="She wants to buy a skirt." vocab={vocab} />)

    const mark = screen.getByText("skirt", { selector: "mark" })
    expect(mark).toBeInTheDocument()
  })

  it("renders the full sentence text even when nothing matches", () => {
    const vocab = makeVocab([{ id: "v-0030", word: "skirt" }])
    render(<HighlightedSentence sentence="He plays football every day." vocab={vocab} />)

    expect(screen.getByText("He plays football every day.")).toBeInTheDocument()
    expect(screen.queryByText(/./, { selector: "mark" })).not.toBeInTheDocument()
  })
})
