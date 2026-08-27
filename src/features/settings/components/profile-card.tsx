"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { useT } from "@/components/locale-provider"

interface ProfileCardProps {
  displayName: string
  onSave: (name: string) => void
}

function ProfileCard({ displayName, onSave }: ProfileCardProps) {
  const t = useT()
  const [name, setName] = useState(displayName)
  const [saved, setSaved] = useState(false)

  const trimmed = name.trim()
  const disabled = !trimmed || trimmed === displayName

  function handleSave() {
    onSave(trimmed)
    setSaved(true)
  }

  return (
    <Card label={t("settings.profile.title")} className="min-w-0 flex-[1_1_300px]">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        {t("settings.profile.hint")}
      </p>
      <Field
        label={t("settings.profile.displayName")}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setSaved(false)
        }}
      />
      <div className="mt-[14px] flex items-center gap-[10px]">
        <Button variant="secondary" size="sm" type="button" disabled={disabled} onClick={handleSave}>
          {t("settings.profile.save")}
        </Button>
        {saved ? (
          <span className="flex items-center gap-1 text-[13px] text-[#0E7A50]">
            <Check size={15} /> {t("settings.profile.saved")}
          </span>
        ) : null}
      </div>
    </Card>
  )
}

export { ProfileCard }
