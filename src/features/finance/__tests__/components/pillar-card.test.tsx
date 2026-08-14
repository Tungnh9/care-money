import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { PillarCard } from "../../components/pillar-card"

describe("PillarCard", () => {
  it("renders the icon, formatted amount, label and hint for arbitrary props", () => {
    render(
      <PillarCard icon="pig" label="Tiết kiệm" amount={12_345_678} hint="3 quỹ đang chạy" />
    )

    const icon = screen.getByAltText("")
    expect(icon.getAttribute("src")).toContain("pig.svg")
    expect(screen.getByText("Tiết kiệm")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(12_345_678))).toBeInTheDocument()
    expect(screen.getByText("3 quỹ đang chạy")).toBeInTheDocument()
  })

  it("swaps the icon and content for a different pillar", () => {
    render(<PillarCard icon="chart" label="Đầu tư" amount={0} hint="Chưa có khoản nào" />)

    const icon = screen.getByAltText("")
    expect(icon.getAttribute("src")).toContain("chart.svg")
    expect(screen.getByText("Đầu tư")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(0))).toBeInTheDocument()
    expect(screen.getByText("Chưa có khoản nào")).toBeInTheDocument()
  })
})
