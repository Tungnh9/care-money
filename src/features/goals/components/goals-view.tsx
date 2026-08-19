"use client"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { parseGoldPrice, summarizeFinance } from "@/features/finance/finance-calculations"
import { useFinance } from "@/features/finance/hooks/use-finance"
import { getGoals } from "../get-goals"
import { GoalCard } from "./goal-card"
import { OverallProgressCard } from "./overall-progress-card"

function GoalsView() {
  const { hidden } = useMoneyVisibility()
  const { savings, cards, gold, goldPrice, invests } = useFinance()
  const summary = summarizeFinance({ savings, cards, gold, goldPrice, invests })
  const { goals, avg } = getGoals(
    {
      savingsTotal: summary.savingsTotal,
      goldPhan: summary.goldPhan,
      goldPricePerPhan: parseGoldPrice(goldPrice),
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
          <GoalCard key={goal.key} goal={goal} className="min-w-0 flex-[1_1_300px]" />
        ))}
      </div>
    </div>
  )
}

export { GoalsView }
