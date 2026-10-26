import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"

import { wholeText } from "@/test/whole-text"
import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { MonthlyTagTrendChart } from "../../components/monthly-tag-trend-chart"

const apex = vi.hoisted(() => ({ calls: [] as { options: { colors?: string[] } }[] }))
vi.mock("react-apexcharts", () => ({
  default: (props: { options: { colors?: string[] } }) => {
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

  it("colours each tag's dot in the summary from the given colour map", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-09"]}
        series={[
          { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000] },
          { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", data: [1_200_000] },
        ]}
        colors={
          new Map([
            ["Tiền trọ", "#22B8CF"],
            ["Mua sắm", "#FCC419"],
          ])
        }
      />
    )

    const dots = screen.getAllByTestId("tag-trend-dot")
    expect(dots[0]).toHaveStyle({ backgroundColor: "#22B8CF" })
    expect(dots[1]).toHaveStyle({ backgroundColor: "#FCC419" })
  })

  it("paints the stacked bars with the same colour map as the summary dots", async () => {
    apex.calls.length = 0
    render(
      <MonthlyTagTrendChart
        months={["2026-09"]}
        series={[
          { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000] },
          { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", data: [1_200_000] },
        ]}
        colors={
          new Map([
            ["Tiền trọ", "#22B8CF"],
            ["Mua sắm", "#FCC419"],
          ])
        }
      />
    )

    await waitFor(() => expect(apex.calls.length).toBeGreaterThan(0))
    expect(apex.calls.at(-1)?.options.colors).toEqual(["#22B8CF", "#FCC419"])
  })

  it("adds a Quẹt thẻ row showing 0 out of the swiped total, outside the grand total", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-08", "2026-09"]}
        series={[{ label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000, 3_000_000] }]}
        swiped={{ label: "Quẹt thẻ", emoji: "🧾", total: 1_200_000 }}
      />
    )

    const row = screen.getByTestId("tag-trend-swiped")
    expect(row).toHaveTextContent("Quẹt thẻ")
    expect(row).toHaveTextContent("🧾")
    expect(within(row).getByText(wholeText(`${formatMoney(0)} / ${formatMoney(1_200_000)}`))).toBeInTheDocument()
    expect(screen.getByText("Tổng cộng").parentElement).toHaveTextContent(formatMoney(6_000_000))
  })

  it("keeps the Quẹt thẻ row's 0 ₫ muted like the tag totals and paints the swiped total red", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-09"]}
        series={[{ label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000] }]}
        swiped={{ label: "Quẹt thẻ", emoji: "🧾", total: 1_200_000 }}
      />
    )

    const swipeAmount = screen.getByText(wholeText(`${formatMoney(0)} / ${formatMoney(1_200_000)}`))
    expect(swipeAmount).toHaveStyle({ color: "var(--ob-color-text-muted)" })
    expect(within(swipeAmount).getByText(formatMoney(1_200_000))).toHaveStyle({ color: "var(--ob-color-expense)" })
    expect(screen.getAllByText(formatMoney(3_000_000))[0]).toHaveStyle({ color: "var(--ob-color-text-muted)" })
  })

  it("paints the Quẹt thẻ dot the same red as its swiped total, not the colour map's colour for that label", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-09"]}
        series={[{ label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000] }]}
        colors={
          new Map([
            ["Tiền trọ", "#22B8CF"],
            ["Quẹt thẻ", "#1C7ED6"],
          ])
        }
        swiped={{ label: "Quẹt thẻ", emoji: "🧾", total: 1_200_000 }}
      />
    )

    const row = screen.getByTestId("tag-trend-swiped")
    // Chấm và số đã quẹt cùng 1 token đỏ; màu xanh của "Quẹt thẻ" trong bảng màu nhãn bị bỏ qua.
    expect(within(row).getByText(formatMoney(1_200_000))).toHaveStyle({ color: "var(--ob-color-expense)" })
    expect(within(row).getByTestId("tag-trend-dot")).toHaveStyle({ backgroundColor: "var(--ob-color-expense)" })
    const tagDot = screen.getAllByTestId("tag-trend-dot").find((dot) => !row.contains(dot))
    expect(tagDot).toHaveStyle({ backgroundColor: "#22B8CF" })
  })

  it("shows no Quẹt thẻ row when nothing was swiped", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-09"]}
        series={[{ label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000] }]}
        swiped={{ label: "Quẹt thẻ", emoji: "🧾", total: 0 }}
      />
    )

    expect(screen.queryByTestId("tag-trend-swiped")).not.toBeInTheDocument()
  })

  it("masks both amounts of the Quẹt thẻ row while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    try {
      render(
        <MoneyVisibilityProvider>
          <MonthlyTagTrendChart
            months={["2026-08", "2026-09"]}
            series={[{ label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [3_000_000, 3_000_000] }]}
            swiped={{ label: "Quẹt thẻ", emoji: "🧾", total: 1_200_000 }}
          />
        </MoneyVisibilityProvider>
      )

      const row = screen.getByTestId("tag-trend-swiped")
      await waitFor(() =>
        expect(
          within(row).getByText(wholeText(`${formatMoney(0, true)} / ${formatMoney(1_200_000, true)}`))
        ).toBeInTheDocument()
      )
      expect(row.textContent).not.toMatch(/\d/)
    } finally {
      window.localStorage.removeItem("hide-money")
    }
  })

  it("shows the summary with only the Quẹt thẻ row when the months had swipes only", () => {
    render(
      <MonthlyTagTrendChart
        months={["2026-09"]}
        series={[]}
        swiped={{ label: "Quẹt thẻ", emoji: "🧾", total: 800_000 }}
      />
    )

    expect(screen.getByTestId("tag-trend-swiped")).toHaveTextContent(`${formatMoney(0)} / ${formatMoney(800_000)}`)
    expect(screen.getByText("Tổng cộng").parentElement).toHaveTextContent(formatMoney(0))
  })
})
