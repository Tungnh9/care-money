import { Figure } from "@/components/ob/figure"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface LearnedProgressCardProps {
  learnedCount: number
  totalCount: number
}

function LearnedProgressCard({ learnedCount, totalCount }: LearnedProgressCardProps) {
  const percent = totalCount ? Math.round((learnedCount / totalCount) * 100) : 0

  return (
    <Card label="Đã học">
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
