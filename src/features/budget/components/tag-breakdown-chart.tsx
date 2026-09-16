"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { CHART_PALETTE, type TagBreakdownEntry } from "../budget-calculations"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface TagBreakdownChartProps {
  data: TagBreakdownEntry[]
}

const CHART_HEIGHT = 300
const CENTER_Y = CHART_HEIGHT / 2
// ApexCharts không expose bán kính/tâm vòng đã vẽ qua prop/API nào (khác recharts, label
// renderer nhận thẳng cx/cy/outerRadius chính xác) — đo bằng getBoundingClientRect() trên
// .apexcharts-pie-area thật rồi chỉnh tay. Đo với nhiều bề rộng khung khác nhau (300 và 460, cùng
// height 300) cho kết quả outerRadius giống hệt nhau và tâm luôn đúng bằng (width/2, height/2) —
// nghĩa là ApexCharts luôn vẽ vòng tròn theo chiều THẤP hơn của khung rồi canh giữa, không co giãn
// theo chiều rộng. Vì vậy chỉ cần đo 1 lần ở chiều cao cố định 300; tâm X mới cần đo theo bề rộng
// thật (đo bằng ResizeObserver, xem useMeasuredWidth).
const CUSTOM_SCALE = 0.5
const OUTER_R = 70
// Tỉ lệ lỗ giữa/bán kính ngoài (plotOptions.pie.donut.size) — dùng chung hằng số này cho cả cấu
// hình chart lẫn công thức tính cỡ chữ, tránh 2 nơi lệch nhau như lần trước.
const DONUT_SIZE_RATIO = 0.8
const HOLE_DIAMETER = OUTER_R * DONUT_SIZE_RATIO * 2

function useMeasuredWidth(fallback: number) {
  // Callback ref (không phải useRef thường) vì data có thể rỗng ở lần render đầu (trước khi
  // useBudget hydrate xong từ localStorage) — component early-return, div chưa mount lúc đó.
  // useEffect(fn, []) chỉ chạy 1 lần sau lần commit đầu tiên nên sẽ mãi mãi thấy ref null nếu dùng
  // useRef thường; callback ref re-fire đúng lúc div thật sự mount ở lần render sau.
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width
      if (measured) setWidth(measured)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return [setNode, width] as const
}

interface CalloutItem {
  fraction: number
  mid: number
  color: string
  entry: TagBreakdownEntry
}

// Lỗ giữa donut có đường kính cố định (HOLE_DIAMETER) trong khi số tiền dài ngắn tuỳ ý (chi tiêu
// có thể lên chục/trăm triệu, thậm chí tỷ) — cỡ chữ cố định sẽ tràn ra khỏi lỗ, đè lên vòng màu
// khi số đủ dài. Lần đầu thử ghim cỡ chữ theo vài mốc độ dài đo tay bằng screenshot — quá mong
// manh: chỉ cách biên tràn vài px, một font-rendering khác (máy khác/trình duyệt khác) là tràn
// ngay dù đúng số ký tự đã đo. Thay bằng công thức tính theo bề rộng lỗ thật + tỉ lệ bề ngang mỗi
// ký tự của font --ob-font-num (JetBrains Mono, đo thực nghiệm ~0.588em/ký tự, làm tròn lên
// 0.6 và chỉ dùng 80% đường kính lỗ) để luôn có biên an toàn thay vì áp sát ranh giới.
const CHAR_WIDTH_EM = 0.6
const HOLE_SAFETY = 0.8
const MAX_TOTAL_FONT = 17
const MIN_TOTAL_FONT = 8

function totalFontSize(formatted: string) {
  const availableWidth = HOLE_DIAMETER * HOLE_SAFETY
  const bySpace = Math.floor(availableWidth / (formatted.length * CHAR_WIDTH_EM))
  return Math.max(MIN_TOTAL_FONT, Math.min(MAX_TOTAL_FONT, bySpace))
}

function pointAtAngle(centerX: number, angle: number, radius: number) {
  return { x: centerX + radius * Math.sin(angle), y: CENTER_Y - radius * Math.cos(angle) }
}

// Đặt nhãn đúng góc thật của mỗi lát khiến các lát nhỏ nằm cạnh nhau (vd 2% cạnh 8%) có nhãn
// đè lên nhau — nhất là quanh khu vực nhiều lát nhỏ dồn cục. Gom các nhãn liền kề gần nhau hơn
// MIN_LABEL_GAP thành 1 cụm rồi rải đều quanh đúng góc trung bình thật của cụm đó, thay vì đẩy
// dồn về 1 phía (dễ trôi xa khỏi lát thật nếu nhiều lát nhỏ đứng liền nhau).
const MIN_LABEL_GAP = 0.6 // radian (~34°) — đủ chỗ cho khối nhãn 2 dòng (%/tên) không chồng nhau

