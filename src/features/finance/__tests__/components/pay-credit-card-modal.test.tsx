import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { PayCreditCardModal } from "../../components/pay-credit-card-modal"
import type { CreditCard } from "../../types"

const CARD: CreditCard = {
  name: "Techcombank Visa",
  balance: 5_000_000,
  min: 500_000,
  limit: 20_000_000,
  due: "15 hàng tháng",
}

describe("PayCreditCardModal", () => {
  it("renders nothing when card is null", () => {
    render(<PayCreditCardModal card={null} onOpenChange={vi.fn()} onPay={vi.fn()} />)

    expect(screen.queryByText("Ghi một lần trả", { selector: "div" })).not.toBeInTheDocument()
  })

  it("shows the card name and current balance as a hint", () => {
    render(<PayCreditCardModal card={CARD} onOpenChange={vi.fn()} onPay={vi.fn()} />)

    expect(screen.getByText(CARD.name, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(`Dư nợ hiện tại ${formatMoney(CARD.balance)}`, { exact: false })).toBeInTheDocument()
  })

  it("records the payment and closes on Lưu", () => {
    const onPay = vi.fn()
    const onOpenChange = vi.fn()
    render(<PayCreditCardModal card={CARD} onOpenChange={onOpenChange} onPay={onPay} />)

    fireEvent.change(screen.getByLabelText("Số tiền trả", { exact: false }), {
      target: { value: "1000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onPay).toHaveBeenCalledWith(CARD.name, 1_000_000)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes without recording a payment on Huỷ", () => {
    const onPay = vi.fn()
    render(<PayCreditCardModal card={CARD} onOpenChange={vi.fn()} onPay={onPay} />)

    fireEvent.change(screen.getByLabelText("Số tiền trả", { exact: false }), {
      target: { value: "1000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onPay).not.toHaveBeenCalled()
  })

  it("disables Lưu while the amount field is empty", () => {
    render(<PayCreditCardModal card={CARD} onOpenChange={vi.fn()} onPay={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Số tiền trả", { exact: false }), {
      target: { value: "500000" },
    })

    expect(screen.getByRole("button", { name: "Lưu" })).not.toBeDisabled()
  })

  it("resets the amount field when switching to a different card while already open", () => {
    const OTHER: CreditCard = { name: "Vietcombank Visa", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "5 hàng tháng" }
    const { rerender } = render(<PayCreditCardModal card={CARD} onOpenChange={vi.fn()} onPay={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Số tiền trả", { exact: false }), {
      target: { value: "1000000" },
    })

    rerender(<PayCreditCardModal card={OTHER} onOpenChange={vi.fn()} onPay={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền trả", { exact: false })).toHaveValue("")
  })
})
