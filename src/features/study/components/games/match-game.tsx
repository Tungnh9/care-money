"use client"

import { useState } from "react"

import { matchScoreFromFlips, pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const PAIR_COUNT = 6
const MISMATCH_DELAY_MS = 800

interface MatchGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number) => void
}

interface MatchCard {
  key: string
  vocabId: string
  label: string
}

function buildCards(vocab: VocabEntry[]): MatchCard[] {
  const entries = pickRandomSet(vocab, PAIR_COUNT)
  const cards: MatchCard[] = entries.flatMap((entry) => [
    { key: `${entry.id}-word`, vocabId: entry.id, label: entry.word },
    { key: `${entry.id}-meaning`, vocabId: entry.id, label: entry.meaning },
  ])
  return pickRandomSet(cards, cards.length)
}

function MatchGame({ vocab, onFinish }: MatchGameProps) {
  const [cards] = useState(() => buildCards(vocab))
  const [flippedCards, setFlippedCards] = useState<MatchCard[]>([])
  const [matchedIds, setMatchedIds] = useState<string[]>([])
  const [flipsUsed, setFlipsUsed] = useState(0)
  const [locked, setLocked] = useState(false)

  function isFaceUp(card: MatchCard): boolean {
    return flippedCards.some((c) => c.key === card.key) || matchedIds.includes(card.vocabId)
  }

  function handleFlip(card: MatchCard) {
    if (locked || isFaceUp(card)) return

    const usedFlips = flipsUsed + 1
    setFlipsUsed(usedFlips)

    const nextFlipped = [...flippedCards, card]
    setFlippedCards(nextFlipped)
    if (nextFlipped.length < 2) return

    const [first, second] = nextFlipped

    if (first.vocabId === second.vocabId) {
      const nextMatched = [...matchedIds, first.vocabId]
      setMatchedIds(nextMatched)
      setFlippedCards([])
      if (nextMatched.length === PAIR_COUNT) {
        onFinish(matchScoreFromFlips(PAIR_COUNT, usedFlips))
      }
      return
    }

    setLocked(true)
    setTimeout(() => {
      setFlippedCards([])
      setLocked(false)
    }, MISMATCH_DELAY_MS)
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          data-vocab-id={card.vocabId}
          disabled={matchedIds.includes(card.vocabId)}
          onClick={() => handleFlip(card)}
          className="flex aspect-square items-center justify-center rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-2 text-center text-[13px] font-bold"
        >
          {isFaceUp(card) ? card.label : "?"}
        </button>
      ))}
    </div>
  )
}

export { MatchGame }
