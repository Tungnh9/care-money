"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { TagBreakdownEntry } from "../budget-calculations"

interface TagBreakdownChartProps {
  data: TagBreakdownEntry[]
}

// tag.tint (dùng cho badge tròn nhỏ trong Cài đặt/danh sách chi tiêu) là màu pastel rất nhạt —
// hợp cho nền badge nhỏ có chữ đen đè lên, nhưng lại quá nhạt để tô cả 1 lát biểu đồ lớn. Bảng
// màu riêng này chỉ dùng cho biểu đồ, đậm/rõ hơn hẳn, tách biệt hoàn toàn khỏi tint dùng ở nơi khác.
const CHART_PALETTE = [
  "var(--ob-cam-500)",
  "var(--ob-xanh-500)",
  "var(--ob-la-500)",
  "var(--ob-tag-tamtrang)",
  "var(--ob-tag-muctieu)",
  "var(--ob-chuoi-500)",
  "var(--ob-do-500)",
]

function TagBreakdownChart({ data }: TagBreakdownChartProps) {
  const { hidden } = useMoneyVisibility()

  if (!data.length) {
    return (
      <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có khoản chi nào để thống kê.</p>
    )
  }

  const total = data.reduce((sum, entry) => sum + entry.total, 0)
  const colors = data.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length])

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              innerRadius="62%"
              outerRadius="95%"
              paddingAngle={2}
              stroke="var(--ob-color-surface)"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={colors[i]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatMoney(Number(value), hidden)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
            Tổng chi
          </span>
          <span className="[font-family:var(--ob-font-num)] text-[17px] font-bold text-[var(--ob-color-text)]">
            {formatMoney(total, hidden)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-[2px]">
        {data.map((entry, i) => {
          const percent = total > 0 ? Math.round((entry.total / total) * 100) : 0
          return (
            <div
              key={entry.label}
              className="flex items-center gap-[10px] rounded-[var(--ob-radius-sm)] px-1 py-[7px]"
            >
              <span
                data-testid="tag-color-dot"
                className="size-3 flex-none rounded-full"
                style={{ backgroundColor: colors[i] }}
              />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-[var(--ob-color-text)]">
                <span aria-hidden="true">{entry.emoji}</span> <span>{entry.label}</span>
              </span>
              <span className="flex-none text-[13px] text-[var(--ob-color-text-subtle)]">{percent}%</span>
              <span className="flex-none [font-family:var(--ob-font-num)] text-[13.5px] font-bold text-[var(--ob-color-text)]">
                {formatMoney(entry.total, hidden)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { TagBreakdownChart }
