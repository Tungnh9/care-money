"use client"

import { useEffect, useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { useFinance } from "@/lib/finance/use-finance"
import { useSettings } from "@/lib/settings/use-settings"
import { formatMoney } from "@/lib/format"
import {
  dayKey,
  formatMonthKey,
  monthKey,
  monthKeyFromDayKey,
  monthsFrom,
  monthsThroughYearEnd,
  shiftMonth,
} from "@/lib/date"
import { useBudget } from "@/lib/budget/use-budget"
import { CARD_SWIPE_TAG_EMOJI, CARD_SWIPE_TAG_LABEL } from "@/lib/budget/card-link"
import {
  breakdownByTag,
  hasSalaryRecord,
  monthlyExpenseTotals,
  monthlyTagBreakdown,
  tagChartColors,
  remainingToSettle,
  salaryForMonth,
  settlementsMadeInMonth,
  giftsMadeInMonth,
  swipedTotal,
  totalExpensesForMonth,
  unsettledPastMonths,
} from "@/lib/budget/budget-calculations"
import { SalaryCard } from "./salary-card"
import { ExpenseEntryForm } from "./expense-entry-form"
import { ExpenseListCard } from "./expense-list-card"
import { EditExpenseModal } from "./edit-expense-modal"
import { TagBreakdownChart } from "./tag-breakdown-chart"
import { MonthlyTrendChart } from "./monthly-trend-chart"
import { MonthlyTagTrendChart } from "./monthly-tag-trend-chart"
import { SettleMonthModal } from "./settle-month-modal"
import type { Expense } from "@/lib/budget/types"

// Thay câu "Bạn đang dư/thiếu" ở thẻ Tất toán khi tháng này chưa có bản ghi lương (kể cả 0 đ).
const MISSING_SALARY_HINT =
  "Chưa nhập lương tháng này. Nhập lương (kể cả 0 đ) ở thẻ Lương tháng này rồi mới tất toán."

function BudgetView() {
  const { hidden } = useMoneyVisibility()
  const {
    salaries,
    expenses,
    settlements,
    hydrated,
    setSalary,
    addExpense,
    updateExpense,
    removeExpense,
    confirmSettlement,
  } = useBudget()
  const { savings, cards, goldGifts, silverGifts, hydrated: cardsReady } = useFinance()
  const { settings } = useSettings()
  // null = modal tất toán đang đóng; ngược lại là tháng đang tất toán (tháng này, hoặc 1 tháng đã qua còn lệch).
  const [settleMonth, setSettleMonth] = useState<string | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const settleCardRef = useRef<HTMLElement>(null)
  const settleButtonRef = useRef<HTMLButtonElement>(null)
  // Tháng (tháng này hoặc tháng cũ) vừa tất toán xong qua hộp thoại, chờ effect bên dưới xem có phải chuyển
  // focus không: ghi ở onConfirm, đọc ở effect.
  const settledMonthRef = useRef<string | null>(null)
  // Nút "Tất toán tháng" khoá vì thiếu lương thì lấy lời nhắc làm mô tả (aria-describedby): trình đọc màn hình
  // đọc được lý do khoá, còn tên nút vẫn đúng là "Tất toán tháng".
  const missingSalaryHintId = useId()

  const currentMonth = monthKey()

  const salary = salaryForMonth(salaries, currentMonth)
  // "đã chi" là tổng khoản chi của tháng — KHÔNG suy ra từ salary - remaining: remaining đã trừ cả
  // các lần tất toán (gửi/rút quỹ), nên cách đó cộng tiền gửi quỹ vào "đã chi". Cùng công thức với
  // thẻ "Chi tiêu tháng này" ở Tổng quan.
  const spent = totalExpensesForMonth(expenses, currentMonth)
  const monthExpenses = expenses.filter((e) => monthKeyFromDayKey(e.dayKey) === currentMonth)
  // Khối "Chốt sổ" chỉ để xem lại: tính riêng, KHÔNG gộp vào monthExpenses. monthExpenses chỉ đi vào danh sách
  // khoản chi, nên gộp vào thì lần tất toán thành 1 dòng chi trong nhóm ngày, bị cộng vào tổng ngày và "· N khoản"
  // ("đã chi" và các biểu đồ đọc thẳng `expenses` nên không đổi). Lọc theo ngày BẤM chứ không theo tháng được
  // tất toán — xem settlementsMadeInMonth.
  const monthSettlements = settlementsMadeInMonth(settlements, currentMonth, savings.map((f) => f.name))
  // Lần tặng vàng/bạc trong tháng: chỉ để xem (khối "Quà tặng từ tích lũy"), không phải khoản chi — tiền mua đã
  // tính lúc mua, nên không vào monthExpenses, "đã chi" hay số còn phải tất toán.
  const monthGifts = giftsMadeInMonth(goldGifts, silverGifts, currentMonth)
  const remaining = remainingToSettle(salaries, expenses, settlements, currentMonth)
  const tagBreakdown = breakdownByTag(expenses, currentMonth)
  const pastUnsettled = unsettledPastMonths(salaries, expenses, settlements, currentMonth)
  const settleTarget = settleMonth ?? currentMonth
  const settleRemaining = remainingToSettle(salaries, expenses, settlements, settleTarget)
  const salaryRecorded = hasSalaryRecord(salaries, currentMonth)
  // Khoá nút khi không còn gì để tất toán, hoặc khi tháng này chưa có bản ghi lương: salary mặc định 0 nên
  // "Bạn đang thiếu" sẽ đúng bằng cả số đã chi, và tất toán sẽ rút từ quỹ cả tháng chi tiêu.
  const settleDisabled = remaining === 0 || !salaryRecorded
  // Chỉ nhắc khi đã đọc xong storage: trước đó salaries là mặc định rỗng, "chưa có lương" chỉ là chưa đọc xong.
  const showMissingSalaryHint = hydrated && !salaryRecorded

  // Modal chỉ biết trả focus về đúng nút đã mở nó, mà sau khi tất toán đủ thì nút đó không dùng được nữa:
  // nút của tháng cũ bị gỡ khỏi danh sách, còn nút "Tất toán tháng" của tháng này tự khoá vì không còn gì để
  // tất toán. focus() lên phần tử đã gỡ hay đã khoá không làm gì, nên focus rơi xuống <body>. Effect này chạy
  // sau mỗi lần render: thấy nút mở hộp thoại không còn dùng được thì chuyển focus tới nút của tháng cũ đầu
  // tiên còn lại, hết tháng cũ thì tới nút "Tất toán tháng" nếu bấm được, không thì tới chính thẻ Tất toán
  // (tabIndex=-1). Tất toán một phần thì nút vẫn ở đó, vẫn bấm được và Modal tự trả focus về nó — chỉ xoá ghi nhớ.
  useEffect(() => {
    const settledMonth = settledMonthRef.current
    if (settledMonth === null) return
    settledMonthRef.current = null
    const openerStillUsable =
      settledMonth === currentMonth ? !settleDisabled : pastUnsettled.some((past) => past.month === settledMonth)
    if (openerStillUsable) return

    const target =
      settleCardRef.current?.querySelector<HTMLElement>("[data-settle-month]") ??
      (settleDisabled ? null : settleButtonRef.current) ??
      settleCardRef.current
    target?.focus()
  })

  // Chart "Chi tiêu theo tháng" bắt đầu từ tháng hiện tại, kéo dài tới hết tháng 12 cùng năm —
  // sang năm mới, currentMonth tự đổi theo giờ hệ thống nên chart tự cập nhật lại đúng từ tháng 1
  // tới tháng 12 của năm mới, không cần sửa gì thêm. Chỉ tô màu phân biệt tháng hiện tại (có dữ
  // liệu thật) với các tháng sau (chưa tới, không thể biết trước sẽ chi gì) — không có tương tác
  // bấm-để-xem-tháng-khác nào (đã bỏ: không có cách hợp lệ nào để xem trước 1 tháng chưa xảy ra).
  const upcomingMonths = monthsThroughYearEnd(currentMonth)
  const monthlyExpenses = monthlyExpenseTotals(expenses, upcomingMonths)

  // "Xu hướng chi tiêu" nhìn về 6 tháng gần nhất TÍNH ĐẾN tháng hiện tại (bao gồm cả tháng này) —
  // ngược hướng với chart dự báo ở trên, vì đây là lịch sử thật đã xảy ra, không phải ước tính.
  const trendMonths = monthsFrom(shiftMonth(currentMonth, -5), 6)
  const tagTrend = monthlyTagBreakdown(expenses, trendMonths)
  // 1 bảng màu cho cả donut lẫn chart 6 tháng, theo vị trí nhãn trong Cài đặt — cùng 1 nhãn luôn
  // cùng 1 màu dù 2 chart xếp nhãn theo 2 thứ tự khác nhau.
  const tagColors = tagChartColors(
    [...tagTrend.map((s) => s.label), ...tagBreakdown.map((e) => e.label)],
    settings.tags
  )

  const swiped = {
    label: CARD_SWIPE_TAG_LABEL,
    emoji: settings.tags.find((t) => t.label === CARD_SWIPE_TAG_LABEL)?.emoji ?? CARD_SWIPE_TAG_EMOJI,
    total: swipedTotal(expenses, trendMonths),
  }

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Chi tiêu</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        Lương {formatMoney(salary, hidden)} · đã chi{" "}
        {/* Số đã chi tách màu khỏi số lương cùng dòng: còn trong mức lương thì xanh, chi vượt lương thì đỏ
            (chi đúng bằng lương vẫn là chưa vượt). */}
        <span
          className="font-semibold"
          style={{ color: spent > salary ? "var(--ob-color-expense)" : "var(--ob-color-income)" }}
        >
          {formatMoney(spent, hidden)}
        </span>{" "}
        tháng này
      </p>
      <div className="ob-card-grid flex flex-col gap-5">
        {/* Chỉ thẻ Lương (con đầu) không giãn theo hàng: thẻ Tất toán dài ra theo số tháng cũ thì thẻ Lương vẫn
            gọn, còn lúc thẻ Tất toán ngắn hơn thì nó giãn ra, 2 thẻ cao bằng nhau như trước. */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 [&>:first-child]:self-start">
          <SalaryCard
            month={currentMonth}
            salary={salary}
            recorded={salaryRecorded}
            onSave={setSalary}
          />

          <Card
            ref={settleCardRef}
            tabIndex={-1}
            aria-label="Tất toán tháng"
            label="Tất toán tháng"
            className="min-w-0"
          >
            <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
              {showMissingSalaryHint ? (
                <span id={missingSalaryHintId}>{MISSING_SALARY_HINT}</span>
              ) : (
                <>
                  {remaining >= 0 ? "Bạn đang dư " : "Bạn đang thiếu "}
                  <span
                    className="font-bold"
                    style={{ color: remaining >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                  >
                    {formatMoney(Math.abs(remaining), hidden)}
                  </span>{" "}
                  tháng này.
                </>
              )}
            </p>
            <Button
              ref={settleButtonRef}
              variant="primary"
              size="sm"
              type="button"
              disabled={settleDisabled}
              aria-describedby={showMissingSalaryHint ? missingSalaryHintId : undefined}
              onClick={() => setSettleMonth(currentMonth)}
            >
              Tất toán tháng
            </Button>

            {pastUnsettled.map((past) => (
              <div key={past.month} className="mt-4 border-t border-[var(--ob-color-border)] pt-[14px]">
                <p className="mb-[10px] text-[13px] leading-[1.55] text-[var(--ob-color-text-muted)]">
                  {formatMonthKey(past.month)} còn {past.remaining > 0 ? "dư" : "thiếu"}{" "}
                  <span
                    className="font-bold"
                    style={{ color: past.remaining > 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                  >
                    {formatMoney(Math.abs(past.remaining), hidden)}
                  </span>{" "}
                  chưa tất toán.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  data-settle-month={past.month}
                  onClick={() => setSettleMonth(past.month)}
                >
                  Tất toán {formatMonthKey(past.month).toLowerCase()}
                </Button>
              </div>
            ))}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ExpenseEntryForm
            tags={settings.tags}
            cards={cards}
            cardsReady={cardsReady}
            onAdd={(input) => addExpense({ ...input, dayKey: dayKey() })}
          />

          <Card label="Chi theo nhãn (tháng này)" className="min-w-0">
            <TagBreakdownChart data={tagBreakdown} colors={tagColors} />
          </Card>
        </div>

        <ExpenseListCard
          expenses={monthExpenses}
          settlements={monthSettlements}
          gifts={monthGifts}
          onRemove={removeExpense}
          onEdit={setEditingExpense}
        />

        <Card label="Chi tiêu theo tháng" className="min-w-0 w-full">
          <MonthlyTrendChart data={monthlyExpenses} currentMonth={currentMonth} />
        </Card>

        <Card label="Xu hướng chi tiêu (6 tháng gần nhất)" className="min-w-0 w-full">
          <MonthlyTagTrendChart months={trendMonths} series={tagTrend} colors={tagColors} swiped={swiped} />
        </Card>
      </div>

      <SettleMonthModal
        open={settleMonth !== null}
        onOpenChange={(open) => {
          if (!open) setSettleMonth(null)
        }}
        month={settleTarget}
        remaining={settleRemaining}
        savings={savings}
        onConfirm={(fundName, direction, amount) => {
          const settled = confirmSettlement(settleTarget, fundName, direction, amount)
          // Ghi nhớ mọi tháng vừa tất toán, kể cả tháng này: tất toán đủ tháng này thì nút "Tất toán tháng" tự
          // khoá và Modal không trả focus về nó được. Effect ở trên quyết định có phải chuyển focus hay không.
          if (settled) settledMonthRef.current = settleTarget
          return settled
        }}
      />

      <EditExpenseModal
        expense={editingExpense}
        tags={settings.tags}
        cards={cards}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        onSave={updateExpense}
      />
    </div>
  )
}

export { BudgetView }
