"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import type { BudgetTag } from "@/lib/settings-storage"
import type { TagSnapshot } from "../types"
import { TagPicker } from "./tag-picker"

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
      <div className="mt-3">
        <TagPicker tags={tags} selectedLabel={selectedLabel} onSelect={setSelectedLabel} />
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
