"use client"

import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import {
  normalizePurchaseDate,
  parsePurchaseDate,
  parseWholeQuantity,
  toPurchaseDate,
} from "@/lib/finance/metal-calculations"
import type { MetalGift, MetalGiftInput } from "@/lib/finance/types"
import type { MetalDisplay } from "../metal-config"

interface MetalGiftTarget {
  // Ngày của lần mua bị lấy ra; rỗng khi lần mua không còn (chỉ có từ file sửa tay).
  purchaseDate: string
  store: string
  // Số tối đa tặng được: phần còn lại của lần mua — khi sửa, cộng lại chính số của lần tặng đó.
  available: number
  // null = tặng mới; có giá trị = đang sửa lần tặng này.
  gift: MetalGift | null
}

interface MetalGiftModalProps {
  metal: MetalDisplay
  target: MetalGiftTarget | null
  onOpenChange: (open: boolean) => void
  // Trả true khi đã ghi — chỉ lúc đó mới đóng; ghi lỗi thì hook đã báo toast và modal giữ nguyên chữ đã gõ.
  onSave: (input: MetalGiftInput) => boolean
}

function MetalGiftModal({ metal, target, onOpenChange, onSave }: MetalGiftModalProps) {
  const titleId = useId()
  const [date, setDate] = useState("")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")

  // Điền ô đúng 1 lần mỗi lần mở (đóng → mở). Không so `target` theo object: MetalTab dựng lại object này
  // mỗi lần render, so theo object sẽ xoá sạch chữ đang gõ.
  const [seeded, setSeeded] = useState(false)
  if (target && !seeded) {
    setDate(target.gift?.date ?? toPurchaseDate(new Date()))
    setQuantity(target.gift ? String(target.gift.qty) : "")
    setNote(target.gift?.note ?? "")
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
  const disabled = !normalizedDate || beforePurchase || !quantityValid

  function handleSave() {
    if (!normalizedDate || quantityValue === null) return
    const trimmedNote = note.trim()
    const saved = onSave({ date: normalizedDate, qty: quantityValue, ...(trimmedNote ? { note: trimmedNote } : {}) })
    if (saved) onOpenChange(false)
  }

  const source = target.purchaseDate
    ? `Lần mua ngày ${target.purchaseDate} ở ${target.store}`
    : `Lần mua ở ${target.store}`

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy={titleId}>
      <div id={titleId} className="mb-1 text-[17px] font-bold">
        {target.gift ? `Sửa lần tặng ${metal.noun}` : `Tặng ${metal.noun}`}
      </div>
      <p className="mb-4 text-[13px] text-[var(--ob-color-text-muted)]">
        {`${source} · tặng được tối đa ${metal.formatQuantity(max)}`}
      </p>

      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Ngày tặng"
          placeholder="vd: 10/08/2026"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          invalid={dateInvalid}
          hint={
            dateInvalid
              ? normalizedDate === null
                ? "Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026"
                : `Ngày tặng không được trước ngày mua (${target.purchaseDate})`
              : undefined
          }
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={`Số lượng tặng (${metal.unit})`}
          numeric
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          invalid={quantityInvalid}
          hint={quantityInvalid ? `Nhập số ${metal.unit} nguyên từ 1 đến ${max}` : undefined}
        />
        <Field
          className="min-w-0 flex-[1_1_100%]"
          label="Ghi chú (không bắt buộc)"
          placeholder="vd: tặng mẹ sinh nhật"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

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

export { MetalGiftModal, type MetalGiftTarget }
