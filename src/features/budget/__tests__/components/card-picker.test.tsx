import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { CardPicker } from "../../components/card-picker"
import type { CreditCard } from "@/lib/finance/types"

const CARDS: CreditCard[] = [
  { name: "Visa", balance: 2_000_000, min: 0, limit: 50_000_000, due: "15" },
  { name: "Master card", balance: 0, min: 0, limit: 20_000_000, due: "20" },
]

describe("CardPicker", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("names each button by the card name and describes it with the full debt", () => {
    render(<CardPicker cards={CARDS} selected={null} onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Visa" })).toHaveAccessibleDescription("Dư nợ 2.000.000 ₫")
    expect(screen.getByRole("button", { name: "Master card" })).toHaveAccessibleDescription("Dư nợ 0 ₫")
    expect(within(screen.getByRole("button", { name: "Visa" })).getByText("2tr")).toBeInTheDocument()
  })

  it("selects a card and deselects the active one", () => {
    const onSelect = vi.fn()
    const { rerender } = render(<CardPicker cards={CARDS} selected={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("button", { name: "Visa" }))
    expect(onSelect).toHaveBeenLastCalledWith("Visa")

    rerender(<CardPicker cards={CARDS} selected="Visa" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("button", { name: "Visa" }))
    expect(onSelect).toHaveBeenLastCalledWith(null)
  })

  it("hides the debt while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    render(
      <MoneyVisibilityProvider>
        <CardPicker cards={CARDS} selected={null} onSelect={vi.fn()} />
      </MoneyVisibilityProvider>
    )

    const chip = screen.getByRole("button", { name: "Visa" })
    await waitFor(() => expect(within(chip).getByText("•••")).toBeInTheDocument())
    expect(screen.queryByText("2tr")).not.toBeInTheDocument()
    expect(chip).toHaveAccessibleDescription("Dư nợ •••••••• ₫")
  })
})
