import type { FinanceSummary } from "@/features/finance/finance-calculations"
import type { CreditCard, Investment, SavingsFund } from "@/features/finance/types"
import { Card } from "@/components/ui/card"
import { NetWorthCard } from "@/components/ob/net-worth-card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { MiniStat } from "./mini-stat"

interface FinanceSummarySectionProps {
  savings: SavingsFund[]
  cards: CreditCard[]
  invests: Investment[]
  summary: FinanceSummary
}

function FinanceSummarySection({ savings, cards, invests, summary }: FinanceSummarySectionProps) {
  const { hidden } = useMoneyVisibility()

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <div className="min-w-0 flex-[1_1_300px]">
        <NetWorthCard summary={summary} />
      </div>
      <Card label="Tài sản đang có" className="min-w-0 flex-[2_1_460px]">
        <div className="flex flex-wrap gap-x-4 gap-y-5">
          <MiniStat
            icon="pig"
            label="Tiết kiệm"
            value={formatMoney(summary.savingsTotal, hidden)}
            hint={savings.length ? `${savings.length} quỹ` : "chưa có quỹ"}
          />
          <MiniStat
            icon="gold"
            label="Vàng"
            value={formatMoney(summary.goldValue, hidden)}
            hint={
              summary.goldPhan
                ? `${summary.goldPhan} phân · ${summary.goldPL >= 0 ? "lời " : "lỗ "}${formatMoney(Math.abs(summary.goldPL), hidden)}`
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
            value={formatMoney(summary.investValue, hidden)}
            hint={invests.length ? `${invests.length} khoản` : "chưa có khoản nào"}
          />
          <MiniStat
            icon="card"
            label="Nợ thẻ"
            value={formatMoney(summary.debtTotal, hidden)}
            hint={cards.length ? `hạn ${cards[0].due}` : "không nợ"}
            color={summary.debtTotal ? "var(--ob-color-expense)" : undefined}
          />
        </div>
      </Card>
    </div>
  )
}

export { FinanceSummarySection }
