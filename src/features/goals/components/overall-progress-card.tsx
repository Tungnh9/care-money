import Image from "next/image"

import { Figure } from "@/components/ob/figure"
import { Card } from "@/components/ui/card"
import { useT } from "@/components/locale-provider"
import { cn } from "@/lib/utils"
import type { Goal } from "../types"

interface OverallProgressCardProps {
  goals: Goal[]
  avg: number
  className?: string
}

function OverallProgressCard({ goals, avg, className }: OverallProgressCardProps) {
  const t = useT()

  return (
    <Card tone="invert" label={t("goals.overallProgress")} className={cn(className)}>
      <Figure
        value={`${avg}%`}
        caption={t("goals.overallCaption", { count: goals.length })}
      />
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-[18px] border-t border-[var(--ob-vo-700)] pt-5 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        {goals.map((goal) => (
          <div key={goal.key}>
            <div className="mb-2 flex items-center gap-2 text-[var(--ob-vo-300)]">
              <Image src={`/assets/icons/${goal.icon}.svg`} width={17} height={17} alt="" />
              <span className="[font-family:var(--ob-font-num)] text-[13px] font-bold text-[var(--ob-kem)] tabular-nums">
                {goal.percent}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-[var(--ob-radius-pill)] bg-[var(--ob-vo-700)]">
              <div
                className="h-full"
                style={{
                  width: `${goal.percent}%`,
                  background: goal.percent >= 100 ? "var(--ob-la-300)" : "var(--ob-color-reward)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export { OverallProgressCard }
