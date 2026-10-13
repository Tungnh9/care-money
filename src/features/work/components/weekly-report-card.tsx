"use client"

import { useId, useState, type ReactNode } from "react"
import { AlertTriangle, CheckCircle2, ChevronRight, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDayKey, shiftDay } from "@/lib/date"
import { cn } from "@/lib/utils"
import { weeklyReport, weeklyReportData } from "@/lib/work/work-calculations"
import type { WorkState, WorkTask } from "@/lib/work/types"
import { copyText } from "../copy-text"
import { shortDay } from "../short-day"
import { Chip } from "./chip"
import { DueChip } from "./due-chip"

const WEEKS = [
  { label: "Tuần này", offset: 0 },
  { label: "Tuần trước", offset: -7 },
]

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

function weekdayShort(day: string): string {
  const [y, m, d] = day.split("-").map(Number)
  return WEEKDAY_SHORT[new Date(y, m - 1, d).getDay()]
}

// Ô số trên cùng — số 0 thì nhạt đi, để mắt dừng ở ô có việc.
const TILE_TONES = {
  done: { box: "bg-[var(--ob-color-income-soft)]", text: "text-[var(--ob-color-income)]" },
  pending: { box: "bg-[var(--ob-color-action-soft)]", text: "text-[var(--ob-color-action-strong)]" },
  blocked: { box: "bg-[var(--ob-color-expense-soft)]", text: "text-[var(--ob-color-expense)]" },
}

interface StatTileProps {
  label: string
  value: number
  icon: ReactNode
  tone: keyof typeof TILE_TONES
  note?: ReactNode
}

function StatTile({ label, value, icon, tone, note }: StatTileProps) {
  const colors = value ? TILE_TONES[tone] : { box: "bg-[var(--ob-vo-100)]", text: "text-[var(--ob-color-text-subtle)]" }
  return (
    <li className={cn("min-w-0 rounded-[var(--ob-radius-md)] p-2.5 @xs:p-3", colors.box)}>
      <div className={cn("flex items-center gap-1.5 text-[12.5px] font-semibold", colors.text)}>
        {/* Card hẹp (điện thoại) chia 3 ô chỉ còn ~70px chữ: bỏ icon để nhãn "Vướng mắc" không bị cắt. */}
        <span className="hidden @xs:inline-flex">{icon}</span>
        <span className="min-w-0 wrap-anywhere">{label}</span>
      </div>
      <div className="mt-1.5 [font-family:var(--ob-font-num)] text-[28px] leading-none font-bold tabular-nums">{value}</div>
      {note}
    </li>
  )
}

interface DayChartProps {
  perDay: { day: string; count: number }[]
  today: string
}

// 7 cột thứ Hai → Chủ nhật, cao theo số việc xong trong ngày. Trình đọc màn hình đọc dòng sr-only của từng ngày.
function DayChart({ perDay, today }: DayChartProps) {
  const max = Math.max(1, ...perDay.map((p) => p.count))
  return (
    <ul aria-label="Việc xong theo ngày" className="flex items-end gap-1.5">
      {perDay.map(({ day, count }) => (
        <li key={day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="sr-only">{`${formatDayKey(day)}: ${count} việc`}</span>
          <span aria-hidden="true" className="text-[11.5px] font-semibold text-[var(--ob-color-text-muted)] tabular-nums">
            {count || ""}
          </span>
          <span aria-hidden="true" className="flex h-16 w-full max-w-10 items-end">
            <span
              className={cn(
                "w-full rounded-t-[var(--ob-radius-sm)]",
                count ? "bg-[var(--ob-la-300)]" : "bg-[var(--ob-vo-200)]",
                day === today && count ? "bg-[var(--ob-color-income)]" : null
              )}
              style={{ height: count ? `${Math.max(12, (count / max) * 100)}%` : "3px" }}
            />
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "text-[11.5px]",
              day === today
                ? "font-bold text-[var(--ob-color-action-strong)]"
                : day > today
                  ? "text-[var(--ob-vo-300)]"
                  : "text-[var(--ob-color-text-subtle)]"
            )}
          >
            {weekdayShort(day)}
          </span>
        </li>
      ))}
    </ul>
  )
}

interface ReportSectionProps {
  title: string
  icon: ReactNode
  children: ReactNode
}

function ReportSection({ title, icon, children }: ReportSectionProps) {
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="mb-2 flex items-center gap-1.5 text-sm font-bold">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  )
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--ob-color-text-subtle)]">{children}</p>
}

// Việc đã xong gom theo ngày xong (danh sách đã xếp theo doneAt nên các ngày nối tiếp nhau).
function byDay(tasks: WorkTask[]): { day: string; tasks: WorkTask[] }[] {
  const groups: { day: string; tasks: WorkTask[] }[] = []
  for (const t of tasks) {
    const last = groups[groups.length - 1]
    if (last && last.day === t.doneAt) last.tasks.push(t)
    else groups.push({ day: t.doneAt!, tasks: [t] })
  }
  return groups
}

interface WeeklyReportCardProps {
  state: WorkState
  today: string
  className?: string
}

