"use client"

import { useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Figure } from "@/components/ob/figure"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { useT, useLocale } from "@/components/locale-provider"
import { formatMoney } from "@/lib/format"
import {
  goldPurchasePL,
  parseGoldPrice,
  pct1,
  phanToChi,
  type FinanceSummary,
} from "../finance-calculations"
import type { GoldPurchase } from "../types"
import { AddGoldForm } from "./add-gold-form"
import { GoldTransactionsCards } from "./gold-transactions-cards"
import { GoldTransactionsTable } from "./gold-transactions-table"

interface GoldTabProps {
  summary: FinanceSummary
  goldPrice: string
  onSetGoldPrice: (price: string) => void
  gold: GoldPurchase[]
  onAddGold: (purchase: Omit<GoldPurchase, "id">) => void
  onUpdateGold: (id: number, purchase: Omit<GoldPurchase, "id">) => void
  onRemoveGold: (id: number) => void
}

function signedMoney(n: number, hidden: boolean): string {
  return (n >= 0 ? "+ " : "− ") + formatMoney(Math.abs(n), hidden)
}

function GoldTab({
  summary,
  goldPrice,
  onSetGoldPrice,
  gold,
  onAddGold,
  onUpdateGold,
  onRemoveGold,
}: GoldTabProps) {
  const t = useT()
  const { locale } = useLocale()
  const { hidden } = useMoneyVisibility()
  const { goldPhan, goldCost, goldValue, goldPL, goldPct } = summary
  const gain = goldPL >= 0
  const maxBar = Math.max(goldCost, goldValue, 1)
  const avgCost = goldPhan > 0 ? goldCost / goldPhan : 0
  const marketPrice = parseGoldPrice(goldPrice)
  const purchasePLs = gold.map((p) => goldPurchasePL(p, marketPrice))
  const winCount = purchasePLs.filter((pl) => pl >= 0).length
  const lossCount = purchasePLs.filter((pl) => pl < 0).length
  const totalWin = purchasePLs.filter((pl) => pl >= 0).reduce((sum, pl) => sum + pl, 0)
  const totalLoss = purchasePLs.filter((pl) => pl < 0).reduce((sum, pl) => sum + pl, 0)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editPhan, setEditPhan] = useState("")
  const [editBuy, setEditBuy] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deletingPurchase = gold.find((p) => p.id === deletingId) ?? null

  function startEdit(purchase: GoldPurchase) {
    setEditingId(purchase.id)
    setEditDate(purchase.date)
    setEditPhan(String(purchase.phan))
    setEditBuy(String(purchase.buy))
  }

  function resetEdit() {
    setEditingId(null)
    setEditDate("")
    setEditPhan("")
    setEditBuy("")
  }

  const stats = [
    [t("finance.gold.holding"), t("finance.phanValue", { count: goldPhan })],
    [t("finance.gold.converted"), phanToChi(goldPhan, t)],
    [t("finance.gold.avgCost"), t("finance.gold.perUnit", { amount: formatMoney(Math.round(avgCost), hidden, locale) })],
    [t("finance.gold.marketPrice"), t("finance.gold.perUnit", { amount: formatMoney(marketPrice, hidden, locale) })],
  ] as const

  return (
    <div className="ob-card-grid flex flex-col gap-4">
      <Card label={t("finance.gold.plByMarket")}>
        <div className="flex flex-wrap gap-[28px]">
          <div className="flex-none">
            <Figure
              value={
                <span
                  style={{ color: gain ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                >
                  {signedMoney(goldPL, hidden)}
                </span>
              }
              delta={pct1(goldPct, locale)}
              direction={gain ? "up" : "down"}
            />
            <p className="mt-[10px] max-w-[28ch] text-[13.5px] leading-[1.5] text-[var(--ob-color-text-muted)]">
              {gain
                ? t("finance.gold.gainNote", { amount: formatMoney(goldPL, hidden, locale) })
                : t("finance.gold.lossNote", { amount: formatMoney(Math.abs(goldPL), hidden, locale) })}
            </p>
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="mb-4">
              <div className="mb-[7px] flex items-baseline justify-between gap-3">
                <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  {t("finance.gold.costBasis")}
                </span>
                <span className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-muted)]">
                  {formatMoney(goldCost, hidden, locale)}
                </span>
              </div>
              <Progress value={(goldCost / maxBar) * 100} tone="action" />
            </div>
            <div>
              <div className="mb-[7px] flex items-baseline justify-between gap-3">
                <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  {t("finance.gold.currentValue")}
                </span>
                <span className="text-[13.5px] font-bold [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(goldValue, hidden, locale)}
                </span>
              </div>
              <Progress value={(goldValue / maxBar) * 100} tone="reward" />
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--ob-color-border)] pt-5 sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {label}
              </div>
              <div className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums whitespace-nowrap">
                {value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card label={t("finance.gold.marketPriceToday")}>
        <Field
          label={t("finance.gold.marketPriceLabel")}
          numeric
          group
          suffix="đ"
          value={goldPrice}
          onChange={(e) => onSetGoldPrice(e.target.value)}
          hint={t("finance.gold.marketPriceHint")}
        />
      </Card>

      <AddGoldForm onAdd={onAddGold} />

      {editingId !== null ? (
        <Card label={t("finance.gold.editTitle")}>
          <div className="flex flex-wrap gap-3">
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label={t("finance.gold.purchaseDate")}
              placeholder={t("finance.gold.purchaseDatePlaceholder")}
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label={t("finance.gold.quantity")}
              numeric
              placeholder="0"
              value={editPhan}
              onChange={(e) => setEditPhan(e.target.value)}
              hint={t("finance.gold.quantityHint")}
            />
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label={t("finance.gold.buyPrice")}
              numeric
              group
              suffix="đ"
              placeholder="0"
              value={editBuy}
              onChange={(e) => setEditBuy(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-[10px]">
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!editDate.trim() || !editPhan.trim() || !editBuy.trim()}
              onClick={() => {
                onUpdateGold(editingId, {
                  date: editDate.trim(),
                  phan: Number(editPhan) || 0,
                  buy: Number(editBuy) || 0,
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

      <Card
        label={
          gold.length
            ? t("finance.gold.transactionsCount", { count: gold.length })
            : t("finance.gold.transactions")
        }
      >
        {gold.length ? (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-income)] bg-[var(--ob-color-income-soft)] px-3 py-[10px]">
              <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {t("finance.gold.winCount", { count: winCount })}
              </div>
              <div className="flex items-center gap-1 text-[15px] font-semibold [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-income)]">
                <TrendingUp size={14} />
                {formatMoney(totalWin, hidden, locale)}
              </div>
            </div>
            <div className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-expense)] bg-[var(--ob-color-expense-soft)] px-3 py-[10px]">
              <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {t("finance.gold.lossCount", { count: lossCount })}
              </div>
              <div className="flex items-center gap-1 text-[15px] font-semibold [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-expense)]">
                <TrendingDown size={14} />
                {formatMoney(Math.abs(totalLoss), hidden, locale)}
              </div>
            </div>
          </div>
        ) : null}
        <div className="hidden lg:block">
          <GoldTransactionsTable
            gold={gold}
            goldPrice={goldPrice}
            onRemove={setDeletingId}
            onEdit={startEdit}
          />
        </div>
        <div className="lg:hidden">
          <GoldTransactionsCards
            gold={gold}
            goldPrice={goldPrice}
            onRemove={setDeletingId}
            onEdit={startEdit}
          />
        </div>
      </Card>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t("finance.gold.deleteTitle")}
        description={
          <>
            {t("finance.gold.deleteDescPrefix")}
            <strong>{deletingPurchase?.date}</strong>
            {t("finance.gold.deleteDescSuffix")}
          </>
        }
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          if (deletingId !== null) onRemoveGold(deletingId)
        }}
      />
    </div>
  )
}

export { GoldTab }
