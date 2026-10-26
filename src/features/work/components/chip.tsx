import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

const TONES = {
  neutral: "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]",
  danger: "bg-[var(--ob-color-expense-soft)] text-[var(--ob-color-expense)]",
  success: "bg-[var(--ob-color-income-soft)] text-[var(--ob-color-income)]",
  outline: "border border-[var(--ob-color-border)] text-[var(--ob-color-text-subtle)]",
}

interface ChipProps {
  tone?: keyof typeof TONES
  children: ReactNode
}

// Nhãn nhỏ dạng viên thuốc trên thẻ việc và báo cáo tuần (hạn, ngày xong, tên cột).
function Chip({ tone = "neutral", children }: ChipProps) {
  return (
    <span
      className={cn(
        "rounded-[var(--ob-radius-pill)] px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap",
        TONES[tone]
      )}
    >
      {children}
    </span>
  )
}

export { Chip }