function WeeklyReportCard({ state, today, className }: WeeklyReportCardProps) {
  const [offset, setOffset] = useState(0)
  const day = shiftDay(today, offset)
  const data = weeklyReportData(state, day)
  // Bản chữ thuần để copy (dán vào chat/email) — trên trang chỉ để xem trước trong mục thu gọn.
  const report = weeklyReport(state, day)
  const overdue = data.unfinished.filter((t) => !t.done && t.dueDate! < today).length
  const columnTitle = (t: WorkTask) => state.columns.find((c) => c.id === t.columnId)?.title

  return (
    <Card label="Báo cáo tuần" className={className}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {WEEKS.map((w) => (
          <button
            key={w.label}
            type="button"
            aria-pressed={offset === w.offset}
            onClick={() => setOffset(w.offset)}
            className={cn(
              "min-h-[var(--ob-hit-min)] rounded-[var(--ob-radius-pill)] border-[1.5px] px-[14px] text-[13px] font-semibold",
              offset === w.offset
                ? "border-transparent bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                : "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"
            )}
          >
            {w.label}
          </button>
        ))}
        <span className="px-1 text-sm font-semibold text-[var(--ob-color-text-muted)] tabular-nums">
          {`${shortDay(data.start, today)} – ${shortDay(data.end, today)}`}
        </span>
        <Button variant="primary" size="sm" type="button" className="ml-auto" onClick={() => void copyText(report)}>
          Copy báo cáo
        </Button>
      </div>

      <ul aria-label="Tóm tắt tuần" className="mb-5 grid grid-cols-3 gap-2 @md:gap-3">
        <StatTile label="Đã xong" value={data.finished.length} tone="done" icon={<CheckCircle2 size={15} aria-hidden="true" />} />
        <StatTile
          label="Còn dở"
          value={data.unfinished.length}
          tone="pending"
          icon={<Clock size={15} aria-hidden="true" />}
          note={
            overdue ? (
              <div className="mt-1 text-[12px] font-semibold text-[var(--ob-color-expense)]">{`${overdue} quá hạn`}</div>
            ) : null
          }
        />
        <StatTile
          label="Vướng mắc"
          value={data.blockers.length}
          tone="blocked"
          icon={<AlertTriangle size={15} aria-hidden="true" />}
        />
      </ul>

      <div className="mb-5">
        <h3 className="mb-2 text-sm font-bold">Việc xong theo ngày</h3>
        <DayChart perDay={data.perDay} today={today} />
      </div>

      <div className="grid gap-5 @xl:grid-cols-2">
        <ReportSection title="Đã xong" icon={<CheckCircle2 size={16} aria-hidden="true" className="text-[var(--ob-color-income)]" />}>
          {data.finished.length ? (
            <div className="flex flex-col gap-3">
              {byDay(data.finished).map((g) => (
                <div key={g.day}>
                  <p className="mb-1 text-xs font-semibold text-[var(--ob-color-text-subtle)]">{formatDayKey(g.day)}</p>
                  <ul className="flex flex-col gap-1">
                    {g.tasks.map((t) => (
                      <li key={t.id} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={15} aria-hidden="true" className="mt-0.5 flex-none text-[var(--ob-la-300)]" />
                        <span className="min-w-0 wrap-anywhere">{t.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <EmptyLine>Chưa có việc nào xong.</EmptyLine>
          )}
        </ReportSection>

        <div className="flex flex-col gap-5">
          <ReportSection title="Còn dở" icon={<Clock size={16} aria-hidden="true" className="text-[var(--ob-color-action)]" />}>
            {data.unfinished.length ? (
              <ul className="flex flex-col gap-2">
                {data.unfinished.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="min-w-0 wrap-anywhere">{t.title}</span>
                    <DueChip task={t} today={today} />
                    {/* Hạn trong tuần đó nhưng xong sau khi tuần đã qua (báo cáo "Tuần trước"). */}
                    {t.done && t.doneAt ? (
                      <Chip tone="success">{`xong ${shortDay(t.doneAt, today)}`}</Chip>
                    ) : (
                      <Chip tone="outline">{columnTitle(t)}</Chip>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyLine>Không có việc nào còn dở.</EmptyLine>
            )}
          </ReportSection>

          <ReportSection
            title="Vướng mắc"
            icon={<AlertTriangle size={16} aria-hidden="true" className="text-[var(--ob-color-expense)]" />}
          >
            {data.blockers.length ? (
              <ul className="flex flex-col gap-2">
                {data.blockers.map((b) => (
                  <li key={b.day} className="text-sm">
                    <p className="text-xs font-semibold text-[var(--ob-color-text-subtle)]">{formatDayKey(b.day)}</p>
                    <p className="whitespace-pre-line wrap-anywhere">{b.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyLine>Không có vướng mắc nào.</EmptyLine>
            )}
          </ReportSection>
        </div>
      </div>

      <details className="group mt-5 border-t border-[var(--ob-color-border)] pt-3">
        <summary className="flex min-h-[var(--ob-hit-min)] cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-[var(--ob-color-text-muted)] [&::-webkit-details-marker]:hidden">
          <ChevronRight size={15} aria-hidden="true" className="transition-transform group-open:rotate-90" />
          Xem bản văn bản (nội dung sẽ được copy)
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-[var(--ob-radius-md)] bg-[var(--ob-vo-100)] p-4 [font:var(--ob-text-body)] text-[13.5px] leading-[1.6] whitespace-pre-wrap text-[var(--ob-color-text)] wrap-anywhere">
          {report}
        </pre>
      </details>
    </Card>
  )
}

export { WeeklyReportCard }
