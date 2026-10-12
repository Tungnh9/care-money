import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { WorkView } from "../../components/work-view"

describe("WorkView", () => {
  it("shows the page title and a placeholder while the tools are being built", () => {
    render(<WorkView />)

    expect(screen.getByRole("heading", { level: 1, name: "Làm việc" })).toBeInTheDocument()
    expect(screen.getByText("Đang phát triển")).toBeInTheDocument()
  })
})
