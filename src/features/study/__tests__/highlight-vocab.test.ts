import { describe, it, expect } from "vitest"

import { highlightVocabInSentence, buildVocabIndex } from "../highlight-vocab"
import type { VocabEntry } from "../types"

function makeIndex(entries: Array<{ id: string; word: string }>): Map<string, string> {
  const vocab: VocabEntry[] = entries.map(({ id, word }) => ({
    id,
    word,
    meaning: "nghĩa",
    addedAt: "2026-08-11",
  }))
  return buildVocabIndex(vocab)
}

describe("highlightVocabInSentence", () => {
  it("matches an exact single-word vocab entry", () => {
    const index = makeIndex([{ id: "v-0030", word: "skirt" }])
    const segments = highlightVocabInSentence("She wants to buy a skirt.", index)

    const matched = segments.filter((s) => s.matched)
    expect(matched).toHaveLength(1)
    expect(matched[0].text).toBe("skirt")
    expect(matched[0].vocabId).toBe("v-0030")
  })

  it("is case-insensitive", () => {
    const index = makeIndex([{ id: "v-0030", word: "skirt" }])
    const segments = highlightVocabInSentence("Skirt shopping is fun.", index)

    expect(segments.some((s) => s.matched && s.text === "Skirt")).toBe(true)
  })

  it("matches a simple plural form via stemming", () => {
    const index = makeIndex([{ id: "v-0031", word: "dress" }])
    const segments = highlightVocabInSentence("We're shopping for two dresses.", index)

    const matched = segments.filter((s) => s.matched)
    expect(matched).toHaveLength(1)
    expect(matched[0].text).toBe("dresses")
    expect(matched[0].vocabId).toBe("v-0031")
  })

  it("matches a simple verb -es inflection via stemming", () => {
    const index = makeIndex([{ id: "v-9001", word: "teach" }])
    const segments = highlightVocabInSentence("Justin teaches Science.", index)

    const matched = segments.filter((s) => s.matched)
    expect(matched).toHaveLength(1)
    expect(matched[0].text).toBe("teaches")
  })

  it("does not strip the plain -s suffix from a word ending in -ss", () => {
    const index = makeIndex([{ id: "v-9002", word: "clas" }])
    const segments = highlightVocabInSentence("This is my class.", index)

    expect(segments.some((s) => s.matched)).toBe(false)
  })

  it("ignores multi-word vocab entries", () => {
    const index = makeIndex([{ id: "v-0016", word: "shop for" }])
    const segments = highlightVocabInSentence("We shop for clothes every week.", index)

    expect(segments.some((s) => s.matched)).toBe(false)
  })

  it("does not match unrelated words", () => {
    const index = makeIndex([{ id: "v-0030", word: "skirt" }])
    const segments = highlightVocabInSentence("He plays football every day.", index)

    expect(segments.some((s) => s.matched)).toBe(false)
  })

  it("preserves the original sentence exactly when segments are joined back together", () => {
    const index = makeIndex([{ id: "v-0030", word: "skirt" }])
    const sentence = "She wants to buy a skirt, doesn't she?"
    const segments = highlightVocabInSentence(sentence, index)

    expect(segments.map((s) => s.text).join("")).toBe(sentence)
  })

  it("matches a hyphenated single-word vocab entry (plural form) as one token", () => {
    const index = makeIndex([{ id: "v-0028", word: "T-shirt" }])
    const segments = highlightVocabInSentence("We're looking for some T-shirts.", index)

    const matched = segments.filter((s) => s.matched)
    expect(matched).toHaveLength(1)
    expect(matched[0].text).toBe("T-shirts")
    expect(matched[0].vocabId).toBe("v-0028")
  })

  it("preserves an em dash used as punctuation (not a hyphen) when reassembling", () => {
    const index = makeIndex([{ id: "v-9003", word: "exercise" }])
    const sentence = "Does she exercise every morning? — Yes, she does."
    const segments = highlightVocabInSentence(sentence, index)

    expect(segments.map((s) => s.text).join("")).toBe(sentence)
    expect(segments.some((s) => s.matched && s.text === "exercise")).toBe(true)
  })

  it("matches a silent-e base word from its -ed inflection", () => {
    const index = makeIndex([{ id: "v-0254", word: "date" }])
    const segments = highlightVocabInSentence("The letter was dated last year.", index)

    const matched = segments.filter((s) => s.matched)
    expect(matched).toHaveLength(1)
    expect(matched[0].text).toBe("dated")
    expect(matched[0].vocabId).toBe("v-0254")
  })

  it("matches a short silent-e base word from its -ing/-ed inflection despite the short stem", () => {
    const index = makeIndex([{ id: "v-0017", word: "use" }])
    const usingSegments = highlightVocabInSentence("She is using a new app.", index)
    const usedSegments = highlightVocabInSentence("He used a new app.", index)

    expect(usingSegments.some((s) => s.matched && s.text === "using")).toBe(true)
    expect(usedSegments.some((s) => s.matched && s.text === "used")).toBe(true)
  })
})

describe("buildVocabIndex", () => {
  it("indexes single-word entries case-insensitively and skips multi-word entries", () => {
    const vocab: VocabEntry[] = [
      { id: "v-1", word: "Skirt", meaning: "váy", addedAt: "2026-08-11" },
      { id: "v-2", word: "shop for", meaning: "mua sắm", addedAt: "2026-08-11" },
    ]
    const index = buildVocabIndex(vocab)

    expect(index.get("skirt")).toBe("v-1")
    expect(index.has("shop for")).toBe(false)
  })
})
