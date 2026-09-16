import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { EditSavingsFundModal } from "../../components/edit-savings-fund-modal"
import type { SavingsFund } from "../../types"

const FUND: SavingsFund = { name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000, note: "Đi Đà Lạt cuối năm" }

describe("EditSavingsFundModal", () => {
  it("renders nothing when fund is null", () => {
    render(<EditSavingsFundModal fund={null} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByText("Sửa quỹ tiết kiệm")).not.toBeInTheDocument()
  })

  it("prefills every field from the given fund", () => {
    render(<EditSavingsFundModal fund={FUND} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByText("Sửa quỹ tiết kiệm")).toBeInTheDocument()
    expect(screen.getByLabelText("Tên quỹ")).toHaveValue("Quỹ du lịch")
    expect(screen.getByLabelText("Số tiền hiện có", { exact: false })).toHaveValue("2.000.000")
    expect(screen.getByLabelText("Mục tiêu", { exact: false })).toHaveValue("10.000.000")
    expect(screen.getByLabelText("Ghi chú", { exact: false })).toHaveValue("Đi Đà Lạt cuối năm")
  })

  it("saves the edited fund and closes on Lưu", () => {
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditSavingsFundModal fund={FUND} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Số tiền hiện có", { exact: false }), {
      target: { value: "3000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith({
      name: "Quỹ du lịch",
      amount: 3_000_000,
      target: 10_000_000,
      note: "Đi Đà Lạt cuối năm",
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes without saving on Huỷ", () => {
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditSavingsFundModal fund={FUND} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onSave).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("disables Lưu while name, amount, or target is empty", () => {
    render(<EditSavingsFundModal fund={FUND} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Tên quỹ"), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("reseeds fields when switching to a different fund while already open", () => {
    const OTHER: SavingsFund = { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 }
    const { rerender } = render(<EditSavingsFundModal fund={FUND} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    rerender(<EditSavingsFundModal fund={OTHER} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên quỹ")).toHaveValue("Quỹ khẩn cấp")
    expect(screen.getByLabelText("Số tiền hiện có", { exact: false })).toHaveValue("5.000.000")
    expect(screen.getByLabelText("Ghi chú", { exact: false })).toHaveValue("")
  })
})
