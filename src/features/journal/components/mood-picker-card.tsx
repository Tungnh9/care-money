"use client"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Mood } from "@/lib/settings/settings-storage"
import type { MoodSnapshot } from "@/lib/journal/types"

interface MoodPickerCardProps {
  moods: Mood[]
  selected: string
  onSelect: (label: string) => void
  // Mood đã lưu của bài đang sửa: vẫn hiện thành 1 chip (để thấy nó đang được chọn và bỏ chọn được) kể cả
  // khi mood đó đã bị tắt hay đã bị xoá khỏi Cài đặt.
  entryMood?: MoodSnapshot | null
}

function MoodPickerCard({ moods, selected, onSelect, entryMood = null }: MoodPickerCardProps) {
  const activeMoods = moods.filter((m) => m.on)
  const chips: Pick<MoodSnapshot, "label" | "emoji">[] =
    entryMood && !activeMoods.some((m) => m.label === entryMood.label) ? [...activeMoods, entryMood] : activeMoods

  return (
    <Card label="Tâm trạng hôm nay">
      <div className="flex flex-wrap gap-2">
        {chips.map((m) => {
          const active = m.label === selected
          return (
            <button
              key={m.label}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(active ? "" : m.label)}
              className={cn(
                "inline-flex min-h-[var(--ob-hit-min)] items-center gap-[9px] rounded-[var(--ob-radius-pill)] border-[1.5px] px-[15px] py-[9px] text-[13px] font-semibold",
                active
                  ? "border-transparent bg-[#FDEBF2] text-[#B92E63]"
                  : "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"
              )}
            >
              <span className="text-base leading-none">{m.emoji}</span>
              {m.label}
            </button>
          )
        })}
        {!activeMoods.length ? (
          <span className="text-[13.5px] text-[var(--ob-color-text-subtle)]">
            Chưa bật tâm trạng nào — mở Cài đặt để chọn.
          </span>
        ) : null}
      </div>
    </Card>
  )
}

export { MoodPickerCard }
