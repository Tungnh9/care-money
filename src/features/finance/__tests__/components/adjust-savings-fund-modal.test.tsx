import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { AdjustSavingsFundModal } from "../../components/adjust-savings-fund-modal"
import type { SavingsFund } from "../../types"

const FUND: SavingsFund = { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 }

describe("AdjustSavingsFundModal", () => {
  it("renders nothing when closed", () => {
    render(
      <AdjustSavingsFundModal open={false} fund={FUND} onOpenChange={vi.fn()} onConfirm={vi.fn()} />
    )

    expect(screen.queryByText(/Điều chỉnh số tiền quỹ/)).not.toBeInTheDocument()
  })

  it("renders the fund name, current amount and both direction buttons when open", () => {
    render(<AdjustSavingsFundModal open fund={FUND} onOpenChange={vi.fn()} onConfirm={vi.fn()} />)

    expect(document.getElementById("adjust-savings-fund-title")).toHaveTextContent(
      'Điều chỉnh số tiền quỹ "Quỹ khẩn cấp"'
    )
    expect(screen.getByText(`Hiện có: ${formatMoney(5_000_000)}`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cộng tiền" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Trừ tiền" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("defaults to Cộng tiền active, and switches active styling when Trừ tiền is clicked", () => {
    render(<AdjustSavingsFundModal open fund={FUND} onOpenChange={vi.fn()} onConfirm={vi.fn()} />)

    const addBtn = screen.getByRole("button", { name: "Cộng tiền" })
    const subtractBtn = screen.getByRole("button", { name: "Trừ tiền" })

    expect(addBtn).toHaveClass("border-[var(--ob-color-income)]", "text-[var(--ob-color-income)]")
    expect(subtractBtn).toHaveClass("border-[var(--ob-color-border)]", "text-[var(--ob-color-text-muted)]")

    fireEvent.click(subtractBtn)

    expect(subtractBtn).toHaveClass("border-[var(--ob-color-expense)]", "text-[var(--ob-color-expense)]")
    expect(addBtn).toHaveClass("border-[var(--ob-color-border)]", "text-[var(--ob-color-text-muted)]")
  })

  it("confirms in add mode with the fund's amount increased by the entered delta", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AdjustSavingsFundModal open fund={FUND} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    )

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "1000000" } })
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(onConfirm).toHaveBeenCalledWith({ ...FUND, amount: 6_000_000 })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("confirms in subtract mode with the fund's amount decreased by the entered delta", () => {
    const onConfirm = vi.fn()
    render(<AdjustSavingsFundModal open fund={FUND} onOpenChange={vi.fn()} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole("button", { name: "Trừ tiền" }))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "2000000" } })
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(onConfirm).toHaveBeenCalledWith({ ...FUND, amount: 3_000_000 })
  })

  it("clamps the subtract result at 0 instead of going negative", () => {
    const onConfirm = vi.fn()
    render(<AdjustSavingsFundModal open fund={FUND} onOpenChange={vi.fn()} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole("button", { name: "Trừ tiền" }))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "9000000" } })

    expect(screen.getByText(formatMoney(0))).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(onConfirm).toHaveBeenCalledWith({ ...FUND, amount: 0 })
  })

  it("pressing Escape closes without confirming", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AdjustSavingsFundModal open fund={FUND} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    )

    fireEvent.keyDown(window, { key: "Escape" })

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("clicking the backdrop closes without confirming", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AdjustSavingsFundModal open fund={FUND} onOpenChange={onOpenChange} onConfirm={onConfirm} />
    )

    fireEvent.click(screen.getByTestId("adjust-savings-fund-backdrop"))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("disables the confirm button while the amount field is empty", () => {
    render(<AdjustSavingsFundModal open fund={FUND} onOpenChange={vi.fn()} onConfirm={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "100000" } })

    expect(screen.getByRole("button", { name: "Xác nhận" })).not.toBeDisabled()
  })

})
