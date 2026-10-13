import { describe, it, expect, beforeEach } from "vitest"

import { DEFAULT_COLUMNS } from "@/lib/work/board"
import {
  DEFAULT_WORK_STATE,
  WORK_STORAGE_KEY,
  getStoredWork,
  parseWorkState,
  setStoredWork,
} from "@/lib/work/work-storage"
import type { StandupEntry, WorkTask } from "@/lib/work/types"

const TASK: WorkTask = {
  id: 1,
  title: "Gửi báo cáo",
  dueDate: "2026-10-13",
  priority: "high",
  columnId: 1,
  done: false,
  doneAt: null,
  createdAt: "2026-10-12",
}

const STANDUP: StandupEntry = { day: "2026-10-13", yesterday: "- Họp", today: "- Gửi báo cáo", blockers: "" }

describe("getStoredWork", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("falls back to the default board when localStorage is empty", () => {
    expect(getStoredWork()).toEqual(DEFAULT_WORK_STATE)
    expect(DEFAULT_WORK_STATE.columns).toEqual(DEFAULT_COLUMNS)
  })

  it("falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(WORK_STORAGE_KEY, "{not valid json")

    expect(getStoredWork()).toEqual(DEFAULT_WORK_STATE)
  })

  it("round-trips columns, tasks and standups through setStoredWork", () => {
    const columns = [{ id: 1, title: "Việc mới" }, { id: 5, title: "Xong" }]
    const done = { ...TASK, id: 2, columnId: 5, done: true, doneAt: "2026-10-13" }
    setStoredWork({ columns, tasks: [TASK, done], standups: [STANDUP] })

    expect(getStoredWork()).toEqual({ columns, tasks: [TASK, done], standups: [STANDUP] })
  })

  it("drops only the single malformed task, keeping valid siblings (per-element filter)", () => {
    window.localStorage.setItem(
      WORK_STORAGE_KEY,
      JSON.stringify({
        columns: DEFAULT_COLUMNS,
        tasks: [TASK, { id: 2, title: "Thiếu field" }, { ...TASK, id: 3, priority: "urgent" }],
        standups: [],
      })
    )

    expect(getStoredWork().tasks).toEqual([TASK])
  })

  it("falls back to an empty list when a field holding a list is not an array at all", () => {
    window.localStorage.setItem(WORK_STORAGE_KEY, JSON.stringify({ columns: DEFAULT_COLUMNS, tasks: "nope", standups: [STANDUP] }))

    expect(getStoredWork()).toEqual({ columns: DEFAULT_COLUMNS, tasks: [], standups: [STANDUP] })
  })
})

describe("parseWorkState", () => {
  it("puts tasks saved before the board existed into the first column, or the last one if they were done", () => {
    // Bản lưu thời chưa có bảng: không có columns/columnId, còn field project cũ.
    const old = { id: 1, title: "Gửi báo cáo", dueDate: "2026-10-13", priority: "high", project: "Báo cáo", done: false, doneAt: null, createdAt: "2026-10-12" }
    const finished = { ...old, id: 2, done: true, doneAt: "2026-10-12" }

    const state = parseWorkState({ tasks: [old, finished], standups: [] })

    expect(state.columns).toEqual(DEFAULT_COLUMNS)
    expect(state.tasks).toEqual([
      { ...TASK, columnId: 1 },
      { ...TASK, id: 2, columnId: 3, done: true, doneAt: "2026-10-12" },
    ])
  })

  it("sends a task pointing at a column that no longer exists to the first column", () => {
    const state = parseWorkState({ columns: DEFAULT_COLUMNS, tasks: [{ ...TASK, columnId: 42 }], standups: [] })

    expect(state.tasks[0].columnId).toBe(1)
  })

  it("keeps done in step with the last column, whatever the stored flag says", () => {
    const state = parseWorkState({
      columns: DEFAULT_COLUMNS,
      tasks: [
        { ...TASK, id: 1, columnId: 3, done: false, doneAt: null },
        { ...TASK, id: 2, columnId: 1, done: true, doneAt: "2026-10-12" },
      ],
      standups: [],
    })

    expect(state.tasks[0]).toMatchObject({ done: true })
    expect(state.tasks[1]).toMatchObject({ done: false, doneAt: null })
  })

  it("keeps one standup per day — the later copy wins", () => {
    const later = { ...STANDUP, today: "- Bản sửa lại" }

    expect(parseWorkState({ tasks: [], standups: [STANDUP, later] }).standups).toEqual([later])
  })

  it("returns defaults for anything that is not an object", () => {
    expect(parseWorkState(null)).toEqual(DEFAULT_WORK_STATE)
    expect(parseWorkState("x")).toEqual(DEFAULT_WORK_STATE)
  })
})
