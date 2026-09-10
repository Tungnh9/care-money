import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { HighlightedSentence } from "./highlighted-sentence"
import type { GrammarEntry, VocabEntry } from "../types"

function ExampleList({ examples, vocab }: { examples?: string[]; vocab: VocabEntry[] }) {
  if (!examples?.length) return null
  return (
    <div className="flex flex-col gap-1">
      {examples.map((example, i) => (
        <p key={i} className="text-sm leading-[1.6] italic">
          <HighlightedSentence sentence={example} vocab={vocab} />
        </p>
      ))}
    </div>
  )
}

function StructureBadge({ structure }: { structure?: string }) {
  if (!structure) return null
  return (
    <span className="rounded-[var(--ob-radius-pill)] bg-[var(--ob-color-action-soft)] px-[11px] py-[5px] [font-family:var(--ob-font-num)] text-[12px] font-bold text-[var(--ob-color-action-strong)]">
      {structure}
    </span>
  )
}

interface GrammarHighlightCardProps {
  entry: GrammarEntry
  vocab: VocabEntry[]
}

function GrammarHighlightCard({ entry, vocab }: GrammarHighlightCardProps) {
  return (
    <Card tone="reward" label="Ngữ pháp hôm nay" className="min-w-0 flex-[1_1_100%]">
      <div className="mb-3 flex flex-wrap items-center gap-[9px] text-[19px] font-bold">
        {entry.title}
        <StructureBadge structure={entry.structure} />
      </div>
      <div className="mb-[10px] text-sm leading-[1.6] text-[#5C4200]">{entry.explanation}</div>
      <ExampleList examples={entry.examples} vocab={vocab} />
    </Card>
  )
}

interface GrammarListCardProps {
  entries: GrammarEntry[]
  vocab: VocabEntry[]
}

function GrammarListCard({ entries, vocab }: GrammarListCardProps) {
  return (
    <Card label={`Ngữ pháp tiếng Anh · ${entries.length} mục`}>
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className={cn(
            "border-t border-[var(--ob-color-border)] px-3 py-4",
            i % 2 === 0 && "bg-[var(--ob-color-reward)]"
          )}
        >
          <div className="mb-2 flex flex-wrap items-center gap-[9px] text-[15px] font-bold">
            {entry.title}
            <StructureBadge structure={entry.structure} />
          </div>
          <div className="mb-[5px] text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            {entry.explanation}
          </div>
          <ExampleList examples={entry.examples} vocab={vocab} />
        </div>
      ))}
    </Card>
  )
}

export { GrammarHighlightCard, GrammarListCard }
