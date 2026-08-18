import { Card } from "@/components/ui/card"
import { Confetti } from "@/components/ob/confetti"
import { cn } from "@/lib/utils"
import { VocabWordRow } from "./vocab-word-row"
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
