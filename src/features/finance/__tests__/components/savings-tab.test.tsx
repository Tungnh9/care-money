import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { SavingsTab } from "../../components/savings-tab"

describe("SavingsTab", () => {
  it("renders the empty-state message when there are no funds", () => {
    render(
      <SavingsTab
        savings={[]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
      />
    )

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
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
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
    render(
      <SavingsTab
        savings={[]}
        onAddSavingsFund={onAddSavingsFund}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
      />
    )

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

  it("shows an edit button per fund, opens a prefilled form on click, and reports the update on Lưu", () => {
    const onUpdateSavingsFund = vi.fn()
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
        onUpdateSavingsFund={onUpdateSavingsFund}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Sửa Quỹ khẩn cấp" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Sửa Quỹ du lịch" }))

    expect(screen.getByLabelText("Tên quỹ")).toHaveValue("Quỹ du lịch")
    expect(screen.getByLabelText("Số tiền hiện có", { exact: false })).toHaveValue(
      "2.000.000"
    )
    expect(screen.getByLabelText("Mục tiêu", { exact: false })).toHaveValue("10.000.000")
    expect(screen.getByLabelText("Ghi chú", { exact: false })).toHaveValue(
      "Đi Đà Lạt cuối năm"
    )

    fireEvent.change(screen.getByLabelText("Số tiền hiện có", { exact: false }), {
      target: { value: "3000000" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onUpdateSavingsFund).toHaveBeenCalledWith("Quỹ du lịch", {
      name: "Quỹ du lịch",
      amount: 3_000_000,
      target: 10_000_000,
      note: "Đi Đà Lạt cuối năm",
    })
  })

  it("closes the edit form without saving when Huỷ is clicked", () => {
    const onUpdateSavingsFund = vi.fn()
    render(
      <SavingsTab
        savings={[{ name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 }]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={onUpdateSavingsFund}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Sửa Quỹ khẩn cấp" }))
    expect(screen.getByLabelText("Tên quỹ")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onUpdateSavingsFund).not.toHaveBeenCalled()
    expect(screen.queryByLabelText("Tên quỹ")).not.toBeInTheDocument()
  })

  it("shows a confirm dialog instead of deleting immediately when the delete button is clicked", () => {
    const onRemoveSavingsFund = vi.fn()
    render(
      <SavingsTab
        savings={[
          { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 },
          { name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000 },
        ]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={onRemoveSavingsFund}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Xoá Quỹ khẩn cấp" }))

    expect(screen.getByText("Xoá quỹ tiết kiệm?")).toBeInTheDocument()
    const boldName = screen.getByText("Quỹ khẩn cấp", { selector: "strong" })
    expect(boldName).toBeInTheDocument()
    expect(boldName.closest("p")).toHaveTextContent('Xoá "Quỹ khẩn cấp" sẽ không thể hoàn tác.')
    expect(onRemoveSavingsFund).not.toHaveBeenCalled()
  })

  it("calls onRemoveSavingsFund with the fund's name when confirming the delete dialog", () => {
    const onRemoveSavingsFund = vi.fn()
    render(
      <SavingsTab
        savings={[
          { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 },
          { name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000 },
        ]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={onRemoveSavingsFund}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Xoá Quỹ khẩn cấp" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemoveSavingsFund).toHaveBeenCalledWith("Quỹ khẩn cấp")
    expect(screen.queryByText("Xoá quỹ tiết kiệm?")).not.toBeInTheDocument()
  })

  it("closes the confirm dialog without deleting when Huỷ is clicked", () => {
    const onRemoveSavingsFund = vi.fn()
    render(
      <SavingsTab
        savings={[{ name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 }]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={onRemoveSavingsFund}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Xoá Quỹ khẩn cấp" }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onRemoveSavingsFund).not.toHaveBeenCalled()
    expect(screen.queryByText("Xoá quỹ tiết kiệm?")).not.toBeInTheDocument()
  })

  it("shows an adjust button per fund and opens the quick add/subtract modal on click", () => {
    render(
      <SavingsTab
        savings={[
          { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 },
          { name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000 },
        ]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Điều chỉnh số dư Quỹ khẩn cấp" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Điều chỉnh số dư Quỹ du lịch" }))

    expect(document.getElementById("adjust-savings-fund-title")).toHaveTextContent(
      'Điều chỉnh số tiền quỹ "Quỹ du lịch"'
    )
  })

  it("confirming the quick adjust modal reports the fund's name and updated amount", () => {
    const onUpdateSavingsFund = vi.fn()
    render(
      <SavingsTab
        savings={[{ name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 }]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={onUpdateSavingsFund}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Điều chỉnh số dư Quỹ khẩn cấp" }))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "1000000" } })
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(onUpdateSavingsFund).toHaveBeenCalledWith("Quỹ khẩn cấp", {
      name: "Quỹ khẩn cấp",
      amount: 6_000_000,
      target: 20_000_000,
    })
    expect(screen.queryByText(/Điều chỉnh số tiền quỹ/)).not.toBeInTheDocument()
  })

  it("opening the adjust modal for a different fund does not carry over previously entered amount/direction", () => {
    render(
      <SavingsTab
        savings={[
          { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 },
          { name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000 },
        ]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Điều chỉnh số dư Quỹ khẩn cấp" }))
    fireEvent.click(screen.getByRole("button", { name: "Trừ tiền" }))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "500000" } })
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    fireEvent.click(screen.getByRole("button", { name: "Điều chỉnh số dư Quỹ du lịch" }))

    expect(screen.getByRole("textbox")).toHaveValue("")
    expect(screen.getByRole("button", { name: "Cộng tiền" })).toHaveClass("border-[var(--ob-color-income)]")
  })

  it("opening Sửa on a different fund closes the previously open edit form", () => {
    render(
      <SavingsTab
        savings={[
          { name: "Quỹ khẩn cấp", amount: 5_000_000, target: 20_000_000 },
          { name: "Quỹ du lịch", amount: 2_000_000, target: 10_000_000 },
        ]}
        onAddSavingsFund={vi.fn()}
        onUpdateSavingsFund={vi.fn()}
        onRemoveSavingsFund={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Sửa Quỹ khẩn cấp" }))
    expect(screen.getByLabelText("Tên quỹ")).toHaveValue("Quỹ khẩn cấp")

    fireEvent.click(screen.getByRole("button", { name: "Sửa Quỹ du lịch" }))
    expect(screen.getAllByLabelText("Tên quỹ")).toHaveLength(1)
    expect(screen.getByLabelText("Tên quỹ")).toHaveValue("Quỹ du lịch")
  })
})
