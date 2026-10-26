import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi, pct1, summarizeFinance, type FinanceSummary } from "@/lib/finance/finance-calculations"
import { DEFAULT_FINANCE_STATE } from "@/lib/finance/finance-storage"
import { GoldTab } from "../../components/gold-tab"
import type { GoldStore, MetalGift, MetalSale, SavingsFund } from "@/lib/finance/types"

const ZERO_SUMMARY: FinanceSummary = {
  savingsTotal: 0,
  debtTotal: 0,
  goldPhan: 0,
  goldCost: 0,
  goldValue: 0,
  goldPL: 0,
  goldPct: 0,
  silverLuong: 0,
  silverCost: 0,
  silverValue: 0,
  silverPL: 0,
  silverPct: 0,
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
  goldGifts: [] as MetalGift[],
  onAddGoldGift: vi.fn(() => true),
  onUpdateGoldGift: vi.fn(() => true),
  onRemoveGoldGift: vi.fn(),
  goldSales: [] as MetalSale[],
  savings: [] as SavingsFund[],
  onAddGoldSale: vi.fn(() => true),
  onRemoveGoldSale: vi.fn(),
}

describe("GoldTab", () => {
  it("shows a neutral P&L, zeroed stats and the empty transactions state when there is no gold", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[]} gold={[]} {...noopHandlers} />)

    // Đang giữ (raw phân) và Quy đổi (phanToChi) đều hiện "0 phân" khi chưa có gì
    expect(screen.getAllByText("0 phân")).toHaveLength(2)
    // Chưa có vàng thì không có lãi/lỗ để báo — không "lãi 0 ₫ … nhờ giá vàng tăng", không "▲ +0,0%".
    expect(screen.getByText("Chưa có vàng nào — thêm lần mua đầu tiên để theo dõi lãi/lỗ.")).toBeInTheDocument()
    expect(screen.queryByText(/nhờ giá vàng tăng/)).not.toBeInTheDocument()
    expect(screen.queryByText(pct1(0), { exact: false })).not.toBeInTheDocument()
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
    // Giá hiện tại (bar)
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

  it("keeps the add-purchase Thêm button disabled when khối lượng is not a finite number", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))
    fireEvent.click(screen.getByRole("button", { name: "SJC" }))
    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), {
      target: { value: "10/08/2026" },
    })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false }), {
      target: { value: "900000" },
    })
    // Number("1e400") = Infinity: vẫn > 0, nhưng JSON lưu thành null và lần đọc sau purchase biến mất.
    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), {
      target: { value: "1e400" },
    })

    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
  })

  it("stagger-animates its stacked cards in via the shared ob-card-grid wrapper", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[]} gold={[]} {...noopHandlers} />)

    const plSection = screen.getByText("Lãi / lỗ theo giá thị trường").closest("section") as HTMLElement
    expect(plSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("opens a prefilled edit form (incl. the purchase's current store) and reports the update on Lưu", () => {
    const onUpdateGold = vi.fn()
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
    render(
      <GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[PURCHASE]} {...noopHandlers} onUpdateGold={onUpdateGold} />
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
      <GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[PURCHASE]} {...noopHandlers} onUpdateGold={onUpdateGold} />
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
      <GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[PURCHASE]} {...noopHandlers} onRemoveGold={onRemoveGold} />
    )

    fireEvent.click(screen.getAllByRole("button", { name: /^Xoá giao dịch vàng \d/ })[0])

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
      <GoldTab summary={ZERO_SUMMARY} stores={[{ name: "SJC", price: "950.000" }]} gold={purchases} {...noopHandlers} />
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
    const dates = Array.from(table.querySelectorAll("tbody tr")).map((row) => row.querySelector("td")?.textContent)

    expect(dates).toEqual(["28/07/2026", "03/06/2026", "05/05/2026"])
  })

  it("shows only the first 5 purchases with a Xem thêm button when there are more", () => {
    const purchases = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      date: `${String(i + 1).padStart(2, "0")}/01/2026`,
      phan: 1,
      buy: 1_000_000,
      store: "SJC",
    }))
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[{ name: "SJC", price: "1.000.000" }]}
        gold={purchases}
        {...noopHandlers}
      />
    )

    const table = document.querySelector("table") as HTMLTableElement
    expect(table.querySelectorAll("tbody tr")).toHaveLength(5)
    expect(screen.getByRole("button", { name: "Xem thêm" })).toBeInTheDocument()
  })

  it("reveals more purchases each time Xem thêm is clicked, then switches to Thu gọn once all are shown", () => {
    const purchases = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      date: `${String(i + 1).padStart(2, "0")}/01/2026`,
      phan: 1,
      buy: 1_000_000,
      store: "SJC",
    }))
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[{ name: "SJC", price: "1.000.000" }]}
        gold={purchases}
        {...noopHandlers}
      />
    )
    const table = document.querySelector("table") as HTMLTableElement

    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))

    expect(table.querySelectorAll("tbody tr")).toHaveLength(8)
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Thu gọn" }))

    expect(table.querySelectorAll("tbody tr")).toHaveLength(5)
    expect(screen.getByRole("button", { name: "Xem thêm" })).toBeInTheDocument()
  })

  it("hides the Xem thêm button entirely when there are 5 or fewer purchases", () => {
    const purchases = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      date: `${String(i + 1).padStart(2, "0")}/01/2026`,
      phan: 1,
      buy: 1_000_000,
      store: "SJC",
    }))
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[{ name: "SJC", price: "1.000.000" }]}
        gold={purchases}
        {...noopHandlers}
      />
    )

    expect(screen.queryByRole("button", { name: "Xem thêm" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Thu gọn" })).not.toBeInTheDocument()
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
      <GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[PURCHASE]} {...noopHandlers} onRemoveGold={onRemoveGold} />
    )

    fireEvent.click(screen.getAllByRole("button", { name: /^Xoá giao dịch vàng \d/ })[0])
    expect(screen.getByText("Xoá giao dịch vàng?")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onRemoveGold).not.toHaveBeenCalled()
    expect(screen.queryByText("Xoá giao dịch vàng?")).not.toBeInTheDocument()
  })

  it("sizes the P&L figure from the signed amount's length so a large gain stays inside the card", () => {
    render(
      <GoldTab summary={{ ...HOLDING_SUMMARY, goldPL: 1_234_567_890 }} stores={[SJC]} gold={[]} {...noopHandlers} />
    )

    // Value của Figure ở đây là <span> tô màu lãi/lỗ nên Figure không tự đếm được — GoldTab phải
    // truyền fitChars: "+ 1.234.567.890 ₫" = 17 ký tự.
    const amount = screen.getByText(`+ ${formatMoney(1_234_567_890)}`)
    expect(amount.parentElement?.style.getPropertyValue("--ob-figure-chars")).toBe("17")
  })

  it("says the price equals the cost, with no ▲ and no 'nhờ giá vàng tăng', at break-even", () => {
    const BREAK_EVEN: FinanceSummary = { ...ZERO_SUMMARY, goldPhan: 10, goldCost: 8_000_000, goldValue: 8_000_000 }
    render(<GoldTab summary={BREAK_EVEN} stores={[SJC]} gold={[]} {...noopHandlers} />)

    expect(screen.getByText("Giá hiện tại đang bằng giá vốn — chưa lãi cũng chưa lỗ.")).toBeInTheDocument()
    expect(screen.queryByText(`+ ${formatMoney(0)}`)).not.toBeInTheDocument()
    expect(screen.queryByText(pct1(0), { exact: false })).not.toBeInTheDocument()
  })

  it("does not count a break-even purchase as a gain", () => {
    const stores: GoldStore[] = [{ name: "SJC", price: "" }]
    const gold = [{ id: 1, date: "10/08/2026", phan: 10, buy: 8_000_000, store: "SJC" }]
    const summary = summarizeFinance({ ...DEFAULT_FINANCE_STATE, gold, goldStores: stores })
    render(<GoldTab summary={summary} stores={stores} gold={gold} {...noopHandlers} />)

    expect(screen.getByText("0 lần lãi")).toBeInTheDocument()
  })

  it("values gold from a store with no price yet at its buy price and says so, instead of a full loss", () => {
    const stores: GoldStore[] = [{ name: "SJC", price: "" }]
    const gold = [{ id: 1, date: "10/08/2026", phan: 10, buy: 8_000_000, store: "SJC" }]
    const summary = summarizeFinance({ ...DEFAULT_FINANCE_STATE, gold, goldStores: stores })
    render(<GoldTab summary={summary} stores={stores} gold={gold} {...noopHandlers} />)

    expect(
      screen.getByText("Chưa nhập giá hôm nay cho SJC — vàng mua ở đó đang tạm tính theo giá mua.")
    ).toBeInTheDocument()
    expect(screen.getByText("Giá hiện tại đang bằng giá vốn — chưa lãi cũng chưa lỗ.")).toBeInTheDocument()
    expect(screen.queryByText(/do giá vàng giảm/)).not.toBeInTheDocument()
    // Cột "Giá hiện tại" (thứ 6) của lần mua trong bảng giao dịch bằng giá vốn, không phải 0 ₫.
    const table = document.querySelector("table") as HTMLTableElement
    const cells = table.querySelectorAll("tbody tr")[0].querySelectorAll("td")
    expect(cells[5]).toHaveTextContent(formatMoney(80_000_000))
  })

  it("shows a fractional holding left over from old data rounded to 1 decimal, without floating-point noise", () => {
    render(<GoldTab summary={{ ...ZERO_SUMMARY, goldPhan: 0.1 + 0.2 }} stores={[]} gold={[]} {...noopHandlers} />)

    // Đang giữ (formatPhan) và Quy đổi (phanToChi) đều hiện "0,3 phân".
    expect(screen.getAllByText("0,3 phân")).toHaveLength(2)
  })
})

