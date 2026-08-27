"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, getDictionary, translate, translateDefault } from "@/lib/i18n"
import type { Locale, TranslationFn } from "@/lib/i18n"

interface LocaleContextValue {
  locale: Locale
  t: TranslationFn
  setLocale: (next: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: translateDefault,
  setLocale: () => {},
})

function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: ReactNode
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState(initialLocale)

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`
      setLocaleState(next)
      router.refresh()
    },
    [router]
  )

  const t = useCallback<TranslationFn>(
    (key, params) => translate(getDictionary(locale), key, params),
    [locale]
  )

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

function useT() {
  return useContext(LocaleContext).t
}

function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext)
  return { locale, setLocale }
}

export { LocaleProvider, useT, useLocale }
