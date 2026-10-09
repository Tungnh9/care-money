import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { PillarCard } from "../../components/pillar-card"

describe("PillarCard", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

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

  it("masks the amount when the sidebar's Ẩn số tiền toggle is on", async () => {
    window.localStorage.setItem("hide-money", "1")

    render(
      <MoneyVisibilityProvider>
        <PillarCard icon="pig" label="Tiết kiệm" amount={12_345_678} hint="3 quỹ đang chạy" />
      </MoneyVisibilityProvider>
    )

    await waitFor(() => expect(screen.getByText("•••••••• ₫")).toBeInTheDocument())
    expect(screen.queryByText(formatMoney(12_345_678))).not.toBeInTheDocument()
  })

  it("sizes a large amount from its own column next to the icon, so it stays inside the card", () => {
    render(
      <PillarCard icon="pig" label="Tiết kiệm" amount={1_234_567_890} hint="3 quỹ đang chạy" tone="income" />
    )

    // Số tiền là chuỗi thuần nên Figure tự đếm: "1.234.567.890 ₫" = 15 ký tự.
    const amount = screen.getByText(formatMoney(1_234_567_890))
    expect(amount.style.getPropertyValue("--ob-figure-chars")).toBe("15")
    // cqi của cỡ chữ phải đo đúng cột chứa số (hẹp hơn Card ~52px vì icon 40px + khe 12px): container
    // gần nhất là 1 ô riêng quanh Figure, không phải cả Card (<section>).
    const column = amount.closest("[class*='container-type:inline-size']") as HTMLElement
    expect(column).not.toBe(amount.closest("section"))
    expect(column).toHaveClass("min-w-0")
    expect(column).toHaveStyle({ color: "var(--ob-color-income)" })
  })
})
