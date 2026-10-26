"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { BudgetTag } from "@/lib/settings/settings-storage"
import type { Expense, TagSnapshot } from "@/lib/budget/types"
import type { CreditCard } from "@/lib/finance/types"
import { BUDGET_AMOUNT_LIMIT_HINT, exceedsBudgetAmountLimit } from "@/lib/budget/budget-calculations"
import { CARD_PAYMENT_TAG_LABEL, CARD_SWIPE_TAG_LABEL, cardDebtDelta } from "@/lib/budget/card-link"
import { formatMoney } from "@/lib/format"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { TagPicker } from "./tag-picker"

interface EditExpenseModalProps {
  expense: Expense | null
  tags: BudgetTag[]
  cards?: CreditCard[]
  onOpenChange: (open: boolean) => void
  onSave: (id: number, input: { amount: number; tag: TagSnapshot | null; note?: string }) => boolean
}

const NO_CARDS: CreditCard[] = []
const CARD_TAG_LABELS = [CARD_SWIPE_TAG_LABEL, CARD_PAYMENT_TAG_LABEL]

function EditExpenseModal({ expense, tags, cards = NO_CARDS, onOpenChange, onSave }: EditExpenseModalProps) {
  const { hidden } = useMoneyVisibility()
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

  // Khoản đã gắn thẻ: nhãn và thẻ cố định, chỉ sửa số tiền/ghi chú. Sửa số tiền không được làm nợ thẻ âm.
  const link = currentExpense.card
  const linkedCard = link ? cards.find((c) => c.name === link.cardName) : undefined
  const amountNumber = Number(amount) || 0
  const overDebt =
    link !== undefined &&
    linkedCard !== undefined &&
    linkedCard.balance + cardDebtDelta(link.kind, amountNumber - currentExpense.amount) < 0
  const amountHint = tooLarge
    ? BUDGET_AMOUNT_LIMIT_HINT
    : overDebt
      ? `Thẻ "${linkedCard.name}" chỉ còn nợ ${formatMoney(linkedCard.balance, hidden)}`
      : undefined
  const disabled = !Number(amount) || tooLarge || overDebt

  function handleSave() {
    const saved = onSave(currentExpense.id, {
      amount: amountNumber,
      tag: link ? currentExpense.tag : tag,
      note: note.trim() || undefined,
    })
    if (saved) onOpenChange(false)
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
        invalid={tooLarge || overDebt}
        hint={amountHint}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {link ? (
        <div className="mt-3 text-[13px]">
          {currentExpense.tag && (
            <div className="font-semibold">{`${currentExpense.tag.emoji} ${currentExpense.tag.label}`}</div>
          )}
          <div className="mt-1 text-[var(--ob-color-text-subtle)]">
            {link.cardName ? `Thẻ ${link.cardName}` : "Thẻ đã xoá"}
          </div>
          <p className="mt-1 text-[12.5px] text-[var(--ob-color-text-subtle)]">
            Muốn đổi nhãn hay thẻ thì xoá khoản này rồi ghi lại.
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <TagPicker
            tags={tags}
            selectedLabel={selectedLabel}
            onSelect={setSelectedLabel}
            extraTag={currentExpense.tag}
            hiddenLabels={CARD_TAG_LABELS}
          />
        </div>
      )}

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
