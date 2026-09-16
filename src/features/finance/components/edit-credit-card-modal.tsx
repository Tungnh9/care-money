"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { CreditCard } from "../types"

interface EditCreditCardModalProps {
  card: CreditCard | null
  onOpenChange: (open: boolean) => void
  onSave: (card: CreditCard) => void
}

function EditCreditCardModal({ card, onOpenChange, onSave }: EditCreditCardModalProps) {
  const [name, setName] = useState("")
  const [balance, setBalance] = useState("")
  const [min, setMin] = useState("")
  const [limit, setLimit] = useState("")
  const [due, setDue] = useState("")
  const [color, setColor] = useState("")

  // Modal ở lại mounted với card=null giữa các lần mở — reseed field đúng lúc chuyển sang mở với
  // 1 card (mới hoặc khác card trước), giống pattern EditExpenseModal.
  const [prevCardName, setPrevCardName] = useState<string | null>(null)
  if (card && card.name !== prevCardName) {
    setName(card.name)
    setBalance(String(card.balance))
    setMin(String(card.min))
    setLimit(String(card.limit))
    setDue(card.due)
    setColor(card.color ?? "")
    setPrevCardName(card.name)
  }
  if (!card && prevCardName !== null) setPrevCardName(null)

  if (!card) return null

  const disabled = !name.trim() || !balance.trim() || !limit.trim() || !due.trim()

  function handleSave() {
    onSave({
      name: name.trim(),
      balance: Number(balance) || 0,
      min: Number(min) || 0,
      limit: Number(limit) || 0,
      due: due.trim(),
      color: color || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy="edit-credit-card-title">
      <div id="edit-credit-card-title" className="mb-4 text-[17px] font-bold">
        Sửa thẻ tín dụng
      </div>

      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Tên thẻ"
          placeholder="Nhập tên thẻ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          prefix={
            <input
              type="color"
              aria-label="Chọn màu cho thẻ"
              value={color || "#f26311"}
              onChange={(e) => setColor(e.target.value)}
              className="size-6 cursor-pointer rounded-[var(--ob-radius-sm)] border border-[var(--ob-color-border)] bg-transparent p-0 [&::-webkit-color-swatch]:rounded-[var(--ob-radius-sm)] [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:rounded-[var(--ob-radius-sm)] [&::-webkit-color-swatch-wrapper]:p-0"
            />
          }
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Dư nợ hiện tại"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Số tiền tối thiểu"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={min}
          onChange={(e) => setMin(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Hạn mức"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Ngày đến hạn"
          placeholder="Nhập ngày đến hạn"
          value={due}
          onChange={(e) => setDue(e.target.value)}
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

export { EditCreditCardModal }
