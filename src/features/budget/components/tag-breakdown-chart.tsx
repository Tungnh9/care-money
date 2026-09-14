"use client"

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { TagBreakdownEntry } from "../budget-calculations"

interface TagBreakdownChartProps {
  data: TagBreakdownEntry[]
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
          stroke="var(--ob-color-border-strong)"
          strokeWidth={1.5}
          label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
          labelLine={{ stroke: "var(--ob-color-border-strong)" }}
        >
          {data.map((entry) => (
            <Cell key={entry.label} fill={entry.tint} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatMoney(Number(value), hidden)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export { TagBreakdownChart }
