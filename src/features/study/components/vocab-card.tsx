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
}: VocabCardProps) {
  return (
    <Card label={label} action={action} className={cn(celebrate && "ob-tada relative", className)}>
      {celebrate ? <Confetti n={14} /> : null}
      {intro ? (
        <p className="mb-1 text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">{intro}</p>
      ) : null}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
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
