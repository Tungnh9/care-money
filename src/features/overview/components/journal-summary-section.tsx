import Link from "next/link"

import type { JournalEntry } from "@/features/journal/types"
import { Card } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Empty } from "@/components/ob/empty"

interface JournalSummarySectionProps {
  entries: JournalEntry[]
}

function JournalSummarySection({ entries }: JournalSummarySectionProps) {
  const recent = entries.slice(0, 3)

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <Card label="Bài gần đây" className="min-w-0 flex-[1_1_100%]">
        {recent.length ? (
          <div>
            {recent.map((entry) => (
              <div key={entry.id} className="flex gap-3 border-t border-[var(--ob-color-border)] py-[11px]">
                <span
                  className="flex size-8 flex-none items-center justify-center rounded-full text-base leading-none"
                  style={{ background: entry.mood?.tint ?? "var(--ob-vo-100)" }}
                >
                  {entry.mood?.emoji ?? "📝"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-[3px] [font-family:var(--ob-font-num)] text-[11.5px] text-[var(--ob-color-text-subtle)]">
                    {entry.date} · {entry.time} · {entry.words} từ
                  </div>
                  <p className="m-0 overflow-hidden text-[13.5px] leading-[1.55] text-ellipsis whitespace-nowrap text-[var(--ob-color-text-muted)]">
                    {entry.text}
                  </p>
                </div>
              </div>
            ))}
            <Link href="/journal" className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-4" })}>
              Viết thêm một bài
            </Link>
          </div>
        ) : (
          <Empty pose="book" size={78} title="Chưa có bài nào cho hôm nay" hint="Ba câu là đủ để tuần sau nhìn lại.">
            <Link href="/journal" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Viết nhật ký hôm nay
            </Link>
          </Empty>
        )}
      </Card>
    </div>
  )
}

export { JournalSummarySection }
