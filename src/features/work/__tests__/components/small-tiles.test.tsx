import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { DEFAULT_COLUMNS } from "@/lib/work/board"
import { DoneTile } from "../../components/done-tile"
import { UpcomingTile } from "../../components/upcoming-tile"
import { WeekTile } from "../../components/week-tile"
import { TODAY, task } from "./tile-fixtures"

describe("WeekTile", () => {
  it("counts the tasks finished this week and opens the weekly report", () => {
    const onOpenReport = vi.fn()
    const tasks = [
      task({ id: 1, done: true, doneAt: "2026-10-12", columnId: 3 }),
      task({ id: 2, done: true, doneAt: TODAY, columnId: 3 }),
      task({ id: 3, done: true, doneAt: "2026-10-09", columnId: 3 }),
    ]
    render(
      <WeekTile state={{ columns: DEFAULT_COLUMNS, tasks, standups: [] }} today={TODAY} onOpenReport={onOpenReport} />
    )

    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("việc xong")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Báo cáo tuần" }))
    expect(onOpenReport).toHaveBeenCalled()
  })
})

describe("UpcomingTile", () => {
  it("lists up to 4 tasks due in the next 7 days and counts the rest", () => {
    const onOpen = vi.fn()
    const tasks = [14, 15, 16, 17, 18].map((day, i) =>
      task({ id: i + 1, title: `Ngày ${day}`, dueDate: `2026-10-${day}` })
    )
    render(<UpcomingTile tasks={tasks} today={TODAY} onOpen={onOpen} />)

    expect(screen.getAllByRole("listitem")).toHaveLength(4)
    expect(screen.getByText("và 1 việc nữa")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Ngày 14" }))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it("says so when nothing is due soon", () => {
    render(<UpcomingTile tasks={[]} today={TODAY} onOpen={vi.fn()} />)
    expect(screen.getByText("Không có việc nào trong 7 ngày tới.")).toBeInTheDocument()
  })
})

describe("DoneTile", () => {
  it("shows the 5 latest finished tasks, opens them all, and unticks one", () => {
    const onToggle = vi.fn()
    const onShowAll = vi.fn()
    const tasks = Array.from({ length: 7 }, (_, i) =>
      task({ id: i + 1, title: `Xong ${i + 1}`, done: true, doneAt: `2026-10-0${i + 1}`, columnId: 3 })
    )
    render(
      <DoneTile column={DEFAULT_COLUMNS[2]} tasks={tasks} today={TODAY} onToggle={onToggle} onShowAll={onShowAll} />
    )

    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringContaining("Xong 7"),
      expect.stringContaining("Xong 6"),
      expect.stringContaining("Xong 5"),
      expect.stringContaining("Xong 4"),
      expect.stringContaining("Xong 3"),
    ])
    fireEvent.click(screen.getByRole("button", { name: "Tất cả 7" }))
    expect(onShowAll).toHaveBeenCalled()
    fireEvent.click(screen.getByRole("checkbox", { name: 'Bỏ đánh dấu xong "Xong 7"' }))
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
  })
})
