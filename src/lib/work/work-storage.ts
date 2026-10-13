import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { safeArray } from "@/lib/safe-array"
import { DEFAULT_COLUMNS } from "@/lib/work/board"
import type { StandupEntry, WorkColumn, WorkState, WorkTask } from "@/lib/work/types"

const WORK_STORAGE_KEY = "work-data"

const DEFAULT_WORK_STATE: WorkState = { columns: DEFAULT_COLUMNS, tasks: [], standups: [] }

const workColumnSchema: z.ZodType<WorkColumn> = z.object({
  id: z.number(),
  title: z.string(),
})

// columnId tuỳ chọn khi đọc: bản lưu thời chưa có bảng Kanban không có field này (xem parseWorkState).
const workTaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  dueDate: z.string().nullable(),
  priority: z.enum(["high", "normal", "low"]),
  columnId: z.number().optional(),
  done: z.boolean(),
  doneAt: z.string().nullable(),
  createdAt: z.string(),
})

const standupEntrySchema: z.ZodType<StandupEntry> = z.object({
  day: z.string(),
  yesterday: z.string(),
  today: z.string(),
  blockers: z.string(),
})

// Việc và standup là lịch sử tích luỹ — 1 bản ghi hỏng chỉ bị bỏ riêng nó (safeArray). Standup định
// danh theo ngày: 2 bản cùng ngày (vd. file sửa tay) thì giữ bản sau, đúng như lần lưu cuối thắng.
// Thẻ không có cột (bản lưu cũ) hoặc trỏ tới cột đã mất: vào cột cuối nếu đã xong, không thì cột đầu.
// `done` luôn được tính lại theo cột cuối để 2 field không bao giờ lệch nhau.
// Dùng chung cho đọc localStorage và data-transfer.ts (nhập file / tải xuống từ cloud).
function parseWorkState(value: unknown): WorkState {
  const parsed = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>
  const stored = safeArray(workColumnSchema, parsed.columns)
  const columns = stored.length ? stored : DEFAULT_COLUMNS
  const firstId = columns[0].id
  const lastId = columns[columns.length - 1].id
  const columnIds = new Set(columns.map((c) => c.id))

  const tasks: WorkTask[] = safeArray(workTaskSchema, parsed.tasks).map((t) => {
    const columnId = t.columnId !== undefined && columnIds.has(t.columnId) ? t.columnId : t.done ? lastId : firstId
    const done = columnId === lastId
    return { ...t, columnId, done, doneAt: done ? t.doneAt : null }
  })

  const byDay = new Map<string, StandupEntry>()
  for (const entry of safeArray(standupEntrySchema, parsed.standups)) byDay.set(entry.day, entry)

  return { columns, tasks, standups: [...byDay.values()] }
}

function getStoredWork(): WorkState {
  try {
    const raw = window.localStorage.getItem(WORK_STORAGE_KEY)
    if (!raw) return DEFAULT_WORK_STATE
    return parseWorkState(JSON.parse(raw))
  } catch {
    return DEFAULT_WORK_STATE
  }
}

function setStoredWork(state: WorkState) {
  window.localStorage.setItem(WORK_STORAGE_KEY, JSON.stringify(state))
  notifyDataChanged()
}

export { DEFAULT_WORK_STATE, WORK_STORAGE_KEY, getStoredWork, parseWorkState, setStoredWork, type WorkState }
