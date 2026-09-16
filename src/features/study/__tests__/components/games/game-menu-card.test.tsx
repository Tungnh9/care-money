import { describe, it, expect, vi } from "vitest"
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
