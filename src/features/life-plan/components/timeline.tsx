"use client"

import { useState } from "react"
import { Flag, Pencil, Route, Trash2 } from "lucide-react"

import { ActionTooltip } from "@/components/ob/action-tooltip"
import { formatDayKeyWithYear } from "@/lib/date"
import { isPlanOverdue, type TimelineEntry } from "@/lib/life-plan/life-plan-calculations"
import type { LifeNote, LifePlan } from "@/lib/life-plan/types"
import { cn } from "@/lib/utils"
import { PLAN_STATUS_LABEL, PLAN_STATUS_TONE, planTargetLabel, toInputDate } from "../labels"
import { LifePlanImage } from "./life-plan-image"

// Dòng thời gian có thể rất dài (ghi chép hằng ngày, nhập bù kỷ niệm cũ) — hiện dần từng đợt như danh sách lần mua
// vàng, tránh dựng hàng trăm mục (và tải hàng trăm ảnh) ngay khi mở trang.
const PAGE_SIZE = 20

interface TimelineProps {
  entries: TimelineEntry[]
  // Để ghi tên kế hoạch đã gắn lên thẻ ghi chép.
  plans: LifePlan[]
  today: string
  onEditNote: (note: LifeNote) => void
  onDeleteNote: (note: LifeNote) => void
  onEditPlan: (plan: LifePlan) => void
  onDeletePlan: (plan: LifePlan) => void
  // Bấm 1 ảnh nhỏ: mở xem to từ ảnh thứ `index` của ghi chép.
  onOpenImage: (note: LifeNote, index: number) => void
}

const ICON_BUTTON =
  "flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]"

const CHIP = "rounded-[var(--ob-radius-pill)] px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap"

// `count` ghi chép và kế hoạch đầu tiên, kèm vạch "Hôm nay" nếu nó nằm trong khoảng đó — vạch không tính vào đợt.
function firstEntries(entries: TimelineEntry[], count: number): TimelineEntry[] {
  const shown: TimelineEntry[] = []
  let dated = 0
  for (const entry of entries) {
    if (entry.kind !== "today") {
      if (dated === count) break
      dated++
    }
    shown.push(entry)
  }
  return shown
}

// Chấm trên đường dọc bên trái, mỗi mục 1 chấm.
function Dot({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("absolute top-[18px] left-[5px] size-[14px] rounded-full border-[3px]", className)}
    />
  )
}

function TodayLine({ day }: { day: string }) {
  return (
    <li className="relative flex items-center gap-3 py-1 pl-9">
      <Dot className="top-1/2 -translate-y-1/2 border-[var(--ob-color-action)] bg-[var(--ob-color-action)]" />
      <span className="text-[12.5px] font-bold whitespace-nowrap text-[var(--ob-color-action-strong)] uppercase tracking-[var(--ob-track-micro)]">
        Hôm nay
      </span>
      <span className="h-[2px] min-w-6 flex-1 rounded-full bg-[var(--ob-color-action)]" />
      <span className="text-[12px] whitespace-nowrap text-[var(--ob-color-action-strong)] tabular-nums">
        {formatDayKeyWithYear(day)}
      </span>
    </li>
  )
}

interface EntryActionsProps {
  // Phần sau "Sửa"/"Xoá" trong tên nút: `ghi chép "…" ngày dd/mm/yyyy` hay `kế hoạch "…"`.
  name: string
  onEdit: () => void
  onDelete: () => void
}

// Sửa/Xoá đứng cùng hàng với ngày và nhãn, không cùng hàng tiêu đề: tiêu đề dài được trọn bề ngang thẻ trên điện
// thoại. Margin âm dọc để 2 nút 44px không làm hàng đó cao thêm.
function EntryActions({ name, onEdit, onDelete }: EntryActionsProps) {
  return (
    <div className="-my-2.5 -mr-2 flex flex-none items-center">
      <ActionTooltip label="Sửa">
        <button
          type="button"
          aria-label={`Sửa ${name}`}
          onClick={onEdit}
          className={cn(ICON_BUTTON, "hover:text-[var(--ob-color-info)]")}
        >
          <Pencil size={17} />
        </button>
      </ActionTooltip>
      <ActionTooltip label="Xoá">
        <button
          type="button"
          aria-label={`Xoá ${name}`}
          onClick={onDelete}
          className={cn(ICON_BUTTON, "hover:text-[var(--ob-color-expense)]")}
        >
          <Trash2 size={17} />
        </button>
      </ActionTooltip>
    </div>
  )
}

interface NoteItemProps {
  note: LifeNote
  planTitle: string | undefined
  onEdit: () => void
  onDelete: () => void
  onOpenImage: (index: number) => void
}

