"use client"

import { Gift, HandCoins, Pencil, Trash2 } from "lucide-react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { ActionTooltip } from "@/components/ob/action-tooltip"
import { formatMoney } from "@/lib/format"
import { metalMarketPrice, metalPurchaseLabels, metalPurchasePL } from "@/lib/finance/metal-calculations"
import { takenOutParts } from "@/lib/finance/metal-naming"
import type { MetalPurchaseBase, MetalStore } from "@/lib/finance/types"
import type { MetalConfig } from "../metal-config"
import { MetalPLBox } from "./metal-pl-indicator"
import { TakenOutNote } from "./taken-out-note"

interface MetalTransactionsCardsProps<P extends MetalPurchaseBase> {
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

function MetalTransactionsCards<P extends MetalPurchaseBase>({
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
}: MetalTransactionsCardsProps<P>) {
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
    // Card rộng (laptop, ~900–1.100px — chưa đủ cho bảng) thì xếp 2 thẻ 1 hàng thay vì 1 thẻ kéo dài cả hàng.
    <div className="grid gap-3 @min-[800px]:grid-cols-2">
      {purchases.map((purchase) => {
        const price = metalMarketPrice(stores, purchase)
        const giftedQty = gifted.get(purchase.id) ?? 0
        const soldQty = sold.get(purchase.id) ?? 0
        const qty = metal.quantityOf(purchase) - giftedQty - soldQty
        const takenOut = takenOutParts(metal, giftedQty, soldQty)
        const cost = qty * purchase.buy
        const value = qty * price
        const pl = metalPurchasePL(qty, purchase.buy, price)
        return (
          <div
            key={purchase.id}
            className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-border)] p-[14px]"
          >
            {/* 4 nút 44px chiếm ~190px: thẻ hẹp (điện thoại) thì nhóm nút xuống dòng dưới ngày/cửa hàng, dạt phải. */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="flex items-baseline gap-[9px] text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                {purchase.date}
                <span className="[font-family:var(--ob-font-text)] text-[12px] font-semibold text-[var(--ob-color-text-subtle)]">
                  {purchase.store}
                </span>
              </span>
              <div className="ml-auto flex items-center gap-1">
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Khối lượng
                </div>
                <div className="text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {metal.formatQuantity(qty)}
                  <TakenOutNote parts={takenOut} />
                </div>
              </div>
              <div>
                <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá mua
                </div>
                <div className="text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(purchase.buy, hidden)}
                </div>
              </div>
              <div>
                <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá vốn
                </div>
                <div className="text-[13px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-subtle)]">
                  {formatMoney(cost, hidden)}
                </div>
              </div>
              <div>
                <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá hiện tại
                </div>
                <div className="text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(value, hidden)}
                </div>
              </div>
            </div>
            <MetalPLBox pl={pl} hidden={hidden} />
          </div>
        )
      })}
    </div>
  )
}

export { MetalTransactionsCards }
