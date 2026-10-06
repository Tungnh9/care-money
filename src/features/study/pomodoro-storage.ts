import { z } from "zod"

const POMODORO_STORAGE_KEY = "study-pomodoro"

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

type PomodoroMode = "work" | "break"

interface PomodoroState {
  mode: PomodoroMode
  left: number
  running: boolean
  rounds: number
  // dayKey mà `rounds` thuộc về — nhãn "Đã xong N phiên hôm nay" chỉ tính khi đây là hôm nay. null =
  // chưa xong phiên nào, hoặc bản lưu trước khi có field này (không rõ ngày → không tính là hôm nay).
  roundsDay: string | null
  updatedAt: number
}

const DEFAULT_POMODORO_STATE: PomodoroState = {
  mode: "work",
  left: WORK_SECONDS,
  running: false,
  rounds: 0,
  roundsDay: null,
  updatedAt: 0,
}

const pomodoroStateSchema: z.ZodType<PomodoroState> = z.object({
  mode: z.enum(["work", "break"]),
  left: z.number(),
  running: z.boolean(),
  rounds: z.number(),
  // .catch: bản lưu cũ thiếu field vẫn đọc được (giữ nguyên timer đang chạy), chỉ số phiên là "không rõ ngày".
  roundsDay: z.string().nullable().catch(null),
  updatedAt: z.number(),
})

function getStoredPomodoro(): PomodoroState {
  try {
    const raw = window.localStorage.getItem(POMODORO_STORAGE_KEY)
    if (!raw) return DEFAULT_POMODORO_STATE
    const result = pomodoroStateSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : DEFAULT_POMODORO_STATE
  } catch {
    return DEFAULT_POMODORO_STATE
  }
}

function setStoredPomodoro(state: PomodoroState) {
  window.localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state))
}

export {
  POMODORO_STORAGE_KEY,
  WORK_SECONDS,
  BREAK_SECONDS,
  DEFAULT_POMODORO_STATE,
  getStoredPomodoro,
  setStoredPomodoro,
  type PomodoroMode,
  type PomodoroState,
}
