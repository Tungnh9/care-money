import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

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

  it("treats a NaN value (vd. quỹ 0 ₫ trên mục tiêu 0 ₫) as 0%, not as an indeterminate full bar", () => {
    const { container } = render(<Progress value={Number.NaN} />)

    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("aria-valuenow", "0")
    expect(bar).not.toHaveAttribute("data-indeterminate")
    const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement
    expect(indicator.style.width).toBe("0%")
  })

  it("still clamps out-of-range values, including Infinity, to 0–100", () => {
    const { rerender } = render(<Progress value={-20} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")

    rerender(<Progress value={250} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")

    // Quỹ đã có tiền nhưng mục tiêu 0 → amount / 0 = Infinity → thanh đầy, giữ đúng như trước.
    rerender(<Progress value={Number.POSITIVE_INFINITY} />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })
})
