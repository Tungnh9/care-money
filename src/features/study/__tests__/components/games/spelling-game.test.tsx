import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

import { SpellingGame } from "../../../components/games/spelling-game"
import type { VocabEntry } from "@/lib/study/types"

vi.mock("@/lib/speak", () => ({ speakWord: vi.fn() }))

import { speakWord } from "@/lib/speak"

function vocab(id: string): VocabEntry {
  return { id, word: `word${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => vocab(`${i}`))

function typingInput(): HTMLInputElement {
  return screen.getByRole("textbox", { name: "Gõ từ đang rơi" }) as HTMLInputElement
}

// Mỗi lần gõ (kể cả bàn phím ảo của điện thoại) tới game dưới dạng 1 sự kiện change mang TOÀN BỘ giá
// trị mới của ô. Ô là controlled nên sau mỗi lần, input.value chính là chữ game đã nhận.
function typeChar(input: HTMLInputElement, key: string) {
  fireEvent.change(input, { target: { value: input.value + key } })
}

function typeWord(input: HTMLInputElement, word: string) {
  for (const ch of word) typeChar(input, ch)
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

  it("takes typing through a real text box, focused on start, with phone auto-capitalise and auto-correct off", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    const input = typingInput()
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute("autocomplete", "off")
    expect(input).toHaveAttribute("autocapitalize", "off")
    expect(input).toHaveAttribute("autocorrect", "off")
    expect(input).toHaveAttribute("spellcheck", "false")
  })

  it("focuses the text box again when the play area is tapped, which is what opens a phone's keyboard", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)
    const input = typingInput()
    input.blur()
    expect(input).not.toHaveFocus()

    fireEvent.click(screen.getByTestId("spelling-area"))

    expect(input).toHaveFocus()
  })

  it("destroys a word when typed correctly, speaks it aloud, and advances the resolved count", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const word = screen.getAllByTestId("falling-word")[0].textContent!

    typeWord(typingInput(), word)

    expect(screen.queryByText(word)).not.toBeInTheDocument()
    expect(speakWord).toHaveBeenCalledWith(word)
    expect(screen.getByText("Từ 1/10", { exact: false })).toBeInTheDocument()
    expect(typingInput()).toHaveValue("")
  })

  it("destroys a word entered all at once, e.g. picked from the phone keyboard's suggestion bar", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const word = screen.getAllByTestId("falling-word")[0].textContent!
    fireEvent.change(typingInput(), { target: { value: word } })

    expect(screen.queryByText(word)).not.toBeInTheDocument()
    expect(screen.getByText("Từ 1/10", { exact: false })).toBeInTheDocument()
  })

  it("ignores a keystroke that doesn't match any falling word's prefix", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    typeChar(typingInput(), "z") // không từ mẫu "wordN" nào bắt đầu bằng z

    expect(typingInput()).toHaveValue("")
  })

  it("removes the last typed character when it is deleted from the text box", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const input = typingInput()
    typeChar(input, "w")
    typeChar(input, "o")
    expect(input).toHaveValue("wo")

    fireEvent.change(input, { target: { value: "w" } }) // Backspace
    expect(input).toHaveValue("w")
  })

  it("lower-cases input, ignores a wrong letter after a partial word and allows deleting", () => {
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const input = typingInput()
    fireEvent.change(input, { target: { value: "W" } }) // chữ hoa (vd. bật Caps Lock) vẫn tính là chữ thường
    expect(input).toHaveValue("w")

    fireEvent.change(input, { target: { value: "wo" } })
    expect(input).toHaveValue("wo")

    fireEvent.change(input, { target: { value: "woz" } }) // sai chữ sau phần đã gõ — bị bỏ qua
    expect(input).toHaveValue("wo")

    fireEvent.change(input, { target: { value: "" } }) // xoá hết
    expect(input).toHaveValue("")
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

    const input = typingInput()
    // Gõ đúng từng từ ngay khi nó vừa xuất hiện, không để rơi hết mạng nào — chạy tới khi cả 10
    // từ đều được gõ xong.
    for (let i = 0; i < 10; i++) {
      act(() => {
        vi.advanceTimersByTime(2300) // > SPAWN_GAP_MS, đủ để từ tiếp theo xuất hiện
      })
      const words = screen.queryAllByTestId("falling-word")
      if (words.length) {
        typeWord(input, words[0].textContent!)
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
    const wordText = screen.getAllByTestId("falling-word")[0].textContent!
    const entry = VOCAB.find((v) => v.word === wordText)!

    typeWord(typingInput(), wordText)

    expect(onWordReviewed).toHaveBeenCalledWith(entry.id, true)
  })

  it("reports onWordReviewed(id, false) for a word that falls for the full duration untyped, once the player has typed something", () => {
    const onWordReviewed = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} onWordReviewed={onWordReviewed} />)

    act(() => {
      vi.advanceTimersByTime(100)
    })
    const firstWordText = screen.getAllByTestId("falling-word")[0].textContent!
    const firstEntry = VOCAB.find((v) => v.word === firstWordText)!
    typeChar(typingInput(), "z") // 1 lần gõ (sai, bị bỏ qua) — đủ cho thấy bàn phím đưa được chữ vào game

    act(() => {
      vi.advanceTimersByTime(15000) // FALL_DURATION_MS — để rơi hết mà không gõ đúng
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
    typeChar(typingInput(), "z") // đã gõ ít nhất 1 lần — từ rơi hết giờ mới được chấm "Quên"

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

  it("does not grade missed words 'Quên' while nothing has been typed yet (regression: on phones no keystroke ever reached the game and every falling word was graded 'Quên')", () => {
    const onWordReviewed = vi.fn()
    const onFinish = vi.fn()
    render(<SpellingGame vocab={VOCAB} onFinish={onFinish} onWordReviewed={onWordReviewed} />)

    act(() => {
      vi.advanceTimersByTime(80_000)
    })

    // Ván vẫn mất mạng và kết thúc như thường — chỉ lịch ôn SRS là không bị kéo lùi.
    expect(screen.getAllByTestId("heart-empty")).toHaveLength(5)
    expect(onFinish).toHaveBeenCalledWith(0, 10)
    expect(onWordReviewed).not.toHaveBeenCalled()
  })

  it("keeps a falling word inside the play area even when it spawns at the left edge", () => {
    // xPercent = 8 + 0 × 84 = 8 — sát mép trái nhất có thể. Chỉ khoá Math.random lúc render đầu (nơi
    // duy nhất rút xPercent, qua lazy initializer của useState), trả lại ngay sau đó.
    const random = vi.spyOn(Math, "random").mockReturnValue(0)
    render(<SpellingGame vocab={VOCAB} onFinish={vi.fn()} />)
    random.mockRestore()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    const word = screen.getAllByTestId("falling-word")[0]
    // Lùi lại 8% bề rộng của chính từ (không phải 50% như căn giữa): mép trái từ = 8% × (khu chơi − từ) ≥ 0.
    expect(word.style.left).toBe("8%")
    expect(word.style.transform).toBe("translateX(-8%)")
    expect(word).not.toHaveClass("-translate-x-1/2")
    // Hộp ôm đúng 1 dòng chữ nhưng không bao giờ rộng hơn khu chơi.
    expect(word).toHaveClass("w-max", "max-w-full")
  })
})
