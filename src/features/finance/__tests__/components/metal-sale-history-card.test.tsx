import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { MetalSale, SavingsFund } from "@/lib/finance/types"
import { MetalSaleHistoryCard } from "../../components/metal-sale-history-card"
import { GOLD_METAL } from "../../metal-config"

// Lãi 1.000.000 − 1 × 900.000 = + 100.000.
const OLDER: MetalSale = {
  id: 1,
  purchaseId: 1,
  date: "05/10/2026",
  qty: 1,
  store: "SJC",
  buy: 900_000,
  received: 1_000_000,
  fundName: "Quỹ A",
}
// Lỗ 11.000.000 − 12 × 950.000 = − 400.000; sổ nhận tiền đã bị xoá.
const NEWER: MetalSale = {
  id: 2,
  purchaseId: 2,
  date: "12/10/2026",
  qty: 12,
  store: "PNJ",
  buy: 950_000,
  received: 11_000_000,
  fundName: "Quỹ B",
  fundRemoved: true,
  note: "bán bớt",
}

// "Quỹ A" còn đủ tiền để rút lại 1.000.000 của OLDER; "Quỹ B" của NEWER đã bị xoá.
const SAVINGS: SavingsFund[] = [{ name: "Quỹ A", amount: 5_000_000, target: 0 }]

describe("MetalSaleHistoryCard", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renders nothing when nothing has been sold", () => {
    const { container } = render(
      <MetalSaleHistoryCard metal={GOLD_METAL} savings={SAVINGS} sales={[]} onRemove={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("lists every sale newest first, with what was received and the profit or loss it locked in", () => {
    render(<MetalSaleHistoryCard metal={GOLD_METAL} savings={SAVINGS} sales={[OLDER, NEWER]} onRemove={vi.fn()} />)

    expect(screen.getByText("Lịch sử bán · 2 lần")).toBeInTheDocument()
    const rows = screen.getAllByTestId("sale-history-row")
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText("Bán 1 chỉ 2 phân")).toBeInTheDocument()
    expect(within(rows[0]).getByText("12/10/2026 · PNJ · vào Quỹ B (đã xoá) · bán bớt")).toBeInTheDocument()
    expect(within(rows[0]).getByText(formatMoney(11_000_000))).toBeInTheDocument()
    expect(within(rows[0]).getByText(formatMoney(400_000)).closest("[data-tone]")).toHaveAttribute("data-tone", "loss")
    expect(within(rows[1]).getByText("Bán 1 phân")).toBeInTheDocument()
    expect(within(rows[1]).getByText("05/10/2026 · SJC · vào Quỹ A")).toBeInTheDocument()
    expect(within(rows[1]).getByText(formatMoney(1_000_000))).toBeInTheDocument()
    expect(within(rows[1]).getByText(formatMoney(100_000)).closest("[data-tone]")).toHaveAttribute("data-tone", "gain")
  })

  it("totals the profit or loss locked in by every sale", () => {
    render(<MetalSaleHistoryCard metal={GOLD_METAL} savings={SAVINGS} sales={[OLDER, NEWER]} onRemove={vi.fn()} />)

    const total = screen.getByText(/Lãi\/lỗ đã chốt/)
    expect(total).toHaveTextContent(`Lãi/lỗ đã chốt: − ${formatMoney(300_000)}`)
    expect(total).toHaveAttribute("data-tone", "loss")
  })

  it("reports which sale to undo, and locks undo for a sale whose fund was deleted", () => {
    const onRemove = vi.fn()
    render(<MetalSaleHistoryCard metal={GOLD_METAL} savings={SAVINGS} sales={[OLDER, NEWER]} onRemove={onRemove} />)

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần bán 05/10/2026" }))
    expect(onRemove).toHaveBeenCalledWith(OLDER)

    const locked = screen.getByRole("button", { name: "Huỷ lần bán 12/10/2026" })
    expect(locked).toBeDisabled()
    expect(locked).toHaveAttribute("title", 'Sổ "Quỹ B" đã bị xoá — không huỷ được lần bán này.')
  })

  it("locks undo, and says why on screen, when the fund no longer holds what was received", () => {
    render(
      <MetalSaleHistoryCard
        metal={GOLD_METAL}
        savings={[{ name: "Quỹ A", amount: 999_999, target: 0 }]}
        sales={[OLDER]}
        onRemove={vi.fn()}
      />
    )

    const reason = 'Sổ "Quỹ A" không còn đủ tiền để rút lại số đã nhận — không huỷ được lần bán này.'
    const button = screen.getByRole("button", { name: "Huỷ lần bán 05/10/2026" })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute("title", reason)
    // Điện thoại không hiện title — lý do phải nằm ngay trên dòng.
    expect(within(screen.getByTestId("sale-history-row")).getByText(reason)).toBeInTheDocument()
  })

  it("names two sales of the same day apart for screen readers", () => {
    render(
      <MetalSaleHistoryCard
        metal={GOLD_METAL}
        savings={SAVINGS}
        sales={[OLDER, { ...OLDER, id: 3, qty: 2 }]}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Huỷ lần bán 05/10/2026 · SJC · 1 phân" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Huỷ lần bán 05/10/2026 · SJC · 2 phân" })).toBeInTheDocument()
  })

  it("masks the money received and the profit or loss while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    render(
      <MoneyVisibilityProvider>
        <MetalSaleHistoryCard metal={GOLD_METAL} savings={SAVINGS} sales={[OLDER, NEWER]} onRemove={vi.fn()} />
      </MoneyVisibilityProvider>
    )

    await waitFor(() => expect(screen.getByText(/Lãi\/lỗ đã chốt/)).toHaveTextContent("•••••••• ₫"))
    expect(screen.getByText(/Lãi\/lỗ đã chốt/).textContent).not.toMatch(/\d/)
    for (const row of screen.getAllByTestId("sale-history-row")) {
      expect(row.textContent).not.toMatch(/\d{1,3}(\.\d{3})+/)
    }
  })

  it("lays each row out against the card's own width: money under the text when narrow, beside it when wide", () => {
    render(<MetalSaleHistoryCard metal={GOLD_METAL} savings={SAVINGS} sales={[OLDER]} onRemove={vi.fn()} />)

    // jsdom không tính được container query — chỉ khoá đúng các class mà bố cục 2 kiểu dựa vào.
    const row = screen.getByTestId("sale-history-row")
    expect(row).toHaveClass("[grid-template-areas:'text_actions'_'amount_actions']")
    expect(row).toHaveClass("@xs:[grid-template-areas:'text_amount_actions']")
    expect(within(row).getByText(formatMoney(1_000_000)).closest(".\\[grid-area\\:amount\\]")).not.toBeNull()
  })
})
