"use client"

import { summarizeFinance } from "@/features/finance/finance-calculations"
import { useFinance } from "@/features/finance/hooks/use-finance"
import { getGoals, useCarGoalFund } from "@/features/goals"
import { useJournal } from "@/features/journal/hooks/use-journal"
import { useBudget } from "@/features/budget/hooks/use-budget"
import { remainingToSettle, salaryForMonth, totalExpensesForMonth } from "@/features/budget/budget-calculations"
import { pickDaily } from "@/features/study/daily-pick"
import { useStudy } from "@/features/study/hooks/use-study"
import type { GrammarEntry, VocabEntry } from "@/features/study/types"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { Monkey } from "@/components/ob/monkey"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { dayKey, longDate, monthKey } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { splitGreeting } from "../overview-calculations"
import { BudgetSummarySection } from "./budget-summary-section"
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
  const { savings, cards, gold, goldStores, invests } = useFinance()
  const { entries } = useJournal()
  const { salaries, expenses, settlements } = useBudget()
  const { tasks, toggleTask, learned } = useStudy()
  const { fundName } = useCarGoalFund()

  function enabled(key: string): boolean {
    return settings.modules.find((m) => m.key === key)?.on ?? true
  }

  const summary = summarizeFinance({ savings, cards, gold, goldStores, invests })

  const currentMonth = monthKey()
  const monthSalary = salaryForMonth(salaries, currentMonth)
  const monthSpent = totalExpensesForMonth(expenses, currentMonth)
  const monthRemaining = remainingToSettle(salaries, expenses, settlements, currentMonth)

  const daily = pickDaily(vocab, 5, dayKey(), "vocab")
  const learnedToday = daily.filter((entry) => learned.includes(entry.id)).length

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
          <GoalsSummarySection goals={goals} savings={savings} />
        </>
      ) : null}
    </div>
  )
}

export { OverviewView }
