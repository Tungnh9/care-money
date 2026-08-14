import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi, pct1, type FinanceSummary } from "../../finance-calculations"
import { GoldTab } from "../../components/gold-tab"

const ZERO_SUMMARY: FinanceSummary = {
  savingsTotal: 0,
  debtTotal: 0,
  goldPhan: 0,
  goldCost: 0,
  goldValue: 0,
  goldPL: 0,
  goldPct: 0,
  investCost: 0,
  investValue: 0,
  investPL: 0,
  investPct: 0,
  net: 0,
  netPct: 0,
}

const HOLDING_SUMMARY: FinanceSummary = {
  ...ZERO_SUMMARY,
  goldPhan: 10,
  goldCost: 8_000_000,
  goldValue: 8_800_000,
  goldPL: 800_000,
  goldPct: 10,
}

describe("GoldTab", () => {
  it("shows zeroed-out P&L, stats and the empty transactions state when there is no gold", () => {
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        goldPrice=""
        onSetGoldPrice={vi.fn()}
        gold={[]}
        onAddGold={vi.fn()}
        onRemoveGold={vi.fn()}
      />
    )

    // Đang giữ (raw phân) và Quy đổi (phanToChi) đều hiện "0 phân" khi chưa có gì
    expect(screen.getAllByText("0 phân")).toHaveLength(2)
    expect(
      screen.getByText(`Bạn đang lãi ${formatMoney(0)} so với giá vốn nhờ giá vàng tăng.`)
    ).toBeInTheDocument()
    expect(screen.getByText(pct1(0), { exact: false })).toBeInTheDocument()
    expect(
      screen.getByText("Chưa có giao dịch vàng nào. Thêm lần mua đầu tiên để bắt đầu theo dõi lãi/lỗ.")
    ).toBeInTheDocument()
  })

  it("renders the P&L hero, comparison bars and stat grid for a gain", () => {
    render(
      <GoldTab
        summary={HOLDING_SUMMARY}
        goldPrice="880.000"
        onSetGoldPrice={vi.fn()}
        gold={[]}
        onAddGold={vi.fn()}
        onRemoveGold={vi.fn()}
      />
    )

    // Đang giữ (raw phân)
    expect(screen.getByText("10 phân")).toBeInTheDocument()
    // Quy đổi (phanToChi)
    expect(screen.getByText(phanToChi(10))).toBeInTheDocument()
    // Giá vốn (bar)
    expect(screen.getByText(formatMoney(8_000_000))).toBeInTheDocument()
    // Giá trị nay (bar)
    expect(screen.getByText(formatMoney(8_800_000))).toBeInTheDocument()
    // Giá vốn bình quân stat (8.000.000 / 10 phân)
    expect(screen.getByText(`${formatMoney(800_000)} / phân`)).toBeInTheDocument()
    // Giá thị trường stat
    expect(screen.getByText(`${formatMoney(880_000)} / phân`)).toBeInTheDocument()
    // Signed P&L figure
    expect(screen.getByText(`+ ${formatMoney(800_000)}`)).toBeInTheDocument()
    // Trend badge
    expect(screen.getByText(pct1(10), { exact: false })).toBeInTheDocument()
    // Explanation sentence
    expect(
      screen.getByText(`Bạn đang lãi ${formatMoney(800_000)} so với giá vốn nhờ giá vàng tăng.`)
    ).toBeInTheDocument()
  })

  it("calls onSetGoldPrice when the market price field changes", () => {
    const onSetGoldPrice = vi.fn()
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        goldPrice=""
        onSetGoldPrice={onSetGoldPrice}
        gold={[]}
        onAddGold={vi.fn()}
        onRemoveGold={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText("Giá vàng hôm nay (mỗi phân)", { exact: false }), {
      target: { value: "900000" },
    })

    expect(onSetGoldPrice).toHaveBeenCalledWith("900000")
  })

  it("opens AddGoldForm, fills in fields and reports the new purchase on submit", () => {
    const onAddGold = vi.fn()
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        goldPrice=""
        onSetGoldPrice={vi.fn()}
        gold={[]}
        onAddGold={onAddGold}
        onRemoveGold={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))

    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), {
      target: { value: "10/08/2026" },
    })
    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), {
      target: { value: "10" },
    })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false }), {
      target: { value: "900000" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAddGold).toHaveBeenCalledWith({
      date: "10/08/2026",
      phan: 10,
      buy: 900_000,
    })
  })
})
