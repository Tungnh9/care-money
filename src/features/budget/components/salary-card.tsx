"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"

interface SalaryCardProps {
  month: string
  salary: number
  onSave: (month: string, amount: number) => void
}

function SalaryCard({ month, salary, onSave }: SalaryCardProps) {
  const [amount, setAmount] = useState(String(salary || ""))
  const [saved, setSaved] = useState(false)

  // useBudget() starts at salary=0 before its localStorage-hydration effect runs, then
  // re-renders once with the real value — resync the field when that happens instead of
  // trusting whatever `salary` was at this component's very first render.
  const [prevSalary, setPrevSalary] = useState(salary)
  if (salary !== prevSalary) {
    setAmount(String(salary || ""))
    setPrevSalary(salary)
  }

  const disabled = !amount.trim() || Number(amount) === salary

  function handleSave() {
    onSave(month, Number(amount) || 0)
    setSaved(true)
  }

  return (
    <Card label="Lương tháng này" className="min-w-0">
      <Field
        label="Số tiền"
        numeric
        group
        suffix="đ"
        placeholder="0"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value)
          setSaved(false)
        }}
      />
      <div className="mt-[14px] flex items-center gap-[10px]">
        <Button variant="secondary" size="sm" type="button" disabled={disabled} onClick={handleSave}>
          Lưu
        </Button>
        {saved ? (
          <span className="flex items-center gap-1 text-[13px] text-[#0E7A50]">
            <Check size={15} /> Đã lưu
          </span>
        ) : null}
      </div>
    </Card>
  )
}

export { SalaryCard }
