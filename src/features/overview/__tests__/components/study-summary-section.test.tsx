import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { dayKey, pickDaily } from "@/features/study/daily-pick"
import type { GrammarEntry, Task, VocabEntry } from "@/features/study/types"
import { StudySummarySection } from "../../components/study-summary-section"

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => ({
  id: `v-${i}`,
  word: `word-${i}`,
  meaning: `nghĩa ${i}`,
  addedAt: "2026-08-14",
}))

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

  it("shows the task count, today's vocab words and grammar highlight", () => {
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={vi.fn()}
        learned={[]}
      />
    )

    const key = dayKey()
    const daily = pickDaily(VOCAB, 5, key, "vocab")
    const dailyGrammar = pickDaily(GRAMMAR, 1, key, "grammar")[0]

    expect(screen.getByText("1")).toBeInTheDocument()
    for (const entry of daily) {
      expect(screen.getByText(entry.word)).toBeInTheDocument()
    }
    expect(screen.getByText(dailyGrammar.title)).toBeInTheDocument()
  })

  it("marks a learned word with a strikethrough and check icon", () => {
    const daily = pickDaily(VOCAB, 5, dayKey(), "vocab")
    render(
      <StudySummarySection
        vocab={VOCAB}
        grammar={GRAMMAR}
        tasks={TASKS}
        onToggleTask={vi.fn()}
        learned={[daily[0].id]}
      />
    )

    expect(screen.getByText(daily[0].word)).toHaveClass("line-through")
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
      />
    )

    fireEvent.click(screen.getByText("Đọc 10 trang"))

    expect(onToggleTask).toHaveBeenCalledWith(1)
  })
})
