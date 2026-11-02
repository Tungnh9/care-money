import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import type { CefrLevel } from "@/lib/study/cefr"
import type { VocabEntry } from "@/lib/study/types"
import { VocabBrowser } from "../../components/vocab-browser"

function word(id: string, topic: string, level?: CefrLevel): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa ${id}`, topic, addedAt: "2026-08-11", ...(level ? { level } : {}) }
}

// 3 chủ đề × 2 từ: Nhà cửa (A2, B1), Ăn uống (A1, A2), Nghề nghiệp (A1, B1).
const VOCAB: VocabEntry[] = [
  word("v-1", "food", "A1"),
  word("v-2", "food", "A2"),
  word("v-3", "jobs", "A1"),
  word("v-4", "jobs", "B1"),
  word("v-5", "home", "A2"),
  word("v-6", "home", "B1"),
]

interface Overrides {
  vocab?: VocabEntry[]
  topic?: string | null
  level?: CefrLevel | null
}

function renderBrowser({ vocab = VOCAB, topic = null, level = null }: Overrides = {}) {
  const onTopicChange = vi.fn()
  const onLevelChange = vi.fn()
  const onToggleLearned = vi.fn()
  const view = render(
    <VocabBrowser
      vocab={vocab}
      learned={["v-1"]}
      onToggleLearned={onToggleLearned}
      topic={topic}
      level={level}
      onTopicChange={onTopicChange}
      onLevelChange={onLevelChange}
    />
  )
  return { ...view, onTopicChange, onLevelChange, onToggleLearned }
}

describe("VocabBrowser", () => {
  it("lists the topics with their word count and learned progress", () => {
    renderBrowser()

    expect(screen.getByText("Chủ đề · 3")).toBeInTheDocument()
    expect(screen.getByText("Đã học 1/6")).toBeInTheDocument()
    const tiles = screen.getAllByRole("button", { name: /^(Nhà cửa|Ăn uống|Nghề nghiệp)$/ })
    expect(tiles.map((tile) => tile.getAttribute("aria-label"))).toEqual(["Nhà cửa", "Ăn uống", "Nghề nghiệp"])
    const food = within(screen.getByRole("button", { name: "Ăn uống" }))
    expect(food.getByText("2 từ")).toBeInTheDocument()
    expect(food.getByText("Đã học 1/2")).toBeInTheDocument()
  })

  it("opens a topic and shows its words grouped by level, then goes back", () => {
    const { onTopicChange, rerender } = renderBrowser()

    fireEvent.click(screen.getByRole("button", { name: "Ăn uống" }))
    expect(onTopicChange).toHaveBeenCalledWith("food")

    rerender(
      <VocabBrowser
        vocab={VOCAB}
        learned={["v-1"]}
        onToggleLearned={vi.fn()}
        topic="food"
        level={null}
        onTopicChange={onTopicChange}
        onLevelChange={vi.fn()}
      />
    )
    expect(screen.getByText("Ăn uống · 2 từ")).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "A1 · 1 từ",
      "A2 · 1 từ",
    ])
    expect(screen.getByText("word-v-1")).toBeInTheDocument()
    expect(screen.queryByText("word-v-3")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Tất cả chủ đề" }))
    expect(onTopicChange).toHaveBeenLastCalledWith(null)
  })

  it("puts a topic's words without a level last, under Chưa xếp cấp", () => {
    renderBrowser({ vocab: [word("v-1", "food", "A1"), word("v-9", "food")], topic: "food" })

    expect(screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual([
      "A1 · 1 từ",
      "Chưa xếp cấp · 1 từ",
    ])
  })

  it("filters by level from the chips, and the topic counts follow", () => {
    const { onLevelChange, rerender } = renderBrowser()

    const chips = within(screen.getByRole("group", { name: "Lọc theo cấp độ" }))
    expect(chips.getAllByRole("button").map((chip) => chip.textContent)).toEqual([
      "Tất cả",
      "A1 · 2",
      "A2 · 2",
      "B1 · 2",
    ])
    expect(chips.getByRole("button", { name: "Tất cả" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("A1–A2: cơ bản · B1–B2: trung cấp · C1–C2: nâng cao")).toBeInTheDocument()
    fireEvent.click(chips.getByRole("button", { name: "A1 · 2" }))
    expect(onLevelChange).toHaveBeenCalledWith("A1")

    rerender(
      <VocabBrowser
        vocab={VOCAB}
        learned={["v-1"]}
        onToggleLearned={vi.fn()}
        topic={null}
        level="A1"
        onTopicChange={vi.fn()}
        onLevelChange={onLevelChange}
      />
    )
    expect(screen.getByText("Chủ đề · 2")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Nhà cửa" })).not.toBeInTheDocument()
    expect(within(screen.getByRole("button", { name: "Nghề nghiệp" })).getByText("1 từ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "A1 · 2" })).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(screen.getByRole("button", { name: "Tất cả" }))
    expect(onLevelChange).toHaveBeenLastCalledWith(null)
  })

  it("says so when no word at all has the chosen level", () => {
    renderBrowser({ level: "C2" })

    expect(screen.getByText("Chưa có từ C2 nào.")).toBeInTheDocument()
  })

  it("says so when the open topic has no word at the chosen level, keeping the chips and the way back", () => {
    renderBrowser({ topic: "home", level: "A1" })

    expect(screen.getByText("Chưa có từ A1 nào trong chủ đề này.")).toBeInTheDocument()
    const chips = within(screen.getByRole("group", { name: "Lọc theo cấp độ" }))
    // Cấp đang lọc vẫn hiện (0 từ) để thấy mình đang lọc gì; các cấp khác đếm trong chủ đề này.
    expect(chips.getAllByRole("button").map((chip) => chip.textContent)).toEqual([
      "Tất cả",
      "A1 · 0",
      "A2 · 1",
      "B1 · 1",
    ])
    expect(chips.getByRole("button", { name: "A1 · 0" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Tất cả chủ đề" })).toBeInTheDocument()
  })

  it("marks a word learned from inside a topic", () => {
    const { onToggleLearned } = renderBrowser({ topic: "jobs" })

    fireEvent.click(screen.getAllByRole("button", { name: "Đánh dấu đã học" })[0])

    expect(onToggleLearned).toHaveBeenCalledWith("v-3")
  })

  it("lays the grids out by the card's own width, not the screen's", () => {
    const { container, rerender } = renderBrowser()
    const gridClasses = () =>
      Array.from(container.querySelectorAll<HTMLElement>("[class*='grid-cols']")).map((el) => el.className)

    const topicGrids = gridClasses()
    expect(topicGrids.length).toBeGreaterThan(0)
    rerender(
      <VocabBrowser
        vocab={VOCAB}
        learned={[]}
        onToggleLearned={vi.fn()}
        topic="food"
        level={null}
        onTopicChange={vi.fn()}
        onLevelChange={vi.fn()}
      />
    )
    const wordGrids = gridClasses()
    expect(wordGrids.length).toBeGreaterThan(0)
    for (const className of [...topicGrids, ...wordGrids]) {
      expect(className).toMatch(/@(md|xl|2xl|4xl):grid-cols/)
      expect(className).not.toMatch(/(^|\s)(sm|md|lg):/)
    }
  })
})
