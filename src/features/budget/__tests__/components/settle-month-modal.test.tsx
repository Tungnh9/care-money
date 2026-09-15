import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { SettleMonthModal } from "../../components/settle-month-modal"
import type { SavingsFund } from "@/features/finance/types"

const SAVINGS: SavingsFund[] = [
  { name: "Quỹ A", amount: 100_000, target: 500_000 },
  { name: "Quỹ B", amount: 20_000, target: 500_000 },
]

describe("SettleMonthModal", () => {
  it("frames a positive remaining as a surplus and pre-fills the full amount", () => {
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={200_000} savings={SAVINGS} onConfirm={vi.fn()} />
    )

    expect(screen.getByText(/Bạn dư/)).toBeInTheDocument()
    expect(screen.getByText("200.000 ₫", { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("200.000")
  })

  it("titles the modal with the specific month being settled", () => {
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-07" remaining={200_000} savings={SAVINGS} onConfirm={vi.fn()} />
    )

    expect(screen.getByText("Tất toán Tháng 7, 2026")).toBeInTheDocument()
  })

  it("frames a negative remaining as a deficit", () => {
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={-150_000} savings={SAVINGS} onConfirm={vi.fn()} />
    )

    expect(screen.getByText(/Bạn đang thiếu/)).toBeInTheDocument()
    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("150.000")
  })

  it("shows the empty-state and no confirm action when there are no savings funds", () => {
    render(<SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={200_000} savings={[]} onConfirm={vi.fn()} />)

    expect(screen.getByText(/Chưa có quỹ tiết kiệm nào/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Xác nhận" })).not.toBeInTheDocument()
  })

  it("disables confirm until a fund is selected", () => {
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={200_000} savings={SAVINGS} onConfirm={vi.fn()} />
    )

    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))

    expect(screen.getByRole("button", { name: "Xác nhận" })).not.toBeDisabled()
  })

  it("disables confirm when the typed amount exceeds the remaining surplus", () => {
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={200_000} savings={SAVINGS} onConfirm={vi.fn()} />
    )
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "300000" } })

    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
  })

  it("disables confirm and warns when the withdraw amount exceeds the selected fund's balance", () => {
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={-150_000} savings={SAVINGS} onConfirm={vi.fn()} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Quỹ B" }))

    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
    expect(screen.getByText(/không đủ/)).toBeInTheDocument()
  })

  it("live-updates the fund's new balance preview as the amount changes", () => {
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={200_000} savings={SAVINGS} onConfirm={vi.fn()} />
    )
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "50000" } })

    expect(screen.getByText("150.000 ₫", { exact: false })).toBeInTheDocument()
  })

  it("calls onConfirm with the fund name, direction and amount", () => {
    const onConfirm = vi.fn()
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={200_000} savings={SAVINGS} onConfirm={onConfirm} />
    )
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))

    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(onConfirm).toHaveBeenCalledWith("Quỹ A", "deposit", 200_000)
  })

  it("calls onConfirm with direction withdraw for a deficit", () => {
    const onConfirm = vi.fn()
    render(
      <SettleMonthModal open onOpenChange={vi.fn()} month="2026-09" remaining={-50_000} savings={SAVINGS} onConfirm={onConfirm} />
    )
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))

    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(onConfirm).toHaveBeenCalledWith("Quỹ A", "withdraw", 50_000)
  })
})
