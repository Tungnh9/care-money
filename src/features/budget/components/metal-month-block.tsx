"use client"

import { Gift, HandCoins } from "lucide-react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { formatShortDayKey } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { MetalMonthItem } from "@/lib/budget/budget-calculations"

interface MetalMonthBlockProps {
  items: MetalMonthItem[]
}

// Dòng phụ của 1 lần tặng/bán: ngày, cửa hàng, sổ nhận tiền (lần bán), ghi chú.
function detailOf(item: MetalMonthItem): string {
  const fund = item.kind === "sale" ? ` · vào ${item.fundName}${item.fundRemoved ? " (đã xoá)" : ""}` : ""
  return `${formatShortDayKey(item.dayKey)} · ${item.store}${fund}${item.note ? ` · ${item.note}` : ""}`
}

// Khối "Vàng/bạc tháng này" trong "Khoản chi tháng này": mỗi lần lấy vàng/bạc ra tặng hay bán trong tháng là
// 1 dòng. Chỉ để xem lại — không nút, không sửa ở đây (làm ở tab Tích lũy) — và không phải khoản chi: tiền mua
// đã tính lúc mua, tiền bán đã vào sổ tiết kiệm. Nên số tiền (trị giá theo giá mua của lần tặng, tiền thực
// nhận của lần bán) không có dấu +/−, màu chữ thường, không vào tổng ngày hay biểu đồ.
function MetalMonthBlock({ items }: MetalMonthBlockProps) {
  // Hook gọi trước return sớm (rules-of-hooks).
  const { hidden } = useMoneyVisibility()
  if (!items.length) return null

  return (
    <div
      data-testid="metal-month-block"
      className="mt-3 rounded-[var(--ob-radius-sm)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface-sunken)]"
    >
      <div className="px-2 pt-[10px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] opacity-[.66]">
        Vàng/bạc tháng này
      </div>
      {items.map((item, i) => (
        <div
          key={`${item.kind}-${item.naming.noun}-${item.id}`}
          data-testid="metal-month-row"
          className={cn(
            "flex items-center gap-[14px] px-2 py-[10px]",
            i < items.length - 1 && "border-b border-[var(--ob-color-border)]"
          )}
        >
          {/* Card hẹp (điện thoại) chỉ còn ~277px bề ngang: bỏ biểu tượng để cột chữ không bị ép, như khối Chốt sổ. */}
          {item.kind === "gift" ? (
            <span className="hidden size-10 flex-none items-center justify-center rounded-full bg-[var(--ob-color-reward-soft)] text-[var(--ob-color-reward-text)] @xs:flex">
              <Gift size={19} aria-hidden />
            </span>
          ) : (
            <span className="hidden size-10 flex-none items-center justify-center rounded-full bg-[var(--ob-color-income-soft)] text-[var(--ob-color-income)] @xs:flex">
              <HandCoins size={19} aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold">
              {`${item.kind === "gift" ? "Tặng" : "Bán"} ${item.naming.formatQuantity(item.qty)} ${item.naming.noun}`}
            </div>
            <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)] wrap-anywhere">
              {detailOf(item)}
            </div>
          </div>
          <div className="flex-none whitespace-nowrap [font-family:var(--ob-font-num)] text-sm font-bold">
            {formatMoney(item.kind === "gift" ? item.qty * item.buy : item.received, hidden)}
          </div>
        </div>
      ))}
    </div>
  )
}

export { MetalMonthBlock }
