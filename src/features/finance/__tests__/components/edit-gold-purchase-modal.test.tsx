import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { groupVN } from "@/components/ui/field"
import { EditGoldPurchaseModal } from "../../components/edit-gold-purchase-modal"
import type { GoldPurchase, GoldStore } from "../../types"

const PURCHASE: GoldPurchase = { id: 1, date: "10/08/2026", phan: 2, buy: 7_500_000, store: "PNJ" }
const STORES: GoldStore[] = [{ name: "PNJ", price: "7.550.000" }, { name: "SJC", price: "7.600.000" }]

describe("EditGoldPurchaseModal", () => {
  it("renders nothing when purchase is null", () => {
    render(<EditGoldPurchaseModal purchase={null} stores={STORES} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByText("Sửa lần mua vàng")).not.toBeInTheDocument()
  })

  it("prefills every field from the given purchase", () => {
    render(<EditGoldPurchaseModal purchase={PURCHASE} stores={STORES} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Ngày mua", { exact: false })).toHaveValue("10/08/2026")
    expect(screen.getByLabelText("Khối lượng", { exact: false })).toHaveValue(String(PURCHASE.phan))
    expect(screen.getByLabelText("Giá mua", { exact: false })).toHaveValue(groupVN(PURCHASE.buy))
    expect(screen.getByRole("button", { name: "PNJ" })).toHaveClass("border-[var(--ob-color-action)]")
  })

  it("saves the edited purchase and closes on Lưu", () => {
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditGoldPurchaseModal purchase={PURCHASE} stores={STORES} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Khối lượng", { exact: false }), { target: { value: "5" } })
    fireEvent.click(screen.getByRole("button", { name: "SJC" }))
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(1, { date: "10/08/2026", phan: 5, buy: PURCHASE.buy, store: "SJC" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes without saving on Huỷ", () => {
    const onSave = vi.fn()
    render(<EditGoldPurchaseModal purchase={PURCHASE} stores={STORES} onOpenChange={vi.fn()} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onSave).not.toHaveBeenCalled()
  })

  it("disables Lưu while date, phan, buy or store is empty", () => {
    render(<EditGoldPurchaseModal purchase={PURCHASE} stores={STORES} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("reseeds fields when switching to a different purchase while already open", () => {
    const OTHER: GoldPurchase = { id: 2, date: "01/09/2026", phan: 1, buy: 7_550_000, store: "SJC" }
    const { rerender } = render(
      <EditGoldPurchaseModal purchase={PURCHASE} stores={STORES} onOpenChange={vi.fn()} onSave={vi.fn()} />
    )

    rerender(<EditGoldPurchaseModal purchase={OTHER} stores={STORES} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Ngày mua", { exact: false })).toHaveValue("01/09/2026")
  })
})
