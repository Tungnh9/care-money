"use client"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { MetalStoreSummary } from "@/lib/finance/metal-calculations"
import type { MetalDisplay } from "../metal-config"
import { MetalPLBox } from "./metal-pl-indicator"

interface MetalStoreSummaryCardsProps {
  metal: MetalDisplay
  summaries: MetalStoreSummary[]
  total: MetalStoreSummary
}

type StatRow = Pick<MetalStoreSummary, "qty" | "avgBuy" | "cost" | "value"> & {
  formatQuantity: MetalDisplay["formatQuantity"]
  hidden: boolean
  tone: "default" | "total"
}

function StatGrid({ qty, avgBuy, cost, value, formatQuantity, hidden, tone }: StatRow) {
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
          {formatQuantity(qty)}
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

function MetalStoreSummaryCards({ metal, summaries, total }: MetalStoreSummaryCardsProps) {
  const { hidden } = useMoneyVisibility()

  if (!summaries.length) return null

  return (
    <div className="flex flex-col gap-3">
      {summaries.map((s) => (
        <div key={s.store} className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-border)] p-[14px]">
          <div className="mb-3 text-[13px] font-bold">{s.store}</div>
          <StatGrid
            qty={s.qty}
            avgBuy={s.avgBuy}
            cost={s.cost}
            value={s.value}
            formatQuantity={metal.formatQuantity}
            hidden={hidden}
            tone="default"
          />
          <MetalPLBox pl={s.pl} hidden={hidden} />
        </div>
      ))}
      <div className="rounded-[var(--ob-radius-md)] border-2 border-[var(--ob-color-border)] bg-[var(--ob-color-surface-sunken)] p-[14px]">
        <div className="mb-3 text-[13px] font-bold" style={{ color: "var(--ob-color-action-strong)" }}>
          Tổng cộng
        </div>
        <StatGrid
          qty={total.qty}
          avgBuy={total.avgBuy}
          cost={total.cost}
          value={total.value}
          formatQuantity={metal.formatQuantity}
          hidden={hidden}
          tone="total"
        />
        <MetalPLBox pl={total.pl} hidden={hidden} />
      </div>
    </div>
  )
}

export { MetalStoreSummaryCards }
