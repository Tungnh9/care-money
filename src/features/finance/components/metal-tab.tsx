"use client"

import { useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { pct1, signedMoney } from "@/lib/finance/finance-calculations"
import {
  metalMarketPrice,
  metalPLTone,
  metalPurchasePL,
  sortByPurchaseDate,
  summarizeMetalByStore,
  unpricedMetalStores,
  type MetalHolding,
  type MetalStoreSummary,
} from "@/lib/finance/metal-calculations"
import type { MetalPurchaseBase, MetalStore } from "@/lib/finance/types"
import type { MetalConfig } from "../metal-config"
import { AddMetalPurchaseForm } from "./add-metal-purchase-form"
import { EditMetalPurchaseModal } from "./edit-metal-purchase-modal"
import { MetalStoreSummaryCards } from "./metal-store-summary-cards"
import { MetalStoreSummaryTable } from "./metal-store-summary-table"
import { MetalStoresCard } from "./metal-stores-card"
import { MetalTransactionsCards } from "./metal-transactions-cards"
import { MetalTransactionsTable } from "./metal-transactions-table"

const PURCHASE_LIST_PAGE_SIZE = 5

interface MetalTabProps<P extends MetalPurchaseBase> {
  metal: MetalConfig<P>
  // Tổng đang giữ lấy từ FinanceSummary (cùng số với trụ và Tài sản ròng), không tính lại ở đây.
  holding: MetalHolding
  stores: MetalStore[]
  onAddStore: (store: MetalStore) => void
  onUpdateStore: (originalName: string, store: MetalStore) => void
  onRemoveStore: (name: string) => void
  onSetStorePrice: (name: string, price: string) => void
  purchases: P[]
  onAddPurchase: (purchase: Omit<P, "id">) => void
  onUpdatePurchase: (id: number, purchase: Omit<P, "id">) => void
  onRemovePurchase: (id: number) => void
}

// Nội dung tab "Tích lũy vàng"/"Tích lũy bạc": GoldTab và SilverTab chỉ gắn cấu hình + dữ liệu của
// kim loại mình vào đây. Hai tab là 2 kiểu component khác nhau nên đổi tab là dựng lại từ đầu — form
// đang mở hay số vừa gõ ở tab này không mang sang tab kia.
function MetalTab<P extends MetalPurchaseBase>({
  metal,
  holding,
  stores,
  onAddStore,
  onUpdateStore,
  onRemoveStore,
  onSetStorePrice,
  purchases,
  onAddPurchase,
  onUpdatePurchase,
  onRemovePurchase,
}: MetalTabProps<P>) {
  const { hidden } = useMoneyVisibility()
  const { qty, cost, value, pl, pct } = holding
  const plTone = metalPLTone(pl)
  // Hoà vốn (hay chưa có gì) thì hiện "0 ₫" trơn — "+ 0 ₫" màu xanh là báo lãi không có thật.
  const plText = plTone === "even" ? formatMoney(0, hidden) : signedMoney(pl, hidden)
  const unpriced = unpricedMetalStores(purchases, stores)
  const maxBar = Math.max(cost, value, 1)
  const avgCost = qty > 0 ? cost / qty : 0
  const avgValue = qty > 0 ? value / qty : 0
  const sortedPurchases = sortByPurchaseDate(purchases)
  const purchasePLs = purchases.map((p) =>
    metalPurchasePL(metal.quantityOf(p), p.buy, metalMarketPrice(stores, p))
  )
  const winCount = purchasePLs.filter((pl) => metalPLTone(pl) === "gain").length
  const lossCount = purchasePLs.filter((pl) => metalPLTone(pl) === "loss").length
  const totalWin = purchasePLs.filter((pl) => metalPLTone(pl) === "gain").reduce((sum, pl) => sum + pl, 0)
  const totalLoss = purchasePLs.filter((pl) => metalPLTone(pl) === "loss").reduce((sum, pl) => sum + pl, 0)
  const storeSummaries = summarizeMetalByStore(purchases, stores, metal.quantityOf)
  const storeTotal: MetalStoreSummary = {
    store: "Tổng cộng",
    qty,
    avgBuy: Math.round(avgCost),
    cost,
    value,
    pl,
  }

  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deletingPurchase = purchases.find((p) => p.id === deletingId) ?? null
  // Danh sách giao dịch có thể rất dài — chỉ hiện dần từng đợt, tránh 1 bảng dài vô tận ngay khi mở tab.
  const [visibleCount, setVisibleCount] = useState(PURCHASE_LIST_PAGE_SIZE)
  const visiblePurchases = sortedPurchases.slice(0, visibleCount)
  const isListExpanded = visibleCount >= sortedPurchases.length

  const stats: [label: string, value: string][] = [
    ["Đang giữ", metal.formatHeld(qty)],
    ...(metal.formatConverted ? [["Quy đổi", metal.formatConverted(qty)] as [string, string]] : []),
    ["Giá vốn bình quân", `${formatMoney(Math.round(avgCost), hidden)} / ${metal.unit}`],
    ["Giá trị bình quân", `${formatMoney(Math.round(avgValue), hidden)} / ${metal.unit}`],
  ]

  return (
    <div className="ob-card-grid flex flex-col gap-4">
      <Card label="Lãi / lỗ theo giá thị trường">
        <div className="flex flex-wrap gap-[28px]">
          <div className="flex-none">
            <Figure
              value={
                <span
                  style={{
                    color:
                      plTone === "gain"
                        ? "var(--ob-color-income)"
                        : plTone === "loss"
                          ? "var(--ob-color-expense)"
                          : undefined,
                  }}
                >
                  {plText}
                </span>
              }
              fitChars={plText.length}
              // Hoà vốn (hay chưa có gì) thì không có ▲/▼: "▲ +0,0%" là báo lãi không có thật.
              delta={plTone !== "even" ? pct1(pct) : undefined}
              direction={plTone === "loss" ? "down" : "up"}
            />
            <p className="mt-[10px] max-w-[28ch] text-[13.5px] leading-[1.5] text-[var(--ob-color-text-muted)]">
              {qty === 0
                ? `Chưa có ${metal.noun} nào — thêm lần mua đầu tiên để theo dõi lãi/lỗ.`
                : plTone === "gain"
                  ? `Bạn đang lãi ${formatMoney(pl, hidden)} so với giá vốn nhờ giá ${metal.noun} tăng.`
                  : plTone === "loss"
                    ? `Bạn đang lỗ ${formatMoney(Math.abs(pl), hidden)} so với giá vốn do giá ${metal.noun} giảm.`
                    : "Giá hiện tại đang bằng giá vốn — chưa lãi cũng chưa lỗ."}
            </p>
            {unpriced.length ? (
              <p className="mt-2 max-w-[28ch] text-[12.5px] leading-[1.5] text-[var(--ob-color-text-subtle)]">
                {`Chưa nhập giá hôm nay cho ${unpriced.join(", ")} — ${metal.noun} mua ở đó đang tạm tính theo giá mua.`}
              </p>
            ) : null}
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="mb-4">
              <div className="mb-[7px] flex items-baseline justify-between gap-3">
                <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá vốn
                </span>
                <span className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-muted)]">
                  {formatMoney(cost, hidden)}
                </span>
              </div>
              <Progress value={(cost / maxBar) * 100} tone="action" />
            </div>
            <div>
              <div className="mb-[7px] flex items-baseline justify-between gap-3">
                <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá hiện tại
                </span>
                <span className="text-[13.5px] font-bold [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(value, hidden)}
                </span>
              </div>
              <Progress value={(value / maxBar) * 100} tone="reward" />
            </div>
          </div>
        </div>
        <div
          className={cn(
            "mt-5 grid grid-cols-2 gap-3 border-t border-[var(--ob-color-border)] pt-5",
            stats.length > 3 ? "sm:grid-cols-4" : "sm:grid-cols-3"
          )}
        >
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

      <MetalStoresCard
        metal={metal}
        stores={stores}
        purchases={purchases}
        onAdd={onAddStore}
        onUpdate={onUpdateStore}
        onRemove={onRemoveStore}
        onSetPrice={onSetStorePrice}
      />

      <AddMetalPurchaseForm metal={metal} stores={stores} onAdd={onAddPurchase} />

      <Card label={`Các lần mua ${metal.noun}${purchases.length ? ` · ${purchases.length} lần` : ""}`}>
        {purchases.length ? (
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
          <MetalTransactionsTable
            metal={metal}
            purchases={visiblePurchases}
            stores={stores}
            onRemove={setDeletingId}
            onEdit={(purchase) => setEditingId(purchase.id)}
          />
        </div>
        <div className="lg:hidden">
          <MetalTransactionsCards
            metal={metal}
            purchases={visiblePurchases}
            stores={stores}
            onRemove={setDeletingId}
            onEdit={(purchase) => setEditingId(purchase.id)}
          />
        </div>
        {sortedPurchases.length > PURCHASE_LIST_PAGE_SIZE ? (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() =>
                setVisibleCount(
                  isListExpanded
                    ? PURCHASE_LIST_PAGE_SIZE
                    : Math.min(visibleCount + PURCHASE_LIST_PAGE_SIZE, sortedPurchases.length)
                )
              }
              className="text-[12.5px] font-semibold text-[var(--ob-color-action-strong)]"
            >
              {isListExpanded ? "Thu gọn" : "Xem thêm"}
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
              <MetalStoreSummaryTable metal={metal} summaries={storeSummaries} total={storeTotal} />
            </div>
            <div className="lg:hidden">
              <MetalStoreSummaryCards metal={metal} summaries={storeSummaries} total={storeTotal} />
            </div>
          </div>
        ) : null}
      </Card>

      <EditMetalPurchaseModal
        metal={metal}
        purchase={purchases.find((p) => p.id === editingId) ?? null}
        stores={stores}
        onOpenChange={(open) => !open && setEditingId(null)}
        onSave={(id, updated) => {
          onUpdatePurchase(id, updated)
          setEditingId(null)
        }}
      />
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={`Xoá giao dịch ${metal.noun}?`}
        description={
          <>
            {`Xoá giao dịch mua ${metal.noun} ngày "`}
            <strong>{deletingPurchase?.date}</strong>
            {`" sẽ không thể hoàn tác.`}
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingId !== null) onRemovePurchase(deletingId)
        }}
      />
    </div>
  )
}

export { MetalTab }
