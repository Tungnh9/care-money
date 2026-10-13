import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { TaskForm } from "../../components/task-form"
import type { TaskInput } from "@/lib/work/use-work"

// 2026-10-13 là thứ Ba → "Thứ 6" là 2026-10-16.
const TODAY = "2026-10-13"

const PLAIN: TaskInput = { title: "Gửi báo cáo", dueDate: null, priority: "normal" }

function renderForm(initial: TaskInput = PLAIN) {
  const props = { onSubmit: vi.fn(), onCancel: vi.fn(), onDelete: vi.fn() }
  render(<TaskForm today={TODAY} initial={initial} {...props} />)
  return props
}

describe("TaskForm", () => {
  it("starts from the card being edited", () => {
    renderForm({ title: "Duyệt bài", dueDate: "2026-10-20", priority: "low" })

    expect(screen.getByLabelText("Tên việc")).toHaveValue("Duyệt bài")
    expect(screen.getByLabelText("Hạn")).toHaveValue("20/10/2026")
    expect(screen.getByRole("button", { name: "Thấp" })).toHaveAttribute("aria-pressed", "true")
  })

  it("saves the title, priority and the due date picked with a quick button, with no project field", () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText("Tên việc"), { target: { value: "Gửi báo cáo tuần" } })
    fireEvent.click(screen.getByRole("button", { name: "Thứ 6" }))
    fireEvent.click(screen.getByRole("button", { name: "Cao" }))
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSubmit).toHaveBeenCalledWith({ title: "Gửi báo cáo tuần", dueDate: "2026-10-16", priority: "high" })
    expect(screen.queryByLabelText("Dự án")).not.toBeInTheDocument()
  })

  it("shows the picked quick date in the date box and marks that button pressed", () => {
    renderForm()

    fireEvent.click(screen.getByRole("button", { name: "Ngày mai" }))

    expect(screen.getByLabelText("Hạn")).toHaveValue("14/10/2026")
    expect(screen.getByRole("button", { name: "Ngày mai" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Hôm nay" })).toHaveAttribute("aria-pressed", "false")
  })

  it("accepts a typed date, and clears it with Không hạn", () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText("Hạn"), { target: { value: "20/10/2026" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))
    fireEvent.click(screen.getByRole("button", { name: "Không hạn" }))
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSubmit).toHaveBeenNthCalledWith(1, expect.objectContaining({ dueDate: "2026-10-20" }))
    expect(onSubmit).toHaveBeenNthCalledWith(2, expect.objectContaining({ dueDate: null }))
  })

  it("blocks saving with a blank title or a date that does not exist", () => {
    renderForm()
    const save = screen.getByRole("button", { name: "Lưu" })

    fireEvent.change(screen.getByLabelText("Tên việc"), { target: { value: "  " } })
    expect(save).toBeDisabled()
    fireEvent.change(screen.getByLabelText("Tên việc"), { target: { value: "Gửi báo cáo" } })
    expect(save).toBeEnabled()
    fireEvent.change(screen.getByLabelText("Hạn"), { target: { value: "31/04/2026" } })

    expect(save).toBeDisabled()
    expect(screen.getByText("Nhập ngày dạng dd/mm/yyyy, vd: 20/10/2026")).toBeInTheDocument()
  })

  it("hands Huỷ and Xoá thẻ to the caller", () => {
    const { onCancel, onDelete, onSubmit } = renderForm()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá thẻ" }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("groups the quick due-date buttons and the priority buttons under a name", () => {
    renderForm()

    expect(screen.getByRole("group", { name: "Chọn hạn nhanh" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Ưu tiên" })).toBeInTheDocument()
  })
})
