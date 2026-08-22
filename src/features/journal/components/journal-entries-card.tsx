"use client"

import { Trash2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Empty } from "@/components/ob/empty"
import { cn } from "@/lib/utils"
import type { JournalEntry } from "../types"

interface JournalEntriesCardProps {
  entries: JournalEntry[]
  onDelete: (id: number) => void
}

function JournalEntriesCard({ entries, onDelete }: JournalEntriesCardProps) {
  return (
    <Card
      id="ds-entries"
      label={`Nhật ký đã viết${entries.length ? ` · ${entries.length}` : ""}`}
      className={cn(entries.length && "col-span-full")}
    >
      {entries.length ? (
        entries.map((entry) => (
          <div
            key={entry.id}
            className="flex gap-[14px] border-b border-[var(--ob-color-border)] py-[14px]"
          >
            <span
              className="flex size-[38px] flex-none items-center justify-center rounded-full text-[19px] leading-none"
              style={{ background: entry.mood?.tint ?? "var(--ob-vo-100)" }}
            >
              {entry.mood?.emoji ?? "📝"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-x-[10px] gap-y-1">
                <span className="[font-family:var(--ob-font-num)] text-[12px] text-[var(--ob-color-text-subtle)]">
                  {entry.date} · {entry.time}
                </span>
                {entry.mood ? (
                  <span className="text-[12.5px] font-semibold text-[var(--ob-color-text-muted)]">
                    {entry.mood.label}
                  </span>
                ) : null}
                <span className="ml-auto [font-family:var(--ob-font-num)] text-[12px] text-[var(--ob-color-text-subtle)]">
                  {entry.words} từ
                </span>
              </div>
              <p className="text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">
                {entry.text.length > 180 ? `${entry.text.slice(0, 180)}…` : entry.text}
              </p>
            </div>
            <button
              type="button"
              aria-label="Xoá bài"
              onClick={() => onDelete(entry.id)}
              className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)]"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))
      ) : (
        <Empty pose="book" title="Chưa có bài nào" hint="Bài đầu tiên bạn lưu sẽ hiện ở đây." />
      )}
    </Card>
  )
}

export { JournalEntriesCard }
