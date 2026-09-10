import { Card } from "@/components/ui/card"
import { Confetti } from "@/components/ob/confetti"
import { cn } from "@/lib/utils"
import { VocabWordCard } from "./vocab-word-card"
import type { VocabEntry } from "../types"

interface VocabCardProps {
  label: string
  action?: React.ReactNode
  intro?: string
  entries: VocabEntry[]
  learned: string[]
  onToggleLearned: (id: string) => void
  celebrate?: boolean
  className?: string
  gridClassName?: string
}

function VocabCard({
  label,
  action,
  intro,
  entries,
  learned,
  onToggleLearned,
  celebrate = false,
  className,
  gridClassName = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
}: VocabCardProps) {
  return (
    <Card label={label} action={action} className={cn(celebrate && "ob-tada relative", className)}>
      {celebrate ? <Confetti n={14} /> : null}
      {intro ? (
        <p className="mb-1 text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">{intro}</p>
      ) : null}
      <div className={gridClassName}>
        {entries.map((entry) => (
          <VocabWordCard
            key={entry.id}
            entry={entry}
            learned={learned.includes(entry.id)}
            onToggleLearned={onToggleLearned}
          />
        ))}
      </div>
    </Card>
  )
}

export { VocabCard }
