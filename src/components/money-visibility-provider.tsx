"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"

import { getHideMoney, setHideMoney } from "@/lib/money-visibility-storage"

interface MoneyVisibilityContextValue {
  hidden: boolean
  toggle: () => void
}

const MoneyVisibilityContext = createContext<MoneyVisibilityContextValue>({
  hidden: false,
  toggle: () => {},
})

function MoneyVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(getHideMoney())
  }, [])

  function toggle() {
    setHidden((prev) => {
      const next = !prev
      setHideMoney(next)
      return next
    })
  }

  return (
    <MoneyVisibilityContext.Provider value={{ hidden, toggle }}>
      {children}
    </MoneyVisibilityContext.Provider>
  )
}

function useMoneyVisibility() {
  return useContext(MoneyVisibilityContext)
}

export { MoneyVisibilityProvider, useMoneyVisibility }
