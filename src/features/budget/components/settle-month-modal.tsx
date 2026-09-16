"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import { FundPicker } from "@/components/ob/fund-picker"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { formatMonthKey } from "@/lib/date"
import type { SavingsFund } from "@/features/finance/types"
import type { SettlementDirection } from "../types"

interface SettleMonthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  remaining: number
  savings: SavingsFund[]
  onConfirm: (fundName: string, direction: SettlementDirection, amount: number) => void
}

function SettleMonthModal({ open, onOpenChange, month, remaining, savings, onConfirm }: SettleMonthModalProps) {
  const { hidden } = useMoneyVisibility()
  const direction: SettlementDirection = remaining >= 0 ? "deposit" : "withdraw"
  const cap = Math.abs(remaining)
  const [selectedFund, setSelectedFund] = useState<string | null>(null)
  const [amount, setAmount] = useState(String(cap))

  // Component ở lại mounted với open=false trong lúc useBudget()/useFinance() còn hydrate —
  // seed lại amount/selectedFund đúng lúc chuyển sang open=true, không tin vào giá trị
  // useState ban đầu (có thể tính từ lúc dữ liệu thật chưa kịp tải xong).
  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setAmount(String(cap))
    setSelectedFund(null)
  }
  if (open !== wasOpen) setWasOpen(open)

  if (!open) return null

  const delta = Number(amount) || 0
  const fund = savings.find((f) => f.name === selectedFund)
  const exceedsCap = delta <= 0 || delta > cap
  const exceedsFundBalance = direction === "withdraw" && !!fund && delta > fund.amount
  const disabled = !fund || exceedsCap || exceedsFundBalance
  const previewAmount = fund ? (direction === "deposit" ? fund.amount + delta : fund.amount - delta) : null

  function handleConfirm() {
    if (!fund || disabled) return
    onConfirm(fund.name, direction, delta)
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      ariaLabelledBy="settle-month-title"
      backdropTestId="settle-month-backdrop"
    >
      <div id="settle-month-title" className="mb-1 text-[17px] font-bold">
        Tất toán {formatMonthKey(month)}
      </div>
      <p className="mb-4 text-sm text-[var(--ob-color-text-muted)]">
        {direction === "deposit" ? "Bạn dư" : "Bạn đang thiếu"} {formatMoney(cap, hidden)} trong {formatMonthKey(month)}.
      </p>

      <FundPicker savings={savings} selected={selectedFund} onSelect={setSelectedFund} />

      {savings.length ? (
        <>
          <Field
            className="mt-4"
            label="Số tiền"
            numeric
            group
            suffix="đ"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {exceedsFundBalance && fund ? (
            <p className="mt-2 text-sm text-[var(--ob-color-expense)]">
              Quỹ &quot;{fund.name}&quot; chỉ còn {formatMoney(fund.amount, hidden)}, không đủ để tất toán{" "}
              {formatMoney(delta, hidden)}.
            </p>
          ) : null}

          {fund && previewAmount !== null ? (
            <p className="mt-3 text-sm text-[var(--ob-color-text-muted)]">
              Số dư mới của &quot;{fund.name}&quot;:{" "}
              <span className="font-semibold text-[var(--ob-color-text)]">
                {formatMoney(previewAmount, hidden)}
              </span>
            </p>
          ) : null}

          <div className="mt-5 flex justify-end gap-[10px]">
            <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button variant="primary" size="sm" type="button" disabled={disabled} onClick={handleConfirm}>
              Xác nhận
            </Button>
          </div>
        </>
      ) : null}
    </Modal>
  )
}

export { SettleMonthModal }
