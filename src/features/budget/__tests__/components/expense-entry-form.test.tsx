import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { ExpenseEntryForm } from "../../components/expense-entry-form"
import type { BudgetTag } from "@/lib/settings/settings-storage"
import type { CreditCard } from "@/lib/finance/types"
import { formatMoney } from "@/lib/format"

const TAGS: BudgetTag[] = [
  { label: "Tiền trọ", emoji: "🏠", desc: "", tint: "#FFF0B8", on: true },
  { label: "Mua sắm", emoji: "🛍️", desc: "", tint: "#E7F6EF", on: true },
  { label: "Đã tắt", emoji: "❌", desc: "", tint: "#EEE", on: false },
  { label: "Quẹt thẻ", emoji: "🧾", desc: "", tint: "#F0ECFE", on: true },
  { label: "Trả nợ thẻ", emoji: "🏦", desc: "", tint: "#FFE0C7", on: true },
]
const VISA: CreditCard = { name: "Visa", balance: 2_000_000, min: 0, limit: 50_000_000, due: "15" }
const MASTER: CreditCard = { name: "Master", balance: 0, min: 0, limit: 20_000_000, due: "20" }
const SWIPE_TAG = { label: "Quẹt thẻ", emoji: "🧾", tint: "#F0ECFE" }
const PAY_TAG = { label: "Trả nợ thẻ", emoji: "🏦", tint: "#FFE0C7" }
const amountField = () => screen.getByLabelText("Số tiền", { exact: false })
const submit = () => screen.getByRole("button", { name: "Ghi khoản chi" })

