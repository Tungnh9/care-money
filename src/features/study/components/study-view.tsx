"use client"

import { useState } from "react"

import { Tabs } from "@/components/ob/tabs"
import { useT } from "@/components/locale-provider"
import { dayKey } from "@/lib/date"
import { pickDaily } from "../daily-pick"
import { useStudy } from "../hooks/use-study"
import type { GrammarEntry, VocabEntry } from "../types"
import { GrammarHighlightCard, GrammarListCard } from "./grammar-card"
import { LearnedProgressCard } from "./learned-progress-card"
import { Pomodoro } from "./pomodoro"
import { TasksCard } from "./tasks-card"
import { VocabCard } from "./vocab-card"

const TAB_KEYS = ["today", "vocab", "grammar"] as const
type TabKey = (typeof TAB_KEYS)[number]

interface StudyViewProps {
  vocab: VocabEntry[]
  grammar: GrammarEntry[]
}

function StudyView({ vocab, grammar }: StudyViewProps) {
  const t = useT()
  const [tabKey, setTabKey] = useState<TabKey>("today")
  const tabLabel: Record<TabKey, string> = {
    today: t("study.tabs.today"),
    vocab: t("study.tabs.vocab"),
    grammar: t("study.tabs.grammar"),
  }
  const { tasks, learned, toggleTask, toggleLearned } = useStudy()

  const key = dayKey()
  const daily = pickDaily(vocab, 5, key, "vocab")
  const dailyGrammar = pickDaily(grammar, 1, key, "grammar")[0]

  const done = tasks.filter((task) => task.done).length
  const learnedToday = daily.filter((v) => learned.includes(v.id)).length
  const [day, month] = key.split("-").reverse()

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">
        {t("nav.study")}
      </h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {t("study.subtitle", { done, total: tasks.length, learnedToday, day, month })}
      </p>

      <Tabs
        tabs={TAB_KEYS.map((k) => tabLabel[k])}
        active={tabLabel[tabKey]}
        onChange={(label) => {
          const nextKey = TAB_KEYS.find((k) => tabLabel[k] === label)
          if (nextKey) setTabKey(nextKey)
        }}
      />

      {tabKey === "today" ? (
        <div className="ob-card-grid flex flex-wrap gap-5">
          <div className="min-w-0 flex-[1_1_100%]">
            <Pomodoro />
          </div>
          <VocabCard
            label={t("study.todayVocabLabel")}
            action={
              <span className="[font-family:var(--ob-font-num)] text-[12.5px] font-bold text-[var(--ob-color-text-subtle)]">
                {learnedToday}/5
              </span>
            }
            intro={t("study.vocabIntro", { count: vocab.length })}
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
          {tabKey === "vocab" ? (
            <VocabCard
              label={t("study.vocabBankLabel", { count: vocab.length })}
              action={
                <span className="text-[12.5px] text-[var(--ob-color-text-subtle)]">
                  {t("study.learnedCount", { count: learned.length })}
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
