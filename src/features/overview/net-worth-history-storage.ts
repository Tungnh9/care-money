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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  net: z.number(),
  savingsTotal: z.number(),
})

// Lịch sử tích luỹ dài hạn, không giới hạn số điểm — 1 bản ghi hỏng không được kéo sập cả
// mảng, đúng nguyên tắc đã dùng ở budget-storage.ts cho expenses/settlements.
function safeArray<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is T => schema.safeParse(item).success)
}

// Tách riêng để data-transfer.ts (import/export/đồng bộ cloud) dùng lại đúng 1 quy tắc lọc
// từng phần tử, thay vì tự viết lại logic validate ở nơi khác.
function parseNetWorthHistory(value: unknown): NetWorthHistory {
  return safeArray(netWorthSnapshotSchema, value)
}

function getStoredNetWorthHistory(): NetWorthHistory {
  try {
    const raw = window.localStorage.getItem(NET_WORTH_HISTORY_KEY)
    if (!raw) return DEFAULT_NET_WORTH_HISTORY
    return parseNetWorthHistory(JSON.parse(raw))
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
  parseNetWorthHistory,
  type NetWorthSnapshot,
  type NetWorthHistory,
}
