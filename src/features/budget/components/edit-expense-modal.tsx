"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { BudgetTag } from "@/lib/settings/settings-storage"
import type { Expense, TagSnapshot } from "@/lib/budget/types"
import { BUDGET_AMOUNT_LIMIT_HINT, exceedsBudgetAmountLimit } from "@/lib/budget/budget-calculations"
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
  const picked = activeTags.find((t) => t.label === selectedLabel)
  // Expense.tag là snapshot đóng băng lúc ghi: nhãn đang chọn vẫn là nhãn gốc thì lưu lại đúng
  // snapshot gốc — kể cả khi nhãn đó đã tắt/xoá hay đã đổi emoji/màu trong Cài đặt (trước đây chỉ
  // tìm trong nhãn đang bật nên nhãn đã tắt bị lưu thành null). Chọn nhãn khác mới chụp snapshot mới.
  const tag: TagSnapshot | null =
    currentExpense.tag && selectedLabel === currentExpense.tag.label
      ? currentExpense.tag
      : picked
        ? { label: picked.label, emoji: picked.emoji, tint: picked.tint }
        : null
  const tooLarge = exceedsBudgetAmountLimit(amount)
  const disabled = !Number(amount) || tooLarge

  function handleSave() {
    onSave(currentExpense.id, {
      amount: Number(amount) || 0,
      tag,
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
        invalid={tooLarge}
        hint={tooLarge ? BUDGET_AMOUNT_LIMIT_HINT : undefined}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="mt-3">
        <TagPicker
          tags={tags}
          selectedLabel={selectedLabel}
          onSelect={setSelectedLabel}
          extraTag={currentExpense.tag}
        />
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