function declutterAngles(trueAngles: number[]): number[] {
  const result = [...trueAngles]
  let i = 0
  while (i < result.length) {
    let j = i
    while (j + 1 < result.length && result[j + 1] - result[j] < MIN_LABEL_GAP) {
      j++
    }
    if (j > i) {
      const clusterAvg = trueAngles.slice(i, j + 1).reduce((a, b) => a + b, 0) / (j - i + 1)
      const start = clusterAvg - (MIN_LABEL_GAP * (j - i)) / 2
      for (let k = i; k <= j; k++) {
        result[k] = start + MIN_LABEL_GAP * (k - i)
      }
    }
    i = j + 1
  }
  return result
}

// Callout kiểu "icon badge + đường nối + %/tên" quanh vòng — ApexCharts không có label renderer
// nhận toạ độ từng lát như recharts, phải tự tính góc giữa mỗi lát từ % cộng dồn rồi overlay 1
// lớp SVG riêng đè lên chart. % cộng dồn (mid) được tính sẵn trong TagBreakdownChart bằng
// slice/reduce thuần (không dùng biến let cộng dồn qua từng vòng lặp) vì eslint's
// react-hooks/immutability rule chặn reassign biến trong lúc render.
function RingCallouts({ items, width, centerX }: { items: CalloutItem[]; width: number; centerX: number }) {
  const trueAngles = items.map((item) => item.mid * 2 * Math.PI)
  const labelAngles = declutterAngles(trueAngles)

  return (
    <svg width={width} height={CHART_HEIGHT} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {items.map(({ fraction, color, entry }, i) => {
        // Đường nối luôn bám góc THẬT của lát (trỏ đúng vị trí trên vòng); chỉ vị trí nhãn dùng
        // góc đã dời (labelAngle) để tránh chồng lên nhãn bên cạnh.
        const lineStart = pointAtAngle(centerX, trueAngles[i], OUTER_R + 4)
        const badge = pointAtAngle(centerX, labelAngles[i], OUTER_R + 24)
        const isRight = badge.x >= centerX
        const textX = badge.x + (isRight ? 14 : -14)

        return (
          <g key={entry.label}>
            <path
              d={`M${lineStart.x},${lineStart.y} L${badge.x},${badge.y}`}
              stroke={color}
              strokeWidth={1.5}
              fill="none"
            />
            <circle data-testid="tag-badge" cx={badge.x} cy={badge.y} r={11} fill={color} />
            <text x={badge.x} y={badge.y} textAnchor="middle" dominantBaseline="central" fontSize={12}>
              {entry.emoji}
            </text>
            <text
              x={textX}
              y={badge.y - 6}
              textAnchor={isRight ? "start" : "end"}
              fontSize={13}
              fontWeight={700}
              fill={color}
            >
              {Math.round(fraction * 100)}%
            </text>
            <text
              x={textX}
              y={badge.y + 9}
              textAnchor={isRight ? "start" : "end"}
              fontSize={11}
              fill="var(--ob-color-text-subtle)"
            >
              {entry.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function TagBreakdownChart({ data }: TagBreakdownChartProps) {
  const { hidden } = useMoneyVisibility()
  const [containerRef, width] = useMeasuredWidth(320)

  if (!data.length) {
    return (
      <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có khoản chi nào để thống kê.</p>
    )
  }

  const total = data.reduce((sum, entry) => sum + entry.total, 0)
  const colors = data.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length])
  const items: CalloutItem[] = data.map((entry, i) => {
    const fraction = entry.total / total
    const before = data.slice(0, i).reduce((sum, e) => sum + e.total, 0) / total
    return { fraction, mid: before + fraction / 2, color: colors[i], entry }
  })
  const centerX = width / 2

  return (
    <div ref={containerRef} className="relative" style={{ height: CHART_HEIGHT }}>
      <Chart
        type="donut"
        width={width}
        height={CHART_HEIGHT}
        series={data.map((entry) => entry.total)}
        options={{
          labels: data.map((entry) => entry.label),
          colors,
          legend: { show: false },
          dataLabels: { enabled: false },
          stroke: { width: 2, colors: ["var(--ob-color-surface)"] },
          chart: { fontFamily: "inherit" },
          tooltip: { y: { formatter: (val: number) => formatMoney(val, hidden) } },
          plotOptions: {
            pie: {
              customScale: CUSTOM_SCALE,
              donut: {
                size: `${DONUT_SIZE_RATIO * 100}%`,
                // Tổng ở giữa tự vẽ bằng div riêng bên dưới (luôn hiện "Tổng chi", không đổi khi
                // hover) — tắt label giữa mặc định của ApexCharts để tránh nó tự đổi qua tên+giá
                // trị thô của lát đang hover.
                labels: { show: false },
              },
            },
          },
        }}
      />
      <RingCallouts items={items} width={width} centerX={centerX} />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2">
        <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Tổng chi
        </span>
        <span
          className="[font-family:var(--ob-font-num)] font-bold text-[var(--ob-color-text)]"
          style={{ fontSize: totalFontSize(formatMoney(total, hidden)) }}
        >
          {formatMoney(total, hidden)}
        </span>
      </div>
    </div>
  )
}

export { TagBreakdownChart }
