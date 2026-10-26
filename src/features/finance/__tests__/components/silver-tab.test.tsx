import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { pct1, summarizeFinance, type FinanceSummary } from "@/lib/finance/finance-calculations"
import { DEFAULT_FINANCE_STATE } from "@/lib/finance/finance-storage"
import type { MetalGift, SilverPurchase, SilverStore } from "@/lib/finance/types"
import { SilverTab } from "../../components/silver-tab"

const ZERO_SUMMARY: FinanceSummary = summarizeFinance(DEFAULT_FINANCE_STATE)

const PHU_QUY: SilverStore = { name: "Phú Quý", price: "2.000.000" }
const PURCHASE: SilverPurchase = { id: 1, date: "10/08/2026", luong: 2, buy: 1_800_000, store: "Phú Quý" }

const noopHandlers = {
  onAddSilverStore: vi.fn(),
  onUpdateSilverStore: vi.fn(),
  onRemoveSilverStore: vi.fn(),
  onSetSilverStorePrice: vi.fn(),
  onAddSilver: vi.fn(),
  onUpdateSilver: vi.fn(),
  onRemoveSilver: vi.fn(),
  silverGifts: [] as MetalGift[],
  onAddSilverGift: vi.fn(() => true),
  onUpdateSilverGift: vi.fn(() => true),
  onRemoveSilverGift: vi.fn(),
}

function summaryOf(silver: SilverPurchase[], silverStores: SilverStore[]): FinanceSummary {
  return summarizeFinance({ ...DEFAULT_FINANCE_STATE, silver, silverStores })
}

