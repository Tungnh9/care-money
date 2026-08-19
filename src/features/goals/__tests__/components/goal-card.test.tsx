import { describe, it, expect } from "vitest"
import { render, screen, within } from "@testing-library/react"

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
  linked: true,
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

  it("shows the zeroed placeholder for the unlinked car goal", () => {
    const carGoal: Goal = {
      key: "car",
      name: "Mua xe ô tô",
      icon: "car",
      now: 0,
      target: 1,
      percent: 0,
      done: false,
      format: (n) => `${n.toLocaleString("vi-VN")} ₫`,
      note: "Chưa gắn quỹ tiết kiệm nào. Chọn 1 quỹ bên dưới để bắt đầu theo dõi.",
      tone: "action",
      linked: false,
    }
    render(<GoalCard goal={carGoal} />)

    const card = screen.getByText("Mua xe ô tô").closest("section") as HTMLElement
    expect(within(card).getByText("0%")).toBeInTheDocument()
    expect(within(card).getByText("Đã trích được")).toBeInTheDocument()
    expect(within(card).queryByText("0%", { selector: "span" })).not.toBeInTheDocument()
  })

  it("shows real amounts like a normal card once the car goal is linked to a fund", () => {
    const carGoal: Goal = {
      key: "car",
      name: "Mua xe ô tô",
      icon: "car",
      now: 30_000_000,
      target: 200_000_000,
      percent: 15,
      done: false,
      format: (n) => `${n.toLocaleString("vi-VN")} ₫`,
      note: 'Đang gắn với quỹ "Quỹ mua xe" ở màn Tài chính',
      tone: "action",
      linked: true,
    }
    render(<GoalCard goal={carGoal} />)

    const card = screen.getByText("Mua xe ô tô").closest("section") as HTMLElement
    expect(within(card).getByText("30.000.000 ₫")).toBeInTheDocument()
    expect(within(card).getByText("15%")).toBeInTheDocument()
    expect(within(card).getByText("trên 200.000.000 ₫")).toBeInTheDocument()
  })
})
