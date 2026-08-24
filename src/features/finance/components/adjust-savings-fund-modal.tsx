"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowDown, ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"
import type { SavingsFund } from "../types"

type AdjustDirection = "add" | "subtract"

interface AdjustSavingsFundModalProps {
  open: boolean
  fund: SavingsFund | null
  onOpenChange: (open: boolean) => void
  onConfirm: (updatedFund: SavingsFund) => void
}

function AdjustSavingsFundModal({ open, fund, onOpenChange, onConfirm }: AdjustSavingsFundModalProps) {
  const { hidden } = useMoneyVisibility()
  const [direction, setDirection] = useState<AdjustDirection>("add")
  const [amount, setAmount] = useState("")

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open || !fund) return null

  const delta = Number(amount) || 0
  const previewAmount = direction === "add" ? fund.amount + delta : Math.max(fund.amount - delta, 0)

  function handleConfirm() {
    if (!fund) return
    onConfirm({ ...fund, amount: previewAmount })
    onOpenChange(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        data-testid="adjust-savings-fund-backdrop"
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--ob-vo-900)]/40"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-savings-fund-title"
        className="relative w-full max-w-[400px] rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-6 shadow-[var(--ob-shadow-md)]"
      >
        <div id="adjust-savings-fund-title" className="mb-1 text-[17px] font-bold">
          Điều chỉnh số tiền quỹ &quot;{fund.name}&quot;
        </div>
        <p className="mb-4 text-sm text-[var(--ob-color-text-muted)]">
          Hiện có: {formatMoney(fund.amount, hidden)}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-[10px]">
          <button
            type="button"
            aria-pressed={direction === "add"}
            onClick={() => setDirection("add")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--ob-radius-md)] border-[1.5px] py-[10px] text-[13.5px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
              direction === "add"
                ? "border-[var(--ob-color-income)] bg-[var(--ob-color-income)]/10 text-[var(--ob-color-income)]"
                : "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"
            )}
          >
            <ArrowUp size={16} />
            Cộng tiền
          </button>
          <button
            type="button"
            aria-pressed={direction === "subtract"}
            onClick={() => setDirection("subtract")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-[var(--ob-radius-md)] border-[1.5px] py-[10px] text-[13.5px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
              direction === "subtract"
                ? "border-[var(--ob-color-expense)] bg-[var(--ob-color-expense)]/10 text-[var(--ob-color-expense)]"
                : "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"
            )}
          >
            <ArrowDown size={16} />
            Trừ tiền
          </button>
        </div>

        <Field
          label="Số tiền"
          numeric
          group
          suffix="đ"
          placeholder="0"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <p className="mt-3 text-sm text-[var(--ob-color-text-muted)]">
          Số dư mới: <span className="font-semibold text-[var(--ob-color-text)]">{formatMoney(previewAmount, hidden)}</span>
        </p>

        <div className="mt-5 flex justify-end gap-[10px]">
          <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={!delta}
            onClick={handleConfirm}
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export { AdjustSavingsFundModal }
export type { AdjustSavingsFundModalProps }
