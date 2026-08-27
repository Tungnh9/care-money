"use client"

import Image from "next/image"

import type { SavingsFund } from "@/features/finance/types"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { useT, useLocale } from "@/components/locale-provider"
import { formatMoney } from "@/lib/format"
import type { MiniGoal } from "../overview-calculations"

interface GoalsSummarySectionProps {
  goals: MiniGoal[]
  savings: SavingsFund[]
}

function GoalsSummarySection({ goals, savings }: GoalsSummarySectionProps) {
  const t = useT()
  const { locale } = useLocale()
  const { hidden } = useMoneyVisibility()
  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <Card
        label={t("overview.goals.runningCount", { count: goals.length })}
        className="min-w-0 flex-[2_1_460px]"
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-[18px] md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
          {goals.map((goal) => (
            <div key={goal.name}>
              <div className="mb-2 flex flex-wrap items-center gap-[9px]">
                <Image src={`/assets/icons/${goal.icon}.svg`} width={17} height={17} alt="" />
                <span className="min-w-0 flex-1 text-[13.5px] font-semibold">{goal.name}</span>
                <span
                  className="[font-family:var(--ob-font-num)] text-[12.5px] font-bold"
                  style={{
                    color: goal.percent >= 100 ? "var(--ob-color-income)" : "var(--ob-color-text-subtle)",
                  }}
                >
                  {goal.percent}%
                </span>
              </div>
              <Progress value={goal.percent} tone={goal.percent >= 100 ? "action" : "reward"} />
            </div>
          ))}
        </div>
      </Card>
      <Card label={t("overview.goals.savingsFunds")} className="min-w-0 flex-[1_1_280px]">
        {savings.length ? (
          <div className="flex flex-col gap-4">
            {savings.map((fund) => (
              <div key={fund.name}>
                <div className="mb-[7px] flex flex-wrap justify-between gap-3 text-[13.5px] font-semibold">
                  <span>{fund.name}</span>
                  <span className="[font-family:var(--ob-font-num)] text-[12.5px] text-[var(--ob-color-text-subtle)]">
                    {formatMoney(fund.amount, hidden, locale)} / {formatMoney(fund.target, hidden, locale)}
                  </span>
                </div>
                <Progress value={Math.round((fund.amount / fund.target) * 100)} tone="action" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">
            {t("overview.goals.noFunds")}
          </p>
        )}
      </Card>
    </div>
  )
}

export { GoalsSummarySection }
