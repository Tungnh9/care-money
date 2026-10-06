"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
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
  // Đóng băng từng lượt (lazy initializer lúc mount, sau đó chỉ đổi khi bấm "Ôn tiếp") — chấm 1 thẻ
  // làm dueWords tính lại ở component cha (thẻ đó không còn "tới hạn" nữa) không được làm thẻ đang
  // ôn dở biến mất giữa lượt, giống idiom queue/cards đã dùng ở SpellingGame/MatchGame.
  const [shown, setShown] = useState(() => dueWords.slice(0, DAILY_REVIEW_CAP))
  const [gradedIds, setGradedIds] = useState<string[]>([])

  function handleGrade(wordId: string, grade: ReviewGrade) {
    onGrade(wordId, grade)
    setGradedIds((ids) => [...ids, wordId])
  }

  if (!dueWords.length) {
    return (
      <Card label="Từ cần ôn hôm nay" className={className}>
        <Empty pose="cheer" title="Không có từ nào cần ôn hôm nay" hint="Quay lại vào ngày mai nhé!" />
      </Card>
    )
  }

  // Chấm hết lượt đang hiện thì mời lượt kế: các từ vẫn tới hạn mà chưa chấm trong phiên này, theo
  // đúng thứ tự getDueWords (lượt ôn thật trước từ mới). Không bao giờ bày cả backlog ra 1 lần.
  const batchDone = shown.every((entry) => gradedIds.includes(entry.id))
  const nextBatch = batchDone
    ? dueWords.filter((entry) => !gradedIds.includes(entry.id)).slice(0, DAILY_REVIEW_CAP)
    : []

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
          <ReviewWordCard key={entry.id} entry={entry} onGrade={handleGrade} />
        ))}
      </div>
      {nextBatch.length ? (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="primary" size="sm" onClick={() => setShown(nextBatch)}>
            Ôn tiếp {nextBatch.length} từ
          </Button>
        </div>
      ) : null}
    </Card>
  )
}

export { ReviewDueCard }
