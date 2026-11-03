"use client"

import { useId, type ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { WorkColumn, WorkTask } from "@/lib/work/types"
import { AddTaskRow } from "./add-task-row"
import { TaskCard } from "./task-card"
import { EMPTY_CLASS, TileHeader, TileLink } from "./tile-header"

const SHOWN = 6

interface ColumnTileProps {
  column: WorkColumn
  // Việc của cột, đúng thứ tự trong cột.
  tasks: WorkTask[]
  today: string
  columns: WorkColumn[]
  icon?: ReactNode
  iconClassName?: string
  // Dải rộng hết hàng (cột đầu): thẻ xếp nhiều cột hơn.
  wide?: boolean
  onAdd: (title: string) => boolean
  onToggle: (task: WorkTask) => void
  onOpen: (task: WorkTask) => void
  onMove: (task: WorkTask, columnId: number) => void
  onDelete: (task: WorkTask) => void
  onShowAll: (column: WorkColumn) => void
  className?: string
}

// 1 ô cho 1 cột của bảng (cột đầu và các cột giữa): thẻ việc, "Xem tất cả" khi nhiều hơn 6, thêm việc vào cột.
function ColumnTile({
  column,
  tasks,
  today,
  columns,
  icon,
  iconClassName,
  wide,
  onAdd,
  onToggle,
  onOpen,
  onMove,
  onDelete,
  onShowAll,
  className,
}: ColumnTileProps) {
  const titleId = useId()
  return (
    <Card aria-labelledby={titleId} className={cn("flex flex-col p-5", className)}>
      <TileHeader
        id={titleId}
        icon={icon}
        iconClassName={iconClassName}
        label={column.title}
        count={tasks.length}
        action={
          tasks.length > SHOWN ? (
            <TileLink onClick={() => onShowAll(column)}>{`Xem tất cả ${tasks.length}`}</TileLink>
          ) : null
        }
      />
      {tasks.length ? (
        <ul
          className={cn(
            "grid gap-2.5",
            wide ? "grid-cols-[repeat(auto-fill,minmax(220px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
          )}
        >
          {tasks.slice(0, SHOWN).map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              today={today}
              columns={columns}
              onToggle={onToggle}
              onOpen={onOpen}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : (
        <p className={EMPTY_CLASS}>Chưa có việc nào.</p>
      )}
      {/* Khoảng cách nằm ở lớp bọc: đặt lên chính nút thì thành padding bên trong viền nét đứt. */}
      <div className="mt-auto pt-3">
        <AddTaskRow columnTitle={column.title} onAdd={onAdd} />
      </div>
    </Card>
  )
}

export { ColumnTile }
