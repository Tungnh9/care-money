"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { useFinance } from "@/features/finance/hooks/use-finance"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { formatMoney } from "@/lib/format"
import { dayKey, monthKey, monthKeyFromDayKey } from "@/lib/date"
import { useBudget } from "../hooks/use-budget"
import {
  breakdownByTag,
  lastNMonthKeys,
  monthlyTrend,
  remainingToSettle,
  salaryForMonth,
} from "../budget-calculations"
import { SalaryCard } from "./salary-card"
import { ExpenseEntryForm } from "./expense-entry-form"
import { ExpenseListCard } from "./expense-list-card"
import { TagBreakdownChart } from "./tag-breakdown-chart"
import { MonthlyTrendChart } from "./monthly-trend-chart"
import { SettleMonthModal } from "./settle-month-modal"

function BudgetView() {
  const { hidden } = useMoneyVisibility()
  const { salaries, expenses, settlements, setSalary, addExpense, removeExpense, confirmSettlement } =
    useBudget()
  const { savings } = useFinance()
  const { settings } = useSettings()
  const [settleOpen, setSettleOpen] = useState(false)

  const month = monthKey()
  const salary = salaryForMonth(salaries, month)
  const monthExpenses = expenses.filter((e) => monthKeyFromDayKey(e.dayKey) === month)
  const remaining = remainingToSettle(salaries, expenses, settlements, month)
  const tagBreakdown = breakdownByTag(expenses, month)
  const trendData = monthlyTrend(salaries, expenses, lastNMonthKeys(6))

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Chi tiêu</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        Lương {formatMoney(salary, hidden)} · đã chi {formatMoney(salary - remaining, hidden)} tháng này
      </p>
      <div className="ob-card-grid flex flex-wrap gap-5">
        <SalaryCard month={month} salary={salary} onSave={setSalary} />
        <ExpenseEntryForm
          tags={settings.tags}
          onAdd={(input) => addExpense({ ...input, dayKey: dayKey() })}
        />

        <Card label="Tất toán tháng" className="min-w-0 flex-[1_1_260px]">
          <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
            {remaining >= 0
              ? `Bạn đang dư ${formatMoney(remaining, hidden)} tháng này.`
              : `Bạn đang thiếu ${formatMoney(Math.abs(remaining), hidden)} tháng này.`}
          </p>
          <Button
            variant="primary"
            size="sm"
            type="button"
            disabled={remaining === 0}
            onClick={() => setSettleOpen(true)}
          >
            Tất toán tháng
          </Button>
        </Card>

        <ExpenseListCard expenses={monthExpenses} onRemove={removeExpense} />

        <Card label="Chi theo nhãn (tháng này)" className="min-w-0 flex-[1_1_420px]">
          <TagBreakdownChart data={tagBreakdown} />
        </Card>
        <Card label="Xu hướng lương & chi tiêu" className="min-w-0 flex-[1_1_420px]">
          <MonthlyTrendChart data={trendData} />
        </Card>
      </div>

      <SettleMonthModal
        open={settleOpen}
        onOpenChange={setSettleOpen}
        month={month}
        remaining={remaining}
        savings={savings}
        onConfirm={(fundName, direction, amount) => confirmSettlement(month, fundName, direction, amount)}
      />
    </div>
  )
}

export { BudgetView }
