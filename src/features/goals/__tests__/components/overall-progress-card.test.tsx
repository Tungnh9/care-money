import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { OverallProgressCard } from "../../components/overall-progress-card"
import type { Goal } from "../../types"

function buildGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    key: "tk",
    name: "Tiết kiệm 100 triệu",
    icon: "pig",
    now: 44_000_000,
    target: 100_000_000,
    percent: 44,
    done: false,
    format: (n) => `${n.toLocaleString("vi-VN")} ₫`,
    note: "Lấy từ Quỹ dự phòng ở màn Tài chính",
    tone: "action",
    linked: true,
    ...overrides,
  }
}

const GOALS: Goal[] = [
  buildGoal(),
  buildGoal({ key: "vang", name: "Tích lũy 10 chỉ vàng", icon: "gold", percent: 60 }),
  buildGoal({ key: "xe", name: "Mua xe ô tô", icon: "car", percent: 0 }),
]

describe("OverallProgressCard", () => {
  it("lays out the mini progress bars with an auto-fit grid so they share one row when there's room", () => {
    const { container } = render(<OverallProgressCard goals={GOALS} avg={35} />)

    const grid = container.querySelector(".grid")
    expect(grid).toHaveClass("grid-cols-[repeat(auto-fit,minmax(150px,1fr))]")
  })
})
