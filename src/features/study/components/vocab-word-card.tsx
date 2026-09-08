"use client"

import Image from "next/image"
import { Check, ImageIcon, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VocabEntry } from "../types"

interface VocabWordCardProps {
  entry: VocabEntry
  learned: boolean
  onToggleLearned: (id: string) => void
}

function VocabWordCard({ entry, learned, onToggleLearned }: VocabWordCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--ob-radius-md)] border border-[var(--ob-color-border)] bg-[var(--ob-color-surface)]">
      <div className="relative aspect-[4/3] bg-[var(--ob-color-surface-sunken)]">
        {entry.image ? (
          <Image src={entry.image} alt={entry.word} fill className="object-cover" />
        ) : (
          <div
            data-testid="vocab-image-placeholder"
            className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--ob-color-action-soft)] to-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-subtle)]"
          >
            <ImageIcon size={28} strokeWidth={1.5} />
          </div>
        )}
        <button
          type="button"
          onClick={() => onToggleLearned(entry.id)}
          aria-label={learned ? "Bỏ đánh dấu đã học" : "Đánh dấu đã học"}
          aria-pressed={learned}
          className={cn(
            "absolute top-2 right-2 flex size-8 items-center justify-center rounded-full border-[1.5px] shadow-sm transition-colors duration-[var(--ob-dur-fast)]",
            learned
              ? "border-transparent bg-[var(--ob-color-income)] text-white"
              : "border-transparent bg-[var(--ob-color-surface)]/90 text-[var(--ob-color-text-muted)]"
          )}
        >
          {learned ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-[14px]">
        <div className="flex flex-wrap items-baseline gap-[7px]">
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
        <div className="text-sm font-medium">{entry.meaning}</div>
        {entry.example ? (
          <div className="text-[12.5px] leading-[1.5] text-[var(--ob-color-text-subtle)] italic">
            {entry.example}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { VocabWordCard }
