import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { DEFAULT_COLUMNS } from "@/lib/work/board"
import { ColumnManager } from "../../components/column-manager"

function renderManager() {
  const props = {
    onOpenChange: vi.fn(),
    onAdd: vi.fn(),
    onRename: vi.fn(),
    onMove: vi.fn(),
    onRemove: vi.fn(),
  }
  render(<ColumnManager open columns={DEFAULT_COLUMNS} taskCounts={new Map([[2, 4]])} {...props} />)
  return props
}

describe("ColumnManager", () => {
  it("lists the columns, marks the last one as the done column, and renames one on blur", () => {
    const { onRename } = renderManager()

    const dialog = screen.getByRole("dialog", { name: "Quản lý cột" })
    expect(within(dialog).getByText("Cột hoàn thành")).toBeInTheDocument()
    expect(within(dialog).getByText("4 việc")).toBeInTheDocument()

    const name = within(dialog).getByLabelText('Tên cột "Đang làm"')
    fireEvent.change(name, { target: { value: "Đang code" } })
    fireEvent.blur(name)
    expect(onRename).toHaveBeenCalledWith(2, "Đang code")
  })

  it("moves a column up or down, but not past either end", () => {
    const { onMove } = renderManager()

    expect(screen.getByRole("button", { name: 'Đưa cột "Bắt đầu" lên' })).toBeDisabled()
    expect(screen.getByRole("button", { name: 'Đưa cột "Hoàn thành" xuống' })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: 'Đưa cột "Đang làm" xuống' }))
    expect(onMove).toHaveBeenCalledWith(2, 1)
  })

  it("asks before deleting a column and says where its tasks go", () => {
    const { onRemove } = renderManager()

    fireEvent.click(screen.getByRole("button", { name: 'Xoá cột "Đang làm"' }))
    const confirm = screen.getByRole("alertdialog", { name: "Xoá cột?" })
    expect(confirm).toHaveTextContent('4 việc trong cột sẽ chuyển sang cột "Bắt đầu".')
    fireEvent.click(within(confirm).getByRole("button", { name: "Xoá cột" }))
    expect(onRemove).toHaveBeenCalledWith(2)
  })

  it("adds a column before the done column", () => {
    const { onAdd } = renderManager()

    fireEvent.change(screen.getByLabelText("Tên cột mới"), { target: { value: "Chờ duyệt" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm cột" }))
    expect(onAdd).toHaveBeenCalledWith("Chờ duyệt")
    expect(screen.getByLabelText("Tên cột mới")).toHaveValue("")
  })
})
