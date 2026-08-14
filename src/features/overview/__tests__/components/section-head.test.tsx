import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { SectionHead } from "../../components/section-head"

describe("SectionHead", () => {
  it("renders the title, hint and a link to the given href", () => {
    render(<SectionHead icon="wallet" title="Tài chính" hint="tài sản ròng 0 ₫" href="/finance" />)

    expect(screen.getByText("Tài chính")).toBeInTheDocument()
    expect(screen.getByText("tài sản ròng 0 ₫")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Mở/ })).toHaveAttribute("href", "/finance")
  })

  it("renders without a hint when none is given", () => {
    render(<SectionHead icon="book" title="Nhật ký" href="/journal" />)

    expect(screen.getByText("Nhật ký")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Mở/ })).toHaveAttribute("href", "/journal")
  })
})
