import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { AddCreditCardForm } from "../../components/add-credit-card-form"
import { CreditCardsTab } from "../../components/credit-cards-tab"
import type { CreditCard } from "../../types"

const CARD: CreditCard = {
  name: "Techcombank Visa",
  balance: 5_000_000,
  min: 500_000,
  limit: 20_000_000,
  due: "15 hàng tháng",
}

describe("CreditCardsTab", () => {
  it("shows the empty state when there are no cards", () => {
    render(<CreditCardsTab cards={[]} onAddCard={vi.fn()} onPayCard={vi.fn()} />)

    expect(
      screen.getByText("Chưa có thẻ tín dụng nào. Thêm thẻ đầu tiên để theo dõi dư nợ và hạn trả.")
    ).toBeInTheDocument()
  })

  it("renders a card's balance, due date, minimum payment and limit", () => {
    render(<CreditCardsTab cards={[CARD]} onAddCard={vi.fn()} onPayCard={vi.fn()} />)

    expect(screen.getByText(CARD.name)).toBeInTheDocument()
    expect(screen.getByText(formatMoney(CARD.balance))).toBeInTheDocument()
    expect(screen.getByText(CARD.due)).toBeInTheDocument()
    expect(screen.getByText(formatMoney(CARD.min))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(CARD.limit))).toBeInTheDocument()
  })

  it("records a one-off payment via the Ghi một lần trả form", () => {
    const onPayCard = vi.fn()
    render(<CreditCardsTab cards={[CARD]} onAddCard={vi.fn()} onPayCard={onPayCard} />)

    fireEvent.click(screen.getByRole("button", { name: "Ghi một lần trả" }))

    const amountInput = screen.getByLabelText("Số tiền trả", { exact: false })
    fireEvent.change(amountInput, { target: { value: "1000000" } })

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onPayCard).toHaveBeenCalledWith(CARD.name, 1_000_000)
  })

  it("closes the payment form without calling onPayCard when Huỷ is clicked", () => {
    const onPayCard = vi.fn()
    render(<CreditCardsTab cards={[CARD]} onAddCard={vi.fn()} onPayCard={onPayCard} />)

    fireEvent.click(screen.getByRole("button", { name: "Ghi một lần trả" }))
    fireEvent.change(screen.getByLabelText("Số tiền trả", { exact: false }), {
      target: { value: "1000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onPayCard).not.toHaveBeenCalled()
    expect(screen.queryByLabelText("Số tiền trả", { exact: false })).not.toBeInTheDocument()
  })

  it("stagger-animates its stacked cards in via the shared ob-card-grid wrapper", () => {
    render(<CreditCardsTab cards={[CARD]} onAddCard={vi.fn()} onPayCard={vi.fn()} />)

    const cardSection = screen.getByText(CARD.name).closest("section") as HTMLElement
    expect(cardSection.parentElement).toHaveClass("ob-card-grid")
  })
})

describe("AddCreditCardForm", () => {
  it("opens, fills in fields and submits a new credit card", () => {
    const onAdd = vi.fn()
    render(<AddCreditCardForm onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm thẻ tín dụng" }))

    fireEvent.change(screen.getByLabelText("Tên thẻ", { exact: false }), {
      target: { value: "VPBank Mastercard" },
    })
    fireEvent.change(screen.getByLabelText("Dư nợ hiện tại", { exact: false }), {
      target: { value: "2000000" },
    })
    fireEvent.change(screen.getByLabelText("Số tiền tối thiểu", { exact: false }), {
      target: { value: "200000" },
    })
    fireEvent.change(screen.getByLabelText("Hạn mức", { exact: false }), {
      target: { value: "15000000" },
    })
    fireEvent.change(screen.getByLabelText("Ngày đến hạn", { exact: false }), {
      target: { value: "20 hàng tháng" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAdd).toHaveBeenCalledWith({
      name: "VPBank Mastercard",
      balance: 2_000_000,
      min: 200_000,
      limit: 15_000_000,
      due: "20 hàng tháng",
    })
  })

  it("keeps Thêm disabled until name, balance, limit and due are all filled in", () => {
    render(<AddCreditCardForm onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm thẻ tín dụng" }))
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Tên thẻ", { exact: false }), {
      target: { value: "VPBank Mastercard" },
    })
    fireEvent.change(screen.getByLabelText("Dư nợ hiện tại", { exact: false }), {
      target: { value: "2000000" },
    })
    fireEvent.change(screen.getByLabelText("Hạn mức", { exact: false }), {
      target: { value: "15000000" },
    })
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Ngày đến hạn", { exact: false }), {
      target: { value: "20 hàng tháng" },
    })
    expect(screen.getByRole("button", { name: "Thêm" })).not.toBeDisabled()
  })
})