describe("ExpenseEntryForm", () => {
  it("shows a note placeholder describing what to write for the expense", () => {
    render(<ExpenseEntryForm tags={TAGS} onAdd={vi.fn()} />)

    expect(screen.getByPlaceholderText("Ghi chú khoản chi")).toBeInTheDocument()
  })

  it("only shows tags that are turned on", () => {
    render(<ExpenseEntryForm tags={TAGS} onAdd={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Tiền trọ/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Đã tắt/ })).not.toBeInTheDocument()
  })

  it("disables submit until an amount is entered", () => {
    render(<ExpenseEntryForm tags={TAGS} onAdd={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Ghi khoản chi" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "50000" } })

    expect(screen.getByRole("button", { name: "Ghi khoản chi" })).not.toBeDisabled()
  })

  it("submits the amount, selected tag snapshot and note, then resets the form", () => {
    const onAdd = vi.fn(() => true)
    render(<ExpenseEntryForm tags={TAGS} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "50000" } })
    fireEvent.click(screen.getByRole("button", { name: /Tiền trọ/ }))
    fireEvent.change(screen.getByLabelText("Ghi chú", { exact: false }), { target: { value: "Tháng 9" } })
    fireEvent.click(screen.getByRole("button", { name: "Ghi khoản chi" }))

    expect(onAdd).toHaveBeenCalledWith({
      amount: 50_000,
      tag: { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8" },
      note: "Tháng 9",
    })
    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("")
  })

  it("submits tag: null when no tag is selected", () => {
    const onAdd = vi.fn()
    render(<ExpenseEntryForm tags={TAGS} onAdd={onAdd} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "10000" } })
    fireEvent.click(screen.getByRole("button", { name: "Ghi khoản chi" }))

    expect(onAdd).toHaveBeenCalledWith({ amount: 10_000, tag: null, note: undefined })
  })

  it("deselects a tag when clicking the already-active pill", () => {
    const onAdd = vi.fn()
    render(<ExpenseEntryForm tags={TAGS} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: /Tiền trọ/ }))
    fireEvent.click(screen.getByRole("button", { name: /Tiền trọ/ }))
    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "10000" } })
    fireEvent.click(screen.getByRole("button", { name: "Ghi khoản chi" }))

    expect(onAdd).toHaveBeenCalledWith({ amount: 10_000, tag: null, note: undefined })
  })

  it("blocks an amount above 999.999.999.999 đ with a hint under the field", () => {
    render(<ExpenseEntryForm tags={TAGS} onAdd={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "1000000000000" } })

    expect(screen.getByText("Tối đa 999.999.999.999 đ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ghi khoản chi" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "999999999999" } })

    expect(screen.queryByText("Tối đa 999.999.999.999 đ")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ghi khoản chi" })).not.toBeDisabled()
  })

  it("locks Quẹt thẻ and says to add a card when there is no card", () => {
    render(<ExpenseEntryForm tags={TAGS} onAdd={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Quẹt thẻ/ })).toBeDisabled()
    expect(
      screen.getByText("Chưa có thẻ tín dụng. Thêm thẻ ở trang Tài chính để ghi khoản quẹt thẻ.")
    ).toBeInTheDocument()
  })

  it("waits for the cards to be read before locking Quẹt thẻ or saying there is no card", () => {
    const onAdd = vi.fn(() => true)
    const { rerender } = render(<ExpenseEntryForm tags={TAGS} cards={[]} cardsReady={false} onAdd={onAdd} />)

    expect(screen.getByRole("button", { name: /Quẹt thẻ/ })).not.toBeDisabled()
    expect(screen.queryByText(/Chưa có thẻ tín dụng/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Trả nợ thẻ/ }))
    expect(screen.queryByText(/Chưa có thẻ tín dụng/)).not.toBeInTheDocument()
    // Chưa biết có thẻ nào thì chưa ghi được khoản gắn thẻ — ghi bây giờ sẽ thành khoản không trừ nợ.
    fireEvent.change(amountField(), { target: { value: "500000" } })
    expect(submit()).toBeDisabled()

    rerender(<ExpenseEntryForm tags={TAGS} cards={[]} cardsReady onAdd={onAdd} />)

    expect(screen.getByText("Chưa có thẻ tín dụng nên khoản này không trừ nợ thẻ.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Quẹt thẻ/ })).toBeDisabled()
    expect(submit()).not.toBeDisabled()
  })

  it("still records an ordinary expense before the cards have been read", () => {
    const onAdd = vi.fn(() => true)
    render(<ExpenseEntryForm tags={TAGS} cards={[]} cardsReady={false} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: /Mua sắm/ }))
    fireEvent.change(amountField(), { target: { value: "10000" } })
    fireEvent.click(submit())

    expect(onAdd).toHaveBeenCalledWith({
      amount: 10_000,
      tag: { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" },
      note: undefined,
    })
  })

  it("records a swipe on the only card without asking", () => {
    const onAdd = vi.fn(() => true)
    render(<ExpenseEntryForm tags={TAGS} cards={[VISA]} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: /Quẹt thẻ/ }))
    expect(screen.getByText("Thẻ: Visa")).toBeInTheDocument()
    fireEvent.change(amountField(), { target: { value: "100000" } })
    fireEvent.click(submit())

    expect(onAdd).toHaveBeenCalledWith({
      amount: 100_000,
      tag: SWIPE_TAG,
      note: undefined,
      card: { kind: "swipe", cardName: "Visa" },
    })
  })

  it("asks which card when there are two and blocks until one is picked", () => {
    const onAdd = vi.fn(() => true)
    render(<ExpenseEntryForm tags={TAGS} cards={[VISA, MASTER]} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: /Quẹt thẻ/ }))
    fireEvent.change(amountField(), { target: { value: "100000" } })
    expect(submit()).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Master" }))
    expect(submit()).not.toBeDisabled()
    fireEvent.click(submit())

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ card: { kind: "swipe", cardName: "Master" } }))
  })

  it("records a payment with its card", () => {
    const onAdd = vi.fn(() => true)
    render(<ExpenseEntryForm tags={TAGS} cards={[VISA]} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: /Trả nợ thẻ/ }))
    fireEvent.change(amountField(), { target: { value: "500000" } })
    fireEvent.click(submit())

    expect(onAdd).toHaveBeenCalledWith({
      amount: 500_000,
      tag: PAY_TAG,
      note: undefined,
      card: { kind: "payment", cardName: "Visa" },
    })
  })

  it("lets Trả nợ thẻ through without a card when there is none, saying the debt will not change", () => {
    const onAdd = vi.fn(() => true)
    render(<ExpenseEntryForm tags={TAGS} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: /Trả nợ thẻ/ }))
    expect(screen.getByText("Chưa có thẻ tín dụng nên khoản này không trừ nợ thẻ.")).toBeInTheDocument()
    fireEvent.change(amountField(), { target: { value: "500000" } })
    fireEvent.click(submit())

    expect(onAdd).toHaveBeenCalledWith({ amount: 500_000, tag: PAY_TAG, note: undefined })
  })

  it("blocks a payment above the picked card's debt", () => {
    render(<ExpenseEntryForm tags={TAGS} cards={[VISA, MASTER]} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: /Trả nợ thẻ/ }))
    fireEvent.click(screen.getByRole("button", { name: "Master" }))
    fireEvent.change(amountField(), { target: { value: "500" } })

    expect(screen.getByText(`Thẻ "Master" chỉ còn nợ ${formatMoney(0)}`)).toBeInTheDocument()
    expect(submit()).toBeDisabled()
  })

  it("masks the card's debt in the over-debt hint while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    try {
      render(
        <MoneyVisibilityProvider>
          <ExpenseEntryForm tags={TAGS} cards={[VISA, MASTER]} onAdd={vi.fn()} />
        </MoneyVisibilityProvider>
      )

      fireEvent.click(screen.getByRole("button", { name: /Trả nợ thẻ/ }))
      fireEvent.click(screen.getByRole("button", { name: "Visa" }))
      fireEvent.change(amountField(), { target: { value: "2500000" } })

      await waitFor(() =>
        expect(screen.getByText(`Thẻ "Visa" chỉ còn nợ ${formatMoney(2_000_000, true)}`)).toBeInTheDocument()
      )
      expect(document.body).not.toHaveTextContent(formatMoney(2_000_000))
      expect(submit()).toBeDisabled()
    } finally {
      window.localStorage.removeItem("hide-money")
    }
  })

  it("drops the picked card when switching to an ordinary tag", () => {
    const onAdd = vi.fn(() => true)
    render(<ExpenseEntryForm tags={TAGS} cards={[VISA]} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: /Quẹt thẻ/ }))
    fireEvent.click(screen.getByRole("button", { name: /Mua sắm/ }))
    expect(screen.queryByText("Thẻ: Visa")).not.toBeInTheDocument()
    fireEvent.change(amountField(), { target: { value: "10000" } })
    fireEvent.click(submit())

    expect(onAdd).toHaveBeenCalledWith({
      amount: 10_000,
      tag: { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" },
      note: undefined,
    })
  })

  it("keeps what was typed when the expense could not be saved", () => {
    const onAdd = vi.fn(() => false)
    render(<ExpenseEntryForm tags={TAGS} onAdd={onAdd} />)

    fireEvent.change(amountField(), { target: { value: "50000" } })
    fireEvent.click(submit())

    expect(onAdd).toHaveBeenCalled()
    expect(amountField()).toHaveValue("50.000")
  })
})
