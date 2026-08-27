import Image from "next/image"

import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { useT, useLocale } from "@/components/locale-provider"
import type { Locale } from "@/lib/i18n"
import { formatMoney } from "@/lib/format"
import { pct1 } from "../finance-calculations"
import type { Investment } from "../types"
import { AddInvestForm } from "./add-invest-form"

interface InvestmentsTabProps {
  invests: Investment[]
  onAddInvest: (invest: Omit<Investment, "id">) => void
}

function signedMoney(n: number, hidden: boolean, locale: Locale): string {
  return (n >= 0 ? "+ " : "− ") + formatMoney(Math.abs(n), hidden, locale)
}

function InvestmentsTab({ invests, onAddInvest }: InvestmentsTabProps) {
  const t = useT()
  const { locale } = useLocale()
  const { hidden } = useMoneyVisibility()
  const investCost = invests.reduce((sum, invest) => sum + invest.cost, 0)
  const investValue = invests.reduce((sum, invest) => sum + invest.value, 0)
  const investPL = investValue - investCost
  const investPct = investCost > 0 ? (investPL / investCost) * 100 : 0
  const gain = investPL >= 0

  return (
    <Card label={t("finance.invest.portfolio")}>
      {invests.length ? (
        <>
          <div className="mb-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="mb-[5px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {t("finance.invest.currentValue")}
              </div>
              <Figure value={formatMoney(investValue, hidden, locale)} />
            </div>
            <div>
              <div className="mb-[5px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {t("finance.invest.pl")}
              </div>
              <div
                className="whitespace-nowrap text-[15px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
                style={{ color: gain ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
              >
                {signedMoney(investPL, hidden, locale)} · {pct1(investPct, locale)}
              </div>
            </div>
          </div>

          {invests.map((investment) => {
            const pl = investment.value - investment.cost
            return (
              <div
                key={investment.id}
                className="flex flex-wrap items-center gap-3.5 border-t border-[var(--ob-color-border)] py-[13px]"
              >
                <span className="flex size-9 flex-none items-center justify-center rounded-[var(--ob-radius-md)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]">
                  <Image src="/assets/icons/chart.svg" width={20} height={20} alt="" />
                </span>
                <span className="min-w-[160px] flex-1 text-[14px] font-bold">
                  {investment.name}
                </span>
                <span className="whitespace-nowrap text-[13px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-subtle)]">
                  {t("finance.invest.costPrefix", { amount: formatMoney(investment.cost, hidden, locale) })}
                </span>
                <span className="whitespace-nowrap text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(investment.value, hidden, locale)}
                </span>
                <span
                  className="whitespace-nowrap text-[13px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
                  style={{ color: pl >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                >
                  {signedMoney(pl, hidden, locale)}
                </span>
              </div>
            )
          })}
        </>
      ) : (
        <div>
          <Figure value={formatMoney(0, hidden, locale)} />
          <p className="mt-[10px] text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            {t("finance.invest.empty")}
          </p>
        </div>
      )}
      <AddInvestForm onAdd={onAddInvest} />
    </Card>
  )
}

export { InvestmentsTab }
