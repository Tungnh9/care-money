"use client"

import { useId, useState, type FormEvent } from "react"
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import type { WorkColumn } from "@/lib/work/types"

interface ColumnManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: WorkColumn[]
  // Số việc của từng cột (id → số việc); cột không có trong map là 0.
  taskCounts: Map<number, number>
  onAdd: (title: string) => void
  onRename: (id: number, title: string) => void
  onMove: (id: number, delta: -1 | 1) => void
  onRemove: (id: number) => void
}

const INPUT_CLASS =
  "min-h-[var(--ob-hit-min)] rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] px-3 text-sm focus:border-[var(--ob-color-focus)]"
const ICON_BUTTON =
  "grid size-11 flex-none place-items-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] hover:bg-[var(--ob-color-surface-sunken)] hover:text-[var(--ob-color-text)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"

// Hộp "Quản lý cột": đổi tên (lưu khi rời ô hoặc Enter), đổi thứ tự, xoá (hỏi lại), thêm cột trước cột cuối.
function ColumnManager({
  open,
  onOpenChange,
  columns,
  taskCounts,
  onAdd,
  onRename,
  onMove,
  onRemove,
}: ColumnManagerProps) {
  const titleId = useId()
  const [newColumn, setNewColumn] = useState("")
  // Hỏi xoá thì đóng hộp này trước — không chồng 2 hộp thoại (Esc sẽ đóng cả hai) — rồi mở lại khi trả lời.
  const [removingId, setRemovingId] = useState<number | null>(null)
  const removing = columns.find((c) => c.id === removingId) ?? null
  const last = columns[columns.length - 1]
  const remaining = removing ? columns.filter((c) => c.id !== removing.id) : []
  const removingCount = removing ? (taskCounts.get(removing.id) ?? 0) : 0

  function commitRename(column: WorkColumn, value: string) {
    if (value.trim() && value.trim() !== column.title) onRename(column.id, value)
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newColumn.trim()) return
    onAdd(newColumn)
    setNewColumn("")
  }

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} ariaLabelledBy={titleId} panelClassName="max-w-[480px]">
        <div id={titleId} className="mb-1 text-[17px] font-bold">
          Quản lý cột
        </div>
        <p className="mb-4 text-[13px] leading-[1.5] text-[var(--ob-color-text-subtle)]">
          Mỗi cột là một ô trên trang. Cột cuối luôn là cột hoàn thành.
        </p>
        <ul className="flex flex-col gap-2">
          {columns.map((column, index) => (
            <li key={column.id} className="flex items-center gap-1">
              <div className="min-w-0 flex-1">
                {/* key theo tên: đổi tên từ nơi khác thì ô hiện tên mới thay vì giữ chữ cũ. */}
                <Input
                  key={column.title}
                  aria-label={`Tên cột "${column.title}"`}
                  defaultValue={column.title}
                  onBlur={(e) => commitRename(column, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur()
                    if (e.key === "Escape") {
                      e.currentTarget.value = column.title
                      e.stopPropagation()
                    }
                  }}
                  className={`${INPUT_CLASS} w-full`}
                />
                <p className="mt-1 flex gap-2 px-1 text-xs text-[var(--ob-color-text-subtle)]">
                  <span>{`${taskCounts.get(column.id) ?? 0} việc`}</span>
                  {column.id === last?.id ? (
                    <span className="font-semibold text-[var(--ob-color-income)]">Cột hoàn thành</span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Đưa cột "${column.title}" lên`}
                disabled={index === 0}
                onClick={() => onMove(column.id, -1)}
                className={`${ICON_BUTTON} self-start`}
              >
                <ArrowUp size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Đưa cột "${column.title}" xuống`}
                disabled={index === columns.length - 1}
                onClick={() => onMove(column.id, 1)}
                className={`${ICON_BUTTON} self-start`}
              >
                <ArrowDown size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Xoá cột "${column.title}"`}
                disabled={columns.length <= 1}
                onClick={() => {
                  setRemovingId(column.id)
                  onOpenChange(false)
                }}
                className={`${ICON_BUTTON} self-start hover:!bg-[var(--ob-color-expense-soft)] hover:!text-[var(--ob-color-expense)]`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAdd} className="mt-5 border-t-[1.5px] border-[var(--ob-color-border)] pt-4">
          <div className="flex gap-2">
            <Input
              aria-label="Tên cột mới"
              placeholder="vd: Chờ duyệt"
              value={newColumn}
              onChange={(e) => setNewColumn(e.target.value)}
              className={`${INPUT_CLASS} flex-1`}
            />
            <Button variant="primary" size="sm" type="submit" disabled={!newColumn.trim()}>
              Thêm cột
            </Button>
          </div>
          {last ? (
            <p className="mt-2 text-xs text-[var(--ob-color-text-subtle)]">
              Cột mới nằm trước cột &quot;{last.title}&quot;.
            </p>
          ) : null}
        </form>

        <div className="mt-5 flex justify-end">
          <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
            Xong
          </Button>
        </div>
      </Modal>

      <AlertDialog
        open={removing !== null}
        onOpenChange={(next) => {
          if (next) return
          setRemovingId(null)
          onOpenChange(true)
        }}
        title="Xoá cột?"
        description={
          removing ? (
            <>
              Xoá cột &quot;<strong>{removing.title}</strong>&quot;.
              {removingCount ? ` ${removingCount} việc trong cột sẽ chuyển sang cột "${remaining[0]?.title}".` : ""}
              {removing.id === last?.id && remaining.length
                ? ` Cột "${remaining[remaining.length - 1].title}" sẽ thành cột hoàn thành — việc trong đó được tính là đã xong.`
                : ""}
            </>
          ) : null
        }
        confirmLabel="Xoá cột"
        destructive
        onConfirm={() => {
          if (removing) onRemove(removing.id)
        }}
      />
    </>
  )
}

export { ColumnManager }
