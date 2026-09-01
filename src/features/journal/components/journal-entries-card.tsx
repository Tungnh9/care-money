"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Empty } from "@/components/ob/empty"
import { cn } from "@/lib/utils"
import { sanitizeJournalHtml, stripHtmlToPlainText } from "../journal-html"
import type { JournalEntry } from "../types"

interface JournalEntriesCardProps {
  entries: JournalEntry[]
  onDelete: (id: number) => void
  onEdit: (entry: JournalEntry) => void
  highlightEntryId?: number | null
  highlightNonce?: number
}

const TRUNCATE_LENGTH = 180

function JournalEntriesCard({
  entries,
  onDelete,
  onEdit,
  highlightEntryId = null,
  highlightNonce,
}: JournalEntriesCardProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Card
      id="ds-entries"
      label={`Nhật ký đã viết${entries.length ? ` · ${entries.length}` : ""}`}
      className={cn(entries.length && "col-span-full")}
    >
      {entries.length ? (
        entries.map((entry) => {
          const plainText = stripHtmlToPlainText(entry.text)
          const isTruncated = plainText.length > TRUNCATE_LENGTH
          const isExpanded = expandedIds.has(entry.id)
          const isHighlighted = entry.id === highlightEntryId

          return (
            <div
              key={isHighlighted ? `${entry.id}-${highlightNonce}` : entry.id}
              id={`journal-entry-${entry.id}`}
              className={cn(
                "flex gap-[14px] border-b border-[var(--ob-color-border)] py-[14px]",
                isHighlighted && "ob-highlight-flash"
              )}
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
                    {entry.date} · {entry.time} · {entry.words} từ
                  </span>
                  {entry.mood ? (
                    <span className="text-[12.5px] font-semibold text-[var(--ob-color-text-muted)]">
                      {entry.mood.label}
                    </span>
                  ) : null}
                </div>
                {isTruncated && !isExpanded ? (
                  <p className="whitespace-pre-wrap text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">
                    {`${plainText.slice(0, TRUNCATE_LENGTH)}…`}
                  </p>
                ) : (
                  <div
                    className="[&_blockquote]:my-[10px] [&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--ob-color-reward)] [&_blockquote]:pl-3 [&_h3]:mt-[10px] [&_h3]:mb-1 [&_h3]:font-bold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-[20px] [&_ul]:list-disc [&_ul]:pl-[20px] text-sm leading-[1.6] text-[var(--ob-color-text-muted)]"
                    dangerouslySetInnerHTML={{ __html: sanitizeJournalHtml(entry.text) }}
                  />
                )}
                {isTruncated ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(entry.id)}
                    className="mt-1 text-[12.5px] font-semibold text-[var(--ob-color-action-strong)]"
                  >
                    {isExpanded ? "Thu gọn" : "Xem thêm"}
                  </button>
                ) : null}
              </div>
              <div className="flex flex-none items-start gap-1">
                <button
                  type="button"
                  aria-label={`Sửa bài ${entry.date} ${entry.time}`}
                  onClick={() => onEdit(entry)}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Xoá bài"
                  onClick={() => onDelete(entry.id)}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          )
        })
      ) : (
        <Empty pose="book" title="Chưa có bài nào" hint="Bài đầu tiên bạn lưu sẽ hiện ở đây." />
      )}
    </Card>
  )
}

export { JournalEntriesCard }
