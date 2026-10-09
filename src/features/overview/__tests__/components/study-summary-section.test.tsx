import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { pickDaily } from "@/lib/study/daily-pick"
import type { GrammarEntry, Task, VocabEntry } from "@/lib/study/types"
import { dayKey } from "@/lib/date"
import { StudySummarySection } from "../../components/study-summary-section"

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => ({
  id: `v-${i}`,
  word: `word-${i}`,
  meaning: `nghĩa ${i}`,
  addedAt: "2026-08-14",
}))
const DUE_WORDS = VOCAB.slice(0, 5)

const GRAMMAR: GrammarEntry[] = Array.from({ length: 5 }, (_, i) => ({
  id: `g-${i}`,
  title: `Cấu trúc ${i}`,
  explanation: `Giải thích ${i}`,
  addedAt: "2026-08-14",
}))

const TASKS: Task[] = [
  { label: "Ôn 20 từ vựng", done: true },
  { label: "Đọc 10 trang", done: false },
]

describe("StudySummarySection", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the task count, due vocab words and grammar highlight", () => {
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={vi.fn()}
        learned={[]}
        dueWords={DUE_WORDS}
      />
    )

    const dailyGrammar = pickDaily(GRAMMAR, 1, dayKey(), "grammar")[0]

    expect(screen.getByText("1")).toBeInTheDocument()
    for (const entry of DUE_WORDS) {
      expect(screen.getByText(entry.word)).toBeInTheDocument()
    }
    expect(screen.getByText(dailyGrammar.title)).toBeInTheDocument()
  })

  it("shows at most 5 due words even when more are due", () => {
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={vi.fn()}
        learned={[]}
        dueWords={VOCAB}
      />
    )

    expect(screen.getAllByRole("button", { name: /^Phát âm "/ })).toHaveLength(5)
  })

  it("shows an empty-state message when nothing is due", () => {
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={vi.fn()}
        learned={[]}
        dueWords={[]}
      />
    )

    expect(screen.getByText("Không có từ nào cần ôn hôm nay 🎉")).toBeInTheDocument()
  })

  it("marks a learned word with a strikethrough and check icon", () => {
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={vi.fn()}
        learned={[DUE_WORDS[0].id]}
        dueWords={DUE_WORDS}
      />
    )

    expect(screen.getByText(DUE_WORDS[0].word)).toHaveClass("line-through")
  })

  it("calls onToggleTask with the task's index when clicked", () => {
    const onToggleTask = vi.fn()
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={onToggleTask}
        learned={[]}
        dueWords={DUE_WORDS}
      />
    )

    fireEvent.click(screen.getByText("Đọc 10 trang"))

    expect(onToggleTask).toHaveBeenCalledWith(1)
  })

  it("fits the due-word grid to the card's own width, so long words wrap inside their tile on a phone", () => {
    const dueWords = [{ ...DUE_WORDS[0], image: "/assets/vocab/v-0010.jpg" }, ...DUE_WORDS.slice(1)]
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={vi.fn()}
        learned={[]}
        dueWords={dueWords}
      />
    )

    const word = screen.getByText(DUE_WORDS[0].word)
    const grid = word.closest(".grid") as HTMLElement
    // 2 cột khi Card hẹp (điện thoại), thêm cột theo bề rộng CARD — không cố định 5 cột.
    expect(grid).toHaveClass("grid-cols-2", "@xs:grid-cols-3", "@md:grid-cols-4", "@xl:grid-cols-5")
    expect(grid).not.toHaveClass("grid-cols-5")
    // @xs:/@md:/@xl: đo container gần nhất — phải là chính Card chứa lưới.
    expect(grid.closest("section")).toHaveClass("[container-type:inline-size]")
    // Từ/nghĩa dài xuống dòng trong ô của nó thay vì đè sang ô bên cạnh.
    expect(word).toHaveClass("wrap-anywhere")
    expect(screen.getByText(DUE_WORDS[0].meaning)).toHaveClass("wrap-anywhere")
    // Ảnh xin đủ nét cho ô ~45% bề rộng màn hình khi lưới 2 cột.
    expect(screen.getByAltText(DUE_WORDS[0].word)).toHaveAttribute("sizes", "(max-width: 639px) 45vw, 140px")
  })

  describe("speak buttons on the due words", () => {
    let speakSpy: ReturnType<typeof vi.fn>
    let cancelSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
      speakSpy = vi.fn()
      cancelSpy = vi.fn()
      vi.stubGlobal("speechSynthesis", { speak: speakSpy, cancel: cancelSpy })
      vi.stubGlobal(
        "SpeechSynthesisUtterance",
        vi.fn().mockImplementation((text: string) => ({ text, lang: "" }))
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it("reads a due word aloud when its speak button is clicked", () => {
      render(
        <StudySummarySection
          vocab={VOCAB}
          grammar={GRAMMAR}
          tasks={TASKS}
          onToggleTask={vi.fn()}
          learned={[]}
          dueWords={DUE_WORDS}
        />
      )

      fireEvent.click(screen.getByRole("button", { name: `Phát âm "${DUE_WORDS[0].word}"` }))

      expect(cancelSpy).toHaveBeenCalled()
      expect(speakSpy).toHaveBeenCalledTimes(1)
      const utterance = speakSpy.mock.calls[0][0]
      expect(utterance.text).toBe(DUE_WORDS[0].word)
      expect(utterance.lang).toBe("en-US")
    })

    it("renders one speak button per due word", () => {
      render(
        <StudySummarySection
          vocab={VOCAB}
          grammar={GRAMMAR}
          tasks={TASKS}
          onToggleTask={vi.fn()}
          learned={[]}
          dueWords={DUE_WORDS}
        />
      )

      for (const entry of DUE_WORDS) {
        expect(screen.getByRole("button", { name: `Phát âm "${entry.word}"` })).toBeInTheDocument()
      }
    })
  })
})
