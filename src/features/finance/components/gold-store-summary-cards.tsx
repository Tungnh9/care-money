"use client"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { phanToChi } from "../finance-calculations"
import type { GoldStoreSummary } from "../finance-calculations"
import { GoldPLBox } from "./gold-pl-indicator"

interface GoldStoreSummaryCardsProps {
  summaries: GoldStoreSummary[]
  total: GoldStoreSummary
}

type StatRow = Pick<GoldStoreSummary, "phan" | "avgBuy" | "cost" | "value"> & {
  hidden: boolean
  tone: "default" | "total"
}

function StatGrid({ phan, avgBuy, cost, value, hidden, tone }: StatRow) {
  const moneyColor = tone === "total" ? "var(--ob-color-action-strong)" : "var(--ob-color-text-subtle)"
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Khối lượng
        </div>
        <div
          className="text-[13px] font-semibold [font-family:var(--ob-font-num)] tabular-nums"
          style={tone === "total" ? { color: moneyColor } : undefined}
        >
          {phanToChi(phan)}
        </div>
      </div>
      <div>
        <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Giá mua
        </div>
        <div
          className="text-[13px] font-semibold [font-family:var(--ob-font-num)] tabular-nums"
          style={{ color: moneyColor }}
        >
          {formatMoney(avgBuy, hidden)}
        </div>
      </div>
      <div>
        <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Giá vốn
        </div>
        <div
          className="text-[13px] font-semibold [font-family:var(--ob-font-num)] tabular-nums"
          style={{ color: moneyColor }}
        >
          {formatMoney(cost, hidden)}
        </div>
      </div>
      <div>
        <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Giá hiện tại
        </div>
        <div
          className="text-[13px] font-semibold [font-family:var(--ob-font-num)] tabular-nums"
          style={{ color: moneyColor }}
        >
          {formatMoney(value, hidden)}
        </div>
      </div>
    </div>
  )
}

function GoldStoreSummaryCards({ summaries, total }: GoldStoreSummaryCardsProps) {
  const { hidden } = useMoneyVisibility()

  if (!summaries.length) return null

  return (
    <div className="flex flex-col gap-3">
      {summaries.map((s) => (
        <div key={s.store} className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-border)] p-[14px]">
          <div className="mb-3 text-[13px] font-bold">{s.store}</div>
          <StatGrid phan={s.phan} avgBuy={s.avgBuy} cost={s.cost} value={s.value} hidden={hidden} tone="default" />
          <GoldPLBox pl={s.pl} hidden={hidden} />
        </div>
      ))}
      <div className="rounded-[var(--ob-radius-md)] border-2 border-[var(--ob-color-border)] bg-[var(--ob-color-surface-sunken)] p-[14px]">
        <div className="mb-3 text-[13px] font-bold" style={{ color: "var(--ob-color-action-strong)" }}>
          Tổng cộng
        </div>
        <StatGrid
          phan={total.phan}
          avgBuy={total.avgBuy}
          cost={total.cost}
          value={total.value}
          hidden={hidden}
          tone="total"
        />
        <GoldPLBox pl={total.pl} hidden={hidden} />
      </div>
    </div>
  )
}

export { GoldStoreSummaryCards }
