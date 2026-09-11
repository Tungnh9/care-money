import { highlightVocabInSentence } from "../highlight-vocab"

interface HighlightedSentenceProps {
  sentence: string
  vocabIndex: Map<string, string>
}

function HighlightedSentence({ sentence, vocabIndex }: HighlightedSentenceProps) {
  const segments = highlightVocabInSentence(sentence, vocabIndex)
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
