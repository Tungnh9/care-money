"use client"

import { cn } from "@/lib/utils"

interface StudyTabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

function StudyTabs({ tabs, active, onChange }: StudyTabsProps) {
  return (
    <div className="mb-[18px] flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={cn(
              "min-h-[var(--ob-hit-min)] rounded-[var(--ob-radius-pill)] px-4 py-[10px] text-[length:var(--ob-size-sm)] leading-[var(--ob-lh-normal)] whitespace-nowrap",
              isActive
                ? "bg-[var(--ob-color-action-soft)] font-bold text-[var(--ob-color-action-strong)]"
                : "font-medium text-[var(--ob-color-text-muted)]"
            )}
          >
            {tab}
          </button>
        )
      })}
    </div>
  )
}

export { StudyTabs }
