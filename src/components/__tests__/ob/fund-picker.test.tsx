import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { FundPicker } from "@/components/ob/fund-picker"
import type { SavingsFund } from "@/lib/finance/types"

const SAVINGS: SavingsFund[] = [
  { name: "Quỹ dự phòng", amount: 50_000_000, target: 100_000_000 },
  { name: "Quỹ mua xe", amount: 20_000_000, target: 300_000_000 },
]

describe("FundPicker", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("shows a fallback message and no buttons when there are no savings funds", () => {
    render(<FundPicker savings={[]} selected={null} onSelect={vi.fn()} />)

    expect(
      screen.getByText("Chưa có quỹ tiết kiệm nào. Tạo 1 quỹ ở màn Tài chính để gắn vào đây.")
    ).toBeInTheDocument()
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })

  it("renders a pill button per fund with none active when nothing is selected", () => {
    render(<FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />)

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(2)
    expect(screen.getByRole("button", { name: "Quỹ dự phòng" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Quỹ mua xe" })).toBeInTheDocument()
    buttons.forEach((button) => {
      expect(button).toHaveClass("border-[var(--ob-color-border)]")
      expect(button).not.toHaveClass("border-[var(--ob-color-action)]")
    })
  })

  it("selects a fund by name when clicking an unselected pill", () => {
    const onSelect = vi.fn()
    render(<FundPicker savings={SAVINGS} selected={null} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole("button", { name: "Quỹ mua xe" }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith("Quỹ mua xe")
  })

  it("deselects the fund (calls onSelect with null) when clicking the already-selected pill", () => {
    const onSelect = vi.fn()
    render(<FundPicker savings={SAVINGS} selected="Quỹ mua xe" onSelect={onSelect} />)

    const activeButton = screen.getByRole("button", { name: "Quỹ mua xe" })
    expect(activeButton).toHaveClass("border-[var(--ob-color-action)]")

    fireEvent.click(activeButton)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it("shows each fund's compact balance on its chip while the chip's name stays the fund name", () => {
    render(<FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />)

    expect(within(screen.getByRole("button", { name: "Quỹ dự phòng" })).getByText("50tr")).toBeInTheDocument()
    expect(within(screen.getByRole("button", { name: "Quỹ mua xe" })).getByText("20tr")).toBeInTheDocument()
  })

  it("reads the full balance to screen readers as the chip's description", () => {
    render(<FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Quỹ dự phòng" })).toHaveAccessibleDescription("Số dư 50.000.000 ₫")
    expect(screen.getByRole("button", { name: "Quỹ mua xe" })).toHaveAccessibleDescription("Số dư 20.000.000 ₫")
  })

  it("masks the balances while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    render(
      <MoneyVisibilityProvider>
        <FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />
      </MoneyVisibilityProvider>
    )

    const chip = screen.getByRole("button", { name: "Quỹ dự phòng" })
    await waitFor(() => expect(within(chip).getByText("•••")).toBeInTheDocument())
    expect(screen.queryByText("50tr")).not.toBeInTheDocument()
    expect(chip).toHaveAccessibleDescription("Số dư •••••••• ₫")
  })

  it("gives each chip its own description even when fund names contain spaces or quotes", () => {
    const savings: SavingsFund[] = [
      { name: 'Quỹ "A" mới', amount: 50_000, target: 1 },
      { name: "Quỹ B b", amount: 500_000, target: 1 },
    ]
    render(<FundPicker savings={savings} selected={null} onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { name: 'Quỹ "A" mới' })).toHaveAccessibleDescription("Số dư 50.000 ₫")
    expect(screen.getByRole("button", { name: "Quỹ B b" })).toHaveAccessibleDescription("Số dư 500.000 ₫")
    expect(within(screen.getByRole("button", { name: 'Quỹ "A" mới' })).getByText("50xu")).toBeInTheDocument()
  })

  it("switches from no funds to funds without errors", () => {
    const { rerender } = render(<FundPicker savings={[]} selected={null} onSelect={vi.fn()} />)
    rerender(<FundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />)

    expect(screen.getAllByRole("button")).toHaveLength(2)
  })
})
