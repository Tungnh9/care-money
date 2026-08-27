"use client"

import type { FinanceSummary } from "@/features/finance/finance-calculations"
import type { CreditCard, Investment, SavingsFund } from "@/features/finance/types"
import { Card } from "@/components/ui/card"
import { NetWorthCard } from "@/components/ob/net-worth-card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { useT, useLocale } from "@/components/locale-provider"
import { formatMoney } from "@/lib/format"
import { MiniStat } from "./mini-stat"

interface FinanceSummarySectionProps {
  savings: SavingsFund[]
  cards: CreditCard[]
  invests: Investment[]
  summary: FinanceSummary
}

function FinanceSummarySection({ savings, cards, invests, summary }: FinanceSummarySectionProps) {
  const t = useT()
  const { locale } = useLocale()
  const { hidden } = useMoneyVisibility()

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <div className="min-w-0 flex-[1_1_300px]">
        <NetWorthCard summary={summary} />
      </div>
      <Card label={t("overview.assetsAvailable")} className="min-w-0 flex-[2_1_460px]">
        <div className="flex flex-wrap gap-x-4 gap-y-5">
          <MiniStat
            icon="pig"
            label={t("netWorth.savings")}
            value={formatMoney(summary.savingsTotal, hidden, locale)}
            hint={
              savings.length
                ? t("overview.fundsCount", { count: savings.length })
                : t("overview.noFund")
            }
          />
          <MiniStat
            icon="gold"
            label={t("netWorth.gold")}
            value={formatMoney(summary.goldValue, hidden, locale)}
            hint={
              summary.goldPhan ? (
                <>
                  {summary.goldPhan} {t("common.goldUnit")} ·{" "}
                  <span
                    className="font-bold"
                    style={{
                      color: summary.goldPL >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)",
                    }}
                  >
                    {summary.goldPL >= 0 ? t("overview.profit") : t("overview.loss")}
                    {formatMoney(Math.abs(summary.goldPL), hidden, locale)}
                  </span>
                </>
              ) : (
                t("overview.noGold")
              )
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
            label={t("netWorth.invest")}
            value={formatMoney(summary.investValue, hidden, locale)}
            hint={
              invests.length
                ? t("overview.investCount", { count: invests.length })
                : t("overview.noInvestments")
            }
          />
          <MiniStat
            icon="card"
            label={t("netWorth.debt")}
            value={formatMoney(summary.debtTotal, hidden, locale)}
            hint={cards.length ? t("overview.dueDate", { date: cards[0].due }) : t("overview.noDebt")}
            color={summary.debtTotal ? "var(--ob-color-expense)" : undefined}
          />
        </div>
      </Card>
    </div>
  )
}

export { FinanceSummarySection }
