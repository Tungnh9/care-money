import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi } from "../../finance-calculations"
import { GoldTransactionsCards } from "../../components/gold-transactions-cards"
import type { GoldPurchase } from "../../types"

const GOLD_PRICE = "850.000"

const PURCHASES: GoldPurchase[] = [
  { id: 1, date: "01/08/2026", phan: 10, buy: 800_000 },
  { id: 2, date: "05/08/2026", phan: 5, buy: 900_000 },
]

describe("GoldTransactionsCards", () => {
  it("renders the empty-state message when there are no purchases", () => {
    render(
      <GoldTransactionsCards
        gold={[]}
        goldPrice={GOLD_PRICE}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    expect(screen.getByText(/Chưa có giao dịch vàng nào/)).toBeInTheDocument()
    expect(screen.queryAllByRole("button", { name: "Xoá giao dịch vàng" })).toHaveLength(0)
  })

  it("renders each purchase's date, quantity and money figures, including a losing purchase's Lãi lỗ figure", () => {
    render(
      <GoldTransactionsCards
        gold={PURCHASES}
        goldPrice={GOLD_PRICE}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    // Purchase A: 10 phân @ 800.000 -> cost 8.000.000, value 10*850.000 = 8.500.000, pl +500.000
    expect(screen.getByText("01/08/2026")).toBeInTheDocument()
    expect(screen.getByText(phanToChi(10))).toBeInTheDocument()
    expect(screen.getAllByText(formatMoney(800_000)).length).toBeGreaterThan(0)
    expect(screen.getByText(formatMoney(8_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(8_500_000))).toBeInTheDocument()
    expect(screen.getByText("+ " + formatMoney(500_000))).toBeInTheDocument()

    // Purchase B: 5 phân @ 900.000 -> cost 4.500.000, value 5*850.000 = 4.250.000, pl -250.000 (losing)
    expect(screen.getByText("05/08/2026")).toBeInTheDocument()
    expect(screen.getByText(phanToChi(5))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(4_500_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(4_250_000))).toBeInTheDocument()
    expect(screen.getByText("− " + formatMoney(250_000))).toBeInTheDocument()
  })

  it("calls onRemove with the matching purchase id when its delete button is clicked", () => {
    const onRemove = vi.fn()
    render(
      <GoldTransactionsCards
        gold={PURCHASES}
        goldPrice={GOLD_PRICE}
        onRemove={onRemove}
        onEdit={vi.fn()}
      />
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
      <GoldTransactionsCards
        gold={PURCHASES}
        goldPrice={GOLD_PRICE}
        onRemove={vi.fn()}
        onEdit={onEdit}
      />
    )

    const editButtons = screen.getAllByRole("button", { name: /Sửa giao dịch vàng/ })
    expect(editButtons).toHaveLength(2)

    fireEvent.click(editButtons[1])

    expect(onEdit).toHaveBeenCalledWith(PURCHASES[1])
    expect(onEdit).not.toHaveBeenCalledWith(PURCHASES[0])
  })
})
