import { formatDayKey, shiftDay } from "@/lib/date"
import type { StandupEntry, WorkPriority, WorkState, WorkTask } from "@/lib/work/types"

const PRIORITY_ORDER: Record<WorkPriority, number> = { high: 0, normal: 1, low: 2 }
const DONE_SHOWN = 20
const NONE = "- Không có"

interface TaskGroups {
  overdue: WorkTask[]
  dueToday: WorkTask[]
  upcoming: WorkTask[]
  noDue: WorkTask[]
  done: WorkTask[]
}

function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(y, m - 1, d).getDay()
}

// "13/10" từ dayKey — tiêu đề và hạn trong báo cáo tuần.
function dayMonth(day: string): string {
  const [, m, d] = day.split("-")
  return `${d}/${m}`
}

function byPriorityThenDue(a: WorkTask, b: WorkTask): number {
  return (
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
    (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
    a.id - b.id
  )
}

// Quá hạn / hôm nay / không hạn: việc gấp lên đầu. Riêng "Sắp tới" theo ngày trước — việc ngày mai không
// bị chìm dưới việc ưu tiên cao của tháng sau.
function groupTasks(tasks: WorkTask[], today: string): TaskGroups {
  const open = tasks.filter((t) => !t.done)
  return {
    overdue: open.filter((t) => t.dueDate !== null && t.dueDate < today).sort(byPriorityThenDue),
    dueToday: open.filter((t) => t.dueDate === today).sort(byPriorityThenDue),
    upcoming: open
      .filter((t) => t.dueDate !== null && t.dueDate > today)
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || byPriorityThenDue(a, b)),
    noDue: open.filter((t) => t.dueDate === null).sort(byPriorityThenDue),
    done: tasks
      .filter((t) => t.done)
      .sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? "") || b.id - a.id)
      .slice(0, DONE_SHOWN),
  }
}

// Ngày làm việc liền trước: thứ Hai (và cuối tuần) lùi về thứ Sáu.
function previousWorkday(today: string): string {
  const dow = weekday(today)
  if (dow === 1) return shiftDay(today, -3)
  if (dow === 0) return shiftDay(today, -2)
  return shiftDay(today, -1)
}

// Nút nhanh "Thứ 6": thứ Sáu tuần này (kể cả khi hôm nay là thứ Sáu), cuối tuần thì sang thứ Sáu tuần sau.
function fridayOf(today: string): string {
  const dow = weekday(today)
  return shiftDay(today, dow === 6 ? 6 : 5 - dow)
}

function weekRange(today: string): { start: string; end: string } {
  const sinceMonday = (weekday(today) + 6) % 7
  const start = shiftDay(today, -sinceMonday)
  return { start, end: shiftDay(start, 6) }
}

function taskLine(task: WorkTask): string {
  return `- ${task.title}`
}

// Gợi ý điền sẵn — người dùng vẫn sửa trước khi lưu.
// - "Hôm nay": việc chưa xong đã quá hạn hoặc đến hạn hôm nay.
// - "Hôm qua": việc tick xong từ ngày làm việc trước tới trước hôm nay (thứ Hai gồm cả việc làm cuối tuần),
//   cộng các dòng kế hoạch của bản standup ngày làm việc trước (bỏ qua bản cũ hơn — nghỉ vài ngày thì kế
//   hoạch đó đã lỗi thời), trừ dòng đã có ở "Hôm nay" hoặc trong danh sách việc vừa xong.
function suggestStandup(state: WorkState, today: string): Omit<StandupEntry, "day"> {
  const since = previousWorkday(today)
  const finished = state.tasks
    .filter((t) => t.done && t.doneAt !== null && t.doneAt >= since && t.doneAt < today)
    .sort((a, b) => a.doneAt!.localeCompare(b.doneAt!) || a.id - b.id)
    .map(taskLine)

  const groups = groupTasks(state.tasks, today)
  // Thẻ đang nằm ở cột giữa (không phải cột đầu, chưa tới cột cuối "đã xong") là việc đang làm — cũng thuộc
  // "Hôm nay", xếp sau việc quá hạn / đến hạn.
  const firstColumnId = state.columns[0]?.id
  const due = [...groups.overdue, ...groups.dueToday]
  const inProgress = state.tasks.filter((t) => !t.done && t.columnId !== firstColumnId && !due.includes(t))
  const todayLines = [...due, ...inProgress].map(taskLine)
  const lastStandup = state.standups
    .filter((s) => s.day >= since && s.day < today)
    .sort((a, b) => b.day.localeCompare(a.day))[0]
  const carried = (lastStandup?.today ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !todayLines.includes(line) && !finished.includes(line))

  return {
    yesterday: [...finished, ...carried].join("\n"),
    today: todayLines.join("\n"),
    blockers: "",
  }
}

