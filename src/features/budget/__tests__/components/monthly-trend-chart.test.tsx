import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render } from "@testing-library/react"

import { MonthlyTrendChart, isConfirmedMonth } from "../../components/monthly-trend-chart"

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

  // ApexCharts (khác recharts) không vẽ nội dung gì ra DOM một cách đồng bộ trong jsdom — nó chỉ
  // render qua next/dynamic(ssr:false) rồi tự khởi tạo canvas/SVG bằng các API trình duyệt thật
  // (đo chữ, layout...) mà jsdom không có. Vì vậy không thể assert trực tiếp lên trục/cột như
  // trước; chỉ còn smoke-test (render không throw với nhiều hình dạng data khác nhau) là khả thi
  // trong môi trường test — đã verify bằng mắt qua Playwright ở trình duyệt thật.
  it("renders without throwing for a single data point", () => {
    render(<MonthlyTrendChart data={[{ month: "2026-10", total: 20_000_000 }]} />)
  })

  it("renders without throwing for multiple data points", () => {
    render(
      <MonthlyTrendChart
        data={[
          { month: "2026-10", total: 20_000_000 },
          { month: "2026-11", total: 0 },
          { month: "2026-12", total: 5_000_000 },
        ]}
      />
    )
  })

  it("renders without throwing when a total exceeds the fixed 35tr axis max", () => {
    render(<MonthlyTrendChart data={[{ month: "2026-10", total: 50_000_000 }]} />)
  })

  it("renders without throwing when currentMonth is provided", () => {
    render(<MonthlyTrendChart data={[{ month: "2026-10", total: 20_000_000 }]} currentMonth="2026-09" />)
  })
})

// Tháng tương lai chưa có dữ liệu thật — dùng để tô màu phân biệt trực quan với tháng hiện
// tại/đã qua trong chart dự báo.
describe("isConfirmedMonth", () => {
  it("confirms the current month", () => {
    expect(isConfirmedMonth("2026-09", "2026-09")).toBe(true)
  })

  it("confirms a past month", () => {
    expect(isConfirmedMonth("2026-08", "2026-09")).toBe(true)
  })

  it("does not confirm a future month", () => {
    expect(isConfirmedMonth("2026-10", "2026-09")).toBe(false)
  })
})
