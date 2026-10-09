import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { AddGoldForm } from "../../components/add-gold-form"
import type { GoldStore } from "../../types"

const SJX: GoldStore = { name: "SJX", price: "880.000" }
const PNJ: GoldStore = { name: "PNJ", price: "870.000" }

function openForm() {
  fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))
}

function fillValidPurchase() {
  fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "10/08/2026" } })
  fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), { target: { value: "10" } })
  fireEvent.change(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false }), { target: { value: "900000" } })
}

describe("AddGoldForm — cửa hàng đang chọn bị đổi tên/xoá", () => {
  it("drops the picked store when it is renamed while the form is open, so no orphan purchase is saved", () => {
    const onAdd = vi.fn()
    const { rerender } = render(<AddGoldForm stores={[SJX]} onAdd={onAdd} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeEnabled()

    // Sửa tên SJX → SJC bằng bút chì ở thẻ cửa hàng phía trên, trong lúc form vẫn mở.
    rerender(<AddGoldForm stores={[{ ...SJX, name: "SJC" }]} onAdd={onAdd} />)

    expect(screen.getByRole("button", { name: "SJC" })).not.toHaveClass("border-[var(--ob-color-action)]")
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "SJC" }))
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).toHaveBeenCalledWith({ date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" })
  })

  it("drops the picked store when it is deleted while the form is open", () => {
    const onAdd = vi.fn()
    const { rerender } = render(<AddGoldForm stores={[SJX, PNJ]} onAdd={onAdd} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()

    // Cửa hàng chưa có lần mua nào nên xoá được ngay cả khi đang được chọn trong form.
    rerender(<AddGoldForm stores={[PNJ]} onAdd={onAdd} />)

    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).not.toHaveBeenCalled()
  })
})

describe("AddGoldForm — ngày mua", () => {
  it("accepts another way of writing a real date and saves it as dd/mm/yyyy", () => {
    const onAdd = vi.fn()
    render(<AddGoldForm stores={[SJX]} onAdd={onAdd} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "2026-08-10" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAdd).toHaveBeenCalledWith({ date: "10/08/2026", phan: 10, buy: 900_000, store: "SJX" })
  })

  it("explains the expected format and blocks Thêm for a 2-digit year or a day that does not exist", () => {
    render(<AddGoldForm stores={[SJX]} onAdd={vi.fn()} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "10/08/26" } })
    expect(screen.getByText("Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "31/02/2026" } })
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
  })
})

describe("AddGoldForm — khối lượng", () => {
  it("explains and blocks a fractional or comma-decimal khối lượng instead of silently disabling Thêm", () => {
    render(<AddGoldForm stores={[SJX]} onAdd={vi.fn()} />)
    openForm()
    fireEvent.click(screen.getByRole("button", { name: "SJX" }))
    fillValidPurchase()
    expect(screen.getByText("10 phân = 1 chỉ")).toBeInTheDocument()

    for (const value of ["12.3", "1,5"]) {
      fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), { target: { value } })
      expect(screen.getByText("Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    }
  })
})
