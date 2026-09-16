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
    render(<TagsCard tags={TAGS} onToggle={vi.fn()} />)

    expect(screen.getByText("Tiền trọ")).toBeInTheDocument()
    expect(screen.getByText("Tiền nhà, tiền phòng hàng tháng")).toBeInTheDocument()
    expect(screen.getByText("Mua sắm")).toBeInTheDocument()
  })

  it("shows the empty state when there are no tags", () => {
    render(<TagsCard tags={[]} onToggle={vi.fn()} />)

    expect(screen.getByText(/Chưa có nhãn nào/)).toBeInTheDocument()
  })

  it("calls onToggle with the tag's index when its switch is clicked", () => {
    const onToggle = vi.fn()
    render(<TagsCard tags={TAGS} onToggle={onToggle} />)

    fireEvent.click(screen.getAllByRole("switch")[1])

    expect(onToggle).toHaveBeenCalledWith(1)
  })

  it("does not render edit, delete or add-tag controls", () => {
    render(<TagsCard tags={TAGS} onToggle={vi.fn()} />)

    expect(screen.queryByRole("button", { name: /Sửa/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Xoá/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Thêm nhãn" })).not.toBeInTheDocument()
  })
})
