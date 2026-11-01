import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, render, waitFor } from "@testing-library/react"

import { MonthlyTagTrendChart } from "../../components/monthly-tag-trend-chart"

interface ClickOptions {
  dataPointIndex?: number
  labelIndex?: number
}

interface ApexProps {
  options: {
    colors?: string[]
    chart?: {
      events?: {
        dataPointSelection?: (event: unknown, chart: unknown, options: ClickOptions) => void
        xAxisLabelClick?: (event: unknown, chart: unknown, options: ClickOptions) => void
      }
    }
    xaxis?: { labels?: { style?: { colors?: string[] } } }
  }
}

const apex = vi.hoisted(() => ({ calls: [] as ApexProps[] }))
vi.mock("react-apexcharts", () => ({
  default: (props: ApexProps) => {
    apex.calls.push(props)
    return null
  },
}))

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

const MONTHS = ["2026-07", "2026-08", "2026-09"]
const SERIES = [
  { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000, 3_000_000, 3_000_000] },
  { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", data: [0, 1_200_000, 800_000] },
]

// Props lần vẽ gần nhất — ApexCharts được nạp qua next/dynamic nên chờ nó vẽ xong mới đọc.
async function lastChartProps(): Promise<ApexProps> {
  await waitFor(() => expect(apex.calls.length).toBeGreaterThan(0))
  return apex.calls.at(-1) as ApexProps
}

describe("MonthlyTagTrendChart", () => {
  beforeEach(() => {
    stubChartMeasurement()
    apex.calls.length = 0
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  // jsdom không vẽ được ApexCharts thật (chart chỉ khởi tạo qua next/dynamic bằng API trình duyệt mà jsdom không có)
  // — các test dưới đọc props chart nhận được; logic pivot theo nhãn đã test kỹ trong budget-calculations.test.ts
  // (monthlyTagBreakdown).
  it("renders without throwing for an empty series array", () => {
    render(<MonthlyTagTrendChart months={["2026-09"]} series={[]} />)
  })

  it("renders without throwing for multiple tag series across several months", () => {
    render(<MonthlyTagTrendChart months={MONTHS} series={SERIES} />)
  })

  it("paints the stacked bars from the given colour map", async () => {
    render(
      <MonthlyTagTrendChart
        months={MONTHS}
        series={SERIES}
        colors={
          new Map([
            ["Tiền trọ", "#22B8CF"],
            ["Mua sắm", "#FCC419"],
          ])
        }
      />
    )

    expect((await lastChartProps()).options.colors).toEqual(["#22B8CF", "#FCC419"])
  })

  it("picks the month of a clicked column", async () => {
    const onSelectMonth = vi.fn()
    render(<MonthlyTagTrendChart months={MONTHS} series={SERIES} onSelectMonth={onSelectMonth} />)

    const { events } = (await lastChartProps()).options.chart ?? {}
    act(() => events?.dataPointSelection?.(null, null, { dataPointIndex: 1 }))

    expect(onSelectMonth).toHaveBeenCalledWith("2026-08")
  })

  it("picks a month by its axis label, which is the only way to reach a month with no column", async () => {
    const onSelectMonth = vi.fn()
    render(<MonthlyTagTrendChart months={MONTHS} series={SERIES} onSelectMonth={onSelectMonth} />)

    const { events } = (await lastChartProps()).options.chart ?? {}
    act(() => events?.xAxisLabelClick?.(null, null, { labelIndex: 0 }))

    expect(onSelectMonth).toHaveBeenCalledWith("2026-07")
  })

  it("ignores a click that lands on no month", async () => {
    const onSelectMonth = vi.fn()
    render(<MonthlyTagTrendChart months={MONTHS} series={SERIES} onSelectMonth={onSelectMonth} />)

    const { events } = (await lastChartProps()).options.chart ?? {}
    act(() => events?.dataPointSelection?.(null, null, { dataPointIndex: -1 }))
    act(() => events?.xAxisLabelClick?.(null, null, {}))

    expect(onSelectMonth).not.toHaveBeenCalled()
  })

  it("marks the month shown in the summary card on the axis", async () => {
    render(<MonthlyTagTrendChart months={MONTHS} series={SERIES} selectedMonth="2026-08" />)

    expect((await lastChartProps()).options.xaxis?.labels?.style?.colors).toEqual(["#7a6455", "#a63a05", "#7a6455"])
  })
})
