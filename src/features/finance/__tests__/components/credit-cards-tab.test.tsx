import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { groupVN } from "@/components/ui/field"
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
    render(
      <CreditCardsTab
        cards={[]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    )

    expect(
      screen.getByText("Chưa có thẻ tín dụng nào. Thêm thẻ đầu tiên để theo dõi dư nợ và hạn trả.")
    ).toBeInTheDocument()
  })

  it("renders a card's balance, due date, minimum payment and limit", () => {
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    )

    expect(screen.getByText(CARD.name)).toBeInTheDocument()
    expect(screen.getByText(formatMoney(CARD.balance))).toBeInTheDocument()
    expect(screen.getByText(CARD.due)).toBeInTheDocument()
    expect(screen.getByText(formatMoney(CARD.min))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(CARD.limit))).toBeInTheDocument()
  })

  it("records a one-off payment via the Ghi một lần trả form", () => {
    const onPayCard = vi.fn()
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={onPayCard}
        onUpdateCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Ghi một lần trả" }))

    const amountInput = screen.getByLabelText("Số tiền trả", { exact: false })
    fireEvent.change(amountInput, { target: { value: "1000000" } })

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onPayCard).toHaveBeenCalledWith(CARD.name, 1_000_000)
  })

  it("closes the payment form without calling onPayCard when Huỷ is clicked", () => {
    const onPayCard = vi.fn()
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={onPayCard}
        onUpdateCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Ghi một lần trả" }))
    fireEvent.change(screen.getByLabelText("Số tiền trả", { exact: false }), {
      target: { value: "1000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onPayCard).not.toHaveBeenCalled()
    expect(screen.queryByLabelText("Số tiền trả", { exact: false })).not.toBeInTheDocument()
  })

  it("stagger-animates its stacked cards in via the shared ob-card-grid wrapper", () => {
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    )

    const cardSection = screen.getByText(CARD.name).closest("section") as HTMLElement
    expect(cardSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("shows an edit button per card, opens a prefilled form on click, and reports the update on Lưu", () => {
    const onUpdateCard = vi.fn()
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={onUpdateCard}
        onRemoveCard={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: `Sửa thẻ ${CARD.name}` }))

    expect(screen.getByLabelText("Tên thẻ", { exact: false })).toHaveValue(CARD.name)
    expect(screen.getByLabelText("Dư nợ hiện tại", { exact: false })).toHaveValue(
      groupVN(CARD.balance)
    )
    expect(screen.getByLabelText("Số tiền tối thiểu", { exact: false })).toHaveValue(
      groupVN(CARD.min)
    )
    expect(screen.getByLabelText("Hạn mức", { exact: false })).toHaveValue(groupVN(CARD.limit))
    expect(screen.getByLabelText("Ngày đến hạn", { exact: false })).toHaveValue(CARD.due)

    fireEvent.change(screen.getByLabelText("Hạn mức", { exact: false }), {
      target: { value: "25000000" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onUpdateCard).toHaveBeenCalledWith(CARD.name, {
      name: CARD.name,
      balance: CARD.balance,
      min: CARD.min,
      limit: 25_000_000,
      due: CARD.due,
    })
  })

  it("closes the edit form without saving when Huỷ is clicked", () => {
    const onUpdateCard = vi.fn()
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={onUpdateCard}
        onRemoveCard={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: `Sửa thẻ ${CARD.name}` }))
    fireEvent.change(screen.getByLabelText("Hạn mức", { exact: false }), {
      target: { value: "25000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onUpdateCard).not.toHaveBeenCalled()
    expect(screen.queryByLabelText("Tên thẻ", { exact: false })).not.toBeInTheDocument()
  })

  it("opens a confirm dialog without calling onRemoveCard when the delete button is clicked", () => {
    const onRemoveCard = vi.fn()
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={vi.fn()}
        onRemoveCard={onRemoveCard}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: `Xoá thẻ ${CARD.name}` }))

    expect(screen.getByText("Xoá thẻ tín dụng?")).toBeInTheDocument()
    const boldName = screen.getByText(CARD.name, { selector: "strong" })
    expect(boldName).toBeInTheDocument()
    expect(boldName.closest("p")).toHaveTextContent(`Xoá thẻ "${CARD.name}" sẽ không thể hoàn tác.`)
    expect(onRemoveCard).not.toHaveBeenCalled()
  })

  it("calls onRemoveCard with the card's name when the confirm dialog's Xoá button is clicked", () => {
    const onRemoveCard = vi.fn()
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={vi.fn()}
        onRemoveCard={onRemoveCard}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: `Xoá thẻ ${CARD.name}` }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemoveCard).toHaveBeenCalledWith(CARD.name)
  })

  it("closes the confirm dialog without calling onRemoveCard when Huỷ is clicked", () => {
    const onRemoveCard = vi.fn()
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={vi.fn()}
        onRemoveCard={onRemoveCard}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: `Xoá thẻ ${CARD.name}` }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onRemoveCard).not.toHaveBeenCalled()
    expect(screen.queryByText("Xoá thẻ tín dụng?")).not.toBeInTheDocument()
  })

  it("opening Sửa closes an already-open Ghi một lần trả form, and vice versa", () => {
    render(
      <CreditCardsTab
        cards={[CARD]}
        onAddCard={vi.fn()}
        onPayCard={vi.fn()}
        onUpdateCard={vi.fn()}
        onRemoveCard={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Ghi một lần trả" }))
    expect(screen.getByLabelText("Số tiền trả", { exact: false })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: `Sửa thẻ ${CARD.name}` }))
    expect(screen.queryByLabelText("Số tiền trả", { exact: false })).not.toBeInTheDocument()
    expect(screen.getByLabelText("Tên thẻ", { exact: false })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Ghi một lần trả" }))
    expect(screen.queryByLabelText("Tên thẻ", { exact: false })).not.toBeInTheDocument()
    expect(screen.getByLabelText("Số tiền trả", { exact: false })).toBeInTheDocument()
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