function section(title: string, body: string): string[] {
  return [title, body.trim() || NONE]
}

function formatStandup(entry: StandupEntry): string {
  return [
    `Standup ${formatDayKey(entry.day)}`,
    "",
    ...section("Hôm qua:", entry.yesterday),
    "",
    ...section("Hôm nay:", entry.today),
    "",
    ...section("Vướng mắc:", entry.blockers),
  ].join("\n")
}

// Báo cáo của tuần chứa `day` (thứ Hai → Chủ nhật).
interface WeeklyReportData {
  start: string
  end: string
  // Theo thứ tự đã xong (doneAt), cùng ngày thì theo id.
  finished: WorkTask[]
  // Theo hạn sớm nhất trước.
  unfinished: WorkTask[]
  // Vướng mắc ghi ở standup từng ngày trong tuần, giữ nguyên xuống dòng — thẻ trên trang hiện như đã gõ.
  blockers: { day: string; text: string }[]
  // Số việc xong mỗi ngày, thứ Hai → Chủ nhật.
  perDay: { day: string; count: number }[]
}

function weeklyReportData(state: Pick<WorkState, "tasks" | "standups">, day: string): WeeklyReportData {
  const { start, end } = weekRange(day)
  const inWeek = (d: string | null) => d !== null && d >= start && d <= end

  const finished = state.tasks
    .filter((t) => t.done && inWeek(t.doneAt))
    .sort((a, b) => a.doneAt!.localeCompare(b.doneAt!) || a.id - b.id)

  // Còn dở TÍNH ĐẾN CUỐI TUẦN ĐÓ: chưa xong, hoặc xong sau khi tuần đã qua (báo cáo "Tuần trước" viết
  // vào thứ Hai không được bỏ sót việc hạn thứ Năm mà tới thứ Hai mới tick).
  const unfinished = state.tasks
    .filter((t) => t.dueDate !== null && t.dueDate <= end && (!t.done || (t.doneAt !== null && t.doneAt > end)))
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || a.id - b.id)

  const blockers = state.standups
    .filter((s) => inWeek(s.day) && s.blockers.trim())
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((s) => ({ day: s.day, text: s.blockers.trim() }))

  const perDay = Array.from({ length: 7 }, (_, i) => {
    const d = shiftDay(start, i)
    return { day: d, count: finished.filter((t) => t.doneAt === d).length }
  })

  return { start, end, finished, unfinished, blockers, perDay }
}

// Bản chữ thuần để copy dán vào chat/email.
function weeklyReport(state: Pick<WorkState, "tasks" | "standups">, day: string): string {
  const { start, end, finished, unfinished, blockers } = weeklyReportData(state, day)
  const finishedLines = finished.map(taskLine)
  const unfinishedLines = unfinished.map((t) => `${taskLine(t)} — hạn ${dayMonth(t.dueDate!)}`)
  const blockerLines = blockers.map((b) => `- ${formatDayKey(b.day)}: ${b.text.replace(/\s*\n\s*/g, "; ")}`)

  return [
    `Báo cáo tuần ${dayMonth(start)} – ${dayMonth(end)}`,
    "",
    `Đã xong (${finished.length}):`,
    ...(finishedLines.length ? finishedLines : [NONE]),
    "",
    `Còn dở (${unfinished.length}):`,
    ...(unfinishedLines.length ? unfinishedLines : [NONE]),
    "",
    "Vướng mắc:",
    ...(blockerLines.length ? blockerLines : [NONE]),
  ].join("\n")
}

export {
  formatStandup,
  fridayOf,
  groupTasks,
  previousWorkday,
  suggestStandup,
  weekRange,
  weeklyReport,
  weeklyReportData,
  type WeeklyReportData,
}
