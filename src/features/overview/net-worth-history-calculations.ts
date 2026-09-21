import type { NetWorthSnapshot } from "./net-worth-history-storage"

function shouldRecordSnapshot(history: NetWorthSnapshot[], today: string): boolean {
  const last = history[history.length - 1]
  return !last || last.date !== today
}

function appendSnapshot(history: NetWorthSnapshot[], snapshot: NetWorthSnapshot): NetWorthSnapshot[] {
  if (!shouldRecordSnapshot(history, snapshot.date)) return history
  return [...history, snapshot]
}

export { shouldRecordSnapshot, appendSnapshot }
