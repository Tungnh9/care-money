import Image from "next/image"

import { Confetti } from "@/components/ob/confetti"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { SavingsFund } from "@/features/finance/types"
import type { Goal } from "../types"
import { CarFundPicker } from "./car-fund-picker"

interface GoalCardProps {
  goal: Goal
  className?: string
  savings?: SavingsFund[]
  selectedFundName?: string | null
  onSelectFund?: (name: string | null) => void
}

function GoalCard({ goal, className, savings, selectedFundName, onSelectFund }: GoalCardProps) {
  const isCar = goal.key === "car"
  const unlinked = !goal.linked
  const iconName = goal.done ? "check" : goal.icon

  return (
    <Card label={goal.name} className={cn(goal.done && "ob-tada relative", className)}>
      {goal.done ? <Confetti n={12} /> : null}
      <div className="mb-[18px] grid grid-cols-[auto_1fr_auto] items-center gap-x-[14px]">
        <span
          className={cn(
            "flex size-[42px] flex-none items-center justify-center rounded-[var(--ob-radius-md)]",
            goal.done
              ? "bg-[#E7F6EF] text-[var(--ob-color-income)]"
              : "bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
          )}
        >
          <Image src={`/assets/icons/${iconName}.svg`} width={23} height={23} alt="" />
        </span>
        <div className="min-w-0 [font-family:var(--ob-font-num)] text-[clamp(18px,9cqi,26px)] font-bold leading-none tracking-[-0.02em] tabular-nums">
          {unlinked ? `${goal.percent}%` : goal.format(goal.now)}
        </div>
        {unlinked ? null : (
          <span
            className={cn(
              "flex-none rounded-[var(--ob-radius-pill)] px-[11px] py-[6px] [font-family:var(--ob-font-num)] text-[12.5px] font-bold",
              goal.done
                ? "bg-[#E7F6EF] text-[var(--ob-color-income)]"
                : "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]"
            )}
          >
            {goal.percent}%
          </span>
        )}
        <div className="col-start-2 min-w-0 mt-1.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">
          {unlinked ? "Đã trích được" : `trên ${goal.format(goal.target)}`}
        </div>
      </div>
      <Progress value={goal.percent} tone={goal.tone} />
      <p className="mt-[14px] text-[13px] leading-[1.55] text-[var(--ob-color-text-muted)]">{goal.note}</p>
      {isCar && savings && onSelectFund ? (
        <CarFundPicker savings={savings} selected={selectedFundName ?? null} onSelect={onSelectFund} />
      ) : null}
    </Card>
  )
}

export { GoalCard }
