import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

import type { MetalGift, MetalGiftInput } from "@/lib/finance/types"
import { MetalGiftModal } from "../../components/metal-gift-modal"
import { GOLD_METAL, SILVER_METAL } from "../../metal-config"

const TARGET = { purchaseDate: "10/08/2026", store: "SJC", available: 9, gift: null }
const GIFT: MetalGift = {
  id: 1,
  purchaseId: 1,
  date: "11/10/2026",
  qty: 1,
  store: "SJC",
  buy: 900_000,
  note: "tặng mẹ",
}

function quantityBox() {
  return screen.getByLabelText("Số lượng tặng (phân)", { exact: false })
}

describe("MetalGiftModal", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 12, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders nothing while closed", () => {
    render(<MetalGiftModal metal={GOLD_METAL} target={null} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("names the purchase and how much can still be given, and fills in today's date", () => {
    render(<MetalGiftModal metal={GOLD_METAL} target={TARGET} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    const dialog = screen.getByRole("dialog", { name: "Tặng vàng" })
    expect(within(dialog).getByText("Lần mua ngày 10/08/2026 ở SJC · tặng được tối đa 9 phân")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Ngày tặng", { exact: false })).toHaveValue("12/10/2026")
    expect(quantityBox()).toHaveValue("")
  })

  it("saves the typed gift with a trimmed note, then closes", () => {
    const onSave = vi.fn(() => true)
    const onOpenChange = vi.fn()
    render(<MetalGiftModal metal={GOLD_METAL} target={TARGET} onOpenChange={onOpenChange} onSave={onSave} />)

    fireEvent.change(quantityBox(), { target: { value: "2" } })
    fireEvent.change(screen.getByLabelText("Ghi chú", { exact: false }), { target: { value: " tặng mẹ " } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith({ date: "12/10/2026", qty: 2, note: "tặng mẹ" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("leaves the note out when the note box is empty", () => {
    const onSave = vi.fn<(input: MetalGiftInput) => boolean>(() => true)
    render(<MetalGiftModal metal={GOLD_METAL} target={TARGET} onOpenChange={vi.fn()} onSave={onSave} />)

    fireEvent.change(quantityBox(), { target: { value: "1" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith({ date: "12/10/2026", qty: 1 })
    expect(onSave.mock.calls[0][0]).not.toHaveProperty("note")
  })

  it("stays open when the gift could not be recorded", () => {
    const onOpenChange = vi.fn()
    render(<MetalGiftModal metal={GOLD_METAL} target={TARGET} onOpenChange={onOpenChange} onSave={() => false} />)

    fireEvent.change(quantityBox(), { target: { value: "1" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(screen.getByRole("dialog", { name: "Tặng vàng" })).toBeInTheDocument()
  })

  it("refuses a fractional, zero or too large quantity", () => {
    render(<MetalGiftModal metal={GOLD_METAL} target={TARGET} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    for (const value of ["1,5", "0", "10"]) {
      fireEvent.change(quantityBox(), { target: { value } })
      expect(screen.getByText("Nhập số phân nguyên từ 1 đến 9")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
    }

    fireEvent.change(quantityBox(), { target: { value: "9" } })
    expect(screen.getByRole("button", { name: "Lưu" })).not.toBeDisabled()
  })

  it("refuses a date it cannot read, and a date before the purchase", () => {
    render(<MetalGiftModal metal={GOLD_METAL} target={TARGET} onOpenChange={vi.fn()} onSave={vi.fn()} />)
    fireEvent.change(quantityBox(), { target: { value: "1" } })
    const dateBox = screen.getByLabelText("Ngày tặng", { exact: false })

    fireEvent.change(dateBox, { target: { value: "hôm qua" } })
    expect(screen.getByText("Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()

    fireEvent.change(dateBox, { target: { value: "09/08/2026" } })
    expect(screen.getByText("Ngày tặng không được trước ngày mua (10/08/2026)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()

    fireEvent.change(dateBox, { target: { value: "10/08/2026" } })
    expect(screen.getByRole("button", { name: "Lưu" })).not.toBeDisabled()
  })

  it("opens prefilled to edit a gift", () => {
    const onSave = vi.fn(() => true)
    render(
      <MetalGiftModal
        metal={GOLD_METAL}
        target={{ ...TARGET, available: 10, gift: GIFT }}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />
    )

    const dialog = screen.getByRole("dialog", { name: "Sửa lần tặng vàng" })
    expect(within(dialog).getByLabelText("Ngày tặng", { exact: false })).toHaveValue("11/10/2026")
    expect(quantityBox()).toHaveValue("1")
    expect(within(dialog).getByLabelText("Ghi chú", { exact: false })).toHaveValue("tặng mẹ")

    fireEvent.change(quantityBox(), { target: { value: "10" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith({ date: "11/10/2026", qty: 10, note: "tặng mẹ" })
  })

  it("does not wipe what was typed when the parent re-renders with an equal target", () => {
    const { rerender } = render(
      <MetalGiftModal metal={GOLD_METAL} target={TARGET} onOpenChange={vi.fn()} onSave={vi.fn()} />
    )
    fireEvent.change(quantityBox(), { target: { value: "3" } })

    rerender(<MetalGiftModal metal={GOLD_METAL} target={{ ...TARGET }} onOpenChange={vi.fn()} onSave={vi.fn()} />)

    expect(quantityBox()).toHaveValue("3")
  })

  it("asks for silver in lượng", () => {
    render(
      <MetalGiftModal
        metal={SILVER_METAL}
        target={{ ...TARGET, store: "Phú Quý", available: 3 }}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByRole("dialog", { name: "Tặng bạc" })).toBeInTheDocument()
    expect(screen.getByText("Lần mua ngày 10/08/2026 ở Phú Quý · tặng được tối đa 3 lượng")).toBeInTheDocument()
    expect(screen.getByLabelText("Số lượng tặng (lượng)", { exact: false })).toBeInTheDocument()
  })
})
