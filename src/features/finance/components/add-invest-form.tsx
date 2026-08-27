"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { useT } from "@/components/locale-provider"
import type { Investment } from "../types"

interface AddInvestFormProps {
  onAdd: (invest: Omit<Investment, "id">) => void
}

function AddInvestForm({ onAdd }: AddInvestFormProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [cost, setCost] = useState("")
  const [value, setValue] = useState("")

  function reset() {
    setName("")
    setCost("")
    setValue("")
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="mt-[18px]">
        <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
          {t("finance.invest.addOpen")}
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        {t("finance.invest.newInvestment")}
      </div>
      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.invest.name")}
          placeholder={t("finance.invest.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.invest.costLabel")}
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.invest.currentValue")}
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          hint={t("finance.invest.currentValueHint")}
        />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!name.trim() || !Number(cost)}
          onClick={() => {
            const costValue = Number(cost) || 0
            onAdd({
              name: name.trim(),
              cost: costValue,
              value: Number(value) || costValue,
            })
            reset()
          }}
        >
          {t("common.add")}
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={reset}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  )
}

export { AddInvestForm }
