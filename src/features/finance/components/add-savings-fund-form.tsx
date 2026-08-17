"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import type { SavingsFund } from "../types"

interface AddSavingsFundFormProps {
  onAdd: (fund: SavingsFund) => void
}

function AddSavingsFundForm({ onAdd }: AddSavingsFundFormProps) {
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
          Thêm quỹ tiết kiệm
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Quỹ tiết kiệm mới
      </div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <Field label="Tên quỹ" placeholder="vd: Quỹ khẩn cấp" value={name} onChange={(e) => setName(e.target.value)} />
        <Field
          label="Số tiền hiện có"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Field
          label="Mục tiêu"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <Field
          label="Ghi chú"
          placeholder="vd: Duy trì 3-6 tháng chi tiêu"
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
          Thêm
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={reset}>
          Huỷ
        </Button>
      </div>
    </div>
  )
}

export { AddSavingsFundForm }
