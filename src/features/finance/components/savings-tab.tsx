import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { SavingsFund } from "../types"
import { AddSavingsFundForm } from "./add-savings-fund-form"

interface SavingsTabProps {
  savings: SavingsFund[]
  onAddSavingsFund: (fund: SavingsFund) => void
}

function SavingsTab({ savings, onAddSavingsFund }: SavingsTabProps) {
  const { hidden } = useMoneyVisibility()
  const savingsTotal = savings.reduce((sum, fund) => sum + fund.amount, 0)

  return (
    <Card label={`Tiết kiệm · ${formatMoney(savingsTotal, hidden)}`}>
      {savings.length ? (
        savings.map((fund) => (
          <div
            key={fund.name}
            className="border-b border-[var(--ob-color-border)] py-[14px] last:border-b-0"
          >
            <div className="mb-2 text-[14px] font-bold">{fund.name}</div>
            <Progress
              value={Math.min((fund.amount / fund.target) * 100, 100)}
              tone="action"
              label={formatMoney(fund.amount, hidden)}
              hint={`trên ${formatMoney(fund.target, hidden)}`}
            />
            {fund.note ? (
              <div className="mt-2 text-[12.5px] text-[var(--ob-color-text-subtle)]">
                {fund.note}
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
          Chưa có quỹ tiết kiệm nào. Thêm quỹ đầu tiên để bắt đầu theo dõi mục tiêu.
        </p>
      )}
      <AddSavingsFundForm onAdd={onAddSavingsFund} />
    </Card>
  )
}

export { SavingsTab }
