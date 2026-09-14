"use client"

import { cn } from "@/lib/utils"
import type { BudgetTag } from "@/lib/settings-storage"

interface TagPickerProps {
  tags: BudgetTag[]
  selectedLabel: string | null
  onSelect: (label: string | null) => void
}

function TagPicker({ tags, selectedLabel, onSelect }: TagPickerProps) {
  const activeTags = tags.filter((t) => t.on)

  return (
    <div className="flex flex-wrap gap-2">
      {activeTags.map((t) => {
        const active = t.label === selectedLabel
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => onSelect(active ? null : t.label)}
            className={cn(
              "inline-flex min-h-[var(--ob-hit-min)] items-center gap-[9px] rounded-[var(--ob-radius-pill)] border-[1.5px] px-[15px] py-[9px] text-[13px] font-semibold",
              active
                ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                : "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"
            )}
          >
            <span className="inline-flex size-[18px] shrink-0 items-center justify-center text-base leading-none">
              {t.emoji}
            </span>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

export { TagPicker }
