import { Check } from "lucide-react"

import { pickDaily } from "@/features/study/daily-pick"
import { DAILY_REVIEW_CAP } from "@/features/study/srs-calculations"
import { GrammarHighlightCard } from "@/features/study/components/grammar-card"
import type { GrammarEntry, Task, VocabEntry } from "@/features/study/types"
import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { ImageWithFallback } from "@/components/ob/image-with-fallback"
import { SpeakButton } from "@/components/ob/speak-button"
import { TaskItem } from "@/components/ob/task-item"
import { dayKey } from "@/lib/date"
import { cn } from "@/lib/utils"

interface StudySummarySectionProps {
  vocab: VocabEntry[]
  grammar: GrammarEntry[]
  tasks: Task[]
  onToggleTask: (index: number) => void
  learned: string[]
  // Đã tính sẵn ở overview-view.tsx (getDueWords, giống hệt trang Học tập) — CHƯA cắt theo cap,
  // component này tự cắt để hiển thị, giữ đúng ý nghĩa "tổng số thật" cho nơi gọi nếu cần dùng.
  dueWords: VocabEntry[]
}

function VocabTeaserCard({ entry, learned }: { entry: VocabEntry; learned: boolean }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <ImageWithFallback
        src={entry.image}
        alt={entry.word}
        iconSize={18}
        imageSizes="(max-width: 640px) 20vw, 120px"
        className="overflow-hidden rounded-[var(--ob-radius-sm)]"
      >
        <SpeakButton word={entry.word} size="sm" className="absolute top-1 left-1" />
        {learned ? (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[var(--ob-color-income)] text-white">
            <Check size={10} />
          </span>
        ) : null}
      </ImageWithFallback>
      <div className="min-w-0">
        <div
          className={cn(
            "text-[12.5px] leading-[1.4] font-bold",
            learned ? "text-[var(--ob-color-text-subtle)] line-through" : "text-[var(--ob-color-text)]"
          )}
        >
          {entry.word}
        </div>
        <div className="text-[11px] leading-[1.4] text-[var(--ob-color-text-subtle)]">{entry.meaning}</div>
      </div>
    </div>
  )
}

function StudySummarySection({ vocab, grammar, tasks, onToggleTask, learned, dueWords }: StudySummarySectionProps) {
  const key = dayKey()
  const dailyGrammar = pickDaily(grammar, 1, key, "grammar")[0]
  const doneTasks = tasks.filter((task) => task.done).length
  const shownDueWords = dueWords.slice(0, DAILY_REVIEW_CAP)

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <Card label="Nhiệm vụ hôm nay" className="min-w-0 flex-[0_1_280px]">
        <Figure value={String(doneTasks)} unit={`/${tasks.length}`} size="sm" className="mb-[14px]" />
        <div className="flex flex-col gap-[6px]">
          {tasks.map((task, i) => (
            <TaskItem key={task.label} label={task.label} done={task.done} onToggle={() => onToggleTask(i)} />
          ))}
        </div>
      </Card>

      <Card label="Từ cần ôn hôm nay" className="min-w-0 flex-[1_1_360px]">
        {shownDueWords.length ? (
          <div className="grid grid-cols-5 gap-[10px]">
            {shownDueWords.map((entry) => (
              <VocabTeaserCard key={entry.id} entry={entry} learned={learned.includes(entry.id)} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--ob-color-text-subtle)]">Không có từ nào cần ôn hôm nay 🎉</p>
        )}
      </Card>

      {dailyGrammar ? <GrammarHighlightCard key={dailyGrammar.id} entry={dailyGrammar} vocab={vocab} /> : null}
    </div>
  )
}

export { StudySummarySection }
