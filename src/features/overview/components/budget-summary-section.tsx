import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { MiniStat } from "./mini-stat"

interface BudgetSummarySectionProps {
  salary: number
  spent: number
  remaining: number
}

function BudgetSummarySection({ salary, spent, remaining }: BudgetSummarySectionProps) {
  const { hidden } = useMoneyVisibility()

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <Card label="Ngân sách tháng này" className="min-w-0 w-full">
        <div className="flex flex-wrap gap-x-4 gap-y-5">
          <MiniStat icon="receipt" label="Lương" value={formatMoney(salary, hidden)} />
          <MiniStat icon="card" label="Đã chi" value={formatMoney(spent, hidden)} />
          <MiniStat
            icon="wallet"
            label={remaining >= 0 ? "Còn dư" : "Đang thiếu"}
            value={formatMoney(Math.abs(remaining), hidden)}
            color={remaining >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)"}
          />
        </div>
      </Card>
    </div>
  )
}

export { BudgetSummarySection }
