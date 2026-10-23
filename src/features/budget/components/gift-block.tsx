"use client"

import { Gift } from "lucide-react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { formatShortDayKey } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { GiftListItem } from "@/lib/budget/budget-calculations"

interface GiftBlockProps {
  gifts: GiftListItem[]
}

// Khối "Quà tặng từ tích lũy" trong "Khoản chi tháng này": mỗi lần lấy vàng/bạc ra tặng trong tháng là 1
// dòng. Chỉ để xem lại — không nút, không sửa ở đây (sửa ở tab Tích lũy) — và không phải khoản chi: tiền
// mua đã tính lúc mua, nên trị giá (theo giá mua lúc đó) không có dấu +/−, không vào tổng ngày hay biểu đồ.
function GiftBlock({ gifts }: GiftBlockProps) {
  // Hook gọi trước return sớm (rules-of-hooks).
  const { hidden } = useMoneyVisibility()
  if (!gifts.length) return null

  return (
    <div
      data-testid="gift-block"
      className="mt-3 rounded-[var(--ob-radius-sm)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface-sunken)]"
    >
      <div className="px-2 pt-[10px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] opacity-[.66]">
        Quà tặng từ tích lũy
      </div>
      {gifts.map((gift, i) => (
        <div
          key={`${gift.naming.noun}-${gift.id}`}
          data-testid="gift-row"
          className={cn(
            "flex items-center gap-[14px] px-2 py-[10px]",
            i < gifts.length - 1 && "border-b border-[var(--ob-color-border)]"
          )}
        >
          {/* Card hẹp (điện thoại) chỉ còn ~277px bề ngang: bỏ biểu tượng để cột chữ không bị ép, như khối Chốt sổ. */}
          <span className="hidden size-10 flex-none items-center justify-center rounded-full bg-[var(--ob-color-reward-soft)] text-[var(--ob-color-reward-text)] @xs:flex">
            <Gift size={19} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">
              {`Tặng ${gift.naming.formatQuantity(gift.qty)} ${gift.naming.noun}`}
            </div>
            <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)] wrap-anywhere">
              {`${formatShortDayKey(gift.dayKey)} · ${gift.store}${gift.note ? ` · ${gift.note}` : ""}`}
            </div>
          </div>
          <div className="flex-none whitespace-nowrap [font-family:var(--ob-font-num)] text-sm font-bold">
            {formatMoney(gift.qty * gift.buy, hidden)}
          </div>
        </div>
      ))}
    </div>
  )
}

export { GiftBlock }
