import Image from "next/image"
import Link from "next/link"

import type { JournalEntry } from "@/features/journal/types"
import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { Streak } from "@/components/ob/streak"
import { buttonVariants } from "@/components/ui/button"
import { BADGE_AT } from "@/lib/constants"

interface JournalSummarySectionProps {
  entries: JournalEntry[]
  streak: number
  showStreak: boolean
}

function JournalSummarySection({ entries, streak, showStreak }: JournalSummarySectionProps) {
  const recent = entries.slice(0, 3)

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <Card label="Bài gần đây" className="min-w-0 flex-[2_1_460px]">
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
          <div>
            <p className="mb-4 text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">
              Chưa có bài nào cho hôm nay. Ba câu là đủ.
            </p>
            <Link href="/journal" className={buttonVariants({ variant: "primary", size: "sm" })}>
              Viết nhật ký hôm nay
            </Link>
          </div>
        )}
      </Card>

      {showStreak ? (
        <Card tone="reward" label="Chuỗi ngày" className="min-w-0 flex-[1_1_280px]">
          <Figure value={String(streak)} />
          <Streak
            days={7}
            done={Math.min(streak, 7)}
            icon={<Image src="/assets/icons/flame-on.svg" width={19} height={19} alt="" />}
            className="mt-4"
          />
          <p className="mt-[14px] text-[13px] leading-[1.5] text-[#5C4200]">
            {streak >= BADGE_AT
              ? "Bạn đã mở huy hiệu "
              : `Viết nhật ký đủ ${BADGE_AT - streak} ngày nữa để mở huy hiệu `}
            <strong className="inline-flex items-center gap-[5px] align-[-4px] font-bold">
              Chuỗi Vàng
              <Image src="/assets/icons/badge.svg" width={18} height={18} alt="" />
            </strong>
            .
          </p>
        </Card>
      ) : null}
    </div>
  )
}

export { JournalSummarySection }
