"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { EMOJI_PICKER, type Mood } from "@/lib/settings-storage"

interface AddMoodFormProps {
  onAdd: (mood: Omit<Mood, "tint" | "on" | "score">) => void
  // Tên các tâm trạng đang có — chặn trùng ngay ở form (không phân biệt hoa/thường) để giữ chữ đã gõ;
  // useSettings.addMood vẫn kiểm lại trên bản đọc tươi.
  existingLabels?: string[]
}

function AddMoodForm({ onAdd, existingLabels = [] }: AddMoodFormProps) {
  const [open, setOpen] = useState(false)
  const [emoji, setEmoji] = useState("🙂")
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
          Thêm tâm trạng
        </Button>
      </div>
    )
  }

  const trimmedLabel = label.trim()
  const duplicate =
    trimmedLabel !== "" && existingLabels.some((l) => l.trim().toLowerCase() === trimmedLabel.toLowerCase())

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Tâm trạng mới
      </div>
      <div className="mb-4 flex flex-wrap gap-[6px]">
        {EMOJI_PICKER.map((e) => (
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
          placeholder="vd: Hào hứng"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          invalid={duplicate}
          hint={duplicate ? "Đã có tâm trạng tên này — chọn tên khác" : undefined}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Mô tả ngắn"
          placeholder="vd: Có việc đang mong chờ"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!trimmedLabel || duplicate}
          onClick={() => {
            onAdd({ label: label.trim(), desc: desc.trim() || "Tâm trạng của riêng bạn", emoji })
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

export { AddMoodForm }
