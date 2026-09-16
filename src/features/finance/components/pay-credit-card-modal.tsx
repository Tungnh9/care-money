"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { CreditCard } from "../types"

interface PayCreditCardModalProps {
  card: CreditCard | null
  onOpenChange: (open: boolean) => void
  onPay: (name: string, amount: number) => void
}

function todayLabel() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${now.getFullYear()}`
}

function PayCreditCardModal({ card, onOpenChange, onPay }: PayCreditCardModalProps) {
  const { hidden } = useMoneyVisibility()
  const [amount, setAmount] = useState("")

  // Modal ở lại mounted với card=null giữa các lần mở — reset số tiền đúng lúc chuyển sang mở với
  // 1 thẻ (mới hoặc khác thẻ trước), giống pattern EditExpenseModal.
  const [prevCardName, setPrevCardName] = useState<string | null>(null)
  if (card && card.name !== prevCardName) {
    setAmount("")
    setPrevCardName(card.name)
  }
  if (!card && prevCardName !== null) setPrevCardName(null)

  if (!card) return null

  const currentName = card.name

  function handlePay() {
    onPay(currentName, Number(amount) || 0)
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy="pay-credit-card-title">
      <div id="pay-credit-card-title" className="mb-4 text-[17px] font-bold">
        Ghi một lần trả · {card.name}
      </div>

      <Field
        label="Số tiền trả"
        numeric
        group
        suffix="đ"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        hint={`Dư nợ hiện tại ${formatMoney(card.balance, hidden)}`}
      />
      <div className="h-[14px]" />
      <Field label="Ngày trả" placeholder={todayLabel()} />

      <div className="mt-5 flex justify-end gap-[10px]">
        <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" type="button" disabled={!Number(amount)} onClick={handlePay}>
          Lưu
        </Button>
      </div>
    </Modal>
  )
}

export { PayCreditCardModal }
