import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"
import { goldPLTone, type GoldPLTone } from "@/lib/finance/finance-calculations"

interface GoldPLIndicatorProps {
  pl: number
  hidden: boolean
}

const TONE_COLOR: Record<GoldPLTone, string> = {
  gain: "var(--ob-color-income)",
  loss: "var(--ob-color-expense)",
  even: "var(--ob-color-text-muted)",
}

function ToneIcon({ tone }: { tone: GoldPLTone }) {
  if (tone === "gain") return <TrendingUp size={13} />
  if (tone === "loss") return <TrendingDown size={13} />
  return <Minus size={13} />
}

// Badge dạng viên thuốc — dùng trong ô bảng (GoldTransactionsTable, GoldStoreSummaryTable).
function GoldPLBadge({ pl, hidden }: GoldPLIndicatorProps) {
  const tone = goldPLTone(pl)
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-[4px] rounded-full px-[9px] py-[3px] font-semibold [font-family:var(--ob-font-num)] tabular-nums",
        tone === "gain" && "bg-[var(--ob-color-income)]/10 text-[var(--ob-color-income)]",
        tone === "loss" && "bg-[var(--ob-color-expense)]/10 text-[var(--ob-color-expense)]",
        tone === "even" && "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]"
      )}
    >
      <ToneIcon tone={tone} />
      {formatMoney(Math.abs(pl), hidden)}
    </span>
  )
}

// Khối viền màu có nhãn "Lãi lỗ" — dùng trong card (GoldTransactionsCards, GoldStoreSummaryCards).
function GoldPLBox({ pl, hidden }: GoldPLIndicatorProps) {
  const tone = goldPLTone(pl)
  return (
    <div
      data-tone={tone}
      className="mt-3 rounded-[var(--ob-radius-sm)] border px-3 py-[10px]"
      style={{
        backgroundColor:
          tone === "gain"
            ? "var(--ob-color-income-soft)"
            : tone === "loss"
              ? "var(--ob-color-expense-soft)"
              : "var(--ob-color-surface-sunken)",
        borderColor: tone === "even" ? "var(--ob-color-border)" : TONE_COLOR[tone],
      }}
    >
      <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Lãi lỗ
      </div>
      <div
        className="flex items-center gap-1 text-[13px] font-semibold [font-family:var(--ob-font-num)] tabular-nums"
        style={{ color: TONE_COLOR[tone] }}
      >
        <ToneIcon tone={tone} />
        {formatMoney(Math.abs(pl), hidden)}
      </div>
    </div>
  )
}

export { GoldPLBadge, GoldPLBox }
