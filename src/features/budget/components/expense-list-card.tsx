"use client"

import { Pencil, Trash2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { Expense } from "../types"

const UNTAGGED_LABEL = "Không gắn thẻ"
const UNTAGGED_EMOJI = "🏷️"

interface ExpenseListCardProps {
  expenses: Expense[]
  onRemove: (id: number) => void
  onEdit: (expense: Expense) => void
}

function ExpenseListCard({ expenses, onRemove, onEdit }: ExpenseListCardProps) {
  const { hidden } = useMoneyVisibility()

  return (
    <Card label="Khoản chi tháng này" className="min-w-0 w-full">
      <div>
        {expenses.map((e, i) => (
          <div
            key={e.id}
            className={
              "flex items-center gap-[14px] py-[10px] " +
              (i < expenses.length - 1 ? "border-b border-[var(--ob-color-border)]" : "")
            }
          >
            <span
              className="flex size-10 flex-none items-center justify-center rounded-full text-[21px] leading-none"
              style={{ background: e.tag?.tint ?? "var(--ob-color-surface-sunken)" }}
            >
              {e.tag?.emoji ?? UNTAGGED_EMOJI}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{e.tag?.label ?? UNTAGGED_LABEL}</div>
              {e.note ? (
                <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">{e.note}</div>
              ) : null}
            </div>
            <div className="[font-family:var(--ob-font-num)] text-sm font-bold">
              {formatMoney(e.amount, hidden)}
            </div>
            <div className="flex flex-none items-center">
              <button
                type="button"
                aria-label={`Sửa khoản chi ${e.tag?.label ?? UNTAGGED_LABEL}`}
                onClick={() => onEdit(e)}
                className="flex size-9 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-action)]"
              >
                <Pencil size={17} />
              </button>
              <button
                type="button"
                aria-label={`Xoá khoản chi ${e.tag?.label ?? UNTAGGED_LABEL}`}
                onClick={() => onRemove(e.id)}
                className="flex size-9 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
        {!expenses.length ? (
          <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có khoản chi nào trong tháng này.</p>
        ) : null}
      </div>
    </Card>
  )
}

export { ExpenseListCard }
