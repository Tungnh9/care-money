import { describe, it, expect } from "vitest"

import { getGrammar, getVocab } from "../content-loader"

describe("getVocab", () => {
  it("loads a substantial, growing set of real vocabulary entries", () => {
    const vocab = getVocab()

    expect(vocab.length).toBeGreaterThan(300)
    expect(vocab[0]).toMatchObject({
      id: expect.stringMatching(/^v-\d+$/),
      word: expect.any(String),
      meaning: expect.any(String),
      addedAt: expect.any(String),
    })
  })

  it("gives every entry a unique id", () => {
    const vocab = getVocab()
    const ids = new Set(vocab.map((v) => v.id))
    expect(ids.size).toBe(vocab.length)
  })
})

describe("getGrammar", () => {
  it("loads a substantial set of real grammar entries", () => {
    const grammar = getGrammar()

    expect(grammar.length).toBeGreaterThan(30)
    expect(grammar[0]).toMatchObject({
      id: expect.stringMatching(/^g-\d+$/),
      title: expect.any(String),
      explanation: expect.any(String),
      addedAt: expect.any(String),
    })
  })

  it("gives every entry a unique id", () => {
    const grammar = getGrammar()
    const ids = new Set(grammar.map((g) => g.id))
    expect(ids.size).toBe(grammar.length)
  })
})
