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
  updatedAt: number
}

const DEFAULT_POMODORO_STATE: PomodoroState = {
  mode: "work",
  left: WORK_SECONDS,
  running: false,
  rounds: 0,
  updatedAt: 0,
}

const pomodoroStateSchema: z.ZodType<PomodoroState> = z.object({
  mode: z.enum(["work", "break"]),
  left: z.number(),
  running: z.boolean(),
  rounds: z.number(),
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
