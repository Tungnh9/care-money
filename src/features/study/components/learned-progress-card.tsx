import { Figure } from "@/components/ob/figure"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface LearnedProgressCardProps {
  learnedCount: number
  totalCount: number
  className?: string
}

function LearnedProgressCard({ learnedCount, totalCount, className }: LearnedProgressCardProps) {
  const percent = totalCount ? Math.round((learnedCount / totalCount) * 100) : 0

  return (
    <Card label="Đã học" className={className}>
      <Figure value={String(learnedCount)} unit={`/${totalCount}`} size="sm" />
      <Progress
        value={percent}
        tone="action"
        className="mt-4"
        label={`Thuộc ${percent}% kho từ`}
      />
    </Card>
  )
}

export { LearnedProgressCard }
