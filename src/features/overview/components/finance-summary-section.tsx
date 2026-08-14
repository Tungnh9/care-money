import type { FinanceSummary } from "@/features/finance/finance-calculations"
import type { CreditCard, Investment, SavingsFund } from "@/features/finance/types"
import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { Progress } from "@/components/ui/progress"
import { formatMoney } from "@/lib/format"
import type { Budget } from "@/lib/settings-storage"
import { daysLeftInCycle, monthLabel } from "../overview-calculations"
import { MiniStat } from "./mini-stat"

function parseBudgetAmount(amount: string): number {
  const digits = amount.replace(/\D/g, "")
  return digits ? Number(digits) : 0
}

interface FinanceSummarySectionProps {
  budget: Budget
  savings: SavingsFund[]
  cards: CreditCard[]
  invests: Investment[]
  summary: FinanceSummary
}

function FinanceSummarySection({
  budget,
  savings,
  cards,
  invests,
  summary,
}: FinanceSummarySectionProps) {
  // Chưa có tính năng ghi chi tiêu (expense tracking) trong app — spent tạm để 0,
  // rơi đúng vào nhánh zero-state ("chưa có chi tiêu nào tháng này") bản gốc đã có sẵn.
  const spent = 0
  const budgetAmount = parseBudgetAmount(budget.amount)
  const pct = budgetAmount ? Math.round((spent / budgetAmount) * 100) : 0
  const cycleLeft = daysLeftInCycle(budget.cycleStart)

  return (
    <div className="flex flex-wrap gap-5">
      <Card tone="invert" label={`Số dư ${monthLabel()}`} className="min-w-0 flex-[1_1_300px]">
        <Figure value={formatMoney(budgetAmount - spent)} caption="chưa có chi tiêu nào tháng này" />
        <Progress
          value={pct}
          label={`Đã dùng ${pct}% ngân sách`}
          hint={`Còn ${cycleLeft} ngày`}
          track="var(--ob-vo-700)"
          className="mt-5"
        />
      </Card>
      <Card label="Tài sản đang có" className="min-w-0 flex-[2_1_460px]">
        <div className="flex flex-wrap gap-x-4 gap-y-5">
          <MiniStat
            icon="pig"
            label="Tiết kiệm"
            value={formatMoney(summary.savingsTotal)}
            hint={savings.length ? `${savings.length} quỹ` : "chưa có quỹ"}
          />
          <MiniStat
            icon="gold"
            label="Vàng"
            value={formatMoney(summary.goldValue)}
            hint={
              summary.goldPhan
                ? `${summary.goldPhan} phân · ${summary.goldPL >= 0 ? "lời " : "lỗ "}${formatMoney(Math.abs(summary.goldPL))}`
                : "chưa có"
            }
            color={
              summary.goldPhan
                ? summary.goldPL >= 0
                  ? "var(--ob-color-income)"
                  : "var(--ob-color-expense)"
                : undefined
            }
          />
          <MiniStat
            icon="chart"
            label="Đầu tư"
            value={formatMoney(summary.investValue)}
            hint={invests.length ? `${invests.length} khoản` : "chưa có khoản nào"}
          />
          <MiniStat
            icon="card"
            label="Nợ thẻ"
            value={formatMoney(summary.debtTotal)}
            hint={cards.length ? `hạn ${cards[0].due}` : "không nợ"}
            color={summary.debtTotal ? "var(--ob-color-expense)" : undefined}
          />
        </div>
      </Card>
    </div>
  )
}

export { FinanceSummarySection }
