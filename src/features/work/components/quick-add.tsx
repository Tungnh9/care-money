"use client"

import { useState, type FormEvent } from "react"
import { ArrowRight, Flag, Plus } from "lucide-react"

import { shiftDay } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { WorkPriority } from "@/lib/work/types"

type QuickDue = "today" | "tomorrow" | null

interface QuickAddProps {
  today: string
  onAdd: (title: string, extra: { dueDate: string | null; priority: WorkPriority }) => boolean
}

const CHIP_CLASS =
  "inline-flex min-h-9 items-center gap-1.5 rounded-[var(--ob-radius-pill)] px-3 text-[12.5px] font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_var(--ob-color-border)]"
const CHIP_ON =
  "bg-[var(--ob-color-reward-soft)] text-[var(--ob-color-reward-text)] shadow-[inset_0_0_0_1px_var(--ob-chuoi-200)]"
const CHIP_OFF = "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]"

// Ô thêm việc đầu trang: gõ tên, chọn nhanh hạn (Hôm nay / Ngày mai — một trong hai) và "Cao", Enter là
// thêm. Mặc định không hạn, ưu tiên thường; thêm xong ô và các chip về mặc định.
function QuickAdd({ today, onAdd }: QuickAddProps) {
  const [title, setTitle] = useState("")
  const [due, setDue] = useState<QuickDue>(null)
  const [high, setHigh] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const dueDate = due === "today" ? today : due === "tomorrow" ? shiftDay(today, 1) : null
    if (!onAdd(title, { dueDate, priority: high ? "high" : "normal" })) return
    setTitle("")
    setDue(null)
    setHigh(false)
  }

  function chip(value: Exclude<QuickDue, null>, label: string) {
    return (
      <button
        type="button"
        aria-pressed={due === value}
        onClick={() => setDue(due === value ? null : value)}
        className={cn(CHIP_CLASS, due === value ? CHIP_ON : CHIP_OFF)}
      >
        {label}
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Thêm việc nhanh"
      className="flex flex-wrap items-center gap-2 rounded-[22px] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] py-1.5 pr-1.5 pl-4 shadow-[var(--ob-shadow-sm)] focus-within:border-[var(--ob-color-focus)]"
    >
      <Plus size={20} strokeWidth={2.5} aria-hidden="true" className="flex-none text-[var(--ob-color-action)]" />
      <input
        aria-label="Tên việc mới"
        placeholder="Bạn cần làm gì tiếp theo?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-h-11 min-w-0 flex-[1_1_180px] bg-transparent text-[15px] text-[var(--ob-color-text)] outline-none placeholder:text-[var(--ob-color-text-subtle)]"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {chip("today", "Hôm nay")}
        {chip("tomorrow", "Ngày mai")}
        <button
          type="button"
          aria-pressed={high}
          onClick={() => setHigh(!high)}
          className={cn(CHIP_CLASS, high ? CHIP_ON : CHIP_OFF)}
        >
          <Flag size={13} aria-hidden="true" />
          Cao
        </button>
      </div>
      <button
        type="submit"
        aria-label="Thêm việc"
        disabled={!title.trim()}
        className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-[var(--ob-radius-pill)] bg-[var(--ob-color-action)] px-4 text-sm font-bold text-[var(--ob-color-on-action)] hover:bg-[var(--ob-color-action-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowRight size={17} strokeWidth={2.5} aria-hidden="true" />
        Thêm
      </button>
    </form>
  )
}

export { QuickAdd }
