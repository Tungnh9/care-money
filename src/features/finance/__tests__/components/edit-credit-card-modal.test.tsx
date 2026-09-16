import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { groupVN } from "@/components/ui/field"
import { EditCreditCardModal } from "../../components/edit-credit-card-modal"
import type { CreditCard } from "../../types"

const CARD: CreditCard = {
  name: "Techcombank Visa",
  balance: 5_000_000,
  min: 500_000,
  limit: 20_000_000,
  due: "15 hàng tháng",
}

describe("EditCreditCardModal", () => {
  it("renders nothing when card is null", () => {
    render(<EditCreditCardModal card={null} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByText("Sửa thẻ tín dụng")).not.toBeInTheDocument()
  })

  it("prefills every field from the given card", () => {
    render(<EditCreditCardModal card={CARD} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên thẻ", { exact: false })).toHaveValue(CARD.name)
    expect(screen.getByLabelText("Dư nợ hiện tại", { exact: false })).toHaveValue(groupVN(CARD.balance))
    expect(screen.getByLabelText("Số tiền tối thiểu", { exact: false })).toHaveValue(groupVN(CARD.min))
    expect(screen.getByLabelText("Hạn mức", { exact: false })).toHaveValue(groupVN(CARD.limit))
    expect(screen.getByLabelText("Ngày đến hạn", { exact: false })).toHaveValue(CARD.due)
  })

  it("saves the edited card and closes on Lưu", () => {
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditCreditCardModal card={CARD} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Hạn mức", { exact: false }), { target: { value: "25000000" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith({
      name: CARD.name,
      balance: CARD.balance,
      min: CARD.min,
      limit: 25_000_000,
      due: CARD.due,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes without saving on Huỷ", () => {
    const onSave = vi.fn()
    render(<EditCreditCardModal card={CARD} onOpenChange={vi.fn()} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onSave).not.toHaveBeenCalled()
  })

  it("disables Lưu until name, balance, limit and due are filled", () => {
    render(<EditCreditCardModal card={CARD} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Tên thẻ", { exact: false }), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("prefills and preserves the card's color", () => {
    const onSave = vi.fn()
    const coloredCard: CreditCard = { ...CARD, color: "#7c3aed" }
    render(<EditCreditCardModal card={coloredCard} onOpenChange={vi.fn()} onSave={onSave} />)

    expect(screen.getByLabelText("Chọn màu cho thẻ")).toHaveValue("#7c3aed")

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ color: "#7c3aed" }))
  })

  it("reseeds fields when switching to a different card while already open", () => {
    const OTHER: CreditCard = { name: "Vietcombank Visa", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "5 hàng tháng" }
    const { rerender } = render(<EditCreditCardModal card={CARD} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    rerender(<EditCreditCardModal card={OTHER} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên thẻ", { exact: false })).toHaveValue("Vietcombank Visa")
  })
})
