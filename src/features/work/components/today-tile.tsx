"use client"

import { useId, useState } from "react"

import { Card } from "@/components/ui/card"
import { Monkey } from "@/components/ob/monkey"
import { formatDayKey } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { WorkTask } from "@/lib/work/types"
import { todayFocus } from "@/lib/work/work-calculations"
import { DoneCheck, DueBadge, PriorityMark } from "./task-card"

const SHOWN = 6

interface TodayTileProps {
  tasks: WorkTask[]
  today: string
  onToggle: (task: WorkTask) => void
  onOpen: (task: WorkTask) => void
  className?: string
}

// Ô tối to nhất: việc trễ hạn rồi việc đến hạn hôm nay, tick ngay tại chỗ.
function TodayTile({ tasks, today, onToggle, onOpen, className }: TodayTileProps) {
  const titleId = useId()
  const [expanded, setExpanded] = useState(false)
  const { items, doneToday } = todayFocus(tasks, today)
  const late = items.filter((t) => t.dueDate! < today).length
  const total = doneToday + items.length
  const shown = expanded ? items : items.slice(0, SHOWN)

  return (
    <Card
      tone="invert"
      elevated
      aria-labelledby={titleId}
      className={cn("relative flex flex-col gap-4 overflow-hidden p-6", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(242_99_17_/_0.28),transparent)]"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-kem)]/65"
          >
            Hôm nay · {formatDayKey(today)}
          </h2>
          <p className="mt-2.5 flex items-baseline gap-3">
            <span className="font-[family-name:var(--ob-font-display)] text-[64px] leading-[0.95] font-extrabold tracking-[-0.035em]">
              {items.length}
            </span>
            <span className="text-lg leading-[1.3] font-bold">việc cần xử lý</span>
          </p>
          <p className="mt-1.5 text-sm leading-[1.5] text-[var(--ob-kem)]/75">
            <span className="font-semibold text-[var(--ob-do-300)]">{late} trễ hạn</span>
            {" · "}
            <span className="font-semibold text-[var(--ob-chuoi-300)]">{items.length - late} đến hạn hôm nay</span>
          </p>
        </div>
        <Monkey pose={items.length ? "wave" : "cheer"} size={76} dark className="-mt-1 -mr-1 flex-none" />
      </div>

      {total > 0 ? (
        <div className="relative flex items-center gap-3">
          <span className="h-2 flex-1 overflow-hidden rounded-[var(--ob-radius-pill)] bg-[var(--ob-kem)]/15">
            <span
              className="block h-full rounded-[var(--ob-radius-pill)] bg-[var(--ob-la-300)]"
              style={{ width: `${(doneToday / total) * 100}%` }}
            />
          </span>
          <span className="text-[12.5px] font-semibold whitespace-nowrap text-[var(--ob-kem)]/75">
            {`${doneToday}/${total} xong hôm nay`}
          </span>
        </div>
      ) : null}

      {items.length ? (
        <ul className="relative flex flex-col gap-0.5">
          {shown.map((task) => (
            <li
              key={task.id}
              className="relative grid min-h-12 grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-[14px] px-2.5 py-2 hover:bg-[var(--ob-kem)]/5"
            >
              <DoneCheck task={task} onToggle={onToggle} tone="dark" />
              <button
                type="button"
                onClick={() => onOpen(task)}
                className="min-w-0 text-left text-[14.5px] leading-[1.38] font-semibold wrap-anywhere hover:text-[var(--ob-cam-200)] after:absolute after:inset-0 after:rounded-[14px] after:content-['']"
              >
                <span className="line-clamp-2">{task.title}</span>
              </button>
              <span className="flex items-center gap-2">
                <PriorityMark priority={task.priority} tone="dark" />
                <DueBadge task={task} today={today} tone="dark" />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="relative text-sm text-[var(--ob-kem)]/75">Không có việc trễ hay đến hạn hôm nay.</p>
      )}

      {items.length > SHOWN ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="relative -mt-2 min-h-[var(--ob-hit-min)] self-start rounded-[var(--ob-radius-sm)] px-2.5 text-[13px] font-bold text-[var(--ob-cam-300)] hover:underline"
        >
          {expanded ? "Thu gọn" : `Xem thêm ${items.length - SHOWN} việc`}
        </button>
      ) : null}
    </Card>
  )
}

export { TodayTile }
