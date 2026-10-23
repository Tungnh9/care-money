"use client"

import { useState } from "react"
import { ChevronDown, Pencil, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { formatDayKey } from "@/lib/date"
import { cn } from "@/lib/utils"
import {
  groupExpensesByDay,
  UNTAGGED_EMOJI,
  UNTAGGED_LABEL,
  type GiftListItem,
  type SettlementListItem,
} from "@/lib/budget/budget-calculations"
import type { Expense } from "@/lib/budget/types"
import { ClosingBlock } from "./closing-block"
import { GiftBlock } from "./gift-block"

// Mỗi ngày là 1 khối liền (không còn xen kẽ theo từng dòng giao dịch) — 2 tông xen kẽ theo NGÀY
// để phân biệt ngày này với ngày kế tiếp; trong 1 ngày, các giao dịch chỉ ngăn nhau bằng 1 gạch
// dưới mờ. Header đậm hơn dòng giao dịch (cùng tông màu, khác độ đậm) để vẫn nhận ra ngay đâu là
// header dù đã gộp chung 1 khối với các dòng bên dưới.
const DAY_TONES = [
  {
    headerBg: "bg-[var(--ob-color-action-soft)]",
    rowBg: "bg-[var(--ob-color-action-soft)]/40",
    accent: "text-[var(--ob-color-action-strong)]",
  },
  {
    headerBg: "bg-[#EAF1FE]",
    rowBg: "bg-[#EAF1FE]/50",
    accent: "text-[var(--ob-color-info)]",
  },
]

interface ExpenseListCardProps {
  expenses: Expense[]
  // Các lần tất toán bấm trong tháng — chỉ để vẽ khối "Chốt sổ" ở đầu danh sách, KHÔNG phải khoản chi:
  // không đi qua groupExpensesByDay nên không vào tổng ngày, "· N khoản" hay các biểu đồ.
  settlements?: SettlementListItem[]
  // Các lần tặng vàng/bạc trong tháng — khối "Quà tặng từ tích lũy" ngay dưới khối "Chốt sổ", cũng KHÔNG
  // phải khoản chi.
  gifts?: GiftListItem[]
  onRemove: (id: number) => void
  onEdit: (expense: Expense) => void
}

function ExpenseListCard({ expenses, settlements = [], gifts = [], onRemove, onEdit }: ExpenseListCardProps) {
  const { hidden } = useMoneyVisibility()
  const days = groupExpensesByDay(expenses)
  // Như mọi nút xoá ở trang Tài chính: thùng rác chỉ mở hộp xác nhận. Tra lại theo id trên danh
  // sách hiện tại — khoản chi đã biến mất (vd. tab khác vừa xoá) thì hộp tự đóng.
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deleting = expenses.find((e) => e.id === deletingId) ?? null
  // Keyed by dayKey (not index) so a day keeps its open/closed state when a newer day is added above it.
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({})

  return (
    <Card label="Khoản chi tháng này" className="min-w-0 w-full">
      <div>
        <ClosingBlock settlements={settlements} />
        <GiftBlock gifts={gifts} />
        {days.map((day, dayIdx) => {
          const tone = DAY_TONES[dayIdx % DAY_TONES.length]
          const expanded = openDays[day.dayKey] ?? dayIdx === 0

          return (
            <div key={day.dayKey}>
              <button
                type="button"
                data-testid="expense-day-header"
                aria-expanded={expanded}
                onClick={() => setOpenDays((prev) => ({ ...prev, [day.dayKey]: !expanded }))}
                className={cn(
                  "mt-3 flex w-full items-center justify-between gap-3 rounded-t-[var(--ob-radius-sm)] px-2 py-[7px] text-left text-[12.5px] font-semibold text-[var(--ob-color-text-subtle)] transition-[border-radius] duration-[var(--ob-dur-slow)] ease-[var(--ob-ease-out)] motion-reduce:transition-none",
                  !expanded && "rounded-b-[var(--ob-radius-sm)]",
                  tone.headerBg
                )}
              >
                <span className="flex items-center gap-[6px]">
                  <ChevronDown
                    size={15}
                    aria-hidden
                    className={cn(
                      "flex-none transition-transform duration-[var(--ob-dur-slow)] ease-[var(--ob-ease-out)] motion-reduce:transition-none",
                      expanded && "rotate-180"
                    )}
                  />
                  {formatDayKey(day.dayKey)}
                  <span
                    aria-hidden={expanded}
                    className={cn(
                      "font-normal transition-opacity duration-[var(--ob-dur-slow)] ease-[var(--ob-ease-out)] motion-reduce:transition-none",
                      expanded ? "opacity-0" : "opacity-80"
                    )}
                  >
                    · {day.expenses.length} khoản
                  </span>
                </span>
                <span className={cn("[font-family:var(--ob-font-num)] text-sm font-bold", tone.accent)}>
                  {formatMoney(day.total, hidden)}
                </span>
              </button>
              {/* 0fr↔1fr grid rows animate the height without measuring it; inert keeps the hidden rows
                  out of tab order and the accessibility tree while collapsed. */}
              <div
                data-testid="expense-day-rows"
                inert={!expanded}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-[var(--ob-dur-slow)] ease-[var(--ob-ease-out)] motion-reduce:transition-none",
                  expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  {day.expenses.map((e, i) => {
                    const isLast = i === day.expenses.length - 1
                    return (
                      <div
                        key={e.id}
                        data-testid="expense-row"
                        className={cn(
                          "flex items-center gap-[14px] px-2 py-[10px]",
                          tone.rowBg,
                          isLast ? "rounded-b-[var(--ob-radius-sm)]" : "border-b border-[var(--ob-color-border)]"
                        )}
                      >
                        <span
                          className="flex size-10 flex-none items-center justify-center rounded-full text-[21px] leading-none"
                          style={{ background: e.tag?.tint ?? "var(--ob-color-surface-sunken)" }}
                        >
                          {e.tag?.emoji ?? UNTAGGED_EMOJI}
                        </span>
                        {/* Nhãn và số tiền chung 1 cột tự xuống dòng: hàng hẹp (điện thoại 320–375px) thì số tiền
                            xuống dưới nhãn, căn phải, và tự ngắt (ở dấu "/" của khoản quẹt, hay giữa số khi
                            vẫn không vừa) thay vì đè lên nhãn hay đẩy nút Sửa/Xoá ra khỏi hàng. */}
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5">
                          <div className="min-w-0 flex-[1_1_8rem]">
                            <div className="text-sm font-bold">{e.tag?.label ?? UNTAGGED_LABEL}</div>
                            {e.note ? (
                              <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">{e.note}</div>
                            ) : null}
                            {e.card ? (
                              <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">
                                {e.card.cardName === null ? "Thẻ đã xoá" : `Thẻ ${e.card.cardName}`}
                              </div>
                            ) : null}
                          </div>
                          <div className="ml-auto min-w-0 text-right wrap-anywhere [font-family:var(--ob-font-num)] text-sm text-[var(--ob-color-text-muted)]">
                            {e.card?.kind === "swipe" ? (
                              <>
                                {/* "0 ₫ /" cùng màu các số tiền khác (không tính vào chi tiêu tháng); phần đã quẹt sau
                                    dấu "/" tô đỏ màu chi tiêu — chủ repo chọn để nhìn là biết mình đang chi bằng thẻ. */}
                                {`${formatMoney(0, hidden)} / `}
                                <span className="text-[var(--ob-color-expense)]">{formatMoney(e.amount, hidden)}</span>
                              </>
                            ) : (
                              formatMoney(e.amount, hidden)
                            )}
                          </div>
                        </div>
                        <div className="flex flex-none items-center">
                          <button
                            type="button"
                            aria-label={`Sửa khoản chi ${e.tag?.label ?? UNTAGGED_LABEL}`}
                            onClick={() => onEdit(e)}
                            className="flex size-9 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-action)]"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Xoá khoản chi ${e.tag?.label ?? UNTAGGED_LABEL}`}
                            onClick={() => setDeletingId(e.id)}
                            className="flex size-9 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
        {!expenses.length ? (
          <p
            className={cn(
              "text-[13.5px] text-[var(--ob-color-text-subtle)]",
              (settlements.length > 0 || gifts.length > 0) && "mt-3"
            )}
          >
            Chưa có khoản chi nào trong tháng này.
          </p>
        ) : null}
      </div>
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xoá khoản chi?"
        description={
          deleting ? (
            <>
              Xoá khoản chi &quot;<strong>{deleting.tag?.label ?? UNTAGGED_LABEL}</strong>&quot;{" "}
              {formatMoney(deleting.amount, hidden)} ({formatDayKey(deleting.dayKey)}) sẽ không thể hoàn tác.
              {deleting.card && deleting.card.cardName !== null
                ? ` Nợ thẻ "${deleting.card.cardName}" sẽ ${deleting.card.kind === "swipe" ? "giảm" : "tăng"} ${formatMoney(deleting.amount, hidden)}.`
                : null}
            </>
          ) : null
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deleting) onRemove(deleting.id)
        }}
      />
    </Card>
  )
}

export { ExpenseListCard }
