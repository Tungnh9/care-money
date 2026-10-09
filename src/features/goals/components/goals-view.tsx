"use client"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { goldReferencePricePerPhan, summarizeFinance } from "@/lib/finance/finance-calculations"
import { useFinance } from "@/lib/finance/use-finance"
import { useCarGoalFund } from "@/lib/goals/use-car-goal-fund"
import { getGoals } from "@/lib/goals/get-goals"
import { GoalCard } from "./goal-card"
import { OverallProgressCard } from "./overall-progress-card"

function GoalsView() {
  const { hidden } = useMoneyVisibility()
  const { savings, cards, gold, goldStores, invests } = useFinance()
  const { fundName, selectFund } = useCarGoalFund()
  const summary = summarizeFinance({ savings, cards, gold, goldStores, invests })
  const goldPricePerPhan = goldReferencePricePerPhan(summary, goldStores)
  const { goals, avg } = getGoals(
    {
      savingsTotal: summary.savingsTotal,
      goldPhan: summary.goldPhan,
      goldPricePerPhan,
      savings,
      carFundName: fundName,
    },
    hidden
  )

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Mục tiêu</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {goals.length} mục tiêu đang chạy · hoàn thành trung bình {avg}%
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
