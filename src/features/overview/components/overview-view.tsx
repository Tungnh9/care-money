"use client"

import { useEffect } from "react"

import { summarizeFinance } from "@/features/finance/finance-calculations"
import { useFinance } from "@/features/finance/hooks/use-finance"
import { getGoals, useCarGoalFund } from "@/features/goals"
import { useJournal } from "@/features/journal/hooks/use-journal"
import { useBudget } from "@/features/budget/hooks/use-budget"
import { remainingToSettle, salaryForMonth, totalExpensesForMonth } from "@/features/budget/budget-calculations"
import { useStudy } from "@/features/study/hooks/use-study"
import { ensureReviewStates, getDueWords } from "@/features/study/srs-calculations"
import type { GrammarEntry, VocabEntry } from "@/features/study/types"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { Monkey } from "@/components/ob/monkey"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { dayKey, longDate, monthKey } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { useNetWorthHistory } from "../hooks/use-net-worth-history"
import {
  detectMoodSpendingCorrelation,
  detectSpendingAnomaly,
  detectTagAnomaly,
  forecastSavingsGoal,
  type Insight,
} from "../insights-calculations"
import { splitGreeting } from "../overview-calculations"
import { BudgetSummarySection } from "./budget-summary-section"
import { FinanceSummarySection } from "./finance-summary-section"
import { GoalsSummarySection } from "./goals-summary-section"
import { InsightsSection } from "./insights-section"
import { JournalSummarySection } from "./journal-summary-section"
import { SectionHead } from "./section-head"
import { StudySummarySection } from "./study-summary-section"

interface OverviewViewProps {
  vocab: VocabEntry[]
  grammar: GrammarEntry[]
}

function OverviewView({ vocab, grammar }: OverviewViewProps) {
  const { hidden } = useMoneyVisibility()
  const { settings, dismissInsight } = useSettings()
  const { savings, cards, gold, goldStores, invests } = useFinance()
  const { entries } = useJournal()
  const { salaries, expenses, settlements } = useBudget()
  const { tasks, toggleTask, learned, wordReviews } = useStudy()
  const { fundName } = useCarGoalFund()

  function enabled(key: string): boolean {
    return settings.modules.find((m) => m.key === key)?.on ?? true
  }

  const summary = summarizeFinance({ savings, cards, gold, goldStores, invests })

  const currentMonth = monthKey()
  const monthSalary = salaryForMonth(salaries, currentMonth)
  const monthSpent = totalExpensesForMonth(expenses, currentMonth)
  const monthRemaining = remainingToSettle(salaries, expenses, settlements, currentMonth)

  // Đúng với cách trang Học tập tính "từ cần ôn" — không dùng pickDaily/learnedToday nữa, vì
  // 2 trang phải khớp cùng 1 khái niệm "hôm nay cần ôn từ nào" thay vì mỗi nơi tính 1 kiểu.
  const dueWords = getDueWords(ensureReviewStates(wordReviews, vocab, learned, dayKey()), vocab, dayKey())

  // Nhiều cửa hàng nay có nhiều giá khác nhau — dùng giá bình quân theo tỷ trọng vàng
  // đang giữ (goldValue/goldPhan) làm đại diện, thay vì 1 giá chung duy nhất như trước.
  const goldPricePerPhan = summary.goldPhan > 0 ? summary.goldValue / summary.goldPhan : 0
  const { goals, avg: avgGoal } = getGoals(
    {
      savingsTotal: summary.savingsTotal,
      goldPhan: summary.goldPhan,
      goldPricePerPhan,
      savings,
      carFundName: fundName,
    },
    hidden
  )

  const { history: netWorthHistory, recordSnapshot } = useNetWorthHistory()

  useEffect(() => {
    recordSnapshot(summary.net, summary.savingsTotal)
  }, [recordSnapshot, summary.net, summary.savingsTotal])

  const today = dayKey()
  const savingsGoal = goals.find((g) => g.key === "savings")
  const insights: Insight[] = [
    enabled("chitieu") ? detectSpendingAnomaly(expenses, currentMonth, today) : null,
    enabled("chitieu") ? detectTagAnomaly(expenses, currentMonth, today) : null,
    enabled("chitieu") && enabled("nhatky") && enabled("tamtrang")
      ? detectMoodSpendingCorrelation(expenses, entries, today)
      : null,
    enabled("muctieu") && savingsGoal ? forecastSavingsGoal(netWorthHistory, savingsGoal.target, today) : null,
  ]
    .filter((i): i is Insight => i !== null)
    .filter((i) => !settings.dismissedInsights.includes(i.id))

  const greeting = splitGreeting(settings.profile.greeting, settings.profile.displayName)

  return (
    <div>
      <div className="mb-5 flex items-center gap-[14px]">
        <Monkey pose="wave" size={56} />
        <div>
          <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">
            {greeting.prefix}
            {greeting.name ? (
              <>
                , <span className="ob-hi">{greeting.name}</span>
              </>
            ) : null}
          </h1>
          <p className="text-sm text-[var(--ob-color-text-subtle)]">{longDate()}</p>
        </div>
      </div>

      <InsightsSection insights={insights} onDismiss={dismissInsight} />

      {enabled("taichinh") ? (
        <>
          <SectionHead
            icon="wallet"
            title="Tài chính"
            hint={`tài sản ròng ${formatMoney(summary.net, hidden)}`}
            href="/finance"
          />
          <FinanceSummarySection savings={savings} cards={cards} invests={invests} summary={summary} />
        </>
      ) : null}

      {enabled("chitieu") ? (
        <>
          <SectionHead
            icon="card"
            title="Chi tiêu"
            hint={
              monthRemaining >= 0
                ? `dư ${formatMoney(monthRemaining, hidden)}`
                : `thiếu ${formatMoney(Math.abs(monthRemaining), hidden)}`
            }
            href="/budget"
          />
          <BudgetSummarySection salary={monthSalary} spent={monthSpent} remaining={monthRemaining} />
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
          <JournalSummarySection entries={entries} />
        </>
      ) : null}

      {enabled("hoctap") ? (
        <>
          <SectionHead icon="cap" title="Học tập" hint={`${dueWords.length} từ cần ôn`} href="/study" />
          <StudySummarySection
            vocab={vocab}
            grammar={grammar}
            tasks={tasks}
            onToggleTask={toggleTask}
            learned={learned}
            dueWords={dueWords}
          />
        </>
      ) : null}

      {enabled("muctieu") ? (
        <>
          <SectionHead icon="target" title="Mục tiêu" hint={`trung bình ${avgGoal}%`} href="/goals" />
          <GoalsSummarySection goals={goals} savings={savings} />
        </>
      ) : null}
    </div>
  )
}

export { OverviewView }
