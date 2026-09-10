import type { VocabEntry } from "./types"

interface HighlightSegment {
  text: string
  matched: boolean
  vocabId?: string
}

const MIN_STEM_LENGTH = 3

function stemCandidates(word: string): string[] {
  const lower = word.toLowerCase()
  const candidates = [lower]

  if (lower.endsWith("'s") && lower.length - 2 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -2))
  }
  if (lower.endsWith("ies") && lower.length - 3 + 1 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -3) + "y")
  }
  if (lower.endsWith("es") && lower.length - 2 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -2))
  }
  if (lower.endsWith("s") && !lower.endsWith("ss") && lower.length - 1 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -1))
  }
  if (lower.endsWith("ing") && lower.length - 3 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -3))
  }
  if (lower.endsWith("ed") && lower.length - 2 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -2))
  }

  return candidates
}

function buildVocabIndex(vocab: VocabEntry[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const entry of vocab) {
    if (entry.word.includes(" ")) continue
    const key = entry.word.toLowerCase()
    if (!index.has(key)) index.set(key, entry.id)
  }
  return index
}

function highlightVocabInSentence(sentence: string, vocab: VocabEntry[]): HighlightSegment[] {
  const index = buildVocabIndex(vocab)
  const chunks = sentence.match(/[A-Za-z']+|[^A-Za-z']+/g) ?? []

  return chunks.map((chunk) => {
    if (!/[A-Za-z]/.test(chunk)) {
      return { text: chunk, matched: false }
    }
    for (const candidate of stemCandidates(chunk)) {
      const vocabId = index.get(candidate)
      if (vocabId) {
        return { text: chunk, matched: true, vocabId }
      }
    }
    return { text: chunk, matched: false }
  })
}

export { highlightVocabInSentence, type HighlightSegment }
