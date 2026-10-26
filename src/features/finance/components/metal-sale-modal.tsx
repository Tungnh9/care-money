"use client"

import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import { FundPicker } from "@/components/ob/fund-picker"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { BUDGET_AMOUNT_LIMIT_HINT, exceedsBudgetAmountLimit } from "@/lib/budget/budget-calculations"
import {
  metalSalePL,
  normalizePurchaseDate,
  parsePurchaseDate,
  parseWholeQuantity,
  toPurchaseDate,
} from "@/lib/finance/metal-calculations"
import type { MetalSaleInput, SavingsFund } from "@/lib/finance/types"
import type { MetalDisplay } from "../metal-config"
import { MetalPLLine } from "./metal-pl-indicator"

interface MetalSaleTarget {
  purchaseDate: string
  store: string
  // Giá mua mỗi đơn vị của lần mua — để xem trước lãi/lỗ sẽ chốt.
  buy: number
  // Số tối đa bán được: phần còn lại của lần mua (sau mọi lần tặng và bán).
  available: number
}

interface MetalSaleModalProps {
  metal: MetalDisplay
  target: MetalSaleTarget | null
  savings: SavingsFund[]
  onOpenChange: (open: boolean) => void
  // Trả true khi đã ghi — chỉ lúc đó mới đóng; ghi lỗi thì hook đã báo toast và modal giữ nguyên chữ đã gõ.
  onSave: (input: MetalSaleInput) => boolean
}

function MetalSaleModal({ metal, target, savings, onOpenChange, onSave }: MetalSaleModalProps) {
  const titleId = useId()
  const fundLabelId = useId()
  const { hidden } = useMoneyVisibility()
  const [date, setDate] = useState("")
  const [quantity, setQuantity] = useState("")
  const [received, setReceived] = useState("")
  const [fundName, setFundName] = useState<string | null>(null)
  const [note, setNote] = useState("")

  // Điền ô đúng 1 lần mỗi lần mở (đóng → mở), như MetalGiftModal: MetalTab dựng lại `target` mỗi lần render.
  const [seeded, setSeeded] = useState(false)
  if (target && !seeded) {
    setDate(toPurchaseDate(new Date()))
    setQuantity("")
    setReceived("")
    setFundName(null)
    setNote("")
    setSeeded(true)
  }
  if (!target && seeded) setSeeded(false)

  if (!target) return null

  const max = Math.floor(target.available)
  const normalizedDate = normalizePurchaseDate(date)
  // Ngày mua không đọc được (parsePurchaseDate = 0) thì không chặn — không biết mốc để so.
  const beforePurchase =
    normalizedDate !== null && parsePurchaseDate(normalizedDate) < parsePurchaseDate(target.purchaseDate)
  const dateInvalid = date.trim() !== "" && (normalizedDate === null || beforePurchase)
  const quantityValue = parseWholeQuantity(quantity)
  const quantityValid = quantityValue !== null && quantityValue <= max
  const quantityInvalid = quantity.trim() !== "" && !quantityValid
  // Ô tiền (group) chỉ giữ chữ số — rỗng là chưa nhập.
  const receivedValue = Number(received)
  const receivedTooLarge = exceedsBudgetAmountLimit(received)
  const receivedValid = received !== "" && receivedValue >= 1 && !receivedTooLarge
  const receivedInvalid = received !== "" && !receivedValid
  // Sổ đang chọn có thể vừa bị đổi tên/xoá ở nơi khác trong lúc modal còn mở — chỉ coi là đã chọn khi tên đó
  // vẫn còn, như cửa hàng ở EditMetalPurchaseModal; nếu không hook sẽ từ chối vì không tìm thấy sổ.
  const selectedFund = fundName !== null && savings.some((fund) => fund.name === fundName) ? fundName : null
  const disabled = !normalizedDate || beforePurchase || !quantityValid || !receivedValid || !selectedFund
  const pl =
    quantityValid && receivedValid
      ? metalSalePL({ qty: quantityValue, buy: target.buy, received: receivedValue })
      : null

  function handleSave() {
    if (!normalizedDate || quantityValue === null || !selectedFund) return
    const trimmedNote = note.trim()
    const saved = onSave({
      date: normalizedDate,
      qty: quantityValue,
      received: receivedValue,
      fundName: selectedFund,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    })
    if (saved) onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy={titleId}>
      <div id={titleId} className="mb-1 text-[17px] font-bold">
        {`Bán ${metal.noun}`}
      </div>
      <p className="mb-4 text-[13px] text-[var(--ob-color-text-muted)]">
        {`Lần mua ngày ${target.purchaseDate} ở ${target.store} · bán được tối đa ${metal.formatQuantity(max)}`}
      </p>

      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Ngày bán"
          placeholder="vd: 10/08/2026"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          invalid={dateInvalid}
          hint={
            dateInvalid
              ? normalizedDate === null
                ? "Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026"
                : `Ngày bán không được trước ngày mua (${target.purchaseDate})`
              : undefined
          }
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={`Số lượng bán (${metal.unit})`}
          numeric
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          invalid={quantityInvalid}
          hint={quantityInvalid ? `Nhập số ${metal.unit} nguyên từ 1 đến ${max}` : undefined}
        />
        <Field
          className="min-w-0 flex-[1_1_100%]"
          label="Tiền thực nhận"
          numeric
          group
          suffix="đ"
          placeholder="0"
          masked={hidden}
          value={received}
          onChange={(e) => setReceived(e.target.value)}
          invalid={receivedInvalid}
          hint={receivedInvalid ? (receivedTooLarge ? BUDGET_AMOUNT_LIMIT_HINT : "Nhập số tiền lớn hơn 0") : undefined}
        />
      </div>

      {pl !== null ? <MetalPLLine className="mt-2 text-[13px]" label="Lãi/lỗ sẽ chốt" pl={pl} hidden={hidden} /> : null}

      <div role="group" aria-labelledby={fundLabelId} className="mt-4">
        <span
          id={fundLabelId}
          className="block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]"
        >
          Sổ nhận tiền
        </span>
        <FundPicker savings={savings} selected={selectedFund} onSelect={setFundName} />
      </div>

      <Field
        className="mt-4"
        label="Ghi chú (không bắt buộc)"
        placeholder="vd: bán bớt lấy tiền sửa nhà"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="mt-5 flex justify-end gap-[10px]">
        <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" type="button" disabled={disabled} onClick={handleSave}>
          Lưu
        </Button>
      </div>
    </Modal>
  )
}

export { MetalSaleModal, type MetalSaleTarget }
