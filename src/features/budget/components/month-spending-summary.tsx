"use client"

import { useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { ActionTooltip } from "@/components/ob/action-tooltip"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatMonthKey } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CHART_PALETTE, type TagBreakdownEntry } from "@/lib/budget/budget-calculations"

interface MonthSpendingSummaryProps {
  month: string
  // Khoảng chọn được trong lịch: từ năm của khoản chi sớm nhất tới tháng này — tháng chưa tới không chọn được.
  firstMonth: string
  currentMonth: string
  // Các tháng có khoản chi (kể cả quẹt thẻ) — có chấm nhỏ trong lịch, để biết tháng nào có dữ liệu.
  monthsWithSpending: Set<string>
  // Chi tiêu của riêng `month` theo nhãn (breakdownByTag) — không cộng dồn nhiều tháng.
  entries: TagBreakdownEntry[]
  // Màu theo nhãn (tagChartColors) — chấm đầu dòng khớp màu của nhãn đó trên các biểu đồ.
  colors?: Map<string, string>
  // Đã quẹt thẻ trong `month` — không phải chi tiêu nên không cộng vào "Tổng cộng"; chỉ hiện thành 1 dòng riêng
  // "0 ₫ / tổng quẹt". Dòng này không lấy màu từ `colors`.
  swiped?: { label: string; emoji: string; total: number }
  onSelectMonth: (month: string) => void
}

interface MonthCalendarProps {
  month: string
  firstYear: number
  currentMonth: string
  monthsWithSpending: Set<string>
  onSelectMonth: (month: string) => void
}

const YEAR_BUTTON =
  "flex size-9 flex-none items-center justify-center rounded-full text-[var(--ob-color-text-muted)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:bg-[var(--ob-color-action-soft)] hover:text-[var(--ob-color-action-strong)] disabled:cursor-not-allowed disabled:opacity-40"

function monthKeyOf(year: number, monthNumber: number): string {
  return `${year}-${String(monthNumber).padStart(2, "0")}`
}

