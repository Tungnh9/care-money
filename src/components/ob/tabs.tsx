"use client"

import { cn } from "@/lib/utils"

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="mb-[18px] flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            type="button"
            // Tab đang chọn chỉ khác ở màu/độ đậm chữ — aria-pressed báo trạng thái đó cho trình đọc màn
            // hình, đúng kiểu các nút chọn khác trong app (Ẩn số tiền, chip tâm trạng).
            aria-pressed={isActive}
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

export { Tabs }
