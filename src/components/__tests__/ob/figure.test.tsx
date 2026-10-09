import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { Figure } from "@/components/ob/figure"

describe("Figure", () => {
  it("passes a string value's length to the lg font size so a long amount shrinks to stay on one line", () => {
    render(<Figure value="1.234.567.890 ₫" />)

    const value = screen.getByText("1.234.567.890 ₫")
    // "1.234.567.890 ₫" = 15 ký tự.
    expect(value.style.getPropertyValue("--ob-figure-chars")).toBe("15")
    expect(value.className).toContain("var(--ob-figure-chars,1)")
    expect(value).toHaveClass("whitespace-nowrap")
  })

  it("counts the unit's characters as part of the line", () => {
    render(<Figure value="44.000.000" unit="đ" />)

    expect(screen.getByText("44.000.000").style.getPropertyValue("--ob-figure-chars")).toBe("11")
  })

  it("uses fitChars when the value is a node it cannot count", () => {
    render(<Figure value={<span>+ 1.000.000 ₫</span>} fitChars={13} />)

    const valueLine = screen.getByText("+ 1.000.000 ₫").parentElement as HTMLElement
    expect(valueLine.style.getPropertyValue("--ob-figure-chars")).toBe("13")
  })

  it("leaves the length unset for an uncountable node without fitChars, keeping the old 13cqi size", () => {
    render(<Figure value={<span>+ 1.000.000 ₫</span>} />)

    const valueLine = screen.getByText("+ 1.000.000 ₫").parentElement as HTMLElement
    expect(valueLine.style.getPropertyValue("--ob-figure-chars")).toBe("")
  })

  it("keeps the fixed token size for size='sm'", () => {
    render(<Figure value="3" unit="/5" size="sm" />)

    const value = screen.getByText("3")
    expect(value).toHaveClass("text-[length:var(--ob-size-num)]")
    expect(value.style.getPropertyValue("--ob-figure-chars")).toBe("")
  })
})
