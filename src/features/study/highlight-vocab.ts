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
  } else if (lower.endsWith("ies") && lower.length - 3 + 1 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -3) + "y")
  } else if (lower.endsWith("es") && lower.length - 2 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -2))
  } else if (lower.endsWith("s") && !lower.endsWith("ss") && lower.length - 1 >= MIN_STEM_LENGTH) {
    candidates.push(lower.slice(0, -1))
  }

  // -ing/-ed: try the plain strip, and also add back a silent "e" (dated -> date, using -> use).
  if (lower.endsWith("ing")) {
    const stripped = lower.slice(0, -3)
    if (stripped.length >= MIN_STEM_LENGTH) candidates.push(stripped)
    if (stripped.length + 1 >= MIN_STEM_LENGTH) candidates.push(stripped + "e")
  } else if (lower.endsWith("ed")) {
    const stripped = lower.slice(0, -2)
    if (stripped.length >= MIN_STEM_LENGTH) candidates.push(stripped)
    if (stripped.length + 1 >= MIN_STEM_LENGTH) candidates.push(stripped + "e")
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

function highlightVocabInSentence(sentence: string, index: Map<string, string>): HighlightSegment[] {
  const chunks = sentence.match(/[A-Za-z'-]+|[^A-Za-z'-]+/g) ?? []

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

export { highlightVocabInSentence, buildVocabIndex, type HighlightSegment }
