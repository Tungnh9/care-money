import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"

import { Snake } from "@/components/ob/snake"

describe("Snake", () => {
  it.each(["wave", "cheer", "banana", "book", "sleep", "focus", "calc"] as const)(
    "renders the %s pose without crashing",
    (pose) => {
      const { container } = render(<Snake pose={pose} />)

      expect(container.querySelector("svg")).toBeInTheDocument()
    }
  )

  it("renders at the given size", () => {
    const { container } = render(<Snake size={40} />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("width", "40")
    expect(svg).toHaveAttribute("height", "40")
  })

  it("is hidden from assistive tech", () => {
    const { container } = render(<Snake />)

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("names its pose on the svg, so a screen can tell which one it shows", () => {
    const { container } = render(<Snake pose="focus" />)

    expect(container.querySelector("svg")).toHaveAttribute("data-pose", "focus")
  })

  it("waves its tail only in the wave pose", () => {
    const { container, rerender } = render(<Snake pose="wave" />)
    expect(container.querySelector(".ob-wave-tail")).toBeInTheDocument()

    rerender(<Snake pose="cheer" />)
    expect(container.querySelector(".ob-wave-tail")).not.toBeInTheDocument()
  })

  it("closes its eyes and snores in the sleep pose instead of blinking", () => {
    const { container } = render(<Snake pose="sleep" />)

    expect(container.querySelector(".ob-blink")).not.toBeInTheDocument()
    expect(container.querySelectorAll(".ob-z")).toHaveLength(3)
  })

  it("turns the lines drawn outside its body light on a dark background, so they do not sink into it", () => {
    const { container, rerender } = render(<Snake pose="sleep" />)
    expect(container.querySelector(".ob-z")?.parentElement).toHaveAttribute("fill", "var(--ob-vo-900)")

    rerender(<Snake pose="sleep" dark />)
    expect(container.querySelector(".ob-z")?.parentElement).toHaveAttribute("fill", "var(--ob-kem)")

    rerender(<Snake pose="focus" dark />)
    const headphones = container.querySelectorAll('[stroke="var(--ob-kem)"], [fill="var(--ob-kem)"]')
    expect(headphones.length).toBeGreaterThanOrEqual(3)
  })

  it("lightens the brown banana stem on its head on a dark background, where the brown would vanish", () => {
    const { container, rerender } = render(<Snake pose="wave" />)
    // Ở dáng vẫy chào, cuống chuối là nét duy nhất màu nâu (các chấm nâu là hình tròn tô màu, không phải nét).
    expect(container.querySelectorAll('[stroke="var(--ob-chuoi-700)"]')).toHaveLength(1)

    rerender(<Snake pose="wave" dark />)
    expect(container.querySelectorAll('[stroke="var(--ob-chuoi-700)"]')).toHaveLength(0)
    expect(container.querySelectorAll('[stroke="var(--ob-chuoi-500)"]')).toHaveLength(1)
  })
})
