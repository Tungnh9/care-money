import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { ExpenseEntryForm } from "../../components/expense-entry-form"
import type { BudgetTag } from "@/lib/settings-storage"

const TAGS: BudgetTag[] = [
  { label: "Tiền trọ", emoji: "🏠", desc: "", tint: "#FFF0B8", on: true },
  { label: "Mua sắm", emoji: "🛍️", desc: "", tint: "#E7F6EF", on: true },
  { label: "Đã tắt", emoji: "❌", desc: "", tint: "#EEE", on: false },
]

describe("ExpenseEntryForm", () => {
  it("only shows tags that are turned on", () => {
    render(<ExpenseEntryForm tags={TAGS} onAdd={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Tiền trọ/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Đã tắt/ })).not.toBeInTheDocument()
  })

  it("disables submit until an amount is entered", () => {
    render(<ExpenseEntryForm tags={TAGS} onAdd={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Ghi khoản chi" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "50000" } })

    expect(screen.getByRole("button", { name: "Ghi khoản chi" })).not.toBeDisabled()
  })

  it("submits the amount, selected tag snapshot and note, then resets the form", () => {
    const onAdd = vi.fn()
    render(<ExpenseEntryForm tags={TAGS} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "50000" } })
    fireEvent.click(screen.getByRole("button", { name: /Tiền trọ/ }))
    fireEvent.change(screen.getByLabelText("Ghi chú", { exact: false }), { target: { value: "Tháng 9" } })
    fireEvent.click(screen.getByRole("button", { name: "Ghi khoản chi" }))

    expect(onAdd).toHaveBeenCalledWith({
      amount: 50_000,
      tag: { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8" },
      note: "Tháng 9",
    })
    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("")
  })

  it("submits tag: null when no tag is selected", () => {
    const onAdd = vi.fn()
    render(<ExpenseEntryForm tags={TAGS} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "10000" } })
    fireEvent.click(screen.getByRole("button", { name: "Ghi khoản chi" }))

    expect(onAdd).toHaveBeenCalledWith({ amount: 10_000, tag: null, note: undefined })
  })

  it("deselects a tag when clicking the already-active pill", () => {
    const onAdd = vi.fn()
    render(<ExpenseEntryForm tags={TAGS} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: /Tiền trọ/ }))
    fireEvent.click(screen.getByRole("button", { name: /Tiền trọ/ }))
    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "10000" } })
    fireEvent.click(screen.getByRole("button", { name: "Ghi khoản chi" }))

    expect(onAdd).toHaveBeenCalledWith({ amount: 10_000, tag: null, note: undefined })
  })
})
