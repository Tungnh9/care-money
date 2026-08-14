"use client"

import { Check, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VocabEntry } from "../types"

interface VocabWordRowProps {
  entry: VocabEntry
  learned: boolean
  onToggleLearned: (id: string) => void
}

function VocabWordRow({ entry, learned, onToggleLearned }: VocabWordRowProps) {
  return (
    <div className="flex flex-wrap items-start gap-[14px] border-t border-[var(--ob-color-border)] py-[14px]">
      <div className="min-w-0 flex-[1_1_220px]">
        <div className="mb-[5px] flex flex-wrap items-baseline gap-[9px]">
          <span className="text-base font-bold">{entry.word}</span>
          {entry.phonetic ? (
            <span className="[font-family:var(--ob-font-num)] text-[12px] text-[var(--ob-color-text-subtle)]">
              {entry.phonetic}
            </span>
          ) : null}
          {entry.pos ? (
            <span className="rounded-[var(--ob-radius-pill)] bg-[var(--ob-color-surface-sunken)] px-2 py-[3px] text-[11px] font-bold text-[var(--ob-color-text-subtle)]">
              {entry.pos}
            </span>
          ) : null}
        </div>
        <div className="mb-1 text-sm font-medium">{entry.meaning}</div>
        {entry.example ? (
          <div className="text-[13px] leading-[1.5] text-[var(--ob-color-text-subtle)] italic">
            {entry.example}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onToggleLearned(entry.id)}
        aria-label={learned ? "Bỏ đánh dấu đã học" : "Đánh dấu đã học"}
        className={cn(
          "flex min-h-[var(--ob-hit-min)] flex-none items-center gap-2 rounded-[var(--ob-radius-pill)] border-[1.5px] px-[14px] py-[9px] text-[13px] font-bold",
          learned
            ? "border-transparent bg-[#E7F6EF] text-[var(--ob-color-income)]"
            : "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"
        )}
      >
        {learned ? <Check size={16} /> : <Plus size={16} />}
        {learned ? "Đã học" : "Đánh dấu"}
      </button>
    </div>
  )
}

export { VocabWordRow }
