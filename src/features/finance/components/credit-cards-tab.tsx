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
import { useT, useLocale } from "@/components/locale-provider"
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
  const t = useT()
  const { locale } = useLocale()
  const { hidden } = useMoneyVisibility()
  const [payCard, setPayCard] = useState("")
  const [payAmount, setPayAmount] = useState("")
  const [editingCard, setEditingCard] = useState("")
  const [editName, setEditName] = useState("")
  const [editBalance, setEditBalance] = useState("")
  const [editMin, setEditMin] = useState("")
  const [editLimit, setEditLimit] = useState("")
  const [editDue, setEditDue] = useState("")
  const [editColor, setEditColor] = useState("")
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
    setEditColor("")
  }

  function startEdit(card: CreditCard) {
    resetPay()
    setEditingCard(card.name)
    setEditName(card.name)
    setEditBalance(String(card.balance))
    setEditMin(String(card.min))
    setEditLimit(String(card.limit))
    setEditDue(card.due)
    setEditColor(card.color ?? "")
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
              <Card
                key={card.name}
                label={
                  <span style={card.color ? { color: card.color } : undefined}>{card.name}</span>
                }
                className="min-w-0 flex-[1_1_300px]"
              >
                <Figure value={formatMoney(card.balance, hidden, locale)} />
                <div className="my-4 flex flex-col divide-y divide-[var(--ob-color-border)]">
                  {(
                    [
                      [t("finance.card.dueDateStat"), card.due],
                      [t("finance.card.minPaymentStat"), formatMoney(card.min, hidden, locale)],
                      [t("finance.card.limit"), formatMoney(card.limit, hidden, locale)],
                    ] as const
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between gap-3 py-[9px] first:pt-0 last:pb-0"
                    >
                      <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                        {k}
                      </span>
                      <span className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <Progress
                  value={Math.min(limitPct, 100)}
                  tone={limitPct > 100 ? "expense" : "action"}
                  hint={t("finance.card.limitPct", { pct: Math.round(limitPct) })}
                />
                <div className="mt-4 flex flex-wrap items-center gap-[10px]">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => startPay(card.name)}
                  >
                    {t("finance.card.recordPayment")}
                  </Button>
                  <button
                    type="button"
                    aria-label={t("finance.card.editAria", { name: card.name })}
                    onClick={() => startEdit(card)}
                    className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={t("finance.card.deleteAria", { name: card.name })}
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
          <Card label={t("finance.tabs.debt")} className="min-w-0 flex-[1_1_300px]">
            <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
              {t("finance.card.empty")}
            </p>
          </Card>
        )}

        {payingCard ? (
          <Card
            label={t("finance.card.recordPaymentTitle", { name: payingCard.name })}
            className="min-w-0 flex-[1_1_300px]"
          >
            <Field
              label={t("finance.card.paymentAmount")}
              numeric
              group
              suffix="đ"
              placeholder="0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              hint={t("finance.card.currentBalanceHint", {
                amount: formatMoney(payingCard.balance, hidden, locale),
              })}
            />
            <div className="h-[14px]" />
            <Field label={t("finance.card.paymentDate")} placeholder={todayLabel()} />
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
                {t("common.save")}
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={resetPay}>
                {t("common.cancel")}
              </Button>
            </div>
          </Card>
        ) : null}

        {cardBeingEdited ? (
          <Card
            label={t("finance.card.editTitle", { name: cardBeingEdited.name })}
            className="min-w-0 flex-[1_1_300px]"
          >
            <div className="flex flex-wrap gap-3">
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label={t("finance.card.name")}
                placeholder={t("finance.card.namePlaceholder")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                prefix={
                  <input
                    type="color"
                    aria-label={t("finance.card.colorLabel")}
                    value={editColor || "#f26311"}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="size-6 cursor-pointer rounded-[var(--ob-radius-sm)] border border-[var(--ob-color-border)] bg-transparent p-0 [&::-webkit-color-swatch]:rounded-[var(--ob-radius-sm)] [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:rounded-[var(--ob-radius-sm)] [&::-webkit-color-swatch-wrapper]:p-0"
                  />
                }
              />
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label={t("finance.card.balance")}
                numeric
                group
                suffix="đ"
                placeholder="0"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
              />
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label={t("finance.card.minPayment")}
                numeric
                group
                suffix="đ"
                placeholder="0"
                value={editMin}
                onChange={(e) => setEditMin(e.target.value)}
              />
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label={t("finance.card.limit")}
                numeric
                group
                suffix="đ"
                placeholder="0"
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
              />
              <Field
                className="min-w-0 flex-[1_1_220px]"
                label={t("finance.card.dueDate")}
                placeholder={t("finance.card.dueDatePlaceholder")}
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
                    color: editColor || undefined,
                  })
                  resetEdit()
                }}
              >
                {t("common.save")}
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={resetEdit}>
                {t("common.cancel")}
              </Button>
            </div>
          </Card>
        ) : null}

        <Card tone="soft" label={t("finance.card.reminder")} className="min-w-0 flex-[1_1_300px]">
          <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            {t("finance.card.reminderHint")}
          </p>
        </Card>
      </div>
      <AddCreditCardForm onAdd={onAddCard} />
      <AlertDialog
        open={!!deletingCard}
        onOpenChange={(open) => !open && setDeletingCard("")}
        title={t("finance.card.deleteTitle")}
        description={
          <>
            {t("finance.card.deleteDescPrefix")}
            <strong>{deletingCard}</strong>
            {t("finance.card.deleteDescSuffix")}
          </>
        }
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          if (deletingCard) onRemoveCard(deletingCard)
        }}
      />
    </div>
  )
}

export { CreditCardsTab }
