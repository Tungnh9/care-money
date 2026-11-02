import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ShowMoreButton, collapsedRowCount } from "../../components/show-more-button"

describe("collapsedRowCount", () => {
  it("keeps the first half of the list, rounded up", () => {
    expect(collapsedRowCount(8)).toBe(4)
    expect(collapsedRowCount(12)).toBe(6)
    expect(collapsedRowCount(13)).toBe(7)
  })

  it("keeps at least 4 rows, so a list of 4 or fewer is never cut", () => {
    expect(collapsedRowCount(3)).toBe(4)
    expect(collapsedRowCount(4)).toBe(4)
    expect(collapsedRowCount(5)).toBe(4)
  })
})

describe("ShowMoreButton", () => {
  it("reads Xem thêm while collapsed and Thu gọn while expanded, and toggles on click", () => {
    const onToggle = vi.fn()
    const { rerender } = render(<ShowMoreButton expanded={false} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))
    expect(onToggle).toHaveBeenCalledTimes(1)

    rerender(<ShowMoreButton expanded onToggle={onToggle} />)
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument()
  })

  it("puts a down arrow after Xem thêm and an up arrow after Thu gọn, hidden from screen readers", () => {
    const { rerender } = render(<ShowMoreButton expanded={false} onToggle={vi.fn()} />)

    const down = screen.getByRole("button", { name: "Xem thêm" }).querySelector("svg")
    expect(down).toHaveClass("lucide-chevron-down")
    expect(down).toHaveAttribute("aria-hidden", "true")

    rerender(<ShowMoreButton expanded onToggle={vi.fn()} />)
    const up = screen.getByRole("button", { name: "Thu gọn" }).querySelector("svg")
    expect(up).toHaveClass("lucide-chevron-up")
    expect(up).toHaveAttribute("aria-hidden", "true")
  })
})
