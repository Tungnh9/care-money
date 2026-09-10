import { describe, it, expect } from "vitest"

import { highlightVocabInSentence } from "../highlight-vocab"
import type { VocabEntry } from "../types"

function makeVocab(entries: Array<{ id: string; word: string }>): VocabEntry[] {
  return entries.map(({ id, word }) => ({
    id,
    word,
    meaning: "nghĩa",
    addedAt: "2026-08-11",
  }))
}

describe("highlightVocabInSentence", () => {
  it("matches an exact single-word vocab entry", () => {
    const vocab = makeVocab([{ id: "v-0030", word: "skirt" }])
    const segments = highlightVocabInSentence("She wants to buy a skirt.", vocab)

    const matched = segments.filter((s) => s.matched)
    expect(matched).toHaveLength(1)
    expect(matched[0].text).toBe("skirt")
    expect(matched[0].vocabId).toBe("v-0030")
  })

  it("is case-insensitive", () => {
    const vocab = makeVocab([{ id: "v-0030", word: "skirt" }])
    const segments = highlightVocabInSentence("Skirt shopping is fun.", vocab)

    expect(segments.some((s) => s.matched && s.text === "Skirt")).toBe(true)
  })

  it("matches a simple plural form via stemming", () => {
    const vocab = makeVocab([{ id: "v-0031", word: "dress" }])
    const segments = highlightVocabInSentence("We're shopping for two dresses.", vocab)

    const matched = segments.filter((s) => s.matched)
    expect(matched).toHaveLength(1)
    expect(matched[0].text).toBe("dresses")
    expect(matched[0].vocabId).toBe("v-0031")
  })

  it("matches a simple verb -es inflection via stemming", () => {
    const vocab = makeVocab([{ id: "v-9001", word: "teach" }])
    const segments = highlightVocabInSentence("Justin teaches Science.", vocab)

    const matched = segments.filter((s) => s.matched)
    expect(matched).toHaveLength(1)
    expect(matched[0].text).toBe("teaches")
  })

  it("does not strip the plain -s suffix from a word ending in -ss", () => {
    const vocab = makeVocab([{ id: "v-9002", word: "clas" }])
    const segments = highlightVocabInSentence("This is my class.", vocab)

    expect(segments.some((s) => s.matched)).toBe(false)
  })

  it("ignores multi-word vocab entries", () => {
    const vocab = makeVocab([{ id: "v-0016", word: "shop for" }])
    const segments = highlightVocabInSentence("We shop for clothes every week.", vocab)

    expect(segments.some((s) => s.matched)).toBe(false)
  })

  it("does not match unrelated words", () => {
    const vocab = makeVocab([{ id: "v-0030", word: "skirt" }])
    const segments = highlightVocabInSentence("He plays football every day.", vocab)

    expect(segments.some((s) => s.matched)).toBe(false)
  })

  it("preserves the original sentence exactly when segments are joined back together", () => {
    const vocab = makeVocab([{ id: "v-0030", word: "skirt" }])
    const sentence = "She wants to buy a skirt, doesn't she?"
    const segments = highlightVocabInSentence(sentence, vocab)

    expect(segments.map((s) => s.text).join("")).toBe(sentence)
  })
})
