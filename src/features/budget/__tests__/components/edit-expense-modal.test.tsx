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

const TAGS_WITH_COFFEE_OFF: BudgetTag[] = [
  ...TAGS,
  { label: "Cà phê", emoji: "☕", desc: "", tint: "#EAF1FE", on: false },
]

const COFFEE_EXPENSE: Expense = {
  id: 3,
  dayKey: "2026-09-03",
  amount: 200_000,
  tag: { label: "Cà phê", emoji: "☕", tint: "#EAF1FE" },
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

  it("keeps a tag that was turned off in Settings when only the amount is edited", () => {
    const onSave = vi.fn()
    render(
      <EditExpenseModal expense={COFFEE_EXPENSE} tags={TAGS_WITH_COFFEE_OFF} onOpenChange={vi.fn()} onSave={onSave} />
    )

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "250000" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(3, {
      amount: 250_000,
      tag: { label: "Cà phê", emoji: "☕", tint: "#EAF1FE" },
      note: undefined,
    })
  })

  it("shows that turned-off tag as selected so it can still be removed", () => {
    const onSave = vi.fn()
    render(
      <EditExpenseModal expense={COFFEE_EXPENSE} tags={TAGS_WITH_COFFEE_OFF} onOpenChange={vi.fn()} onSave={onSave} />
    )
    const chip = screen.getByRole("button", { name: /Cà phê/ })
    expect(chip).toHaveClass("border-[var(--ob-color-action)]")

    fireEvent.click(chip)
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(3, { amount: 200_000, tag: null, note: undefined })
  })

  it("keeps the tag exactly as it was recorded, even if its emoji or colour changed in Settings since", () => {
    const restyled: BudgetTag[] = [{ label: "Tiền trọ", emoji: "🏡", desc: "", tint: "#FFE0C7", on: true }, TAGS[1]]
    const onSave = vi.fn()
    render(<EditExpenseModal expense={EXPENSE} tags={restyled} onOpenChange={vi.fn()} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(1, {
      amount: 3_000_000,
      tag: { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8" },
      note: "Tiền nhà tháng này",
    })
  })

  it("blocks saving an amount above 999.999.999.999 đ", () => {
    render(<EditExpenseModal expense={EXPENSE} tags={TAGS} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "12345678901234567" } })

    expect(screen.getByText("Tối đa 999.999.999.999 đ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
})
