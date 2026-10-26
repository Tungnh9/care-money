import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { MetalSaleInput, SavingsFund } from "@/lib/finance/types"
import { MetalSaleModal } from "../../components/metal-sale-modal"
import { GOLD_METAL, SILVER_METAL } from "../../metal-config"

const TARGET = { purchaseDate: "10/08/2026", store: "SJC", buy: 900_000, available: 7 }
const SAVINGS: SavingsFund[] = [
  { name: "Quỹ A", amount: 1_000_000, target: 0 },
  { name: "Quỹ B", amount: 0, target: 0 },
]

function quantityBox() {
  return screen.getByLabelText("Số lượng bán (phân)", { exact: false })
}

function receivedBox() {
  return screen.getByLabelText("Tiền thực nhận", { exact: false })
}

function saveButton() {
  return screen.getByRole("button", { name: "Lưu" })
}

function fillSale(qty: string, received: string) {
  fireEvent.change(quantityBox(), { target: { value: qty } })
  fireEvent.change(receivedBox(), { target: { value: received } })
}

describe("MetalSaleModal", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 12, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function renderModal(overrides: Partial<React.ComponentProps<typeof MetalSaleModal>> = {}) {
    const props = {
      metal: GOLD_METAL,
      target: TARGET,
      savings: SAVINGS,
      onOpenChange: vi.fn(),
      onSave: vi.fn<(input: MetalSaleInput) => boolean>(() => true),
      ...overrides,
    }
    return { ...render(<MetalSaleModal {...props} />), props }
  }

  it("renders nothing while closed", () => {
    renderModal({ target: null })

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("names the purchase and how much can be sold, and fills in today's date", () => {
    renderModal()

    const dialog = screen.getByRole("dialog", { name: "Bán vàng" })
    expect(within(dialog).getByText("Lần mua ngày 10/08/2026 ở SJC · bán được tối đa 7 phân")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Ngày bán", { exact: false })).toHaveValue("12/10/2026")
    expect(quantityBox()).toHaveValue("")
    expect(receivedBox()).toHaveValue("")
    expect(within(dialog).getByRole("group", { name: "Sổ nhận tiền" })).toBeInTheDocument()
  })

  it("keeps Lưu locked until a fund is picked, then saves the sale and closes", () => {
    const { props } = renderModal()

    fillSale("2", "1900000")
    expect(saveButton()).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))
    expect(saveButton()).not.toBeDisabled()
    fireEvent.click(saveButton())

    expect(props.onSave).toHaveBeenCalledWith({ date: "12/10/2026", qty: 2, received: 1_900_000, fundName: "Quỹ A" })
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("saves a trimmed note", () => {
    const { props } = renderModal()

    fillSale("1", "950000")
    fireEvent.click(screen.getByRole("button", { name: "Quỹ B" }))
    fireEvent.change(screen.getByLabelText("Ghi chú", { exact: false }), { target: { value: " bán bớt " } })
    fireEvent.click(saveButton())

    expect(props.onSave).toHaveBeenCalledWith({
      date: "12/10/2026",
      qty: 1,
      received: 950_000,
      fundName: "Quỹ B",
      note: "bán bớt",
    })
  })

  it("stays open when the sale could not be recorded", () => {
    const { props } = renderModal({ onSave: vi.fn(() => false) })

    fillSale("2", "1900000")
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))
    fireEvent.click(saveButton())

    expect(props.onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByRole("dialog", { name: "Bán vàng" })).toBeInTheDocument()
  })

  it("previews the profit or loss the sale will lock in, plain at break-even", () => {
    renderModal()

    expect(screen.queryByText(/Lãi\/lỗ sẽ chốt/)).not.toBeInTheDocument()

    fillSale("2", "1900000")
    const preview = screen.getByText(/Lãi\/lỗ sẽ chốt/)
    expect(preview).toHaveTextContent(`Lãi/lỗ sẽ chốt: + ${formatMoney(100_000)}`)
    expect(preview).toHaveAttribute("data-tone", "gain")

    fireEvent.change(receivedBox(), { target: { value: "1700000" } })
    expect(screen.getByText(/Lãi\/lỗ sẽ chốt/)).toHaveTextContent(`Lãi/lỗ sẽ chốt: − ${formatMoney(100_000)}`)
    expect(screen.getByText(/Lãi\/lỗ sẽ chốt/)).toHaveAttribute("data-tone", "loss")

    fireEvent.change(receivedBox(), { target: { value: "1800000" } })
    expect(screen.getByText(/Lãi\/lỗ sẽ chốt/)).toHaveTextContent(`Lãi/lỗ sẽ chốt: ${formatMoney(0)}`)
    expect(screen.getByText(/Lãi\/lỗ sẽ chốt/)).toHaveAttribute("data-tone", "even")
  })

  it("refuses a fractional, zero or too large quantity", () => {
    renderModal()
    fireEvent.change(receivedBox(), { target: { value: "1000000" } })
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))

    for (const value of ["1,5", "0", "8"]) {
      fireEvent.change(quantityBox(), { target: { value } })
      expect(screen.getByText("Nhập số phân nguyên từ 1 đến 7")).toBeInTheDocument()
      expect(saveButton()).toBeDisabled()
    }
    fireEvent.change(quantityBox(), { target: { value: "7" } })
    expect(saveButton()).not.toBeDisabled()
  })

  it("refuses an amount of 0 đ or above 999.999.999.999 đ", () => {
    renderModal()
    fireEvent.change(quantityBox(), { target: { value: "1" } })
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))

    fireEvent.change(receivedBox(), { target: { value: "0" } })
    expect(screen.getByText("Nhập số tiền lớn hơn 0")).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()

    fireEvent.change(receivedBox(), { target: { value: "1000000000000" } })
    expect(screen.getByText("Tối đa 999.999.999.999 đ")).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()

    fireEvent.change(receivedBox(), { target: { value: "999999999999" } })
    expect(saveButton()).not.toBeDisabled()
  })

  it("refuses a date it cannot read, and a date before the purchase", () => {
    renderModal()
    fillSale("1", "1000000")
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))
    const dateBox = screen.getByLabelText("Ngày bán", { exact: false })

    fireEvent.change(dateBox, { target: { value: "32/13/2026" } })
    expect(screen.getByText("Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026")).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()

    fireEvent.change(dateBox, { target: { value: "09/08/2026" } })
    expect(screen.getByText("Ngày bán không được trước ngày mua (10/08/2026)")).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()

    fireEvent.change(dateBox, { target: { value: "10/08/2026" } })
    expect(saveButton()).not.toBeDisabled()
  })

  it("forgets a picked fund that was deleted or renamed while the form is open", () => {
    const { rerender, props } = renderModal()
    fillSale("1", "1000000")
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))
    expect(saveButton()).not.toBeDisabled()

    rerender(<MetalSaleModal {...props} savings={[{ ...SAVINGS[0], name: "Quỹ A mới" }, SAVINGS[1]]} />)

    expect(saveButton()).toBeDisabled()
  })

  it("does not wipe what was typed when the parent re-renders with an equal target", () => {
    const { rerender, props } = renderModal()
    fillSale("2", "1900000")

    rerender(<MetalSaleModal {...props} target={{ ...TARGET }} />)

    expect(quantityBox()).toHaveValue("2")
    expect(receivedBox()).toHaveValue("1.900.000")
  })

  it("starts empty again each time it is reopened", () => {
    const { rerender, props } = renderModal()
    fillSale("2", "1900000")
    fireEvent.click(screen.getByRole("button", { name: "Quỹ A" }))

    rerender(<MetalSaleModal {...props} target={null} />)
    rerender(<MetalSaleModal {...props} target={TARGET} />)

    expect(quantityBox()).toHaveValue("")
    expect(receivedBox()).toHaveValue("")
    fillSale("2", "1900000")
    expect(saveButton()).toBeDisabled()
  })

  it("hides the money in the preview while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    render(
      <MoneyVisibilityProvider>
        <MetalSaleModal metal={GOLD_METAL} target={TARGET} savings={SAVINGS} onOpenChange={vi.fn()} onSave={vi.fn()} />
      </MoneyVisibilityProvider>
    )

    fillSale("2", "1900000")

    await waitFor(() => expect(screen.getByText(/Lãi\/lỗ sẽ chốt/)).toHaveTextContent("•••••••• ₫"))
    expect(screen.getByText(/Lãi\/lỗ sẽ chốt/).textContent).not.toMatch(/\d/)
  })

  it("asks for silver in lượng", () => {
    renderModal({ metal: SILVER_METAL, target: { ...TARGET, store: "Phú Quý", available: 3 } })

    const dialog = screen.getByRole("dialog", { name: "Bán bạc" })
    expect(within(dialog).getByText("Lần mua ngày 10/08/2026 ở Phú Quý · bán được tối đa 3 lượng")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Số lượng bán (lượng)", { exact: false })).toBeInTheDocument()
  })
})
