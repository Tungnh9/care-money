"use client"

import { cn } from "@/lib/utils"
import type { BudgetTag } from "@/lib/settings/settings-storage"
import type { TagSnapshot } from "@/lib/budget/types"

interface TagPickerProps {
  tags: BudgetTag[]
  selectedLabel: string | null
  onSelect: (label: string | null) => void
  // Nhãn (snapshot lúc ghi) của khoản chi đang sửa mà nay đã tắt/xoá trong Cài đặt — vẫn có 1 chip
  // để thấy nhãn đang gắn và bỏ chọn được. Nhãn còn bật thì đã có chip của chính nó.
  extraTag?: TagSnapshot | null
}

function TagPicker({ tags, selectedLabel, onSelect, extraTag }: TagPickerProps) {
  const activeTags = tags.filter((t) => t.on)
  const activeLabels = activeTags.map((t) => t.label)
  const chips: Pick<TagSnapshot, "label" | "emoji">[] =
    extraTag && !activeLabels.includes(extraTag.label) ? [extraTag, ...activeTags] : activeTags

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((t) => {
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
