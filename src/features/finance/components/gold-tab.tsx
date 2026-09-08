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
import { formatMoney } from "@/lib/format"
import {
  goldPurchasePL,
  goldStorePrice,
  pct1,
  phanToChi,
  sortGoldByDate,
  type FinanceSummary,
} from "../finance-calculations"
import type { GoldPurchase, GoldStore } from "../types"
import { AddGoldForm } from "./add-gold-form"
import { GoldStorePicker } from "./gold-store-picker"
import { GoldStoresCard } from "./gold-stores-card"
import { GoldTransactionsCards } from "./gold-transactions-cards"
import { GoldTransactionsTable } from "./gold-transactions-table"

interface GoldTabProps {
  summary: FinanceSummary
  stores: GoldStore[]
  onAddGoldStore: (store: GoldStore) => void
  onUpdateGoldStore: (originalName: string, store: GoldStore) => void
  onRemoveGoldStore: (name: string) => void
  onSetGoldStorePrice: (name: string, price: string) => void
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
  stores,
  onAddGoldStore,
  onUpdateGoldStore,
  onRemoveGoldStore,
  onSetGoldStorePrice,
  gold,
  onAddGold,
  onUpdateGold,
  onRemoveGold,
}: GoldTabProps) {
  const { hidden } = useMoneyVisibility()
  const { goldPhan, goldCost, goldValue, goldPL, goldPct } = summary
  const gain = goldPL >= 0
  const maxBar = Math.max(goldCost, goldValue, 1)
  const avgCost = goldPhan > 0 ? goldCost / goldPhan : 0
  const avgValue = goldPhan > 0 ? goldValue / goldPhan : 0
  const sortedGold = sortGoldByDate(gold)
  const purchasePLs = gold.map((p) => goldPurchasePL(p, goldStorePrice(stores, p.store)))
  const winCount = purchasePLs.filter((pl) => pl >= 0).length
  const lossCount = purchasePLs.filter((pl) => pl < 0).length
  const totalWin = purchasePLs.filter((pl) => pl >= 0).reduce((sum, pl) => sum + pl, 0)
  const totalLoss = purchasePLs.filter((pl) => pl < 0).reduce((sum, pl) => sum + pl, 0)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editPhan, setEditPhan] = useState("")
  const [editBuy, setEditBuy] = useState("")
  const [editStore, setEditStore] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deletingPurchase = gold.find((p) => p.id === deletingId) ?? null

  function startEdit(purchase: GoldPurchase) {
    setEditingId(purchase.id)
    setEditDate(purchase.date)
    setEditPhan(String(purchase.phan))
    setEditBuy(String(purchase.buy))
    setEditStore(purchase.store)
  }

  function resetEdit() {
    setEditingId(null)
    setEditDate("")
    setEditPhan("")
    setEditBuy("")
    setEditStore("")
  }

  const stats = [
    ["Đang giữ", `${goldPhan} phân`],
    ["Quy đổi", phanToChi(goldPhan)],
    ["Giá vốn bình quân", `${formatMoney(Math.round(avgCost), hidden)} / phân`],
    ["Giá trị bình quân", `${formatMoney(Math.round(avgValue), hidden)} / phân`],
  ] as const

  return (
    <div className="ob-card-grid flex flex-col gap-4">
      <Card label="Lãi / lỗ theo giá thị trường">
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
              delta={pct1(goldPct)}
              direction={gain ? "up" : "down"}
            />
            <p className="mt-[10px] max-w-[28ch] text-[13.5px] leading-[1.5] text-[var(--ob-color-text-muted)]">
              {gain
                ? `Bạn đang lãi ${formatMoney(goldPL, hidden)} so với giá vốn nhờ giá vàng tăng.`
                : `Bạn đang lỗ ${formatMoney(Math.abs(goldPL), hidden)} so với giá vốn do giá vàng giảm.`}
            </p>
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="mb-4">
              <div className="mb-[7px] flex items-baseline justify-between gap-3">
                <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá vốn
                </span>
                <span className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-muted)]">
                  {formatMoney(goldCost, hidden)}
                </span>
              </div>
              <Progress value={(goldCost / maxBar) * 100} tone="action" />
            </div>
            <div>
              <div className="mb-[7px] flex items-baseline justify-between gap-3">
                <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá trị nay
                </span>
                <span className="text-[13.5px] font-bold [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(goldValue, hidden)}
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

      <GoldStoresCard
        stores={stores}
        gold={gold}
        onAdd={onAddGoldStore}
        onUpdate={onUpdateGoldStore}
        onRemove={onRemoveGoldStore}
        onSetPrice={onSetGoldStorePrice}
      />

      <AddGoldForm stores={stores} onAdd={onAddGold} />

      {editingId !== null ? (
        <Card label="Sửa lần mua vàng">
          <div className="flex flex-wrap gap-3">
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label="Ngày mua"
              placeholder="vd: 10/08/2026"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label="Khối lượng (phân)"
              numeric
              placeholder="0"
              value={editPhan}
              onChange={(e) => setEditPhan(e.target.value)}
              hint="10 phân = 1 chỉ"
            />
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label="Giá mua (mỗi phân)"
              numeric
              group
              suffix="đ"
              placeholder="0"
              value={editBuy}
              onChange={(e) => setEditBuy(e.target.value)}
            />
          </div>
          <div className="mt-3">
            <GoldStorePicker stores={stores} selected={editStore} onSelect={setEditStore} />
          </div>
          <div className="mt-4 flex gap-[10px]">
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!editDate.trim() || !editPhan.trim() || !editBuy.trim() || !editStore}
              onClick={() => {
                onUpdateGold(editingId, {
                  date: editDate.trim(),
                  phan: Number(editPhan) || 0,
                  buy: Number(editBuy) || 0,
                  store: editStore,
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

      <Card label={`Các lần mua vàng${gold.length ? ` · ${gold.length} lần` : ""}`}>
        {gold.length ? (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-income)] bg-[var(--ob-color-income-soft)] px-3 py-[10px]">
              <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {winCount} lần lãi
              </div>
              <div className="flex items-center gap-1 text-[15px] font-semibold [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-income)]">
                <TrendingUp size={14} />
                {formatMoney(totalWin, hidden)}
              </div>
            </div>
            <div className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-expense)] bg-[var(--ob-color-expense-soft)] px-3 py-[10px]">
              <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {lossCount} lần lỗ
              </div>
              <div className="flex items-center gap-1 text-[15px] font-semibold [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-expense)]">
                <TrendingDown size={14} />
                {formatMoney(Math.abs(totalLoss), hidden)}
              </div>
            </div>
          </div>
        ) : null}
        <div className="hidden lg:block">
          <GoldTransactionsTable
            gold={sortedGold}
            stores={stores}
            onRemove={setDeletingId}
            onEdit={startEdit}
          />
        </div>
        <div className="lg:hidden">
          <GoldTransactionsCards
            gold={sortedGold}
            stores={stores}
            onRemove={setDeletingId}
            onEdit={startEdit}
          />
        </div>
      </Card>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xoá giao dịch vàng?"
        description={
          <>
            Xoá giao dịch mua vàng ngày &quot;<strong>{deletingPurchase?.date}</strong>&quot; sẽ
            không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingId !== null) onRemoveGold(deletingId)
        }}
      />
    </div>
  )
}

export { GoldTab }
