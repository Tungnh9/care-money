"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TaskItemProps {
  label: React.ReactNode
  done?: boolean
  onToggle?: React.ChangeEventHandler<HTMLInputElement>
  className?: string
}

function TaskItem({ label, done, onToggle, className }: TaskItemProps) {
  return (
    <label
      className={cn(
        "relative flex min-h-8 cursor-pointer items-center gap-[var(--ob-space-3)] text-sm",
        done
          ? "font-normal text-[var(--ob-color-text-subtle)]"
          : "font-medium text-[var(--ob-color-text)]",
        className
      )}
    >
      {/* sr-only thay cho 0×0 + opacity-0: opacity giấu luôn vòng focus của chính checkbox. `peer` để ô
          vuông ngay sau tự vẽ vòng focus khi checkbox được focus bằng bàn phím. */}
      <input type="checkbox" checked={!!done} onChange={onToggle} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-[7px] border-[1.5px] text-xs font-bold text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--ob-color-focus)]",
          done
            ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action)]"
            : "border-[var(--ob-color-border-strong)] bg-transparent"
        )}
      >
        {done ? "✓" : ""}
      </span>
      <span className={done ? "line-through" : ""}>{label}</span>
    </label>
  )
}

export { TaskItem }
