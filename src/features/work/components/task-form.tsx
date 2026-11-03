"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { formatDayInput, parseDayInput, shiftDay } from "@/lib/date"
import { cn } from "@/lib/utils"
import { fridayOf } from "@/lib/work/work-calculations"
import type { WorkColumn, WorkPriority } from "@/lib/work/types"
import type { TaskInput } from "@/lib/work/use-work"

const PRIORITIES: { value: WorkPriority; label: string }[] = [
  { value: "high", label: "Cao" },
  { value: "normal", label: "Thường" },
  { value: "low", label: "Thấp" },
]

const CHOICE_CLASS =
  "min-h-[var(--ob-hit-min)] rounded-[var(--ob-radius-pill)] border-[1.5px] px-[14px] text-[13px] font-semibold"
const CHOICE_ON = "border-transparent bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
const CHOICE_OFF = "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"

// Hộp sửa việc. Có `columns` thì có thêm nhóm nút "Trạng thái" để chuyển việc sang cột khác.
interface TaskFormProps {
  today: string
  initial: TaskInput
  columns?: WorkColumn[]
  onSubmit: (input: TaskInput) => void
  onCancel: () => void
  onDelete: () => void
}

function TaskForm({ today, initial, columns, onSubmit, onCancel, onDelete }: TaskFormProps) {
  const [title, setTitle] = useState(initial.title)
  const [columnId, setColumnId] = useState(initial.columnId ?? columns?.[0]?.id)
  const [dueText, setDueText] = useState(initial.dueDate ? formatDayInput(initial.dueDate) : "")
  const [priority, setPriority] = useState<WorkPriority>(initial.priority)

  const dueDate = parseDayInput(dueText)
  const dueInvalid = dueText.trim() !== "" && dueDate === null
  const disabled = !title.trim() || dueInvalid
  const quickDays = [
    { label: "Hôm nay", day: today },
    { label: "Ngày mai", day: shiftDay(today, 1) },
    { label: "Thứ 6", day: fridayOf(today) },
  ]

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (disabled) return
    // Chỉ gửi cột khi người dùng đổi trạng thái — không thì lưu hộp sửa sẽ kéo việc về cột cũ nếu tab khác
    // vừa chuyển nó đi (vd. vừa tick xong).
    onSubmit(
      columnId !== undefined && columnId !== initial.columnId
        ? { title, dueDate, priority, columnId }
        : { title, dueDate, priority }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field
        label="Tên việc"
        placeholder="vd: Gửi báo cáo tuần"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {columns && columns.length > 1 ? (
        <div>
          <span className="mb-[var(--ob-space-2)] block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
            Trạng thái
          </span>
          <div role="group" aria-label="Trạng thái" className="flex flex-wrap gap-2">
            {columns.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={columnId === c.id}
                onClick={() => setColumnId(c.id)}
                className={cn(CHOICE_CLASS, columnId === c.id ? CHOICE_ON : CHOICE_OFF)}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div role="group" aria-label="Chọn hạn nhanh" className="mb-2 flex flex-wrap gap-2">
          {quickDays.map(({ label, day }) => (
            <button
              key={label}
              type="button"
              aria-pressed={dueDate === day}
              onClick={() => setDueText(formatDayInput(day))}
              className={cn(CHOICE_CLASS, dueDate === day ? CHOICE_ON : CHOICE_OFF)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={dueText.trim() === ""}
            onClick={() => setDueText("")}
            className={cn(CHOICE_CLASS, dueText.trim() === "" ? CHOICE_ON : CHOICE_OFF)}
          >
            Không hạn
          </button>
        </div>
        <Field
          label="Hạn"
          placeholder="dd/mm/yyyy"
          value={dueText}
          onChange={(e) => setDueText(e.target.value)}
          invalid={dueInvalid}
          hint={dueInvalid ? "Nhập ngày dạng dd/mm/yyyy, vd: 20/10/2026" : undefined}
        />
      </div>

      <div>
        <span className="mb-[var(--ob-space-2)] block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Ưu tiên
        </span>
        <div role="group" aria-label="Ưu tiên" className="grid grid-cols-3 gap-2">
          {PRIORITIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={priority === value}
              onClick={() => setPriority(value)}
              className={cn(
                "min-h-[var(--ob-hit-min)] rounded-[var(--ob-radius-md)] border-[1.5px] text-[13.5px] font-semibold",
                priority === value
                  ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                  : "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-[10px]">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onDelete}
          className="mr-auto !border-transparent !text-[var(--ob-color-expense)] hover:!bg-[var(--ob-color-expense-soft)]"
        >
          Xoá việc
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" type="submit" disabled={disabled}>
          Lưu
        </Button>
      </div>
    </form>
  )
}

export { TaskForm }
