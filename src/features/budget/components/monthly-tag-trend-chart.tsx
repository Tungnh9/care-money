"use client"

import dynamic from "next/dynamic"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { CHART_PALETTE, type MonthlyTagSeries } from "@/lib/budget/budget-calculations"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

// Nhãn tháng trên trục X: tháng đang xem ở thẻ "Tổng hợp chi tiêu tháng" màu cam đậm (--ob-cam-700, như
// --ob-color-action-strong), các tháng khác màu chữ phụ (--ob-vo-500). ApexCharts tô nhãn bằng thuộc tính `fill`
// của SVG nên cần mã màu thật, không dùng được var(--...).
const LABEL_COLOR = "#7a6455"
const SELECTED_LABEL_COLOR = "#a63a05"

interface MonthlyTagTrendChartProps {
  months: string[]
  series: MonthlyTagSeries[]
  // Màu theo nhãn (tagChartColors) — cùng bảng với donut "Chi theo nhãn"; không truyền (hoặc thiếu
  // nhãn) thì tô theo thứ tự như trước.
  colors?: Map<string, string>
  // Tháng đang xem ở thẻ "Tổng hợp chi tiêu tháng" — nhãn của nó trên trục X được tô nổi.
  selectedMonth?: string
  // Bấm 1 cột, hay nhãn tháng dưới cột (tháng không chi gì thì không có cột để bấm), để xem tháng đó.
  onSelectMonth?: (month: string) => void
}

function MonthlyTagTrendChart({ months, series, colors, selectedMonth, onSelectMonth }: MonthlyTagTrendChartProps) {
  const { hidden } = useMoneyVisibility()

  function selectAt(index: number | undefined) {
    if (index !== undefined && index >= 0 && index < months.length) onSelectMonth?.(months[index])
  }

  return (
    // Con trỏ tay trên cột và nhãn tháng: bấm được để xem tháng đó.
    <div className="[&_.apexcharts-bar-area]:cursor-pointer [&_.apexcharts-xaxis-label]:cursor-pointer">
      <Chart
        type="bar"
        height={300}
        series={series.map((s) => ({ name: s.label, data: s.data }))}
        options={{
          chart: {
            fontFamily: "inherit",
            toolbar: { show: false },
            stacked: true,
            events: {
              dataPointSelection: (_event, _chart, options) => selectAt(options?.dataPointIndex),
              xAxisLabelClick: (_event, _chart, options) => selectAt(options?.labelIndex),
            },
          },
          // Tháng đang xem đã hiện ở nhãn trục X và ở thẻ tổng hợp — không làm tối riêng đoạn cột vừa bấm.
          states: { active: { filter: { type: "none" } } },
          colors: series.map((s, i) => colors?.get(s.label) ?? CHART_PALETTE[i % CHART_PALETTE.length]),
          plotOptions: { bar: { columnWidth: "45%" } },
          dataLabels: { enabled: false },
          legend: { position: "bottom", fontFamily: "inherit" },
          grid: { strokeDashArray: 4 },
          xaxis: {
            categories: months.map((month) => `Tháng ${Number(month.slice(5, 7))}`),
            labels: {
              style: { colors: months.map((month) => (month === selectedMonth ? SELECTED_LABEL_COLOR : LABEL_COLOR)) },
            },
          },
          yaxis: { labels: { formatter: (value: number) => formatMoney(value, hidden) } },
          tooltip: { y: { formatter: (value: number) => formatMoney(value, hidden) } },
        }}
      />
    </div>
  )
}

export { MonthlyTagTrendChart }
