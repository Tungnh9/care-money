import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import type { JournalEntry } from "@/features/journal/types"
import { JournalSummarySection } from "../../components/journal-summary-section"

const ENTRY: JournalEntry = {
  id: 1,
  text: "Hôm nay mình đã đi bộ",
  time: "09:00",
  date: "10/08",
  words: 5,
  mood: null,
}

describe("JournalSummarySection", () => {
  it("shows the empty-state CTA when there are no entries", () => {
    render(<JournalSummarySection entries={[]} />)

    expect(screen.getByText("Chưa có bài nào cho hôm nay")).toBeInTheDocument()
    expect(screen.getByText("Ba câu là đủ để tuần sau nhìn lại.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Viết nhật ký hôm nay" })).toHaveAttribute("href", "/journal")
  })

  it("shows up to 3 recent entries and a link to write more", () => {
    const entries: JournalEntry[] = [
      ENTRY,
      { ...ENTRY, id: 2, text: "Bài thứ hai" },
      { ...ENTRY, id: 3, text: "Bài thứ ba" },
      { ...ENTRY, id: 4, text: "Bài thứ tư — không nên hiện" },
    ]
    render(<JournalSummarySection entries={entries} />)

    expect(screen.getByText("Hôm nay mình đã đi bộ")).toBeInTheDocument()
    expect(screen.getByText("Bài thứ hai")).toBeInTheDocument()
    expect(screen.getByText("Bài thứ ba")).toBeInTheDocument()
    expect(screen.queryByText("Bài thứ tư — không nên hiện")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Viết thêm một bài" })).toHaveAttribute("href", "/journal")
  })
})
