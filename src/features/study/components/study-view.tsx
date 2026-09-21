"use client"

import { useState } from "react"

import { Tabs } from "@/components/ob/tabs"
import { dayKey } from "@/lib/date"
import { pickDaily } from "../daily-pick"
import { ensureReviewStates, getDueWords } from "../srs-calculations"
import { useStudy } from "../hooks/use-study"
import type { GrammarEntry, VocabEntry } from "../types"
import { GameTab } from "./games/game-tab"
import { GrammarHighlightCard, GrammarListCard } from "./grammar-card"
import { LearnedProgressCard } from "./learned-progress-card"
import { Pomodoro } from "./pomodoro"
import { ReviewDueCard } from "./review-due-card"
import { TasksCard } from "./tasks-card"
import { VocabCard } from "./vocab-card"

const TABS = ["Hôm nay", "Từ vựng", "Ngữ pháp", "Trò chơi"]

interface StudyViewProps {
  vocab: VocabEntry[]
  grammar: GrammarEntry[]
}

function StudyView({ vocab, grammar }: StudyViewProps) {
  const [tab, setTab] = useState(TABS[0])
  const {
    tasks,
    learned,
    toggleTask,
    toggleLearned,
    gameHighScores,
    gameStreak,
    recordGameResult,
    wordReviews,
    gradeWord,
  } = useStudy()

  const key = dayKey()
  const dailyGrammar = pickDaily(grammar, 1, key, "grammar")[0]
  const dueWords = getDueWords(ensureReviewStates(wordReviews, vocab, learned, key), vocab, key)

  const done = tasks.filter((t) => t.done).length
  const [day, month] = key.split("-").reverse()

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Học tập</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {done}/{tasks.length} nhiệm vụ · {dueWords.length} từ cần ôn · ngày {day}/{month}
      </p>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Hôm nay" ? (
        <div className="ob-card-grid flex flex-wrap gap-5">
          <div className="min-w-0 flex-[1_1_100%]">
            <Pomodoro />
          </div>
          <ReviewDueCard dueWords={dueWords} onGrade={gradeWord} className="min-w-0 flex-[1_1_100%]" />
          {dailyGrammar ? <GrammarHighlightCard key={dailyGrammar.id} entry={dailyGrammar} vocab={vocab} /> : null}
          <TasksCard tasks={tasks} onToggle={toggleTask} className="min-w-0 flex-[1_1_300px]" />
          <LearnedProgressCard
            learnedCount={learned.length}
            totalCount={vocab.length}
            className="min-w-0 flex-[1_1_300px]"
          />
        </div>
      ) : tab === "Trò chơi" ? (
        <div className="ob-card-grid">
          <GameTab
            vocab={vocab}
            highScores={gameHighScores}
            streak={gameStreak}
            onFinish={recordGameResult}
            onWordReviewed={(wordId, correct) => gradeWord(wordId, correct ? "good" : "again")}
          />
        </div>
      ) : (
        <div className="ob-card-grid">
          {tab === "Từ vựng" ? (
            <VocabCard
              label={`Kho từ vựng giao tiếp · ${vocab.length} từ`}
              action={
                <span className="text-[12.5px] text-[var(--ob-color-text-subtle)]">Đã học {learned.length}</span>
              }
              entries={vocab}
              learned={learned}
              onToggleLearned={toggleLearned}
            />
          ) : (
            <GrammarListCard entries={grammar} vocab={vocab} />
          )}
        </div>
      )}
    </div>
  )
}

export { StudyView }