describe("SilverTab", () => {
  it("shows the empty state in lượng, with no conversion and a 3-cell stat grid", () => {
    render(<SilverTab summary={ZERO_SUMMARY} stores={[]} silver={[]} {...noopHandlers} />)

    expect(screen.getByText("Chưa có bạc nào — thêm lần mua đầu tiên để theo dõi lãi/lỗ.")).toBeInTheDocument()
    const heldBox = screen.getByText("Đang giữ").parentElement as HTMLElement
    expect(within(heldBox).getByText("0 lượng")).toBeInTheDocument()
    expect(screen.queryByText("Quy đổi")).not.toBeInTheDocument()
    expect(heldBox.parentElement).toHaveClass("sm:grid-cols-3")
    expect(heldBox.parentElement?.children).toHaveLength(3)
    expect(screen.getByText("Các lần mua bạc")).toBeInTheDocument()
    expect(
      screen.getAllByText("Chưa có giao dịch bạc nào. Thêm lần mua đầu tiên để bắt đầu theo dõi lãi/lỗ.")
    ).toHaveLength(2)
  })

  it("explains a gain per lượng with the silver wording", () => {
    const silver = [PURCHASE]
    render(<SilverTab summary={summaryOf(silver, [PHU_QUY])} stores={[PHU_QUY]} silver={silver} {...noopHandlers} />)

    // 2 lượng mua 1.800.000, giá hôm nay 2.000.000: vốn 3.600.000, giá trị 4.000.000, lãi 400.000.
    expect(screen.getByText(`+ ${formatMoney(400_000)}`)).toBeInTheDocument()
    expect(screen.getByText(pct1((400_000 / 3_600_000) * 100), { exact: false })).toBeInTheDocument()
    expect(
      screen.getByText(`Bạn đang lãi ${formatMoney(400_000)} so với giá vốn nhờ giá bạc tăng.`)
    ).toBeInTheDocument()
    const heldBox = screen.getByText("Đang giữ").parentElement as HTMLElement
    expect(within(heldBox).getByText("2 lượng")).toBeInTheDocument()
    expect(screen.getByText(`${formatMoney(1_800_000)} / lượng`)).toBeInTheDocument()
    expect(screen.getByText(`${formatMoney(2_000_000)} / lượng`)).toBeInTheDocument()
    expect(screen.getByText("Các lần mua bạc · 1 lần")).toBeInTheDocument()
  })

  it("explains a loss with the silver wording", () => {
    const silver = [PURCHASE]
    const stores = [{ name: "Phú Quý", price: "1.500.000" }]
    render(<SilverTab summary={summaryOf(silver, stores)} stores={stores} silver={silver} {...noopHandlers} />)

    expect(screen.getByText(`Bạn đang lỗ ${formatMoney(600_000)} so với giá vốn do giá bạc giảm.`)).toBeInTheDocument()
  })

  it("says silver from a store without today's price is valued at its buy price", () => {
    const silver = [PURCHASE]
    const stores = [{ name: "Phú Quý", price: "" }]
    render(<SilverTab summary={summaryOf(silver, stores)} stores={stores} silver={silver} {...noopHandlers} />)

    expect(
      screen.getByText("Chưa nhập giá hôm nay cho Phú Quý — bạc mua ở đó đang tạm tính theo giá mua.")
    ).toBeInTheDocument()
  })

  it("lists each purchase's weight in lượng in the table, the cards and the per-store summary", () => {
    const silver = [PURCHASE]
    render(<SilverTab summary={summaryOf(silver, [PHU_QUY])} stores={[PHU_QUY]} silver={silver} {...noopHandlers} />)

    // Bảng + card giao dịch, dòng Phú Quý + dòng Tổng cộng ở bảng và card tổng hợp, ô "Đang giữ".
    expect(screen.getAllByText("2 lượng")).toHaveLength(7)
    expect(screen.queryByText(/chỉ|phân/)).not.toBeInTheDocument()
  })

  it("prices silver stores per lượng and suggests a silver shop name", () => {
    render(<SilverTab summary={ZERO_SUMMARY} stores={[PHU_QUY]} silver={[]} {...noopHandlers} />)

    expect(screen.getByText("Giá hôm nay (mỗi lượng)")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Giá Phú Quý hôm nay (mỗi lượng)" })).toHaveValue("2.000.000")

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))

    expect(screen.getByLabelText("Tên cửa hàng")).toHaveAttribute("placeholder", "vd: Phú Quý")
    expect(screen.getByLabelText("Giá hôm nay (mỗi lượng)", { exact: false })).toBeInTheDocument()
  })

  it("reports a new silver store through onAddSilverStore", () => {
    const onAddSilverStore = vi.fn()
    render(
      <SilverTab summary={ZERO_SUMMARY} stores={[]} silver={[]} {...noopHandlers} onAddSilverStore={onAddSilverStore} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm cửa hàng" }))
    fireEvent.change(screen.getByLabelText("Tên cửa hàng"), { target: { value: "Ancarat" } })
    fireEvent.change(screen.getByLabelText("Giá hôm nay (mỗi lượng)", { exact: false }), {
      target: { value: "2050000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAddSilverStore).toHaveBeenCalledWith({ name: "Ancarat", price: "2050000" })
  })

  it("reports a silver store rename and a removal", () => {
    const onUpdateSilverStore = vi.fn()
    const onRemoveSilverStore = vi.fn()
    render(
      <SilverTab
        summary={ZERO_SUMMARY}
        stores={[PHU_QUY]}
        silver={[]}
        {...noopHandlers}
        onUpdateSilverStore={onUpdateSilverStore}
        onRemoveSilverStore={onRemoveSilverStore}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Sửa Phú Quý" }))
    const dialog = screen.getByRole("dialog", { name: "Sửa cửa hàng" })
    fireEvent.change(within(dialog).getByLabelText("Tên cửa hàng"), { target: { value: "Phú Quý HN" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))
    expect(onUpdateSilverStore).toHaveBeenCalledWith("Phú Quý", { name: "Phú Quý HN", price: "2.000.000" })

    fireEvent.click(screen.getByRole("button", { name: "Xoá Phú Quý" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))
    expect(onRemoveSilverStore).toHaveBeenCalledWith("Phú Quý")
  })

  it("explains why a store that still has silver purchases cannot be deleted", () => {
    render(<SilverTab summary={ZERO_SUMMARY} stores={[PHU_QUY]} silver={[PURCHASE]} {...noopHandlers} />)

    expect(screen.getByRole("button", { name: "Xoá Phú Quý" })).toHaveAttribute(
      "title",
      "Không thể xoá — vẫn còn giao dịch mua bạc gắn với cửa hàng này."
    )
  })

  it("adds a purchase in whole lượng, with no chỉ/phân hint", () => {
    const onAddSilver = vi.fn()
    render(
      <SilverTab summary={ZERO_SUMMARY} stores={[PHU_QUY]} silver={[]} {...noopHandlers} onAddSilver={onAddSilver} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua bạc" }))
    expect(screen.getByText("Lần mua bạc mới")).toBeInTheDocument()
    expect(screen.queryByText("10 phân = 1 chỉ")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Phú Quý" }))
    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "10/08/2026" } })
    fireEvent.change(screen.getByLabelText("Khối lượng (lượng)", { exact: false }), { target: { value: "2" } })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi lượng)", { exact: false }), { target: { value: "1800000" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAddSilver).toHaveBeenCalledWith({ date: "10/08/2026", luong: 2, buy: 1_800_000, store: "Phú Quý" })
  })

  it("refuses a fractional or zero lượng with the whole-lượng error", () => {
    render(<SilverTab summary={ZERO_SUMMARY} stores={[PHU_QUY]} silver={[]} {...noopHandlers} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua bạc" }))
    fireEvent.click(screen.getByRole("button", { name: "Phú Quý" }))
    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), { target: { value: "10/08/2026" } })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi lượng)", { exact: false }), { target: { value: "1800000" } })

    for (const value of ["1,5", "1.5", "0"]) {
      fireEvent.change(screen.getByLabelText("Khối lượng (lượng)", { exact: false }), { target: { value } })
      expect(screen.getByText("Nhập số lượng nguyên lớn hơn 0")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    }
  })

  it("edits a purchase from a prefilled modal and reports it in lượng", () => {
    const onUpdateSilver = vi.fn()
    render(
      <SilverTab
        summary={ZERO_SUMMARY}
        stores={[PHU_QUY]}
        silver={[PURCHASE]}
        {...noopHandlers}
        onUpdateSilver={onUpdateSilver}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Sửa giao dịch bạc 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Sửa lần mua bạc" })
    const quantity = within(dialog).getByLabelText("Khối lượng (lượng)", { exact: false })
    expect(quantity).toHaveValue("2")
    fireEvent.change(quantity, { target: { value: "3" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onUpdateSilver).toHaveBeenCalledWith(1, { date: "10/08/2026", luong: 3, buy: 1_800_000, store: "Phú Quý" })
  })

  it("asks before removing a purchase, naming it as a silver purchase", () => {
    const onRemoveSilver = vi.fn()
    render(
      <SilverTab
        summary={ZERO_SUMMARY}
        stores={[PHU_QUY]}
        silver={[PURCHASE]}
        {...noopHandlers}
        onRemoveSilver={onRemoveSilver}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Xoá giao dịch bạc 10/08/2026" })[0])

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("Xoá giao dịch bạc?")).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Xoá giao dịch mua bạc ngày "10/08/2026" sẽ không thể hoàn tác.')

    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))
    expect(onRemoveSilver).toHaveBeenCalledWith(1)
  })

  it("names same-day purchases by store and weight in lượng so each button stays distinct", () => {
    const silver = [PURCHASE, { ...PURCHASE, id: 2, luong: 5 }]
    render(<SilverTab summary={summaryOf(silver, [PHU_QUY])} stores={[PHU_QUY]} silver={silver} {...noopHandlers} />)

    expect(screen.getAllByRole("button", { name: "Sửa giao dịch bạc 10/08/2026 · Phú Quý · 5 lượng" })).toHaveLength(2)
  })
  it("offers to gift from a silver purchase, in lượng", () => {
    const onAddSilverGift = vi.fn(() => true)
    render(
      <SilverTab
        summary={summaryOf([PURCHASE], [PHU_QUY])}
        stores={[PHU_QUY]}
        silver={[PURCHASE]}
        {...noopHandlers}
        onAddSilverGift={onAddSilverGift}
      />
    )

    fireEvent.click(screen.getAllByRole("button", { name: "Tặng từ lần mua bạc 10/08/2026" })[0])
    const dialog = screen.getByRole("dialog", { name: "Tặng bạc" })
    fireEvent.change(within(dialog).getByLabelText("Số lượng tặng (lượng)", { exact: false }), {
      target: { value: "1" },
    })
    fireEvent.change(within(dialog).getByLabelText("Ngày tặng", { exact: false }), { target: { value: "12/10/2026" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(onAddSilverGift).toHaveBeenCalledWith(1, { date: "12/10/2026", qty: 1 })
  })
})
