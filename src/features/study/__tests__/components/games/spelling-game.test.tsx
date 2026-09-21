import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

import { SpellingGame } from "../../../components/games/spelling-game"
import type { VocabEntry } from "../../../types"

vi.mock("@/lib/speak", () => ({ speakWord: vi.fn() }))

import { speakWord } from "@/lib/speak"

function vocab(id: string): VocabEntry {
  return { id, word: `word${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => vocab(`${i}`))

function typeChar(area: HTMLElement, key: string) {
  fireEvent.keyDown(area, { key })
}

function typeWord(area: HTMLElement, word: string) {
  for (const ch of word) typeChar(area, ch)
}

describe("SpellingGame", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the round progress and full lives at the start", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(screen.getByText("Từ 0/10", { exact: false })).toBeInTheDocument()
    expect(screen.getAllByTestId("heart-full")).toHaveLength(5)
    expect(screen.queryAllByTestId("heart-empty")).toHaveLength(0)
  })

  it("shows an empty-state message and never calls onFinish when there is no typable vocab", () => {
    const onFinish = vi.fn()
    render(<SpellingGame vocab={[]} onFinish={onFinish} />)

    expect(screen.getByText("Chưa đủ từ vựng để chơi")).toBeInTheDocument()

    // Trước có lỗi: hiệu ứng kiểm tra "hết vòng" tính 0+0 >= 0 là đúng ngay từ đầu và tự gọi
    // onFinish(0), đè mất luôn màn hình rỗng phía trên.
    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(onFinish).not.toHaveBeenCalled()
  })

  it("spawns a falling word shortly after mount", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(screen.getAllByTestId("falling-word").length).toBeGreaterThan(0)
  })

  it("destroys a word when typed correctly, speaks it aloud, and advances the resolved count", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const area = screen.getByRole("application")
    const word = screen.getAllByTestId("falling-word")[0].textContent!

    typeWord(area, word)

    expect(screen.queryByText(word)).not.toBeInTheDocument()
    expect(speakWord).toHaveBeenCalledWith(word)
    expect(screen.getByText("Từ 1/10", { exact: false })).toBeInTheDocument()
  })

  it("ignores a keystroke that doesn't match any falling word's prefix", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const area = screen.getByRole("application")
    typeChar(area, "z") // không từ mẫu "wordN" nào bắt đầu bằng z

    expect(screen.getByText("Gõ từ tiếng Anh đang rơi...")).toBeInTheDocument()
  })

  it("removes the last typed character on Backspace", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const area = screen.getByRole("application")
    typeChar(area, "w")
    typeChar(area, "o")
    expect(screen.getByText("Đang gõ: wo")).toBeInTheDocument()

    fireEvent.keyDown(area, { key: "Backspace" })
    expect(screen.getByText("Đang gõ: w")).toBeInTheDocument()
  })

  it("prevents the browser's default action for space and Backspace, so the page doesn't scroll/navigate mid-game", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const area = screen.getByRole("application")
    // dispatchEvent (dùng bên trong fireEvent) trả về false nếu có handler nào gọi preventDefault().
    expect(fireEvent.keyDown(area, { key: " " })).toBe(false)
    expect(fireEvent.keyDown(area, { key: "Backspace" })).toBe(false)
  })

  it("loses a life and removes the word once it falls for the full duration without being typed", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(screen.getAllByTestId("falling-word").length).toBeGreaterThan(0)

    act(() => {
      vi.advanceTimersByTime(15000)
    })

    expect(screen.getAllByTestId("heart-full")).toHaveLength(4)
    expect(screen.getAllByTestId("heart-empty")).toHaveLength(1)
  })

  it("calls onFinish with the destroyed count exactly once all lives are lost", () => {
    const onFinish = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={onFinish} />)

    // Không gõ gì cả — để các từ lần lượt rơi hết, mất dần cả 5 mạng.
    act(() => {
      vi.advanceTimersByTime(80_000)
    })

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith(0, 10)
  })

  it("calls onFinish with the destroyed count once every word in the round is resolved", () => {
    const onFinish = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={onFinish} />)

    const area = screen.getByRole("application")
    // Gõ đúng từng từ ngay khi nó vừa xuất hiện, không để rơi hết mạng nào — chạy tới khi cả 10
    // từ đều được gõ xong.
    for (let i = 0; i < 10; i++) {
      act(() => {
        vi.advanceTimersByTime(2300) // > SPAWN_GAP_MS, đủ để từ tiếp theo xuất hiện
      })
      const words = screen.queryAllByTestId("falling-word")
      if (words.length) {
        typeWord(area, words[0].textContent!)
      }
    }

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith(10, 10)
  })

  it("reports onWordReviewed(id, true) when a word is destroyed by typing it correctly", () => {
    const onWordReviewed = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} onWordReviewed={onWordReviewed} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })
    const area = screen.getByRole("application")
    const wordText = screen.getAllByTestId("falling-word")[0].textContent!
    const entry = VOCAB.find((v) => v.word === wordText)!

    typeWord(area, wordText)

    expect(onWordReviewed).toHaveBeenCalledWith(entry.id, true)
  })

  it("reports onWordReviewed(id, false) for a word that falls for the full duration untyped", () => {
    const onWordReviewed = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} onWordReviewed={onWordReviewed} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })
    const firstWordText = screen.getAllByTestId("falling-word")[0].textContent!
    const firstEntry = VOCAB.find((v) => v.word === firstWordText)!

    act(() => {
      vi.advanceTimersByTime(15000) // FALL_DURATION_MS — để rơi hết mà không gõ
    })

    expect(onWordReviewed).toHaveBeenCalledWith(firstEntry.id, false)
  })

  it("does not crash when onWordReviewed is omitted", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(20000)
      })
    }).not.toThrow()
  })

  it("reports onWordReviewed(id, false) for every missed word, not just the last one in a batch", () => {
    const onWordReviewed = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} onWordReviewed={onWordReviewed} />)

    // Để hết 5 mạng, nhiều từ rơi trong cùng 1 batch fake-timer — nếu không accumulate,
    // chỉ từ cuối cùng được báo thay vì tất cả.
    act(() => {
      vi.advanceTimersByTime(80_000)
    })

    const missedCalls = onWordReviewed.mock.calls.filter(([, correct]) => correct === false)
    // Kỳ vọng: nhiều lần báo (tất cả từ rơi hết mạng), mỗi lần 1 từ khác nhau, không mất id
    expect(missedCalls.length).toBeGreaterThan(1) // ít nhất 2 từ rơi
    // Kiểm tra số id khác nhau = số lần báo (không lặp, không mất)
    const missedIds = new Set(missedCalls.map(([id]) => id))
    expect(missedIds.size).toBe(missedCalls.length)
  })
})
