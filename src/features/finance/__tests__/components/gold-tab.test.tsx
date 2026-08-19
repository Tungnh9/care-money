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
        onUpdateGold={vi.fn()}
      />
    )

    // Đang giữ (raw phân) và Quy đổi (phanToChi) đều hiện "0 phân" khi chưa có gì
    expect(screen.getAllByText("0 phân")).toHaveLength(2)
    expect(
      screen.getByText(`Bạn đang lãi ${formatMoney(0)} so với giá vốn nhờ giá vàng tăng.`)
    ).toBeInTheDocument()
    expect(screen.getByText(pct1(0), { exact: false })).toBeInTheDocument()
    // Thông báo rỗng hiện ở cả GoldTransactionsTable và GoldTransactionsCards (song song trong DOM,
    // chỉ ẩn/hiện qua CSS theo breakpoint), nên xuất hiện 2 lần.
    expect(
      screen.getAllByText("Chưa có giao dịch vàng nào. Thêm lần mua đầu tiên để bắt đầu theo dõi lãi/lỗ.")
    ).toHaveLength(2)
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
        onUpdateGold={vi.fn()}
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
        onUpdateGold={vi.fn()}
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
        onUpdateGold={vi.fn()}
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

  it("stagger-animates its stacked cards in via the shared ob-card-grid wrapper", () => {
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        goldPrice=""
        onSetGoldPrice={vi.fn()}
        gold={[]}
        onAddGold={vi.fn()}
        onRemoveGold={vi.fn()}
        onUpdateGold={vi.fn()}
      />
    )

    const plSection = screen
      .getByText("Lãi / lỗ theo giá thị trường")
      .closest("section") as HTMLElement
    expect(plSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("opens a prefilled edit form for a purchase and reports the update on Lưu", () => {
    const onUpdateGold = vi.fn()
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000 }
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        goldPrice=""
        onSetGoldPrice={vi.fn()}
        gold={[PURCHASE]}
        onAddGold={vi.fn()}
        onRemoveGold={vi.fn()}
        onUpdateGold={onUpdateGold}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: /Sửa giao dịch vàng/ })[0])

    expect(screen.getByDisplayValue("10/08/2026")).toBeInTheDocument()
    expect(screen.getByDisplayValue("10")).toBeInTheDocument()
    const buyInput = screen.getByDisplayValue("900.000")
    fireEvent.change(buyInput, { target: { value: "950000" } })

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onUpdateGold).toHaveBeenCalledWith(1, {
      date: "10/08/2026",
      phan: 10,
      buy: 950_000,
    })
    expect(screen.queryByText("Sửa lần mua vàng")).not.toBeInTheDocument()
  })

  it("closes the edit form without saving when Huỷ is clicked", () => {
    const onUpdateGold = vi.fn()
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000 }
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        goldPrice=""
        onSetGoldPrice={vi.fn()}
        gold={[PURCHASE]}
        onAddGold={vi.fn()}
        onRemoveGold={vi.fn()}
        onUpdateGold={onUpdateGold}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: /Sửa giao dịch vàng/ })[0])
    expect(screen.getByText("Sửa lần mua vàng")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onUpdateGold).not.toHaveBeenCalled()
    expect(screen.queryByText("Sửa lần mua vàng")).not.toBeInTheDocument()
  })

  it("asks for confirmation before removing a purchase and removes it on Xoá", () => {
    const onRemoveGold = vi.fn()
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000 }
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        goldPrice=""
        onSetGoldPrice={vi.fn()}
        gold={[PURCHASE]}
        onAddGold={vi.fn()}
        onRemoveGold={onRemoveGold}
        onUpdateGold={vi.fn()}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })[0])

    expect(screen.getByText("Xoá giao dịch vàng?")).toBeInTheDocument()
    expect(onRemoveGold).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemoveGold).toHaveBeenCalledTimes(1)
    expect(onRemoveGold).toHaveBeenCalledWith(1)
  })

  it("closes the confirmation dialog without removing the purchase when Huỷ is clicked", () => {
    const onRemoveGold = vi.fn()
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000 }
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        goldPrice=""
        onSetGoldPrice={vi.fn()}
        gold={[PURCHASE]}
        onAddGold={vi.fn()}
        onRemoveGold={onRemoveGold}
        onUpdateGold={vi.fn()}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })[0])
    expect(screen.getByText("Xoá giao dịch vàng?")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onRemoveGold).not.toHaveBeenCalled()
    expect(screen.queryByText("Xoá giao dịch vàng?")).not.toBeInTheDocument()
  })
})
