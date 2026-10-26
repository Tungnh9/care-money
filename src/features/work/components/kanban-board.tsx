"use client"

import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Plus, X } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import type { TaskInput } from "@/lib/work/use-work"
import type { WorkColumn, WorkTask } from "@/lib/work/types"
import { columnOf, dropIndex, listsOf, moveAcross, parseDndId, type Lists } from "../kanban-dnd"
import { KanbanCardPreview } from "./kanban-card"
import { KanbanColumn } from "./kanban-column"
import { TaskForm } from "./task-form"

// Con trỏ nằm trong cột nào thì thả vào cột đó (không nhảy qua lại khi các cột cao thấp khác nhau);
// kéo bằng bàn phím không có toạ độ con trỏ → lấy cột/thẻ gần nhất.
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length ? hits : closestCorners(args)
}

interface KanbanBoardProps {
  columns: WorkColumn[]
  tasks: WorkTask[]
  today: string
  onAddTask: (title: string, columnId: number) => boolean
  onUpdateTask: (id: number, input: TaskInput) => boolean
  onMoveTask: (id: number, columnId: number, index: number) => void
  onRemoveTask: (id: number) => boolean
  onAddColumn: (title: string) => void
  onRenameColumn: (id: number, title: string) => void
  onMoveColumn: (id: number, delta: -1 | 1) => void
  onRemoveColumn: (id: number) => void
}

