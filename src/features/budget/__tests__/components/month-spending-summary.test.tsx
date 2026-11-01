import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { wholeText } from "@/test/whole-text"
import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { CHART_PALETTE, type TagBreakdownEntry } from "@/lib/budget/budget-calculations"
import { formatMoney } from "@/lib/format"
import { MonthSpendingSummary } from "../../components/month-spending-summary"

const RENT: TagBreakdownEntry = { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 3_000_000 }
const SHOP: TagBreakdownEntry = { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", total: 800_000 }
const SWIPE = { label: "Quẹt thẻ", emoji: "🧾" }

interface RenderOptions {
  month?: string
  firstMonth?: string
  currentMonth?: string
  monthsWithSpending?: Set<string>
  entries?: TagBreakdownEntry[]
  colors?: Map<string, string>
  swiped?: { label: string; emoji: string; total: number }
  onSelectMonth?: (month: string) => void
}

function renderSummary({
  month = "2026-09",
  firstMonth = "2024-11",
  currentMonth = "2026-09",
  monthsWithSpending = new Set<string>(),
  entries = [RENT, SHOP],
  colors,
  swiped,
  onSelectMonth = vi.fn(),
}: RenderOptions = {}) {
  return render(
    <MonthSpendingSummary
      month={month}
      firstMonth={firstMonth}
      currentMonth={currentMonth}
      monthsWithSpending={monthsWithSpending}
      entries={entries}
      colors={colors}
      swiped={swiped}
      onSelectMonth={onSelectMonth}
    />
  )
}

describe("MonthSpendingSummary", () => {
  it("lists the month's spending per tag with the month's total", () => {
    renderSummary()

    expect(screen.getByText("Tiền trọ").closest("div")).toHaveTextContent(formatMoney(3_000_000))
    expect(screen.getByText("Mua sắm").closest("div")).toHaveTextContent(formatMoney(800_000))
    expect(screen.getByText("Tổng cộng").parentElement).toHaveTextContent(formatMoney(3_800_000))
  })

  it("leaves out a tag with nothing spent", () => {
    renderSummary({ entries: [RENT, { ...SHOP, total: 0 }] })

    expect(screen.queryByText("Mua sắm")).not.toBeInTheDocument()
    expect(screen.getByText("Tổng cộng").parentElement).toHaveTextContent(formatMoney(3_000_000))
  })

  it("says the month had no spending instead of listing a 0 ₫ total", () => {
    renderSummary({ entries: [] })

    expect(screen.getByText("Chưa có khoản chi nào.")).toBeInTheDocument()
    expect(screen.queryByText("Tổng cộng")).not.toBeInTheDocument()
  })

  it("keeps each tag's amount muted, distinct from the bolder total colour", () => {
    renderSummary()

    expect(screen.getByText(formatMoney(3_000_000))).toHaveStyle({ color: "var(--ob-color-text-muted)" })
    expect(screen.getByText(formatMoney(800_000))).toHaveStyle({ color: "var(--ob-color-text-muted)" })
    expect(screen.getByText(formatMoney(3_800_000))).toHaveStyle({ color: "var(--ob-color-action-strong)" })
  })

  it("colours each dot from the colour map, else by its place in the list", () => {
    const { unmount } = renderSummary({
      colors: new Map([
        ["Tiền trọ", "#22B8CF"],
        ["Mua sắm", "#FCC419"],
      ]),
    })
    const dots = screen.getAllByTestId("month-summary-dot")
    expect(dots[0]).toHaveStyle({ backgroundColor: "#22B8CF" })
    expect(dots[1]).toHaveStyle({ backgroundColor: "#FCC419" })
    unmount()

    renderSummary()
    expect(screen.getAllByTestId("month-summary-dot")[1]).toHaveStyle({ backgroundColor: CHART_PALETTE[1] })
  })

  it("adds a Quẹt thẻ row showing 0 out of the month's swiped total, outside the total", () => {
    renderSummary({ swiped: { ...SWIPE, total: 1_200_000 } })

    const row = screen.getByTestId("month-summary-swiped")
    expect(row).toHaveTextContent("Quẹt thẻ")
    expect(row).toHaveTextContent("🧾")
    expect(within(row).getByText(wholeText(`${formatMoney(0)} / ${formatMoney(1_200_000)}`))).toBeInTheDocument()
    expect(screen.getByText("Tổng cộng").parentElement).toHaveTextContent(formatMoney(3_800_000))
  })

  it("keeps the Quẹt thẻ row's 0 ₫ muted and paints the swiped total and its dot red, whatever the colour map says", () => {
    renderSummary({
      entries: [RENT],
      colors: new Map([
        ["Tiền trọ", "#22B8CF"],
        ["Quẹt thẻ", "#1C7ED6"],
      ]),
      swiped: { ...SWIPE, total: 1_200_000 },
    })

    const row = screen.getByTestId("month-summary-swiped")
    const swipeAmount = within(row).getByText(wholeText(`${formatMoney(0)} / ${formatMoney(1_200_000)}`))
    expect(swipeAmount).toHaveStyle({ color: "var(--ob-color-text-muted)" })
    expect(within(row).getByText(formatMoney(1_200_000))).toHaveStyle({ color: "var(--ob-color-expense)" })
    expect(within(row).getByTestId("month-summary-dot")).toHaveStyle({ backgroundColor: "var(--ob-color-expense)" })
    const tagDot = screen.getAllByTestId("month-summary-dot").find((dot) => !row.contains(dot))
    expect(tagDot).toHaveStyle({ backgroundColor: "#22B8CF" })
  })

  it("shows no Quẹt thẻ row when nothing was swiped that month", () => {
    renderSummary({ swiped: { ...SWIPE, total: 0 } })

    expect(screen.queryByTestId("month-summary-swiped")).not.toBeInTheDocument()
  })

  it("shows the summary with only the Quẹt thẻ row when the month had swipes only", () => {
    renderSummary({ entries: [], swiped: { ...SWIPE, total: 800_000 } })

    expect(screen.getByTestId("month-summary-swiped")).toHaveTextContent(`${formatMoney(0)} / ${formatMoney(800_000)}`)
    expect(screen.getByText("Tổng cộng").parentElement).toHaveTextContent(formatMoney(0))
  })

  it("masks every amount while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    try {
      render(
        <MoneyVisibilityProvider>
          <MonthSpendingSummary
            month="2026-09"
            firstMonth="2026-01"
            currentMonth="2026-09"
            monthsWithSpending={new Set()}
            entries={[RENT, SHOP]}
            swiped={{ ...SWIPE, total: 1_200_000 }}
            onSelectMonth={vi.fn()}
          />
        </MoneyVisibilityProvider>
      )

      const row = screen.getByTestId("month-summary-swiped")
      await waitFor(() =>
        expect(
          within(row).getByText(wholeText(`${formatMoney(0, true)} / ${formatMoney(1_200_000, true)}`))
        ).toBeInTheDocument()
      )
      expect(screen.getByText("Tổng cộng").parentElement?.textContent).not.toMatch(/\d/)
    } finally {
      window.localStorage.removeItem("hide-money")
    }
  })

  it("names the month being viewed in the title", () => {
    renderSummary({ month: "2025-03" })

    expect(screen.getByText("Tổng hợp chi tiêu tháng 3, 2025")).toBeInTheDocument()
  })

  it("opens a month calendar from the icon after the title, at the year of the month being viewed", () => {
    renderSummary({ month: "2025-03" })

    fireEvent.click(screen.getByRole("button", { name: "Chọn tháng để xem" }))

    expect(screen.getByText("Năm 2025")).toBeInTheDocument()
    const months = within(screen.getByRole("group", { name: "Các tháng năm 2025" })).getAllByRole("button")
    expect(months.map((button) => button.textContent)).toEqual(Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`))
    expect(screen.getByRole("button", { name: "Tháng 3", pressed: true })).toBeInTheDocument()
  })

  it("locks the months still to come in this year, but none in a past year", () => {
    renderSummary({ month: "2026-09", currentMonth: "2026-09" })
    fireEvent.click(screen.getByRole("button", { name: "Chọn tháng để xem" }))

    const months = within(screen.getByRole("group", { name: "Các tháng năm 2026" })).getAllByRole("button")
    expect(months.filter((button) => (button as HTMLButtonElement).disabled).map((b) => b.textContent)).toEqual([
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ])

    fireEvent.click(screen.getByRole("button", { name: "Năm trước" }))
    const pastMonths = within(screen.getByRole("group", { name: "Các tháng năm 2025" })).getAllByRole("button")
    expect(pastMonths.some((button) => (button as HTMLButtonElement).disabled)).toBe(false)
  })

  it("dots the months that have spending", () => {
    renderSummary({ monthsWithSpending: new Set(["2026-08", "2026-09"]) })
    fireEvent.click(screen.getByRole("button", { name: "Chọn tháng để xem" }))

    const dotted = screen.getAllByTestId("calendar-spending-dot").map((dot) => dot.closest("button")?.textContent)
    expect(dotted).toEqual(["Tháng 8", "Tháng 9"])
  })

  it("picks the clicked month and closes the calendar", async () => {
    const onSelectMonth = vi.fn()
    renderSummary({ onSelectMonth })
    fireEvent.click(screen.getByRole("button", { name: "Chọn tháng để xem" }))

    fireEvent.click(screen.getByRole("button", { name: "Tháng 2" }))

    expect(onSelectMonth).toHaveBeenCalledWith("2026-02")
    await waitFor(() => expect(screen.queryByRole("group", { name: "Các tháng năm 2026" })).not.toBeInTheDocument())
  })

  it("steps through the years from the first spending to this one, saying why each end is locked", () => {
    const onSelectMonth = vi.fn()
    renderSummary({ firstMonth: "2024-11", onSelectMonth })
    fireEvent.click(screen.getByRole("button", { name: "Chọn tháng để xem" }))

    expect(screen.getByRole("button", { name: "Năm sau" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Năm sau" })).toHaveAccessibleDescription("Đang ở năm nay.")
    fireEvent.click(screen.getByRole("button", { name: "Năm trước" }))
    fireEvent.click(screen.getByRole("button", { name: "Năm trước" }))

    expect(screen.getByText("Năm 2024")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Năm trước" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Năm trước" })).toHaveAccessibleDescription(
      "Chưa có khoản chi nào trước năm này."
    )
    fireEvent.click(screen.getByRole("button", { name: "Tháng 12" }))
    expect(onSelectMonth).toHaveBeenCalledWith("2024-12")
  })
})
