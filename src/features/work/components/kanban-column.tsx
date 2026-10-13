"use client"

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CheckCircle2, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { WorkColumn, WorkTask } from "@/lib/work/types"
import { columnDndId, taskDndId } from "../kanban-dnd"
import { KanbanCard } from "./kanban-card"

const ICON_BUTTON =
  "flex size-8 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] hover:bg-[var(--ob-color-surface)] hover:text-[var(--ob-color-text)] disabled:pointer-events-none disabled:opacity-35"

const TEXT_INPUT =
  "rounded-[var(--ob-radius-sm)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] px-2.5 py-2 text-sm focus:border-[var(--ob-color-focus)]"

interface KanbanColumnProps {
  column: WorkColumn
  position: number
  columns: WorkColumn[]
  tasks: WorkTask[]
  today: string
  onAddTask: (title: string, columnId: number) => boolean
  onOpenTask: (task: WorkTask) => void
  onMoveTaskTo: (task: WorkTask, columnId: number) => void
  onRename: (columnId: number, title: string) => void
  onMove: (columnId: number, delta: -1 | 1) => void
  onRemove: (column: WorkColumn) => void
}

function KanbanColumn({
  column,
  position,
  columns,
  tasks,
  today,
  onAddTask,
  onOpenTask,
  onMoveTaskTo,
  onRename,
  onMove,
  onRemove,
}: KanbanColumnProps) {
  // Vùng thả của cột là danh sách thẻ, rộng đúng bằng thẻ — không phải cả khung cột có padding. Khung rộng hơn thẻ
  // thì khi kéo bằng phím ←, dnd-kit coi chính cột đang đứng là "bên trái" và thẻ không đi đâu cả. Cột trống giữ
  // 1 ô cao 40px để vẫn thả vào được.
  const { setNodeRef, isOver } = useDroppable({ id: columnDndId(column.id) })
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  // Esc huỷ đổi tên: ô gõ biến mất có thể kéo theo 1 lần blur — lần blur đó không được lưu chữ đang gõ.
  const cancelRename = useRef(false)
  const [draft, setDraft] = useState<string | null>(null)
  const isDoneColumn = position === columns.length - 1

  function saveRename() {
    if (renaming !== null) onRename(column.id, renaming)
    setRenaming(null)
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    // Như Trello: thêm xong ô vẫn mở và xoá trắng để gõ tiếp thẻ sau.
    if (draft !== null && onAddTask(draft, column.id)) setDraft("")
  }

  function closeOnEscape(e: KeyboardEvent, close: () => void) {
    if (e.key === "Escape") {
      e.preventDefault()
      close()
    }
  }

  return (
    // Nền be đậm (vo-100) chứ không dùng surface-sunken: sunken (vo-50) gần trùng màu nền trang nên cột bị chìm.
    <section
      aria-label={`Cột ${column.title}`}
      className={cn(
        "flex w-[272px] flex-none flex-col gap-2 rounded-[var(--ob-radius-lg)] border-[1.5px] bg-[var(--ob-vo-100)] p-2.5",
        isOver ? "border-[var(--ob-color-action)]" : "border-[var(--ob-vo-200)]"
      )}
    >
      <div className="flex items-center gap-1 pl-1">
        {renaming !== null ? (
          <Input
            autoFocus
            aria-label="Tên cột"
            value={renaming}
            onChange={(e) => setRenaming(e.target.value)}
            onBlur={() => {
              if (!cancelRename.current) saveRename()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename()
              closeOnEscape(e, () => {
                cancelRename.current = true
                setRenaming(null)
              })
            }}
            className={cn(TEXT_INPUT, "flex-1 font-bold")}
          />
        ) : (
          <h2 className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-bold">
            <span className="wrap-anywhere">{column.title}</span>
            {isDoneColumn ? (
              <span title="Thẻ ở cột cuối được tính là đã xong" className="flex-none text-[var(--ob-color-income)]">
                <CheckCircle2 size={14} aria-hidden="true" />
                <span className="sr-only">(cột hoàn thành)</span>
              </span>
            ) : null}
            <span className="flex-none text-xs font-semibold text-[var(--ob-color-text-subtle)]">{tasks.length}</span>
          </h2>
        )}
        <button
          type="button"
          aria-label={`Tuỳ chọn cột "${column.title}"`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className={ICON_BUTTON}
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </button>
      </div>

      {menuOpen ? (
        <div className="flex items-center gap-1 rounded-[var(--ob-radius-md)] bg-[var(--ob-color-surface)]/60 p-1">
          <button
            type="button"
            aria-label={`Đổi tên cột "${column.title}"`}
            onClick={() => {
              cancelRename.current = false
              setRenaming(column.title)
              setMenuOpen(false)
            }}
            className={ICON_BUTTON}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Chuyển cột "${column.title}" sang trái`}
            disabled={position === 0}
            onClick={() => onMove(column.id, -1)}
            className={ICON_BUTTON}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Chuyển cột "${column.title}" sang phải`}
            disabled={isDoneColumn}
            onClick={() => onMove(column.id, 1)}
            className={ICON_BUTTON}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Xoá cột "${column.title}"`}
            disabled={columns.length <= 1}
            onClick={() => {
              setMenuOpen(false)
              onRemove(column)
            }}
            className={cn(ICON_BUTTON, "ml-auto hover:text-[var(--ob-color-expense)]")}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <SortableContext items={tasks.map((t) => taskDndId(t.id))} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex flex-col gap-2 empty:min-h-10">
          {tasks.map((t) => (
            <KanbanCard key={t.id} task={t} columns={columns} today={today} onOpen={onOpenTask} onMoveTo={onMoveTaskTo} />
          ))}
        </ul>
      </SortableContext>

      {draft !== null ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <Input
            autoFocus
            aria-label={`Tên thẻ mới ở cột "${column.title}"`}
            placeholder="Nhập tên việc…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => closeOnEscape(e, () => setDraft(null))}
            className={TEXT_INPUT}
          />
          <div className="flex items-center gap-1">
            <Button variant="primary" size="sm" type="submit" disabled={!draft.trim()}>
              Thêm thẻ
            </Button>
            <button type="button" aria-label="Đóng ô thêm thẻ" onClick={() => setDraft(null)} className={ICON_BUTTON}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          aria-label={`Thêm thẻ vào cột "${column.title}"`}
          onClick={() => setDraft("")}
          className="flex min-h-[var(--ob-hit-min)] items-center gap-1.5 rounded-[var(--ob-radius-md)] px-2 text-sm font-semibold text-[var(--ob-color-text-muted)] hover:bg-[var(--ob-color-surface)] hover:text-[var(--ob-color-text)]"
        >
          <Plus size={16} aria-hidden="true" />
          Thêm thẻ
        </button>
      )}
    </section>
  )
}

export { KanbanColumn }
