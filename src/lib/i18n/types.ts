import type { Dictionary } from "./dictionaries/vi"

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`
}[keyof T & string]

type TranslationKey = DotPaths<Dictionary>
type TranslationFn = (key: TranslationKey, params?: Record<string, string | number>) => string

export type { TranslationKey, TranslationFn }
