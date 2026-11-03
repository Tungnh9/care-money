"use client"

import { useState, type FormEvent } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ActionTooltip } from "@/components/ob/action-tooltip"
import { cn } from "@/lib/utils"

interface AddTaskRowProps {
  columnTitle: string
  onAdd: (title: string) => boolean
  className?: string
}

// "+ Thêm việc" vào thẳng 1 cột: bấm là mở ô gõ, thêm xong ô vẫn mở để gõ tiếp, Esc hay X để đóng.
function AddTaskRow({ columnTitle, onAdd, className }: AddTaskRowProps) {
  const [text, setText] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (text === null || !text.trim()) return
    if (onAdd(text)) setText("")
  }

  if (text === null) {
    return (
      <button
        type="button"
        aria-label={`Thêm việc vào cột "${columnTitle}"`}
        onClick={() => setText("")}
        className={cn(
          "flex min-h-[var(--ob-hit-min)] w-full items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[var(--ob-color-border)] text-[13px] font-semibold text-[var(--ob-color-text-subtle)] hover:border-[var(--ob-color-action)] hover:text-[var(--ob-color-action-strong)]",
          className
        )}
      >
        <Plus size={16} aria-hidden="true" />
        Thêm việc
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-center gap-2", className)}>
      <Input
        autoFocus
        aria-label={`Tên việc mới ở cột "${columnTitle}"`}
        placeholder="Tên việc"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setText(null)}
        className="min-h-[var(--ob-hit-min)] flex-1 rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] px-3 text-sm focus:border-[var(--ob-color-focus)]"
      />
      <Button variant="primary" size="sm" type="submit" disabled={!text.trim()} className="min-h-[var(--ob-hit-min)]">
        Thêm
      </Button>
      <ActionTooltip label="Đóng">
        <button
          type="button"
          aria-label="Đóng ô thêm việc"
          onClick={() => setText(null)}
          className="grid size-11 flex-none place-items-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] hover:text-[var(--ob-color-text)]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </ActionTooltip>
    </form>
  )
}

export { AddTaskRow }
