import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { GrammarHighlightCard, GrammarListCard } from "../../components/grammar-card"
import type { GrammarEntry } from "../../types"

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

describe("GrammarHighlightCard", () => {
  it("shows the structure badge next to the title when the entry has one", () => {
    render(<GrammarHighlightCard entry={WITH_STRUCTURE} />)

    expect(screen.getByText("S + V(s/es)")).toBeInTheDocument()
  })

  it("renders fine with no badge when the entry has no structure field", () => {
    render(<GrammarHighlightCard entry={WITHOUT_STRUCTURE} />)

    expect(screen.getByText(WITHOUT_STRUCTURE.title)).toBeInTheDocument()
    expect(screen.queryByText("S + V(s/es)")).not.toBeInTheDocument()
  })
})

describe("GrammarListCard", () => {
  it("shows a structure badge next to each entry that has one, and none for entries without", () => {
    render(<GrammarListCard entries={[WITH_STRUCTURE, WITHOUT_STRUCTURE]} />)

    expect(screen.getByText(WITH_STRUCTURE.title)).toBeInTheDocument()
    expect(screen.getByText("S + V(s/es)")).toBeInTheDocument()
    expect(screen.getByText(WITHOUT_STRUCTURE.title)).toBeInTheDocument()
  })
})
