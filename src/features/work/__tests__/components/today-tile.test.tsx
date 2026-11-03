import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { TodayTile } from "../../components/today-tile"
import { TODAY, task } from "./tile-fixtures"

describe("TodayTile", () => {
  it("counts overdue and due-today tasks, lists overdue first, and shows today's progress", () => {
    const tasks = [
      task({ id: 1, title: "Duyệt bài", dueDate: TODAY, priority: "high" }),
      task({ id: 2, title: "Hợp đồng", dueDate: "2026-10-10" }),
      task({ id: 3, title: "Xong rồi", done: true, doneAt: TODAY, columnId: 3 }),
    ]
    render(<TodayTile tasks={tasks} today={TODAY} onToggle={vi.fn()} onOpen={vi.fn()} />)

    const tile = screen.getByRole("region", { name: /Hôm nay/ })
    expect(within(tile).getByText("2")).toBeInTheDocument()
    expect(within(tile).getByText("1 trễ hạn")).toBeInTheDocument()
    expect(within(tile).getByText("1 đến hạn hôm nay")).toBeInTheDocument()
    expect(within(tile).getByText("1/3 xong hôm nay")).toBeInTheDocument()
    expect(
      within(tile)
        .getAllByRole("listitem")
        .map((li) => li.textContent)
    ).toEqual([expect.stringContaining("Hợp đồng"), expect.stringContaining("Duyệt bài")])
    expect(within(tile).getByText("Trễ 3 ngày")).toBeInTheDocument()
  })

  it("ticks a task done and opens one from its title", () => {
    const onToggle = vi.fn()
    const onOpen = vi.fn()
    render(
      <TodayTile
        tasks={[task({ id: 1, title: "Duyệt bài", dueDate: TODAY })]}
        today={TODAY}
        onToggle={onToggle}
        onOpen={onOpen}
      />
    )

    fireEvent.click(screen.getByRole("checkbox", { name: 'Đánh dấu xong "Duyệt bài"' }))
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
    fireEvent.click(screen.getByRole("button", { name: "Duyệt bài" }))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it("shows 6 tasks and folds the rest behind a button", () => {
    const tasks = Array.from({ length: 8 }, (_, i) => task({ id: i + 1, dueDate: TODAY }))
    render(<TodayTile tasks={tasks} today={TODAY} onToggle={vi.fn()} onOpen={vi.fn()} />)

    expect(screen.getAllByRole("listitem")).toHaveLength(6)
    fireEvent.click(screen.getByRole("button", { name: "Xem thêm 2 việc" }))
    expect(screen.getAllByRole("listitem")).toHaveLength(8)
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument()
  })

  it("says so when nothing is late or due today", () => {
    render(
      <TodayTile tasks={[task({ id: 1, dueDate: "2026-10-20" })]} today={TODAY} onToggle={vi.fn()} onOpen={vi.fn()} />
    )

    expect(screen.getByText("Không có việc trễ hay đến hạn hôm nay.")).toBeInTheDocument()
  })
})
