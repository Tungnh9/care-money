import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { StudyView } from "../../components/study-view"
import { dayKey } from "@/lib/date"
import { pickDaily } from "../../daily-pick"
import type { GrammarEntry, VocabEntry } from "../../types"

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => ({
  id: `v-${i}`,
  word: `word-${i}`,
  pos: "n.",
  phonetic: `/word-${i}/`,
  meaning: `nghĩa ${i}`,
  addedAt: "2026-08-14",
}))

const GRAMMAR: GrammarEntry[] = Array.from({ length: 5 }, (_, i) => ({
  id: `g-${i}`,
  title: `Cấu trúc ${i}`,
  explanation: `Giải thích ${i}`,
  examples: [`Ví dụ ${i}.`],
  addedAt: "2026-08-14",
}))

describe("StudyView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows up to 5 due words to review and 1 grammar highlight on the Hôm nay tab", async () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    const key = dayKey()
    const dailyGrammar = pickDaily(GRAMMAR, 1, key, "grammar")[0]

    // Toàn bộ 10 từ đều "mới" (chưa từng ôn) nên đều tới hạn ngay hôm đầu tiên — cap hiển thị 5,
    // thứ tự ổn định giữ đúng thứ tự gốc trong VOCAB khi cùng hạn ôn (sort ổn định, cùng dueAt).
    for (const word of VOCAB.slice(0, 5)) {
      expect(screen.getByText(word.word)).toBeInTheDocument()
    }
    expect(screen.getByText(dailyGrammar.title)).toBeInTheDocument()
    expect(screen.getByText("0/3 nhiệm vụ · 10 từ cần ôn · ngày 14/08")).toBeInTheDocument()
  })

  it("marking a word as learned on the Từ vựng tab updates the progress card", async () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Từ vựng" }))
    const markButtons = screen.getAllByRole("button", { name: "Đánh dấu đã học" })
    fireEvent.click(markButtons[0])

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Bỏ đánh dấu đã học" })).toHaveLength(1)
    )
    // LearnedProgressCard chỉ nằm ở tab "Hôm nay" — quay lại đó để đọc số liệu đã cập nhật.
    fireEvent.click(screen.getByRole("button", { name: "Hôm nay" }))
    expect(screen.getByText("Thuộc 10% kho từ")).toBeInTheDocument()
  })

  it("ticking a task updates the header count", async () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByText("Ôn 20 từ vựng"))

    await waitFor(() =>
      expect(screen.getByText("1/3 nhiệm vụ · 10 từ cần ôn · ngày 14/08")).toBeInTheDocument()
    )
  })

  it("stagger-animates the Hôm nay boxes in on mount, like the Tài chính page", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    const pomodoroSection = screen.getByText("Pomodoro · tập trung").closest("section") as HTMLElement
    expect(pomodoroSection.parentElement?.parentElement).toHaveClass("ob-card-grid")
  })

  it("lists every vocab word on the Từ vựng tab", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Từ vựng" }))

    expect(screen.getByText("Kho từ vựng giao tiếp · 10 từ")).toBeInTheDocument()
    VOCAB.forEach((v) => expect(screen.getByText(v.word)).toBeInTheDocument())
  })

  it("stagger-animates the Từ vựng tab content in on tab switch", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Từ vựng" }))

    const vocabSection = screen
      .getByText("Kho từ vựng giao tiếp · 10 từ")
      .closest("section") as HTMLElement
    expect(vocabSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("lists every grammar entry on the Ngữ pháp tab", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Ngữ pháp" }))

    expect(screen.getByText("Ngữ pháp tiếng Anh · 5 mục")).toBeInTheDocument()
    GRAMMAR.forEach((g) => expect(screen.getByText(g.title)).toBeInTheDocument())
  })

  it("stagger-animates the Ngữ pháp tab content in on tab switch", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Ngữ pháp" }))

    const grammarSection = screen
      .getByText("Ngữ pháp tiếng Anh · 5 mục")
      .closest("section") as HTMLElement
    expect(grammarSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("renders the game menu when the Trò chơi tab is selected", () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Trò chơi" }))

    expect(screen.getByText("Trắc nghiệm")).toBeInTheDocument()
    expect(screen.getByText("Ghép cặp")).toBeInTheDocument()
    expect(screen.getByText("Gõ từ")).toBeInTheDocument()
  })

  it("grading a due word from Hôm nay keeps its card visible but drops it out of the due count", async () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    expect(screen.getByText("0/3 nhiệm vụ · 10 từ cần ôn · ngày 14/08")).toBeInTheDocument()

    const revealButtons = screen.getAllByRole("button", { name: /Hiện nghĩa/ })
    fireEvent.click(revealButtons[0])
    fireEvent.click(screen.getByRole("button", { name: "Nhớ" }))

    await waitFor(() =>
      expect(screen.getByText("0/3 nhiệm vụ · 9 từ cần ôn · ngày 14/08")).toBeInTheDocument()
    )
    // Thẻ vừa chấm vẫn còn hiển thị (đóng băng theo phiên), không biến mất khỏi lưới.
    expect(screen.getByText(VOCAB[0].word)).toBeInTheDocument()
  })

  it("feeds mini-game results into the SRS schedule via gradeWord", async () => {
    render(<StudyView vocab={VOCAB} grammar={GRAMMAR} />)

    fireEvent.click(screen.getByRole("button", { name: "Trò chơi" }))
    fireEvent.click(screen.getByText("Ghép cặp"))
    const cards = screen.getAllByRole("button").filter((b) => b.hasAttribute("data-vocab-id"))
    const sorted = [...cards].sort((a, b) =>
      (a.getAttribute("data-vocab-id") ?? "").localeCompare(b.getAttribute("data-vocab-id") ?? "")
    )
    fireEvent.click(sorted[0])
    fireEvent.click(sorted[1]) // luôn là 1 cặp giống nhau — chắc chắn ăn cặp, bất kể 6 cặp nào được rút ngẫu nhiên

    fireEvent.click(screen.getByRole("button", { name: "Hôm nay" }))
    await waitFor(() =>
      expect(screen.getByText("0/3 nhiệm vụ · 9 từ cần ôn · ngày 14/08")).toBeInTheDocument()
    )
  })
})
