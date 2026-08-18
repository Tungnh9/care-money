import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { GoalsView } from "../../components/goals-view"

describe("GoalsView", () => {
  it("stagger-animates the overall-progress and goal cards in on mount, like the Tài chính page", () => {
    render(<GoalsView />)

    const overallSection = screen.getByText("Tiến độ chung").closest("section") as HTMLElement
    expect(overallSection.parentElement).toHaveClass("ob-card-grid")
  })
})
