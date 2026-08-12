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
        "flex min-h-8 cursor-pointer items-center gap-[var(--ob-space-3)] text-sm",
        done
          ? "font-normal text-[var(--ob-color-text-subtle)]"
          : "font-medium text-[var(--ob-color-text)]",
        className
      )}
    >
      <input
        type="checkbox"
        checked={!!done}
        onChange={onToggle}
        className="absolute size-0 opacity-0"
      />
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-[7px] border-[1.5px] text-xs font-bold text-white",
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
