import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, render, screen, fireEvent, within } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { wholeText } from "@/test/whole-text"
import { FinanceView } from "../../components/finance-view"
import { DEFAULT_FINANCE_STATE, FINANCE_STORAGE_KEY } from "@/lib/finance/finance-storage"

describe("FinanceView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("adding a savings fund updates the net-worth card's figure and the Tiết kiệm pillar", () => {
    render(<FinanceView />)

    const netSection = screen.getByText("Tài sản ròng").closest("section") as HTMLElement
    expect(within(netSection).getByText(formatMoney(0))).toBeInTheDocument()
    expect(screen.getByText("Chưa có quỹ nào")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Thêm quỹ tiết kiệm" }))
    fireEvent.change(screen.getByLabelText("Tên quỹ"), {
      target: { value: "Quỹ khẩn cấp" },
    })
    fireEvent.change(screen.getByLabelText("Số tiền hiện có", { exact: false }), {
      target: { value: "3000000" },
    })
    fireEvent.change(screen.getByLabelText("Mục tiêu", { exact: false }), {
      target: { value: "5000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    // Tài sản ròng đếm tăng dần (CountMoney) khi lần đầu có giá trị thật khác 0 — chờ animation chạy xong.
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(within(netSection).getByText(formatMoney(3_000_000))).toBeInTheDocument()

    // "Tiết kiệm" cũng xuất hiện trong chú giải màu của NetWorthCard và trong nút Tabs —
    // chỉ span nhãn Card (class "uppercase") mới là tiêu đề PillarCard thật sự.
    const pillarLabel = screen
      .getAllByText("Tiết kiệm")
      .find((el) => el.tagName === "SPAN" && el.className.includes("uppercase")) as HTMLElement
    const pillarSection = pillarLabel.closest("section") as HTMLElement
    expect(within(pillarSection).getByText(formatMoney(3_000_000))).toBeInTheDocument()
    expect(within(pillarSection).getByText("1 quỹ đang chạy")).toBeInTheDocument()
  })

  it("setting up a gold store and adding a purchase produces the correct P&L figure on the Tích lũy vàng tab", () => {
    render(<FinanceView />)

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy vàng" }))

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))
    fireEvent.change(screen.getByLabelText("Tên cửa hàng", { exact: false }), {
      target: { value: "SJC" },
    })
    fireEvent.change(screen.getByLabelText("Giá hôm nay", { exact: false }), {
      target: { value: "900000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))
    fireEvent.click(screen.getByRole("button", { name: "SJC" }))
    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), {
      target: { value: "10/08/2026" },
    })
    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), {
      target: { value: "10" },
    })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false }), {
      target: { value: "800000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    // vốn 10 phân * 800.000 = 8.000.000, giá trị 10 phân * 900.000 = 9.000.000 => lãi 1.000.000
    // "+ 1.000.000" chỉ còn hiện ở khối lãi/lỗ tổng (hero) — nơi duy nhất chưa đổi sang icon.
    // Khối tổng lãi trong Card "Các lần mua vàng", badge trong bảng desktop và box Lãi lỗ ở card
    // mobile, cộng thêm dòng riêng cửa hàng + dòng "Tổng cộng" ở cả bản bảng (desktop) và bản
    // card (mobile) của "Tổng hợp theo cửa hàng" — tất cả đều đã đổi dấu +/− thành icon mũi tên,
    // nên "1.000.000" không dấu khớp 7 nơi này (bảng + card mobile cùng render song song trong
    // test, chỉ ẩn/hiện qua CSS theo breakpoint).
    expect(screen.getAllByText(`+ ${formatMoney(1_000_000)}`)).toHaveLength(1)
    expect(screen.getAllByText(formatMoney(1_000_000))).toHaveLength(7)
    expect(
      screen.getByText(`Bạn đang lãi ${formatMoney(1_000_000)} so với giá vốn nhờ giá vàng tăng.`)
    ).toBeInTheDocument()
  })

  it("stagger-animates the net-worth and pillar cards in on mount, like the Tổng quan sections", () => {
    render(<FinanceView />)

    const netSection = screen.getByText("Tài sản ròng").closest("section") as HTMLElement
    expect(netSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("stagger-animates the active tab's content back in on every tab switch", () => {
    render(<FinanceView />)

    const savingsSection = screen.getByText("Tiết kiệm ·", { exact: false }).closest("section") as HTMLElement
    expect(savingsSection.parentElement).toHaveClass("ob-card-grid")
  })

  it("switches through all five tabs and renders each tab's distinctive content", () => {
    render(<FinanceView />)

    expect(
      screen.getByText("Chưa có quỹ tiết kiệm nào. Thêm quỹ đầu tiên để bắt đầu theo dõi mục tiêu.")
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Nợ thẻ tín dụng" }))
    expect(
      screen.getByText("Chưa có thẻ tín dụng nào. Thêm thẻ đầu tiên để theo dõi dư nợ và hạn trả.")
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy vàng" }))
    expect(screen.getByText("Giá thị trường hôm nay")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy bạc" }))
    expect(screen.getByRole("button", { name: "Thêm lần mua bạc" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Đầu tư" }))
    expect(screen.getByRole("button", { name: "Thêm khoản đầu tư" })).toBeInTheDocument()
  })
  it("names the due date of the card that is actually due next, ignoring cards already paid off", () => {
    // 30/09/2026: thẻ A hạn ngày 25 (→ 25/10), thẻ B hạn ngày 5 (→ 05/10), thẻ C đã trả hết (hạn ngày 1).
    vi.setSystemTime(new Date(2026, 8, 30, 9, 0))
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        cards: [
          { name: "Thẻ A", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "25/10" },
          { name: "Thẻ B", balance: 2_000_000, min: 200_000, limit: 10_000_000, due: "05/10" },
          { name: "Thẻ C", balance: 0, min: 0, limit: 5_000_000, due: "01" },
        ],
      })
    )

    render(<FinanceView />)

    expect(screen.getByText("3 thẻ · hạn gần nhất 05/10")).toBeInTheDocument()
  })

  it("says the cards owe nothing instead of naming a due date once every card is paid off", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        cards: [{ name: "Thẻ A", balance: 0, min: 0, limit: 10_000_000, due: "15 hàng tháng" }],
      })
    )

    render(<FinanceView />)

    expect(screen.getByText("1 thẻ · không nợ")).toBeInTheDocument()
  })
  it("shows 0 phân and a flat % on the gold pillar before any gold is bought", () => {
    render(<FinanceView />)
    expect(screen.getByText(wholeText("0 phân · +0,0%"))).toBeInTheDocument()
  })

  it("shows the phân held and the % gain on the gold pillar once there is gold", () => {
    // 10 phân mua 800.000/phân, SJC hôm nay 900.000/phân: vốn 8.000.000, giá trị 9.000.000 → +12,5%.
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        gold: [{ id: 1, date: "10/08/2026", phan: 10, buy: 800_000, store: "SJC" }],
        goldStores: [{ name: "SJC", price: "900000" }],
      })
    )

    render(<FinanceView />)

    expect(screen.getByText(wholeText("10 phân · +12,5%"))).toBeInTheDocument()
  })

  it("colours the gold and silver pillar % red for a loss and green for a gain, but not at break-even", () => {
    // Vàng: mua 900.000/phân, giá nay 825.000 → −8,3%. Bạc: mua 1.800.000/lượng, giá nay 2.000.000 → +11,1%.
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        gold: [{ id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }],
        goldStores: [{ name: "SJC", price: "825000" }],
        silver: [{ id: 2, date: "10/08/2026", luong: 1, buy: 1_800_000, store: "Phú Quý" }],
        silverStores: [{ name: "Phú Quý", price: "2000000" }],
      })
    )

    render(<FinanceView />)

    const goldHint = screen.getByText(wholeText("10 phân · −8,3%"))
    expect(within(goldHint).getByText("−8,3%")).toHaveStyle({ color: "var(--ob-color-expense)" })
    const silverHint = screen.getByText(wholeText("1 lượng · +11,1%"))
    expect(within(silverHint).getByText("+11,1%")).toHaveStyle({ color: "var(--ob-color-income)" })
  })

  it("colours the investment pillar % the same way as gold and silver", () => {
    // Vốn 10.000.000, giá trị hiện tại 9.000.000 → −10,0%.
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        invests: [{ id: 1, name: "VESAF", cost: 10_000_000, value: 9_000_000 }],
      })
    )

    render(<FinanceView />)

    const investHint = screen.getByText(wholeText("1 khoản · −10,0%"))
    expect(within(investHint).getByText("−10,0%")).toHaveStyle({ color: "var(--ob-color-expense)" })
  })

  // Ô chứa số tiền của 1 trụ (PillarCard tô màu ở ô này, Figure bên trong thừa hưởng). Nhãn trụ là span
  // "uppercase" của Card — "Đầu tư" còn có ở nút tab và chú giải Tài sản ròng.
  function pillarAmount(label: string): HTMLElement {
    const section = screen
      .getAllByText(label)
      .find((el) => el.tagName === "SPAN" && el.className.includes("uppercase"))
      ?.closest("section") as HTMLElement
    return section.querySelector(".grid > div") as HTMLElement
  }

  it("colours the pillar amounts like their %: red for a loss, green for a gain, plain at break-even", () => {
    // Vàng: mua 900.000/phân, giá nay 825.000 → lỗ. Bạc: cửa hàng chưa có giá → tính theo giá mua, hoà vốn.
    // Đầu tư: vốn 10.000.000, giá trị 11.000.000 → lãi.
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        gold: [{ id: 1, date: "10/08/2026", phan: 10, buy: 900_000, store: "SJC" }],
        goldStores: [{ name: "SJC", price: "825000" }],
        silver: [{ id: 1, date: "10/08/2026", luong: 1, buy: 1_800_000, store: "Phú Quý" }],
        silverStores: [{ name: "Phú Quý", price: "" }],
        invests: [{ id: 1, name: "VESAF", cost: 10_000_000, value: 11_000_000 }],
      })
    )

    render(<FinanceView />)

    expect(pillarAmount("Tích lũy vàng")).toHaveStyle({ color: "var(--ob-color-expense)" })
    expect(pillarAmount("Tích lũy bạc").getAttribute("style") ?? "").not.toContain("color")
    expect(pillarAmount("Đầu tư")).toHaveStyle({ color: "var(--ob-color-income)" })
  })

  it("leaves the gold, silver and investment pillar amounts uncoloured before anything is bought", () => {
    render(<FinanceView />)

    for (const label of ["Tích lũy vàng", "Tích lũy bạc", "Đầu tư"]) {
      expect(pillarAmount(label).getAttribute("style") ?? "", label).not.toContain("color")
    }
  })

  it("leaves the pillar % uncoloured when nothing is bought yet", () => {
    render(<FinanceView />)

    const goldHint = screen.getByText(wholeText("0 phân · +0,0%"))
    expect(within(goldHint).getByText("+0,0%").getAttribute("style") ?? "").not.toContain("color")
    expect(screen.getByText("Chưa có khoản nào").textContent).toBe("Chưa có khoản nào")
  })
  it("places the Tích lũy bạc tab right after Tích lũy vàng", () => {
    render(<FinanceView />)

    const gold = screen.getByRole("button", { name: "Tích lũy vàng" })
    const silver = screen.getByRole("button", { name: "Tích lũy bạc" })
    expect(gold.nextElementSibling).toBe(silver)
    expect(silver.nextElementSibling).toBe(screen.getByRole("button", { name: "Đầu tư" }))
  })

  it("shows 0 lượng and a flat % on the silver pillar before any silver is bought", () => {
    render(<FinanceView />)

    expect(screen.getByText(wholeText("0 lượng · +0,0%"))).toBeInTheDocument()
  })

  it("setting up a silver store and buying 2 lượng shows the P&L, the silver pillar and the net worth", () => {
    render(<FinanceView />)

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy bạc" }))

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))
    fireEvent.change(screen.getByLabelText("Tên cửa hàng", { exact: false }), { target: { value: "Phú Quý" } })
    fireEvent.change(screen.getByLabelText("Giá hôm nay", { exact: false }), { target: { value: "2000000" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua bạc" }))
    fireEvent.click(screen.getByRole("button", { name: "Phú Quý" }))
    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "10/08/2026" } })
    fireEvent.change(screen.getByLabelText("Khối lượng (lượng)", { exact: false }), { target: { value: "2" } })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi lượng)", { exact: false }), {
      target: { value: "1800000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    act(() => {
      vi.advanceTimersByTime(1200)
    })

    // vốn 2 × 1.800.000 = 3.600.000, giá trị 2 × 2.000.000 = 4.000.000 → lãi 400.000 (+11,1%).
    expect(screen.getByText(`+ ${formatMoney(400_000)}`)).toBeInTheDocument()
    expect(screen.getByText(wholeText("2 lượng · +11,1%"))).toBeInTheDocument()
    const netSection = screen.getByText("Tài sản ròng").closest("section") as HTMLElement
    expect(within(netSection).getByText(formatMoney(4_000_000))).toBeInTheDocument()
    expect(within(netSection).getByText("Bạc")).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(FINANCE_STORAGE_KEY) ?? "{}").silver).toEqual([
      { id: 1, date: "10/08/2026", luong: 2, buy: 1_800_000, store: "Phú Quý" },
    ])
  })

  it("does not carry an open add-purchase form from the gold tab over to the silver tab", () => {
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        goldStores: [{ name: "SJC", price: "900000" }],
        silverStores: [{ name: "Phú Quý", price: "2000000" }],
      })
    )
    render(<FinanceView />)

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy vàng" }))
    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))
    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), { target: { value: "10" } })

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy bạc" }))

    expect(screen.queryByText("Lần mua bạc mới")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm lần mua bạc" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy vàng" }))

    expect(screen.queryByText("Lần mua vàng mới")).not.toBeInTheDocument()
  })
  it("lays the five pillars out against the pillar row's own width (5 in a row, or at most 3 per row)", () => {
    render(<FinanceView />)

    // jsdom không tính được container query — chỉ khoá đúng các class mà quy tắc 5 trụ / 3+2 dựa vào.
    const pillars = ["Tiết kiệm", "Nợ thẻ tín dụng", "Tích lũy vàng", "Tích lũy bạc", "Đầu tư"].map(
      (label) =>
        screen
          .getAllByText(label)
          .find((el) => el.tagName === "SPAN" && el.className.includes("uppercase"))
          ?.closest("section") as HTMLElement
    )
    for (const pillar of pillars) {
      expect(pillar).toHaveClass("min-w-[260px]", "flex-[1_1_calc((100%_-_2rem)/3)]", "@min-[1364px]:flex-[1_1_0%]")
    }
    expect(pillars[0].parentElement).toHaveClass("@container")
  })
  it("gives away 1 phân from a purchase, then undoes it, with the pillar, net worth and history following", () => {
    // 10 phân mua 800.000/phân, SJC hôm nay 900.000/phân.
    window.localStorage.setItem(
      FINANCE_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_FINANCE_STATE,
        gold: [{ id: 1, date: "10/08/2026", phan: 10, buy: 800_000, store: "SJC" }],
        goldStores: [{ name: "SJC", price: "900000" }],
      })
    )
    render(<FinanceView />)
    const netSection = screen.getByText("Tài sản ròng").closest("section") as HTMLElement

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy vàng" }))
    fireEvent.click(screen.getAllByRole("button", { name: "Tặng từ lần mua vàng 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Tặng vàng" })
    fireEvent.change(within(dialog).getByLabelText("Ngày tặng", { exact: false }), { target: { value: "12/10/2026" } })
    fireEvent.change(within(dialog).getByLabelText("Số lượng tặng (phân)", { exact: false }), {
      target: { value: "1" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    // Còn 9 phân: vốn 7.200.000, giá trị 8.100.000 → +12,5%; Tài sản ròng = 8.100.000.
    expect(screen.getByText(wholeText("9 phân · +12,5%"))).toBeInTheDocument()
    expect(within(netSection).getByText(formatMoney(8_100_000))).toBeInTheDocument()
    expect(screen.getByText("Lịch sử tặng · 1 lần")).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(FINANCE_STORAGE_KEY) ?? "{}").goldGifts).toEqual([
      { id: 1, purchaseId: 1, date: "12/10/2026", qty: 1, store: "SJC", buy: 800_000 },
    ])

    fireEvent.click(screen.getByRole("button", { name: "Huỷ lần tặng 12/10/2026" }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Huỷ lần tặng" }))
    act(() => {
      vi.advanceTimersByTime(1200)
    })

    expect(screen.getByText(wholeText("10 phân · +12,5%"))).toBeInTheDocument()
    expect(within(netSection).getByText(formatMoney(9_000_000))).toBeInTheDocument()
    expect(screen.queryByText(/Lịch sử tặng/)).not.toBeInTheDocument()
  })
})
