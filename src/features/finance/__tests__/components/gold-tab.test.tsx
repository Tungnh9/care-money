import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi, pct1, type FinanceSummary } from "../../finance-calculations"
import { GoldTab } from "../../components/gold-tab"
import type { GoldStore } from "../../types"

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

const SJC: GoldStore = { name: "SJC", price: "880.000" }

const noopHandlers = {
  onAddGoldStore: vi.fn(),
  onUpdateGoldStore: vi.fn(),
  onRemoveGoldStore: vi.fn(),
  onSetGoldStorePrice: vi.fn(),
  onAddGold: vi.fn(),
  onRemoveGold: vi.fn(),
  onUpdateGold: vi.fn(),
}

describe("GoldTab", () => {
  it("shows zeroed-out P&L, stats and the empty transactions state when there is no gold", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[]} gold={[]} {...noopHandlers} />)

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

  it("renders the P&L hero, comparison bars and stat grid for a gain, with the store-weighted average price", () => {
    render(<GoldTab summary={HOLDING_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

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
    // Giá trị bình quân stat (goldValue/goldPhan = 8.800.000/10), thay cho "Giá thị trường" 1 giá chung cũ
    expect(screen.getByText("Giá trị bình quân")).toBeInTheDocument()
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

  it("shows 0 for the average price when there are stores but no purchases yet", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

    const statBox = screen.getByText("Giá trị bình quân").parentElement as HTMLElement
    expect(within(statBox).getByText(`${formatMoney(0)} / phân`)).toBeInTheDocument()
  })

  it("calls onSetGoldStorePrice when a store's price field in GoldStoresCard changes", () => {
    const onSetGoldStorePrice = vi.fn()
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[SJC]}
        gold={[]}
        {...noopHandlers}
        onSetGoldStorePrice={onSetGoldStorePrice}
      />
    )

    fireEvent.change(screen.getByDisplayValue("880.000"), { target: { value: "900000" } })

    expect(onSetGoldStorePrice).toHaveBeenCalledWith("SJC", "900000")
  })

  it("opens AddGoldForm, fills in fields (incl. picking a store) and reports the new purchase on submit", () => {
    const onAddGold = vi.fn()
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} onAddGold={onAddGold} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))

    fireEvent.click(screen.getByRole("button", { name: "SJC" }))
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
      store: "SJC",
    })
  })

  it("keeps the add-purchase Thêm button disabled until a store is picked", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

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

    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "SJC" }))

    expect(screen.getByRole("button", { name: "Thêm" })).not.toBeDisabled()
  })

  it("keeps the add-purchase Thêm button disabled when khối lượng is zero or negative", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))
    fireEvent.click(screen.getByRole("button", { name: "SJC" }))
    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), {
      target: { value: "10/08/2026" },
    })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false }), {
      target: { value: "900000" },
    })

    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), {
      target: { value: "0" },
    })
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), {
      target: { value: "-3" },
    })
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
  })

  it("stagger-animates its stacked cards in via the shared ob-card-grid wrapper", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[]} gold={[]} {...noopHandlers} />)

    const plSection = screen
      .getByText("Lãi / lỗ theo giá thị trường")
      .closest("section") as HTMLElement
    expect(plSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("opens a prefilled edit form (incl. the purchase's current store) and reports the update on Lưu", () => {
    const onUpdateGold = vi.fn()
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[SJC]}
        gold={[PURCHASE]}
        {...noopHandlers}
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
      store: "SJC",
    })
    expect(screen.queryByText("Sửa lần mua vàng")).not.toBeInTheDocument()
  })

  it("closes the edit form without saving when Huỷ is clicked", () => {
    const onUpdateGold = vi.fn()
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[SJC]}
        gold={[PURCHASE]}
        {...noopHandlers}
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
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[SJC]}
        gold={[PURCHASE]}
        {...noopHandlers}
        onRemoveGold={onRemoveGold}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })[0])

    expect(screen.getByText("Xoá giao dịch vàng?")).toBeInTheDocument()
    expect(onRemoveGold).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemoveGold).toHaveBeenCalledTimes(1)
    expect(onRemoveGold).toHaveBeenCalledWith(1)
  })

  it("shows a win/loss summary and pluralized count in the transactions Card label when there are purchases", () => {
    // 2 lần lãi: (950.000-900.000)*10 = 500.000 ; (950.000-920.000)*5 = 150.000 → tổng lãi 650.000
    // 1 lần lỗ: (950.000-980.000)*8 = -240.000 → tổng lỗ -240.000
    const purchases = [
      { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" },
      { id: 2, date: "02/01/2026", phan: 5, buy: 920_000, store: "SJC" },
      { id: 3, date: "03/01/2026", phan: 8, buy: 980_000, store: "SJC" },
    ]
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[{ name: "SJC", price: "950.000" }]}
        gold={purchases}
        {...noopHandlers}
      />
    )

    expect(screen.getByText("Các lần mua vàng · 3 lần")).toBeInTheDocument()

    const winBox = screen.getByText("2 lần lãi").parentElement as HTMLElement
    expect(within(winBox).getByText(formatMoney(650_000))).toBeInTheDocument()
    expect(winBox.querySelector("svg")).not.toBeNull()

    const lossBox = screen.getByText("1 lần lỗ").parentElement as HTMLElement
    expect(within(lossBox).getByText(formatMoney(240_000))).toBeInTheDocument()
    expect(lossBox.querySelector("svg")).not.toBeNull()
  })

  it("computes win/loss using each purchase's OWN store price, not one price for everyone", () => {
    // SJC @ 1.000.000: 10*(1.000.000-900.000) = +1.000.000 (lãi)
    // PNJ @ 800.000: 8*(900.000-800.000) = -800.000 (lỗ)
    const purchases = [
      { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" },
      { id: 2, date: "02/01/2026", phan: 8, buy: 900_000, store: "PNJ" },
    ]
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[
          { name: "SJC", price: "1.000.000" },
          { name: "PNJ", price: "800.000" },
        ]}
        gold={purchases}
        {...noopHandlers}
      />
    )

    const winBox = screen.getByText("1 lần lãi").parentElement as HTMLElement
    expect(within(winBox).getByText(formatMoney(1_000_000))).toBeInTheDocument()

    const lossBox = screen.getByText("1 lần lỗ").parentElement as HTMLElement
    expect(within(lossBox).getByText(formatMoney(800_000))).toBeInTheDocument()
  })

  it("renders gold purchases sorted from newest to oldest date, regardless of the input array's order", () => {
    const purchases = [
      { id: 1, date: "28/07/2026", phan: 5, buy: 1_420_000, store: "SJC" },
      { id: 2, date: "05/05/2026", phan: 2, buy: 1_649_000, store: "SJC" },
      { id: 3, date: "03/06/2026", phan: 5, buy: 1_436_000, store: "SJC" },
    ]
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[{ name: "SJC", price: "1.500.000" }]}
        gold={purchases}
        {...noopHandlers}
      />
    )

    const table = document.querySelector("table") as HTMLTableElement
    const dates = Array.from(table.querySelectorAll("tbody tr")).map(
      (row) => row.querySelector("td")?.textContent
    )

    expect(dates).toEqual(["28/07/2026", "03/06/2026", "05/05/2026"])
  })

  it("omits the count suffix and the win/loss summary when there are no purchases", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[]} gold={[]} {...noopHandlers} />)

    expect(screen.getByText("Các lần mua vàng")).toBeInTheDocument()
    expect(screen.queryByText(/lần lãi/)).not.toBeInTheDocument()
    expect(screen.queryByText(/lần lỗ/)).not.toBeInTheDocument()
  })

  it("omits the per-store summary section entirely when there are no purchases", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

    expect(screen.queryByText("Tổng hợp theo cửa hàng")).not.toBeInTheDocument()
  })

  it("shows a per-store total, grouping multiple purchases from the same store into one row", () => {
    // SJC: (10 phân @ 900.000) + (5 phân @ 920.000) = 15 phân, vốn 13.600.000, giá trị nay
    // 15*950.000 = 14.250.000, lãi 650.000. PNJ: 8 phân @ 900.000 = vốn 7.200.000, giá trị nay
    // 8*880.000 = 7.040.000, lỗ -160.000. Tổng: 23 phân, vốn 20.800.000, giá trị 21.290.000, lãi 490.000.
    const purchases = [
      { id: 1, date: "01/01/2026", phan: 10, buy: 900_000, store: "SJC" },
      { id: 2, date: "02/01/2026", phan: 5, buy: 920_000, store: "SJC" },
      { id: 3, date: "03/01/2026", phan: 8, buy: 900_000, store: "PNJ" },
    ]
    const summary = {
      ...ZERO_SUMMARY,
      goldPhan: 23,
      goldCost: 20_800_000,
      goldValue: 21_290_000,
      goldPL: 490_000,
    }
    render(
      <GoldTab
        summary={summary}
        stores={[
          { name: "SJC", price: "950.000" },
          { name: "PNJ", price: "880.000" },
        ]}
        gold={purchases}
        {...noopHandlers}
      />
    )

    expect(screen.getByText("Tổng hợp theo cửa hàng")).toBeInTheDocument()
    expect(screen.getAllByText("SJC").length).toBeGreaterThan(0)
    expect(screen.getAllByText("PNJ").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Tổng cộng").length).toBeGreaterThan(0)
    expect(screen.getAllByText(formatMoney(21_290_000)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(formatMoney(490_000)).length).toBeGreaterThan(0)
  })

  it("closes the confirmation dialog without removing the purchase when Huỷ is clicked", () => {
    const onRemoveGold = vi.fn()
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[SJC]}
        gold={[PURCHASE]}
        {...noopHandlers}
        onRemoveGold={onRemoveGold}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Xoá giao dịch vàng" })[0])
    expect(screen.getByText("Xoá giao dịch vàng?")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onRemoveGold).not.toHaveBeenCalled()
    expect(screen.queryByText("Xoá giao dịch vàng?")).not.toBeInTheDocument()
  })
})
