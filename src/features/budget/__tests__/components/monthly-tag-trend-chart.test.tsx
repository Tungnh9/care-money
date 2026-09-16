import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { MonthlyTagTrendChart } from "../../components/monthly-tag-trend-chart"

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

describe("MonthlyTagTrendChart", () => {
  beforeEach(() => {
    stubChartMeasurement()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  // ApexCharts không vẽ nội dung gì ra DOM một cách đồng bộ trong jsdom (xem comment tương tự ở
  // monthly-trend-chart.test.tsx) — chỉ smoke-test được ở đây, logic pivot theo nhãn đã test kỹ
  // trong budget-calculations.test.ts (monthlyTagBreakdown).
  it("renders without throwing for an empty series array", () => {
    render(<MonthlyTagTrendChart months={["2026-09"]} series={[]} />)
  })

  it("renders without throwing for a single tag series", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-08", "2026-09"]}
        series={[{ label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000, 3_000_000] }]}
      />
    )
  })

  it("renders without throwing for multiple tag series across several months", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-06", "2026-07", "2026-08", "2026-09"]}
        series={[
          { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000, 3_000_000, 3_000_000, 3_000_000] },
          { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", data: [500_000, 0, 1_200_000, 800_000] },
        ]}
      />
    )
  })

  it("shows the total spent per tag across the whole range, plus a grand total", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-08", "2026-09"]}
        series={[
          { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000, 3_000_000] },
          { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", data: [500_000, 1_200_000] },
        ]}
      />
    )

    expect(screen.getByText("Tiền trọ")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(6_000_000))).toBeInTheDocument()
    expect(screen.getByText("Mua sắm")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(1_700_000))).toBeInTheDocument()
    expect(screen.getByText("Tổng cộng")).toBeInTheDocument()
    expect(screen.getByText(formatMoney(7_700_000))).toBeInTheDocument()
  })

  it("keeps each tag's total in a muted neutral color, distinct from the bolder grand total color", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-09"]}
        series={[
          { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000] },
          { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", data: [1_200_000] },
        ]}
      />
    )

    expect(screen.getByText(formatMoney(3_000_000))).toHaveStyle({ color: "var(--ob-color-text-muted)" })
    expect(screen.getByText(formatMoney(1_200_000))).toHaveStyle({ color: "var(--ob-color-text-muted)" })
    expect(screen.getByText(formatMoney(4_200_000))).toHaveStyle({ color: "var(--ob-color-action-strong)" })
  })

  it("renders nothing for the summary when there is no series data", () => {
    render(<MonthlyTagTrendChart months={["2026-09"]} series={[]} />)

    expect(screen.queryByText("Tổng cộng")).not.toBeInTheDocument()
  })
})
