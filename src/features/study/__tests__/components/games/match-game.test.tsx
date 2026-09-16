import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

import { MatchGame } from "../../../components/games/match-game"
import type { VocabEntry } from "../../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => vocab(`${i}`))

function sortedByVocabId(cards: HTMLElement[]): HTMLElement[] {
  return [...cards].sort((a, b) =>
    (a.getAttribute("data-vocab-id") ?? "").localeCompare(b.getAttribute("data-vocab-id") ?? "")
  )
}

describe("MatchGame", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders 12 face-down cards for 6 pairs", () => {
    render(<MatchGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(screen.getAllByRole("button")).toHaveLength(12)
    screen.getAllByRole("button").forEach((card) => expect(card.textContent).toBe("?"))
  })

  it("flips a mismatched pair back face-down after a short delay", () => {
    render(<MatchGame vocab={VOCAB} onFinish={vi.fn()} />)

    const sorted = sortedByVocabId(screen.getAllByRole("button"))
    // sorted[0]/[1] là 1 cặp giống nhau, sorted[2]/[3] là cặp khác — sorted[0] và sorted[2] chắc
    // chắn khác vocabId nên chắc chắn KHÔNG khớp cặp.
    const cardA = sorted[0]
    const cardB = sorted[2]

    fireEvent.click(cardA)
    fireEvent.click(cardB)
    expect(cardA.textContent).not.toBe("?")
    expect(cardB.textContent).not.toBe("?")

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(cardA.textContent).toBe("?")
    expect(cardB.textContent).toBe("?")
  })

  it("keeps a matched pair face-up and calls onFinish once all 6 pairs are matched", () => {
    const onFinish = vi.fn()
    render(<MatchGame vocab={VOCAB} onFinish={onFinish} />)

    const sorted = sortedByVocabId(screen.getAllByRole("button"))
    for (let i = 0; i < sorted.length; i += 2) {
      fireEvent.click(sorted[i])
      fireEvent.click(sorted[i + 1])
    }

    expect(sorted[0].textContent).not.toBe("?")
    expect(onFinish).toHaveBeenCalledWith(expect.any(Number))
  })
})
