import { formatShortDate } from "@/lib/date"

function toDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(y, m - 1, d)
}

// dayKey → "dd/mm" (khác năm với hôm nay thì "dd/mm/yyyy") — nhãn ngày ngắn trên chip, báo cáo tuần.
function shortDay(day: string, today: string): string {
  return formatShortDate(toDate(day), toDate(today))
}

export { shortDay }
