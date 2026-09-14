import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { TagBreakdownChart } from "../../components/tag-breakdown-chart"
import { formatMoney } from "@/lib/format"

function stubChartMeasurement() {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width: 600,
    height: 300,
    top: 0,
    left: 0,
    right: 600,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect)
}

describe("TagBreakdownChart", () => {
  beforeEach(() => {
    stubChartMeasurement()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("shows an empty-state message instead of an empty chart when there is no data", () => {
    render(<TagBreakdownChart data={[]} />)

    expect(screen.getByText(/Chưa có khoản chi nào/)).toBeInTheDocument()
  })

  it("renders without throwing and reflects each tag's label", () => {
    render(
      <TagBreakdownChart
        data={[
          { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 100_000 },
          { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", total: 50_000 },
        ]}
      />
    )

    expect(screen.getByText("Tiền trọ")).toBeInTheDocument()
    expect(screen.getByText("Mua sắm")).toBeInTheDocument()
  })

  it("shows the total spent amount in the center of the donut", () => {
    render(
      <TagBreakdownChart
        data={[
          { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 100_000 },
          { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", total: 50_000 },
        ]}
      />
    )

    expect(screen.getByText("Tổng chi")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(150_000))).toBeInTheDocument()
  })

  it("lists each tag as its own row with a percentage and its amount", () => {
    render(
      <TagBreakdownChart
        data={[
          { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 100_000 },
          { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", total: 50_000 },
        ]}
      />
    )

    expect(screen.getByText("67%")).toBeInTheDocument()
    expect(screen.getByText("33%")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(100_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(50_000))).toBeInTheDocument()
  })

  it("colors each list row's dot from the vivid chart palette, not the tag's own pale tint", () => {
    render(<TagBreakdownChart data={[{ label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 100_000 }]} />)

    const dot = document.querySelector('[data-testid="tag-color-dot"]')
    expect(dot).not.toBeNull()
    expect(dot).not.toHaveStyle({ backgroundColor: "#FFF0B8" })
  })
})
