import { Card } from "@/components/ui/card"
import { VocabWordRow } from "./vocab-word-row"
import type { VocabEntry } from "../types"

interface VocabCardProps {
  label: string
  action?: React.ReactNode
  intro?: string
  entries: VocabEntry[]
  learned: string[]
  onToggleLearned: (id: string) => void
  className?: string
}

function VocabCard({
  label,
  action,
  intro,
  entries,
  learned,
  onToggleLearned,
  className,
}: VocabCardProps) {
  return (
    <Card label={label} action={action} className={className}>
      {intro ? (
        <p className="mb-1 text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">{intro}</p>
      ) : null}
      {entries.map((entry) => (
        <VocabWordRow
          key={entry.id}
          entry={entry}
          learned={learned.includes(entry.id)}
          onToggleLearned={onToggleLearned}
        />
      ))}
    </Card>
  )
}

export { VocabCard }
