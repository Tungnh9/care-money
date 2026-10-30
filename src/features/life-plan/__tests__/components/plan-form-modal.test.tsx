import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import type { LifePlan } from "@/lib/life-plan/types"
import { PlanFormModal } from "../../components/plan-form-modal"

const PLAN: LifePlan = {
  id: 2,
  title: "Mua nhà",
  targetYear: 2030,
  targetMonth: 6,
  status: "doing",
  note: "Căn 2 phòng ngủ",
}

function renderForm(plan: LifePlan | null = null, submitted = true) {
  const onSubmit = vi.fn(() => submitted)
  const onClose = vi.fn()
  render(<PlanFormModal plan={plan} onSubmit={onSubmit} onClose={onClose} />)
  return { onSubmit, onClose, dialog: screen.getByRole("dialog") }
}

function typeInto(dialog: HTMLElement, label: string, value: string) {
  fireEvent.change(within(dialog).getByLabelText(label), { target: { value } })
}

function statusButton(dialog: HTMLElement, name: string): HTMLElement {
  return within(within(dialog).getByRole("group", { name: "Trạng thái" })).getByRole("button", { name })
}

describe("PlanFormModal", () => {
  it("starts a new plan as Dự định, with no name or year yet", () => {
    const { dialog } = renderForm()

    expect(screen.getByRole("dialog", { name: "Thêm kế hoạch" })).toBe(dialog)
    expect(within(dialog).getByLabelText("Tên kế hoạch")).toHaveValue("")
    expect(within(dialog).getByLabelText("Năm muốn đạt")).toHaveValue("")
    expect(statusButton(dialog, "Dự định")).toHaveAttribute("aria-pressed", "true")
    expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("fills every field from the plan being edited", () => {
    const { dialog } = renderForm(PLAN)

    expect(screen.getByRole("dialog", { name: "Sửa kế hoạch" })).toBe(dialog)
    expect(within(dialog).getByLabelText("Tên kế hoạch")).toHaveValue("Mua nhà")
    expect(within(dialog).getByLabelText("Năm muốn đạt")).toHaveValue("2030")
    expect(within(dialog).getByLabelText("Tháng")).toHaveValue("6")
    expect(within(dialog).getByLabelText("Ghi chú")).toHaveValue("Căn 2 phòng ngủ")
    expect(statusButton(dialog, "Đang làm")).toHaveAttribute("aria-pressed", "true")
  })

  it("saves a plan with a year only, without a month or a note, and closes", () => {
    const { dialog, onSubmit, onClose } = renderForm()

    typeInto(dialog, "Tên kế hoạch", "Mua xe")
    typeInto(dialog, "Năm muốn đạt", "2028")
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onSubmit).toHaveBeenCalledWith({ title: "Mua xe", targetYear: 2028, status: "planned" })
    expect(onClose).toHaveBeenCalled()
  })

  it("saves the month, the status and the note when given", () => {
    const { dialog, onSubmit } = renderForm()

    typeInto(dialog, "Tên kế hoạch", "Học bơi")
    typeInto(dialog, "Năm muốn đạt", "2027")
    typeInto(dialog, "Tháng", "7")
    typeInto(dialog, "Ghi chú", "Bể gần nhà")
    fireEvent.click(statusButton(dialog, "Đã đạt"))
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Học bơi",
      targetYear: 2027,
      targetMonth: 7,
      status: "done",
      note: "Bể gần nhà",
    })
  })

  it.each([
    ["Năm muốn đạt", "999", "Nhập năm 4 chữ số, vd: 2030"],
    ["Năm muốn đạt", "2030.5", "Nhập năm 4 chữ số, vd: 2030"],
    ["Tháng", "13", "Tháng từ 1 đến 12, hoặc để trống"],
    ["Tháng", "0", "Tháng từ 1 đến 12, hoặc để trống"],
  ])("disables Lưu with a hint while %s is %s", (label, value, hint) => {
    const { dialog, onSubmit } = renderForm(PLAN)

    typeInto(dialog, label, value)

    expect(within(dialog).getByText(hint)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeDisabled()
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("disables Lưu while the name is blank", () => {
    const { dialog } = renderForm(PLAN)

    typeInto(dialog, "Tên kế hoạch", "   ")

    expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("stays open when the plan is refused", () => {
    const { dialog, onClose } = renderForm(PLAN, false)

    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onClose).not.toHaveBeenCalled()
  })

  it("closes without saving on Huỷ", () => {
    const { dialog, onSubmit, onClose } = renderForm(PLAN)

    fireEvent.click(within(dialog).getByRole("button", { name: "Huỷ" }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})
