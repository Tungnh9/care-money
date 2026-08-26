type Locale = "vi" | "en"

const DEFAULT_LOCALE: Locale = "vi"
const LOCALE_COOKIE_NAME = "app-locale"

function isLocale(value: string | undefined): value is Locale {
  return value === "vi" || value === "en"
}

export { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale }
export type { Locale }
