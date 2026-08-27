import { translateDefault } from "@/lib/i18n"
import type { TranslationFn } from "@/lib/i18n"
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

type DefaultTaskKey = "vocab" | "reading" | "listening"

// Nhãn gốc tiếng Việt của DEFAULT_TASKS là định danh duy nhất còn lại trong
// localStorage cũ (không có key) — không có UI sửa nhãn nhiệm vụ nên map này
// luôn khớp đúng dữ liệu đã lưu, kể cả từ trước khi có i18n.
const DEFAULT_TASK_I18N: Record<string, DefaultTaskKey> = {
  "Ôn 20 từ vựng": "vocab",
  "Đọc 10 trang": "reading",
  "Làm 1 đề nghe": "listening",
}

function translateTaskLabel(label: string, t: TranslationFn = translateDefault): string {
  const key = DEFAULT_TASK_I18N[label]
  return key ? t(`study.defaultTasks.${key}`) : label
}

function getStoredStudy(): StudyState {
  try {
    const raw = window.localStorage.getItem(STUDY_STORAGE_KEY)
    if (!raw) return DEFAULT_STUDY_STATE
    return { ...DEFAULT_STUDY_STATE, ...(JSON.parse(raw) as Partial<StudyState>) }
  } catch {
    return DEFAULT_STUDY_STATE
  }
}

function setStoredStudy(state: StudyState) {
  window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(state))
}

export {
  STUDY_STORAGE_KEY,
  DEFAULT_STUDY_STATE,
  getStoredStudy,
  setStoredStudy,
  translateTaskLabel,
  type StudyState,
}
