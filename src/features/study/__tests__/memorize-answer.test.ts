import { describe, expect, it } from "vitest"

import { getVocab } from "@/lib/study/content-loader"
import type { VocabEntry } from "@/lib/study/types"
import { acceptedAnswers, gradeAnswer, isCorrectAnswer } from "../memorize-answer"

describe("isCorrectAnswer", () => {
  it("accepts the word whatever the case and the spaces around it", () => {
    expect(isCorrectAnswer("  Exam ", "exam")).toBe(true)
    expect(isCorrectAnswer("EXAM", "exam")).toBe(true)
  })

  it("rejects a wrong or empty answer", () => {
    expect(isCorrectAnswer("exams", "exam")).toBe(false)
    expect(isCorrectAnswer("exma", "exam")).toBe(false)
    expect(isCorrectAnswer("", "exam")).toBe(false)
    expect(isCorrectAnswer("   ", "exam")).toBe(false)
  })

  it("does not care about hyphens or spaces between words", () => {
    for (const typed of ["T-shirt", "t shirt", "tshirt"]) expect(isCorrectAnswer(typed, "T-shirt")).toBe(true)
    expect(isCorrectAnswer("part time", "part-time")).toBe(true)
    expect(isCorrectAnswer("for  free", "for free")).toBe(true)
  })

  it("treats the part in brackets as optional", () => {
    expect(isCorrectAnswer("busy", "busy (with)")).toBe(true)
    expect(isCorrectAnswer("busy with", "busy (with)")).toBe(true)
    expect(isCorrectAnswer("apply for", "apply for (a job)")).toBe(true)
    expect(isCorrectAnswer("apply for a job", "apply for (a job)")).toBe(true)
  })

  it("does not ask for the ... blanks", () => {
    expect(isCorrectAnswer("go to", "go to ...")).toBe(true)
    expect(isCorrectAnswer("offer", "offer ... (to ...)")).toBe(true)
    expect(isCorrectAnswer("bring to", "bring ... to ...")).toBe(true)
  })

  it("treats a grammar slot after the + sign as optional, but not a real word", () => {
    expect(isCorrectAnswer("kind of", "kind of + adj.")).toBe(true)
    expect(isCorrectAnswer("dress clothes", "dress + clothes")).toBe(true)
    expect(isCorrectAnswer("practice", "practice (+ sport)")).toBe(true)
  })

  it("takes either side of a slash", () => {
    expect(isCorrectAnswer("younger brother", "younger brother/sister")).toBe(true)
    expect(isCorrectAnswer("younger sister", "younger brother/sister")).toBe(true)
    expect(isCorrectAnswer("older sister", "older brother/sister")).toBe(true)
    expect(isCorrectAnswer("taste good", "taste (good/bad/etc.)")).toBe(true)
    expect(isCorrectAnswer("walk my dog", "walk (my dog/cat/...)")).toBe(true)
  })

  it("takes the acronym in brackets as another name for the whole word", () => {
    expect(isCorrectAnswer("the UK", "the United Kingdom (the UK)")).toBe(true)
    expect(isCorrectAnswer("the United Kingdom", "the United Kingdom (the UK)")).toBe(true)
  })

  it("lets each ... blank be filled with a few whole words", () => {
    expect(isCorrectAnswer("take a class", "take ... class")).toBe(true)
    expect(isCorrectAnswer("throw it away", "throw ... away")).toBe(true)
    expect(isCorrectAnswer("go to school", "go to ...")).toBe(true)
    expect(isCorrectAnswer("bring something to someone", "bring ... to ...")).toBe(true)
    expect(isCorrectAnswer("go toward", "go to ...")).toBe(false)
  })

  it("still needs every word that is not optional", () => {
    expect(isCorrectAnswer("apply", "apply for (a job)")).toBe(false)
    expect(isCorrectAnswer("United Kingdom", "the United Kingdom (the UK)")).toBe(false)
    // "dress" là cái đầm — 1 từ khác hẳn "dress + clothes" (đồ trang trọng), cùng chủ đề Quần áo.
    expect(isCorrectAnswer("dress", "dress + clothes")).toBe(false)
  })

  it("ignores accents and the curly apostrophe a phone keyboard may type", () => {
    expect(isCorrectAnswer("cafe", "café")).toBe(true)
    expect(isCorrectAnswer("o’clock", "o'clock")).toBe(true)
  })
})

describe("gradeAnswer", () => {
  const popular: VocabEntry = { id: "v-1", word: "popular", meaning: "nổi tiếng", addedAt: "2026-08-11" }
  const famous: VocabEntry = { id: "v-2", word: "famous", meaning: " Nổi tiếng", addedAt: "2026-08-11" }
  const exam: VocabEntry = { id: "v-3", word: "exam", meaning: "kỳ thi", addedAt: "2026-08-11" }
  const pool = [popular, famous, exam]

  it("grades the card's own word as exact", () => {
    expect(gradeAnswer("Popular", popular, pool)).toBe("exact")
  })

  it("also takes another word with the same Vietnamese meaning, as a synonym", () => {
    expect(gradeAnswer("famous", popular, pool)).toBe("synonym")
  })

  it("does not take a word with another meaning", () => {
    expect(gradeAnswer("exam", popular, pool)).toBeNull()
    expect(gradeAnswer("", popular, pool)).toBeNull()
  })
})

describe("acceptedAnswers on the real vocabulary file", () => {
  const vocab = getVocab()

  it("gives every word an answer, and accepts each word typed exactly as it is shown", () => {
    expect(vocab.length).toBeGreaterThan(0)
    for (const entry of vocab) {
      expect(acceptedAnswers(entry.word).length, entry.word).toBeGreaterThan(0)
      expect(isCorrectAnswer(entry.word, entry.word), entry.word).toBe(true)
    }
  })

  it("never accepts one card's word for another card with a different meaning in the same topic", () => {
    for (const entry of vocab) {
      for (const other of vocab) {
        if (other.id === entry.id || other.topic !== entry.topic || other.meaning === entry.meaning) continue
        expect(isCorrectAnswer(other.word, entry.word), `${other.word} → ${entry.word}`).toBe(false)
      }
    }
  })

  it("accepts the other word of every pair that shares a Vietnamese meaning", () => {
    const shared = vocab.filter((entry) =>
      vocab.some(
        (other) => other.id !== entry.id && other.meaning.trim().toLowerCase() === entry.meaning.trim().toLowerCase()
      )
    )
    expect(shared.length).toBeGreaterThan(0)
    for (const entry of shared) {
      for (const other of shared) {
        if (other.id === entry.id || other.meaning.trim().toLowerCase() !== entry.meaning.trim().toLowerCase()) continue
        expect(gradeAnswer(other.word, entry, vocab), `${other.word} → ${entry.word}`).not.toBeNull()
      }
    }
  })
})
