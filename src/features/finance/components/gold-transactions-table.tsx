"use client"

import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { parseGoldPrice, phanToChi } from "../finance-calculations"
import type { GoldPurchase } from "../types"

interface GoldTransactionsTableProps {
  gold: GoldPurchase[]
  goldPrice: string
  onRemove: (id: number) => void
  onEdit: (purchase: GoldPurchase) => void
}

const HEADERS = [
  "Ngày mua",
  "Khối lượng",
  "Giá mua",
  "Giá vốn",
  "Giá trị nay",
  "Lãi lỗ",
  "",
]

function GoldTransactionsTable({ gold, goldPrice, onRemove, onEdit }: GoldTransactionsTableProps) {
  const { hidden } = useMoneyVisibility()

  if (!gold.length) {
    return (
      <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
        Chưa có giao dịch vàng nào. Thêm lần mua đầu tiên để bắt đầu theo dõi lãi/lỗ.
      </p>
    )
  }

  const price = parseGoldPrice(goldPrice)

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
                    : index === 5 || index === HEADERS.length - 1
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
          {gold.map((purchase, index) => {
            const cost = purchase.phan * purchase.buy
            const value = purchase.phan * price
            const pl = value - cost
            const positive = pl >= 0
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
                    positive ? "border-l-[var(--ob-color-income)]" : "border-l-[var(--ob-color-expense)]"
                  )}
                >
                  {purchase.date}
                </td>
                <td className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {phanToChi(purchase.phan)}
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
                  <span
                    className={cn(
                      "inline-flex items-center gap-[4px] rounded-full px-[9px] py-[3px] font-semibold [font-family:var(--ob-font-num)] tabular-nums",
                      positive
                        ? "bg-[var(--ob-color-income)]/10 text-[var(--ob-color-income)]"
                        : "bg-[var(--ob-color-expense)]/10 text-[var(--ob-color-expense)]"
                    )}
                  >
                    {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {formatMoney(Math.abs(pl), hidden)}
                  </span>
                </td>
                <td className="py-[10px] px-[12px] text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      aria-label={`Sửa giao dịch vàng ${purchase.date}`}
                      onClick={() => onEdit(purchase)}
                      className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label="Xoá giao dịch vàng"
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

export { GoldTransactionsTable }
