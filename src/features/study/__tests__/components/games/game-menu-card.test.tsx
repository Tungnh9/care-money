import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { GameMenuCard } from "../../../components/games/game-menu-card"

const HIGH_SCORES = { quiz: 8, match: 6, spelling: 10 }
const STREAK = { count: 3, lastPlayedDayKey: "2026-09-15" }

describe("GameMenuCard", () => {
  it("shows each game's high score", () => {
    render(<GameMenuCard highScores={HIGH_SCORES} streak={STREAK} onSelect={vi.fn()} />)

    expect(screen.getByText("Kỷ lục: 8/10")).toBeInTheDocument()
    expect(screen.getByText("Kỷ lục: 6/10")).toBeInTheDocument()
    expect(screen.getByText("Kỷ lục: 10/10")).toBeInTheDocument()
  })

  it("calls onSelect with the right game type when a card is clicked", () => {
    const onSelect = vi.fn()
    render(<GameMenuCard highScores={HIGH_SCORES} streak={STREAK} onSelect={onSelect} />)

    fireEvent.click(screen.getByText("Ghép cặp"))

    expect(onSelect).toHaveBeenCalledWith("match")
  })
})

// Ô lửa đang sáng của <Streak> tô chữ bằng màu action; ô tắt dùng màu xám mờ.
function litFlames(): number {
  return screen.getAllByText("🔥").filter((flame) => flame.style.color === "var(--ob-color-action)").length
}

describe("GameMenuCard — chuỗi ngày chơi", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 29, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("lights one flame per day of a streak that is still alive", () => {
    render(
      <GameMenuCard highScores={HIGH_SCORES} streak={{ count: 3, lastPlayedDayKey: "2026-09-28" }} onSelect={vi.fn()} />
    )

    expect(litFlames()).toBe(3)
  })

  it("shows no lit flame once the streak is broken (regression: the old streak stayed lit after missed days)", () => {
    render(
      <GameMenuCard highScores={HIGH_SCORES} streak={{ count: 6, lastPlayedDayKey: "2026-09-20" }} onSelect={vi.fn()} />
    )

    expect(litFlames()).toBe(0)
  })
})
