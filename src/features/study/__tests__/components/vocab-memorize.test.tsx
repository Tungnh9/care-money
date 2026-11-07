import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import type { VocabEntry } from "@/lib/study/types"
import { VocabMemorize } from "../../components/vocab-memorize"

vi.mock("@/lib/speak", () => ({ speakWord: vi.fn() }))
import { speakWord } from "@/lib/speak"

const WORDS: VocabEntry[] = [
  {
    id: "v-1",
    word: "exam",
    meaning: "kỳ thi",
    pos: "n.",
    phonetic: "/ɪɡˈzæm/",
    addedAt: "2026-08-11",
    image: "/a.jpg",
  },
  { id: "v-2", word: "busy (with)", meaning: "bận rộn", addedAt: "2026-08-11", image: "/b.jpg" },
  { id: "v-3", word: "T-shirt", meaning: "áo phông", addedAt: "2026-08-11", image: "/c.jpg" },
]

function input(): HTMLInputElement {
  return screen.getByRole("textbox") as HTMLInputElement
}

function type(text: string) {
  fireEvent.change(input(), { target: { value: text } })
}

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }))
}

describe("VocabMemorize", () => {
  beforeEach(() => {
    vi.mocked(speakWord).mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows the picture and the Vietnamese meaning, not the English word, with the cursor in the answer box", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)

    expect(screen.getByText("kỳ thi")).toBeInTheDocument()
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Ảnh minh hoạ: kỳ thi")
    expect(screen.queryByText("exam")).not.toBeInTheDocument()
    expect(screen.getByText("Từ 1/3 · Đúng 0")).toBeInTheDocument()
    expect(input()).toHaveFocus()
  })

  it("marks a right answer, says the word aloud and counts it, then locks the box", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)

    type("Exam")
    click("Xác nhận")

    expect(screen.getByText("Chính xác!")).toBeInTheDocument()
    expect(screen.getByText("exam")).toBeInTheDocument()
    expect(speakWord).toHaveBeenCalledWith("exam")
    expect(screen.getByText("Từ 1/3 · Đúng 1")).toBeInTheDocument()
    expect(input()).toHaveAttribute("readonly")
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
  })

  it("lets a wrong answer be retyped, and shows the answer on request without counting it", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)

    type("exma")
    click("Xác nhận")
    expect(screen.getByText("Chưa đúng, thử lại nhé")).toBeInTheDocument()
    expect(input()).not.toHaveAttribute("readonly")

    type("exm")
    expect(screen.queryByText("Chưa đúng, thử lại nhé")).not.toBeInTheDocument()
    click("Xác nhận")
    click("Xem đáp án")

    expect(screen.getByText("Đáp án:")).toBeInTheDocument()
    expect(screen.getByText("exam")).toBeInTheDocument()
    expect(screen.getByText("Từ 1/3 · Đúng 0")).toBeInTheDocument()
    expect(speakWord).not.toHaveBeenCalled()
  })

  it("does not check an empty answer", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)

    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
    type("   ")
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
  })

  it("moves between words with Trước and Sau, keeping what was typed for each", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)
    expect(screen.getByRole("button", { name: "Trước" })).toBeDisabled()

    type("exam")
    click("Xác nhận")
    click("Sau")
    expect(screen.getByText("bận rộn")).toBeInTheDocument()
    expect(input()).toHaveValue("")
    expect(input()).toHaveFocus()

    click("Sau")
    expect(screen.getByText("áo phông")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sau" })).toBeDisabled()

    click("Trước")
    click("Trước")
    expect(screen.getByText("kỳ thi")).toBeInTheDocument()
    expect(input()).toHaveValue("exam")
    expect(screen.getByText("Chính xác!")).toBeInTheDocument()
  })

  it("checks with Enter, and goes to the next word on Enter once the word is done", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)

    type("exam")
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(screen.getByText("Chính xác!")).toBeInTheDocument()

    fireEvent.keyDown(input(), { key: "Enter" })
    expect(screen.getByText("bận rộn")).toBeInTheDocument()
  })

  it("accepts the short form of a word with an optional part", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)
    click("Sau")

    type("busy")
    click("Xác nhận")

    expect(screen.getByText("Chính xác!")).toBeInTheDocument()
  })

  it("says the round is over once every word is right or shown, and starts over with Làm lại", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)

    type("exam")
    click("Xác nhận")
    click("Sau")
    type("busy with")
    click("Xác nhận")
    click("Sau")
    type("shirt")
    click("Xác nhận")
    click("Xem đáp án")

    // Nằm trong vùng đọc to: trình đọc màn hình báo xong lượt cùng lúc với kết quả từ cuối.
    expect(within(screen.getByRole("status")).getByText(/Xong cả 3 từ — đúng 2\/3/)).toBeInTheDocument()

    click("Làm lại")
    expect(screen.getByText("kỳ thi")).toBeInTheDocument()
    expect(screen.getByText("Từ 1/3 · Đúng 0")).toBeInTheDocument()
    expect(input()).toHaveValue("")
    expect(screen.queryByText(/Xong cả/)).not.toBeInTheDocument()
  })

  it("says there is nothing to practise when the list is empty", () => {
    render(<VocabMemorize words={[]} pool={[]} />)

    expect(screen.getByText("Chưa có từ nào để ghi nhớ.")).toBeInTheDocument()
  })

  it("accepts a word with the same Vietnamese meaning from the rest of the vocabulary, naming the card's own word", () => {
    const popular: VocabEntry = { id: "v-10", word: "popular", meaning: "nổi tiếng", addedAt: "2026-08-11" }
    const famous: VocabEntry = { id: "v-11", word: "famous", meaning: "nổi tiếng", addedAt: "2026-08-11" }
    render(<VocabMemorize words={[popular]} pool={[popular, famous]} />)

    type("famous")
    click("Xác nhận")

    expect(screen.getByText("Cũng đúng! Từ của thẻ này là")).toBeInTheDocument()
    expect(screen.getByText("popular")).toBeInTheDocument()
    expect(screen.getByText("Từ 1/1 · Đúng 1")).toBeInTheDocument()
    expect(speakWord).toHaveBeenCalledWith("popular")
  })

  it("shows the right or wrong border on the answer box even while it has focus", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)
    expect(input()).toHaveClass("focus:border-[var(--ob-color-focus)]")

    type("exma")
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(input()).toHaveClass("border-[var(--ob-color-expense)]")
    expect(input()).not.toHaveClass("focus:border-[var(--ob-color-focus)]")

    type("exam")
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(input()).toHaveClass("border-[var(--ob-color-income)]")
    expect(input()).not.toHaveClass("focus:border-[var(--ob-color-focus)]")
  })

  it("keeps the cursor in the answer box when a button is pressed, so the phone keyboard stays up", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)
    // Từ thứ 2: cả 3 nút đều bấm được (ở từ đầu "Trước" bị khoá, nút khoá không nhận mousedown).
    click("Sau")
    type("buzy")

    // mousedown bị chặn mặc định → nút không lấy focus khỏi ô nhập.
    for (const name of ["Trước", "Xác nhận", "Sau"]) {
      expect(fireEvent.mouseDown(screen.getByRole("button", { name }))).toBe(false)
    }
    click("Xác nhận")
    expect(fireEvent.mouseDown(screen.getByRole("button", { name: "Xem đáp án" }))).toBe(false)
    expect(input()).toHaveFocus()
  })

  it("reveals a word the learner does not know yet without a guess first, without counting it", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)

    click("Xem đáp án")

    expect(screen.getByText("Đáp án:")).toBeInTheDocument()
    expect(screen.getByText("exam")).toBeInTheDocument()
    expect(screen.getByText("Từ 1/3 · Đúng 0")).toBeInTheDocument()
  })

  it("keeps the Trước and Sau names for screen readers when a narrow card shrinks them to arrows", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)

    for (const name of ["Trước", "Sau"]) {
      expect(within(screen.getByRole("button", { name })).getByText(name)).toHaveClass(
        "sr-only",
        "@min-[270px]:not-sr-only"
      )
    }
  })

  it("keeps Xem đáp án while retyping after a wrong try", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)
    type("exma")
    click("Xác nhận")

    type("ex")

    expect(screen.queryByText("Chưa đúng, thử lại nhé")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xem đáp án" })).toBeInTheDocument()
  })

  it("points back to the words skipped with Sau once on the last word", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)
    click("Sau")
    type("busy")
    click("Xác nhận")
    click("Sau")

    expect(screen.getByText("Còn 2 từ chưa xong.")).toBeInTheDocument()
    click("Làm tiếp")
    expect(screen.getByText("kỳ thi")).toBeInTheDocument()
  })

  it("on Enter after a finished word, jumps to the next word not done yet, wrapping round", () => {
    render(<VocabMemorize words={WORDS} pool={WORDS} />)
    click("Sau")
    click("Sau")
    type("t shirt")
    fireEvent.keyDown(input(), { key: "Enter" })
    fireEvent.keyDown(input(), { key: "Enter" })

    expect(screen.getByText("kỳ thi")).toBeInTheDocument()
  })
})
