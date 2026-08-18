import { Card } from "@/components/ui/card"
import type { GrammarEntry } from "../types"

function ExampleList({ examples }: { examples?: string[] }) {
  if (!examples?.length) return null
  return (
    <div className="flex flex-col gap-1">
      {examples.map((example, i) => (
        <p key={i} className="text-sm leading-[1.6] italic">
          {example}
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
}

function GrammarHighlightCard({ entry }: GrammarHighlightCardProps) {
  return (
    <Card tone="reward" label="Ngữ pháp hôm nay" className="min-w-0 flex-[1_1_100%]">
      <div className="mb-3 flex flex-wrap items-center gap-[9px] text-[19px] font-bold">
        {entry.title}
        <StructureBadge structure={entry.structure} />
      </div>
      <div className="mb-[10px] text-sm leading-[1.6] text-[#5C4200]">{entry.explanation}</div>
      <ExampleList examples={entry.examples} />
    </Card>
  )
}

interface GrammarListCardProps {
  entries: GrammarEntry[]
}

function GrammarListCard({ entries }: GrammarListCardProps) {
  return (
    <Card label={`Ngữ pháp tiếng Anh · ${entries.length} mục`}>
      {entries.map((entry) => (
        <div key={entry.id} className="border-t border-[var(--ob-color-border)] py-4">
          <div className="mb-2 flex flex-wrap items-center gap-[9px] text-[15px] font-bold">
            {entry.title}
            <StructureBadge structure={entry.structure} />
          </div>
          <div className="mb-[5px] text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            {entry.explanation}
          </div>
          <ExampleList examples={entry.examples} />
        </div>
      ))}
    </Card>
  )
}

export { GrammarHighlightCard, GrammarListCard }
