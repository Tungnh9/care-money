"use client"

import { useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import {
  goldPurchasePL,
  goldStorePrice,
  pct1,
  phanToChi,
  signedMoney,
  sortGoldByDate,
  summarizeGoldByStore,
  type FinanceSummary,
  type GoldStoreSummary,
} from "../finance-calculations"
import type { GoldPurchase, GoldStore } from "../types"
import { AddGoldForm } from "./add-gold-form"
import { EditGoldPurchaseModal } from "./edit-gold-purchase-modal"
import { GoldStoreSummaryCards } from "./gold-store-summary-cards"
import { GoldStoreSummaryTable } from "./gold-store-summary-table"
import { GoldStoresCard } from "./gold-stores-card"
import { GoldTransactionsCards } from "./gold-transactions-cards"
import { GoldTransactionsTable } from "./gold-transactions-table"

const GOLD_LIST_PAGE_SIZE = 5

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
  const storeSummaries = summarizeGoldByStore(gold, stores)
  const storeTotal: GoldStoreSummary = {
    store: "Tổng cộng",
    phan: goldPhan,
    avgBuy: Math.round(avgCost),
    cost: goldCost,
    value: goldValue,
    pl: goldPL,
  }

  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deletingPurchase = gold.find((p) => p.id === deletingId) ?? null
  // Danh sách giao dịch có thể rất dài — chỉ hiện dần từng đợt, tránh 1 bảng dài vô tận ngay khi mở tab.
  const [visibleGoldCount, setVisibleGoldCount] = useState(GOLD_LIST_PAGE_SIZE)
  const visibleGold = sortedGold.slice(0, visibleGoldCount)
  const isGoldListExpanded = visibleGoldCount >= sortedGold.length

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
                  Giá hiện tại
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
            gold={visibleGold}
            stores={stores}
            onRemove={setDeletingId}
            onEdit={(purchase) => setEditingId(purchase.id)}
          />
        </div>
        <div className="lg:hidden">
          <GoldTransactionsCards
            gold={visibleGold}
            stores={stores}
            onRemove={setDeletingId}
            onEdit={(purchase) => setEditingId(purchase.id)}
          />
        </div>
        {sortedGold.length > GOLD_LIST_PAGE_SIZE ? (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() =>
                setVisibleGoldCount(
                  isGoldListExpanded
                    ? GOLD_LIST_PAGE_SIZE
                    : Math.min(visibleGoldCount + GOLD_LIST_PAGE_SIZE, sortedGold.length)
                )
              }
              className="text-[12.5px] font-semibold text-[var(--ob-color-action-strong)]"
            >
              {isGoldListExpanded ? "Thu gọn" : "Xem thêm"}
            </button>
          </div>
        ) : null}
        {storeSummaries.length ? (
          <div className="mt-5">
            <div className="ob-wave-divider mb-4" />
            <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
              Tổng hợp theo cửa hàng
            </div>
            <div className="hidden lg:block">
              <GoldStoreSummaryTable summaries={storeSummaries} total={storeTotal} />
            </div>
            <div className="lg:hidden">
              <GoldStoreSummaryCards summaries={storeSummaries} total={storeTotal} />
            </div>
          </div>
        ) : null}
      </Card>

      <EditGoldPurchaseModal
        purchase={gold.find((p) => p.id === editingId) ?? null}
        stores={stores}
        onOpenChange={(open) => !open && setEditingId(null)}
        onSave={(id, updated) => {
          onUpdateGold(id, updated)
          setEditingId(null)
        }}
      />
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
