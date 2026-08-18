import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { GoalCard } from "../../components/goal-card"
import type { Goal } from "../../types"

const BASE_GOAL: Goal = {
  key: "tk",
  name: "Tiết kiệm 100 triệu",
  icon: "pig",
  now: 50_000_000,
  target: 100_000_000,
  percent: 50,
  done: false,
  format: (n) => `${n.toLocaleString("vi-VN")} ₫`,
  note: "Lấy từ Quỹ dự phòng ở màn Tài chính",
  tone: "action",
}

describe("GoalCard", () => {
  it("does not celebrate while still in progress", () => {
    render(<GoalCard goal={BASE_GOAL} />)

    const card = screen.getByText("Tiết kiệm 100 triệu").closest("section")
    expect(card).not.toHaveClass("ob-tada")
    expect(card?.querySelector(".ob-conf")).not.toBeInTheDocument()
  })

  it("celebrates with a tada card and confetti once the goal is done", () => {
    const doneGoal: Goal = { ...BASE_GOAL, now: 100_000_000, percent: 100, done: true }
    render(<GoalCard goal={doneGoal} />)

    const card = screen.getByText("Tiết kiệm 100 triệu").closest("section")
    expect(card).toHaveClass("ob-tada")
    expect(card?.querySelector(".ob-conf")).toBeInTheDocument()
  })
})
