import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { EditGoldStoreModal } from "../../components/edit-gold-store-modal"
import type { GoldStore } from "../../types"

const STORE: GoldStore = { name: "PNJ", price: "7.550.000" }

describe("EditGoldStoreModal", () => {
  it("renders nothing when store is null", () => {
    render(<EditGoldStoreModal store={null} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByText("Sửa cửa hàng")).not.toBeInTheDocument()
  })

  it("prefills the name field from the given store", () => {
    render(<EditGoldStoreModal store={STORE} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên cửa hàng")).toHaveValue("PNJ")
  })

  it("saves the edited store (keeping its price) and closes on Lưu", () => {
    const onSave = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditGoldStoreModal store={STORE} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Tên cửa hàng"), { target: { value: "PNJ Quận 1" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith({ name: "PNJ Quận 1", price: "7.550.000" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes without saving on Huỷ", () => {
    const onSave = vi.fn()
    render(<EditGoldStoreModal store={STORE} onOpenChange={vi.fn()} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onSave).not.toHaveBeenCalled()
  })

  it("disables Lưu while the name is empty", () => {
    render(<EditGoldStoreModal store={STORE} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Tên cửa hàng"), { target: { value: "" } })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("reseeds the field when switching to a different store while already open", () => {
    const OTHER: GoldStore = { name: "SJC", price: "7.600.000" }
    const { rerender } = render(<EditGoldStoreModal store={STORE} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    rerender(<EditGoldStoreModal store={OTHER} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên cửa hàng")).toHaveValue("SJC")
  })
})
