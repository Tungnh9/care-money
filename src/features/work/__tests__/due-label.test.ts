import { describe, it, expect } from "vitest"

import type { WorkTask } from "@/lib/work/types"
import { doneLabel, dueLabel } from "../due-label"

// 2026-10-13 là thứ Ba.
const TODAY = "2026-10-13"

function task(overrides: Partial<WorkTask>): WorkTask {
  return {
    id: 1,
    title: "Việc",
    dueDate: null,
    priority: "normal",
    columnId: 1,
    done: false,
    doneAt: null,
    createdAt: "2026-10-01",
    ...overrides,
  }
}

describe("dueLabel", () => {
  it("has no label without a due date, or once the task is done", () => {
    expect(dueLabel(task({}), TODAY)).toBeNull()
    expect(dueLabel(task({ dueDate: "2026-10-01", done: true, doneAt: TODAY }), TODAY)).toBeNull()
  })

  it("says how many days late an open task is", () => {
    expect(dueLabel(task({ dueDate: "2026-10-12" }), TODAY)).toEqual({ text: "Trễ 1 ngày", tone: "late" })
    expect(dueLabel(task({ dueDate: "2026-10-11" }), TODAY)).toEqual({ text: "Trễ 2 ngày", tone: "late" })
  })

  it("says Hôm nay for a task due today", () => {
    expect(dueLabel(task({ dueDate: TODAY }), TODAY)).toEqual({ text: "Hôm nay", tone: "today" })
  })

  it("shows the weekday within the next 6 days, then only the date", () => {
    expect(dueLabel(task({ dueDate: "2026-10-15" }), TODAY)).toEqual({ text: "T5 · 15/10", tone: "soon" })
    expect(dueLabel(task({ dueDate: "2026-10-19" }), TODAY)).toEqual({ text: "T2 · 19/10", tone: "soon" })
    expect(dueLabel(task({ dueDate: "2026-10-18" }), TODAY)).toEqual({ text: "CN · 18/10", tone: "soon" })
    expect(dueLabel(task({ dueDate: "2026-10-20" }), TODAY)).toEqual({ text: "20/10", tone: "later" })
    expect(dueLabel(task({ dueDate: "2027-01-05" }), TODAY)).toEqual({ text: "05/01/2027", tone: "later" })
  })
})

describe("doneLabel", () => {
  it("says when a task was finished", () => {
    expect(doneLabel(task({ done: true, doneAt: TODAY }), TODAY)).toBe("xong hôm nay")
    expect(doneLabel(task({ done: true, doneAt: "2026-10-09" }), TODAY)).toBe("xong 09/10")
  })
})
