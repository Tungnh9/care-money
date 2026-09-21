"use client"

import { useCallback, useEffect, useState } from "react"

import { dayKey } from "@/lib/date"
import { appendSnapshot } from "../net-worth-history-calculations"
import {
  DEFAULT_NET_WORTH_HISTORY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
  type NetWorthHistory,
} from "../net-worth-history-storage"

function useNetWorthHistory() {
  const [history, setHistory] = useState<NetWorthHistory>(DEFAULT_NET_WORTH_HISTORY)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(getStoredNetWorthHistory())
  }, [])

  const recordSnapshot = useCallback(
    (net: number, savingsTotal: number) => {
      setHistory((current) => {
        const next = appendSnapshot(current, { date: dayKey(), net, savingsTotal })
        if (next !== current) setStoredNetWorthHistory(next)
        return next
      })
    },
    []
  )

  return { history, recordSnapshot }
}

export { useNetWorthHistory }
