import { daysBetween } from "@/lib/date"
import type { WorkTask } from "@/lib/work/types"
import { shortDay } from "./short-day"

type DueTone = "late" | "today" | "soon" | "later"

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

// Chip hạn của việc chưa xong: trễ bao nhiêu ngày, "Hôm nay", thứ + ngày khi còn trong 6 ngày tới (đọc
// nhanh hơn ngày tháng), xa hơn thì chỉ ngày. Việc đã xong dùng doneLabel.
function dueLabel(task: WorkTask, today: string): { text: string; tone: DueTone } | null {
  if (!task.dueDate || task.done) return null
  const diff = daysBetween(today, task.dueDate)
  if (diff < 0) return { text: `Trễ ${-diff} ngày`, tone: "late" }
  if (diff === 0) return { text: "Hôm nay", tone: "today" }
  const [y, m, d] = task.dueDate.split("-").map(Number)
  if (diff <= 6) {
    const weekday = WEEKDAY_SHORT[new Date(y, m - 1, d).getDay()]
    return { text: `${weekday} · ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`, tone: "soon" }
  }
  return { text: shortDay(task.dueDate, today), tone: "later" }
}

function doneLabel(task: WorkTask, today: string): string {
  if (!task.doneAt || task.doneAt === today) return "xong hôm nay"
  return `xong ${shortDay(task.doneAt, today)}`
}

export { doneLabel, dueLabel, type DueTone }
