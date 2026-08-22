import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { Progress } from "../../ui/progress"

describe("Progress", () => {
  it("colors the indicator with the reward token by default", () => {
    const { container } = render(<Progress value={50} />)

    const indicator = container.querySelector('[data-slot="progress-indicator"]')
    expect(indicator).toHaveClass("bg-[var(--ob-color-reward)]")
  })

  it("colors the indicator with the action token when tone is action", () => {
    const { container } = render(<Progress value={50} tone="action" />)

    const indicator = container.querySelector('[data-slot="progress-indicator"]')
    expect(indicator).toHaveClass("bg-[var(--ob-color-action)]")
  })

  it("colors the indicator with the expense token when tone is expense, for over-limit warnings", () => {
    const { container } = render(<Progress value={50} tone="expense" />)

    const indicator = container.querySelector('[data-slot="progress-indicator"]')
    expect(indicator).toHaveClass("bg-[var(--ob-color-expense)]")
  })
})
