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
import { breakdownByTag, remainingToSettle, salaryForMonth } from "../budget-calculations"
import { SalaryCard } from "./salary-card"
import { ExpenseEntryForm } from "./expense-entry-form"
import { ExpenseListCard } from "./expense-list-card"
import { TagBreakdownChart } from "./tag-breakdown-chart"
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

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Chi tiêu</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        Lương {formatMoney(salary, hidden)} · đã chi {formatMoney(salary - remaining, hidden)} tháng này
      </p>
      <div className="ob-card-grid flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SalaryCard month={month} salary={salary} onSave={setSalary} />

          <Card label="Tất toán tháng" className="min-w-0">
            <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
              {remaining >= 0 ? "Bạn đang dư " : "Bạn đang thiếu "}
              <span
                className="font-bold"
                style={{ color: remaining >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
              >
                {formatMoney(Math.abs(remaining), hidden)}
              </span>{" "}
              tháng này.
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
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ExpenseEntryForm
            tags={settings.tags}
            onAdd={(input) => addExpense({ ...input, dayKey: dayKey() })}
          />

          <Card label="Chi theo nhãn (tháng này)" className="min-w-0">
            <TagBreakdownChart data={tagBreakdown} />
          </Card>
        </div>

        <ExpenseListCard expenses={monthExpenses} onRemove={removeExpense} />
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
