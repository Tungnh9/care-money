"use client"

import { Pencil, Undo2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { ActionTooltip } from "@/components/ob/action-tooltip"
import { formatMoney } from "@/lib/format"
import { metalPurchaseLabels, sortByPurchaseDate } from "@/lib/finance/metal-calculations"
import type { MetalGift } from "@/lib/finance/types"
import type { MetalDisplay } from "../metal-config"

interface MetalGiftHistoryCardProps {
  metal: MetalDisplay
  gifts: MetalGift[]
  onEdit: (gift: MetalGift) => void
  onRemove: (gift: MetalGift) => void
}

// "Lịch sử tặng": mỗi lần lấy vàng/bạc ra tặng là 1 dòng, mới nhất trước. Mọi chữ và trị giá đọc từ bản
// chụp của chính lần tặng (cửa hàng, giá mua lúc tặng) — lần mua có sửa sau đó thì dòng này vẫn giữ nguyên.
function MetalGiftHistoryCard({ metal, gifts, onEdit, onRemove }: MetalGiftHistoryCardProps) {
  // Hook gọi trước return sớm (rules-of-hooks).
  const { hidden } = useMoneyVisibility()
  if (!gifts.length) return null

  const labels = metalPurchaseLabels(gifts, (gift) => metal.formatQuantity(gift.qty))

  return (
    <Card label={`Lịch sử tặng · ${gifts.length} lần`}>
      {sortByPurchaseDate(gifts).map((gift) => (
        <div
          key={gift.id}
          data-testid="gift-history-row"
          // Đo theo bề rộng của chính Card (container): hẹp (điện thoại) thì số tiền xuống dưới dòng chữ để cột chữ
          // không bị 2 nút 44px và số tiền ép còn vài chục px; từ @xs trở lên mới đứng thành cột riêng.
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-[var(--ob-color-border)] py-[10px] last:border-b-0 [grid-template-areas:'text_actions'_'amount_actions'] @xs:grid-cols-[minmax(0,1fr)_auto_auto] @xs:[grid-template-areas:'text_amount_actions']"
        >
          <div className="min-w-0 [grid-area:text]">
            <div className="text-[14px] font-bold">{`Tặng ${metal.formatQuantity(gift.qty)}`}</div>
            <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)] wrap-anywhere">
              {`${gift.date} · ${gift.store}${gift.note ? ` · ${gift.note}` : ""}`}
            </div>
          </div>
          <div className="mt-0.5 whitespace-nowrap text-[13.5px] font-semibold [font-family:var(--ob-font-num)] tabular-nums [grid-area:amount] @xs:mt-0">
            {formatMoney(gift.qty * gift.buy, hidden)}
          </div>
          <div className="flex items-center gap-1 [grid-area:actions]">
            <ActionTooltip label="Sửa lần tặng">
              <button
                type="button"
                aria-label={`Sửa lần tặng ${labels.get(gift.id)}`}
                onClick={() => onEdit(gift)}
                className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
              >
                <Pencil size={17} />
              </button>
            </ActionTooltip>
            <ActionTooltip label="Huỷ lần tặng">
              <button
                type="button"
                aria-label={`Huỷ lần tặng ${labels.get(gift.id)}`}
                onClick={() => onRemove(gift)}
                className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
              >
                <Undo2 size={17} />
              </button>
            </ActionTooltip>
          </div>
        </div>
      ))}
    </Card>
  )
}

export { MetalGiftHistoryCard }
