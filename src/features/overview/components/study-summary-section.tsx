import { Check, Circle } from "lucide-react"

import { GrammarHighlightCard } from "@/features/study/components/grammar-card"
import { pickDaily } from "@/features/study/daily-pick"
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

function VocabTeaserRow({ entry, learned }: { entry: VocabEntry; learned: boolean }) {
  return (
    <div className="flex items-start gap-[10px]">
      <span
        className={cn(
          "flex size-4 flex-none items-center justify-center",
          learned ? "text-[var(--ob-color-income)]" : "text-[var(--ob-color-border-strong)]"
        )}
      >
        {learned ? <Check size={14} /> : <Circle size={14} />}
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-[1.6] text-[var(--ob-color-text-subtle)]">
        <span
          className={cn(
            "text-sm font-bold",
            learned ? "text-[var(--ob-color-text-subtle)] line-through" : "text-[var(--ob-color-text)]"
          )}
        >
          {entry.word}
        </span>{" "}
        – {entry.meaning}
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
      <Card label="Nhiệm vụ hôm nay">
        <Figure value={String(doneTasks)} unit={`/${tasks.length}`} size="sm" className="mb-[14px]" />
        <div className="flex flex-col gap-[6px]">
          {tasks.map((task, i) => (
            <TaskItem key={task.label} label={task.label} done={task.done} onToggle={() => onToggleTask(i)} />
          ))}
        </div>
      </Card>

      <Card label="5 từ hôm nay">
        <div className="flex flex-col gap-[9px]">
          {daily.map((entry) => (
            <VocabTeaserRow key={entry.id} entry={entry} learned={learned.includes(entry.id)} />
          ))}
        </div>
      </Card>

      {dailyGrammar ? <GrammarHighlightCard entry={dailyGrammar} /> : null}
    </div>
  )
}

export { StudySummarySection }
