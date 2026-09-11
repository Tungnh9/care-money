import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { HighlightedSentence } from "../../components/highlighted-sentence"
import { buildVocabIndex } from "../../highlight-vocab"
import type { VocabEntry } from "../../types"

function makeIndex(entries: Array<{ id: string; word: string }>): Map<string, string> {
  const vocab: VocabEntry[] = entries.map(({ id, word }) => ({
    id,
    word,
    meaning: "nghĩa",
    addedAt: "2026-08-11",
  }))
  return buildVocabIndex(vocab)
}

describe("HighlightedSentence", () => {
  it("renders the matched vocab word inside a <mark>", () => {
    const vocabIndex = makeIndex([{ id: "v-0030", word: "skirt" }])
    render(<HighlightedSentence sentence="She wants to buy a skirt." vocabIndex={vocabIndex} />)

    const mark = screen.getByText("skirt", { selector: "mark" })
    expect(mark).toBeInTheDocument()
  })

  it("renders the full sentence text even when nothing matches", () => {
    const vocabIndex = makeIndex([{ id: "v-0030", word: "skirt" }])
    render(<HighlightedSentence sentence="He plays football every day." vocabIndex={vocabIndex} />)

    expect(screen.getByText("He plays football every day.")).toBeInTheDocument()
    expect(screen.queryByText(/./, { selector: "mark" })).not.toBeInTheDocument()
  })
})
