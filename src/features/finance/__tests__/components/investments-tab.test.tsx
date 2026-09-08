import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { pct1, summarizeFinance, type FinanceSummary } from "../../finance-calculations"
import { InvestmentsTab } from "../../components/investments-tab"
import type { Investment } from "../../types"

const GAINING: Investment = {
  id: 1,
  name: "Chứng chỉ quỹ VESAF",
  cost: 10_000_000,
  value: 12_000_000,
}

const LOSING: Investment = {
  id: 2,
  name: "Cổ phiếu FPT",
  cost: 5_000_000,
  value: 4_000_000,
}

function summaryFor(invests: Investment[]): FinanceSummary {
  return summarizeFinance({ savings: [], cards: [], gold: [], goldStores: [], invests })
}

describe("InvestmentsTab", () => {
  it("renders the empty-state message when there are no investments", () => {
    render(<InvestmentsTab invests={[]} summary={summaryFor([])} onAddInvest={vi.fn()} />)

    expect(
      screen.getByText(
        "Chưa có khoản đầu tư nào. Thêm khoản đầu tư đầu tiên để bắt đầu theo dõi lãi/lỗ."
      )
    ).toBeInTheDocument()
    expect(screen.getByText(formatMoney(0))).toBeInTheDocument()
  })

  it("renders total value, total P&L and each investment's cost/value/P&L for a gain and a loss", () => {
    render(
      <InvestmentsTab invests={[GAINING, LOSING]} summary={summaryFor([GAINING, LOSING])} onAddInvest={vi.fn()} />
    )

    // Tổng giá trị hiện tại: 12.000.000 + 4.000.000
    expect(screen.getByText(formatMoney(16_000_000))).toBeInTheDocument()
    // Tổng lãi/lỗ: (12.000.000-10.000.000) + (4.000.000-5.000.000) = +1.000.000
    expect(screen.getByText(`+ ${formatMoney(1_000_000)}`, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(pct1((1_000_000 / 15_000_000) * 100), { exact: false })).toBeInTheDocument()

    // Từng khoản đầu tư
    expect(screen.getByText(GAINING.name)).toBeInTheDocument()
    expect(screen.getByText(`vốn ${formatMoney(GAINING.cost)}`)).toBeInTheDocument()
    expect(screen.getByText(formatMoney(GAINING.value))).toBeInTheDocument()
    expect(screen.getByText(`+ ${formatMoney(2_000_000)}`)).toBeInTheDocument()

    expect(screen.getByText(LOSING.name)).toBeInTheDocument()
    expect(screen.getByText(`vốn ${formatMoney(LOSING.cost)}`)).toBeInTheDocument()
    expect(screen.getByText(formatMoney(LOSING.value))).toBeInTheDocument()
    expect(screen.getByText(`− ${formatMoney(1_000_000)}`)).toBeInTheDocument()
  })

  it("renders the header totals from the summary prop, not a local recomputation from invests", () => {
    const mismatchedSummary: FinanceSummary = {
      ...summaryFor([GAINING, LOSING]),
      investValue: 120_000_000,
      investPL: 20_000_000,
      investPct: 20,
    }
    render(<InvestmentsTab invests={[GAINING, LOSING]} summary={mismatchedSummary} onAddInvest={vi.fn()} />)

    expect(screen.getByText(formatMoney(120_000_000))).toBeInTheDocument()
    expect(screen.getByText(`+ ${formatMoney(20_000_000)}`, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(pct1(20), { exact: false })).toBeInTheDocument()
    // Không còn hiện tổng được tính lại từ invests (16.000.000 / +1.000.000)
    expect(screen.queryByText(formatMoney(16_000_000))).not.toBeInTheDocument()
  })

  it("opens the add-investment form, fills in fields and reports the new investment on submit", () => {
    const onAddInvest = vi.fn()
    render(<InvestmentsTab invests={[]} summary={summaryFor([])} onAddInvest={onAddInvest} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm khoản đầu tư" }))

    fireEvent.change(screen.getByLabelText("Tên khoản", { exact: false }), {
      target: { value: "Chứng chỉ quỹ VESAF" },
    })
    fireEvent.change(screen.getByLabelText("Số tiền đã bỏ vào", { exact: false }), {
      target: { value: "10000000" },
    })
    fireEvent.change(screen.getByLabelText("Giá trị hiện tại", { exact: false }), {
      target: { value: "12000000" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAddInvest).toHaveBeenCalledWith({
      name: "Chứng chỉ quỹ VESAF",
      cost: 10_000_000,
      value: 12_000_000,
    })
  })

  it("defaults value to cost when the Giá trị hiện tại field is left blank", () => {
    const onAddInvest = vi.fn()
    render(<InvestmentsTab invests={[]} summary={summaryFor([])} onAddInvest={onAddInvest} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm khoản đầu tư" }))

    fireEvent.change(screen.getByLabelText("Tên khoản", { exact: false }), {
      target: { value: "Vàng miếng SJC" },
    })
    fireEvent.change(screen.getByLabelText("Số tiền đã bỏ vào", { exact: false }), {
      target: { value: "3000000" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAddInvest).toHaveBeenCalledWith({
      name: "Vàng miếng SJC",
      cost: 3_000_000,
      value: 3_000_000,
    })
  })

  it("keeps Thêm disabled until name and Số tiền đã bỏ vào are filled in", () => {
    render(<InvestmentsTab invests={[]} summary={summaryFor([])} onAddInvest={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm khoản đầu tư" }))
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Tên khoản", { exact: false }), {
      target: { value: "Chứng chỉ quỹ VESAF" },
    })
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Số tiền đã bỏ vào", { exact: false }), {
      target: { value: "10000000" },
    })
    expect(screen.getByRole("button", { name: "Thêm" })).not.toBeDisabled()
  })

  it("closes the add-investment form without calling onAddInvest when Huỷ is clicked", () => {
    const onAddInvest = vi.fn()
    render(<InvestmentsTab invests={[]} summary={summaryFor([])} onAddInvest={onAddInvest} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm khoản đầu tư" }))
    fireEvent.change(screen.getByLabelText("Tên khoản", { exact: false }), {
      target: { value: "Chứng chỉ quỹ VESAF" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onAddInvest).not.toHaveBeenCalled()
    expect(screen.queryByLabelText("Tên khoản", { exact: false })).not.toBeInTheDocument()
  })
})
