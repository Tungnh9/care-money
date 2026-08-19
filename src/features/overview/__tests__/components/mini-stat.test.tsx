import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { MiniStat } from "../../components/mini-stat"

describe("MiniStat", () => {
  it("renders the icon, label, value and hint", () => {
    render(<MiniStat icon="pig" label="Tiết kiệm" value="5.000.000 ₫" hint="1 quỹ" />)

    const icon = screen.getByAltText("")
    expect(icon.getAttribute("src")).toContain("pig.svg")
    expect(screen.getByText("Tiết kiệm")).toBeInTheDocument()
    expect(screen.getByText("5.000.000 ₫")).toBeInTheDocument()
    expect(screen.getByText("1 quỹ")).toBeInTheDocument()
  })

  it("renders without a hint when none is given", () => {
    render(<MiniStat icon="card" label="Nợ thẻ" value="0 ₫" />)

    expect(screen.getByText("Nợ thẻ")).toBeInTheDocument()
    expect(screen.getByText("0 ₫")).toBeInTheDocument()
  })

  it("applies the given color to the value, and falls back to the default text color otherwise", () => {
    render(<MiniStat icon="card" label="Nợ thẻ" value="2.000.000 ₫" color="var(--ob-color-expense)" />)
    expect(screen.getByText("2.000.000 ₫")).toHaveStyle({ color: "var(--ob-color-expense)" })

    render(<MiniStat icon="pig" label="Tiết kiệm" value="0 ₫" />)
    expect(screen.getByText("0 ₫")).toHaveStyle({ color: "var(--ob-color-text)" })
  })

  it("renders a ReactNode hint as-is, so the caller can style just part of it (e.g. bold+colored lời/lỗ) independently", () => {
    render(
      <MiniStat
        icon="gold"
        label="Vàng"
        value="1.455.000 ₫"
        hint={
          <>
            1 phân ·{" "}
            <span className="font-bold" style={{ color: "var(--ob-color-income)" }}>
              lời 255.000 ₫
            </span>
          </>
        }
      />
    )
    expect(screen.getByText("1 phân", { exact: false })).toBeInTheDocument()
    const highlighted = screen.getByText("lời 255.000 ₫")
    expect(highlighted).toHaveStyle({ color: "var(--ob-color-income)" })
    expect(highlighted).toHaveClass("font-bold")
  })
})
