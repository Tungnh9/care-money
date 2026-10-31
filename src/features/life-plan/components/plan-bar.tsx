"use client"

import type { LifePlan } from "@/lib/life-plan/types"
import { cn } from "@/lib/utils"
import { PLAN_STATUS_DOT } from "../labels"

interface PlanBarProps {
  plans: LifePlan[]
  // Kế hoạch đang lọc; null = không lọc.
  activeId: number | null
  // Bấm 1 kế hoạch để lọc theo nó, bấm lại kế hoạch đang lọc để bỏ lọc — nơi gọi quyết theo `activeId`.
  onToggle: (id: number) => void
}

// Dải nút chọn kế hoạch ở đầu trang. Chấm màu trước tên là trạng thái (dự định / đang làm / đã đạt).
function PlanBar({ plans, activeId, onToggle }: PlanBarProps) {
  if (!plans.length) return null

  return (
    <div role="group" aria-label="Lọc theo kế hoạch" className="mb-5 flex flex-wrap gap-[6px]">
      {plans.map((plan) => {
        const active = plan.id === activeId
        return (
          <button
            key={plan.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(plan.id)}
            className={cn(
              "inline-flex min-h-[var(--ob-hit-min)] max-w-full items-center gap-[7px] rounded-[var(--ob-radius-pill)] border-[1.5px] px-[14px] text-[13px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
              active
                ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                : "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"
            )}
          >
            <span
              aria-hidden="true"
              className="size-2 flex-none rounded-full"
              style={{ background: PLAN_STATUS_DOT[plan.status] }}
            />
            <span className="truncate">{plan.title}</span>
          </button>
        )
      })}
    </div>
  )
}

export { PlanBar }
