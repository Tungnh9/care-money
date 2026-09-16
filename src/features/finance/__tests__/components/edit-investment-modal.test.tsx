import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { groupVN } from "@/components/ui/field"
import { EditInvestmentModal } from "../../components/edit-investment-modal"
import type { Investment } from "../../types"

const INVESTMENT: Investment = { id: 1, name: "Cổ phiếu FPT", cost: 10_000_000, value: 12_000_000 }

describe("EditInvestmentModal", () => {
  it("renders nothing when investment is null", () => {
    render(<EditInvestmentModal investment={null} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByText("Sửa khoản đầu tư")).not.toBeInTheDocument()
  })

  it("prefills every field from the given investment", () => {
    render(<EditInvestmentModal investment={INVESTMENT} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên khoản đầu tư", { exact: false })).toHaveValue("Cổ phiếu FPT")
    expect(screen.getByLabelText("Vốn đã bỏ ra", { exact: false })).toHaveValue(groupVN(10_000_000))
    expect(screen.getByLabelText("Giá trị hiện tại", { exact: false })).toHaveValue(groupVN(12_000_000))
  })

  it("saves the edited investment and closes on Lưu", () => {
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditInvestmentModal investment={INVESTMENT} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Giá trị hiện tại", { exact: false }), {
      target: { value: "13500000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(1, { name: "Cổ phiếu FPT", cost: 10_000_000, value: 13_500_000 })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes without saving on Huỷ", () => {
    const onSave = vi.fn()
    render(<EditInvestmentModal investment={INVESTMENT} onOpenChange={vi.fn()} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onSave).not.toHaveBeenCalled()
  })

  it("disables Lưu while name, cost or value is empty", () => {
    render(<EditInvestmentModal investment={INVESTMENT} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Tên khoản đầu tư", { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("reseeds fields when switching to a different investment while already open", () => {
    const OTHER: Investment = { id: 2, name: "Quỹ VNDIRECT", cost: 5_000_000, value: 5_800_000 }
    const { rerender } = render(
      <EditInvestmentModal investment={INVESTMENT} onOpenChange={vi.fn()} onSave={vi.fn()} />
    )

    rerender(<EditInvestmentModal investment={OTHER} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên khoản đầu tư", { exact: false })).toHaveValue("Quỹ VNDIRECT")
  })
})
