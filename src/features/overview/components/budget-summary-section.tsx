import { CountMoney } from "@/components/ob/count-money"
import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"

interface BudgetSummarySectionProps {
  salary: number
  spent: number
  remaining: number
}

function BudgetSummarySection({ salary, spent, remaining }: BudgetSummarySectionProps) {
  const { hidden } = useMoneyVisibility()
  const isSurplus = remaining >= 0
  const overBudget = salary > 0 && spent > salary
  // Thanh progress chỉ thể hiện % LƯƠNG đã chi tới giờ (spent/salary) — không dùng "remaining" để
  // tính vì remaining đã trừ luôn các khoản tất toán giữa tháng (gửi/rút quỹ), nên spent+remaining
  // chưa chắc bằng salary. Số dư/thiếu hiển thị ở delta bên dưới vẫn dùng đúng remaining thật,
  // khớp với hint "dư/thiếu" đã hiện ở SectionHead phía trên card này.
  const headroom = Math.max(0, salary - spent)

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <Card label="Chi tiêu tháng này" className="min-w-0 w-full">
        <CountMoney value={spent} />
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
          <span
            className="font-bold"
            style={{ color: isSurplus ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
          >
            {isSurplus ? "▲" : "▼"} {formatMoney(Math.abs(remaining), hidden)}
          </span>
          <span className="text-[var(--ob-color-text-subtle)]">trên lương {formatMoney(salary, hidden)}</span>
        </p>
        <div className="mt-5 flex h-2 gap-1.5 overflow-hidden rounded-[var(--ob-radius-pill)]">
          {salary <= 0 ? (
            <span className="flex-1" style={{ background: "var(--ob-color-border)" }} />
          ) : overBudget ? (
            <span data-testid="segment-spent" className="flex-1" style={{ background: "var(--ob-color-expense)" }} />
          ) : (
            <>
              <span data-testid="segment-spent" style={{ flex: spent, background: "var(--ob-color-expense)" }} />
              <span
                data-testid="segment-headroom"
                style={{ flex: headroom, background: "var(--ob-color-income)" }}
              />
            </>
          )}
        </div>
        {salary > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-3.5 text-xs text-[var(--ob-color-text-subtle)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "var(--ob-color-expense)" }} />
              Đã chi
            </span>
            {!overBudget ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: "var(--ob-color-income)" }} />
                Còn lại
              </span>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  )
}

export { BudgetSummarySection }
