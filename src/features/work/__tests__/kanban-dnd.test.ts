import { describe, it, expect } from "vitest"

import { columnOf, dropIndex, listsOf, moveAcross, parseDndId } from "../kanban-dnd"
import { DEFAULT_COLUMNS } from "@/lib/work/board"
import type { WorkTask } from "@/lib/work/types"

function task(id: number, columnId: number): WorkTask {
  return { id, title: `Việc ${id}`, dueDate: null, priority: "normal", columnId, done: columnId === 3, doneAt: null, createdAt: "2026-10-01" }
}

// Cột 1: [1, 2, 3] · cột 2: [4] · cột 3: []
const LISTS = listsOf(DEFAULT_COLUMNS, [task(1, 1), task(4, 2), task(2, 1), task(3, 1)])

describe("kanban drag helpers", () => {
  it("lists each column's card ids in board order", () => {
    expect([...LISTS]).toEqual([
      [1, [1, 2, 3]],
      [2, [4]],
      [3, []],
    ])
  })

  it("tells a card's dnd id from a column's", () => {
    expect(parseDndId("task-12")).toEqual({ kind: "task", id: 12 })
    expect(parseDndId("column-3")).toEqual({ kind: "column", id: 3 })
  })

  it("finds the column of a card, or of a column dropped onto", () => {
    expect(columnOf(LISTS, "task-4")).toBe(2)
    expect(columnOf(LISTS, "column-3")).toBe(3)
    expect(columnOf(LISTS, "task-99")).toBeNull()
    expect(columnOf(LISTS, "column-99")).toBeNull()
  })

  it("moves a card into another column above or below the card it is over", () => {
    expect(moveAcross(LISTS, 2, 2, 4, false).get(2)).toEqual([2, 4])
    expect(moveAcross(LISTS, 2, 2, 4, true).get(2)).toEqual([4, 2])
    expect(moveAcross(LISTS, 2, 2, 4, true).get(1)).toEqual([1, 3])
  })

  it("puts the card at the bottom when it is over the column itself, and leaves the input untouched", () => {
    const next = moveAcross(LISTS, 1, 3, null, false)

    expect(next.get(3)).toEqual([1])
    expect(next.get(1)).toEqual([2, 3])
    expect(LISTS.get(1)).toEqual([1, 2, 3])
  })

  it("settles a drop within a column at the position of the card it lands on", () => {
    expect(dropIndex(LISTS, 1, 1, 3)).toBe(2)
    expect(dropIndex(LISTS, 1, 3, 1)).toBe(0)
    // Thả lên chính nó, hoặc lên vùng trống của cột: giữ nguyên chỗ.
    expect(dropIndex(LISTS, 1, 2, 2)).toBe(1)
    expect(dropIndex(LISTS, 1, 2, null)).toBe(1)
  })
})
