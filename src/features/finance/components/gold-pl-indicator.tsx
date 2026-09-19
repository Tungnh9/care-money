"use client"

import { TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"

interface GoldPLIndicatorProps {
  pl: number
  hidden: boolean
}

// Badge dạng viên thuốc — dùng trong ô bảng (GoldTransactionsTable, GoldStoreSummaryTable).
function GoldPLBadge({ pl, hidden }: GoldPLIndicatorProps) {
  const positive = pl >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[4px] rounded-full px-[9px] py-[3px] font-semibold [font-family:var(--ob-font-num)] tabular-nums",
        positive
          ? "bg-[var(--ob-color-income)]/10 text-[var(--ob-color-income)]"
          : "bg-[var(--ob-color-expense)]/10 text-[var(--ob-color-expense)]"
      )}
    >
      {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {formatMoney(Math.abs(pl), hidden)}
    </span>
  )
}

// Khối viền màu có nhãn "Lãi lỗ" — dùng trong card (GoldTransactionsCards, GoldStoreSummaryCards).
function GoldPLBox({ pl, hidden }: GoldPLIndicatorProps) {
  const positive = pl >= 0
  return (
    <div
      className="mt-3 rounded-[var(--ob-radius-sm)] border px-3 py-[10px]"
      style={{
        backgroundColor: positive ? "var(--ob-color-income-soft)" : "var(--ob-color-expense-soft)",
        borderColor: positive ? "var(--ob-color-income)" : "var(--ob-color-expense)",
      }}
    >
      <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Lãi lỗ
      </div>
      <div
        className="flex items-center gap-1 text-[13px] font-semibold [font-family:var(--ob-font-num)] tabular-nums"
        style={{ color: positive ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
      >
        {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {formatMoney(Math.abs(pl), hidden)}
      </div>
    </div>
  )
}

export { GoldPLBadge, GoldPLBox }