function KanbanBoard({
  columns,
  tasks,
  today,
  onAddTask,
  onUpdateTask,
  onMoveTask,
  onRemoveTask,
  onAddColumn,
  onRenameColumn,
  onMoveColumn,
  onRemoveColumn,
}: KanbanBoardProps) {
  const dndId = useId()
  const editTitleId = useId()
  // Trong lúc kéo, thẻ chuyển cột ngay trên màn hình (dragLists) nhưng chỉ ghi xuống storage 1 lần khi thả.
  // Ref giữ bản mới nhất cho onDragEnd, không phụ thuộc lần render nào.
  const [dragLists, setDragListsState] = useState<Lists | null>(null)
  const dragListsRef = useRef<Lists | null>(null)
  // Thẻ chuyển cột bằng menu "Chuyển" bị dựng lại ở cột mới, nút cũ đang giữ focus biến mất — sau lần render
  // kế tiếp đưa focus tới nút "Chuyển" của thẻ ở chỗ mới, người dùng bàn phím không bị rơi về đầu trang.
  const focusMoved = useRef<number | null>(null)
  useEffect(() => {
    if (focusMoved.current === null) return
    const trigger = document.querySelector<HTMLElement>(`[data-move-trigger="${focusMoved.current}"]`)
    if (!trigger) return
    trigger.focus()
    focusMoved.current = null
  })
  const [activeId, setActiveId] = useState<number | null>(null)
  // Tra lại theo id trên danh sách hiện tại — thẻ/cột vừa bị tab khác xoá thì hộp tự đóng.
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [removingColumnId, setRemovingColumnId] = useState<number | null>(null)
  const [newColumn, setNewColumn] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const byId = new Map(tasks.map((t) => [t.id, t]))
  const lists = dragLists ?? listsOf(columns, tasks)
  const editing = editingId === null ? null : (byId.get(editingId) ?? null)
  const deleting = deletingId === null ? null : (byId.get(deletingId) ?? null)
  const removing = columns.find((c) => c.id === removingColumnId) ?? null
  const active = activeId === null ? null : (byId.get(activeId) ?? null)
  const lastColumn = columns[columns.length - 1]

  function setDragLists(next: Lists | null) {
    dragListsRef.current = next
    setDragListsState(next)
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(parseDndId(active.id).id)
    setDragLists(listsOf(columns, tasks))
  }

  // Sang cột khác: chuyển thẻ ngay vào cột đó (trên hoặc dưới thẻ đang trỏ, theo nửa trên/dưới của thẻ).
  // Trong cùng 1 cột thì SortableContext tự dời chỗ, chờ lúc thả mới chốt.
  function handleDragOver({ active, over }: DragOverEvent) {
    const current = dragListsRef.current
    if (!current || !over) return
    const from = columnOf(current, active.id)
    const to = columnOf(current, over.id)
    if (from === null || to === null || from === to) return
    const overTarget = parseDndId(over.id)
    const rect = active.rect.current.translated
    const below = rect !== null && rect.top + rect.height / 2 > over.rect.top + over.rect.height / 2
    const overTaskId = overTarget.kind === "task" ? overTarget.id : null
    setDragLists(moveAcross(current, parseDndId(active.id).id, to, overTaskId, below))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const current = dragListsRef.current
    setDragLists(null)
    setActiveId(null)
    if (!current || !over) return
    const taskId = parseDndId(active.id).id
    const columnId = columnOf(current, active.id)
    if (columnId === null) return
    const overTarget = parseDndId(over.id)
    const index = dropIndex(current, columnId, taskId, overTarget.kind === "task" ? overTarget.id : null)
    const task = byId.get(taskId)
    // Thả lại đúng chỗ cũ: không ghi gì.
    if (task && task.columnId === columnId && listsOf(columns, tasks).get(columnId)!.indexOf(taskId) === index) return
    onMoveTask(taskId, columnId, index)
  }

  function handleDragCancel() {
    setDragLists(null)
    setActiveId(null)
  }

  function titleOf(dndId: UniqueIdentifier | undefined): string {
    if (dndId === undefined) return ""
    const { kind, id } = parseDndId(dndId)
    return (kind === "task" ? byId.get(id)?.title : columns.find((c) => c.id === id)?.title) ?? ""
  }

  function columnTitleOf(dndId: UniqueIdentifier): string {
    const columnId = columnOf(dragListsRef.current ?? lists, dndId)
    return columns.find((c) => c.id === columnId)?.title ?? ""
  }

  // Thông báo cho trình đọc màn hình bằng tiếng Việt (mặc định của dnd-kit là tiếng Anh).
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Đã nhấc thẻ "${titleOf(active.id)}".`,
    onDragOver: ({ active, over }) =>
      over ? `Thẻ "${titleOf(active.id)}" đang ở cột "${columnTitleOf(over.id)}".` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Đã thả thẻ "${titleOf(active.id)}" vào cột "${columnTitleOf(over.id)}".`
        : `Đã thả thẻ "${titleOf(active.id)}".`,
    onDragCancel: ({ active }) => `Đã huỷ kéo thẻ "${titleOf(active.id)}".`,
  }

  function handleAddColumn(e: FormEvent) {
    e.preventDefault()
    if (newColumn === null || !newColumn.trim()) return
    onAddColumn(newColumn)
    setNewColumn(null)
  }

  const remainingColumns = removing ? columns.filter((c) => c.id !== removing.id) : []
  const removingCount = removing ? (lists.get(removing.id)?.length ?? 0) : 0

  return (
    <>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Bấm Space hoặc Enter để nhấc thẻ, dùng phím mũi tên để di chuyển, bấm Space hoặc Enter lần nữa để thả, Esc để huỷ.",
          },
        }}
      >
        {/* Bảng cuộn ngang trong khung riêng — trang không bao giờ cuộn ngang theo. `relative` để các nhãn
            sr-only (position: absolute) ở cột xa bên phải cũng bị khung này cắt, không kéo giãn bề ngang trang. */}
        <div className="relative overflow-x-auto pb-3">
          <div className="flex w-max items-start gap-3">
            {columns.map((column, position) => (
              <KanbanColumn
                key={column.id}
                column={column}
                position={position}
                columns={columns}
                tasks={(lists.get(column.id) ?? []).flatMap((id) => byId.get(id) ?? [])}
                today={today}
                onAddTask={onAddTask}
                onOpenTask={(task) => setEditingId(task.id)}
                onMoveTaskTo={(task, columnId) => {
                  focusMoved.current = task.id
                  onMoveTask(task.id, columnId, Number.MAX_SAFE_INTEGER)
                }}
                onRename={onRenameColumn}
                onMove={onMoveColumn}
                onRemove={(c) => setRemovingColumnId(c.id)}
              />
            ))}

            <div className="w-[272px] flex-none">
              {newColumn !== null ? (
                <form
                  onSubmit={handleAddColumn}
                  className="flex flex-col gap-2 rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-vo-200)] bg-[var(--ob-vo-100)] p-2.5"
                >
                  <Input
                    autoFocus
                    aria-label="Tên cột mới"
                    placeholder="vd: Chờ duyệt"
                    value={newColumn}
                    onChange={(e) => setNewColumn(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setNewColumn(null)}
                    className="rounded-[var(--ob-radius-sm)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] px-2.5 py-2 text-sm focus:border-[var(--ob-color-focus)]"
                  />
                  {lastColumn ? (
                    <p className="text-xs text-[var(--ob-color-text-subtle)]">
                      Cột mới nằm trước cột &quot;{lastColumn.title}&quot; — cột cuối luôn là cột hoàn thành.
                    </p>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <Button variant="primary" size="sm" type="submit" disabled={!newColumn.trim()}>
                      Thêm cột
                    </Button>
                    <button
                      type="button"
                      aria-label="Đóng ô thêm cột"
                      onClick={() => setNewColumn(null)}
                      className="flex size-8 items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] hover:text-[var(--ob-color-text)]"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setNewColumn("")}
                  className="flex min-h-[var(--ob-hit-min)] w-full items-center gap-1.5 rounded-[var(--ob-radius-lg)] border-[1.5px] border-dashed border-[var(--ob-color-border)] px-3 text-sm font-semibold text-[var(--ob-color-text-muted)] hover:border-[var(--ob-color-action)] hover:text-[var(--ob-color-action-strong)]"
                >
                  <Plus size={16} aria-hidden="true" />
                  Thêm cột
                </button>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>{active ? <KanbanCardPreview task={active} today={today} /> : null}</DragOverlay>
      </DndContext>

      <Modal open={editing !== null} onOpenChange={(open) => !open && setEditingId(null)} ariaLabelledBy={editTitleId}>
        <div id={editTitleId} className="mb-4 text-[17px] font-bold">
          Sửa thẻ
        </div>
        {editing ? (
          <TaskForm
            key={editing.id}
            today={today}
            initial={editing}
            onSubmit={(input) => {
              if (onUpdateTask(editing.id, input)) setEditingId(null)
            }}
            onCancel={() => setEditingId(null)}
            onDelete={() => {
              // Đóng hộp sửa rồi mới hỏi lại — không chồng 2 hộp thoại lên nhau.
              setEditingId(null)
              setDeletingId(editing.id)
            }}
          />
        ) : null}
      </Modal>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xoá thẻ?"
        description={
          deleting ? (
            <>
              Xoá &quot;<strong>{deleting.title}</strong>&quot; sẽ không thể hoàn tác.
            </>
          ) : null
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deleting) onRemoveTask(deleting.id)
        }}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemovingColumnId(null)}
        title="Xoá cột?"
        description={
          removing ? (
            <>
              Xoá cột &quot;<strong>{removing.title}</strong>&quot;.
              {removingCount
                ? ` ${removingCount} thẻ trong cột sẽ chuyển sang cột "${remainingColumns[0]?.title}".`
                : ""}
              {removing.id === lastColumn?.id && remainingColumns.length
                ? ` Cột "${remainingColumns[remainingColumns.length - 1].title}" sẽ thành cột hoàn thành — thẻ trong đó được tính là đã xong.`
                : ""}
            </>
          ) : null
        }
        confirmLabel="Xoá cột"
        destructive
        onConfirm={() => {
          if (removing) onRemoveColumn(removing.id)
        }}
      />
    </>
  )
}

export { KanbanBoard }
