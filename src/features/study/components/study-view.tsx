"use client"

import { useState } from "react"

import { Tabs } from "@/components/ob/tabs"
import { dayKey } from "@/lib/date"
import { pickDaily } from "../daily-pick"
import { useStudy } from "../hooks/use-study"
import type { GrammarEntry, VocabEntry } from "../types"
import { GrammarHighlightCard, GrammarListCard } from "./grammar-card"
import { LearnedProgressCard } from "./learned-progress-card"
import { Pomodoro } from "./pomodoro"
import { TasksCard } from "./tasks-card"
import { VocabCard } from "./vocab-card"

const TABS = ["Hôm nay", "Từ vựng", "Ngữ pháp"]

interface StudyViewProps {
  vocab: VocabEntry[]
  grammar: GrammarEntry[]
}

function StudyView({ vocab, grammar }: StudyViewProps) {
  const [tab, setTab] = useState(TABS[0])
  const { tasks, learned, toggleTask, toggleLearned } = useStudy()

  const key = dayKey()
  const daily = pickDaily(vocab, 5, key, "vocab")
  const dailyGrammar = pickDaily(grammar, 1, key, "grammar")[0]

  const done = tasks.filter((t) => t.done).length
  const learnedToday = daily.filter((v) => learned.includes(v.id)).length
  const [day, month] = key.split("-").reverse()

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Học tập</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {done}/{tasks.length} nhiệm vụ · {learnedToday}/5 từ hôm nay · ngày {day}/{month}
      </p>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Hôm nay" ? (
        <div className="ob-card-grid flex flex-wrap gap-5">
          <div className="min-w-0 flex-[1_1_100%]">
            <Pomodoro />
          </div>
          <VocabCard
            label="5 từ vựng hôm nay"
            action={
              <span className="[font-family:var(--ob-font-num)] text-[12.5px] font-bold text-[var(--ob-color-text-subtle)]">
                {learnedToday}/5
              </span>
            }
            intro={`Bốc từ kho ${vocab.length} từ, cố định theo ngày — mai sẽ là bộ khác.`}
            entries={daily}
            learned={learned}
            onToggleLearned={toggleLearned}
            celebrate={learnedToday === 5}
            className="min-w-0 flex-[1_1_100%]"
          />
          {dailyGrammar ? <GrammarHighlightCard entry={dailyGrammar} /> : null}
          <TasksCard tasks={tasks} onToggle={toggleTask} className="min-w-0 flex-[1_1_300px]" />
          <LearnedProgressCard
            learnedCount={learned.length}
            totalCount={vocab.length}
            className="min-w-0 flex-[1_1_300px]"
          />
        </div>
      ) : (
        <div className="ob-card-grid">
          {tab === "Từ vựng" ? (
            <VocabCard
              label={`Kho từ vựng giao tiếp · ${vocab.length} từ`}
              action={
                <span className="text-[12.5px] text-[var(--ob-color-text-subtle)]">
                  Đã học {learned.length}
                </span>
              }
              entries={vocab}
              learned={learned}
              onToggleLearned={toggleLearned}
            />
          ) : (
            <GrammarListCard entries={grammar} />
          )}
        </div>
      )}
    </div>
  )
}

export { StudyView }
