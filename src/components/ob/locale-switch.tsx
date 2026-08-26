"use client"

import { useLocale, useT } from "@/components/locale-provider"
import { cn } from "@/lib/utils"

interface LocaleSwitchProps {
  className?: string
}

function LocaleSwitch({ className }: LocaleSwitchProps) {
  const { locale, setLocale } = useLocale()
  const t = useT()
  const next = locale === "vi" ? "en" : "vi"

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t("common.switchLanguage")}
      aria-pressed={locale === "en"}
      className={cn(
        "inline-flex min-h-[var(--ob-hit-min)] items-center justify-center rounded-[var(--ob-radius-pill)] border-[1.5px] border-[var(--ob-color-border)] px-[10px] text-[12px] font-bold tracking-[0.02em] text-[var(--ob-color-text-muted)] transition-colors duration-[var(--ob-dur-fast)] hover:text-[var(--ob-color-action-strong)]",
        className
      )}
    >
      {locale.toUpperCase()}
    </button>
  )
}

export { LocaleSwitch }
