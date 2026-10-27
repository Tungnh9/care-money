"use client"

import { Gift, HandCoins, Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { ActionTooltip } from "@/components/ob/action-tooltip"
import { formatMoney } from "@/lib/format"
import { metalMarketPrice, metalPLTone, metalPurchaseLabels, metalPurchasePL } from "@/lib/finance/metal-calculations"
import { takenOutParts } from "@/lib/finance/metal-naming"
import type { MetalPurchaseBase, MetalStore } from "@/lib/finance/types"
import type { MetalConfig } from "../metal-config"
import { MetalPLBadge } from "./metal-pl-indicator"
import { TakenOutNote } from "./taken-out-note"

interface MetalTransactionsTableProps<P extends MetalPurchaseBase> {
  metal: MetalConfig<P>
  purchases: P[]
  stores: MetalStore[]
  onRemove: (id: number) => void
  onEdit: (purchase: P) => void
  // Tổng đã tặng / đã bán theo id lần mua: hiện số còn lại (định giá theo số đó) kèm "đã tặng … · đã bán …".
  gifted?: Map<number, number>
  sold?: Map<number, number>
  // Có thì mỗi lần mua có nút Tặng / nút Bán.
  onGift?: (purchase: P) => void
  onSell?: (purchase: P) => void
  // Khác rỗng thì nút Bán bị khoá với lý do này (vd. chưa có sổ tiết kiệm nào để nhận tiền).
  sellBlockedReason?: string
}

const NO_TAKEOUTS = new Map<number, number>()
// Lần tặng/bán trỏ tới lần mua theo id — xoá lần mua đã có lần tặng/bán thì lịch sử mồ côi (hook cũng chặn).
const REMOVE_BLOCKED_REASON = "Không thể xoá — lần mua này đã có lần tặng. Huỷ các lần tặng trước."
const REMOVE_BLOCKED_BY_SALE_REASON = "Không thể xoá — lần mua này đã có lần tặng hoặc lần bán. Huỷ chúng trước."

const HEADERS = ["Ngày mua", "Cửa hàng", "Khối lượng", "Giá mua", "Giá vốn", "Giá hiện tại", "Lãi lỗ", ""]

function MetalTransactionsTable<P extends MetalPurchaseBase>({
  metal,
  purchases,
  stores,
  onRemove,
  onEdit,
  gifted = NO_TAKEOUTS,
  sold = NO_TAKEOUTS,
  onGift,
  onSell,
  sellBlockedReason,
}: MetalTransactionsTableProps<P>) {
  const { hidden } = useMoneyVisibility()

  if (!purchases.length) {
    return (
      <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
        {`Chưa có giao dịch ${metal.noun} nào. Thêm lần mua đầu tiên để bắt đầu theo dõi lãi/lỗ.`}
      </p>
    )
  }

  const labels = metalPurchaseLabels(purchases, (p) => metal.formatQuantity(metal.quantityOf(p)))

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr>
            {HEADERS.map((header, index) => (
              <th
                key={header || `col-${index}`}
                className={
                  "whitespace-nowrap py-[10px] px-[12px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)] " +
                  (index === 0
                    ? "border-l border-l-transparent text-left"
                    : index === 1
                      ? "text-left"
                      : index === 6
                        ? "text-center"
                        : "text-right")
                }
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase, index) => {
            const price = metalMarketPrice(stores, purchase)
            const giftedQty = gifted.get(purchase.id) ?? 0
            const soldQty = sold.get(purchase.id) ?? 0
            const qty = metal.quantityOf(purchase) - giftedQty - soldQty
            const takenOut = takenOutParts(metal, giftedQty, soldQty)
            const cost = qty * purchase.buy
            const value = qty * price
            const pl = metalPurchasePL(qty, purchase.buy, price)
            const tone = metalPLTone(pl)
            return (
              <tr
                key={purchase.id}
                className={cn(
                  "border-t border-[var(--ob-color-border)]",
                  index % 2 === 1 && "bg-[var(--ob-color-surface-sunken)]"
                )}
              >
                <td
                  className={cn(
                    "whitespace-nowrap py-[10px] px-[12px] text-[13px] [font-family:var(--ob-font-num)] tabular-nums border-l",
                    tone === "gain"
                      ? "border-l-[var(--ob-color-income)]"
                      : tone === "loss"
                        ? "border-l-[var(--ob-color-expense)]"
                        : "border-l-[var(--ob-color-border)]"
                  )}
                >
                  {purchase.date}
                </td>
                <td className="whitespace-nowrap py-[10px] px-[12px] text-left text-[13px]">{purchase.store}</td>
                <td className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {metal.formatQuantity(qty)}
                  <TakenOutNote parts={takenOut} keepPartsWhole />
                </td>
                <td className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(purchase.buy, hidden)}
                </td>
                <td className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-subtle)]">
                  {formatMoney(cost, hidden)}
                </td>
                <td className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(value, hidden)}
                </td>
                <td className="whitespace-nowrap py-[10px] px-[12px] text-center text-[13px]">
                  <MetalPLBadge pl={pl} hidden={hidden} />
                </td>
                <td className="py-[10px] px-[12px] text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onGift ? (
                      <ActionTooltip
                        label="Tặng quà"
                        disabledReason={qty < 1 ? `Còn dưới 1 ${metal.unit} — không tặng được.` : undefined}
                      >
                        <button
                          type="button"
                          aria-label={`Tặng từ lần mua ${metal.noun} ${labels.get(purchase.id)}`}
                          disabled={qty < 1}
                          onClick={() => onGift(purchase)}
                          className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-reward-text)] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <Gift size={17} />
                        </button>
                      </ActionTooltip>
                    ) : null}
                    {onSell ? (
                      <ActionTooltip
                        label="Bán"
                        disabledReason={qty < 1 ? `Còn dưới 1 ${metal.unit} — không bán được.` : sellBlockedReason}
                      >
                        <button
                          type="button"
                          aria-label={`Bán từ lần mua ${metal.noun} ${labels.get(purchase.id)}`}
                          disabled={qty < 1 || !!sellBlockedReason}
                          onClick={() => onSell(purchase)}
                          className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-income)] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <HandCoins size={17} />
                        </button>
                      </ActionTooltip>
                    ) : null}
                    <ActionTooltip label="Sửa">
                      <button
                        type="button"
                        aria-label={`Sửa giao dịch ${metal.noun} ${labels.get(purchase.id)}`}
                        onClick={() => onEdit(purchase)}
                        className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                      >
                        <Pencil size={17} />
                      </button>
                    </ActionTooltip>
                    <ActionTooltip
                      label="Xoá"
                      disabledReason={
                        soldQty > 0 ? REMOVE_BLOCKED_BY_SALE_REASON : giftedQty > 0 ? REMOVE_BLOCKED_REASON : undefined
                      }
                    >
                      <button
                        type="button"
                        aria-label={`Xoá giao dịch ${metal.noun} ${labels.get(purchase.id)}`}
                        disabled={giftedQty > 0 || soldQty > 0}
                        onClick={() => onRemove(purchase.id)}
                        className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Trash2 size={17} />
                      </button>
                    </ActionTooltip>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export { MetalTransactionsTable }
