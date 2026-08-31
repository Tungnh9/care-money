import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { JournalEntriesCard } from "../../components/journal-entries-card"
import type { JournalEntry } from "../../types"

const SHORT_ENTRY: JournalEntry = {
  id: 1,
  text: "Một ngày bình thường.",
  time: "09:00",
  date: "10/08",
  words: 3,
  mood: null,
}

const LONG_TEXT = Array.from({ length: 30 }, () => "Xin chào.").join(" ") // > 180 ký tự

const LONG_ENTRY: JournalEntry = {
  id: 2,
  text: LONG_TEXT,
  time: "20:00",
  date: "11/08",
  words: 60,
  mood: { emoji: "😌", label: "Bình yên", tint: "#E7F6EF" },
}

describe("JournalEntriesCard", () => {
  it("renders the empty-state mascot when there are no entries", () => {
    render(<JournalEntriesCard entries={[]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("Chưa có bài nào")).toBeInTheDocument()
  })

  it("renders each entry's date/time, word count and full text when short enough", () => {
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("10/08 · 09:00")).toBeInTheDocument()
    expect(screen.getByText("3 từ")).toBeInTheDocument()
    expect(screen.getByText("Một ngày bình thường.")).toBeInTheDocument()
    expect(screen.queryByText("Xem thêm")).not.toBeInTheDocument()
  })

  it("truncates long entries and expands/collapses them on click", () => {
    render(<JournalEntriesCard entries={[LONG_ENTRY]} onDelete={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText(`${LONG_TEXT.slice(0, 180)}…`)).toBeInTheDocument()
    expect(screen.queryByText(LONG_TEXT)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))

    expect(screen.getByText(LONG_TEXT)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Thu gọn" }))

    expect(screen.getByText(`${LONG_TEXT.slice(0, 180)}…`)).toBeInTheDocument()
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

  it("calls onDelete with the matching entry's id when its delete button is clicked", () => {
    const onDelete = vi.fn()
    render(<JournalEntriesCard entries={[SHORT_ENTRY]} onDelete={onDelete} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá bài" }))

    expect(onDelete).toHaveBeenCalledWith(1)
  })
})
