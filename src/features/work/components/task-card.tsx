"use client"

import { ArrowDown, Check, Flag, MoreHorizontal } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { WorkColumn, WorkTask } from "@/lib/work/types"
import { doneLabel, dueLabel, type DueTone } from "../due-label"

// "dark": trên nền tối của ô Hôm nay.
type CardTone = "light" | "dark"

const CHIP_CLASS =
  "inline-flex h-6 items-center rounded-[var(--ob-radius-pill)] px-2 text-[11.5px] leading-none font-bold whitespace-nowrap"

const DUE_TONES: Record<CardTone, Record<DueTone | "done", string>> = {
  light: {
    late: "bg-[var(--ob-color-expense-soft)] text-[var(--ob-ma-hong)]",
    today: "bg-[var(--ob-color-reward-soft)] text-[var(--ob-color-reward-text)]",
    soon: "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]",
    later: "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]",
    done: "bg-[var(--ob-color-income-soft)] text-[var(--ob-color-income)]",
  },
  dark: {
    late: "bg-[rgb(229_72_77_/_0.22)] text-[var(--ob-do-300)]",
    today: "bg-[rgb(247_190_18_/_0.2)] text-[var(--ob-chuoi-300)]",
    soon: "bg-[rgb(255_248_239_/_0.1)] text-[var(--ob-vo-100)]",
    later: "bg-[rgb(255_248_239_/_0.1)] text-[var(--ob-vo-100)]",
    done: "bg-[rgb(76_214_155_/_0.2)] text-[var(--ob-la-300)]",
  },
}

interface ToneProps {
  tone?: CardTone
}

// Chip hạn (việc chưa xong) hoặc ngày xong (việc đã xong).
function DueBadge({ task, today, tone = "light" }: { task: WorkTask; today: string } & ToneProps) {
  if (task.done) return <span className={cn(CHIP_CLASS, DUE_TONES[tone].done)}>{doneLabel(task, today)}</span>
  const due = dueLabel(task, today)
  if (!due) return null
  return <span className={cn(CHIP_CLASS, DUE_TONES[tone][due.tone])}>{due.text}</span>
}

// Ưu tiên cao: cờ cam; thấp: mũi tên xuống nhạt; thường: không có gì.
function PriorityMark({ priority, tone = "light" }: { priority: WorkTask["priority"] } & ToneProps) {
  if (priority === "normal") return null
  const high = priority === "high"
  const label = high ? "Ưu tiên cao" : "Ưu tiên thấp"
  return (
    <span role="img" aria-label={label} title={label} className="inline-flex">
      {high ? (
        <Flag
          size={14}
          strokeWidth={2.25}
          aria-hidden="true"
          className={tone === "dark" ? "text-[var(--ob-cam-400)]" : "text-[var(--ob-color-action)]"}
        />
      ) : (
        <ArrowDown
          size={14}
          strokeWidth={2.25}
          aria-hidden="true"
          className={tone === "dark" ? "text-[var(--ob-vo-300)]" : "text-[var(--ob-color-text-subtle)]"}
        />
      )}
    </span>
  )
}

interface DoneCheckProps extends ToneProps {
  task: WorkTask
  onToggle: (task: WorkTask) => void
}

// Ô tròn 22px nhưng vùng bấm 44px (lề âm giữ bố cục gọn).
function DoneCheck({ task, onToggle, tone = "light" }: DoneCheckProps) {
  const label = task.done ? `Bỏ đánh dấu xong "${task.title}"` : `Đánh dấu xong "${task.title}"`
  return (
    <label className="-m-[11px] grid size-11 flex-none cursor-pointer place-items-center">
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task)}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[22px] place-items-center rounded-full border-2 transition-colors duration-[var(--ob-dur-fast)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--ob-color-focus)]",
          task.done
            ? "border-[var(--ob-color-income)] bg-[var(--ob-color-income)] text-white"
            : tone === "dark"
              ? "border-[rgb(255_248_239_/_0.5)] hover:border-[var(--ob-cam-300)]"
              : "border-[var(--ob-color-border-strong)] bg-[var(--ob-color-surface)] hover:border-[var(--ob-color-action)]"
        )}
      >
        {task.done ? <Check size={13} strokeWidth={3} /> : null}
      </span>
    </label>
  )
}

