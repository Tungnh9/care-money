import { CountMoney } from "@/components/ob/count-money"
import { Card } from "@/components/ui/card"
import { pct1, type FinanceSummary } from "@/features/finance/finance-calculations"

interface NetWorthCardProps {
  summary: FinanceSummary
}

interface Segment {
  key: string
  label: string
  value: number
  color: string
}

function NetWorthCard({ summary }: NetWorthCardProps) {
  const { savingsTotal, goldValue, investValue, debtTotal, net, netPct } = summary

  const segments: Segment[] = [
    { key: "savings", label: "Tiết kiệm", value: savingsTotal, color: "var(--ob-la-300)" },
    { key: "gold", label: "Vàng", value: goldValue, color: "var(--ob-color-reward)" },
    ...(investValue > 0
      ? [{ key: "invest", label: "Đầu tư", value: investValue, color: "var(--ob-xanh-500)" }]
      : []),
    { key: "debt", label: "Nợ thẻ", value: debtTotal, color: "var(--ob-do-300)" },
  ]

  const total = savingsTotal + goldValue + investValue + debtTotal

  return (
    <Card tone="invert" label="Tài sản ròng" className="min-w-0 w-full">
      <CountMoney value={net} delta={pct1(netPct)} direction={netPct >= 0 ? "up" : "down"} />
      <div className="mt-5 flex h-2 gap-1.5 overflow-hidden rounded-[var(--ob-radius-pill)]">
        {total > 0 ? (
          segments.map((segment) => (
            <span
              key={segment.key}
              data-testid={`segment-${segment.key}`}
              style={{ flex: segment.value, background: segment.color }}
            />
          ))
        ) : (
          <span className="flex-1 bg-[var(--ob-vo-700)]" />
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-3.5 text-xs text-[var(--ob-vo-300)]">
        {segments.map((segment) => (
          <span key={segment.key} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: segment.color }} />
            {segment.label}
          </span>
        ))}
      </div>
    </Card>
  )
}

export { NetWorthCard }
