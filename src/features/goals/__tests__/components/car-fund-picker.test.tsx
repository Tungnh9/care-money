import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { CarFundPicker } from "../../components/car-fund-picker"
import type { SavingsFund } from "@/features/finance/types"

const SAVINGS: SavingsFund[] = [
  { name: "Quỹ dự phòng", amount: 50_000_000, target: 100_000_000 },
  { name: "Quỹ mua xe", amount: 20_000_000, target: 300_000_000 },
]

describe("CarFundPicker", () => {
  it("shows a fallback message and no buttons when there are no savings funds", () => {
    render(<CarFundPicker savings={[]} selected={null} onSelect={vi.fn()} />)

    expect(
      screen.getByText("Chưa có quỹ tiết kiệm nào. Tạo 1 quỹ ở màn Tài chính để gắn vào đây.")
    ).toBeInTheDocument()
    expect(screen.queryAllByRole("button")).toHaveLength(0)
  })

  it("renders a pill button per fund with none active when nothing is selected", () => {
    render(<CarFundPicker savings={SAVINGS} selected={null} onSelect={vi.fn()} />)

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
    render(<CarFundPicker savings={SAVINGS} selected={null} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole("button", { name: "Quỹ mua xe" }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith("Quỹ mua xe")
  })

  it("deselects the fund (calls onSelect with null) when clicking the already-selected pill", () => {
    const onSelect = vi.fn()
    render(<CarFundPicker savings={SAVINGS} selected="Quỹ mua xe" onSelect={onSelect} />)

    const activeButton = screen.getByRole("button", { name: "Quỹ mua xe" })
    expect(activeButton).toHaveClass("border-[var(--ob-color-action)]")

    fireEvent.click(activeButton)

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
