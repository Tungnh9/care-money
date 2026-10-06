import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
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

  it("shows up to 3 recent entries, with no extra CTA below them (the section header already links to /journal)", () => {
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
    expect(screen.queryByRole("link", { name: "Viết thêm một bài" })).not.toBeInTheDocument()
  })

  it("strips formatting HTML from the preview, showing clean text instead of raw markup", () => {
    render(
      <JournalSummarySection
        entries={[{ ...ENTRY, text: "<b>Hôm nay</b> mình đã <i>đi bộ</i>" }]}
      />
    )

    expect(screen.getByText("Hôm nay mình đã đi bộ")).toBeInTheDocument()
    expect(screen.queryByText(/<b>/)).not.toBeInTheDocument()
  })

  it("shows readable preview text — decoded characters, lines separated — not raw HTML escapes", () => {
    render(<JournalSummarySection entries={[{ ...ENTRY, text: "Tom &amp; Jerry<div>Dòng hai&nbsp;nữa</div>" }]} />)

    // getByText gộp "\n" thành dấu cách, đúng như whitespace-nowrap hiển thị trên 1 dòng.
    expect(screen.getByText("Tom & Jerry Dòng hai nữa")).toBeInTheDocument()
  })
})

describe("JournalSummarySection — ngày của bài", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows dd/mm for this year's entries and adds the year for an entry from another year", () => {
    render(
      <JournalSummarySection
        entries={[
          { ...ENTRY, id: new Date(2026, 7, 10, 9, 0).getTime() },
          { ...ENTRY, id: new Date(2025, 7, 10, 9, 0).getTime(), text: "Bài năm ngoái" },
        ]}
      />
    )

    expect(screen.getByText("10/08 · 09:00 · 5 từ")).toBeInTheDocument()
    expect(screen.getByText("10/08/2025 · 09:00 · 5 từ")).toBeInTheDocument()
  })
})
