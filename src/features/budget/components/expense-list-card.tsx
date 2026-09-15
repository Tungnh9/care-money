"use client"

import { Pencil, Trash2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { formatDayKey } from "@/lib/date"
import { cn } from "@/lib/utils"
import { groupExpensesByDay } from "../budget-calculations"
import type { Expense } from "../types"

const UNTAGGED_LABEL = "Không gắn thẻ"
const UNTAGGED_EMOJI = "🏷️"

// Mỗi ngày là 1 khối liền (không còn xen kẽ theo từng dòng giao dịch) — 2 tông xen kẽ theo NGÀY
// để phân biệt ngày này với ngày kế tiếp; trong 1 ngày, các giao dịch chỉ ngăn nhau bằng 1 gạch
// dưới mờ. Header đậm hơn dòng giao dịch (cùng tông màu, khác độ đậm) để vẫn nhận ra ngay đâu là
// header dù đã gộp chung 1 khối với các dòng bên dưới.
const DAY_TONES = [
  {
    headerBg: "bg-[var(--ob-color-action-soft)]",
    rowBg: "bg-[var(--ob-color-action-soft)]/40",
    accent: "text-[var(--ob-color-action-strong)]",
  },
  {
    headerBg: "bg-[#EAF1FE]",
    rowBg: "bg-[#EAF1FE]/50",
    accent: "text-[var(--ob-color-info)]",
  },
]

interface ExpenseListCardProps {
  expenses: Expense[]
  onRemove: (id: number) => void
  onEdit: (expense: Expense) => void
}

function ExpenseListCard({ expenses, onRemove, onEdit }: ExpenseListCardProps) {
  const { hidden } = useMoneyVisibility()
  const days = groupExpensesByDay(expenses)

  return (
    <Card label="Khoản chi tháng này" className="min-w-0 w-full">
      <div>
        {days.map((day, dayIdx) => {
          const tone = DAY_TONES[dayIdx % DAY_TONES.length]

          return (
            <div key={day.dayKey}>
              <div
                data-testid="expense-day-header"
                className={cn(
                  "mt-3 flex items-baseline justify-between rounded-t-[var(--ob-radius-sm)] px-2 py-[7px] text-[12.5px] font-semibold text-[var(--ob-color-text-subtle)]",
                  tone.headerBg
                )}
              >
                <span>{formatDayKey(day.dayKey)}</span>
                <span className={cn("[font-family:var(--ob-font-num)] text-sm font-bold", tone.accent)}>
                  {formatMoney(day.total, hidden)}
                </span>
              </div>
              {day.expenses.map((e, i) => {
                const isLast = i === day.expenses.length - 1
                return (
                  <div
                    key={e.id}
                    data-testid="expense-row"
                    className={cn(
                      "flex items-center gap-[14px] px-2 py-[10px]",
                      tone.rowBg,
                      isLast ? "rounded-b-[var(--ob-radius-sm)]" : "border-b border-[var(--ob-color-border)]"
                    )}
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
                    <div className="[font-family:var(--ob-font-num)] text-sm text-[var(--ob-color-text-muted)]">
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
                )
              })}
            </div>
          )
        })}
        {!expenses.length ? (
          <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có khoản chi nào trong tháng này.</p>
        ) : null}
      </div>
    </Card>
  )
}

export { ExpenseListCard }
