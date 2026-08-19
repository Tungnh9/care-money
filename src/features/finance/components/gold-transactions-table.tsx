"use client"

import { Pencil, Trash2 } from "lucide-react"

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

function signedMoney(n: number, hidden: boolean): string {
  return (n >= 0 ? "+ " : "− ") + formatMoney(Math.abs(n), hidden)
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
                    ? "text-left"
                    : index === HEADERS.length - 1
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
          {gold.map((purchase) => {
            const cost = purchase.phan * purchase.buy
            const value = purchase.phan * price
            const pl = value - cost
            return (
              <tr key={purchase.id} className="border-t border-[var(--ob-color-border)]">
                <td className="whitespace-nowrap py-[10px] px-[12px] text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
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
                <td
                  className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13px] font-semibold [font-family:var(--ob-font-num)] tabular-nums"
                  style={{ color: pl >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                >
                  {signedMoney(pl, hidden)}
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
