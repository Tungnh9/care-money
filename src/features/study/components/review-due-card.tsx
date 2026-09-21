"use client"

import { useState } from "react"

import { Card } from "@/components/ui/card"
import { Empty } from "@/components/ob/empty"
import { cn } from "@/lib/utils"
import { DAILY_REVIEW_CAP } from "../srs-calculations"
import { ReviewWordCard } from "./review-word-card"
import type { ReviewGrade, VocabEntry } from "../types"

interface ReviewDueCardProps {
  dueWords: VocabEntry[]
  onGrade: (wordId: string, grade: ReviewGrade) => void
  className?: string
}

function ReviewDueCard({ dueWords, onGrade, className }: ReviewDueCardProps) {
  // Đóng băng đúng 1 lần lúc mount (lazy initializer chỉ chạy 1 lần bất kể re-render) — chấm 1
  // thẻ làm dueWords tính lại ở component cha (thẻ đó không còn "tới hạn" nữa) không được làm
  // thẻ đang ôn dở biến mất giữa phiên, giống idiom queue/cards đã dùng ở SpellingGame/MatchGame.
  const [shown] = useState(() => dueWords.slice(0, DAILY_REVIEW_CAP))

  if (!dueWords.length) {
    return (
      <Card label="Từ cần ôn hôm nay" className={className}>
        <Empty pose="cheer" title="Không có từ nào cần ôn hôm nay" hint="Quay lại vào ngày mai nhé!" />
      </Card>
    )
  }

  return (
    <Card
      label="Từ cần ôn hôm nay"
      action={
        <span className="[font-family:var(--ob-font-num)] text-[12.5px] font-bold text-[var(--ob-color-text-subtle)]">
          {dueWords.length} từ đang chờ
        </span>
      }
      className={cn(className)}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shown.map((entry) => (
          <ReviewWordCard key={entry.id} entry={entry} onGrade={onGrade} />
        ))}
      </div>
    </Card>
  )
}

export { ReviewDueCard }
