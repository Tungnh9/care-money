"use client"

import { useId } from "react"
import Image from "next/image"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { WorkTask } from "@/lib/work/types"
import { upcomingTasks } from "@/lib/work/work-calculations"
import { EMPTY_CLASS, TileHeader } from "./tile-header"

const SHOWN = 4
const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

interface UpcomingTileProps {
  tasks: WorkTask[]
  today: string
  onOpen: (task: WorkTask) => void
  className?: string
}

// Ô Sắp tới: việc có hạn trong 7 ngày tới (không tính hôm nay).
function UpcomingTile({ tasks, today, onOpen, className }: UpcomingTileProps) {
  const titleId = useId()
  const items = upcomingTasks(tasks, today)

  return (
    <Card aria-labelledby={titleId} className={cn("flex flex-col p-5", className)}>
      <TileHeader
        id={titleId}
        icon={<Image src="/assets/icons/timer.svg" width={22} height={22} alt="" />}
        iconClassName="bg-[var(--ob-color-action-soft)]"
        label="Sắp tới"
        count={items.length}
      />
      {items.length ? (
        <ul className="flex flex-col gap-2.5">
          {items.slice(0, SHOWN).map((task) => {
            const [y, m, d] = task.dueDate!.split("-").map(Number)
            return (
              <li key={task.id} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-2.5">
                <span className="flex h-[42px] flex-col items-center justify-center rounded-[12px] bg-[var(--ob-color-surface-sunken)] shadow-[inset_0_0_0_1px_var(--ob-color-border)]">
                  <span className="text-[10px] leading-[1.1] font-bold text-[var(--ob-color-text-subtle)]">
                    {WEEKDAY_SHORT[new Date(y, m - 1, d).getDay()]}
                  </span>
                  <span className="font-[family-name:var(--ob-font-num)] text-sm leading-[1.1] font-bold">
                    {String(d).padStart(2, "0")}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onOpen(task)}
                  className="min-w-0 text-left text-[13.5px] leading-[1.38] font-semibold wrap-anywhere hover:text-[var(--ob-color-action-strong)]"
                >
                  <span className="line-clamp-2">{task.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className={EMPTY_CLASS}>Không có việc nào trong 7 ngày tới.</p>
      )}
      {items.length > SHOWN ? (
        <p className={cn(EMPTY_CLASS, "mt-2.5 text-[12.5px]")}>{`và ${items.length - SHOWN} việc nữa`}</p>
      ) : null}
    </Card>
  )
}

export { UpcomingTile }
