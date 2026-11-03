import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { Modal } from "@/components/ui/modal"
import { DEFAULT_COLUMNS } from "@/lib/work/board"
import { AddTaskRow } from "../../components/add-task-row"
import { ColumnTile } from "../../components/column-tile"
import { TODAY, task } from "./tile-fixtures"

function renderTile(count: number) {
  const props = {
    onAdd: vi.fn(() => true),
    onToggle: vi.fn(),
    onOpen: vi.fn(),
    onMove: vi.fn(),
    onDelete: vi.fn(),
    onShowAll: vi.fn(),
  }
  const tasks = Array.from({ length: count }, (_, i) => task({ id: i + 1, title: `Việc ${i + 1}`, columnId: 2 }))
  render(<ColumnTile column={DEFAULT_COLUMNS[1]} tasks={tasks} today={TODAY} columns={DEFAULT_COLUMNS} {...props} />)
  return props
}

describe("ColumnTile", () => {
  it("is named after its column and lists its tasks as cards", () => {
    renderTile(2)

    expect(screen.getByRole("region", { name: "Đang làm" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
    expect(screen.queryByRole("button", { name: /Xem tất cả/ })).not.toBeInTheDocument()
  })

  it("shows 6 cards and opens the whole column from Xem tất cả", () => {
    const { onShowAll } = renderTile(8)

    expect(screen.getAllByRole("listitem")).toHaveLength(6)
    fireEvent.click(screen.getByRole("button", { name: "Xem tất cả 8" }))
    expect(onShowAll).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
  })

  it("adds a task straight into the column and keeps the box open for the next one", () => {
    const { onAdd } = renderTile(0)

    expect(screen.getByText("Chưa có việc nào.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: 'Thêm việc vào cột "Đang làm"' }))
    const input = screen.getByLabelText('Tên việc mới ở cột "Đang làm"')
    fireEvent.change(input, { target: { value: "Viết test" } })
    fireEvent.submit(input)

    expect(onAdd).toHaveBeenCalledWith("Viết test")
    expect(input).toHaveValue("")
  })

  it("Esc in the add box closes only the box, not the sheet around it", () => {
    const onOpenChange = vi.fn()
    render(
      <Modal open onOpenChange={onOpenChange} ariaLabel="Đang làm" variant="sheet">
        <AddTaskRow columnTitle="Đang làm" onAdd={vi.fn(() => true)} />
      </Modal>
    )

    fireEvent.click(screen.getByRole("button", { name: 'Thêm việc vào cột "Đang làm"' }))
    fireEvent.keyDown(screen.getByLabelText('Tên việc mới ở cột "Đang làm"'), { key: "Escape" })

    expect(screen.queryByLabelText('Tên việc mới ở cột "Đang làm"')).not.toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
