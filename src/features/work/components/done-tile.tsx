"use client"

import { useId } from "react"
import Image from "next/image"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { WorkColumn, WorkTask } from "@/lib/work/types"
import { recentDone } from "@/lib/work/work-calculations"
import { doneLabel } from "../due-label"
import { DoneCheck } from "./task-card"
import { EMPTY_CLASS, TileHeader, TileLink } from "./tile-header"

const SHOWN = 5

interface DoneTileProps {
  column: WorkColumn
  tasks: WorkTask[]
  today: string
  onToggle: (task: WorkTask) => void
  onShowAll: (column: WorkColumn) => void
  className?: string
}

// Ô của cột cuối: chỉ vài việc vừa xong, mới nhất trước — cột này dài dần, không chiếm cả trang nữa.
function DoneTile({ column, tasks, today, onToggle, onShowAll, className }: DoneTileProps) {
  const titleId = useId()
  const done = recentDone(tasks)

  return (
    <Card aria-labelledby={titleId} className={cn("flex flex-col p-5", className)}>
      <TileHeader
        id={titleId}
        icon={<Image src="/assets/icons/check.svg" width={22} height={22} alt="" />}
        iconClassName="bg-[var(--ob-color-income-soft)]"
        label={column.title}
        action={done.length ? <TileLink onClick={() => onShowAll(column)}>{`Tất cả ${done.length}`}</TileLink> : null}
      />
      {done.length ? (
        <ul className="flex flex-col gap-1">
          {done.slice(0, SHOWN).map((task) => (
            <li key={task.id} className="flex min-h-9 items-center gap-2.5">
              <DoneCheck task={task} onToggle={onToggle} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--ob-color-text-subtle)]">
                {task.title}
              </span>
              <span className="flex-none text-[11.5px] font-bold text-[var(--ob-color-income)]">
                {doneLabel(task, today)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={EMPTY_CLASS}>Chưa có việc nào xong.</p>
      )}
    </Card>
  )
}

export { DoneTile }