// Khoá nguyên văn chữ và luồng cửa hàng của tab vàng TRƯỚC khi tách phần dùng chung với tab bạc —
// các test trên chưa giữ những chuỗi này, nên lỡ ghép sai noun/unit khi tổng quát hoá sẽ không ai báo.
describe("GoldTab — chữ và luồng cửa hàng", () => {
  it("explains a loss with the gold wording", () => {
    const LOSS: FinanceSummary = {
      ...HOLDING_SUMMARY,
      goldValue: 7_500_000,
      goldPL: -500_000,
      goldPct: -6.25,
    }
    render(<GoldTab summary={LOSS} stores={[SJC]} gold={[]} {...noopHandlers} />)

    expect(screen.getByText(`Bạn đang lỗ ${formatMoney(500_000)} so với giá vốn do giá vàng giảm.`)).toBeInTheDocument()
  })

  it("names the purchase's date in the delete confirmation", () => {
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[PURCHASE]} {...noopHandlers} />)

    fireEvent.click(screen.getAllByRole("button", { name: /^Xoá giao dịch vàng \d/ })[0])

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      'Xoá giao dịch mua vàng ngày "10/08/2026" sẽ không thể hoàn tác.'
    )
  })

  it("labels the add-purchase form in phân, with the chỉ hint and the whole-phân error", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))

    expect(screen.getByText("Lần mua vàng mới")).toBeInTheDocument()
    expect(screen.getByText("10 phân = 1 chỉ")).toBeInTheDocument()
    expect(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), {
      target: { value: "1,5" },
    })

    expect(screen.getByText("Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)")).toBeInTheDocument()
  })

  it("labels the edit-purchase modal and its fields in phân", () => {
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[PURCHASE]} {...noopHandlers} />)

    fireEvent.click(screen.getAllByRole("button", { name: /Sửa giao dịch vàng/ })[0])

    const dialog = screen.getByRole("dialog", { name: "Sửa lần mua vàng" })
    expect(within(dialog).getByLabelText("Khối lượng (phân)", { exact: false })).toHaveValue("10")
    expect(within(dialog).getByText("10 phân = 1 chỉ")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Giá mua (mỗi phân)", { exact: false })).toBeInTheDocument()
  })

  it("prices stores per phân in the market-price card and the add-store form", () => {
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} />)

    expect(screen.getByText("Giá hôm nay (mỗi phân)")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Giá SJC hôm nay (mỗi phân)" })).toHaveValue("880.000")

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))

    expect(screen.getByText("Cửa hàng mới")).toBeInTheDocument()
    expect(screen.getByLabelText("Tên cửa hàng")).toHaveAttribute("placeholder", "vd: SJC")
    // Nhãn của Field gồm cả hậu tố "đ" nằm trong <label> → so khớp một phần.
    expect(screen.getByLabelText("Giá hôm nay (mỗi phân)", { exact: false })).toBeInTheDocument()
  })

  it("explains why a store that still has gold purchases cannot be deleted", () => {
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[PURCHASE]} {...noopHandlers} />)

    const remove = screen.getByRole("button", { name: "Xoá SJC" })
    expect(remove).toBeDisabled()
    expect(remove).toHaveAttribute("title", "Không thể xoá — vẫn còn giao dịch mua vàng gắn với cửa hàng này.")
  })

  it("reports a new store through onAddGoldStore", () => {
    const onAddGoldStore = vi.fn()
    render(
      <GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[]} {...noopHandlers} onAddGoldStore={onAddGoldStore} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))
    fireEvent.change(screen.getByLabelText("Tên cửa hàng"), { target: { value: " PNJ " } })
    fireEvent.change(screen.getByLabelText("Giá hôm nay (mỗi phân)", { exact: false }), {
      target: { value: "870000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAddGoldStore).toHaveBeenCalledWith({ name: "PNJ", price: "870000" })
  })

  it("reports a store rename through onUpdateGoldStore with the original name", () => {
    const onUpdateGoldStore = vi.fn()
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[SJC]}
        gold={[]}
        {...noopHandlers}
        onUpdateGoldStore={onUpdateGoldStore}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Sửa SJC" }))
    const dialog = screen.getByRole("dialog", { name: "Sửa cửa hàng" })
    fireEvent.change(within(dialog).getByLabelText("Tên cửa hàng"), { target: { value: "SJC Hà Nội" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onUpdateGoldStore).toHaveBeenCalledWith("SJC", { name: "SJC Hà Nội", price: "880.000" })
  })

  it("asks before removing an unused store and reports it through onRemoveGoldStore", () => {
    const onRemoveGoldStore = vi.fn()
    render(
      <GoldTab
        summary={ZERO_SUMMARY}
        stores={[SJC]}
        gold={[]}
        {...noopHandlers}
        onRemoveGoldStore={onRemoveGoldStore}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Xoá SJC" }))
    expect(screen.getByRole("alertdialog")).toHaveTextContent('Xoá "SJC" sẽ không thể hoàn tác.')
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemoveGoldStore).toHaveBeenCalledWith("SJC")
  })

  it("shows each purchase's weight in chỉ/phân in the transactions list", () => {
    const PURCHASE = { id: 1, date: "10/08/2026", phan: 12, buy: 900_000, store: "SJC" }
    render(<GoldTab summary={ZERO_SUMMARY} stores={[SJC]} gold={[PURCHASE]} {...noopHandlers} />)

    // Bảng (desktop) + card (mobile) + dòng SJC ở bảng và card "Tổng hợp theo cửa hàng". Dòng "Tổng cộng"
    // lấy khối lượng từ summary (ở đây là 0), không cộng lại từ danh sách.
    expect(screen.getAllByText("1 chỉ 2 phân")).toHaveLength(4)
  })
})

