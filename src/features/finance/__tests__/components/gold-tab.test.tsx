import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { phanToChi, pct1, summarizeFinance, type FinanceSummary } from "@/lib/finance/finance-calculations"
import { DEFAULT_FINANCE_STATE } from "@/lib/finance/finance-storage"
import { GoldTab } from "../../components/gold-tab"
import type { GoldStore, MetalGift } from "@/lib/finance/types"

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
})
