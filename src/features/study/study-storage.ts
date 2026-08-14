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

export { STUDY_STORAGE_KEY, DEFAULT_STUDY_STATE, getStoredStudy, setStoredStudy, type StudyState }
