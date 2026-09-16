"use client"

import dynamic from "next/dynamic"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { CHART_PALETTE, type MonthlyTagSeries } from "../budget-calculations"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface MonthlyTagTrendChartProps {
  months: string[]
  series: MonthlyTagSeries[]
}

function MonthlyTagTrendChart({ months, series }: MonthlyTagTrendChartProps) {
  const { hidden } = useMoneyVisibility()

  // Giữ đúng thứ tự/màu như chart cột chồng ở trên (không sort theo tổng) để dòng tổng kết khớp
  // trực quan với legend của ApexCharts ngay phía trên nó.
  const totals = series.map((s, i) => ({
    ...s,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
    total: s.data.reduce((sum, value) => sum + value, 0),
  }))
  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0)

  return (
    <div>
      <Chart
        type="bar"
        height={300}
        series={series.map((s) => ({ name: s.label, data: s.data }))}
        options={{
          chart: { fontFamily: "inherit", toolbar: { show: false }, stacked: true },
          colors: series.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
          plotOptions: { bar: { columnWidth: "45%" } },
          dataLabels: { enabled: false },
          legend: { position: "bottom", fontFamily: "inherit" },
          grid: { strokeDashArray: 4 },
          xaxis: { categories: months.map((month) => `Tháng ${Number(month.slice(5, 7))}`) },
          yaxis: { labels: { formatter: (value: number) => formatMoney(value, hidden) } },
          tooltip: { y: { formatter: (value: number) => formatMoney(value, hidden) } },
        }}
      />

      {totals.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--ob-color-border)] pt-4">
          {totals.map((t) => (
            <div key={t.label} className="flex items-center justify-between gap-3 text-[13.5px]">
              <span className="flex items-center gap-2 text-[var(--ob-color-text-muted)]">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </span>
              <span
                className="[font-family:var(--ob-font-num)]"
                style={{ color: "var(--ob-color-text-muted)" }}
              >
                {formatMoney(t.total, hidden)}
              </span>
            </div>
          ))}

          <div className="mt-1 flex items-center justify-between gap-3 border-t border-[var(--ob-color-border)] pt-3 text-[13.5px] font-bold">
            <span>Tổng cộng</span>
            <span
              className="[font-family:var(--ob-font-num)]"
              style={{ color: "var(--ob-color-action-strong)" }}
            >
              {formatMoney(grandTotal, hidden)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export { MonthlyTagTrendChart }
