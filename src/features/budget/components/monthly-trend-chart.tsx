"use client"

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { MonthlyTrendPoint } from "../budget-calculations"

interface MonthlyTrendChartProps {
  data: MonthlyTrendPoint[]
}

function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const { hidden } = useMoneyVisibility()

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value: number) => formatMoney(value, hidden)} width={90} />
        <Tooltip formatter={(value) => formatMoney(Number(value), hidden)} />
        <Legend />
        <Line
          type="monotone"
          dataKey="salary"
          name="Lương"
          stroke="var(--ob-color-action)"
          strokeWidth={2.5}
          dot={{ r: 5 }}
          activeDot={{ r: 7 }}
        />
        <Line
          type="monotone"
          dataKey="spent"
          name="Đã chi"
          stroke="var(--ob-color-expense)"
          strokeWidth={2.5}
          dot={{ r: 5 }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export { MonthlyTrendChart }
