import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { Monkey } from "@/components/ob/monkey"

describe("Monkey", () => {
  it.each(["wave", "cheer", "banana", "book", "sleep", "focus"] as const)(
    "renders the %s pose without crashing",
    (pose) => {
      const { container } = render(<Monkey pose={pose} />)

      expect(container.querySelector("svg")).toBeInTheDocument()
    }
  )

  it("renders at the given size", () => {
    const { container } = render(<Monkey size={40} />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("width", "40")
    expect(svg).toHaveAttribute("height", "40")
  })

  it("is hidden from assistive tech", () => {
    const { container } = render(<Monkey />)

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })
})
