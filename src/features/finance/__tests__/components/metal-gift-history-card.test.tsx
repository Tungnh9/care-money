import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { MetalGift } from "@/lib/finance/types"
import { MetalGiftHistoryCard } from "../../components/metal-gift-history-card"
import { GOLD_METAL } from "../../metal-config"

const OLDER: MetalGift = { id: 1, purchaseId: 1, date: "05/10/2026", qty: 1, store: "SJC", buy: 900_000 }
const NEWER: MetalGift = {
  id: 2,
  purchaseId: 2,
  date: "12/10/2026",
  qty: 12,
  store: "PNJ",
  buy: 950_000,
  note: "tặng mẹ",
}

describe("MetalGiftHistoryCard", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renders nothing when nothing has been given away", () => {
    const { container } = render(
      <MetalGiftHistoryCard metal={GOLD_METAL} gifts={[]} onEdit={vi.fn()} onRemove={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("lists every gift newest first, valued at its own buy price", () => {
    render(<MetalGiftHistoryCard metal={GOLD_METAL} gifts={[OLDER, NEWER]} onEdit={vi.fn()} onRemove={vi.fn()} />)

    expect(screen.getByText("Lịch sử tặng · 2 lần")).toBeInTheDocument()
    const rows = screen.getAllByTestId("gift-history-row")
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText("Tặng 1 chỉ 2 phân")).toBeInTheDocument()
    expect(within(rows[0]).getByText("12/10/2026 · PNJ · tặng mẹ")).toBeInTheDocument()
    expect(within(rows[0]).getByText(formatMoney(12 * 950_000))).toBeInTheDocument()
    expect(within(rows[1]).getByText("Tặng 1 phân")).toBeInTheDocument()
    expect(within(rows[1]).getByText("05/10/2026 · SJC")).toBeInTheDocument()
    expect(within(rows[1]).getByText(formatMoney(900_000))).toBeInTheDocument()
  })

  it("still lists a gift whose purchase is gone, from its own snapshot", () => {
    render(
      <MetalGiftHistoryCard
        metal={GOLD_METAL}
        gifts={[{ ...OLDER, purchaseId: 99 }]}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByText("Tặng 1 phân")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(900_000))).toBeInTheDocument()
  })

  it("reports which gift to edit or undo", () => {
    const onEdit = vi.fn()
    const onRemove = vi.fn()
    render(<MetalGiftHistoryCard metal={GOLD_METAL} gifts={[OLDER, NEWER]} onEdit={onEdit} onRemove={onRemove} />)

    fireEvent.click(screen.getByRole("button", { name: "Sửa lần tặng 12/10/2026" }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần tặng 05/10/2026" }))

    expect(onEdit).toHaveBeenCalledWith(NEWER)
    expect(onRemove).toHaveBeenCalledWith(OLDER)
  })

  it("names two gifts of the same day apart for screen readers", () => {
    render(
      <MetalGiftHistoryCard
        metal={GOLD_METAL}
        gifts={[OLDER, { ...OLDER, id: 3, qty: 2 }]}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Sửa lần tặng 05/10/2026 · SJC · 1 phân" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sửa lần tặng 05/10/2026 · SJC · 2 phân" })).toBeInTheDocument()
  })

  it("masks the value of every gift while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    render(
      <MoneyVisibilityProvider>
        <MetalGiftHistoryCard metal={GOLD_METAL} gifts={[NEWER]} onEdit={vi.fn()} onRemove={vi.fn()} />
      </MoneyVisibilityProvider>
    )

    const row = screen.getByTestId("gift-history-row")
    await waitFor(() => expect(within(row).getByText("•••••••• ₫")).toBeInTheDocument())
    expect(row.textContent).not.toMatch(/\d{1,3}(\.\d{3})+/)
  })
  it("lays each row out against the card's own width: amount under the text when narrow, beside it when wide", () => {
    render(<MetalGiftHistoryCard metal={GOLD_METAL} gifts={[NEWER]} onEdit={vi.fn()} onRemove={vi.fn()} />)

    // jsdom không tính được container query — chỉ khoá đúng các class mà bố cục 2 kiểu dựa vào.
    const row = screen.getByTestId("gift-history-row")
    expect(row).toHaveClass("[grid-template-areas:'text_actions'_'amount_actions']")
    expect(row).toHaveClass("@xs:[grid-template-areas:'text_amount_actions']")
    expect(within(row).getByText(formatMoney(12 * 950_000))).toHaveClass("[grid-area:amount]")
  })
})
