"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { TagBreakdownEntry } from "../budget-calculations"

interface TagBreakdownChartProps {
  data: TagBreakdownEntry[]
}

// tag.tint (dùng cho badge tròn nhỏ trong Cài đặt/danh sách chi tiêu) là màu pastel rất nhạt —
// hợp cho nền badge nhỏ có chữ đen đè lên, nhưng lại quá nhạt để tô cả 1 lát biểu đồ lớn (kể cả
// chữ trong Legend, vì recharts mặc định tô màu chữ trùng màu series). Bảng màu riêng này chỉ
// dùng cho biểu đồ, đậm/rõ hơn hẳn, tách biệt hoàn toàn khỏi tint dùng ở nơi khác.
const CHART_PALETTE = [
  "var(--ob-cam-500)",
  "var(--ob-xanh-500)",
  "var(--ob-la-500)",
  "var(--ob-tag-tamtrang)",
  "var(--ob-tag-muctieu)",
  "var(--ob-chuoi-500)",
  "var(--ob-do-500)",
]

const RADIAN = Math.PI / 180

interface PercentLabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  percent?: number
  fill?: string
}

function renderPercentLabel({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent, fill }: PercentLabelProps) {
  const radius = outerRadius + 18
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={14}
      fontWeight={700}
    >
      {`${Math.round((percent ?? 0) * 100)}%`}
    </text>
  )
}

function TagBreakdownChart({ data }: TagBreakdownChartProps) {
  const { hidden } = useMoneyVisibility()

  if (!data.length) {
    return (
      <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có khoản chi nào để thống kê.</p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="label"
          innerRadius="46%"
          outerRadius="72%"
          paddingAngle={2}
          stroke="var(--ob-color-surface)"
          strokeWidth={2}
          label={renderPercentLabel}
          labelLine={{ stroke: "var(--ob-color-border-strong)" }}
        >
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatMoney(Number(value), hidden)} />
        <Legend
          formatter={(value) => <span style={{ color: "var(--ob-color-text)" }}>{value}</span>}
          wrapperStyle={{ fontWeight: 600 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export { TagBreakdownChart }
