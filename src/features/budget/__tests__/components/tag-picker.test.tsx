import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { TagPicker } from "../../components/tag-picker"
import type { BudgetTag } from "@/lib/settings-storage"

const TAGS: BudgetTag[] = [
  { label: "Tiền trọ", emoji: "🏠", desc: "", tint: "#FFF0B8", on: true },
  { label: "Mua sắm", emoji: "🛍️", desc: "", tint: "#E7F6EF", on: true },
  { label: "Đã tắt", emoji: "❌", desc: "", tint: "#EEE", on: false },
]

describe("TagPicker", () => {
  it("only shows tags that are turned on", () => {
    render(<TagPicker tags={TAGS} selectedLabel={null} onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Tiền trọ/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Đã tắt/ })).not.toBeInTheDocument()
  })

  it("calls onSelect with the tag's label when an unselected pill is clicked", () => {
    const onSelect = vi.fn()
    render(<TagPicker tags={TAGS} selectedLabel={null} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole("button", { name: /Tiền trọ/ }))

    expect(onSelect).toHaveBeenCalledWith("Tiền trọ")
  })

  it("calls onSelect with null when clicking the already-selected pill (deselect)", () => {
    const onSelect = vi.fn()
    render(<TagPicker tags={TAGS} selectedLabel="Tiền trọ" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole("button", { name: /Tiền trọ/ }))

    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
