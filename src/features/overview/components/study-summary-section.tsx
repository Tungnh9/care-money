import Image from "next/image"
import { Check, ImageIcon } from "lucide-react"

import { pickDaily } from "@/features/study/daily-pick"
import { GrammarHighlightCard } from "@/features/study/components/grammar-card"
import type { GrammarEntry, Task, VocabEntry } from "@/features/study/types"
import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { TaskItem } from "@/components/ob/task-item"
import { dayKey } from "@/lib/date"
import { cn } from "@/lib/utils"

interface StudySummarySectionProps {
  vocab: VocabEntry[]
  grammar: GrammarEntry[]
  tasks: Task[]
  onToggleTask: (index: number) => void
  learned: string[]
}

function VocabTeaserCard({ entry, learned }: { entry: VocabEntry; learned: boolean }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--ob-radius-sm)] bg-[var(--ob-color-surface-sunken)]">
        {entry.image ? (
          <Image src={entry.image} alt={entry.word} fill sizes="120px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--ob-color-action-soft)] to-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-subtle)]">
            <ImageIcon size={18} strokeWidth={1.5} />
          </div>
        )}
        {learned ? (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-[var(--ob-color-income)] text-white">
            <Check size={10} />
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "truncate text-[12.5px] font-bold",
            learned ? "text-[var(--ob-color-text-subtle)] line-through" : "text-[var(--ob-color-text)]"
          )}
        >
          {entry.word}
        </div>
        <div className="truncate text-[11px] text-[var(--ob-color-text-subtle)]">{entry.meaning}</div>
      </div>
    </div>
  )
}

function StudySummarySection({ vocab, grammar, tasks, onToggleTask, learned }: StudySummarySectionProps) {
  const key = dayKey()
  const daily = pickDaily(vocab, 5, key, "vocab")
  const dailyGrammar = pickDaily(grammar, 1, key, "grammar")[0]
  const doneTasks = tasks.filter((task) => task.done).length

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <Card label="Nhiệm vụ hôm nay" className="min-w-0 flex-[1_1_280px]">
        <Figure value={String(doneTasks)} unit={`/${tasks.length}`} size="sm" className="mb-[14px]" />
        <div className="flex flex-col gap-[6px]">
          {tasks.map((task, i) => (
            <TaskItem key={task.label} label={task.label} done={task.done} onToggle={() => onToggleTask(i)} />
          ))}
        </div>
      </Card>

      <Card label="5 từ hôm nay" className="min-w-0 flex-[1_1_280px]">
        <div className="grid grid-cols-5 gap-[10px]">
          {daily.map((entry) => (
            <VocabTeaserCard key={entry.id} entry={entry} learned={learned.includes(entry.id)} />
          ))}
        </div>
      </Card>

      {dailyGrammar ? <GrammarHighlightCard entry={dailyGrammar} /> : null}
    </div>
  )
}

export { StudySummarySection }
