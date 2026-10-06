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

// Ngày `day` của tháng `month` (0–11; âm hay quá 11 thì Date tự lùi/tiến năm), hoặc null nếu tháng đó
// không có ngày này (31/04, 29/02 năm thường). Không dùng thẳng new Date(y, m, d): ngày không có thật bị
// tự tràn sang tháng sau — lùi 1 tháng từ 31/03 ra 03/03, gắn nhãn "1 tháng trước" cho bài mới 4 tuần.
function existingDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month, day)
  return date.getDate() === day ? date : null
}

// entry.id là timestamp thật lúc lưu (Date.now()), nên dùng để so ngày chính xác —
// field "date" hiển thị (dd/mm) không có năm, không đủ để tính "bao lâu trước".
// Mốc "1 năm/1 tháng trước" rơi vào ngày không có thật thì bỏ mốc đó, không dồn về cuối tháng: bài nào
// cũng vẫn có đúng ngày kỷ niệm cùng số ngày, và không bài cuối tháng nào hiện lại nhiều ngày liền.
function findOnThisDay(entries: JournalEntry[], now: Date = new Date()): OnThisDayResult | null {
  const targets: [Date | null, string][] = [
    [existingDate(now.getFullYear() - 1, now.getMonth(), now.getDate()), "1 năm trước"],
    [existingDate(now.getFullYear(), now.getMonth() - 1, now.getDate()), "1 tháng trước"],
    [new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), "1 tuần trước"],
  ]

  for (const [target, label] of targets) {
    if (!target) continue
    const match = entries.find((entry) => isSameCalendarDay(new Date(entry.id), target))
    if (match) return { entry: match, label }
  }
  return null
}

export { isSameCalendarDay, findOnThisDay, type OnThisDayResult }
