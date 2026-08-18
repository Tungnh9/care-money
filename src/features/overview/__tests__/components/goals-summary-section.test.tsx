import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import type { MiniGoal } from "../../overview-calculations"
import { GoalsSummarySection } from "../../components/goals-summary-section"

const GOALS: MiniGoal[] = [
  { name: "Tiết kiệm 100 triệu", icon: "pig", percent: 50 },
  { name: "10 chỉ vàng", icon: "gold", percent: 20 },
  { name: "Mua xe ô tô", icon: "car", percent: 0 },
]

describe("GoalsSummarySection", () => {
  it("renders every mini goal's name and percent", () => {
    render(<GoalsSummarySection goals={GOALS} savings={[]} />)

    for (const goal of GOALS) {
      expect(screen.getByText(goal.name)).toBeInTheDocument()
      expect(screen.getByText(`${goal.percent}%`)).toBeInTheDocument()
    }
  })

  it("labels the card with the current goal count", () => {
    render(<GoalsSummarySection goals={GOALS} savings={[]} />)

    expect(screen.getByText(`${GOALS.length} mục tiêu đang chạy`)).toBeInTheDocument()
  })

  it("lays out mini goals with an auto-fit grid so they share one row when there's room", () => {
    const { container } = render(<GoalsSummarySection goals={GOALS} savings={[]} />)

    const grid = container.querySelector(".grid")
    expect(grid).toHaveClass("grid-cols-[repeat(auto-fit,minmax(150px,1fr))]")
  })

  it("shows the empty-state message when there are no savings funds", () => {
    render(<GoalsSummarySection goals={GOALS} savings={[]} />)

    expect(
      screen.getByText("Chưa có quỹ tiết kiệm nào. Thêm ở màn Tài chính.")
    ).toBeInTheDocument()
  })

  it("lists real savings funds with their progress toward target", () => {
    render(
      <GoalsSummarySection
        goals={GOALS}
        savings={[{ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 }]}
      />
    )

    expect(screen.getByText("Quỹ dự phòng")).toBeInTheDocument()
    expect(
      screen.getByText(`${formatMoney(5_000_000)} / ${formatMoney(20_000_000)}`)
    ).toBeInTheDocument()
  })
})