// Icon lịch ngay sau tiêu đề; bấm mở lịch theo năm (lưới 12 tháng), chọn 1 tháng là xem và đóng lịch. Đổi năm bằng
// 2 nút ‹ › nên dữ liệu nhiều năm vẫn tới được bất kỳ tháng nào chỉ vài lần bấm.
function MonthCalendar({ month, firstYear, currentMonth, monthsWithSpending, onSelectMonth }: MonthCalendarProps) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(() => Number(month.slice(0, 4)))
  const currentYear = Number(currentMonth.slice(0, 4))

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Mỗi lần mở, lịch bắt đầu ở năm của tháng đang xem.
        if (next) setViewYear(Number(month.slice(0, 4)))
        setOpen(next)
      }}
    >
      <ActionTooltip label="Chọn tháng">
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label="Chọn tháng để xem"
              className="relative -my-2 flex size-8 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] after:absolute after:-inset-1.5 after:content-[''] hover:text-[var(--ob-color-action-strong)] data-[popup-open]:text-[var(--ob-color-action-strong)]"
            />
          }
        >
          <CalendarDays size={17} />
        </PopoverTrigger>
      </ActionTooltip>
      <PopoverContent align="start" className="w-[272px]">
        <div className="flex items-center justify-between">
          <ActionTooltip label="Năm trước" disabledReason="Chưa có khoản chi nào trước năm này.">
            <button
              type="button"
              aria-label="Năm trước"
              disabled={viewYear <= firstYear}
              onClick={() => setViewYear((y) => y - 1)}
              className={YEAR_BUTTON}
            >
              <ChevronLeft size={18} />
            </button>
          </ActionTooltip>
          <span aria-live="polite" className="text-[15px] font-bold tabular-nums">{`Năm ${viewYear}`}</span>
          <ActionTooltip label="Năm sau" disabledReason="Đang ở năm nay.">
            <button
              type="button"
              aria-label="Năm sau"
              disabled={viewYear >= currentYear}
              onClick={() => setViewYear((y) => y + 1)}
              className={YEAR_BUTTON}
            >
              <ChevronRight size={18} />
            </button>
          </ActionTooltip>
        </div>
        <div role="group" aria-label={`Các tháng năm ${viewYear}`} className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
            const key = monthKeyOf(viewYear, n)
            const selected = key === month
            const hasSpending = monthsWithSpending.has(key)
            return (
              <button
                key={n}
                type="button"
                aria-pressed={selected}
                disabled={key > currentMonth}
                onClick={() => {
                  onSelectMonth(key)
                  setOpen(false)
                }}
                className={cn(
                  "relative flex min-h-[var(--ob-hit-min)] items-center justify-center rounded-[var(--ob-radius-sm)] text-[13px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] disabled:cursor-not-allowed disabled:opacity-35",
                  selected
                    ? "bg-[var(--ob-color-action)] text-white"
                    : "text-[var(--ob-color-text-muted)] hover:bg-[var(--ob-color-action-soft)] hover:text-[var(--ob-color-action-strong)]"
                )}
              >
                {`Tháng ${n}`}
                {/* Chấm dưới chữ: tháng này có khoản chi. */}
                {hasSpending ? (
                  <span
                    data-testid="calendar-spending-dot"
                    aria-hidden="true"
                    className={cn(
                      "absolute bottom-1 size-1 rounded-full",
                      selected ? "bg-white" : "bg-[var(--ob-color-action)]"
                    )}
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Tổng hợp chi tiêu của 1 tháng theo nhãn; chọn tháng ở icon lịch sau tiêu đề (hay bấm 1 cột ở biểu đồ 6 tháng).
// Nhãn không chi gì trong tháng thì không có dòng.
function MonthSpendingSummary({
  month,
  firstMonth,
  currentMonth,
  monthsWithSpending,
  entries,
  colors,
  swiped,
  onSelectMonth,
}: MonthSpendingSummaryProps) {
  const { hidden } = useMoneyVisibility()

  // Gồm cả năm của tháng đang xem, phòng khi nó sớm hơn khoản chi đầu tiên (bấm 1 cột trống ở biểu đồ 6 tháng).
  const firstYear = Math.min(
    Number(firstMonth.slice(0, 4)),
    Number(month.slice(0, 4)),
    Number(currentMonth.slice(0, 4))
  )

  const rows = entries
    .map((entry, i) => ({ ...entry, color: colors?.get(entry.label) ?? CHART_PALETTE[i % CHART_PALETTE.length] }))
    .filter((row) => row.total > 0)
  const showSwiped = swiped !== undefined && swiped.total > 0
  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0)

  return (
    <div>
      {/* Tiêu đề tự dựng thay cho label của Card: icon lịch phải đứng ngay sau chữ, và không mờ theo chữ. */}
      <div className="mb-[var(--ob-space-3)] flex items-center gap-1">
        <span
          aria-live="polite"
          className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] opacity-[.66]"
        >
          {`Tổng hợp chi tiêu ${formatMonthKey(month).toLowerCase()}`}
        </span>
        <MonthCalendar
          month={month}
          firstYear={firstYear}
          currentMonth={currentMonth}
          monthsWithSpending={monthsWithSpending}
          onSelectMonth={onSelectMonth}
        />
      </div>

      {rows.length > 0 || showSwiped ? (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-[13.5px]">
              <span className="flex items-center gap-2 text-[var(--ob-color-text-muted)]">
                <span
                  data-testid="month-summary-dot"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span>{row.emoji}</span>
                <span>{row.label}</span>
              </span>
              <span className="[font-family:var(--ob-font-num)]" style={{ color: "var(--ob-color-text-muted)" }}>
                {formatMoney(row.total, hidden)}
              </span>
            </div>
          ))}

          {showSwiped ? (
            <div data-testid="month-summary-swiped" className="flex items-center justify-between gap-3 text-[13.5px]">
              <span className="flex items-center gap-2 text-[var(--ob-color-text-muted)]">
                {/* Chấm đỏ cùng token với số đã quẹt cuối dòng cho đồng bộ màu, không theo màu biểu đồ của nhãn
                    "Quẹt thẻ": quẹt thẻ không có cột trên chart nên chấm không phải khớp với cột nào. */}
                <span
                  data-testid="month-summary-dot"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--ob-color-expense)" }}
                />
                <span>{swiped.emoji}</span>
                <span>{swiped.label}</span>
              </span>
              {/* Tô giống ô quẹt thẻ trong "Khoản chi tháng này": "0 ₫ /" màu các tổng nhãn, phần đã quẹt màu đỏ
                  (cùng màu chấm đầu dòng). */}
              <span
                className="min-w-0 text-right [font-family:var(--ob-font-num)]"
                style={{ color: "var(--ob-color-text-muted)" }}
              >
                {`${formatMoney(0, hidden)} / `}
                <span style={{ color: "var(--ob-color-expense)" }}>{formatMoney(swiped.total, hidden)}</span>
              </span>
            </div>
          ) : null}

          <div className="mt-1 flex items-center justify-between gap-3 border-t border-[var(--ob-color-border)] pt-3 text-[13.5px] font-bold">
            <span>Tổng cộng</span>
            <span className="[font-family:var(--ob-font-num)]" style={{ color: "var(--ob-color-action-strong)" }}>
              {formatMoney(grandTotal, hidden)}
            </span>
          </div>
        </div>
      ) : (
        // Tên tháng đã ở tiêu đề ngay trên — câu báo không lặp lại.
        <p className="text-[13.5px] text-[var(--ob-color-text-muted)]">Chưa có khoản chi nào.</p>
      )}
    </div>
  )
}

export { MonthSpendingSummary }
