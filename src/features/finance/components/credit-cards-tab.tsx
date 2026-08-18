"use client"

import { useState } from "react"

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
}

function todayLabel() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${now.getFullYear()}`
}

function CreditCardsTab({ cards, onAddCard, onPayCard }: CreditCardsTabProps) {
  const { hidden } = useMoneyVisibility()
  const [payCard, setPayCard] = useState("")
  const [payAmount, setPayAmount] = useState("")

  const payingCard = cards.find((card) => card.name === payCard)

  function resetPay() {
    setPayCard("")
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
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setPayCard(card.name)
                      setPayAmount("")
                    }}
                  >
                    Ghi một lần trả
                  </Button>
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

        <Card tone="soft" label="Nhắc trả nợ" className="min-w-0 flex-[1_1_300px]">
          <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            Trả đủ và đúng hạn để tránh mất lãi phát sinh trên dư nợ thẻ tín dụng.
          </p>
        </Card>
      </div>
      <AddCreditCardForm onAdd={onAddCard} />
    </div>
  )
}

export { CreditCardsTab }
