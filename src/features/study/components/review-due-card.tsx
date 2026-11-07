"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty } from "@/components/ob/empty"
import { cn } from "@/lib/utils"
import { DAILY_NEW_WORDS, DAILY_REVIEW_CAP, type TodayQueue } from "@/lib/study/srs-calculations"
import { ReviewWordCard } from "./review-word-card"
import type { ReviewGrade, VocabEntry } from "@/lib/study/types"

interface ReviewDueCardProps {
  queue: TodayQueue
  onGrade: (wordId: string, grade: ReviewGrade) => void
  className?: string
}

interface ShownWord {
  entry: VocabEntry
  // Từ mới lúc đưa vào lượt — giữ nhãn "Mới" cả sau khi chấm (lúc đó nó đã rời hàng từ mới).
  isNew: boolean
}

function batchOf(words: VocabEntry[], fresh: VocabEntry[]): ShownWord[] {
  const freshIds = new Set(fresh.map((entry) => entry.id))
  return words.slice(0, DAILY_REVIEW_CAP).map((entry) => ({ entry, isNew: freshIds.has(entry.id) }))
}

function ReviewDueCard({ queue, onGrade, className }: ReviewDueCardProps) {
  // Ôn lại trước, từ mới hôm nay sau — đúng thứ tự getTodayQueue.
  const words = [...queue.reviews, ...queue.fresh]
  // Đóng băng từng lượt (lazy initializer lúc mount, sau đó chỉ đổi khi bấm "Ôn tiếp") — chấm 1 thẻ
  // làm hàng chờ tính lại ở component cha (thẻ đó không còn "tới hạn" nữa) không được làm thẻ đang
  // ôn dở biến mất giữa lượt, giống idiom queue/cards đã dùng ở SpellingGame/MatchGame.
  const [shown, setShown] = useState(() => batchOf(words, queue.fresh))
  const [gradedIds, setGradedIds] = useState<string[]>([])

  function handleGrade(wordId: string, grade: ReviewGrade) {
    onGrade(wordId, grade)
    setGradedIds((ids) => [...ids, wordId])
  }

  if (!words.length) {
    return (
      <Card label="Từ cần ôn hôm nay" className={className}>
        <Empty
          pose="cheer"
          title="Không có từ nào cần ôn hôm nay"
          hint={
            queue.newLeft > 0
              ? `Đã đủ ${DAILY_NEW_WORDS} từ mới hôm nay — mai học tiếp nhé!`
              : "Quay lại vào ngày mai nhé!"
          }
        />
      </Card>
    )
  }

  // Chấm hết lượt đang hiện thì mời lượt kế: các từ vẫn trong hàng chờ mà chưa chấm trong phiên này. Không bao giờ
  // bày cả hàng chờ ra 1 lần.
  const batchDone = shown.every(({ entry }) => gradedIds.includes(entry.id))
  const nextBatch = batchDone
    ? batchOf(
        words.filter((entry) => !gradedIds.includes(entry.id)),
        queue.fresh
      )
    : []

  return (
    <Card
      label="Từ cần ôn hôm nay"
      action={
        <span className="[font-family:var(--ob-font-num)] text-[12.5px] font-bold text-[var(--ob-color-text-subtle)]">
          {queue.reviews.length} ôn lại · {queue.fresh.length} từ mới
        </span>
      }
      className={cn(className)}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shown.map(({ entry, isNew }) => (
          <ReviewWordCard key={entry.id} entry={entry} isNew={isNew} onGrade={handleGrade} />
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
