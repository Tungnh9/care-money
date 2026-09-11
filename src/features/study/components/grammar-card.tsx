"use client"

import { useMemo, useState } from "react"
import { Languages } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { buildVocabIndex } from "../highlight-vocab"
import { HighlightedSentence } from "./highlighted-sentence"
import type { GrammarEntry, VocabEntry } from "../types"

function ExampleSentence({
  sentence,
  translation,
  vocabIndex,
}: {
  sentence: string
  translation?: string
  vocabIndex: Map<string, string>
}) {
  const [open, setOpen] = useState(false)

  return (
    <p className="text-sm leading-[1.6] italic">
      <HighlightedSentence sentence={sentence} vocabIndex={vocabIndex} />
      {translation ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Ẩn bản dịch" : "Dịch sang tiếng Việt"}
          aria-expanded={open}
          className="ml-[6px] inline-flex size-6 flex-none items-center justify-center rounded-full bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)] align-middle not-italic shadow-sm transition-colors duration-[var(--ob-dur-fast)] hover:bg-[var(--ob-color-action)] hover:text-white"
        >
          <Languages size={14} />
        </button>
      ) : null}
      {translation && open ? (
        <span className="block text-[var(--ob-color-text-subtle)] not-italic">{translation}</span>
      ) : null}
    </p>
  )
}

function ExampleList({
  examples,
  translations,
  vocab,
}: {
  examples?: string[]
  translations?: string[]
  vocab: VocabEntry[]
}) {
  // Build the vocab lookup once per (grammar entry × vocab list) instead of once per sentence.
  const vocabIndex = useMemo(() => buildVocabIndex(vocab), [vocab])

  if (!examples?.length) return null
  return (
    <div className="flex flex-col gap-1">
      {examples.map((example, i) => (
        <ExampleSentence key={i} sentence={example} translation={translations?.[i]} vocabIndex={vocabIndex} />
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
      <ExampleList examples={entry.examples} translations={entry.translations} vocab={vocab} />
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
          <ExampleList examples={entry.examples} translations={entry.translations} vocab={vocab} />
        </div>
      ))}
    </Card>
  )
}

export { GrammarHighlightCard, GrammarListCard }
