import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { TagBreakdownChart } from "../../components/tag-breakdown-chart"

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
})
