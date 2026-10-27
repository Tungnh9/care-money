import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { KanbanBoard } from "../../components/kanban-board"
import { DEFAULT_COLUMNS } from "@/lib/work/board"
import type { WorkTask } from "@/lib/work/types"

const TODAY = "2026-10-13"

function task(overrides: Partial<WorkTask> & { id: number }): WorkTask {
  return {
    title: `Việc ${overrides.id}`,
    dueDate: null,
    priority: "normal",
    columnId: 1,
    done: false,
    doneAt: null,
    createdAt: "2026-10-01",
    ...overrides,
  }
}

const TASKS = [
  task({ id: 1, title: "Gửi báo cáo", dueDate: "2026-10-12", priority: "high" }),
  task({ id: 2, title: "Duyệt bài", columnId: 2, dueDate: TODAY }),
  task({ id: 3, title: "Họp tuần", columnId: 3, done: true, doneAt: "2026-10-12", dueDate: "2026-10-10" }),
  task({ id: 4, title: "Viết tài liệu" }),
]

function renderBoard(overrides: Partial<Parameters<typeof KanbanBoard>[0]> = {}) {
  const handlers = {
    onAddTask: vi.fn().mockReturnValue(true),
    onUpdateTask: vi.fn().mockReturnValue(true),
    onMoveTask: vi.fn(),
    onRemoveTask: vi.fn().mockReturnValue(true),
    onAddColumn: vi.fn(),
    onRenameColumn: vi.fn(),
    onMoveColumn: vi.fn(),
    onRemoveColumn: vi.fn(),
  }
  render(<KanbanBoard columns={DEFAULT_COLUMNS} tasks={TASKS} today={TODAY} {...handlers} {...overrides} />)
  return handlers
}

const column = (title: string) => screen.getByRole("region", { name: `Cột ${title}` })

