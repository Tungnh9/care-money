"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Figure } from "@/components/ob/figure"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { AddCreditCardForm } from "./add-credit-card-form"
import type { CreditCard } from "../types"

interface CreditCardsTabProps {
  cards: CreditCard[]
  onAddCard: (card: CreditCard) => void
  onPayCard: (name: string, amount: number) => void
  onUpdateCard: (originalName: string, card: CreditCard) => void
  onRemoveCard: (name: string) => void
}

function todayLabel() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${now.getFullYear()}`
}

function CreditCardsTab({
  cards,
  onAddCard,
  onPayCard,
  onUpdateCard,
  onRemoveCard,
}: CreditCardsTabProps) {
  const { hidden } = useMoneyVisibility()
  const [payCard, setPayCard] = useState("")
  const [payAmount, setPayAmount] = useState("")
  const [editingCard, setEditingCard] = useState("")
  const [editName, setEditName] = useState("")
  const [editBalance, setEditBalance] = useState("")
  const [editMin, setEditMin] = useState("")
  const [editLimit, setEditLimit] = useState("")
  const [editDue, setEditDue] = useState("")
  const [deletingCard, setDeletingCard] = useState("")

  const payingCard = cards.find((card) => card.name === payCard)
  const cardBeingEdited = cards.find((card) => card.name === editingCard)

  function resetPay() {
    setPayCard("")
    setPayAmount("")
  }

  function resetEdit() {
    setEditingCard("")
    setEditName("")
    setEditBalance("")
    setEditMin("")
    setEditLimit("")
    setEditDue("")
  }

  function startEdit(card: CreditCard) {
    resetPay()
    setEditingCard(card.name)
    setEditName(card.name)
    setEditBalance(String(card.balance))
    setEditMin(String(card.min))
    setEditLimit(String(card.limit))
    setEditDue(card.due)
  }

  function startPay(name: string) {
    resetEdit()
    setPayCard(name)
    setPayAmount("")
  }

  return (
    <div>
      <div className="ob-card-grid flex flex-wrap gap-4">
        {cards.length ? (
          cards.map((card) => {
            const limitPct = card.limit ? (card.balance / card.limit) * 100 : 0
            return (
              <Card key={card.name} label={card.name} className="min-w-0 flex-[1_1_300px]">
                <Figure value={formatMoney(card.balance, hidden)} />
                <div className="my-4 grid grid-cols-3 gap-3 text-center">
                  {(
                    [
                      ["Hạn thanh toán", card.due],
                      ["Trả tối thiểu", formatMoney(card.min, hidden)],
                      ["Hạn mức", formatMoney(card.limit, hidden)],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k}>
                      <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                        {k}
                      </div>
                      <div className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums">{v}</div>
                    </div>
                  ))}
                </div>
                <Progress
                  value={Math.min(limitPct, 100)}
                  tone="action"
                  hint={`${Math.round(limitPct)}% hạn mức`}
                />
                <div className="mt-4 flex flex-wrap items-center gap-[10px]">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => startPay(card.name)}
                  >
                    Ghi một lần trả
                  </Button>
                  <button
                    type="button"
                    aria-label={`Sửa thẻ ${card.name}`}
                    onClick={() => startEdit(card)}
                    className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Xoá thẻ ${card.name}`}
                    onClick={() => setDeletingCard(card.name)}
                    className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </Card>
            )
          })
        ) : (
          <Card label="Nợ thẻ tín dụng" className="min-w-0 flex-[1_1_300px]">
            <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
              Chưa có thẻ tín dụng nào. Thêm thẻ đầu tiên để theo dõi dư nợ và hạn trả.
            </p>
          </Card>
        )}

        {payingCard ? (
          <Card
            label={`Ghi một lần trả · ${payingCard.name}`}
            className="min-w-0 flex-[1_1_300px]"
          >
            <Field
              label="Số tiền trả"
              numeric
              group
              suffix="đ"
              placeholder="0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              hint={`Dư nợ hiện tại ${formatMoney(payingCard.balance, hidden)}`}
            />
            <div className="h-[14px]" />
            <Field label="Ngày trả" placeholder={todayLabel()} />
            <div className="mt-4 flex flex-wrap gap-[10px]">
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={!Number(payAmount)}
                onClick={() => {
                  onPayCard(payingCard.name, Number(payAmount) || 0)
                  resetPay()
                }}
              >
                Lưu
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={resetPay}>
                Huỷ
              </Button>
            </div>
          </Card>
        ) : null}

        {cardBeingEdited ? (
          <Card label={`Sửa thẻ · ${cardBeingEdited.name}`} className="min-w-0 flex-[1_1_300px]">
            <div className="flex flex-wrap gap-3">
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label="Tên thẻ"
                placeholder="vd: Techcombank Visa"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label="Dư nợ hiện tại"
                numeric
                group
                suffix="đ"
                placeholder="0"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
              />
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label="Số tiền tối thiểu"
                numeric
                group
                suffix="đ"
                placeholder="0"
                value={editMin}
                onChange={(e) => setEditMin(e.target.value)}
              />
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label="Hạn mức"
                numeric
                group
                suffix="đ"
                placeholder="0"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
              />
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label="Ngày đến hạn"
                placeholder="vd: 15 hàng tháng"
                value={editDue}
                onChange={(e) => setEditDue(e.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-[10px]">
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={!editName.trim() || !editBalance.trim() || !editLimit.trim() || !editDue.trim()}
                onClick={() => {
                  onUpdateCard(cardBeingEdited.name, {
                    name: editName.trim(),
                    balance: Number(editBalance) || 0,
                    min: Number(editMin) || 0,
                    limit: Number(editLimit) || 0,
                    due: editDue.trim(),
                  })
                  resetEdit()
                }}
              >
                Lưu
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={resetEdit}>
                Huỷ
              </Button>
            </div>
          </Card>
        ) : null}

        <Card tone="soft" label="Nhắc trả nợ" className="min-w-0 flex-[1_1_300px]">
          <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            Trả đủ và đúng hạn để tránh mất lãi phát sinh trên dư nợ thẻ tín dụng.
          </p>
        </Card>
      </div>
      <AddCreditCardForm onAdd={onAddCard} />
      <AlertDialog
        open={!!deletingCard}
        onOpenChange={(open) => !open && setDeletingCard("")}
        title="Xoá thẻ tín dụng?"
        description={
          <>
            Xoá thẻ &quot;<strong>{deletingCard}</strong>&quot; sẽ không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingCard) onRemoveCard(deletingCard)
        }}
      />
    </div>
  )
}

export { CreditCardsTab }