interface TaskMenuProps extends ToneProps {
  task: WorkTask
  columns: WorkColumn[]
  onOpen: (task: WorkTask) => void
  onMove: (task: WorkTask, columnId: number) => void
  onDelete: (task: WorkTask) => void
}

// Nút "…": Sửa, Chuyển sang (các cột), Xoá.
function TaskMenu({ task, columns, onOpen, onMove, onDelete, tone = "light" }: TaskMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Thao tác với "${task.title}"`}
        className={cn(
          "-my-2 -mr-1.5 grid size-11 flex-none place-items-center rounded-[var(--ob-radius-sm)]",
          tone === "dark"
            ? "text-[var(--ob-vo-300)] hover:bg-[rgb(255_248_239_/_0.08)] hover:text-[var(--ob-kem)]"
            : "text-[var(--ob-color-text-subtle)] hover:bg-[var(--ob-color-surface-sunken)] hover:text-[var(--ob-color-text)]"
        )}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOpen(task)}>Sửa</DropdownMenuItem>
        {/* Base UI vẫn báo onValueChange khi bấm lại đúng cột đang chứa việc — bỏ qua. */}
        <DropdownMenuRadioGroup
          value={task.columnId}
          onValueChange={(columnId: number) => columnId !== task.columnId && onMove(task, columnId)}
        >
          <DropdownMenuLabel>Chuyển sang</DropdownMenuLabel>
          {columns.map((c) => (
            <DropdownMenuRadioItem key={c.id} value={c.id} closeOnClick>
              {c.title}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuItem
          onClick={() => onDelete(task)}
          className="text-[var(--ob-color-expense)] data-highlighted:bg-[var(--ob-color-expense-soft)] data-highlighted:text-[var(--ob-color-expense)]"
        >
          Xoá
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface TaskCardProps {
  task: WorkTask
  today: string
  columns: WorkColumn[]
  onToggle: (task: WorkTask) => void
  onOpen: (task: WorkTask) => void
  onMove: (task: WorkTask, columnId: number) => void
  onDelete: (task: WorkTask) => void
  className?: string
}

// Thẻ việc trên nền sáng (ô theo cột, khung "Xem tất cả"): tick, tên (bấm để sửa), "…", chip hạn + ưu tiên.
function TaskCard({ task, today, columns, onToggle, onOpen, onMove, onDelete, className }: TaskCardProps) {
  const late = dueLabel(task, today)?.tone === "late"
  const meta = task.done || task.dueDate !== null || task.priority !== "normal"
  return (
    <li
      className={cn(
        "relative flex min-w-0 flex-col gap-2 rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] py-2.5 pr-2 pl-3.5",
        late &&
          "border-[color-mix(in_srgb,var(--ob-color-expense)_32%,var(--ob-color-border))] before:absolute before:top-3 before:bottom-3 before:left-0 before:w-[3px] before:rounded-r-[3px] before:bg-[var(--ob-color-expense)]",
        task.done && "bg-[var(--ob-color-surface-sunken)]",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <DoneCheck task={task} onToggle={onToggle} />
        <button
          type="button"
          onClick={() => onOpen(task)}
          className={cn(
            "min-w-0 flex-1 text-left text-[13.5px] leading-[1.4] font-semibold wrap-anywhere hover:text-[var(--ob-color-action-strong)]",
            task.done && "font-medium text-[var(--ob-color-text-subtle)]"
          )}
        >
          <span className="line-clamp-3">{task.title}</span>
        </button>
        <TaskMenu task={task} columns={columns} onOpen={onOpen} onMove={onMove} onDelete={onDelete} />
      </div>
      {meta ? (
        <div className="flex flex-wrap items-center gap-1.5 pl-8">
          <DueBadge task={task} today={today} />
          <PriorityMark priority={task.priority} />
        </div>
      ) : null}
    </li>
  )
}

export { DoneCheck, DueBadge, PriorityMark, TaskCard, TaskMenu, type CardTone }
