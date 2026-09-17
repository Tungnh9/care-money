"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { Empty } from "@/components/ob/empty"
import { Fireworks } from "@/components/ob/fireworks"
import { matchScoreFromFlips, pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const PAIR_COUNT = 6
const MISMATCH_DELAY_MS = 800

interface MatchGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number, total?: number) => void
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
  const actualPairCount = cards.length / 2
  const [flippedCards, setFlippedCards] = useState<MatchCard[]>([])
  const [matchedIds, setMatchedIds] = useState<string[]>([])
  const [flipsUsed, setFlipsUsed] = useState(0)
  // locked suy ra thẳng từ flippedCards thay vì 1 state riêng — luôn đúng 2 lá đang lật (kể cả
  // lệch cặp, chờ auto-lật úp lại) thì khoá bàn chơi, không cần đồng bộ tay 1 cờ bool riêng qua
  // từng nhánh (ăn cặp/lệch cặp/hết giờ chờ).
  const locked = flippedCards.length === 2
  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // null = không có hiệu ứng; khác null = nonce để remount <Fireworks> mỗi lần ăn 1 cặp mới, kể
  // cả khi 2 cặp liên tiếp ăn đúng (key đổi mới bắt animation phát lại từ đầu). Dùng luôn
  // nextMatched.length (đã tính bên dưới) làm nonce — nó vốn đã tăng dần đúng 1 mỗi lần ăn cặp,
  // không cần thêm ref/hàm impure (Date.now()) nào khác để tạo giá trị đó.
  const [matchBurst, setMatchBurst] = useState<number | null>(null)

  // Dọn timer chờ lật úp lại nếu component unmount giữa chừng (vd. rời tab "Trò chơi" ngay sau
  // khi lật lệch cặp) — nếu không, setTimeout vẫn bắn sau khi unmount và gọi setState trên
  // instance đã chết.
  useEffect(() => {
    return () => {
      if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current)
    }
  }, [])

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
      setMatchBurst(nextMatched.length)
      if (nextMatched.length === actualPairCount) {
        onFinish(matchScoreFromFlips(actualPairCount, usedFlips))
      }
      return
    }

    mismatchTimerRef.current = setTimeout(() => {
      setFlippedCards([])
    }, MISMATCH_DELAY_MS)
  }

  if (!cards.length) {
    return <Empty pose="sleep" title="Chưa đủ từ vựng để chơi" hint="Cần thêm từ vựng trong ngân hàng từ." />
  }

  return (
    <div className="relative mx-auto max-w-[560px]">
      {matchBurst !== null ? <Fireworks key={matchBurst} /> : null}
      <div className="grid grid-cols-4 gap-2.5">
        {cards.map((card) => {
          const isMatched = matchedIds.includes(card.vocabId)
          const faceUp = isFaceUp(card)
          return (
            <button
              key={card.key}
              type="button"
              data-vocab-id={card.vocabId}
              disabled={isMatched}
              onClick={() => handleFlip(card)}
              className={cn(
                "flex aspect-square items-center justify-center overflow-hidden rounded-[var(--ob-radius-md)] border-[1.5px] p-2 text-center text-[13px] leading-tight font-bold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
                isMatched
                  ? "border-transparent bg-[var(--ob-color-income-soft)] text-[var(--ob-color-income)]"
                  : "border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] text-[var(--ob-color-text)] hover:border-[var(--ob-color-action)] hover:bg-[var(--ob-color-action-soft)]"
              )}
            >
              {faceUp ? card.label : "?"}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { MatchGame }
