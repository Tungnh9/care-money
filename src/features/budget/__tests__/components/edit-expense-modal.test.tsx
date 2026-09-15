import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { EditExpenseModal } from "../../components/edit-expense-modal"
import type { BudgetTag } from "@/lib/settings-storage"
import type { Expense } from "../../types"

const TAGS: BudgetTag[] = [
  { label: "Tiền trọ", emoji: "🏠", desc: "", tint: "#FFF0B8", on: true },
  { label: "Mua sắm", emoji: "🛍️", desc: "", tint: "#E7F6EF", on: true },
]

const EXPENSE: Expense = {
  id: 1,
  dayKey: "2026-09-01",
  amount: 3_000_000,
  note: "Tiền nhà tháng này",
  tag: { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8" },
}

describe("EditExpenseModal", () => {
  it("renders nothing when there is no expense being edited", () => {
    render(<EditExpenseModal expense={null} tags={TAGS} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByText("Sửa khoản chi")).not.toBeInTheDocument()
  })

  it("prefills the amount, tag and note from the given expense", () => {
    render(<EditExpenseModal expense={EXPENSE} tags={TAGS} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("3.000.000")
    expect(screen.getByLabelText("Ghi chú", { exact: false })).toHaveValue("Tiền nhà tháng này")
    expect(screen.getByRole("button", { name: /Tiền trọ/ })).toHaveClass("border-[var(--ob-color-action)]")
  })

  it("saves the edited amount, tag and note, then closes", () => {
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditExpenseModal expense={EXPENSE} tags={TAGS} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "5000000" } })
    fireEvent.click(screen.getByRole("button", { name: /Mua sắm/ }))
    fireEvent.change(screen.getByLabelText("Ghi chú", { exact: false }), { target: { value: "Đổi ghi chú" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(1, {
      amount: 5_000_000,
      tag: { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" },
      note: "Đổi ghi chú",
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes without saving when Huỷ is clicked", () => {
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditExpenseModal expense={EXPENSE} tags={TAGS} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onSave).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("disables Lưu when the amount is cleared to zero", () => {
    render(<EditExpenseModal expense={EXPENSE} tags={TAGS} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("reseeds its fields when switching to a different expense", () => {
    const { rerender } = render(
      <EditExpenseModal expense={EXPENSE} tags={TAGS} onOpenChange={vi.fn()} onSave={vi.fn()} />
    )
    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "999" } })

    const other: Expense = { id: 2, dayKey: "2026-09-02", amount: 600_000, tag: null }
    rerender(<EditExpenseModal expense={other} tags={TAGS} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("600.000")
  })
})
