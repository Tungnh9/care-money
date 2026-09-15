import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { ExpenseListCard } from "../../components/expense-list-card"
import { formatMoney } from "@/lib/format"
import type { Expense } from "../../types"

const EXPENSES: Expense[] = [
  { id: 2, dayKey: "2026-09-02", amount: 50_000, tag: { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" } },
  { id: 1, dayKey: "2026-09-01", amount: 3_000_000, tag: null, note: "Tiền nhà" },
]

describe("ExpenseListCard", () => {
  it("shows the empty state when there are no expenses", () => {
    render(<ExpenseListCard expenses={[]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText(/Chưa có khoản chi nào/)).toBeInTheDocument()
  })

  it("shows the card title", () => {
    render(<ExpenseListCard expenses={[]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("Khoản chi tháng này")).toBeInTheDocument()
  })

  it("renders each expense's amount, tag label (or untagged) and note", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getAllByText("50.000 ₫").length).toBeGreaterThan(0)
    expect(screen.getByText("Mua sắm")).toBeInTheDocument()
    expect(screen.getAllByText("3.000.000 ₫").length).toBeGreaterThan(0)
    expect(screen.getByText("Tiền nhà")).toBeInTheDocument()
    expect(screen.getByText("Không gắn thẻ")).toBeInTheDocument()
  })

  it("calls onRemove with the expense's id when its delete button is clicked", () => {
    const onRemove = vi.fn()
    render(<ExpenseListCard expenses={EXPENSES} onRemove={onRemove} onEdit={vi.fn()} />)

    fireEvent.click(screen.getAllByRole("button", { name: /Xoá/ })[0])

    expect(onRemove).toHaveBeenCalledWith(2)
  })

  it("calls onEdit with the full expense when its edit button is clicked", () => {
    const onEdit = vi.fn()
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={onEdit} />)

    fireEvent.click(screen.getAllByRole("button", { name: /Sửa/ })[0])

    expect(onEdit).toHaveBeenCalledWith(EXPENSES[0])
  })

  it("groups expenses under a date header per day, most recent day first", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const headers = screen.getAllByTestId("expense-day-header").map((el) => el.textContent)
    expect(headers[0]).toContain("02/09")
    expect(headers[1]).toContain("01/09")
  })

  it("shows each day's subtotal in its header", () => {
    const sameDay: Expense[] = [
      { id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null },
      { id: 2, dayKey: "2026-09-01", amount: 50_000, tag: null },
    ]
    render(<ExpenseListCard expenses={sameDay} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByTestId("expense-day-header")).toHaveTextContent(formatMoney(150_000))
  })

  it("gives every row within the same day the same background, alternating per day rather than per row", () => {
    const sameDay: Expense[] = [
      { id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null },
      { id: 2, dayKey: "2026-09-01", amount: 50_000, tag: null },
    ]
    render(<ExpenseListCard expenses={sameDay} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const rows = screen.getAllByTestId("expense-row")
    const bgClass = [...rows[0].classList].find((c) => c.startsWith("bg-"))
    expect([...rows[1].classList]).toContain(bgClass)
  })

  it("alternates the day block's background between consecutive days", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const rows = screen.getAllByTestId("expense-row")
    const bgClass = [...rows[0].classList].find((c) => c.startsWith("bg-"))
    expect([...rows[1].classList]).not.toContain(bgClass)
  })

  it("gives the header a more distinct background than its own day's transaction rows", () => {
    const sameDay: Expense[] = [{ id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null }]
    render(<ExpenseListCard expenses={sameDay} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const header = screen.getByTestId("expense-day-header")
    const row = screen.getByTestId("expense-row")
    const headerBg = [...header.classList].find((c) => c.startsWith("bg-"))
    const rowBg = [...row.classList].find((c) => c.startsWith("bg-"))
    expect(headerBg).not.toBe(rowBg)
  })

  it("adds a divider between consecutive rows in the same day, but not after the last one", () => {
    const sameDay: Expense[] = [
      { id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null },
      { id: 2, dayKey: "2026-09-01", amount: 50_000, tag: null },
    ]
    render(<ExpenseListCard expenses={sameDay} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const rows = screen.getAllByTestId("expense-row")
    expect(rows[0].className).toContain("border-b")
    expect(rows[1].className).not.toContain("border-b")
  })
})
