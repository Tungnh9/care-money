import Image from "next/image"

import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { pct1 } from "../finance-calculations"
import type { Investment } from "../types"
import { AddInvestForm } from "./add-invest-form"

interface InvestmentsTabProps {
  invests: Investment[]
  onAddInvest: (invest: Omit<Investment, "id">) => void
}

function signedMoney(n: number, hidden: boolean): string {
  return (n >= 0 ? "+ " : "− ") + formatMoney(Math.abs(n), hidden)
}

function InvestmentsTab({ invests, onAddInvest }: InvestmentsTabProps) {
  const { hidden } = useMoneyVisibility()
  const investCost = invests.reduce((sum, invest) => sum + invest.cost, 0)
  const investValue = invests.reduce((sum, invest) => sum + invest.value, 0)
  const investPL = investValue - investCost
  const investPct = investCost > 0 ? (investPL / investCost) * 100 : 0
  const gain = investPL >= 0

  return (
    <Card label="Danh mục đầu tư">
      {invests.length ? (
        <>
          <div className="mb-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="mb-[5px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                Giá trị hiện tại
              </div>
              <Figure value={formatMoney(investValue, hidden)} />
            </div>
            <div>
              <div className="mb-[5px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                Lãi / lỗ
              </div>
              <div
                className="whitespace-nowrap text-[15px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
                style={{ color: gain ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
              >
                {signedMoney(investPL, hidden)} · {pct1(investPct)}
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
                  vốn {formatMoney(investment.cost, hidden)}
                </span>
                <span className="whitespace-nowrap text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(investment.value, hidden)}
                </span>
                <span
                  className="whitespace-nowrap text-[13px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
                  style={{ color: pl >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                >
                  {signedMoney(pl, hidden)}
                </span>
              </div>
            )
          })}
        </>
      ) : (
        <div>
          <Figure value={formatMoney(0, hidden)} />
          <p className="mt-[10px] text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            Chưa có khoản đầu tư nào. Thêm khoản đầu tư đầu tiên để bắt đầu theo dõi lãi/lỗ.
          </p>
        </div>
      )}
      <AddInvestForm onAdd={onAddInvest} />
    </Card>
  )
}

export { InvestmentsTab }
