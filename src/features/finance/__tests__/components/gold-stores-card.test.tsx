import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GoldStoresCard } from "../../components/gold-stores-card"
import type { GoldPurchase, GoldStore } from "../../types"

const STORES: GoldStore[] = [
  { name: "SJC", price: "935.000" },
  { name: "PNJ", price: "800.000" },
]

describe("GoldStoresCard", () => {
  it("shows the empty-state message when there are no stores", () => {
    render(
      <GoldStoresCard stores={[]} gold={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onSetPrice={vi.fn()} />
    )

    expect(screen.getByText(/Chưa có cửa hàng nào/)).toBeInTheDocument()
  })

  it("renders every store's name and price", () => {
    render(
      <GoldStoresCard stores={STORES} gold={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onSetPrice={vi.fn()} />
    )

    expect(screen.getByText("SJC")).toBeInTheDocument()
    expect(screen.getByDisplayValue("935.000")).toBeInTheDocument()
    expect(screen.getByText("PNJ")).toBeInTheDocument()
    expect(screen.getByDisplayValue("800.000")).toBeInTheDocument()
  })

  it("calls onSetPrice when a store's price field changes", () => {
    const onSetPrice = vi.fn()
    render(
      <GoldStoresCard stores={STORES} gold={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onSetPrice={onSetPrice} />
    )

    fireEvent.change(screen.getByDisplayValue("935.000"), { target: { value: "950.000" } })

    // Field ở chế độ group tách số ra khỏi dấu chấm ngăn cách khi ghi lại state,
    // chỉ hiện lại dấu chấm lúc render (groupVN) — giống hệt field "goldPrice" cũ.
    expect(onSetPrice).toHaveBeenCalledWith("SJC", "950000")
  })

  it("opens a rename modal and calls onUpdate keyed by the original name", () => {
    const onUpdate = vi.fn()
    render(
      <GoldStoresCard stores={STORES} gold={[]} onAdd={vi.fn()} onUpdate={onUpdate} onRemove={vi.fn()} onSetPrice={vi.fn()} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Sửa SJC" }))
    fireEvent.change(screen.getByLabelText("Tên cửa hàng", { exact: false }), {
      target: { value: "SJC 9999" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onUpdate).toHaveBeenCalledWith("SJC", { name: "SJC 9999", price: "935.000" })
  })

  it("allows removing a store that has no purchases attached", () => {
    const onRemove = vi.fn()
    render(
      <GoldStoresCard stores={STORES} gold={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={onRemove} onSetPrice={vi.fn()} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Xoá SJC" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemove).toHaveBeenCalledWith("SJC")
  })

  it("disables removing a store that still has purchases attached, with an explanatory tooltip", () => {
    const gold: GoldPurchase[] = [{ id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }]
    render(
      <GoldStoresCard stores={STORES} gold={gold} onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onSetPrice={vi.fn()} />
    )

    const disabledButton = screen.getByRole("button", { name: "Xoá SJC" })
    expect(disabledButton).toBeDisabled()
    expect(disabledButton).toHaveAttribute("title", expect.stringMatching(/vẫn còn giao dịch mua vàng/))
    expect(screen.getByRole("button", { name: "Xoá PNJ" })).not.toBeDisabled()
  })

  it("opens the add-store form, fills in fields and reports the new store on submit", () => {
    const onAdd = vi.fn()
    render(
      <GoldStoresCard stores={[]} gold={[]} onAdd={onAdd} onUpdate={vi.fn()} onRemove={vi.fn()} onSetPrice={vi.fn()} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))
    fireEvent.change(screen.getByLabelText("Tên cửa hàng", { exact: false }), {
      target: { value: "DOJI" },
    })
    fireEvent.change(screen.getByLabelText("Giá hôm nay", { exact: false }), {
      target: { value: "935000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAdd).toHaveBeenCalledWith({ name: "DOJI", price: "935000" })
  })

  it("keeps Thêm disabled until a store name is filled in", () => {
    render(
      <GoldStoresCard stores={[]} gold={[]} onAdd={vi.fn()} onUpdate={vi.fn()} onRemove={vi.fn()} onSetPrice={vi.fn()} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Tên cửa hàng", { exact: false }), {
      target: { value: "DOJI" },
    })
    expect(screen.getByRole("button", { name: "Thêm" })).not.toBeDisabled()
  })
})
