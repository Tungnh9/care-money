"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { EMOJI_PICKER, type Mood } from "@/lib/settings-storage"
import { useT } from "@/components/locale-provider"

interface AddMoodFormProps {
  onAdd: (mood: Omit<Mood, "tint" | "on">) => void
}

function AddMoodForm({ onAdd }: AddMoodFormProps) {
  const t = useT()
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
          {t("settings.moods.addButton")}
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        {t("settings.moods.addNew")}
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
          label={t("settings.moods.name")}
          placeholder={t("settings.moods.namePlaceholder")}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("settings.moods.description")}
          placeholder={t("settings.moods.descriptionPlaceholder")}
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
            onAdd({ label: label.trim(), desc: desc.trim() || t("settings.moods.defaultDescription"), emoji })
            reset()
          }}
        >
          {t("settings.moods.add")}
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={reset}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  )
}

export { AddMoodForm }
