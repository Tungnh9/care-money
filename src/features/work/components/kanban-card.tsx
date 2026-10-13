"use client"

import type { ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, GripVertical } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { WorkColumn, WorkTask } from "@/lib/work/types"
import { taskDndId } from "../kanban-dnd"
import { DueChip } from "./due-chip"

const PRIORITY_DOT: Record<WorkTask["priority"], { label: string; className: string } | null> = {
  high: { label: "Ưu tiên cao", className: "bg-[var(--ob-color-expense)]" },
  normal: null,
  low: { label: "Ưu tiên thấp", className: "bg-[var(--ob-color-border-strong)]" },
}

interface CardShellProps {
  task: WorkTask
  today: string
  handle: ReactNode
  title: ReactNode
  extra?: ReactNode
}

// Khung chung cho thẻ thật trong cột và bản sao bay theo con trỏ lúc kéo (DragOverlay).
function CardShell({ task, today, handle, title, extra }: CardShellProps) {
  const dot = PRIORITY_DOT[task.priority]
  return (
    <>
      <div className="flex items-start gap-1">
        {handle}
        <div className="min-w-0 flex-1 py-1.5 pr-1">{title}</div>
      </div>
      <div className="ml-8 flex flex-wrap items-center gap-x-2 gap-y-1 empty:hidden">
        {dot ? (
          <span className="inline-flex items-center">
            <span aria-hidden="true" className={cn("size-2 rounded-full", dot.className)} />
            <span className="sr-only">{dot.label}</span>
          </span>
        ) : null}
        <DueChip task={task} today={today} />
        {extra}
      </div>
    </>
  )
}

const CARD_CLASS =
  "rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-1.5 pb-2"

const HANDLE_CLASS =
  "flex size-8 flex-none touch-none cursor-grab items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] hover:text-[var(--ob-color-text)]"

interface KanbanCardProps {
  task: WorkTask
  columns: WorkColumn[]
  today: string
  onOpen: (task: WorkTask) => void
  onMoveTo: (task: WorkTask, columnId: number) => void
}

function KanbanCard({ task, columns, today, onOpen, onMoveTo }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: taskDndId(task.id),
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(CARD_CLASS, isDragging && "opacity-40")}
    >
      <CardShell
        task={task}
        today={today}
        // Chỉ kéo được bằng tay cầm: bấm vào tên mở hộp sửa, chạm vào phần còn lại vẫn cuộn trang bình thường.
        handle={
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-roledescription="thẻ kéo được"
            aria-label={`Kéo thẻ "${task.title}"`}
            className={HANDLE_CLASS}
          >
            <GripVertical size={16} aria-hidden="true" />
          </button>
        }
        title={
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => onOpen(task)}
            className={cn(
              "block w-full text-left text-sm leading-snug wrap-anywhere",
              task.done && "text-[var(--ob-color-text-muted)]"
            )}
          >
            {task.title}
          </button>
        }
        extra={
          // Cách chuyển cột không cần kéo — cho bàn phím, trình đọc màn hình, và lúc kéo trên điện thoại khó.
          // Cột đang chứa thẻ có dấu ✓. Base UI vẫn báo onValueChange khi bấm lại đúng mục đó — bỏ qua, kẻo thẻ
          // bị đẩy xuống cuối chính cột của nó.
          <DropdownMenu>
            <DropdownMenuTrigger
              data-move-trigger={task.id}
              aria-label={`Chuyển "${task.title}" sang cột`}
              className="ml-auto inline-flex min-h-7 items-center gap-0.5 rounded-[var(--ob-radius-pill)] border-[1.5px] border-[var(--ob-color-border)] pr-1.5 pl-2.5 text-[11.5px] font-semibold text-[var(--ob-color-text-muted)] hover:border-[var(--ob-color-action)] hover:text-[var(--ob-color-action-strong)] data-popup-open:border-[var(--ob-color-action)] data-popup-open:bg-[var(--ob-color-action-soft)] data-popup-open:text-[var(--ob-color-action-strong)]"
            >
              Chuyển
              <ChevronDown size={14} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={task.columnId}
                onValueChange={(columnId: number) => columnId !== task.columnId && onMoveTo(task, columnId)}
              >
                <DropdownMenuLabel>Chuyển sang</DropdownMenuLabel>
                {columns.map((c) => (
                  <DropdownMenuRadioItem key={c.id} value={c.id} closeOnClick>
                    {c.title}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
    </li>
  )
}

function KanbanCardPreview({ task, today }: { task: WorkTask; today: string }) {
  return (
    // Không xoay/phóng bản sao: dnd-kit đo khung của nó để chọn cột kế bên khi kéo bằng phím mũi tên — khung
    // lệch 1px thôi cũng làm thẻ cùng cột bị coi là "bên phải" và phím → chỉ đổi chỗ trong cột.
    <div className={cn(CARD_CLASS, "cursor-grabbing shadow-[var(--ob-shadow-lg)]")}>
      <CardShell
        task={task}
        today={today}
        handle={
          <span className={HANDLE_CLASS}>
            <GripVertical size={16} aria-hidden="true" />
          </span>
        }
        title={<span className="block text-sm leading-snug wrap-anywhere">{task.title}</span>}
      />
    </div>
  )
}

export { KanbanCard, KanbanCardPreview }
