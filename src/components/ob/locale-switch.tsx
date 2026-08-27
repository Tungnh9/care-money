"use client"

import { Languages } from "lucide-react"

import { useLocale, useT } from "@/components/locale-provider"
import { cn } from "@/lib/utils"

type LocaleSwitchVariant = "pill" | "row" | "icon"

interface LocaleSwitchProps {
  className?: string
  variant?: LocaleSwitchVariant
}

const VARIANT_CLASS: Record<LocaleSwitchVariant, string> = {
  pill: "inline-flex min-h-[var(--ob-hit-min)] items-center justify-center rounded-[var(--ob-radius-pill)] border-[1.5px] border-[var(--ob-color-border)] px-[10px] text-[12px] font-bold tracking-[0.02em] text-[var(--ob-color-text-muted)] transition-colors duration-[var(--ob-dur-fast)] hover:text-[var(--ob-color-action-strong)]",
  row: "flex items-center justify-center gap-[11px] rounded-[var(--ob-radius-md)] px-[14px] py-[11px] text-left text-[length:var(--ob-size-sm)] leading-[var(--ob-lh-normal)] font-medium text-[var(--ob-color-text-muted)] transition-colors duration-[var(--ob-dur-fast)] hover:text-[var(--ob-color-action-strong)] lg:justify-start",
  icon: "flex items-center justify-center text-[var(--ob-color-text-muted)] transition-colors duration-[var(--ob-dur-fast)] hover:text-[var(--ob-color-action-strong)]",
}

function LocaleSwitch({ className, variant = "pill" }: LocaleSwitchProps) {
  const { locale, setLocale } = useLocale()
  const t = useT()
  const next = locale === "vi" ? "en" : "vi"

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t("common.switchLanguage")}
      aria-pressed={locale === "en"}
      className={cn(VARIANT_CLASS[variant], className)}
    >
      {variant === "row" ? (
        <>
          <Languages size={18} />
          <span className="hidden whitespace-nowrap lg:inline">{locale.toUpperCase()}</span>
        </>
      ) : variant === "icon" ? (
        <Languages size={18} />
      ) : (
        locale.toUpperCase()
      )}
    </button>
  )
}

export { LocaleSwitch }
