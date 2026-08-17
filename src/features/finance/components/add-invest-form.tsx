"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import type { Investment } from "../types"

interface AddInvestFormProps {
  onAdd: (invest: Omit<Investment, "id">) => void
}

function AddInvestForm({ onAdd }: AddInvestFormProps) {
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
          Thêm khoản đầu tư
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Khoản đầu tư mới
      </div>
      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Tên khoản"
          placeholder="vd: Chứng chỉ quỹ VESAF"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Số tiền đã bỏ vào"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Giá trị hiện tại"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          hint="Để trống thì lấy bằng vốn"
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
          Thêm
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={reset}>
          Huỷ
        </Button>
      </div>
    </div>
  )
}

export { AddInvestForm }
