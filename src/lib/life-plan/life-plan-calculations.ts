import { dayKey } from "@/lib/date"
import type { LifePlanState } from "@/lib/life-plan/life-plan-storage"
import type { LifeNote, LifePlan } from "@/lib/life-plan/types"

type TimelineEntry =
  | { kind: "note"; day: string; note: LifeNote }
  | { kind: "plan"; day: string; plan: LifePlan }
  | { kind: "today"; day: string }

type DatedEntry = Exclude<TimelineEntry, { kind: "today" }>

// Ngày cuối của tháng muốn đạt; chỉ có năm thì là 31/12 năm đó. Date đếm tháng từ 0, nên số tháng tính từ 1
// trỏ đúng tháng sau, và ngày 0 của tháng sau là ngày cuối tháng này (không có tháng → 12 → 31/12).
function planTargetDay(plan: Pick<LifePlan, "targetYear" | "targetMonth">): string {
  return dayKey(new Date(plan.targetYear, plan.targetMonth ?? 12, 0))
}

// Chỗ của kế hoạch trên dòng thời gian: đã đạt thì ở ngày đạt, chưa đạt (kể cả đã quá hạn) thì ở hạn của nó.
function planTimelineDay(plan: LifePlan): string {
  return plan.status === "done" ? (plan.doneDay ?? planTargetDay(plan)) : planTargetDay(plan)
}

// Hạn là cả ngày cuối kỳ — chỉ quá hạn từ ngày hôm sau.
function isPlanOverdue(plan: LifePlan, today: string): boolean {
  return plan.status !== "done" && planTargetDay(plan) < today
}

// Ngày mới hơn ở trên. Cùng ngày: mốc kế hoạch trên ghi chép; trong mỗi loại, cái thêm sau (id lớn) ở trên.
function newestFirst(a: DatedEntry, b: DatedEntry): number {
  const rank = (entry: DatedEntry) => (entry.kind === "plan" ? 0 : 1)
  const id = (entry: DatedEntry) => (entry.kind === "plan" ? entry.plan.id : entry.note.id)
  return b.day.localeCompare(a.day) || rank(a) - rank(b) || id(b) - id(a)
}

// 1 cột duy nhất, mới nhất ở trên — tương lai xa nhất nằm trên cùng. Vạch "Hôm nay" chen ngay dưới mục cuối
// cùng còn ở sau hôm nay, nên mọi thứ của chính hôm nay nằm dưới vạch. Lọc theo 1 kế hoạch thì chỉ còn mốc
// của nó và các ghi chép gắn vào nó, vẫn kèm vạch.
function buildTimeline(state: LifePlanState, planFilter: number | null, today: string): TimelineEntry[] {
  const plans = planFilter === null ? state.plans : state.plans.filter((plan) => plan.id === planFilter)
  const notes = planFilter === null ? state.notes : state.notes.filter((note) => note.planId === planFilter)
  const entries: TimelineEntry[] = [
    ...plans.map((plan): DatedEntry => ({ kind: "plan", day: planTimelineDay(plan), plan })),
    ...notes.map((note): DatedEntry => ({ kind: "note", day: note.day, note })),
  ].sort(newestFirst)
  const firstNotAhead = entries.findIndex((entry) => entry.day <= today)
  entries.splice(firstNotAhead === -1 ? entries.length : firstNotAhead, 0, { kind: "today", day: today })
  return entries
}

// Tổng dung lượng ảnh đã đưa lên Cloudinary, tính từ kích thước lưu kèm mỗi ảnh trên máy.
function imageBytesUsed(state: LifePlanState): number {
  return state.notes.reduce((sum, note) => sum + note.images.reduce((noteSum, image) => noteSum + image.bytes, 0), 0)
}

export { buildTimeline, imageBytesUsed, isPlanOverdue, planTargetDay, planTimelineDay, type TimelineEntry }