describe("GoldTab — tặng", () => {
  const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
  const GIFT: MetalGift = { id: 1, purchaseId: 1, date: "12/10/2026", qty: 1, store: "SJC", buy: 900_000 }
  const STORES: GoldStore[] = [{ name: "SJC", price: "900.000" }]

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 20, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderGold(goldGifts: MetalGift[], gold = [PURCHASE], overrides: Partial<typeof noopHandlers> = {}) {
    const summary = summarizeFinance({ ...DEFAULT_FINANCE_STATE, gold, goldStores: STORES, goldGifts })
    return render(
      <GoldTab summary={summary} stores={STORES} gold={gold} {...noopHandlers} goldGifts={goldGifts} {...overrides} />
    )
  }

  it("shows what is left of a purchase, what was given away, and values the row on what is left", () => {
    renderGold([GIFT])

    const table = document.querySelector("table") as HTMLTableElement
    const cells = table.querySelectorAll("tbody tr")[0].querySelectorAll("td")
    expect(cells[2]).toHaveTextContent("9 phân")
    expect(cells[2]).toHaveTextContent("đã tặng 1 phân")
    expect(cells[4]).toHaveTextContent(formatMoney(9 * 900_000))
    const heldBox = screen.getByText("Đang giữ").parentElement as HTMLElement
    expect(within(heldBox).getByText("9 phân")).toBeInTheDocument()
  })

  it("blocks deleting a purchase that has gifts taken out of it", () => {
    renderGold([GIFT])

    for (const button of screen.getAllByRole("button", { name: "Xoá giao dịch vàng 10/08/2026" })) {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute("title", "Không thể xoá — lần mua này đã có lần tặng. Huỷ các lần tặng trước.")
    }
  })

  it("drops a purchase given away in full from the list, counting only what is still held", () => {
    const second = { ...PURCHASE, id: 2, date: "11/08/2026", phan: 5 }
    renderGold([{ ...GIFT, qty: 10 }], [PURCHASE, second])

    expect(screen.getByText("Các lần mua vàng · 1 lần")).toBeInTheDocument()
    expect(document.querySelectorAll("table")[0].querySelectorAll("tbody tr")).toHaveLength(1)
    expect(screen.queryByRole("button", { name: "Sửa giao dịch vàng 10/08/2026" })).not.toBeInTheDocument()
    expect(screen.getByText("Lịch sử tặng · 1 lần")).toBeInTheDocument()
  })

  it("says everything was given away instead of 'no purchases yet' once no purchase is left", () => {
    renderGold([{ ...GIFT, qty: 10 }])

    expect(screen.getByText("Đã tặng hết các lần mua vàng — xem lại ở mục Lịch sử tặng.")).toBeInTheDocument()
    expect(screen.queryByText(/Chưa có giao dịch vàng nào/)).not.toBeInTheDocument()
  })

  it("opens the gift form from a purchase and reports the gift with today's date", () => {
    const onAddGoldGift = vi.fn(() => true)
    renderGold([GIFT], [PURCHASE], { onAddGoldGift })

    fireEvent.click(screen.getAllByRole("button", { name: "Tặng từ lần mua vàng 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Tặng vàng" })
    expect(within(dialog).getByText("Lần mua ngày 10/08/2026 ở SJC · tặng được tối đa 9 phân")).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText("Số lượng tặng (phân)", { exact: false }), {
      target: { value: "2" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onAddGoldGift).toHaveBeenCalledWith(1, { date: "20/10/2026", qty: 2 })
    expect(screen.queryByRole("dialog", { name: "Tặng vàng" })).not.toBeInTheDocument()
  })

  it("locks the gift button when less than one phân is left of a purchase", () => {
    renderGold([{ ...GIFT, qty: 10 }], [{ ...PURCHASE, phan: 10.3 }])

    for (const button of screen.getAllByRole("button", { name: "Tặng từ lần mua vàng 10/08/2026" })) {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute("title", "Còn dưới 1 phân — không tặng được.")
    }
  })

  it("refuses to edit a purchase's weight below what was already given away", () => {
    renderGold([{ ...GIFT, qty: 3 }])

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa giao dịch vàng 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Sửa lần mua vàng" })
    fireEvent.change(within(dialog).getByLabelText("Khối lượng (phân)", { exact: false }), { target: { value: "2" } })

    expect(within(dialog).getByText("Đã tặng 3 phân từ lần mua này — số lượng không được nhỏ hơn.")).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("edits a gift from the history up to what is left plus its own quantity", () => {
    const onUpdateGoldGift = vi.fn(() => true)
    renderGold([GIFT], [PURCHASE], { onUpdateGoldGift })

    fireEvent.click(screen.getByRole("button", { name: "Sửa lần tặng 12/10/2026" }))
    const dialog = screen.getByRole("dialog", { name: "Sửa lần tặng vàng" })
    expect(within(dialog).getByText("Lần mua ngày 10/08/2026 ở SJC · tặng được tối đa 1 chỉ")).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText("Số lượng tặng (phân)", { exact: false }), {
      target: { value: "2" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onUpdateGoldGift).toHaveBeenCalledWith(1, { date: "12/10/2026", qty: 2 })
  })

  it("asks before undoing a gift and says where the quantity goes back to", () => {
    const onRemoveGoldGift = vi.fn()
    renderGold([GIFT], [PURCHASE], { onRemoveGoldGift })

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần tặng 12/10/2026" }))
    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("Huỷ lần tặng này?")).toBeInTheDocument()
    expect(dialog).toHaveTextContent("1 phân sẽ trả về lần mua ngày 10/08/2026 ở SJC.")
    expect(onRemoveGoldGift).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole("button", { name: "Huỷ lần tặng" }))

    expect(onRemoveGoldGift).toHaveBeenCalledWith(1)
  })
  it("explains that a store is kept because its purchases were all given away", () => {
    renderGold([{ ...GIFT, qty: 10 }])

    expect(screen.getByRole("button", { name: "Xoá SJC" })).toHaveAttribute(
      "title",
      "Không thể xoá — các lần mua vàng ở cửa hàng này đã tặng hết nhưng vẫn còn trong Lịch sử tặng."
    )
  })

  it("names the purchase's current store when undoing or editing a gift, after a store rename", () => {
    renderGold([GIFT], [{ ...PURCHASE, store: "SJC Hà Nội" }])

    // Lịch sử vẫn giữ bản chụp lúc tặng.
    expect(screen.getByText("12/10/2026 · SJC")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần tặng 12/10/2026" }))
    expect(screen.getByRole("alertdialog")).toHaveTextContent("1 phân sẽ trả về lần mua ngày 10/08/2026 ở SJC Hà Nội.")
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Giữ lại" }))

    fireEvent.click(screen.getByRole("button", { name: "Sửa lần tặng 12/10/2026" }))
    expect(
      within(screen.getByRole("dialog", { name: "Sửa lần tặng vàng" })).getByText(
        "Lần mua ngày 10/08/2026 ở SJC Hà Nội · tặng được tối đa 1 chỉ"
      )
    ).toBeInTheDocument()
  })

  it("says undoing only clears the history when the gift's purchase is gone", () => {
    renderGold([{ ...GIFT, purchaseId: 99 }])

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần tặng 12/10/2026" }))

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Lần mua gốc không còn — huỷ chỉ xoá lần tặng 1 phân khỏi lịch sử."
    )
  })

  it("refuses to move a purchase's date past the earliest gift taken out of it", () => {
    renderGold([GIFT])

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa giao dịch vàng 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Sửa lần mua vàng" })
    const dateBox = within(dialog).getByLabelText("Ngày mua", { exact: false })

    fireEvent.change(dateBox, { target: { value: "13/10/2026" } })
    expect(
      within(dialog).getByText("Ngày mua không được sau lần tặng hoặc bán sớm nhất (12/10/2026)")
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeDisabled()

    fireEvent.change(dateBox, { target: { value: "12/10/2026" } })
    expect(within(dialog).getByRole("button", { name: "Lưu" })).not.toBeDisabled()
  })

  it("does not reopen a gift dialog on its own when its gift vanished and a new one took the same id", () => {
    function goldTab(goldGifts: MetalGift[]) {
      const summary = summarizeFinance({ ...DEFAULT_FINANCE_STATE, gold: [PURCHASE], goldStores: STORES, goldGifts })
      return <GoldTab summary={summary} stores={STORES} gold={[PURCHASE]} {...noopHandlers} goldGifts={goldGifts} />
    }
    const { rerender } = render(goldTab([GIFT]))

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần tặng 12/10/2026" }))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    // Tab khác vừa huỷ lần tặng này, rồi 1 lần tặng mới lấy lại đúng id 1.
    rerender(goldTab([]))
    rerender(goldTab([{ ...GIFT, date: "15/10/2026" }]))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Sửa lần tặng 15/10/2026" }))
    expect(screen.getByRole("dialog", { name: "Sửa lần tặng vàng" })).toBeInTheDocument()
    rerender(goldTab([]))
    rerender(goldTab([GIFT]))
    expect(screen.queryByRole("dialog", { name: "Sửa lần tặng vàng" })).not.toBeInTheDocument()
  })
})

describe("GoldTab — bán", () => {
  const PURCHASE = { id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }
  const GIFT: MetalGift = { id: 1, purchaseId: 1, date: "12/10/2026", qty: 1, store: "SJC", buy: 900_000 }
  const SALE: MetalSale = {
    id: 1,
    purchaseId: 1,
    date: "15/10/2026",
    qty: 2,
    store: "SJC",
    buy: 900_000,
    received: 1_900_000,
    fundName: "Quỹ A",
  }
  const STORES: GoldStore[] = [{ name: "SJC", price: "900.000" }]
  const FUND: SavingsFund = { name: "Quỹ A", amount: 5_000_000, target: 0 }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 20, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  interface RenderOptions {
    gifts?: MetalGift[]
    sales?: MetalSale[]
    gold?: (typeof PURCHASE)[]
    savings?: SavingsFund[]
    overrides?: Partial<typeof noopHandlers>
  }

  function goldTab({ gifts = [], sales = [], gold = [PURCHASE], savings = [FUND], overrides = {} }: RenderOptions) {
    const summary = summarizeFinance({
      ...DEFAULT_FINANCE_STATE,
      gold,
      goldStores: STORES,
      goldGifts: gifts,
      goldSales: sales,
    })
    return (
      <GoldTab
        summary={summary}
        stores={STORES}
        gold={gold}
        {...noopHandlers}
        goldGifts={gifts}
        goldSales={sales}
        savings={savings}
        {...overrides}
      />
    )
  }

  function renderGold(options: RenderOptions = {}) {
    return render(goldTab(options))
  }

  it("shows what is left after gifts and sales, naming both under the weight", () => {
    renderGold({ gifts: [GIFT], sales: [SALE] })

    const cells = (document.querySelector("table") as HTMLTableElement)
      .querySelectorAll("tbody tr")[0]
      .querySelectorAll("td")
    expect(cells[2]).toHaveTextContent("7 phân")
    expect(cells[2]).toHaveTextContent("đã tặng 1 phân · đã bán 2 phân")
    expect(cells[4]).toHaveTextContent(formatMoney(7 * 900_000))
    const heldBox = screen.getByText("Đang giữ").parentElement as HTMLElement
    expect(within(heldBox).getByText("7 phân")).toBeInTheDocument()
    const notes = screen.getAllByTestId("taken-out-note")
    expect(notes).toHaveLength(2)
    for (const note of notes) expect(note).toHaveTextContent("đã tặng 1 phân · đã bán 2 phân")
  })

  it("switches between tables and cards by the card's own width, never by the screen's", () => {
    renderGold()

    // jsdom không tính container query — chỉ khoá đúng các class. Ngưỡng là bề rộng tự nhiên đo được của 2 bảng
    // (≈1.105px và ≈803px khi có tên cửa hàng dài): Card hẹp hơn thì dùng dạng thẻ, không bắt cuộn ngang.
    const [purchasesTable, summaryTable] = Array.from(document.querySelectorAll("table"))
    const purchasesWrapper = purchasesTable.parentElement?.parentElement as HTMLElement
    const purchasesCards = purchasesWrapper.nextElementSibling as HTMLElement
    expect(purchasesWrapper).toHaveClass("hidden", "@min-[1100px]:block")
    expect(purchasesCards).toHaveClass("@min-[1100px]:hidden")
    // Laptop (Card ~900–1.060px): thẻ đứng 2 cột thay vì 1 thẻ kéo dài cả hàng.
    expect(purchasesCards.firstElementChild).toHaveClass("grid", "@min-[800px]:grid-cols-2")
    const summaryWrapper = summaryTable.parentElement?.parentElement as HTMLElement
    const summaryCards = summaryWrapper.nextElementSibling as HTMLElement
    expect(summaryWrapper).toHaveClass("hidden", "@min-[820px]:block")
    expect(summaryCards).toHaveClass("@min-[820px]:hidden")
    for (const wrapper of [purchasesWrapper, purchasesCards, summaryWrapper, summaryCards]) {
      expect(wrapper.className).not.toMatch(/(^|\s)lg:/)
    }
  })

  it("lets the gift and sale note break only at the dot, so the table never widens for the whole line", () => {
    renderGold({ gifts: [GIFT], sales: [SALE] })

    // jsdom không dàn trang — chỉ khoá đúng các class mà việc xuống dòng dựa vào. Bảng: mỗi phần giữ nguyên
    // (cột rộng bằng phần dài nhất, không bằng cả câu); thẻ: phần dài hơn cả ô vẫn được ngắt bên trong.
    const [tableNote, cardNote] = screen.getAllByTestId("taken-out-note")
    expect(tableNote.closest("td")).not.toBeNull()
    expect(tableNote).toHaveClass("whitespace-normal")
    const tableParts = Array.from(tableNote.children)
    expect(tableParts.map((part) => part.textContent)).toEqual(["đã tặng 1 phân ·", "đã bán 2 phân"])
    for (const part of tableParts) expect(part).toHaveClass("inline-block", "whitespace-nowrap")
    for (const part of Array.from(cardNote.children)) {
      expect(part).toHaveClass("inline-block")
      expect(part).not.toHaveClass("whitespace-nowrap")
    }
  })

  it("locks undo, saying why on screen, when the fund no longer holds what the sale brought in", () => {
    renderGold({ sales: [SALE], savings: [{ ...FUND, amount: 1_000_000 }] })

    const reason = 'Sổ "Quỹ A" không còn đủ tiền để rút lại số đã nhận — không huỷ được lần bán này.'
    expect(screen.getByRole("button", { name: "Huỷ lần bán 15/10/2026" })).toBeDisabled()
    expect(screen.getByText(reason)).toBeInTheDocument()
  })

  it("caps both the gift form and the sale form at what is left", () => {
    renderGold({ gifts: [GIFT], sales: [SALE] })

    fireEvent.click(screen.getAllByRole("button", { name: "Tặng từ lần mua vàng 10/08/2026" })[0])
    expect(screen.getByText("Lần mua ngày 10/08/2026 ở SJC · tặng được tối đa 7 phân")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    fireEvent.click(screen.getAllByRole("button", { name: "Bán từ lần mua vàng 10/08/2026" })[0])
    expect(screen.getByText("Lần mua ngày 10/08/2026 ở SJC · bán được tối đa 7 phân")).toBeInTheDocument()
  })

  it("opens the sale form from a purchase and reports the sale with today's date", () => {
    const onAddGoldSale = vi.fn(() => true)
    renderGold({ overrides: { onAddGoldSale } })

    fireEvent.click(screen.getAllByRole("button", { name: "Bán từ lần mua vàng 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Bán vàng" })
    fireEvent.change(within(dialog).getByLabelText("Số lượng bán (phân)", { exact: false }), {
      target: { value: "2" },
    })
    fireEvent.change(within(dialog).getByLabelText("Tiền thực nhận", { exact: false }), {
      target: { value: "1900000" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Quỹ A" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onAddGoldSale).toHaveBeenCalledWith(1, {
      date: "20/10/2026",
      qty: 2,
      received: 1_900_000,
      fundName: "Quỹ A",
    })
    expect(screen.queryByRole("dialog", { name: "Bán vàng" })).not.toBeInTheDocument()
  })

  it("locks the sell button until there is a savings fund to receive the money, saying so on screen", () => {
    const { unmount } = renderGold({ savings: [] })

    // Màn cảm ứng không hiện title của nút bị khoá — lý do nằm ngay trên thẻ.
    expect(
      screen.getByText("Nút Bán đang khoá vì chưa có sổ tiết kiệm nào để nhận tiền — tạo 1 sổ ở tab Tiết kiệm trước.")
    ).toBeInTheDocument()

    for (const button of screen.getAllByRole("button", { name: "Bán từ lần mua vàng 10/08/2026" })) {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute("title", "Chưa có sổ tiết kiệm nào để nhận tiền — tạo 1 sổ ở tab Tiết kiệm trước.")
    }
    unmount()

    renderGold()
    expect(screen.queryByText(/Nút Bán đang khoá/)).not.toBeInTheDocument()
  })

  it("locks the sell button when less than one phân is left of a purchase", () => {
    renderGold({ sales: [{ ...SALE, qty: 10 }], gold: [{ ...PURCHASE, phan: 10.3 }] })

    for (const button of screen.getAllByRole("button", { name: "Bán từ lần mua vàng 10/08/2026" })) {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute("title", "Còn dưới 1 phân — không bán được.")
    }
  })

  it("blocks deleting a purchase that has a sale taken out of it", () => {
    renderGold({ sales: [SALE] })

    for (const button of screen.getAllByRole("button", { name: "Xoá giao dịch vàng 10/08/2026" })) {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute(
        "title",
        "Không thể xoá — lần mua này đã có lần tặng hoặc lần bán. Huỷ chúng trước."
      )
    }
  })

  it("refuses to edit a purchase's weight below what was given away and sold", () => {
    renderGold({ gifts: [GIFT], sales: [SALE] })

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa giao dịch vàng 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Sửa lần mua vàng" })
    fireEvent.change(within(dialog).getByLabelText("Khối lượng (phân)", { exact: false }), { target: { value: "2" } })

    expect(
      within(dialog).getByText("Đã tặng 1 phân · đã bán 2 phân từ lần mua này — số lượng không được nhỏ hơn.")
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("refuses to move a purchase's date past the earliest sale taken out of it", () => {
    renderGold({ gifts: [GIFT], sales: [{ ...SALE, date: "01/10/2026" }] })

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa giao dịch vàng 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Sửa lần mua vàng" })
    fireEvent.change(within(dialog).getByLabelText("Ngày mua", { exact: false }), { target: { value: "05/10/2026" } })

    expect(
      within(dialog).getByText("Ngày mua không được sau lần tặng hoặc bán sớm nhất (01/10/2026)")
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("asks before undoing a sale, naming the money and the fund it comes back out of", () => {
    const onRemoveGoldSale = vi.fn()
    renderGold({ sales: [SALE], overrides: { onRemoveGoldSale } })

    expect(screen.getByText("Lịch sử bán · 1 lần")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần bán 15/10/2026" }))
    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("Huỷ lần bán này?")).toBeInTheDocument()
    expect(dialog).toHaveTextContent(
      `2 phân sẽ trả về lần mua ngày 10/08/2026 ở SJC, và ${formatMoney(1_900_000)} được rút lại khỏi sổ "Quỹ A".`
    )

    fireEvent.click(within(dialog).getByRole("button", { name: "Giữ lại" }))
    expect(onRemoveGoldSale).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần bán 15/10/2026" }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Huỷ lần bán" }))
    expect(onRemoveGoldSale).toHaveBeenCalledWith(1)
  })

  it("says everything was sold, or given away and sold, once no purchase is left", () => {
    const { unmount } = renderGold({ sales: [{ ...SALE, qty: 10 }] })
    expect(screen.getByText("Đã bán hết các lần mua vàng — xem lại ở mục Lịch sử bán.")).toBeInTheDocument()
    unmount()

    renderGold({ gifts: [GIFT], sales: [{ ...SALE, qty: 9 }] })
    expect(
      screen.getByText("Đã tặng và bán hết các lần mua vàng — xem lại ở mục Lịch sử tặng và Lịch sử bán.")
    ).toBeInTheDocument()
  })

  it("explains that a store is kept because its purchases were all sold, or given away and sold", () => {
    const { unmount } = renderGold({ sales: [{ ...SALE, qty: 10 }] })
    expect(screen.getByRole("button", { name: "Xoá SJC" })).toHaveAttribute(
      "title",
      "Không thể xoá — các lần mua vàng ở cửa hàng này đã bán hết nhưng vẫn còn trong Lịch sử bán."
    )
    unmount()

    renderGold({ gifts: [GIFT], sales: [{ ...SALE, qty: 9 }] })
    expect(screen.getByRole("button", { name: "Xoá SJC" })).toHaveAttribute(
      "title",
      "Không thể xoá — các lần mua vàng ở cửa hàng này đã tặng và bán hết nhưng vẫn còn trong Lịch sử tặng và Lịch sử bán."
    )
  })

  it("says undoing still takes the money back out of the fund when the sale's purchase is gone", () => {
    renderGold({ sales: [{ ...SALE, purchaseId: 99 }] })

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần bán 15/10/2026" }))

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      `Lần mua gốc không còn — huỷ xoá lần bán 2 phân khỏi lịch sử, và ${formatMoney(1_900_000)} được rút lại khỏi sổ "Quỹ A".`
    )
  })

  it("does not reopen a sale dialog on its own when its sale vanished and a new one took the same id", () => {
    const { rerender } = renderGold({ sales: [SALE] })

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần bán 15/10/2026" }))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    // Tab khác vừa huỷ lần bán này, rồi 1 lần bán mới lấy lại đúng id 1.
    rerender(goldTab({ sales: [] }))
    rerender(goldTab({ sales: [{ ...SALE, date: "16/10/2026" }] }))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("closes the sale form when its purchase vanished", () => {
    const { rerender } = renderGold()

    fireEvent.click(screen.getAllByRole("button", { name: "Bán từ lần mua vàng 10/08/2026" })[0])
    expect(screen.getByRole("dialog", { name: "Bán vàng" })).toBeInTheDocument()
    rerender(goldTab({ gold: [] }))
    rerender(goldTab({ gold: [PURCHASE] }))

    expect(screen.queryByRole("dialog", { name: "Bán vàng" })).not.toBeInTheDocument()
  })
})
