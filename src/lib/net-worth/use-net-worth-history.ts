"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { dayKey } from "@/lib/date"
import { useStorageSync } from "@/lib/use-storage-sync"
import { appendSnapshot } from "@/lib/net-worth/net-worth-history-calculations"
import {
  DEFAULT_NET_WORTH_HISTORY,
  NET_WORTH_HISTORY_KEY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
  type NetWorthHistory,
} from "@/lib/net-worth/net-worth-history-storage"

function useNetWorthHistory() {
  const [history, setHistory] = useState<NetWorthHistory>(DEFAULT_NET_WORTH_HISTORY)
  // Bản sao "mới nhất" của history, cập nhật ĐỒNG BỘ ngay trong effect hydrate — cùng lý do
  // stateRef tồn tại ở use-study.ts: recordSnapshot có thể chạy trong CÙNG 1 lượt effect với
  // effect hydrate (component gọi recordSnapshot ngay trong useEffect của nó, xếp sau effect
  // hydrate của hook này theo thứ tự khai báo hook). Nếu recordSnapshot đọc `history` qua
  // closure của lượt render ban đầu (rỗng), nó sẽ ghi đè mất lịch sử THẬT vừa hydrate xong —
  // đọc qua ref đảm bảo luôn thấy giá trị vừa hydrate, không phải giá trị rỗng ban đầu.
  const historyRef = useRef(history)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    const loaded = getStoredNetWorthHistory()
    historyRef.current = loaded
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loaded)
  }, [])

  // Tab khác ghi snapshot (hay 1 lần nhập file/tải xuống) → đọc lại, cập nhật historyRef trước để
  // recordSnapshot kế tiếp nối tiếp đúng lịch sử mới nhất thay vì ghi đè nó.
  const reload = useCallback(() => {
    const loaded = getStoredNetWorthHistory()
    historyRef.current = loaded
    setHistory(loaded)
  }, [])
  useStorageSync(NET_WORTH_HISTORY_KEY, reload)

  const recordSnapshot = useCallback((net: number, savingsTotal: number) => {
    const current = historyRef.current
    const next = appendSnapshot(current, { date: dayKey(), net, savingsTotal })
    if (next === current) return
    historyRef.current = next
    setHistory(next)
    setStoredNetWorthHistory(next)
  }, [])

  const replaceHistory = useCallback((next: NetWorthHistory) => {
    historyRef.current = next
    setHistory(next)
    setStoredNetWorthHistory(next)
  }, [])

  return { history, recordSnapshot, replaceHistory }
}

export { useNetWorthHistory }
