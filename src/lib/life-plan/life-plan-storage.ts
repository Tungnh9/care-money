import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { parseDayInput } from "@/lib/date"
import { safeArray } from "@/lib/safe-array"
import type { LifeNote, LifePlan, LifePlanImage } from "@/lib/life-plan/types"

interface LifePlanState {
  notes: LifeNote[]
  plans: LifePlan[]
}

const LIFE_PLAN_STORAGE_KEY = "life-plan-data"

const DEFAULT_LIFE_PLAN_STATE: LifePlanState = { notes: [], plans: [] }

const MAX_NOTE_IMAGES = 10

// dayKey hợp lệ: đúng dạng "yyyy-mm-dd" của 1 ngày có thật (parseDayInput đọc ra lại y nguyên chuỗi đó).
// Dòng thời gian xếp và đặt vạch "Hôm nay" bằng so chuỗi dayKey — ngày sai dạng sẽ nằm lạc chỗ.
function isDayKey(value: string): boolean {
  return parseDayInput(value) === value
}

function isTargetYear(year: number): boolean {
  return Number.isInteger(year) && year >= 1000 && year <= 9999
}

function isTargetMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12
}

// Dùng chung cho ảnh trong ghi chép đã lưu và ảnh server trả về sau khi tải lên — ảnh nào form nhận được thì lúc
// đọc lại storage cũng giữ được.
const lifePlanImageSchema: z.ZodType<LifePlanImage> = z.object({
  id: z.string(),
  bytes: z.number(),
  width: z.number(),
  height: z.number(),
})

const lifeNoteSchema: z.ZodType<LifeNote> = z.object({
  id: z.number(),
  day: z.string().refine(isDayKey),
  title: z.string(),
  content: z.string(),
  // Lọc TỪNG ảnh: 1 ảnh hỏng chỉ mất riêng ảnh đó. Danh sách ảnh hỏng cả (thiếu, không phải mảng) thì
  // ghi chép vẫn giữ chữ, coi như không có ảnh — chữ đã viết không viết lại được. Cần .optional(): zod 4
  // coi key thiếu hẳn là lỗi, kể cả với z.unknown().
  images: z
    .unknown()
    .optional()
    .transform((value) => safeArray(lifePlanImageSchema, value)),
  planId: z.number().optional(),
})

const lifePlanSchema: z.ZodType<LifePlan> = z.object({
  id: z.number(),
  title: z.string(),
  targetYear: z.number().refine(isTargetYear),
  targetMonth: z.number().refine(isTargetMonth).optional(),
  status: z.enum(["planned", "doing", "done"]),
  doneDay: z.string().refine(isDayKey).optional(),
  note: z.string().optional(),
})

// Bỏ gắn kế hoạch khỏi 1 ghi chép — không để lại key planId.
function withoutPlan(note: LifeNote): LifeNote {
  const unlinked = { ...note }
  delete unlinked.planId
  return unlinked
}

// Ghi chép, kế hoạch hay 1 ảnh hỏng chỉ bị bỏ riêng nó (safeArray). Ghi chép trỏ tới kế hoạch không còn
// (kế hoạch hỏng vừa bị bỏ, hay file sửa tay) thì bỏ gắn: hiện như không gắn, và kế hoạch thêm sau này —
// nextId có thể ra đúng id cũ — không tự nhận các ghi chép đó.
// Dùng chung cho đọc localStorage và data-transfer.ts (nhập file / tải xuống từ cloud).
function parseLifePlanState(value: unknown): LifePlanState {
  const parsed = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>
  const plans = safeArray(lifePlanSchema, parsed.plans)
  const planIds = new Set(plans.map((plan) => plan.id))
  const notes = safeArray(lifeNoteSchema, parsed.notes).map((note) =>
    note.planId === undefined || planIds.has(note.planId) ? note : withoutPlan(note)
  )
  return { notes, plans }
}

function getStoredLifePlan(): LifePlanState {
  try {
    const raw = window.localStorage.getItem(LIFE_PLAN_STORAGE_KEY)
    if (!raw) return DEFAULT_LIFE_PLAN_STATE
    return parseLifePlanState(JSON.parse(raw))
  } catch {
    return DEFAULT_LIFE_PLAN_STATE
  }
}

function setStoredLifePlan(state: LifePlanState) {
  window.localStorage.setItem(LIFE_PLAN_STORAGE_KEY, JSON.stringify(state))
  notifyDataChanged()
}

export {
  DEFAULT_LIFE_PLAN_STATE,
  LIFE_PLAN_STORAGE_KEY,
  MAX_NOTE_IMAGES,
  getStoredLifePlan,
  isDayKey,
  isTargetMonth,
  isTargetYear,
  lifePlanImageSchema,
  parseLifePlanState,
  setStoredLifePlan,
  withoutPlan,
  type LifePlanState,
}
