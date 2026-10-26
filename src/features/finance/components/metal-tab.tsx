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
  earliestTakeoutDate,
  takenOutByPurchase,
  heldQuantityOf,
  metalMarketPrice,
  metalPLTone,
  metalPurchasePL,
  sortByPurchaseDate,
  summarizeMetalByStore,
  unpricedMetalStores,
  type MetalHolding,
  type MetalStoreSummary,
} from "@/lib/finance/metal-calculations"
import { formatTakenOut } from "@/lib/finance/metal-naming"
import type {
  MetalGift,
  MetalGiftInput,
  MetalPurchaseBase,
  MetalSale,
  MetalSaleInput,
  MetalStore,
  SavingsFund,
} from "@/lib/finance/types"
import type { MetalConfig } from "../metal-config"
import { AddMetalPurchaseForm } from "./add-metal-purchase-form"
import { EditMetalPurchaseModal } from "./edit-metal-purchase-modal"
import { MetalGiftHistoryCard } from "./metal-gift-history-card"
import { MetalGiftModal, type MetalGiftTarget } from "./metal-gift-modal"
import { MetalSaleHistoryCard } from "./metal-sale-history-card"
import { MetalSaleModal, type MetalSaleTarget } from "./metal-sale-modal"
import { MetalStoreSummaryCards } from "./metal-store-summary-cards"
import { MetalStoreSummaryTable } from "./metal-store-summary-table"
import { MetalStoresCard } from "./metal-stores-card"
import { MetalTransactionsCards } from "./metal-transactions-cards"
import { MetalTransactionsTable } from "./metal-transactions-table"

const PURCHASE_LIST_PAGE_SIZE = 5
const NO_FUND_TO_SELL_INTO = "Chưa có sổ tiết kiệm nào để nhận tiền — tạo 1 sổ ở tab Tiết kiệm trước."

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
  gifts: MetalGift[]
  // Trả true khi đã ghi — modal Tặng chỉ đóng khi true.
  onAddGift: (purchaseId: number, input: MetalGiftInput) => boolean
  onUpdateGift: (id: number, input: MetalGiftInput) => boolean
  onRemoveGift: (id: number) => void
  sales: MetalSale[]
  // Sổ tiết kiệm nhận tiền bán — chưa có sổ nào thì nút Bán bị khoá.
  savings: SavingsFund[]
  // Trả true khi đã ghi — modal Bán chỉ đóng khi true.
  onAddSale: (purchaseId: number, input: MetalSaleInput) => boolean
  onRemoveSale: (id: number) => void
}

