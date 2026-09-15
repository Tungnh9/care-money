"use client"

import dynamic from "next/dynamic"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { MonthlyExpensePoint } from "../budget-calculations"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface MonthlyTrendChartProps {
  data: MonthlyExpensePoint[]
  currentMonth?: string
}

// Tháng tương lai chưa có dữ liệu thật (không thể biết trước sẽ chi bao nhiêu) — chỉ dùng để tô
// màu phân biệt trực quan với tháng hiện tại/đã qua, không có ý nghĩa tương tác nào khác.
function isConfirmedMonth(month: string, currentMonth: string): boolean {
  return month <= currentMonth
}

// Trần cố định 35tr — mỗi cột luôn cao đúng bằng mức trần này (2 phần xếp chồng luôn cộng lại
// = 35tr), không tự co giãn theo chi tiêu thực tế cao nhất trong data. Phần "Đã chi" (đậm) cao
// đúng bằng % thật đã dùng; phần "Còn lại tới mức trần" (vàng nhạt) luôn lấp đầy phần còn lại lên
// tới đỉnh — vàng nhạt vì vậy luôn "mở" tới đúng mốc 35tr ở mọi cột.
const AXIS_MAX = 35_000_000
// Cùng họ cam với token --ob-cam-* của app (thay vì cam+vàng lệch tông như bản trước) — đậm/nhạt
// của cùng 1 màu nhìn hài hoà hơn.
const SPENT_COLOR = "#D14C06"
const HEADROOM_COLOR = "#FFE0C7"
// Tháng tương lai (chưa có dữ liệu thật) đổi hẳn sang tông xám trung tính (--ob-vo-*) thay vì cam
// — để phân biệt RÕ với tháng hiện tại/đã qua bằng màu sắc.
const SPENT_DIM_COLOR = "#B9A695"
const HEADROOM_DIM_COLOR = "#E4D8C9"

function MonthlyTrendChart({ data, currentMonth }: MonthlyTrendChartProps) {
  const { hidden } = useMoneyVisibility()
  const confirmed = data.map((point) => !currentMonth || isConfirmedMonth(point.month, currentMonth))

  return (
    <Chart
      type="bar"
      height={300}
      series={[
        { name: "Đã chi", data: data.map((point) => point.total) },
        { name: "Còn lại tới mức trần", data: data.map((point) => Math.max(0, AXIS_MAX - point.total)) },
      ]}
      options={{
        chart: {
          fontFamily: "inherit",
          toolbar: { show: false },
          stacked: true,
        },
        // Tô màu theo TỪNG CỘT (không theo cả series) bằng hàm — chỉ 2 series thật (không cần
        // tách thêm series "xem trước" nữa, tránh đúng bug border-radius ở trên vì thừa series 0).
        colors: [
          ({ dataPointIndex }) => (confirmed[dataPointIndex] ? SPENT_COLOR : SPENT_DIM_COLOR),
          ({ dataPointIndex }) => (confirmed[dataPointIndex] ? HEADROOM_COLOR : HEADROOM_DIM_COLOR),
        ],
        // Không bo góc — ApexCharts bo góc không nhất quán giữa các cột trên bar chart xếp chồng
        // tuỳ theo cột đó có 1 hay 2 đoạn khác 0 (đã thử borderRadiusApplication:"end" nhưng vẫn
        // lệch giữa các cột), nên để vuông hết cho đồng nhất.
        plotOptions: { bar: { columnWidth: "45%" } },
        dataLabels: {
          enabled: true,
          // Chỉ hiện nhãn ở series "Đã chi" (seriesIndex 0) — phần "Còn lại" chỉ để lấp đầy tới
          // mức trần, không cần tự nói ra số của chính nó.
          formatter: (value: number, opts) => (opts?.seriesIndex === 0 ? formatMoney(value, hidden) : ""),
          style: { fontSize: "12px", fontWeight: 700, colors: ["#ffffff"] },
        },
        legend: { show: false },
        grid: { strokeDashArray: 4 },
        xaxis: { categories: data.map((point) => `Tháng ${Number(point.month.slice(5, 7))}`) },
        yaxis: { max: AXIS_MAX, labels: { formatter: (value: number) => formatMoney(value, hidden) } },
        tooltip: {
          custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
            const point = data[dataPointIndex]
            if (!point) return ""
            const label = `Tháng ${Number(point.month.slice(5, 7))}`
            return `<div style="padding:8px 12px;font-size:12.5px;line-height:1.5;">
              <div style="font-weight:700;margin-bottom:2px;">${label}</div>
              <div>Đã chi: ${formatMoney(point.total, hidden)}</div>
            </div>`
          },
        },
        // Màn hình hẹp: cột quá nhỏ để in vừa chuỗi tiền tệ (vd. "25.000.000 ₫") ngay trong cột —
        // chữ sẽ đè lên cột kế bên. Tắt nhãn inline, số chính xác vẫn xem được qua tooltip khi
        // chạm/hover vào cột.
        responsive: [
          {
            breakpoint: 640,
            options: { dataLabels: { enabled: false } },
          },
        ],
      }}
    />
  )
}

export { MonthlyTrendChart, isConfirmedMonth }
