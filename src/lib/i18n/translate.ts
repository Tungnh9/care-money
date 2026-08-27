import type { Dictionary } from "./dictionaries/vi"
import type { TranslationFn, TranslationKey } from "./types"
import { DEFAULT_LOCALE } from "./locale-cookie"
import { getDictionary } from "./get-dictionary"

function translate(
  dict: Dictionary,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, segment) =>
        acc && typeof acc === "object" && segment in acc
          ? (acc as Record<string, unknown>)[segment]
          : undefined,
      dict
    )

  if (typeof value !== "string") {
    return key
  }

  if (!params) {
    return value
  }

  return Object.entries(params).reduce(
    (result, [paramKey, paramValue]) => result.replaceAll(`{${paramKey}}`, String(paramValue)),
    value
  )
}

const translateDefault: TranslationFn = (key, params) => translate(getDictionary(DEFAULT_LOCALE), key, params)

export { translate, translateDefault }
