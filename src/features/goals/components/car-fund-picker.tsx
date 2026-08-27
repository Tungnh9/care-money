"use client"

import { useT } from "@/components/locale-provider"
import { cn } from "@/lib/utils"
import type { SavingsFund } from "@/features/finance/types"

interface CarFundPickerProps {
  savings: SavingsFund[]
  selected: string | null
  onSelect: (name: string | null) => void
}

function CarFundPicker({ savings, selected, onSelect }: CarFundPickerProps) {
  const t = useT()

  if (!savings.length) {
    return (
      <p className="mt-3 text-[12.5px] text-[var(--ob-color-text-subtle)]">
        {t("goals.noFundsYet")}
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap gap-[6px]">
      {savings.map((fund) => {
        const active = fund.name === selected
        return (
          <button
            key={fund.name}
            type="button"
            onClick={() => onSelect(active ? null : fund.name)}
            className={cn(
              "rounded-[var(--ob-radius-pill)] border-[1.5px] px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
              active
                ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                : "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"
            )}
          >
            {fund.name}
          </button>
        )
      })}
    </div>
  )
}

export { CarFundPicker }
