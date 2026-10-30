import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import type { LifePlan } from "@/lib/life-plan/types"
import { PlanBar } from "../../components/plan-bar"

const PLANS: LifePlan[] = [
  { id: 1, title: "Mua nhà", targetYear: 2030, status: "planned" },
  { id: 2, title: "Học bơi", targetYear: 2027, status: "done", doneDay: "2026-05-01" },
]

describe("PlanBar", () => {
  it("marks the plan being filtered on and hands back the plan clicked", () => {
    const onToggle = vi.fn()
    render(<PlanBar plans={PLANS} activeId={2} onToggle={onToggle} />)
    const bar = screen.getByRole("group", { name: "Lọc theo kế hoạch" })

    expect(within(bar).getByRole("button", { name: "Mua nhà" })).toHaveAttribute("aria-pressed", "false")
    expect(within(bar).getByRole("button", { name: "Học bơi" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(within(bar).getByRole("button", { name: "Mua nhà" }))
    fireEvent.click(within(bar).getByRole("button", { name: "Học bơi" }))

    expect(onToggle.mock.calls).toEqual([[1], [2]])
  })

  it("renders nothing when there is no plan", () => {
    const { container } = render(<PlanBar plans={[]} activeId={null} onToggle={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