function NoteItem({ note, planTitle, onEdit, onDelete, onOpenImage }: NoteItemProps) {
  return (
    <li className="relative pl-9">
      <Dot className="border-[var(--ob-color-border-strong)] bg-[var(--ob-color-surface)]" />
      <div className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-[14px]">
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[10px] gap-y-1">
            <time dateTime={note.day} className="text-[12px] text-[var(--ob-color-text-subtle)] tabular-nums">
              {formatDayKeyWithYear(note.day)}
            </time>
            {planTitle ? (
              <span
                className={cn(
                  CHIP,
                  "inline-flex max-w-full items-center gap-1 bg-[var(--ob-color-reward-soft)] text-[var(--ob-color-reward-text)]"
                )}
              >
                <Route size={12} className="flex-none" />
                <span className="truncate">{planTitle}</span>
              </span>
            ) : null}
          </div>
          <EntryActions
            name={`ghi chép "${note.title}" ngày ${toInputDate(note.day)}`}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
        <h3 className="text-[15px] font-bold break-words">{note.title}</h3>
        {note.content ? (
          <p className="mt-1 text-sm leading-[1.6] break-words whitespace-pre-wrap text-[var(--ob-color-text-muted)]">
            {note.content}
          </p>
        ) : null}
        {note.images.length ? (
          // Số cột theo bề rộng của Card bao ngoài (container query), không theo màn hình.
          <div className="mt-3 grid max-w-[560px] grid-cols-3 gap-1.5 @md:grid-cols-4 @xl:grid-cols-5">
            {note.images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Xem ảnh ${index + 1} của ghi chép "${note.title}"`}
                onClick={() => onOpenImage(index)}
                className="block rounded-[var(--ob-radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ob-color-focus)]"
              >
                <LifePlanImage image={image} alt={`Ảnh ${index + 1} của ghi chép "${note.title}"`} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  )
}

interface PlanMilestoneProps {
  plan: LifePlan
  overdue: boolean
  onEdit: () => void
  onDelete: () => void
}

// Mốc kế hoạch: chưa đạt thì nằm ở hạn của nó (kể cả đã quá hạn), đã đạt thì ở ngày đạt.
function PlanMilestone({ plan, overdue, onEdit, onDelete }: PlanMilestoneProps) {
  const done = plan.status === "done"
  return (
    <li className="relative pl-9">
      <Dot
        className={
          done
            ? "border-[var(--ob-color-income)] bg-[var(--ob-color-income)]"
            : "border-[var(--ob-color-reward)] bg-[var(--ob-color-surface)]"
        }
      />
      <div
        className={cn(
          "rounded-[var(--ob-radius-md)] border border-dashed p-[14px]",
          done
            ? "border-[var(--ob-color-income)] bg-[var(--ob-color-income-soft)]"
            : "border-[var(--ob-color-reward)] bg-[var(--ob-color-reward-soft)]"
        )}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-[10px] gap-y-1">
            <span className="inline-flex items-center gap-1 [font:var(--ob-text-micro)] tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)] uppercase">
              <Flag size={12} />
              Kế hoạch
            </span>
            <span className={cn(CHIP, PLAN_STATUS_TONE[plan.status])}>{PLAN_STATUS_LABEL[plan.status]}</span>
            {overdue ? (
              <span className={cn(CHIP, "bg-[var(--ob-color-expense-soft)] text-[var(--ob-color-expense)]")}>
                Quá hạn
              </span>
            ) : null}
          </div>
          <EntryActions name={`kế hoạch "${plan.title}"`} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <h3 className="text-[15px] font-bold break-words">{plan.title}</h3>
        <p className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-muted)] tabular-nums">
          Hạn {planTargetLabel(plan)}
          {done && plan.doneDay ? ` · đạt ${toInputDate(plan.doneDay)}` : null}
        </p>
        {plan.note ? (
          <p className="mt-1 text-sm leading-[1.6] break-words whitespace-pre-wrap text-[var(--ob-color-text-muted)]">
            {plan.note}
          </p>
        ) : null}
      </div>
    </li>
  )
}

// 1 cột dọc, mới nhất ở trên (thứ tự do buildTimeline dựng sẵn), vạch "Hôm nay" chen giữa phần sắp tới và phần đã qua.
function Timeline({
  entries,
  plans,
  today,
  onEditNote,
  onDeleteNote,
  onEditPlan,
  onDeletePlan,
  onOpenImage,
}: TimelineProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const datedTotal = entries.filter((entry) => entry.kind !== "today").length
  const shown = firstEntries(entries, visibleCount)
  const expanded = visibleCount >= datedTotal
  // Ghi chép trỏ tới kế hoạch không còn thì hiện như không gắn.
  const planTitles = new Map(plans.map((plan) => [plan.id, plan.title]))

  return (
    <>
      <ol
        aria-label="Dòng thời gian"
        className="relative flex flex-col gap-3 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-[2px] before:rounded-full before:bg-[var(--ob-color-border)]"
      >
        {shown.map((entry) =>
          entry.kind === "today" ? (
            <TodayLine key="today" day={entry.day} />
          ) : entry.kind === "plan" ? (
            <PlanMilestone
              key={`plan-${entry.plan.id}`}
              plan={entry.plan}
              overdue={isPlanOverdue(entry.plan, today)}
              onEdit={() => onEditPlan(entry.plan)}
              onDelete={() => onDeletePlan(entry.plan)}
            />
          ) : (
            <NoteItem
              key={`note-${entry.note.id}`}
              note={entry.note}
              planTitle={entry.note.planId === undefined ? undefined : planTitles.get(entry.note.planId)}
              onEdit={() => onEditNote(entry.note)}
              onDelete={() => onDeleteNote(entry.note)}
              onOpenImage={(index) => onOpenImage(entry.note, index)}
            />
          )
        )}
      </ol>
      {datedTotal > PAGE_SIZE ? (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount(expanded ? PAGE_SIZE : Math.min(visibleCount + PAGE_SIZE, datedTotal))}
            className="min-h-[var(--ob-hit-min)] px-3 text-[12.5px] font-semibold text-[var(--ob-color-action-strong)]"
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </button>
        </div>
      ) : null}
    </>
  )
}

export { Timeline }
