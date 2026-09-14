import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { TagsCard } from "../../components/tags-card"
import type { BudgetTag } from "@/lib/settings-storage"

const TAGS: BudgetTag[] = [
  { label: "Tiền trọ", emoji: "🏠", desc: "Tiền nhà, tiền phòng hàng tháng", tint: "#FFF0B8", on: true },
  { label: "Mua sắm", emoji: "🛍️", desc: "Quần áo, đồ dùng, linh tinh", tint: "#E7F6EF", on: false },
]

describe("TagsCard", () => {
  it("renders each tag's label, description and on/off state", () => {
    render(<TagsCard tags={TAGS} onToggle={vi.fn()} onRemove={vi.fn()} onAdd={vi.fn()} />)

    expect(screen.getByText("Tiền trọ")).toBeInTheDocument()
    expect(screen.getByText("Tiền nhà, tiền phòng hàng tháng")).toBeInTheDocument()
    expect(screen.getByText("Mua sắm")).toBeInTheDocument()
  })

  it("shows the empty state when there are no tags", () => {
    render(<TagsCard tags={[]} onToggle={vi.fn()} onRemove={vi.fn()} onAdd={vi.fn()} />)

    expect(screen.getByText(/Chưa có nhãn nào/)).toBeInTheDocument()
  })

  it("calls onToggle with the tag's index when its switch is clicked", () => {
    const onToggle = vi.fn()
    render(<TagsCard tags={TAGS} onToggle={onToggle} onRemove={vi.fn()} onAdd={vi.fn()} />)

    fireEvent.click(screen.getAllByRole("switch")[1])

    expect(onToggle).toHaveBeenCalledWith(1)
  })

  it("calls onRemove with the tag's index when its delete button is clicked", () => {
    const onRemove = vi.fn()
    render(<TagsCard tags={TAGS} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá Tiền trọ" }))

    expect(onRemove).toHaveBeenCalledWith(0)
  })
})