// Modal Tặng đang mở cho lần mua nào; `giftId` khác null = đang sửa lần tặng đó.
interface GiftTargetIds {
  purchaseId: number
  giftId: number | null
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
  gifts,
  onAddGift,
  onUpdateGift,
  onRemoveGift,
  sales,
  savings,
  onAddSale,
  onRemoveSale,
}: MetalTabProps<P>) {
  const { hidden } = useMoneyVisibility()
  const { qty, cost, value, pl, pct } = holding
  const plTone = metalPLTone(pl)
  // Hoà vốn (hay chưa có gì) thì hiện "0 ₫" trơn — "+ 0 ₫" màu xanh là báo lãi không có thật.
  const plText = plTone === "even" ? formatMoney(0, hidden) : signedMoney(pl, hidden)
  // Mỗi lần mua chỉ còn phần chưa tặng/bán; lần mua đã lấy ra hết không còn trong danh sách đang giữ (vẫn có
  // trong lịch sử tặng/bán). Thẻ "Giá thị trường hôm nay" vẫn nhận mọi lần mua để giữ chặn xoá cửa hàng.
  const gifted = takenOutByPurchase(gifts)
  const sold = takenOutByPurchase(sales)
  const heldQty = heldQuantityOf(metal.quantityOf, [...gifts, ...sales])
  const heldPurchases = purchases.filter((p) => heldQty(p) > 0)
  const giftedPurchases = purchases.filter((p) => gifted.has(p.id))
  const soldPurchases = purchases.filter((p) => sold.has(p.id))
  const allTakenOut = purchases.length > 0 && heldPurchases.length === 0
  const allTakenOutNote = !soldPurchases.length
    ? `Đã tặng hết các lần mua ${metal.noun} — xem lại ở mục Lịch sử tặng.`
    : giftedPurchases.length
      ? `Đã tặng và bán hết các lần mua ${metal.noun} — xem lại ở mục Lịch sử tặng và Lịch sử bán.`
      : `Đã bán hết các lần mua ${metal.noun} — xem lại ở mục Lịch sử bán.`
  const unpriced = unpricedMetalStores(heldPurchases, stores)
  const maxBar = Math.max(cost, value, 1)
  const avgCost = qty > 0 ? cost / qty : 0
  const avgValue = qty > 0 ? value / qty : 0
  const sortedPurchases = sortByPurchaseDate(heldPurchases)
  const purchasePLs = heldPurchases.map((p) => metalPurchasePL(heldQty(p), p.buy, metalMarketPrice(stores, p)))
  const gains = purchasePLs.filter((purchasePL) => metalPLTone(purchasePL) === "gain")
  const losses = purchasePLs.filter((purchasePL) => metalPLTone(purchasePL) === "loss")
  const winCount = gains.length
  const lossCount = losses.length
  const totalWin = gains.reduce((sum, purchasePL) => sum + purchasePL, 0)
  const totalLoss = losses.reduce((sum, purchasePL) => sum + purchasePL, 0)
  const storeSummaries = summarizeMetalByStore(heldPurchases, stores, heldQty)
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
  const editingGifted = editingId !== null ? (gifted.get(editingId) ?? 0) : 0
  const editingSold = editingId !== null ? (sold.get(editingId) ?? 0) : 0
  const editingTakenOut = formatTakenOut(metal, editingGifted, editingSold)
  const deletingPurchase = purchases.find((p) => p.id === deletingId) ?? null
  // Danh sách giao dịch có thể rất dài — chỉ hiện dần từng đợt, tránh 1 bảng dài vô tận ngay khi mở tab.
  const [visibleCount, setVisibleCount] = useState(PURCHASE_LIST_PAGE_SIZE)
  const visiblePurchases = sortedPurchases.slice(0, visibleCount)
  const isListExpanded = visibleCount >= sortedPurchases.length

  const [giftTarget, setGiftTarget] = useState<GiftTargetIds | null>(null)
  const [undoingGiftId, setUndoingGiftId] = useState<number | null>(null)
  // Dựng lại từ dữ liệu hiện tại mỗi lần render: lần mua/lần tặng biến mất (tab khác vừa xoá) thì modal tự
  // đóng thay vì ghi vào thứ không còn. Sửa 1 lần tặng: tặng được tối đa = phần còn lại + chính số của nó.
  const giftPurchase = giftTarget ? (purchases.find((p) => p.id === giftTarget.purchaseId) ?? null) : null
  const editingGift =
    giftTarget && giftTarget.giftId !== null ? (gifts.find((g) => g.id === giftTarget.giftId) ?? null) : null
  const giftModalTarget: MetalGiftTarget | null = !giftTarget
    ? null
    : giftTarget.giftId === null
      ? giftPurchase && {
          purchaseDate: giftPurchase.date,
          store: giftPurchase.store,
          available: heldQty(giftPurchase),
          gift: null,
        }
      : editingGift && {
          purchaseDate: giftPurchase?.date ?? "",
          // Tên cửa hàng hiện tại của lần mua (có thể đã đổi tên sau khi tặng); lịch sử vẫn giữ bản chụp.
          store: giftPurchase?.store ?? editingGift.store,
          available: (giftPurchase ? heldQty(giftPurchase) : 0) + editingGift.qty,
          gift: editingGift,
        }
  const undoingGift = gifts.find((g) => g.id === undoingGiftId) ?? null
  const undoingPurchase = undoingGift ? purchases.find((p) => p.id === undoingGift.purchaseId) : undefined
  // Bản ghi đang mở đã biến mất (tab khác vừa xoá/huỷ): bỏ luôn trạng thái "đang mở". Giữ lại thì 1 bản ghi
  // mới lấy lại đúng id đó (nextId) sẽ tự bật modal/hộp xác nhận lên mà không ai bấm.
  if (giftTarget && !giftModalTarget) setGiftTarget(null)
  if (undoingGiftId !== null && !undoingGift) setUndoingGiftId(null)

  const [salePurchaseId, setSalePurchaseId] = useState<number | null>(null)
  const [undoingSaleId, setUndoingSaleId] = useState<number | null>(null)
  const salePurchase = salePurchaseId !== null ? (purchases.find((p) => p.id === salePurchaseId) ?? null) : null
  const saleModalTarget: MetalSaleTarget | null = salePurchase && {
    purchaseDate: salePurchase.date,
    store: salePurchase.store,
    buy: salePurchase.buy,
    available: heldQty(salePurchase),
  }
  const undoingSale = sales.find((sale) => sale.id === undoingSaleId) ?? null
  const undoingSalePurchase = undoingSale ? purchases.find((p) => p.id === undoingSale.purchaseId) : undefined
  // Như phần Tặng: lần mua/lần bán đang mở biến mất thì bỏ luôn trạng thái "đang mở".
  if (salePurchaseId !== null && !saleModalTarget) setSalePurchaseId(null)
  if (undoingSaleId !== null && !undoingSale) setUndoingSaleId(null)

  function saveGift(input: MetalGiftInput): boolean {
    if (!giftTarget) return false
    return giftTarget.giftId === null ? onAddGift(giftTarget.purchaseId, input) : onUpdateGift(giftTarget.giftId, input)
  }

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
          {stats.map(([label, text]) => (
            <div key={label}>
              <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {label}
              </div>
              <div className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums whitespace-nowrap">
                {text}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <MetalStoresCard
        metal={metal}
        stores={stores}
        purchases={purchases}
        heldPurchases={heldPurchases}
        giftedPurchases={giftedPurchases}
        soldPurchases={soldPurchases}
        onAdd={onAddStore}
        onUpdate={onUpdateStore}
        onRemove={onRemoveStore}
        onSetPrice={onSetStorePrice}
      />

      <AddMetalPurchaseForm metal={metal} stores={stores} onAdd={onAddPurchase} />

      <Card label={`Các lần mua ${metal.noun}${heldPurchases.length ? ` · ${heldPurchases.length} lần` : ""}`}>
        {heldPurchases.length ? (
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
        {heldPurchases.length && !savings.length ? (
          // Nút Bán bị khoá chỉ giải thích qua title — màn cảm ứng không hiện, nên nói ngay trên thẻ.
          <p className="mb-3 text-[12.5px] leading-[1.5] text-[var(--ob-color-text-subtle)]">
            Nút Bán đang khoá vì chưa có sổ tiết kiệm nào để nhận tiền — tạo 1 sổ ở tab Tiết kiệm trước.
          </p>
        ) : null}
        {allTakenOut ? (
          <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">{allTakenOutNote}</p>
        ) : (
          <>
            <div className="hidden lg:block">
              <MetalTransactionsTable
                metal={metal}
                purchases={visiblePurchases}
                stores={stores}
                onRemove={setDeletingId}
                onEdit={(purchase) => setEditingId(purchase.id)}
                gifted={gifted}
                sold={sold}
                onGift={(purchase) => setGiftTarget({ purchaseId: purchase.id, giftId: null })}
                onSell={(purchase) => setSalePurchaseId(purchase.id)}
                sellBlockedReason={savings.length ? undefined : NO_FUND_TO_SELL_INTO}
              />
            </div>
            <div className="lg:hidden">
              <MetalTransactionsCards
                metal={metal}
                purchases={visiblePurchases}
                stores={stores}
                onRemove={setDeletingId}
                onEdit={(purchase) => setEditingId(purchase.id)}
                gifted={gifted}
                sold={sold}
                onGift={(purchase) => setGiftTarget({ purchaseId: purchase.id, giftId: null })}
                onSell={(purchase) => setSalePurchaseId(purchase.id)}
                sellBlockedReason={savings.length ? undefined : NO_FUND_TO_SELL_INTO}
              />
            </div>
          </>
        )}
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

      <MetalGiftHistoryCard
        metal={metal}
        gifts={gifts}
        onEdit={(gift) => setGiftTarget({ purchaseId: gift.purchaseId, giftId: gift.id })}
        onRemove={(gift) => setUndoingGiftId(gift.id)}
      />

      <MetalSaleHistoryCard
        metal={metal}
        sales={sales}
        savings={savings}
        onRemove={(sale) => setUndoingSaleId(sale.id)}
      />

      <EditMetalPurchaseModal
        metal={metal}
        purchase={purchases.find((p) => p.id === editingId) ?? null}
        stores={stores}
        minQuantity={editingGifted + editingSold}
        minQuantityHint={
          editingTakenOut
            ? `${editingTakenOut.charAt(0).toUpperCase()}${editingTakenOut.slice(1)} từ lần mua này — số lượng không được nhỏ hơn.`
            : undefined
        }
        latestDate={
          editingId !== null ? (earliestTakeoutDate([...gifts, ...sales], editingId) ?? undefined) : undefined
        }
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
      <MetalGiftModal
        metal={metal}
        target={giftModalTarget}
        onOpenChange={(open) => !open && setGiftTarget(null)}
        onSave={saveGift}
      />
      <AlertDialog
        open={!!undoingGift}
        onOpenChange={(open) => !open && setUndoingGiftId(null)}
        title="Huỷ lần tặng này?"
        description={
          !undoingGift
            ? undefined
            : undoingPurchase
              ? `${metal.formatQuantity(undoingGift.qty)} sẽ trả về lần mua ngày ${undoingPurchase.date} ở ${undoingPurchase.store}.`
              : `Lần mua gốc không còn — huỷ chỉ xoá lần tặng ${metal.formatQuantity(undoingGift.qty)} khỏi lịch sử.`
        }
        confirmLabel="Huỷ lần tặng"
        cancelLabel="Giữ lại"
        onConfirm={() => {
          if (undoingGiftId !== null) onRemoveGift(undoingGiftId)
        }}
      />
      <MetalSaleModal
        metal={metal}
        target={saleModalTarget}
        savings={savings}
        onOpenChange={(open) => !open && setSalePurchaseId(null)}
        onSave={(input) => salePurchaseId !== null && onAddSale(salePurchaseId, input)}
      />
      <AlertDialog
        open={!!undoingSale}
        onOpenChange={(open) => !open && setUndoingSaleId(null)}
        title="Huỷ lần bán này?"
        description={
          !undoingSale
            ? undefined
            : undoingSalePurchase
              ? `${metal.formatQuantity(undoingSale.qty)} sẽ trả về lần mua ngày ${undoingSalePurchase.date} ở ${undoingSalePurchase.store}, và ${formatMoney(undoingSale.received, hidden)} được rút lại khỏi sổ "${undoingSale.fundName}".`
              : `Lần mua gốc không còn — huỷ xoá lần bán ${metal.formatQuantity(undoingSale.qty)} khỏi lịch sử, và ${formatMoney(undoingSale.received, hidden)} được rút lại khỏi sổ "${undoingSale.fundName}".`
        }
        confirmLabel="Huỷ lần bán"
        cancelLabel="Giữ lại"
        onConfirm={() => {
          if (undoingSaleId !== null) onRemoveSale(undoingSaleId)
        }}
      />
    </div>
  )
}

export { MetalTab }
