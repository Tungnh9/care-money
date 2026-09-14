"use client"

import dynamic from "next/dynamic"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { MonthlyTrendPoint } from "../budget-calculations"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface MonthlyTrendChartProps {
  data: MonthlyTrendPoint[]
}

function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const { hidden } = useMoneyVisibility()

  return (
    <Chart
      type="line"
      height={300}
      series={[
        { name: "Lương", data: data.map((point) => point.salary) },
        { name: "Đã chi", data: data.map((point) => point.spent) },
      ]}
      options={{
        chart: { fontFamily: "inherit", toolbar: { show: false } },
        colors: ["var(--ob-color-action)", "var(--ob-color-expense)"],
        stroke: { width: 2.5, curve: "smooth" },
        markers: { size: 5, hover: { size: 7 } },
        grid: { strokeDashArray: 4 },
        xaxis: { categories: data.map((point) => point.month) },
        yaxis: { labels: { formatter: (value: number) => formatMoney(value, hidden) } },
        tooltip: { y: { formatter: (value: number) => formatMoney(value, hidden) } },
        legend: { position: "top", horizontalAlign: "left" },
      }}
    />
  )
}

export { MonthlyTrendChart }
