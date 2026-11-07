import { useState } from "react"
import { afterEach, describe, it, expect, vi } from "vitest"
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
      memorizing={false}
      onMemorizingChange={vi.fn()}
    />
  )
  return { ...view, onTopicChange, onLevelChange, onToggleLearned }
}

// Giữ chủ đề, cấp và chế độ Ghi nhớ như StudyView — để thấy focus, khung nhìn và bài Ghi nhớ sau khi màn thật sự đổi.
function StatefulBrowser() {
  const [topic, setTopic] = useState<string | null>(null)
  const [level, setLevel] = useState<CefrLevel | null>(null)
  const [memorizing, setMemorizing] = useState(false)
  return (
    <VocabBrowser
      vocab={VOCAB}
      learned={[]}
      onToggleLearned={() => {}}
      topic={topic}
      level={level}
      onTopicChange={setTopic}
      onLevelChange={setLevel}
      memorizing={memorizing}
      onMemorizingChange={setMemorizing}
    />
  )
}

function rectAt(top: number): DOMRect {
  return { top, bottom: top + 200, left: 0, right: 300, width: 300, height: 200, x: 0, y: top, toJSON: () => ({}) }
}

afterEach(() => {
  vi.restoreAllMocks()
})

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
        memorizing={false}
        onMemorizingChange={vi.fn()}
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
        memorizing={false}
        onMemorizingChange={vi.fn()}
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

  it("moves keyboard focus into the opened topic, and back onto that topic's tile when leaving it", () => {
    render(<StatefulBrowser />)

    fireEvent.click(screen.getByRole("button", { name: "Ăn uống" }))
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Tất cả chủ đề" }))

    fireEvent.click(screen.getByRole("button", { name: "Tất cả chủ đề" }))
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Ăn uống" }))
  })

  it("scrolls the opened topic up to the top of the screen only when its title was scrolled out of view", () => {
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView")
    render(<StatefulBrowser />)
    const card = screen.getByText("Chủ đề · 3").closest("section") as HTMLElement

    // Ô ở dưới thấp trên điện thoại: trang đã cuộn, đầu Card nằm khuất phía trên màn hình.
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue(rectAt(-400))
    fireEvent.click(screen.getByRole("button", { name: "Nghề nghiệp" }))
    expect(scroll).toHaveBeenCalledWith({ block: "start" })
    expect(scroll.mock.contexts.at(-1)).toBe(card)

    fireEvent.click(screen.getByRole("button", { name: "Tất cả chủ đề" }))
    scroll.mockClear()
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue(rectAt(120))
    fireEvent.click(screen.getByRole("button", { name: "Ăn uống" }))
    expect(scroll).not.toHaveBeenCalledWith({ block: "start" })
  })

  it("brings the tile of the topic just closed back into view, keeping clear of the app's fixed bars", () => {
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView")
    render(<StatefulBrowser />)

    fireEvent.click(screen.getByRole("button", { name: "Nghề nghiệp" }))
    scroll.mockClear()
    fireEvent.click(screen.getByRole("button", { name: "Tất cả chủ đề" }))

    const tile = screen.getByRole("button", { name: "Nghề nghiệp" })
    expect(scroll).toHaveBeenCalledWith({ block: "nearest" })
    expect(scroll.mock.contexts.at(-1)).toBe(tile)
    // Khoảng chừa cho thanh trên và thanh điều hướng dưới (fixed) của bản điện thoại — "nearest" tôn trọng khoảng này.
    expect(tile).toHaveClass("scroll-mt-[72px]", "scroll-mb-[96px]")
  })

  it("puts the Ghi nhớ button last in a topic's filter row, after the last level chip, and not on the topic grid", () => {
    const { unmount } = renderBrowser({ topic: "jobs" })

    const row = screen.getByRole("group", { name: "Lọc theo cấp độ" }).parentElement as HTMLElement
    const buttons = within(row).getAllByRole("button")
    expect(buttons.map((button) => button.textContent)).toEqual(["Tất cả", "A1 · 1", "B1 · 1", "Ghi nhớ"])
    expect(buttons.at(-1)).toHaveAttribute("aria-pressed", "false")
    unmount()

    renderBrowser({ topic: null })
    expect(screen.queryByRole("button", { name: "Ghi nhớ" })).not.toBeInTheDocument()
  })

  it("swaps the topic's word grid for the memorize drill, and back, with Ghi nhớ", () => {
    render(<StatefulBrowser />)
    fireEvent.click(screen.getByRole("button", { name: "Nghề nghiệp" }))

    fireEvent.click(screen.getByRole("button", { name: "Ghi nhớ" }))
    expect(screen.getByRole("button", { name: "Ghi nhớ" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText("Từ 1/2 · Đúng 0")).toBeInTheDocument()
    expect(screen.getByText("nghĩa v-3")).toBeInTheDocument()
    expect(screen.queryByText("word-v-3")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Ghi nhớ" }))
    expect(screen.getByText("word-v-3")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("drills only the words of the chosen level, starting a new round when the level changes", () => {
    render(<StatefulBrowser />)
    fireEvent.click(screen.getByRole("button", { name: "Nghề nghiệp" }))
    fireEvent.click(screen.getByRole("button", { name: "Ghi nhớ" }))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "word-v-3" } })
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))
    expect(screen.getByText("Từ 1/2 · Đúng 1")).toBeInTheDocument()

    // v-3 vẫn trong danh sách A1, nhưng đổi cấp là lượt mới: không còn kết quả cũ.
    fireEvent.click(screen.getByRole("button", { name: "A1 · 1" }))
    expect(screen.getByText("Từ 1/1 · Đúng 0")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveValue("")

    // Đang ở từ thứ 2 mà danh sách mới chỉ còn 1 từ: lượt mới bắt đầu lại từ từ đầu, không trỏ ra ngoài danh sách.
    fireEvent.click(screen.getByRole("button", { name: "Tất cả" }))
    fireEvent.click(screen.getByRole("button", { name: "Sau" }))
    expect(screen.getByText("nghĩa v-4")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "B1 · 1" }))
    expect(screen.getByText("Từ 1/1 · Đúng 0")).toBeInTheDocument()
    expect(screen.getByText("nghĩa v-4")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ghi nhớ" })).toHaveAttribute("aria-pressed", "true")
  })

  it("leaves the memorize drill when going back to the topics", () => {
    render(<StatefulBrowser />)
    fireEvent.click(screen.getByRole("button", { name: "Nghề nghiệp" }))
    fireEvent.click(screen.getByRole("button", { name: "Ghi nhớ" }))

    fireEvent.click(screen.getByRole("button", { name: "Tất cả chủ đề" }))
    fireEvent.click(screen.getByRole("button", { name: "Ăn uống" }))

    expect(screen.getByRole("button", { name: "Ghi nhớ" })).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByText("word-v-1")).toBeInTheDocument()
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
        memorizing={false}
        onMemorizingChange={vi.fn()}
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
