import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { JournalEntriesCard } from "../../components/journal-entries-card"
import type { JournalEntry } from "@/lib/journal/types"

const SHORT_ENTRY: JournalEntry = {
  id: new Date(2026, 7, 10, 9, 0).getTime(),
  text: "Một ngày bình thường.",
  time: "09:00",
  date: "10/08",
  words: 3,
  mood: null,
}

const LONG_TEXT = Array.from({ length: 30 }, () => "Xin chào.").join(" ") // > 180 ký tự

const LONG_ENTRY: JournalEntry = {
  id: new Date(2026, 7, 11, 20, 0).getTime(),
  text: LONG_TEXT,
  time: "20:00",
  date: "11/08",
  words: 60,
  mood: { emoji: "😌", label: "Bình yên", tint: "#E7F6EF", score: 4 },
}

describe("JournalEntriesCard", () => {
  beforeEach(() => {
    // Ngày hiển thị so năm của bài với năm hiện tại — ghim "hôm nay" vào 30/09/2026 cho mọi test.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the empty-state mascot when there are no entries", () => {
    render(<JournalEntriesCard entries={[]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("Chưa có bài nào")).toBeInTheDocument()
  })

  it("renders each entry's date/time, word count and full text when short enough", () => {
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("10/08 · 09:00 · 3 từ")).toBeInTheDocument()
    expect(screen.getByText("Một ngày bình thường.")).toBeInTheDocument()
    expect(screen.queryByText("Xem thêm")).not.toBeInTheDocument()
  })

  it("truncates long entries and expands/collapses them on click", () => {
    render(<JournalEntriesCard entries={[LONG_ENTRY]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText(`${LONG_TEXT.slice(0, 180).trimEnd()}…`)).toBeInTheDocument()
    expect(screen.queryByText(LONG_TEXT)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))

    expect(screen.getByText(LONG_TEXT)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Thu gọn" }))

    expect(screen.getByText(`${LONG_TEXT.slice(0, 180).trimEnd()}…`)).toBeInTheDocument()
  })

  it("expanding one entry does not affect another entry's truncation state", () => {
    const secondLong: JournalEntry = { ...LONG_ENTRY, id: 3, date: "12/08" }
    render(
      <JournalEntriesCard entries={[LONG_ENTRY, secondLong]} onDelete={vi.fn()} onEdit={vi.fn()} />
    )

    const expandButtons = screen.getAllByRole("button", { name: "Xem thêm" })
    fireEvent.click(expandButtons[0])

    expect(screen.getAllByRole("button", { name: "Xem thêm" })).toHaveLength(1)
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument()
  })

  it("calls onEdit with the matching entry when its edit button is clicked", () => {
    const onEdit = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={vi.fn()} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole("button", { name: "Sửa bài 10/08 09:00" }))

    expect(onEdit).toHaveBeenCalledWith(SHORT_ENTRY)
  })

  it("asks for confirmation, naming the entry's time and date, instead of deleting on the first tap", () => {
    const onDelete = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={onDelete} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 10/08 09:00" }))

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByText("Xoá bài nhật ký?")).toBeInTheDocument()
    const when = screen.getByText("09:00 ngày 10/08", { selector: "strong" })
    expect(when.closest("p")).toHaveTextContent("Xoá bài viết lúc 09:00 ngày 10/08 sẽ không thể hoàn tác.")
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("calls onDelete with the entry's id only after Xoá is confirmed", () => {
    const onDelete = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={onDelete} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 10/08 09:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onDelete).toHaveBeenCalledWith(SHORT_ENTRY.id)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("keeps the entry when the confirmation is cancelled", () => {
    const onDelete = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={onDelete} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài 10/08 09:00" }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("names each delete button after its entry's date and time, so entries of the same day are told apart", () => {
    const evening: JournalEntry = { ...SHORT_ENTRY, id: new Date(2026, 7, 10, 21, 30).getTime(), time: "21:30" }
    render(<JournalEntriesCard entries={[evening, SHORT_ENTRY]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Xoá bài 10/08 21:30" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xoá bài 10/08 09:00" })).toBeInTheDocument()
  })

  it("flashes only the entry matching highlightEntryId, not other entries", () => {
    const other: JournalEntry = { ...SHORT_ENTRY, id: 4, date: "12/08" }
    render(
      <JournalEntriesCard
        entries={[SHORT_ENTRY, other]}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        highlightEntryId={SHORT_ENTRY.id}
        highlightNonce={1}
      />
    )

    expect(document.getElementById(`journal-entry-${SHORT_ENTRY.id}`)).toHaveClass("ob-highlight-flash")
    expect(document.getElementById("journal-entry-4")).not.toHaveClass("ob-highlight-flash")
  })

  it("measures the preview on the decoded text, so HTML escapes don't make a short entry look long", () => {
    // 40 lần "x&amp;" = 240 ký tự HTML nhưng chỉ 80 ký tự chữ thật — dưới ngưỡng 180, không cắt.
    const entry: JournalEntry = { ...SHORT_ENTRY, text: "x&amp;".repeat(40) }
    render(<JournalEntriesCard entries={[entry]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.queryByRole("button", { name: "Xem thêm" })).not.toBeInTheDocument()
    expect(screen.getByText("x&".repeat(40))).toBeInTheDocument()
  })

  it("keeps line breaks and decoded characters in the collapsed preview of a long entry", () => {
    const html = Array.from({ length: 10 }, () => "<div>Xin chào &amp; tạm biệt.</div>").join("")
    const plain = Array.from({ length: 10 }, () => "Xin chào & tạm biệt.").join("\n") // 209 ký tự
    render(<JournalEntriesCard entries={[{ ...LONG_ENTRY, text: html }]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    const preview = screen.getByText(
      (_, element) => element?.tagName === "P" && element.textContent === `${plain.slice(0, 180)}…`
    )
    expect(preview).toBeInTheDocument()
  })

  it("ends the collapsed preview with the ellipsis on the same line as the last text", () => {
    const text = `<div>${"x".repeat(179)}</div><div>${"y".repeat(50)}</div>`
    render(<JournalEntriesCard entries={[{ ...LONG_ENTRY, text }]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(
      screen.getByText((_, element) => element?.tagName === "P" && element.textContent === `${"x".repeat(179)}…`)
    ).toBeInTheDocument()
  })

  it("adds the year to the date of an entry written in another year, in the list and in the edit button's name", () => {
    const lastYear: JournalEntry = { ...SHORT_ENTRY, id: new Date(2025, 7, 10, 9, 0).getTime() }
    render(<JournalEntriesCard entries={[SHORT_ENTRY, lastYear]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("10/08/2025 · 09:00 · 3 từ")).toBeInTheDocument()
    expect(screen.getByText("10/08 · 09:00 · 3 từ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sửa bài 10/08/2025 09:00" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sửa bài 10/08 09:00" })).toBeInTheDocument()
  })
})
