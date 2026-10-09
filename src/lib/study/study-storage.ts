import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { safeArray } from "@/lib/safe-array"
import type { GameHighScores, GameStreak, Task, WordReviewState } from "@/lib/study/types"

interface StudyState {
  tasks: Task[]
  // dayKey mà các dấu tick trong `tasks` thuộc về — null khi chưa từng tick (hoặc dữ liệu lưu trước
  // khi có field này). Tick của ngày khác không được tính là "hôm nay" (xem tasksForDay).
  tasksDay: string | null
  learned: string[]
  gameHighScores: GameHighScores
  gameStreak: GameStreak
  wordReviews: Record<string, WordReviewState>
}

const STUDY_STORAGE_KEY = "study-progress"

const DEFAULT_TASKS: Task[] = [
  { label: "Ôn 20 từ vựng", done: false },
  { label: "Đọc 10 trang", done: false },
  { label: "Làm 1 đề nghe", done: false },
]

const DEFAULT_STUDY_STATE: StudyState = {
  tasks: DEFAULT_TASKS,
  tasksDay: null,
  learned: [],
  gameHighScores: { quiz: 0, match: 0, spelling: 0 },
  gameStreak: { count: 0, lastPlayedDayKey: null },
  wordReviews: {},
}

const taskSchema: z.ZodType<Task> = z.object({
  label: z.string(),
  done: z.boolean(),
})

const gameHighScoresSchema: z.ZodType<GameHighScores> = z.object({
  quiz: z.number(),
  match: z.number(),
  spelling: z.number(),
})

const gameStreakSchema: z.ZodType<GameStreak> = z.object({
  count: z.number(),
  lastPlayedDayKey: z.string().nullable(),
})

const wordReviewStateSchema: z.ZodType<WordReviewState> = z.object({
  wordId: z.string(),
  easeFactor: z.number(),
  intervalDays: z.number(),
  repetitions: z.number(),
  dueAt: z.string(),
  lastReviewedAt: z.string().nullable(),
})

// Field nào sai shape thì rơi về default riêng field đó, không kéo sập cả state.
function safeField<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value)
  return result.success ? result.data : fallback
}

// wordReviews là Record (khác 4 field trên) — 1 entry hỏng không được kéo sập 332 entry còn lại,
// nên lọc TỪNG entry hợp lệ thay vì fallback nguyên field, đúng nguyên tắc budget-storage.ts đã
// dùng cho expenses/settlements (lịch sử tích luỹ dài hạn, mất cả field vì 1 bản ghi lỗi quá đắt).
function safeWordReviews(value: unknown): Record<string, WordReviewState> {
  if (typeof value !== "object" || value === null) return {}
  const out: Record<string, WordReviewState> = {}
  for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
    const result = wordReviewStateSchema.safeParse(entry)
    if (result.success) out[id] = result.data
  }
  return out
}

// learned là danh sách tích luỹ dài hạn (khác tasks có mặc định riêng) — lọc TỪNG phần tử qua
// safeArray: 1 phần tử sai kiểu chỉ bị bỏ riêng nó thay vì kéo cả danh sách về [] như safeField;
// id trùng được gộp, giữ thứ tự lần xuất hiện đầu.
function safeLearned(value: unknown): string[] {
  return [...new Set(safeArray(z.string(), value))]
}

function parseStudyState(value: unknown): StudyState {
  const parsed = (value ?? {}) as Partial<StudyState>
  return {
    tasks: safeField(z.array(taskSchema), parsed.tasks, DEFAULT_STUDY_STATE.tasks),
    tasksDay: safeField(z.string().nullable(), parsed.tasksDay, DEFAULT_STUDY_STATE.tasksDay),
    learned: safeLearned(parsed.learned),
    gameHighScores: safeField(gameHighScoresSchema, parsed.gameHighScores, DEFAULT_STUDY_STATE.gameHighScores),
    gameStreak: safeField(gameStreakSchema, parsed.gameStreak, DEFAULT_STUDY_STATE.gameStreak),
    wordReviews: safeWordReviews(parsed.wordReviews),
  }
}

// "Nhiệm vụ hôm nay" là danh sách lặp lại mỗi ngày: tick của ngày khác (hoặc không rõ ngày) coi như
// chưa làm. Hàm thuần — nơi gọi truyền today; chỉ áp lúc tính giá trị hiển thị/lúc ghi, không bao giờ
// ghi ngược storage lúc đọc (reload của useStudy chỉ đọc — hợp đồng của Plan 1a).
function tasksForDay(tasks: Task[], tasksDay: string | null, today: string): Task[] {
  if (tasksDay === today) return tasks
  return tasks.map((task) => (task.done ? { ...task, done: false } : task))
}

function getStoredStudy(): StudyState {
  try {
    const raw = window.localStorage.getItem(STUDY_STORAGE_KEY)
    if (!raw) return DEFAULT_STUDY_STATE
    return parseStudyState(JSON.parse(raw))
  } catch {
    return DEFAULT_STUDY_STATE
  }
}

function setStoredStudy(state: StudyState) {
  window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state))
  notifyDataChanged()
}

export {
  STUDY_STORAGE_KEY,
  DEFAULT_STUDY_STATE,
  getStoredStudy,
  setStoredStudy,
  parseStudyState,
  tasksForDay,
  taskSchema,
  type StudyState,
}
