import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { MonthlyTrendChart } from "../../components/monthly-trend-chart"

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

describe("MonthlyTrendChart", () => {
  beforeEach(() => {
    stubChartMeasurement()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("renders without throwing for an empty data array", () => {
    render(<MonthlyTrendChart data={[]} />)
  })

  it("renders the month's axis tick for a single data point", () => {
    render(<MonthlyTrendChart data={[{ month: "2026-09", salary: 1_000_000, spent: 200_000 }]} />)

    expect(screen.getByText("2026-09")).toBeInTheDocument()
  })

  it("renders a legend series for salary and one for spent", () => {
    render(
      <MonthlyTrendChart
        data={[
          { month: "2026-08", salary: 0, spent: 0 },
          { month: "2026-09", salary: 1_000_000, spent: 200_000 },
        ]}
      />
    )

    expect(screen.getByText("Lương")).toBeInTheDocument()
    expect(screen.getByText("Đã chi")).toBeInTheDocument()
  })
})
