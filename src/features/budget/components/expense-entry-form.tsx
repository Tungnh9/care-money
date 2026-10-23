"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import type { BudgetTag } from "@/lib/settings/settings-storage"
import type { CardLink, TagSnapshot } from "@/lib/budget/types"
import type { CreditCard } from "@/lib/finance/types"
import { CARD_SWIPE_TAG_LABEL, cardLinkKindForTag } from "@/lib/budget/card-link"
import { formatMoney } from "@/lib/format"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { CardPicker } from "./card-picker"
import { BUDGET_AMOUNT_LIMIT_HINT, exceedsBudgetAmountLimit } from "@/lib/budget/budget-calculations"
import { TagPicker } from "./tag-picker"

interface ExpenseEntryFormProps {
  tags: BudgetTag[]
  cards?: CreditCard[]
  // Trả true khi khoản chi đã được ghi; chỉ khi đó form mới xoá ô nhập.
  onAdd: (input: { amount: number; tag: TagSnapshot | null; note?: string; card?: CardLink }) => boolean
}

const NO_CARDS: CreditCard[] = []

function ExpenseEntryForm({ tags, cards = NO_CARDS, onAdd }: ExpenseEntryFormProps) {
  const { hidden } = useMoneyVisibility()
  const activeTags = tags.filter((t) => t.on)
  const [amount, setAmount] = useState("")
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [note, setNote] = useState("")
  const [pickedCardName, setPickedCardName] = useState<string | null>(null)
  const tooLarge = exceedsBudgetAmountLimit(amount)

  // Chưa có thẻ nào thì "Quẹt thẻ" bị khoá; nhãn đã chọn từ trước đó (thẻ bị xoá ở tab khác) coi như chưa chọn.
  const swipeLocked = cards.length === 0
  const effectiveLabel = swipeLocked && selectedLabel === CARD_SWIPE_TAG_LABEL ? null : selectedLabel
  const tag = activeTags.find((t) => t.label === effectiveLabel)
  const linkKind = tag ? cardLinkKindForTag(tag.label) : null
  // 1 thẻ thì tự chọn; ≥ 2 thẻ thì phải bấm chọn, và thẻ đã chọn mà nay không còn thì coi như chưa chọn.
  const card = linkKind ? (cards.length === 1 ? cards[0] : cards.find((c) => c.name === pickedCardName)) : undefined
  const needsPick = linkKind !== null && cards.length > 1 && !card
  const amountNumber = Number(amount) || 0
  const overDebt = linkKind === "payment" && card !== undefined && amountNumber > card.balance
  const amountHint = tooLarge
    ? BUDGET_AMOUNT_LIMIT_HINT
    : overDebt
      ? `Thẻ "${card.name}" chỉ còn nợ ${formatMoney(card.balance, hidden)}`
      : undefined
  const swipeTagOn = activeTags.some((t) => t.label === CARD_SWIPE_TAG_LABEL)

  function selectLabel(label: string | null) {
    setSelectedLabel(label)
    setPickedCardName(null)
  }

  function reset() {
    setAmount("")
    setSelectedLabel(null)
    setPickedCardName(null)
    setNote("")
  }

  function handleSubmit() {
    const saved = onAdd({
      amount: amountNumber,
      tag: tag ? { label: tag.label, emoji: tag.emoji, tint: tag.tint } : null,
      note: note.trim() || undefined,
      ...(linkKind && card ? { card: { kind: linkKind, cardName: card.name } } : {}),
    })
    if (saved) reset()
  }

  return (
    <Card label="Ghi khoản chi" className="min-w-0">
      <Field
        label="Số tiền"
        numeric
        group
        suffix="đ"
        placeholder="0"
        invalid={tooLarge || overDebt}
        hint={amountHint}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <div className="mt-3">
        <TagPicker
          tags={tags}
          selectedLabel={effectiveLabel}
          onSelect={selectLabel}
          disabledLabels={swipeLocked ? [CARD_SWIPE_TAG_LABEL] : undefined}
        />
        {swipeLocked && swipeTagOn && (
          <p className="mt-2 text-[12.5px] text-[var(--ob-color-text-subtle)]">
            Chưa có thẻ tín dụng. Thêm thẻ ở trang Tài chính để ghi khoản quẹt thẻ.
          </p>
        )}
        {linkKind === "payment" && swipeLocked && (
          <p className="mt-2 text-[12.5px] text-[var(--ob-color-text-subtle)]">
            Chưa có thẻ tín dụng nên khoản này không trừ nợ thẻ.
          </p>
        )}
        {linkKind && cards.length === 1 && (
          <p className="mt-2 text-[12.5px] text-[var(--ob-color-text-subtle)]">{`Thẻ: ${cards[0].name}`}</p>
        )}
        {linkKind && cards.length > 1 && (
          <CardPicker cards={cards} selected={card?.name ?? null} onSelect={setPickedCardName} />
        )}
      </div>
      <Field
        className="mt-3"
        label="Ghi chú"
        placeholder="Ghi chú khoản chi"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="mt-4">
        <Button variant="primary" size="sm" type="button" disabled={!amountNumber || tooLarge || overDebt || needsPick} onClick={handleSubmit}>
          Ghi khoản chi
        </Button>
      </div>
    </Card>
  )
}

export { ExpenseEntryForm }
