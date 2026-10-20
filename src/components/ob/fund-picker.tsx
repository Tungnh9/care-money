"use client"

import { useId } from "react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney, formatMoneyCompact } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SavingsFund } from "@/lib/finance/types"

interface FundPickerProps {
  savings: SavingsFund[]
  selected: string | null
  onSelect: (name: string | null) => void
}

function FundPicker({ savings, selected, onSelect }: FundPickerProps) {
  const { hidden } = useMoneyVisibility()
  const idPrefix = useId()

  if (!savings.length) {
    return (
      <p className="mt-3 text-[12.5px] text-[var(--ob-color-text-subtle)]">
        Chưa có quỹ tiết kiệm nào. Tạo 1 quỹ ở màn Tài chính để gắn vào đây.
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap gap-[6px]">
      {savings.map((fund, index) => {
        const active = fund.name === selected
        // id dựng từ useId + thứ tự, không từ tên quỹ: aria-describedby tách danh sách id theo dấu cách, tên quỹ có dấu cách sẽ vỡ.
        const balanceId = `${idPrefix}-balance-${index}`
        return (
          <button
            key={fund.name}
            type="button"
            aria-describedby={balanceId}
            onClick={() => onSelect(active ? null : fund.name)}
            className={cn(
              "rounded-[var(--ob-radius-pill)] border-[1.5px] px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
              active
                ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                : "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"
            )}
          >
            {fund.name}
            {/* Số rút gọn chỉ để nhìn: aria-hidden để tên truy cập của nút vẫn đúng bằng tên quỹ; số đầy đủ đọc qua mô tả bên dưới. */}
            <span
              aria-hidden="true"
              className={cn(
                "ml-1.5 whitespace-nowrap [font-family:var(--ob-font-num)] tabular-nums",
                !active && "text-[var(--ob-color-text-subtle)]"
              )}
            >
              {formatMoneyCompact(fund.amount, hidden)}
            </span>
            <span id={balanceId} hidden>
              {`Số dư ${formatMoney(fund.amount, hidden)}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export { FundPicker }
