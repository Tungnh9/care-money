"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { MonthlyTrendPoint } from "../budget-calculations"

interface MonthlyTrendChartProps {
  data: MonthlyTrendPoint[]
}

function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="salary" name="Lương" fill="var(--ob-color-action)" />
        <Bar dataKey="spent" name="Đã chi" fill="var(--ob-color-expense)" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export { MonthlyTrendChart }
