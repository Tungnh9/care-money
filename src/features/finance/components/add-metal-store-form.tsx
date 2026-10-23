"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import type { MetalStore } from "@/lib/finance/types"
import type { MetalDisplay } from "../metal-config"

interface AddMetalStoreFormProps {
  metal: MetalDisplay
  onAdd: (store: MetalStore) => void
  // Tên các cửa hàng đang có — lần mua tham chiếu cửa hàng bằng tên, nên chặn trùng ngay ở form:
  // nếu chỉ để hook từ chối, form vẫn reset() và mất chữ người dùng đã gõ.
  existingNames?: string[]
}

function AddMetalStoreForm({ metal, onAdd, existingNames = [] }: AddMetalStoreFormProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")

  function reset() {
    setName("")
    setPrice("")
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="mt-[18px]">
        <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
          Thêm cửa hàng
        </Button>
      </div>
    )
  }

  const duplicate = existingNames.includes(name.trim())

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Cửa hàng mới
      </div>
      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Tên cửa hàng"
          placeholder={metal.storePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={duplicate}
          hint={duplicate ? "Đã có cửa hàng tên này — chọn tên khác" : undefined}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={`Giá hôm nay (mỗi ${metal.unit})`}
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={duplicate || !name.trim()}
          onClick={() => {
            onAdd({ name: name.trim(), price: price.trim() })
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

export { AddMetalStoreForm }
