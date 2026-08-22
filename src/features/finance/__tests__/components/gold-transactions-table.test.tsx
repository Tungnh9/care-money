import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi } from "../../finance-calculations"
import { GoldTransactionsTable } from "../../components/gold-transactions-table"
import type { GoldPurchase } from "../../types"

const GOLD_PRICE = "850.000"

const PURCHASES: GoldPurchase[] = [
  { id: 1, date: "01/08/2026", phan: 10, buy: 800_000 },
  { id: 2, date: "05/08/2026", phan: 5, buy: 900_000 },
]

describe("GoldTransactionsTable", () => {
  it("renders the empty-state message when there are no purchases", () => {
    render(
      <GoldTransactionsTable
        gold={[]}
        goldPrice={GOLD_PRICE}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByText(/Chưa có giao dịch vàng nào/)).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("renders each purchase's date, quantity and money figures, including a losing purchase's Lãi lỗ figure", () => {
    render(
      <GoldTransactionsTable
        gold={PURCHASES}
        goldPrice={GOLD_PRICE}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    // Purchase A: 10 phân @ 800.000 -> cost 8.000.000, value 10*850.000 = 8.500.000, pl +500.000
    expect(screen.getByText("01/08/2026")).toBeInTheDocument()
    expect(screen.getByText(phanToChi(10))).toBeInTheDocument()
    expect(screen.getAllByText(formatMoney(800_000)).length).toBeGreaterThan(0)
    expect(screen.getByText(formatMoney(8_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(8_500_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(500_000))).toBeInTheDocument()

    // Purchase B: 5 phân @ 900.000 -> cost 4.500.000, value 5*850.000 = 4.250.000, pl -250.000 (losing)
    expect(screen.getByText("05/08/2026")).toBeInTheDocument()
    expect(screen.getByText(phanToChi(5))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(4_500_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(4_250_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(250_000))).toBeInTheDocument()
  })

  it("calls onRemove with the matching purchase id when its delete button is clicked", () => {
    const onRemove = vi.fn()
    render(
      <GoldTransactionsTable
        gold={PURCHASES}
        goldPrice={GOLD_PRICE}
        onRemove={onRemove}
        onEdit={vi.fn()}
      />,
    )

    const deleteButtons = screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })
    expect(deleteButtons).toHaveLength(2)

    fireEvent.click(deleteButtons[1])

    expect(onRemove).toHaveBeenCalledWith(2)
    expect(onRemove).not.toHaveBeenCalledWith(1)
  })

  it("calls onEdit with the matching purchase object when its edit button is clicked", () => {
    const onEdit = vi.fn()
    render(
      <GoldTransactionsTable
        gold={PURCHASES}
        goldPrice={GOLD_PRICE}
        onRemove={vi.fn()}
        onEdit={onEdit}
      />,
    )

    const editButton = screen.getByRole("button", { name: "Sửa giao dịch vàng 05/08/2026" })
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(PURCHASES[1])
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it("tints the Lãi lỗ badge and the row's left-border accent by gain/loss, and zebra-stripes alternating rows", () => {
    render(
      <GoldTransactionsTable
        gold={PURCHASES}
        goldPrice={GOLD_PRICE}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    const winningBadge = screen.getByText(formatMoney(500_000))
    expect(winningBadge).toHaveClass("bg-[var(--ob-color-income)]/10", "text-[var(--ob-color-income)]")
    const winningRow = winningBadge.closest("tr") as HTMLTableRowElement
    const winningFirstCell = winningRow.querySelector("td") as HTMLTableCellElement
    expect(winningFirstCell).toHaveClass("border-l-[var(--ob-color-income)]")

    const losingBadge = screen.getByText(formatMoney(250_000))
    expect(losingBadge).toHaveClass("bg-[var(--ob-color-expense)]/10", "text-[var(--ob-color-expense)]")
    const losingRow = losingBadge.closest("tr") as HTMLTableRowElement
    const losingFirstCell = losingRow.querySelector("td") as HTMLTableCellElement
    expect(losingFirstCell).toHaveClass("border-l-[var(--ob-color-expense)]")

    expect(winningRow).not.toHaveClass("bg-[var(--ob-color-surface-sunken)]")
    expect(losingRow).toHaveClass("bg-[var(--ob-color-surface-sunken)]")
  })

  it("centers each row's edit and delete buttons together in a shared flex container", () => {
    render(
      <GoldTransactionsTable
        gold={PURCHASES}
        goldPrice={GOLD_PRICE}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    const editButton = screen.getByRole("button", { name: "Sửa giao dịch vàng 05/08/2026" })
    const deleteButtons = screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })
    const deleteButton = deleteButtons[1]

    const container = editButton.parentElement
    expect(container).toBe(deleteButton.parentElement)
    expect(container).toHaveClass("flex", "items-center", "justify-center")
  })
})
