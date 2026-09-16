"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { BudgetTag } from "@/lib/settings-storage"
import type { Expense, TagSnapshot } from "../types"
import { TagPicker } from "./tag-picker"

interface EditExpenseModalProps {
  expense: Expense | null
  tags: BudgetTag[]
  onOpenChange: (open: boolean) => void
  onSave: (id: number, input: { amount: number; tag: TagSnapshot | null; note?: string }) => void
}

function EditExpenseModal({ expense, tags, onOpenChange, onSave }: EditExpenseModalProps) {
  const [amount, setAmount] = useState("")
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [note, setNote] = useState("")

  // Modal ở lại mounted với expense=null giữa các lần mở — reseed field đúng lúc chuyển sang mở
  // với 1 expense (mới hoặc khác expense trước), giống pattern SettleMonthModal.
  const [prevExpenseId, setPrevExpenseId] = useState<number | null>(null)
  if (expense && expense.id !== prevExpenseId) {
    setAmount(String(expense.amount))
    setSelectedLabel(expense.tag?.label ?? null)
    setNote(expense.note ?? "")
    setPrevExpenseId(expense.id)
  }
  if (!expense && prevExpenseId !== null) setPrevExpenseId(null)

  if (!expense) return null

  // Gán vào const riêng để TypeScript giữ được narrowing (khác `expense`, tham số không được
  // narrow xuyên qua closure `handleSave` bên dưới dù đã check null ở trên).
  const currentExpense = expense
  const activeTags = tags.filter((t) => t.on)
  const tag = activeTags.find((t) => t.label === selectedLabel)
  const disabled = !Number(amount)

  function handleSave() {
    onSave(currentExpense.id, {
      amount: Number(amount) || 0,
      tag: tag ? { label: tag.label, emoji: tag.emoji, tint: tag.tint } : null,
      note: note.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy="edit-expense-title">
      <div id="edit-expense-title" className="mb-4 text-[17px] font-bold">
        Sửa khoản chi
      </div>

      <Field
        label="Số tiền"
        numeric
        group
        suffix="đ"
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

      <div className="mt-5 flex justify-end gap-[10px]">
        <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" type="button" disabled={disabled} onClick={handleSave}>
          Lưu
        </Button>
      </div>
    </Modal>
  )
}

export { EditExpenseModal }
