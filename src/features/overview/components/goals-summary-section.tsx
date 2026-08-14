import Image from "next/image"

import type { SavingsFund } from "@/features/finance/types"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatMoney } from "@/lib/format"
import type { MiniGoal } from "../overview-calculations"

interface GoalsSummarySectionProps {
  goals: MiniGoal[]
  savings: SavingsFund[]
}

function GoalsSummarySection({ goals, savings }: GoalsSummarySectionProps) {
  return (
    <div className="flex flex-wrap gap-5">
      <Card label="Bốn mục tiêu đang chạy" className="min-w-0 flex-[2_1_460px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-[18px]">
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
      <Card label="Quỹ tiết kiệm" className="min-w-0 flex-[1_1_280px]">
        {savings.length ? (
          <div className="flex flex-col gap-4">
            {savings.map((fund) => (
              <div key={fund.name}>
                <div className="mb-[7px] flex flex-wrap justify-between gap-3 text-[13.5px] font-semibold">
                  <span>{fund.name}</span>
                  <span className="[font-family:var(--ob-font-num)] text-[12.5px] text-[var(--ob-color-text-subtle)]">
                    {formatMoney(fund.amount)} / {formatMoney(fund.target)}
                  </span>
                </div>
                <Progress value={Math.round((fund.amount / fund.target) * 100)} tone="action" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">
            Chưa có quỹ tiết kiệm nào. Thêm ở màn Tài chính.
          </p>
        )}
      </Card>
    </div>
  )
}

export { GoalsSummarySection }
