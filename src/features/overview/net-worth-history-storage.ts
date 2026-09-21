import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"

interface NetWorthSnapshot {
  date: string // dayKey "YYYY-MM-DD"
  net: number
  savingsTotal: number
}

type NetWorthHistory = NetWorthSnapshot[]

const NET_WORTH_HISTORY_KEY = "net-worth-history"
const DEFAULT_NET_WORTH_HISTORY: NetWorthHistory = []

const netWorthSnapshotSchema: z.ZodType<NetWorthSnapshot> = z.object({
  date: z.string(),
  net: z.number(),
  savingsTotal: z.number(),
})

// Lịch sử tích luỹ dài hạn, không giới hạn số điểm — 1 bản ghi hỏng không được kéo sập cả
// mảy, đúng nguyên tắc đã dùng ở budget-storage.ts cho expenses/settlements.
function safeArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is T => schema.safeParse(item).success)
}

function getStoredNetWorthHistory(): NetWorthHistory {
  try {
    const raw = window.localStorage.getItem(NET_WORTH_HISTORY_KEY)
    if (!raw) return DEFAULT_NET_WORTH_HISTORY
    return safeArray(netWorthSnapshotSchema, JSON.parse(raw))
  } catch {
    return DEFAULT_NET_WORTH_HISTORY
  }
}

function setStoredNetWorthHistory(history: NetWorthHistory) {
  window.localStorage.setItem(NET_WORTH_HISTORY_KEY, JSON.stringify(history))
  notifyDataChanged()
}

export {
  NET_WORTH_HISTORY_KEY,
  DEFAULT_NET_WORTH_HISTORY,
  getStoredNetWorthHistory,
  setStoredNetWorthHistory,
  type NetWorthSnapshot,
  type NetWorthHistory,
}
