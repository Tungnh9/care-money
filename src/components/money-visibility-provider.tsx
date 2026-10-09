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

interface MoneyVisibilityProviderProps {
  children: ReactNode
}

function MoneyVisibilityProvider({ children }: MoneyVisibilityProviderProps) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(getHideMoney())
  }, [])

  function toggle() {
    // Ghi storage NGOÀI updater của setHidden: updater phải thuần (React gọi lại nó lúc render, và 1
    // lần ghi lỗi trong đó từng làm sập cả cây — không có error boundary nào bắt).
    const next = !hidden
    setHidden(next)
    setHideMoney(next)
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
