import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { SavingsTab } from "../../components/savings-tab"

describe("SavingsTab", () => {
  it("renders the empty-state message when there are no funds", () => {
    render(<SavingsTab savings={[]} onAddSavingsFund={vi.fn()} />)

    expect(screen.getByText(/Chưa có quỹ tiết kiệm nào/)).toBeInTheDocument()
  })

  it("renders each fund's name, progress amounts and note", () => {
    render(
      <SavingsTab
        savings={[
          { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 },
          {
            name: "Quỹ du lịch",
            amount: 2_000_000,
            target: 10_000_000,
            note: "Đi Đà Lạt cuối năm",
          },
        ]}
        onAddSavingsFund={vi.fn()}
      />
    )

    expect(screen.getByText("Quỹ khẩn cấp")).toBeInTheDocument()
    expect(screen.getByText("Quỹ du lịch")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(5_000_000))).toBeInTheDocument()
    expect(screen.getByText(`trên ${formatMoney(20_000_000)}`)).toBeInTheDocument()
    expect(screen.getByText(formatMoney(2_000_000))).toBeInTheDocument()
    expect(screen.getByText(`trên ${formatMoney(10_000_000)}`)).toBeInTheDocument()
    expect(screen.getByText("Đi Đà Lạt cuối năm")).toBeInTheDocument()
    expect(
      screen.getByText(`Tiết kiệm · ${formatMoney(7_000_000)}`)
    ).toBeInTheDocument()
  })

  it("opens the add-fund form and reports the new fund on submit", () => {
    const onAddSavingsFund = vi.fn()
    render(<SavingsTab savings={[]} onAddSavingsFund={onAddSavingsFund} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm quỹ tiết kiệm" }))

    fireEvent.change(screen.getByLabelText("Tên quỹ"), {
      target: { value: "Quỹ hưu trí" },
    })
    fireEvent.change(screen.getByLabelText("Số tiền hiện có", { exact: false }), {
      target: { value: "500000" },
    })
    fireEvent.change(screen.getByLabelText("Mục tiêu", { exact: false }), {
      target: { value: "2000000" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAddSavingsFund).toHaveBeenCalledWith({
      name: "Quỹ hưu trí",
      amount: 500_000,
      target: 2_000_000,
    })
  })
})
