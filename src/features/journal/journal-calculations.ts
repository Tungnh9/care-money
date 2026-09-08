import type { JournalEntry } from "./types"

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

interface OnThisDayResult {
  entry: JournalEntry
  label: string
}

// entry.id là timestamp thật lúc lưu (Date.now()), nên dùng để so ngày chính xác —
// field "date" hiển thị (dd/mm) không có năm, không đủ để tính "bao lâu trước".
function findOnThisDay(entries: JournalEntry[], now: Date = new Date()): OnThisDayResult | null {
  const targets: [Date, string][] = [
    [new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), "1 năm trước"],
    [new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()), "1 tháng trước"],
    [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), "1 tuần trước"],
  ]

  for (const [target, label] of targets) {
    const match = entries.find((entry) => isSameCalendarDay(new Date(entry.id), target))
    if (match) return { entry: match, label }
  }
  return null
}

export { isSameCalendarDay, findOnThisDay, type OnThisDayResult }
