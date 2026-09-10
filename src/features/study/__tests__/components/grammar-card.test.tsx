import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GrammarHighlightCard, GrammarListCard } from "../../components/grammar-card"
import type { GrammarEntry, VocabEntry } from "../../types"

const WITH_STRUCTURE: GrammarEntry = {
  id: "g-0001",
  title: "Hiện tại đơn — thói quen",
  explanation: "Diễn tả thói quen, sự thật hiển nhiên.",
  structure: "S + V(s/es)",
  addedAt: "2026-08-14",
}

const WITHOUT_STRUCTURE: GrammarEntry = {
  id: "g-0002",
  title: "Câu hỏi Yes/No",
  explanation: "Hỏi và trả lời dạng Yes/No.",
  addedAt: "2026-08-14",
}

const WITH_EXAMPLE: GrammarEntry = {
  id: "g-0003",
  title: "Countable nouns",
  explanation: "Danh từ đếm được.",
  examples: ["She wants to buy a skirt."],
  addedAt: "2026-08-14",
}

const WITH_TRANSLATION: GrammarEntry = {
  id: "g-0004",
  title: "Countable nouns",
  explanation: "Danh từ đếm được.",
  examples: ["She wants to buy a skirt.", "This song has no title."],
  translations: ["Cô ấy muốn mua một chiếc váy."],
  addedAt: "2026-08-14",
}

const VOCAB: VocabEntry[] = [{ id: "v-0030", word: "skirt", meaning: "váy", addedAt: "2026-08-11" }]

describe("GrammarHighlightCard", () => {
  it("shows the structure badge next to the title when the entry has one", () => {
    render(<GrammarHighlightCard entry={WITH_STRUCTURE} vocab={[]} />)

    expect(screen.getByText("S + V(s/es)")).toBeInTheDocument()
  })

  it("renders fine with no badge when the entry has no structure field", () => {
    render(<GrammarHighlightCard entry={WITHOUT_STRUCTURE} vocab={[]} />)

    expect(screen.getByText(WITHOUT_STRUCTURE.title)).toBeInTheDocument()
    expect(screen.queryByText("S + V(s/es)")).not.toBeInTheDocument()
  })

  it("highlights a vocab word inside an example sentence", () => {
    render(<GrammarHighlightCard entry={WITH_EXAMPLE} vocab={VOCAB} />)

    expect(screen.getByText("skirt", { selector: "mark" })).toBeInTheDocument()
  })
})

describe("GrammarListCard", () => {
  it("shows a structure badge next to each entry that has one, and none for entries without", () => {
    render(<GrammarListCard entries={[WITH_STRUCTURE, WITHOUT_STRUCTURE]} vocab={[]} />)

    expect(screen.getByText(WITH_STRUCTURE.title)).toBeInTheDocument()
    expect(screen.getByText("S + V(s/es)")).toBeInTheDocument()
    expect(screen.getByText(WITHOUT_STRUCTURE.title)).toBeInTheDocument()
  })

  it("highlights a vocab word inside an example sentence", () => {
    render(<GrammarListCard entries={[WITH_EXAMPLE]} vocab={VOCAB} />)

    expect(screen.getByText("skirt", { selector: "mark" })).toBeInTheDocument()
  })

  it("shows the Vietnamese translation only after clicking the translate icon", () => {
    render(<GrammarListCard entries={[WITH_TRANSLATION]} vocab={[]} />)

    expect(screen.queryByText("Cô ấy muốn mua một chiếc váy.")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Dịch sang tiếng Việt" }))

    expect(screen.getByText("Cô ấy muốn mua một chiếc váy.")).toBeInTheDocument()
  })

  it("hides the translation again after clicking the icon a second time", () => {
    render(<GrammarListCard entries={[WITH_TRANSLATION]} vocab={[]} />)

    const button = screen.getByRole("button", { name: "Dịch sang tiếng Việt" })
    fireEvent.click(button)
    fireEvent.click(screen.getByRole("button", { name: "Ẩn bản dịch" }))

    expect(screen.queryByText("Cô ấy muốn mua một chiếc váy.")).not.toBeInTheDocument()
  })

  it("does not show a translate icon for a sentence with no matching translation", () => {
    render(<GrammarListCard entries={[WITH_TRANSLATION]} vocab={[]} />)

    expect(screen.getByText("This song has no title.")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Dịch sang tiếng Việt" })).toHaveLength(1)
  })

  it("alternates the 1st, 3rd, 5th... row background from the 2nd, 4th, 6th...", () => {
    const { container } = render(
      <GrammarListCard entries={[WITH_STRUCTURE, WITHOUT_STRUCTURE, WITH_EXAMPLE]} vocab={[]} />
    )

    const rows = container.querySelectorAll("section > div.border-t")
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveClass("bg-[var(--ob-color-reward)]")
    expect(rows[1]).not.toHaveClass("bg-[var(--ob-color-reward)]")
    expect(rows[2]).toHaveClass("bg-[var(--ob-color-reward)]")
  })
})
