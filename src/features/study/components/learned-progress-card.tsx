"use client"

import { Figure } from "@/components/ob/figure"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useT } from "@/components/locale-provider"

interface LearnedProgressCardProps {
  learnedCount: number
  totalCount: number
  className?: string
}

function LearnedProgressCard({ learnedCount, totalCount, className }: LearnedProgressCardProps) {
  const t = useT()
  const percent = totalCount ? Math.round((learnedCount / totalCount) * 100) : 0

  return (
    <Card label={t("study.learned")} className={className}>
      <Figure value={String(learnedCount)} unit={`/${totalCount}`} size="sm" />
      <Progress
        value={percent}
        tone="action"
        className="mt-4"
        label={t("study.learnedProgress", { pct: percent })}
      />
    </Card>
  )
}

export { LearnedProgressCard }
