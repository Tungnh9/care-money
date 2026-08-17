"use client"

import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import type { Budget } from "@/lib/settings-storage"

interface BudgetCardProps {
  budget: Budget
  onChange: (budget: Partial<Budget>) => void
}

function BudgetCard({ budget, onChange }: BudgetCardProps) {
  return (
    <Card label="Tài chính" className="min-w-0 flex-[1_1_300px]">
      <Field
        label="Ngân sách mỗi tháng"
        numeric
        group
        suffix="đ"
        value={budget.amount}
        onChange={(e) => onChange({ amount: e.target.value })}
      />
      <div className="h-[14px]" />
      <Field
        label="Ngày bắt đầu chu kỳ"
        numeric
        value={budget.cycleStart}
        onChange={(e) => onChange({ cycleStart: e.target.value })}
        hint="Ngày trong tháng ngân sách được tính lại (1–28)"
      />
    </Card>
  )
}

export { BudgetCard }
