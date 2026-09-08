import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GoldStorePicker } from "../../components/gold-store-picker"
import type { GoldStore } from "../../types"

const STORES: GoldStore[] = [
  { name: "SJC", price: "935.000" },
  { name: "PNJ", price: "800.000" },
]

describe("GoldStorePicker", () => {
  it("shows a hint to add a store first when there are none yet", () => {
    render(<GoldStorePicker stores={[]} selected="" onSelect={vi.fn()} />)

    expect(screen.getByText(/Chưa có cửa hàng nào/)).toBeInTheDocument()
  })

  it("renders a pill per store and highlights the selected one", () => {
    render(<GoldStorePicker stores={STORES} selected="PNJ" onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { name: "SJC" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "PNJ" })).toHaveClass("border-[var(--ob-color-action)]")
    expect(screen.getByRole("button", { name: "SJC" })).not.toHaveClass("border-[var(--ob-color-action)]")
  })

  it("reports the clicked store's name, and does not allow deselecting back to none", () => {
    const onSelect = vi.fn()
    render(<GoldStorePicker stores={STORES} selected="SJC" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole("button", { name: "SJC" }))

    expect(onSelect).toHaveBeenCalledWith("SJC")
  })
})
