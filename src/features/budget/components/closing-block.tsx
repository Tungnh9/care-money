"use client"

import { ArrowDownToLine, ArrowUpFromLine, type LucideIcon } from "lucide-react"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { monthKeyFromDayKey } from "@/lib/date"
import { signedMoney } from "@/lib/finance/finance-calculations"
import { cn } from "@/lib/utils"
import type { SettlementListItem } from "@/lib/budget/budget-calculations"
import type { SettlementDirection } from "@/lib/budget/types"

interface DirectionStyle {
  verb: string
  icon: LucideIcon
  color: string
  soft: string
}

// Nạp = tiền vào sổ (xanh, mũi tên xuống), rút = tiền ra khỏi sổ (đỏ, mũi tên lên). Màu không phải tín hiệu
// duy nhất: dấu +/− và chữ "Nạp vào"/"Rút từ" đã nói rõ hướng.
const DIRECTIONS: Record<SettlementDirection, DirectionStyle> = {
  deposit: {
    verb: "Nạp vào sổ",
    icon: ArrowDownToLine,
    color: "var(--ob-color-income)",
    soft: "var(--ob-color-income-soft)",
  },
  withdraw: {
    verb: "Rút từ sổ",
    icon: ArrowUpFromLine,
    color: "var(--ob-color-expense)",
    soft: "var(--ob-color-expense-soft)",
  },
}

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/

// "2026-09-30" → "30/09"
function shortDay(dayKey: string): string {
  const [, month, day] = dayKey.split("-")
  return `${day}/${month}`
}

// Tiêu đề nói về THÁNG ĐƯỢC TẤT TOÁN (`month`), không phải tháng bấm. Thêm năm khi khác năm của ngày bấm:
// tháng cũ không còn hạn chót nên có thể thuộc năm trước. `month` sai định dạng (chỉ từ file sửa tay) thì
// không đoán, chỉ ghi "Tất toán".
function settlementTitle(month: string, madeDayKey: string): string {
  if (!MONTH_KEY.test(month)) return "Tất toán"
  const year = month.slice(0, 4)
  const yearSuffix = year === madeDayKey.slice(0, 4) ? "" : `, ${year}`
  return `Tất toán tháng ${Number(month.slice(5))}${yearSuffix}`
}

interface ClosingBlockProps {
  settlements: SettlementListItem[]
}

// Khối "Chốt sổ" ở đầu "Khoản chi tháng này": mỗi lần tất toán BẤM trong tháng là 1 dòng, theo đúng thứ
// tự nhận được. Chỉ để xem lại — không nút, không focus — và không phải khoản chi nên không dính vào
// tổng ngày hay các biểu đồ.
function ClosingBlock({ settlements }: ClosingBlockProps) {
  // Hook gọi trước return sớm (rules-of-hooks).
  const { hidden } = useMoneyVisibility()
  if (!settlements.length) return null

  return (
    <div
      data-testid="closing-block"
      className="mt-3 rounded-[var(--ob-radius-sm)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface-sunken)]"
    >
      <div className="px-2 pt-[10px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] opacity-[.66]">
        Chốt sổ
      </div>
      {settlements.map((s, i) => {
        const { verb, icon: Icon, color, soft } = DIRECTIONS[s.direction]
        const before = formatMoney(s.fundAmountBefore, hidden)
        const after = formatMoney(s.fundAmountAfter, hidden)
        const day = shortDay(s.dayKey)
        // Chốt trễ: tháng được tất toán khác tháng bấm → ghi rõ đó là ngày bấm, không để tưởng ngày của tháng.
        const when = s.month === monthKeyFromDayKey(s.dayKey) ? day : `bấm ngày ${day}`
        const fundLine = `${verb} ${s.fundName}${s.fundDeleted ? " (đã xoá)" : ""} · ${when}`

        return (
          <div
            key={s.id}
            data-testid="settlement-row"
            className={cn(
              "flex items-center gap-[14px] px-2 py-[10px]",
              i < settlements.length - 1 && "border-b border-[var(--ob-color-border)]"
            )}
          >
            {/* Card hẹp (điện thoại) chỉ còn ~277px bề ngang: bỏ biểu tượng để cột chữ không bị ép còn vài chục px. */}
            <span
              className="hidden size-10 flex-none items-center justify-center rounded-full @xs:flex"
              style={{ background: soft, color }}
            >
              <Icon size={19} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{settlementTitle(s.month, s.dayKey)}</div>
              <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)] wrap-anywhere">{fundLine}</div>
              {/* "trước → sau" chỉ để nhìn; trình đọc màn hình nghe câu sr-only bên dưới. Câu đó phải nằm
                  NGOÀI phần tử aria-hidden, nếu không nó bị giấu theo. */}
              <div
                aria-hidden="true"
                className="mt-0.5 [font-family:var(--ob-font-num)] text-[12.5px] text-[var(--ob-color-text-subtle)] wrap-anywhere"
              >
                {`${before} → ${after}`}
              </div>
              <span className="sr-only">{`Số dư sổ từ ${before} thành ${after}`}</span>
            </div>
            <div
              className="flex-none whitespace-nowrap [font-family:var(--ob-font-num)] text-sm font-bold"
              style={{ color }}
            >
              {signedMoney(s.direction === "deposit" ? s.amount : -s.amount, hidden)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { ClosingBlock }
