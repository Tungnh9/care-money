"use client"

import { Pencil, Trash2 } from "lucide-react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { parseGoldPrice, phanToChi } from "../finance-calculations"
import type { GoldPurchase } from "../types"

interface GoldTransactionsCardsProps {
  gold: GoldPurchase[]
  goldPrice: string
  onRemove: (id: number) => void
  onEdit: (purchase: GoldPurchase) => void
}

function signedMoney(n: number, hidden: boolean): string {
  return (n >= 0 ? "+ " : "− ") + formatMoney(Math.abs(n), hidden)
}

function GoldTransactionsCards({
  gold,
  goldPrice,
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

  const price = parseGoldPrice(goldPrice)

  return (
    <div className="flex flex-col gap-3">
      {gold.map((purchase) => {
        const cost = purchase.phan * purchase.buy
        const value = purchase.phan * price
        const pl = value - cost
        return (
          <div
            key={purchase.id}
            className="rounded-[var(--ob-radius-md)] border border-[var(--ob-color-border)] p-[14px]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                {purchase.date}
              </span>
              <div className="flex items-center gap-1">
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
                  Giá trị nay
                </div>
                <div className="text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(value, hidden)}
                </div>
              </div>
            </div>
            <div
              className="mt-3 rounded-[var(--ob-radius-sm)] border px-3 py-[10px]"
              style={{
                backgroundColor: pl >= 0 ? "var(--ob-color-income-soft)" : "var(--ob-color-expense-soft)",
                borderColor: pl >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)",
              }}
            >
              <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                Lãi lỗ
              </div>
              <div
                className="text-[13px] font-semibold [font-family:var(--ob-font-num)] tabular-nums"
                style={{ color: pl >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
              >
                {signedMoney(pl, hidden)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { GoldTransactionsCards }
