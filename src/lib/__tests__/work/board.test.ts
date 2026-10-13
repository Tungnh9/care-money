import { describe, it, expect } from "vitest"

import {
  DEFAULT_COLUMNS,
  addColumn,
  columnTasks,
  moveColumn,
  moveTask,
  removeColumn,
  renameColumn,
} from "@/lib/work/board"
import type { WorkState, WorkTask } from "@/lib/work/types"

const TODAY = "2026-10-13"

function task(overrides: Partial<WorkTask> & { id: number }): WorkTask {
  return {
    title: `Việc ${overrides.id}`,
    dueDate: null,
    priority: "normal",
    columnId: 1,
    done: false,
    doneAt: null,
    createdAt: "2026-10-01",
    ...overrides,
  }
}

// Cột 1 Bắt đầu: [1, 2] · cột 2 Đang làm: [3] · cột 3 Hoàn thành: [4]
function board(): WorkState {
  return {
    columns: DEFAULT_COLUMNS,
    tasks: [
      task({ id: 1 }),
      task({ id: 2 }),
      task({ id: 3, columnId: 2 }),
      task({ id: 4, columnId: 3, done: true, doneAt: "2026-10-10" }),
    ],
    standups: [],
  }
}

const ids = (state: WorkState, columnId: number) => columnTasks(state, columnId).map((t) => t.id)

describe("DEFAULT_COLUMNS", () => {
  it("starts with Bắt đầu, Đang làm and Hoàn thành", () => {
    expect(DEFAULT_COLUMNS.map((c) => c.title)).toEqual(["Bắt đầu", "Đang làm", "Hoàn thành"])
  })
})

describe("moveTask", () => {
  it("moves a card to another column at the given position", () => {
    const next = moveTask(board(), 1, 2, 0, TODAY)

    expect(ids(next, 1)).toEqual([2])
    expect(ids(next, 2)).toEqual([1, 3])
  })

  it("reorders a card inside its own column", () => {
    const next = moveTask(board(), 1, 1, 1, TODAY)

    expect(ids(next, 1)).toEqual([2, 1])
  })

  it("puts the card at the end when the position is past the last card", () => {
    expect(ids(moveTask(board(), 1, 2, 99, TODAY), 2)).toEqual([3, 1])
  })

  it("marks a card done today when it lands in the last column, and undone when it leaves", () => {
    const done = moveTask(board(), 3, 3, 0, TODAY)
    expect(done.tasks.find((t) => t.id === 3)).toMatchObject({ columnId: 3, done: true, doneAt: TODAY })

    const reopened = moveTask(done, 4, 1, 0, TODAY)
    expect(reopened.tasks.find((t) => t.id === 4)).toMatchObject({ columnId: 1, done: false, doneAt: null })
  })

  it("keeps the original finish date when a done card is only reordered inside the last column", () => {
    const state = moveTask(board(), 3, 3, 1, TODAY)
    const next = moveTask(state, 4, 3, 1, "2026-10-20")

    expect(next.tasks.find((t) => t.id === 4)?.doneAt).toBe("2026-10-10")
  })

  it("returns the same state for an unknown card or column", () => {
    const state = board()

    expect(moveTask(state, 99, 2, 0, TODAY)).toBe(state)
    expect(moveTask(state, 1, 99, 0, TODAY)).toBe(state)
  })
})

describe("addColumn", () => {
  it("inserts the new column just before the done column, so finished cards stay finished", () => {
    const next = addColumn(board(), "  Chờ duyệt  ")

    expect(next.columns.map((c) => c.title)).toEqual(["Bắt đầu", "Đang làm", "Chờ duyệt", "Hoàn thành"])
    expect(next.columns[2].id).toBe(4)
    expect(next.tasks.find((t) => t.id === 4)?.done).toBe(true)
  })

  it("ignores a blank title", () => {
    const state = board()

    expect(addColumn(state, "   ")).toBe(state)
  })
})

describe("renameColumn", () => {
  it("renames a column, trimming the title, and ignores a blank title", () => {
    expect(renameColumn(board(), 2, " Đang xử lý ").columns[1].title).toBe("Đang xử lý")
    expect(renameColumn(board(), 2, "  ").columns[1].title).toBe("Đang làm")
  })
})

describe("moveColumn", () => {
  it("swaps a column with its neighbour", () => {
    expect(moveColumn(board(), 1, 1, TODAY).columns.map((c) => c.id)).toEqual([2, 1, 3])
  })

  it("re-evaluates done cards when a different column becomes last", () => {
    const next = moveColumn(board(), 2, 1, TODAY)

    expect(next.columns.map((c) => c.id)).toEqual([1, 3, 2])
    expect(next.tasks.find((t) => t.id === 3)).toMatchObject({ done: true, doneAt: TODAY })
    expect(next.tasks.find((t) => t.id === 4)).toMatchObject({ done: false, doneAt: null })
  })

  it("does nothing at either end", () => {
    const state = board()

    expect(moveColumn(state, 1, -1, TODAY)).toBe(state)
    expect(moveColumn(state, 3, 1, TODAY)).toBe(state)
  })
})

describe("removeColumn", () => {
  it("moves the removed column's cards to the end of the first remaining column", () => {
    const next = removeColumn(board(), 2, TODAY)

    expect(next.columns.map((c) => c.id)).toEqual([1, 3])
    expect(ids(next, 1)).toEqual([1, 2, 3])
  })

  it("sends cards to the new first column when the first column is removed", () => {
    expect(ids(removeColumn(board(), 1, TODAY), 2)).toEqual([3, 1, 2])
  })

  it("never removes the only column left", () => {
    const one = { ...board(), columns: [DEFAULT_COLUMNS[0]], tasks: [task({ id: 1 })] }

    expect(removeColumn(one, 1, TODAY)).toBe(one)
  })

  it("re-evaluates done cards when the done column is removed", () => {
    const next = removeColumn(board(), 3, TODAY)

    // Cột 2 thành cột cuối → thẻ 3 xong; thẻ 4 dồn về cột 1 → chưa xong.
    expect(next.tasks.find((t) => t.id === 3)).toMatchObject({ done: true, doneAt: TODAY })
    expect(next.tasks.find((t) => t.id === 4)).toMatchObject({ columnId: 1, done: false, doneAt: null })
  })
})
