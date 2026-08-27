"use client"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { useT, useLocale } from "@/components/locale-provider"
import { parseGoldPrice, summarizeFinance } from "@/features/finance/finance-calculations"
import { useFinance } from "@/features/finance/hooks/use-finance"
import { useCarGoalFund } from "../hooks/use-car-goal-fund"
import { getGoals } from "../get-goals"
import { GoalCard } from "./goal-card"
import { OverallProgressCard } from "./overall-progress-card"

function GoalsView() {
  const t = useT()
  const { locale } = useLocale()
  const { hidden } = useMoneyVisibility()
  const { savings, cards, gold, goldPrice, invests } = useFinance()
  const { fundName, selectFund } = useCarGoalFund()
  const summary = summarizeFinance({ savings, cards, gold, goldPrice, invests })
  const { goals, avg } = getGoals(
    {
      savingsTotal: summary.savingsTotal,
      goldPhan: summary.goldPhan,
      goldPricePerPhan: parseGoldPrice(goldPrice),
      savings,
      carFundName: fundName,
    },
    hidden,
    t,
    locale
  )

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">
        {t("nav.goals")}
      </h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {t("goals.subtitle", { count: goals.length, avg })}
      </p>
      <div className="ob-card-grid flex flex-wrap gap-5">
        <OverallProgressCard goals={goals} avg={avg} className="min-w-0 basis-full" />
        {goals.map((goal) => (
          <GoalCard
            key={goal.key}
            goal={goal}
            className="min-w-0 flex-[1_1_300px]"
            {...(goal.key === "car"
              ? { savings, selectedFundName: fundName, onSelectFund: selectFund }
              : {})}
          />
        ))}
      </div>
    </div>
  )
}

export { GoalsView }
