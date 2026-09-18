const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

function longDate(d: Date = new Date()): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`
}

function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatDayKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number)
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  return `${weekday}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`
}

function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthKeyFromDayKey(key: string): string {
  return key.slice(0, 7)
}

function monthsFrom(startMonth: string, count: number): string[] {
  const [y, m] = startMonth.split("-").map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 + i, 1)
    return monthKey(d)
  })
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number)
  return dayKey(new Date(y, m - 1, d + delta))
}

function monthsThroughYearEnd(fromMonth: string): string[] {
  const [, m] = fromMonth.split("-").map(Number)
  return monthsFrom(fromMonth, 12 - m + 1)
}

function formatMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number)
  return `Tháng ${m}, ${y}`
}

export {
  longDate,
  dayKey,
  formatDayKey,
  formatMonthKey,
  monthKey,
  monthKeyFromDayKey,
  monthsFrom,
  monthsThroughYearEnd,
  shiftDay,
  shiftMonth,
}
