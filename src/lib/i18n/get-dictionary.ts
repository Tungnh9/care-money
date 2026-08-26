import type { Locale } from "./locale-cookie"
import type { Dictionary } from "./dictionaries/vi"
import vi from "./dictionaries/vi"
import en from "./dictionaries/en"

const DICTIONARIES: Record<Locale, Dictionary> = { vi, en }

function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

export { getDictionary }
