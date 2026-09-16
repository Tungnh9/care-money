"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { AddCreditCardForm } from "./add-credit-card-form"
import { EditCreditCardModal } from "./edit-credit-card-modal"
import { PayCreditCardModal } from "./pay-credit-card-modal"
import type { CreditCard } from "../types"

interface CreditCardsTabProps {
  cards: CreditCard[]
  onAddCard: (card: CreditCard) => void
  onPayCard: (name: string, amount: number) => void
  onUpdateCard: (originalName: string, card: CreditCard) => void
  onRemoveCard: (name: string) => void
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
  const [editingCard, setEditingCard] = useState("")
  const [deletingCard, setDeletingCard] = useState("")

  function startEdit(card: CreditCard) {
    setPayCard("")
    setEditingCard(card.name)
  }

  function startPay(name: string) {
    setEditingCard("")
    setPayCard(name)
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
                <Figure value={formatMoney(card.balance, hidden)} />
                <div className="my-4 flex flex-col divide-y divide-[var(--ob-color-border)]">
                  {(
                    [
                      ["Hạn thanh toán", card.due],
                      ["Trả tối thiểu", formatMoney(card.min, hidden)],
                      ["Hạn mức", formatMoney(card.limit, hidden)],
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

        <Card tone="soft" label="Nhắc trả nợ" className="min-w-0 flex-[1_1_300px]">
          <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            Trả đủ và đúng hạn để tránh mất lãi phát sinh trên dư nợ thẻ tín dụng.
          </p>
        </Card>
      </div>
      <AddCreditCardForm onAdd={onAddCard} />
      <PayCreditCardModal
        card={cards.find((c) => c.name === payCard) ?? null}
        onOpenChange={(open) => !open && setPayCard("")}
        onPay={(name, amount) => {
          onPayCard(name, amount)
          setPayCard("")
        }}
      />
      <EditCreditCardModal
        card={cards.find((c) => c.name === editingCard) ?? null}
        onOpenChange={(open) => !open && setEditingCard("")}
        onSave={(updated) => {
          if (editingCard) onUpdateCard(editingCard, updated)
          setEditingCard("")
        }}
      />
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
