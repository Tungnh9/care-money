import { DEFAULT_LOCALE } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n"

const WEEKDAYS: Record<Locale, string[]> = {
  vi: ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
}

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function longDate(d: Date = new Date(), locale: Locale = DEFAULT_LOCALE): string {
  const weekday = WEEKDAYS[locale][d.getDay()]
  return locale === "en"
    ? `${weekday}, ${MONTHS_EN[d.getMonth()]} ${d.getDate()}`
    : `${weekday}, ${d.getDate()} tháng ${d.getMonth() + 1}`
}

function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export { longDate, dayKey }
