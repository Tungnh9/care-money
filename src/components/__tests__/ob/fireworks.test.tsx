import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { Fireworks } from "@/components/ob/fireworks"

describe("Fireworks", () => {
  it("renders 3 bursts of the default 8 sparks each", () => {
    const { container } = render(<Fireworks />)

    expect(container.querySelectorAll(".ob-firework-spark")).toHaveLength(24)
  })

  it("renders a custom number of sparks per burst", () => {
    const { container } = render(<Fireworks sparksPerBurst={4} />)

    expect(container.querySelectorAll(".ob-firework-spark")).toHaveLength(12)
  })

  it("is hidden from assistive tech", () => {
    const { container } = render(<Fireworks />)

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
  })
})
