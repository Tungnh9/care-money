import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { DEFAULT_COLUMNS } from "@/lib/work/board"
import type { WorkTask } from "@/lib/work/types"
import { TaskCard } from "../../components/task-card"

// 2026-10-13 là thứ Ba.
const TODAY = "2026-10-13"

function task(overrides: Partial<WorkTask>): WorkTask {
  return {
    id: 1,
    title: "Review PR",
    dueDate: null,
    priority: "normal",
    columnId: 1,
    done: false,
    doneAt: null,
    createdAt: "2026-10-01",
    ...overrides,
  }
}

function renderCard(item: WorkTask) {
  const props = { onToggle: vi.fn(), onOpen: vi.fn(), onMove: vi.fn(), onDelete: vi.fn() }
  render(
    <ul>
      <TaskCard task={item} today={TODAY} columns={DEFAULT_COLUMNS} {...props} />
    </ul>
  )
  return props
}

describe("TaskCard", () => {
  it("ticks the task done and opens it from its title", () => {
    const { onToggle, onOpen } = renderCard(task({}))

    fireEvent.click(screen.getByRole("checkbox", { name: 'Đánh dấu xong "Review PR"' }))
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))

    fireEvent.click(screen.getByRole("button", { name: "Review PR" }))
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it("shows how late it is and a flag for high priority, a down arrow for low", () => {
    renderCard(task({ dueDate: "2026-10-11", priority: "high" }))
    expect(screen.getByText("Trễ 2 ngày")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Ưu tiên cao" })).toBeInTheDocument()
  })

  it("marks low priority quietly and shows nothing for normal", () => {
    renderCard(task({ id: 2, title: "Thấp", priority: "low" }))
    expect(screen.getByRole("img", { name: "Ưu tiên thấp" })).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: "Ưu tiên cao" })).not.toBeInTheDocument()
  })

  it("moves the task to another column from its menu, and ignores picking its own column", async () => {
    const { onMove } = renderCard(task({}))

    fireEvent.click(screen.getByRole("button", { name: 'Thao tác với "Review PR"' }))
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Bắt đầu" }))
    expect(onMove).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: 'Thao tác với "Review PR"' }))
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Đang làm" }))
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 2)
  })

  it("edits or deletes the task from its menu", async () => {
    const { onOpen, onDelete } = renderCard(task({}))

    fireEvent.click(screen.getByRole("button", { name: 'Thao tác với "Review PR"' }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Sửa" }))
    expect(onOpen).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: 'Thao tác với "Review PR"' }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Xoá" }))
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })

  it("shows when a done task was finished instead of its due date, and offers to undo it", () => {
    const { onToggle } = renderCard(task({ dueDate: "2026-10-01", done: true, doneAt: "2026-10-09", columnId: 3 }))

    expect(screen.getByText("xong 09/10")).toBeInTheDocument()
    expect(screen.queryByText(/Trễ/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("checkbox", { name: 'Bỏ đánh dấu xong "Review PR"' }))
    expect(onToggle).toHaveBeenCalled()
  })
})
