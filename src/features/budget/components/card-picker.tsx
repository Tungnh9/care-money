"use client"

import { useId } from "react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney, formatMoneyCompact } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CreditCard } from "@/lib/finance/types"

interface CardPickerProps {
  cards: CreditCard[]
  selected: string | null
  onSelect: (name: string | null) => void
}

function CardPicker({ cards, selected, onSelect }: CardPickerProps) {
  const { hidden } = useMoneyVisibility()
  const idPrefix = useId()

  if (!cards.length) return null

  return (
    <div className="mt-3 flex min-w-0 flex-wrap gap-[6px]">
      {cards.map((card, index) => {
        const active = card.name === selected
        // id dựng từ useId + thứ tự, không từ tên thẻ: aria-describedby tách danh sách id theo dấu cách, tên thẻ có dấu cách sẽ vỡ.
        const balanceId = `${idPrefix}-balance-${index}`
        return (
          <button
            key={card.name}
            type="button"
            aria-describedby={balanceId}
            onClick={() => onSelect(active ? null : card.name)}
            className={cn(
              "rounded-[var(--ob-radius-pill)] border-[1.5px] px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
              active
                ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                : "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"
            )}
          >
            {card.name}
            {/* Số rút gọn chỉ để nhìn: aria-hidden để tên truy cập của nút vẫn đúng bằng tên thẻ; số đầy đủ đọc qua mô tả bên dưới. */}
            <span
              aria-hidden="true"
              className={cn(
                "ml-1.5 whitespace-nowrap [font-family:var(--ob-font-num)] tabular-nums",
                !active && "text-[var(--ob-color-text-subtle)]"
              )}
            >
              {formatMoneyCompact(card.balance, hidden)}
            </span>
            <span id={balanceId} hidden>
              {`Dư nợ ${formatMoney(card.balance, hidden)}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export { CardPicker }
