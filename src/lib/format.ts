import { DEFAULT_LOCALE } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

function localeTag(locale: Locale): string {
  return locale === "en" ? "en-US" : "vi-VN"
}

function formatMoney(n: number, hidden = false, locale: Locale = DEFAULT_LOCALE): string {
  return hidden ? "•••••••• ₫" : n.toLocaleString(localeTag(locale)) + " ₫"
}

function groupVN(value: unknown, locale: Locale = DEFAULT_LOCALE) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits ? Number(digits).toLocaleString(localeTag(locale)) : ""
}

export { formatMoney, groupVN }
