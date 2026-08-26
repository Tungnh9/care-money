import { cookies } from "next/headers"

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from "./locale-cookie"
import type { Locale } from "./locale-cookie"

async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export { getServerLocale }
