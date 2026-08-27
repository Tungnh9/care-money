"use client"

import { useT } from "@/components/locale-provider"
import { LocaleSwitch } from "@/components/ob/locale-switch"
import { Card } from "@/components/ui/card"

function LanguageCard() {
  const t = useT()

  return (
    <Card label={t("settings.language.title")} className="min-w-0 flex-[1_1_300px]">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        {t("settings.language.hint")}
      </p>
      <LocaleSwitch variant="block" />
    </Card>
  )
}

export { LanguageCard }
