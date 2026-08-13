import { Check } from "lucide-react"

import { Streak } from "@/components/ob/streak"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { BADGE_AT } from "../get-goals"
import type { Goal } from "../types"

interface GoalCardProps {
  goal: Goal
}

function GoalCard({ goal }: GoalCardProps) {
  const isCar = goal.key === "car"
  const GoalIcon = goal.done ? Check : goal.icon

  return (
    <Card label={goal.name}>
      <div className="mb-[18px] flex items-start gap-[14px]">
        <span
          className={cn(
            "flex size-[42px] flex-none items-center justify-center rounded-[var(--ob-radius-md)]",
            goal.done
              ? "bg-[#E7F6EF] text-[var(--ob-color-income)]"
              : "bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
          )}
        >
          <GoalIcon size={23} />
        </span>
        <div className="min-w-0">
          <div className="[font-family:var(--ob-font-num)] text-[clamp(18px,9cqi,26px)] font-bold leading-none tracking-[-0.02em] tabular-nums">
            {isCar ? `${goal.percent}%` : goal.format(goal.now)}
          </div>
          <div className="mt-1.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">
            {isCar ? "Đã trích được" : `trên ${goal.format(goal.target)}`}
          </div>
        </div>
        {isCar ? null : (
          <span
            className={cn(
              "ml-auto flex-none rounded-[var(--ob-radius-pill)] px-[11px] py-[6px] [font-family:var(--ob-font-num)] text-[12.5px] font-bold",
              goal.done
                ? "bg-[#E7F6EF] text-[var(--ob-color-income)]"
                : "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]"
            )}
          >
            {goal.percent}%
          </span>
        )}
      </div>
      {goal.key === "streak" ? (
        <Streak days={BADGE_AT} done={goal.now} icon={null} />
      ) : (
        <Progress value={goal.percent} tone={goal.tone} />
      )}
      <p className="mt-[14px] text-[13px] leading-[1.55] text-[var(--ob-color-text-muted)]">{goal.note}</p>
    </Card>
  )
}

export { GoalCard }
