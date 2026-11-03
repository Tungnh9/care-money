"use client"

import { useId, useState, type ReactNode } from "react"
import Image from "next/image"
import { CircleDot, Columns3, Hourglass, Zap } from "lucide-react"
import { toast } from "sonner"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Modal } from "@/components/ui/modal"
import { ActionTooltip } from "@/components/ob/action-tooltip"
import { dayKey, longDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { useWork } from "@/lib/work/use-work"
import { recentDone } from "@/lib/work/work-calculations"
import type { WorkColumn, WorkPriority, WorkTask } from "@/lib/work/types"
import { AddTaskRow } from "./add-task-row"
import { ColumnManager } from "./column-manager"
import { ColumnTile } from "./column-tile"
import { DoneTile } from "./done-tile"
import { QuickAdd } from "./quick-add"
import { SheetHeader } from "./sheet-header"
import { StandupCard } from "./standup-card"
import { StandupTile } from "./standup-tile"
import { TaskCard } from "./task-card"
import { TaskForm } from "./task-form"
import { TodayTile } from "./today-tile"
import { UpcomingTile } from "./upcoming-tile"
import { WeekTile } from "./week-tile"
import { WeeklyReportCard } from "./weekly-report-card"

// Lưới 4 cột từ khi nội dung rộng 1024px (@5xl) — hẹp hơn thì ô 1 cột chỉ còn ~220px, nhãn và nút bị cắt.
// Ô cột giữa chiếm bao nhiêu cột lưới (ở lưới 4 cột), theo số cột giữa: 1 → 3, 2 → 2 + 1, từ 3 → mỗi ô 1.
// Ô "đã xong" luôn rộng 1 (hết hàng khi không có cột giữa). Class viết nguyên văn để Tailwind thấy được.
const SPAN_CLASS: Record<number, string> = {
  1: "",
  2: "@xl:col-span-2",
  3: "@xl:col-span-2 @5xl:col-span-3",
}
const FULL_ROW = "@xl:col-span-2 @5xl:col-span-4"

function middleSpans(count: number): number[] {
  if (count === 1) return [3]
  if (count === 2) return [2, 1]
  return Array.from({ length: count }, () => 1)
}

// Ô icon của các cột giữa theo thứ tự: cột "đang làm" (cam), cột "chờ" (xanh), còn lại nền lõm.
const MIDDLE_ICONS: { icon: ReactNode; className: string }[] = [
  { icon: <Zap size={18} />, className: "bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action)]" },
  { icon: <Hourglass size={18} />, className: "bg-[var(--ob-kinh)] text-[var(--ob-color-info)]" },
]
const OTHER_ICON = { icon: <CircleDot size={18} />, className: "" }

// Trang Làm việc: một màn Bento — ô Hôm nay, Standup, Tuần này, Sắp tới, mỗi cột của bảng 1 ô. Standup, báo
// cáo tuần và "xem tất cả" mở trong khung trượt.
function WorkView() {
  const work = useWork()
  const { columns, tasks, standups } = work
  const state = { columns, tasks, standups }
  const today = dayKey()
  const editTitleId = useId()
  const standupTitleId = useId()
  const reportTitleId = useId()
  const allTitleId = useId()

  // Tra lại theo id trên danh sách hiện tại — việc/cột vừa bị tab khác xoá thì hộp tự đóng.
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [allColumnId, setAllColumnId] = useState<number | null>(null)
  const [standupOpen, setStandupOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [managing, setManaging] = useState(false)

  const first = columns[0]
  const last = columns[columns.length - 1]
  const middles = columns.slice(1, -1)
  const spans = middleSpans(middles.length)
  const byColumn = (id: number) => tasks.filter((t) => t.columnId === id)
  const editing = tasks.find((t) => t.id === editingId) ?? null
  const deleting = tasks.find((t) => t.id === deletingId) ?? null
  const allColumn = columns.find((c) => c.id === allColumnId) ?? null
  const allTasks = allColumn ? (allColumn.id === last?.id ? recentDone(tasks) : byColumn(allColumn.id)) : []
  const openCount = tasks.filter((t) => !t.done).length
  const taskCounts = new Map(columns.map((c) => [c.id, byColumn(c.id).length]))

  const handlers = {
    onToggle: (task: WorkTask) => work.toggleTask(task.id),
    onOpen: (task: WorkTask) => setEditingId(task.id),
    onMove: (task: WorkTask, columnId: number) => {
      work.moveTaskTo(task.id, columnId)
      const title = columns.find((c) => c.id === columnId)?.title
      if (title) toast.success(`Đã chuyển sang “${title}”`)
    },
    onDelete: (task: WorkTask) => setDeletingId(task.id),
    onShowAll: (column: WorkColumn) => setAllColumnId(column.id),
  }

  function quickAdd(title: string, extra: { dueDate: string | null; priority: WorkPriority }): boolean {
    const ok = work.addTask(title, undefined, extra)
    if (ok && first) toast.success(`Đã thêm vào “${first.title}”`)
    return ok
  }

  if (!first || !last) return null

  return (
    <div className="[container-type:inline-size]">
      <header className="mb-5 grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)] @4xl:items-end">
        <div>
          <div className="flex items-center gap-1">
            <h1 className="[font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Làm việc</h1>
            <ActionTooltip label="Quản lý cột">
              <button
                type="button"
                aria-label="Quản lý cột"
                onClick={() => setManaging(true)}
                className="grid size-11 place-items-center rounded-full text-[var(--ob-color-text-subtle)] hover:bg-[var(--ob-color-surface-sunken)] hover:text-[var(--ob-color-text)]"
              >
                <Columns3 size={19} aria-hidden="true" />
              </button>
            </ActionTooltip>
          </div>
          <p className="text-sm text-[var(--ob-color-text-subtle)]">
            {longDate()} ·{" "}
            <strong className="font-semibold text-[var(--ob-color-text-muted)]">{openCount} việc đang mở</strong>
          </p>
        </div>
        <QuickAdd today={today} onAdd={quickAdd} />
      </header>

      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @5xl:grid-cols-4">
        <TodayTile
          tasks={tasks}
          today={today}
          onToggle={handlers.onToggle}
          onOpen={handlers.onOpen}
          className="@xl:col-span-2 @5xl:row-span-2"
        />
        <StandupTile state={state} today={today} onWrite={() => setStandupOpen(true)} className="@xl:row-span-2" />
        <WeekTile state={state} today={today} onOpenReport={() => setReportOpen(true)} />
        <UpcomingTile tasks={tasks} today={today} onOpen={handlers.onOpen} />
        {middles.map((column, index) => {
          const icon = MIDDLE_ICONS[index] ?? OTHER_ICON
          return (
            <ColumnTile
              key={column.id}
              column={column}
              tasks={byColumn(column.id)}
              today={today}
              columns={columns}
              icon={icon.icon}
              iconClassName={icon.className}
              onAdd={(title) => work.addTask(title, column.id)}
              {...handlers}
              className={SPAN_CLASS[spans[index]]}
            />
          )
        })}
        <DoneTile
          column={last}
          tasks={tasks}
          today={today}
          onToggle={handlers.onToggle}
          onShowAll={handlers.onShowAll}
          className={cn(middles.length === 0 && FULL_ROW)}
        />
        {first.id !== last.id ? (
          <ColumnTile
            column={first}
            tasks={byColumn(first.id)}
            today={today}
            columns={columns}
            icon={<Image src="/assets/icons/target.svg" width={22} height={22} alt="" />}
            wide
            onAdd={(title) => work.addTask(title, first.id)}
            {...handlers}
            className={FULL_ROW}
          />
        ) : null}
      </div>

      {/* Khung Standup và báo cáo giữ nội dung khi đóng — chữ đang gõ dở không mất. */}
      <Modal
        open={standupOpen}
        onOpenChange={setStandupOpen}
        ariaLabelledBy={standupTitleId}
        variant="sheet"
        keepMounted
      >
        <SheetHeader id={standupTitleId} title="Viết standup" onClose={() => setStandupOpen(false)} />
        <StandupCard state={state} today={today} onSave={work.saveStandup} className="border-0 p-0" />
      </Modal>

      <Modal open={reportOpen} onOpenChange={setReportOpen} ariaLabelledBy={reportTitleId} variant="sheet" keepMounted>
        <SheetHeader id={reportTitleId} title="Báo cáo tuần" onClose={() => setReportOpen(false)} />
        <WeeklyReportCard state={state} today={today} className="border-0 p-0" />
      </Modal>

      <Modal
        open={allColumn !== null}
        onOpenChange={(open) => !open && setAllColumnId(null)}
        ariaLabelledBy={allTitleId}
        variant="sheet"
      >
        {allColumn ? (
          <>
            <SheetHeader
              id={allTitleId}
              title={`${allColumn.title} · ${allTasks.length}`}
              onClose={() => setAllColumnId(null)}
            />
            {allColumn.id !== last.id ? (
              <AddTaskRow
                columnTitle={allColumn.title}
                onAdd={(title) => work.addTask(title, allColumn.id)}
                className="mb-3"
              />
            ) : null}
            <ul className="flex flex-col gap-2.5">
              {allTasks.map((task) => (
                <TaskCard key={task.id} task={task} today={today} columns={columns} {...handlers} />
              ))}
            </ul>
          </>
        ) : null}
      </Modal>

      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditingId(null)}
        ariaLabelledBy={editTitleId}
        panelClassName="max-w-[460px]"
      >
        <div id={editTitleId} className="mb-4 text-[17px] font-bold">
          Sửa việc
        </div>
        {editing ? (
          <TaskForm
            key={editing.id}
            today={today}
            initial={editing}
            columns={columns}
            onSubmit={(input) => {
              if (work.updateTask(editing.id, input)) setEditingId(null)
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
        title="Xoá việc?"
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
          if (deleting) work.removeTask(deleting.id)
        }}
      />

      <ColumnManager
        open={managing}
        onOpenChange={setManaging}
        columns={columns}
        taskCounts={taskCounts}
        onAdd={work.addColumn}
        onRename={work.renameColumn}
        onMove={work.moveColumn}
        onRemove={work.removeColumn}
      />
    </div>
  )
}

export { WorkView }
