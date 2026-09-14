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

const RADIAN = Math.PI / 180

interface RingLabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  percent?: number
  fill?: string
  payload?: TagBreakdownEntry
}

// Callout kiểu "icon badge + đường nối + %/tên" quanh vòng — không có thư viện chart nào cho
// sẵn đúng kiểu này (kể cả recharts), phải tự vẽ bằng label renderer trả về SVG tuỳ ý.
function renderRingLabel({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent, fill, payload }: RingLabelProps) {
  const cos = Math.cos(-midAngle * RADIAN)
  const sin = Math.sin(-midAngle * RADIAN)
  const lineStart = { x: cx + (outerRadius + 4) * cos, y: cy + (outerRadius + 4) * sin }
  const badge = { x: cx + (outerRadius + 26) * cos, y: cy + (outerRadius + 26) * sin }
  const isRight = cos >= 0
  const textX = badge.x + (isRight ? 16 : -16)

  return (
    <g>
      <path
        d={`M${lineStart.x},${lineStart.y} L${badge.x},${badge.y}`}
        stroke={fill}
        strokeWidth={1.5}
        fill="none"
      />
      <circle cx={badge.x} cy={badge.y} r={11} fill={fill} />
      <text x={badge.x} y={badge.y} textAnchor="middle" dominantBaseline="central" fontSize={12}>
        {payload?.emoji}
      </text>
      <text
        x={textX}
        y={badge.y - 6}
        textAnchor={isRight ? "start" : "end"}
        fontSize={13}
        fontWeight={700}
        fill={fill}
      >
        {Math.round((percent ?? 0) * 100)}%
      </text>
      <text
        x={textX}
        y={badge.y + 9}
        textAnchor={isRight ? "start" : "end"}
        fontSize={11}
        fill="var(--ob-color-text-subtle)"
      >
        {payload?.label}
      </text>
    </g>
  )
}

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
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              innerRadius="50%"
              outerRadius="68%"
              paddingAngle={2}
              stroke="var(--ob-color-surface)"
              strokeWidth={2}
              label={renderRingLabel}
              labelLine={false}
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
