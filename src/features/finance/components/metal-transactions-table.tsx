"use client"

import { Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { metalMarketPrice, metalPLTone, metalPurchaseLabels, metalPurchasePL } from "@/lib/finance/metal-calculations"
import type { MetalPurchaseBase, MetalStore } from "@/lib/finance/types"
import type { MetalConfig } from "../metal-config"
import { MetalPLBadge } from "./metal-pl-indicator"

interface MetalTransactionsTableProps<P extends MetalPurchaseBase> {
  metal: MetalConfig<P>
  purchases: P[]
  stores: MetalStore[]
  onRemove: (id: number) => void
  onEdit: (purchase: P) => void
}

const HEADERS = [
  "Ngày mua",
  "Cửa hàng",
  "Khối lượng",
  "Giá mua",
  "Giá vốn",
  "Giá hiện tại",
  "Lãi lỗ",
  "",
]

function MetalTransactionsTable<P extends MetalPurchaseBase>({
  metal,
  purchases,
  stores,
  onRemove,
  onEdit,
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
            const qty = metal.quantityOf(purchase)
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
                <td className="whitespace-nowrap py-[10px] px-[12px] text-left text-[13px]">
                  {purchase.store}
                </td>
                <td className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {metal.formatQuantity(qty)}
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
                    <button
                      type="button"
                      aria-label={`Sửa giao dịch ${metal.noun} ${labels.get(purchase.id)}`}
                      onClick={() => onEdit(purchase)}
                      className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Xoá giao dịch ${metal.noun} ${labels.get(purchase.id)}`}
                      onClick={() => onRemove(purchase.id)}
                      className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
                    >
                      <Trash2 size={17} />
                    </button>
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
