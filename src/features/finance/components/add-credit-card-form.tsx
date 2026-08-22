"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import type { CreditCard } from "../types"

interface AddCreditCardFormProps {
  onAdd: (card: CreditCard) => void
}

function AddCreditCardForm({ onAdd }: AddCreditCardFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [balance, setBalance] = useState("")
  const [min, setMin] = useState("")
  const [limit, setLimit] = useState("")
  const [due, setDue] = useState("")
  const [color, setColor] = useState("")

  function reset() {
    setName("")
    setBalance("")
    setMin("")
    setLimit("")
    setDue("")
    setColor("")
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="mt-[18px]">
        <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
          Thêm thẻ tín dụng
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Thẻ tín dụng mới
      </div>
      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Tên thẻ"
          placeholder="Nhập tên thẻ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          prefix={
            <input
              type="color"
              aria-label="Chọn màu cho thẻ"
              value={color || "#f26311"}
              onChange={(e) => setColor(e.target.value)}
              className="size-6 cursor-pointer rounded-[var(--ob-radius-sm)] border border-[var(--ob-color-border)] bg-transparent p-0 [&::-webkit-color-swatch]:rounded-[var(--ob-radius-sm)] [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:rounded-[var(--ob-radius-sm)] [&::-webkit-color-swatch-wrapper]:p-0"
            />
          }
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Dư nợ hiện tại"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Số tiền tối thiểu"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={min}
          onChange={(e) => setMin(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Hạn mức"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Ngày đến hạn"
          placeholder="Nhập ngày đến hạn"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!name.trim() || !balance.trim() || !limit.trim() || !due.trim()}
          onClick={() => {
            onAdd({
              name: name.trim(),
              balance: Number(balance) || 0,
              min: Number(min) || 0,
              limit: Number(limit) || 0,
              due: due.trim(),
              color: color || undefined,
            })
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

export { AddCreditCardForm }
