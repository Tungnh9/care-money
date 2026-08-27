"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { useT } from "@/components/locale-provider"
import type { SavingsFund } from "../types"

interface AddSavingsFundFormProps {
  onAdd: (fund: SavingsFund) => void
}

function AddSavingsFundForm({ onAdd }: AddSavingsFundFormProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [target, setTarget] = useState("")
  const [note, setNote] = useState("")

  function reset() {
    setName("")
    setAmount("")
    setTarget("")
    setNote("")
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="mt-[18px]">
        <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
          {t("finance.savings.addOpen")}
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        {t("finance.savings.newFund")}
      </div>
      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.savings.name")}
          placeholder={t("finance.savings.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.savings.currentAmount")}
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.savings.target")}
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.savings.note")}
          placeholder={t("finance.savings.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!name.trim() || !amount.trim() || !target.trim()}
          onClick={() => {
            const fund: SavingsFund = {
              name: name.trim(),
              amount: Number(amount) || 0,
              target: Number(target) || 0,
            }
            if (note.trim()) fund.note = note.trim()
            onAdd(fund)
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

export { AddSavingsFundForm }
