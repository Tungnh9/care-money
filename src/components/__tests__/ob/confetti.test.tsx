import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { Confetti } from "@/components/ob/confetti"

describe("Confetti", () => {
  it("renders the default number of pieces", () => {
    const { container } = render(<Confetti />)

    expect(container.querySelectorAll(".ob-conf")).toHaveLength(16)
  })

  it("renders a custom number of pieces", () => {
    const { container } = render(<Confetti n={5} />)

    expect(container.querySelectorAll(".ob-conf")).toHaveLength(5)
  })

  it("is hidden from assistive tech", () => {
    const { container } = render(<Confetti n={3} />)

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true")
  })
})
