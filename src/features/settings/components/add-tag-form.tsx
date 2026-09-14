"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { TAG_EMOJI_PICKER, type BudgetTag } from "@/lib/settings-storage"

interface AddTagFormProps {
  onAdd: (tag: Omit<BudgetTag, "tint" | "on">) => void
}

function AddTagForm({ onAdd }: AddTagFormProps) {
  const [open, setOpen] = useState(false)
  const [emoji, setEmoji] = useState("🏠")
  const [label, setLabel] = useState("")
  const [desc, setDesc] = useState("")

  function reset() {
    setLabel("")
    setDesc("")
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="mt-[18px]">
        <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
          Thêm nhãn
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Nhãn mới
      </div>
      <div className="mb-4 flex flex-wrap gap-[6px]">
        {TAG_EMOJI_PICKER.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={cn(
              "flex size-11 items-center justify-center rounded-full border-[1.5px] text-xl leading-none",
              e === emoji
                ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)]"
                : "border-[var(--ob-color-border)] bg-transparent"
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Tên"
          placeholder="vd: Giải trí"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Mô tả ngắn"
          placeholder="vd: Xem phim, chơi game"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!label.trim()}
          onClick={() => {
            onAdd({ label: label.trim(), desc: desc.trim() || "Nhãn chi tiêu của riêng bạn", emoji })
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

export { AddTagForm }