describe("KanbanBoard", () => {
  it("shows each column with its cards in order and a count, and marks the last one as the done column", () => {
    renderBoard()

    const start = column("Bắt đầu")
    expect(
      within(start)
        .getAllByRole("button", { name: /^(Gửi báo cáo|Viết tài liệu)$/ })
        .map((b) => b.textContent)
    ).toEqual(["Gửi báo cáo", "Viết tài liệu"])
    expect(within(start).getByRole("heading", { level: 2 })).toHaveTextContent("Bắt đầu2")
    expect(within(column("Đang làm")).getByRole("button", { name: "Duyệt bài" })).toBeInTheDocument()
    expect(within(column("Hoàn thành")).getByRole("heading", { level: 2 })).toHaveTextContent("(cột hoàn thành)")
    expect(within(column("Bắt đầu")).queryByText("(cột hoàn thành)")).not.toBeInTheDocument()
  })

  it("labels each card's drag handle with the card's name", () => {
    renderBoard()

    expect(screen.getByRole("button", { name: 'Kéo thẻ "Gửi báo cáo"' })).toBeInTheDocument()
  })

  it("shows an overdue date, today's due date, and no overdue warning once a card is done", () => {
    renderBoard()

    expect(within(column("Bắt đầu")).getByText("quá hạn 12/10")).toBeInTheDocument()
    expect(within(column("Đang làm")).getByText("hạn hôm nay")).toBeInTheDocument()
    expect(within(column("Hoàn thành")).getByText("hạn 10/10")).toBeInTheDocument()
  })

  it("adds a card from the bottom of a column and keeps the box open, cleared, for the next one", () => {
    const { onAddTask } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: 'Thêm thẻ vào cột "Đang làm"' }))
    const input = screen.getByLabelText('Tên thẻ mới ở cột "Đang làm"')
    fireEvent.change(input, { target: { value: "Sửa lỗi đăng nhập" } })
    fireEvent.submit(input)

    expect(onAddTask).toHaveBeenCalledWith("Sửa lỗi đăng nhập", 2)
    expect(screen.getByLabelText('Tên thẻ mới ở cột "Đang làm"')).toHaveValue("")
  })

  it("keeps the typed name when adding fails, and closes the box with Esc", () => {
    renderBoard({ onAddTask: vi.fn().mockReturnValue(false) })

    fireEvent.click(screen.getByRole("button", { name: 'Thêm thẻ vào cột "Bắt đầu"' }))
    const input = screen.getByLabelText('Tên thẻ mới ở cột "Bắt đầu"')
    fireEvent.change(input, { target: { value: "Gửi mail" } })
    fireEvent.submit(input)
    expect(input).toHaveValue("Gửi mail")

    fireEvent.keyDown(input, { key: "Escape" })
    expect(screen.queryByLabelText('Tên thẻ mới ở cột "Bắt đầu"')).not.toBeInTheDocument()
  })

  it("opens a card in an edit dialog and closes it once saved", () => {
    const { onUpdateTask } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }))
    const dialog = screen.getByRole("dialog", { name: "Sửa thẻ" })
    expect(within(dialog).getByLabelText("Tên việc")).toHaveValue("Gửi báo cáo")
    expect(within(dialog).getByLabelText("Hạn")).toHaveValue("12/10/2026")
    fireEvent.click(within(dialog).getByRole("button", { name: "Thấp" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onUpdateTask).toHaveBeenCalledWith(1, { title: "Gửi báo cáo", dueDate: "2026-10-12", priority: "low" })
    expect(screen.queryByRole("dialog", { name: "Sửa thẻ" })).not.toBeInTheDocument()
  })

  it("keeps the edit dialog open when saving fails", () => {
    renderBoard({ onUpdateTask: vi.fn().mockReturnValue(false) })

    fireEvent.click(screen.getByRole("button", { name: "Duyệt bài" }))
    fireEvent.click(within(screen.getByRole("dialog", { name: "Sửa thẻ" })).getByRole("button", { name: "Lưu" }))

    expect(screen.getByRole("dialog", { name: "Sửa thẻ" })).toBeInTheDocument()
  })

  it("deletes a card from the edit dialog only after confirming", () => {
    const { onRemoveTask } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: "Duyệt bài" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá thẻ" }))
    const confirm = screen.getByRole("alertdialog", { name: "Xoá thẻ?" })
    expect(confirm).toHaveTextContent('Xoá "Duyệt bài" sẽ không thể hoàn tác.')
    expect(onRemoveTask).not.toHaveBeenCalled()
    fireEvent.click(within(confirm).getByRole("button", { name: "Xoá" }))

    expect(onRemoveTask).toHaveBeenCalledWith(2)
  })

  it("moves a card to the bottom of another column from its Chuyển menu, which ticks the column it is in", () => {
    const { onMoveTask } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: 'Chuyển "Duyệt bài" sang cột' }))
    const menu = screen.getByRole("group", { name: "Chuyển sang" })
    expect(
      within(menu)
        .getAllByRole("menuitemradio")
        .map((o) => o.textContent)
    ).toEqual(["Bắt đầu", "Đang làm", "Hoàn thành"])
    expect(within(menu).getByRole("menuitemradio", { name: "Đang làm" })).toHaveAttribute("aria-checked", "true")
    fireEvent.click(within(menu).getByRole("menuitemradio", { name: "Hoàn thành" }))

    expect(onMoveTask).toHaveBeenCalledWith(2, 3, Number.MAX_SAFE_INTEGER)
  })

  it("does nothing when the column a card is already in is picked", () => {
    const { onMoveTask } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: 'Chuyển "Duyệt bài" sang cột' }))
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Đang làm" }))

    expect(onMoveTask).not.toHaveBeenCalled()
  })

  it("renames a column with Enter, and Esc leaves the name alone", () => {
    const { onRenameColumn } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: 'Tuỳ chọn cột "Đang làm"' }))
    fireEvent.click(screen.getByRole("button", { name: 'Đổi tên cột "Đang làm"' }))
    fireEvent.change(screen.getByLabelText("Tên cột"), { target: { value: "Đang xử lý" } })
    fireEvent.keyDown(screen.getByLabelText("Tên cột"), { key: "Enter" })
    expect(onRenameColumn).toHaveBeenCalledWith(2, "Đang xử lý")

    onRenameColumn.mockClear()
    fireEvent.click(screen.getByRole("button", { name: 'Tuỳ chọn cột "Bắt đầu"' }))
    fireEvent.click(screen.getByRole("button", { name: 'Đổi tên cột "Bắt đầu"' }))
    fireEvent.change(screen.getByLabelText("Tên cột"), { target: { value: "Bỏ" } })
    fireEvent.keyDown(screen.getByLabelText("Tên cột"), { key: "Escape" })
    expect(onRenameColumn).not.toHaveBeenCalled()
    expect(screen.queryByLabelText("Tên cột")).not.toBeInTheDocument()
  })

  it("moves a column left or right, but not past either end", () => {
    const { onMoveColumn } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: 'Tuỳ chọn cột "Bắt đầu"' }))
    expect(screen.getByRole("button", { name: 'Chuyển cột "Bắt đầu" sang trái' })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: 'Chuyển cột "Bắt đầu" sang phải' }))
    expect(onMoveColumn).toHaveBeenCalledWith(1, 1)

    fireEvent.click(screen.getByRole("button", { name: 'Tuỳ chọn cột "Hoàn thành"' }))
    expect(screen.getByRole("button", { name: 'Chuyển cột "Hoàn thành" sang phải' })).toBeDisabled()
  })

  it("keeps 'Xoá cột' at the right end of the column menu, also when it is locked on the only column", () => {
    renderBoard({ columns: [DEFAULT_COLUMNS[0]], tasks: [] })

    fireEvent.click(screen.getByRole("button", { name: 'Tuỳ chọn cột "Bắt đầu"' }))
    const remove = screen.getByRole("button", { name: 'Xoá cột "Bắt đầu"' })
    expect(remove).toBeDisabled()
    // ml-auto nằm ở ô bọc ngoài span của tooltip — đặt trên nút thì mất tác dụng khi nút bị bọc lúc khoá.
    expect(remove.closest(".ml-auto")).not.toBeNull()
    expect(remove).not.toHaveClass("ml-auto")
  })

  it("deletes a column after a warning that says where its cards go", () => {
    const { onRemoveColumn } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: 'Tuỳ chọn cột "Đang làm"' }))
    fireEvent.click(screen.getByRole("button", { name: 'Xoá cột "Đang làm"' }))
    const confirm = screen.getByRole("alertdialog", { name: "Xoá cột?" })
    expect(confirm).toHaveTextContent('1 thẻ trong cột sẽ chuyển sang cột "Bắt đầu".')
    fireEvent.click(within(confirm).getByRole("button", { name: "Xoá cột" }))

    expect(onRemoveColumn).toHaveBeenCalledWith(2)
  })

  it("warns that another column becomes the done column when deleting the last one", () => {
    renderBoard()

    fireEvent.click(screen.getByRole("button", { name: 'Tuỳ chọn cột "Hoàn thành"' }))
    fireEvent.click(screen.getByRole("button", { name: 'Xoá cột "Hoàn thành"' }))

    expect(screen.getByRole("alertdialog", { name: "Xoá cột?" })).toHaveTextContent(
      'Cột "Đang làm" sẽ thành cột hoàn thành — thẻ trong đó được tính là đã xong.'
    )
  })

  it("never deletes the only column left", () => {
    renderBoard({ columns: [{ id: 1, title: "Việc" }], tasks: [] })

    fireEvent.click(screen.getByRole("button", { name: 'Tuỳ chọn cột "Việc"' }))

    expect(screen.getByRole("button", { name: 'Xoá cột "Việc"' })).toBeDisabled()
  })

  it("adds a column, telling where it will go", () => {
    const { onAddColumn } = renderBoard()

    fireEvent.click(screen.getByRole("button", { name: "Thêm cột" }))
    expect(screen.getByText(/Cột mới nằm trước cột "Hoàn thành"/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Tên cột mới"), { target: { value: "Chờ duyệt" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm cột" }))

    expect(onAddColumn).toHaveBeenCalledWith("Chờ duyệt")
    expect(screen.queryByLabelText("Tên cột mới")).not.toBeInTheDocument()
  })
})
