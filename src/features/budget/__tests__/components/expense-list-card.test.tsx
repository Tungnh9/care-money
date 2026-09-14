import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { ExpenseListCard } from "../../components/expense-list-card"
import type { Expense } from "../../types"

const EXPENSES: Expense[] = [
  { id: 2, dayKey: "2026-09-02", amount: 50_000, tag: { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" } },
  { id: 1, dayKey: "2026-09-01", amount: 3_000_000, tag: null, note: "Tiền nhà" },
]

describe("ExpenseListCard", () => {
  it("shows the empty state when there are no expenses", () => {
    render(<ExpenseListCard expenses={[]} onRemove={vi.fn()} />)

    expect(screen.getByText(/Chưa có khoản chi nào/)).toBeInTheDocument()
  })

  it("renders each expense's amount, tag label (or untagged) and note", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} />)

    expect(screen.getByText("50.000 ₫")).toBeInTheDocument()
    expect(screen.getByText("Mua sắm")).toBeInTheDocument()
    expect(screen.getByText("3.000.000 ₫")).toBeInTheDocument()
    expect(screen.getByText("Tiền nhà")).toBeInTheDocument()
    expect(screen.getByText("Không gắn thẻ")).toBeInTheDocument()
  })

  it("calls onRemove with the expense's id when its delete button is clicked", () => {
    const onRemove = vi.fn()
    render(<ExpenseListCard expenses={EXPENSES} onRemove={onRemove} />)

    fireEvent.click(screen.getAllByRole("button", { name: /Xoá/ })[0])

    expect(onRemove).toHaveBeenCalledWith(2)
  })
})
