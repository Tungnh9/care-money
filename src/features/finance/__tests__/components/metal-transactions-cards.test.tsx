import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi } from "@/lib/finance/finance-calculations"
import { MetalTransactionsCards } from "../../components/metal-transactions-cards"
import { GOLD_METAL } from "../../metal-config"
import type { GoldPurchase, GoldStore } from "@/lib/finance/types"

const STORES: GoldStore[] = [{ name: "SJC", price: "850.000" }]

const PURCHASES: GoldPurchase[] = [
  { id: 1, date: "01/08/2026", phan: 10, buy: 800_000, store: "SJC" },
  { id: 2, date: "05/08/2026", phan: 5, buy: 900_000, store: "SJC" },
]

describe("MetalTransactionsCards", () => {
  it("renders the empty-state message when there are no purchases", () => {
    render(
      <MetalTransactionsCards metal={GOLD_METAL} purchases={[]} stores={STORES} onRemove={vi.fn()} onEdit={vi.fn()} />
    )

    expect(screen.getByText(/Chưa có giao dịch vàng nào/)).toBeInTheDocument()
    expect(screen.queryAllByRole("button", { name: /^Xoá giao dịch vàng/ })).toHaveLength(0)
  })

  it("renders each purchase's date, quantity and money figures, including a losing purchase's Lãi lỗ figure", () => {
    render(
      <MetalTransactionsCards
        metal={GOLD_METAL}
        purchases={PURCHASES}
        stores={STORES}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    expect(screen.getAllByText("SJC").length).toBe(2)

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

  it("highlights a winning Lãi lỗ figure with an income-tinted background and border", () => {
    render(
      <MetalTransactionsCards
        metal={GOLD_METAL}
        purchases={[PURCHASES[0]]}
        stores={STORES}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    const plLabel = screen.getByText("Lãi lỗ")
    const plBox = plLabel.parentElement as HTMLElement
    expect(plBox.style.backgroundColor).toBe("var(--ob-color-income-soft)")
    expect(plBox.style.borderColor).toBe("var(--ob-color-income)")
    expect(screen.getByText(formatMoney(500_000))).toBeInTheDocument()
    expect(plBox.querySelector("svg")).not.toBeNull()
  })

  it("highlights a losing Lãi lỗ figure with an expense-tinted background and border", () => {
    render(
      <MetalTransactionsCards
        metal={GOLD_METAL}
        purchases={[PURCHASES[1]]}
        stores={STORES}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    const plLabel = screen.getByText("Lãi lỗ")
    const plBox = plLabel.parentElement as HTMLElement
    expect(plBox.style.backgroundColor).toBe("var(--ob-color-expense-soft)")
    expect(plBox.style.borderColor).toBe("var(--ob-color-expense)")
    expect(screen.getByText(formatMoney(250_000))).toBeInTheDocument()
    expect(plBox.querySelector("svg")).not.toBeNull()
  })

  it("calls onRemove with the matching purchase id when its delete button is clicked", () => {
    const onRemove = vi.fn()
    render(
      <MetalTransactionsCards
        metal={GOLD_METAL}
        purchases={PURCHASES}
        stores={STORES}
        onRemove={onRemove}
        onEdit={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Xoá giao dịch vàng 01/08/2026" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Xoá giao dịch vàng 05/08/2026" }))

    expect(onRemove).toHaveBeenCalledWith(2)
    expect(onRemove).not.toHaveBeenCalledWith(1)
  })

  it("calls onEdit with the matching purchase object when its edit button is clicked", () => {
    const onEdit = vi.fn()
    render(
      <MetalTransactionsCards
        metal={GOLD_METAL}
        purchases={PURCHASES}
        stores={STORES}
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

  it("values each purchase against its OWN store's price, not one shared price", () => {
    const purchases: GoldPurchase[] = [
      { id: 1, date: "01/08/2026", phan: 10, buy: 900_000, store: "SJC" },
      { id: 2, date: "02/08/2026", phan: 8, buy: 900_000, store: "PNJ" },
    ]
    const stores: GoldStore[] = [
      { name: "SJC", price: "1.000.000" },
      { name: "PNJ", price: "800.000" },
    ]

    render(
      <MetalTransactionsCards
        metal={GOLD_METAL}
        purchases={purchases}
        stores={stores}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    expect(screen.getByText("SJC")).toBeInTheDocument()
    expect(screen.getByText("PNJ")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(10_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(1_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(6_400_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(800_000))).toBeInTheDocument()
  })

  it("lets the four buttons drop under the date and store on a narrow card instead of squeezing them", () => {
    render(
      <MetalTransactionsCards
        metal={GOLD_METAL}
        purchases={[PURCHASES[0]]}
        stores={STORES}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
        onGift={vi.fn()}
        onSell={vi.fn()}
      />
    )

    // jsdom không dàn trang — chỉ khoá đúng các class mà việc xuống dòng dựa vào.
    const buttons = screen.getByRole("button", { name: "Bán từ lần mua vàng 01/08/2026" }).parentElement as HTMLElement
    expect(buttons).toHaveClass("ml-auto")
    expect(buttons.parentElement).toHaveClass("flex-wrap")
  })
})
