"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import type { BudgetTag } from "@/lib/settings-storage"
import type { TagSnapshot } from "../types"

interface ExpenseEntryFormProps {
  tags: BudgetTag[]
  onAdd: (input: { amount: number; tag: TagSnapshot | null; note?: string }) => void
}

function ExpenseEntryForm({ tags, onAdd }: ExpenseEntryFormProps) {
  const activeTags = tags.filter((t) => t.on)
  const [amount, setAmount] = useState("")
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [note, setNote] = useState("")

  function reset() {
    setAmount("")
    setSelectedLabel(null)
    setNote("")
  }

  function handleSubmit() {
    const tag = activeTags.find((t) => t.label === selectedLabel)
    onAdd({
      amount: Number(amount) || 0,
      tag: tag ? { label: tag.label, emoji: tag.emoji, tint: tag.tint } : null,
      note: note.trim() || undefined,
    })
    reset()
  }

  return (
    <Card label="Ghi khoản chi" className="min-w-0">
      <Field
        label="Số tiền"
        numeric
        group
        suffix="đ"
        placeholder="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {activeTags.map((t) => {
          const active = t.label === selectedLabel
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => setSelectedLabel(active ? null : t.label)}
              className={cn(
                "inline-flex min-h-[var(--ob-hit-min)] items-center gap-[9px] rounded-[var(--ob-radius-pill)] border-[1.5px] px-[15px] py-[9px] text-[13px] font-semibold",
                active
                  ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                  : "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"
              )}
            >
              <span className="text-base leading-none">{t.emoji}</span>
              {t.label}
            </button>
          )
        })}
      </div>
      <Field
        className="mt-3"
        label="Ghi chú"
        placeholder="Ghi chú khoản chi"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="mt-4">
        <Button variant="primary" size="sm" type="button" disabled={!Number(amount)} onClick={handleSubmit}>
          Ghi khoản chi
        </Button>
      </div>
    </Card>
  )
}

export { ExpenseEntryForm }
