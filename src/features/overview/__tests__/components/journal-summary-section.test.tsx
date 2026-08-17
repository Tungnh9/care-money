import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import type { JournalEntry } from "@/features/journal/types"
import { BADGE_AT } from "@/lib/constants"
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
  it("shows the empty-state CTA and hides the streak card when there are no entries and streak is off", () => {
    render(<JournalSummarySection entries={[]} streak={0} showStreak={false} />)

    expect(screen.getByText("Chưa có bài nào cho hôm nay. Ba câu là đủ.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Viết nhật ký hôm nay" })).toHaveAttribute("href", "/journal")
    expect(screen.queryByText("Chuỗi ngày")).not.toBeInTheDocument()
  })

  it("shows up to 3 recent entries and a link to write more", () => {
    const entries: JournalEntry[] = [
      ENTRY,
      { ...ENTRY, id: 2, text: "Bài thứ hai" },
      { ...ENTRY, id: 3, text: "Bài thứ ba" },
      { ...ENTRY, id: 4, text: "Bài thứ tư — không nên hiện" },
    ]
    render(<JournalSummarySection entries={entries} streak={1} showStreak={false} />)

    expect(screen.getByText("Hôm nay mình đã đi bộ")).toBeInTheDocument()
    expect(screen.getByText("Bài thứ hai")).toBeInTheDocument()
    expect(screen.getByText("Bài thứ ba")).toBeInTheDocument()
    expect(screen.queryByText("Bài thứ tư — không nên hiện")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Viết thêm một bài" })).toHaveAttribute("href", "/journal")
  })

  it("shows the still-counting message before the badge threshold", () => {
    render(<JournalSummarySection entries={[ENTRY]} streak={5} showStreak />)

    expect(screen.getByText("5")).toBeInTheDocument()
    expect(
      screen.getByText(`Viết nhật ký đủ ${BADGE_AT - 5} ngày nữa để mở huy hiệu`, { exact: false })
    ).toBeInTheDocument()
  })

  it("shows the badge-unlocked message at or past the threshold", () => {
    render(<JournalSummarySection entries={[ENTRY]} streak={BADGE_AT} showStreak />)

    expect(screen.getByText("Bạn đã mở huy hiệu", { exact: false })).toBeInTheDocument()
  })
})
