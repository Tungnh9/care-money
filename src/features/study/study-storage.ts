import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import type { Task } from "./types"

interface StudyState {
  tasks: Task[]
  learned: string[]
}

const STUDY_STORAGE_KEY = "study-progress"

const DEFAULT_TASKS: Task[] = [
  { label: "Ôn 20 từ vựng", done: false },
  { label: "Đọc 10 trang", done: false },
  { label: "Làm 1 đề nghe", done: false },
]

const DEFAULT_STUDY_STATE: StudyState = {
  tasks: DEFAULT_TASKS,
  learned: [],
}

const taskSchema: z.ZodType<Task> = z.object({
  label: z.string(),
  done: z.boolean(),
})

const studyStateSchema = z.object({
  tasks: z.array(taskSchema),
  learned: z.array(z.string()),
})

// Field nào sai shape thì rơi về default riêng field đó, không kéo sập cả state.
function safeField<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value)
  return result.success ? result.data : fallback
}

function parseStudyState(value: unknown): StudyState {
  const parsed = (value ?? {}) as Partial<StudyState>
  return {
    tasks: safeField(z.array(taskSchema), parsed.tasks, DEFAULT_STUDY_STATE.tasks),
    learned: safeField(z.array(z.string()), parsed.learned, DEFAULT_STUDY_STATE.learned),
  }
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
  studyStateSchema,
  taskSchema,
  type StudyState,
}
