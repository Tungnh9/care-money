import { highlightVocabInSentence } from "../highlight-vocab"
import type { VocabEntry } from "../types"

interface HighlightedSentenceProps {
  sentence: string
  vocab: VocabEntry[]
}

function HighlightedSentence({ sentence, vocab }: HighlightedSentenceProps) {
  const segments = highlightVocabInSentence(sentence, vocab)
  return (
    <>
      {segments.map((segment, i) =>
        segment.matched ? (
          <mark
            key={i}
            className="rounded-[2px] bg-[var(--ob-color-action-soft)] px-[1px] font-semibold text-[var(--ob-color-action-strong)]"
          >
            {segment.text}
          </mark>
        ) : (
          segment.text
        )
      )}
    </>
  )
}

export { HighlightedSentence }
