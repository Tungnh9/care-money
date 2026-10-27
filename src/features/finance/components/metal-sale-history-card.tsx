"use client"

import { Undo2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { ActionTooltip } from "@/components/ob/action-tooltip"
import { formatMoney } from "@/lib/format"
import {
  metalPurchaseLabels,
  metalSalePL,
  saleUndoBlockedReason,
  sortByPurchaseDate,
} from "@/lib/finance/metal-calculations"
import type { MetalSale, SavingsFund } from "@/lib/finance/types"
import type { MetalDisplay } from "../metal-config"
import { MetalPLBadge, MetalPLLine } from "./metal-pl-indicator"

interface MetalSaleHistoryCardProps {
  metal: MetalDisplay
  sales: MetalSale[]
  // Sổ tiết kiệm hiện có: lần bán chỉ huỷ được khi sổ đã nhận tiền còn đó và còn đủ tiền để rút lại.
  savings: SavingsFund[]
  onRemove: (sale: MetalSale) => void
}

// "Lịch sử bán": mỗi lần bán là 1 dòng, mới nhất trước. Chữ, tiền nhận và lãi/lỗ đã chốt đọc từ bản chụp
// của chính lần bán (cửa hàng, giá mua lúc bán) — lần mua có sửa sau đó thì dòng này vẫn giữ nguyên.
function MetalSaleHistoryCard({ metal, sales, savings, onRemove }: MetalSaleHistoryCardProps) {
  // Hook gọi trước return sớm (rules-of-hooks).
  const { hidden } = useMoneyVisibility()
  if (!sales.length) return null

  const labels = metalPurchaseLabels(sales, (sale) => metal.formatQuantity(sale.qty))
  const totalPL = sales.reduce((sum, sale) => sum + metalSalePL(sale), 0)

  return (
    <Card label={`Lịch sử bán · ${sales.length} lần`}>
      <MetalPLLine className="mb-2 text-[13.5px]" label="Lãi/lỗ đã chốt" pl={totalPL} hidden={hidden} />
      {sortByPurchaseDate(sales).map((sale) => {
        // Khoá nút Huỷ đúng khi hook sẽ từ chối (cùng 1 hàm) — hộp xác nhận không hứa rút 1 số tiền rồi lại báo
        // không rút được.
        const undoBlocked = saleUndoBlockedReason(sale, savings)
        return (
          <div
            key={sale.id}
            data-testid="sale-history-row"
            // Đo theo bề rộng của chính Card, như Lịch sử tặng: hẹp thì tiền nhận + lãi/lỗ xuống dưới dòng chữ,
            // từ @xs trở lên mới đứng thành cột riêng.
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[var(--ob-color-border)] py-[10px] last:border-b-0 [grid-template-areas:'text_actions'_'amount_actions'] @xs:grid-cols-[minmax(0,1fr)_auto_auto] @xs:[grid-template-areas:'text_amount_actions']"
          >
            <div className="min-w-0 [grid-area:text]">
              <div className="text-[14px] font-bold">{`Bán ${metal.formatQuantity(sale.qty)}`}</div>
              <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)] wrap-anywhere">
                {`${sale.date} · ${sale.store} · vào ${sale.fundName}${sale.fundRemoved ? " (đã xoá)" : ""}${sale.note ? ` · ${sale.note}` : ""}`}
              </div>
              {/* Điện thoại không rê chuột được nên không thấy tooltip của nút bị khoá — nói lý do ngay trên dòng. Sổ đã gắn cờ xoá thì
                  "(đã xoá)" ở trên đã nói đủ. */}
              {undoBlocked && !sale.fundRemoved ? (
                <div className="mt-0.5 text-[12px] text-[var(--ob-color-expense)] wrap-anywhere">{undoBlocked}</div>
              ) : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 [grid-area:amount] @xs:mt-0 @xs:justify-end">
              <span className="whitespace-nowrap text-[13.5px] font-semibold [font-family:var(--ob-font-num)] tabular-nums">
                {formatMoney(sale.received, hidden)}
              </span>
              <span className="text-[12px]">
                <MetalPLBadge pl={metalSalePL(sale)} hidden={hidden} />
              </span>
            </div>
            <div className="flex items-center [grid-area:actions]">
              <ActionTooltip label="Huỷ lần bán" disabledReason={undoBlocked ?? undefined}>
                <button
                  type="button"
                  aria-label={`Huỷ lần bán ${labels.get(sale.id)}`}
                  disabled={undoBlocked !== null}
                  onClick={() => onRemove(sale)}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Undo2 size={17} />
                </button>
              </ActionTooltip>
            </div>
          </div>
        )
      })}
    </Card>
  )
}

export { MetalSaleHistoryCard }
