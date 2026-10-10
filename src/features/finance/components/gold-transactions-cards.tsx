"use client"

import { Pencil, Trash2 } from "lucide-react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { goldMarketPrice, goldPurchaseLabels, goldPurchasePL, phanToChi } from "@/lib/finance/finance-calculations"
import type { GoldPurchase, GoldStore } from "@/lib/finance/types"
import { GoldPLBox } from "./gold-pl-indicator"

interface GoldTransactionsCardsProps {
  gold: GoldPurchase[]
  stores: GoldStore[]
  onRemove: (id: number) => void
  onEdit: (purchase: GoldPurchase) => void
}

function GoldTransactionsCards({
  gold,
  stores,
  onRemove,
  onEdit,
}: GoldTransactionsCardsProps) {
  const { hidden } = useMoneyVisibility()

  if (!gold.length) {
    return (
      <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
        Chưa có giao dịch vàng nào. Thêm lần mua đầu tiên để bắt đầu theo dõi lãi/lỗ.
      </p>
    )
  }

  const labels = goldPurchaseLabels(gold)

  return (
    <div className="flex flex-col gap-3">
      {gold.map((purchase) => {
        const price = goldMarketPrice(stores, purchase)
        const cost = purchase.phan * purchase.buy
        const value = purchase.phan * price
        const pl = goldPurchasePL(purchase, price)
        return (
          <div
            key={purchase.id}
            className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-border)] p-[14px]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex items-baseline gap-[9px] text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                {purchase.date}
                <span className="[font-family:var(--ob-font-text)] text-[12px] font-semibold text-[var(--ob-color-text-subtle)]">
                  {purchase.store}
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Sửa giao dịch vàng ${labels.get(purchase.id)}`}
                  onClick={() => onEdit(purchase)}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  aria-label={`Xoá giao dịch vàng ${labels.get(purchase.id)}`}
                  onClick={() => onRemove(purchase.id)}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Khối lượng
                </div>
                <div className="text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {phanToChi(purchase.phan)}
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
            <GoldPLBox pl={pl} hidden={hidden} />
          </div>
        )
      })}
    </div>
  )
}

export { GoldTransactionsCards }
