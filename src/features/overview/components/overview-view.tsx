"use client"

import { summarizeFinance } from "@/features/finance/finance-calculations"
import { useFinance } from "@/features/finance/hooks/use-finance"
import { useJournal } from "@/features/journal/hooks/use-journal"
import { pickDaily } from "@/features/study/daily-pick"
import { useStudy } from "@/features/study/hooks/use-study"
import type { GrammarEntry, VocabEntry } from "@/features/study/types"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { Monkey } from "@/components/ob/monkey"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { dayKey, longDate } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { daysLeftInCycle, getMiniGoals } from "../overview-calculations"
import { FinanceSummarySection } from "./finance-summary-section"
import { GoalsSummarySection } from "./goals-summary-section"
import { JournalSummarySection } from "./journal-summary-section"
import { SectionHead } from "./section-head"
import { StudySummarySection } from "./study-summary-section"

interface OverviewViewProps {
  vocab: VocabEntry[]
  grammar: GrammarEntry[]
}

function OverviewView({ vocab, grammar }: OverviewViewProps) {
  const { hidden } = useMoneyVisibility()
  const { settings } = useSettings()
  const { savings, cards, gold, goldPrice, invests } = useFinance()
  const { entries, streak } = useJournal()
  const { tasks, toggleTask, learned } = useStudy()

  function enabled(key: string): boolean {
    return settings.modules.find((m) => m.key === key)?.on ?? true
  }

  const summary = summarizeFinance({ savings, cards, gold, goldPrice, invests })

  const daily = pickDaily(vocab, 5, dayKey(), "vocab")
  const learnedToday = daily.filter((entry) => learned.includes(entry.id)).length

  const miniGoals = getMiniGoals({
    savingsTotal: summary.savingsTotal,
    goldPhan: summary.goldPhan,
    streak,
  })
  const avgGoal = Math.round(miniGoals.reduce((sum, g) => sum + g.percent, 0) / miniGoals.length)

  return (
    <div>
      <div className="mb-5 flex items-center gap-[14px]">
        <Monkey pose="wave" size={56} />
        <div>
          <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">
            <span className="ob-hi">{settings.profile.greeting}</span>
          </h1>
          <p className="text-sm text-[var(--ob-color-text-subtle)]">
            {longDate()} · còn {daysLeftInCycle(settings.budget.cycleStart)} ngày trong chu kỳ ngân sách
          </p>
        </div>
      </div>

      {enabled("taichinh") ? (
        <>
          <SectionHead
            icon="wallet"
            title="Tài chính"
            hint={`tài sản ròng ${formatMoney(summary.net, hidden)}`}
            href="/finance"
          />
          <FinanceSummarySection
            budget={settings.budget}
            savings={savings}
            cards={cards}
            invests={invests}
            summary={summary}
          />
        </>
      ) : null}

      {enabled("nhatky") ? (
        <>
          <SectionHead
            icon="book"
            title="Nhật ký"
            hint={entries.length ? `${entries.length} bài đã viết` : "chưa có bài nào"}
            href="/journal"
          />
          <JournalSummarySection entries={entries} streak={streak} showStreak={enabled("chuoingay")} />
        </>
      ) : null}

      {enabled("hoctap") ? (
        <>
          <SectionHead icon="cap" title="Học tập" hint={`${learnedToday}/5 từ hôm nay`} href="/study" />
          <StudySummarySection
            vocab={vocab}
            grammar={grammar}
            tasks={tasks}
            onToggleTask={toggleTask}
            learned={learned}
          />
        </>
      ) : null}

      {enabled("muctieu") ? (
        <>
          <SectionHead icon="target" title="Mục tiêu" hint={`trung bình ${avgGoal}%`} href="/goals" />
          <GoalsSummarySection goals={miniGoals} savings={savings} />
        </>
      ) : null}
    </div>
  )
}

export { OverviewView }
