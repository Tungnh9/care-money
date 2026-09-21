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

  // Đọc trực tiếp `history` qua closure, KHÔNG dùng updater dạng hàm của setHistory — updater
  // dạng hàm bị React StrictMode gọi 2 lần để dò side effect, mà setStoredNetWorthHistory (ghi
  // localStorage) là side effect thật, phải nằm ngoài updater (cùng quy ước với use-study.ts).
  const recordSnapshot = useCallback(
    (net: number, savingsTotal: number) => {
      const next = appendSnapshot(history, { date: dayKey(), net, savingsTotal })
      if (next === history) return
      setHistory(next)
      setStoredNetWorthHistory(next)
    },
    [history]
  )

  return { history, recordSnapshot }
}

export { useNetWorthHistory }
