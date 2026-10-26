import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { DEFAULT_COLUMNS } from "@/lib/work/board"
import { useWork } from "@/lib/work/use-work"
import { DEFAULT_WORK_STATE, WORK_STORAGE_KEY, getStoredWork, setStoredWork } from "@/lib/work/work-storage"
import type { WorkTask } from "@/lib/work/types"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function stored(overrides: Partial<WorkTask> & { id: number }): WorkTask {
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

function seed(tasks: WorkTask[]) {
  setStoredWork({ ...DEFAULT_WORK_STATE, tasks })
}

const columnIds = (columnId: number) =>
  getStoredWork()
    .tasks.filter((t) => t.columnId === columnId)
    .map((t) => t.id)

describe("useWork", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 13, 9, 0))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts with the default three columns and no cards", async () => {
    const { result } = renderHook(() => useWork())

    await waitFor(() => expect(result.current.columns).toEqual(DEFAULT_COLUMNS))
    expect(result.current.tasks).toEqual([])
    expect(result.current.standups).toEqual([])
  })

  it("addTask puts a trimmed card at the bottom of the first column by default", async () => {
    seed([stored({ id: 1 })])
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    let ok = false
    act(() => {
      ok = result.current.addTask("  Gửi báo cáo  ")
    })

    expect(ok).toBe(true)
    expect(getStoredWork().tasks[1]).toEqual({
      id: 2,
      title: "Gửi báo cáo",
      dueDate: null,
      priority: "normal",
      columnId: 1,
      done: false,
      doneAt: null,
      createdAt: "2026-10-13",
    })
    expect(columnIds(1)).toEqual([1, 2])
  })

  it("addTask into the last column counts the card as done today, and refuses a blank title", async () => {
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.columns).toHaveLength(3))

    let blank = true
    act(() => {
      blank = result.current.addTask("   ", 3)
    })
    act(() => {
      result.current.addTask("Đã làm xong", 3)
    })

    expect(blank).toBe(false)
    expect(getStoredWork().tasks).toEqual([
      expect.objectContaining({ title: "Đã làm xong", columnId: 3, done: true, doneAt: "2026-10-13" }),
    ])
  })

  it("moveTask moves a card to a column at a position and saves the order", async () => {
    seed([stored({ id: 1 }), stored({ id: 2 }), stored({ id: 3, columnId: 2 })])
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toHaveLength(3))

    act(() => {
      result.current.moveTask(2, 2, 0)
    })

    expect(columnIds(1)).toEqual([1])
    expect(columnIds(2)).toEqual([2, 3])
  })

  it("toggleTask sends a card to the done column today, and back to the first column", async () => {
    seed([stored({ id: 1, columnId: 2 })])
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    act(() => {
      result.current.toggleTask(1)
    })
    expect(getStoredWork().tasks[0]).toMatchObject({ columnId: 3, done: true, doneAt: "2026-10-13" })

    act(() => {
      result.current.toggleTask(1)
    })
    expect(getStoredWork().tasks[0]).toMatchObject({ columnId: 1, done: false, doneAt: null })
  })

  it("toggleTask puts the card just finished on top of the done column, and an undone one at the bottom of the first", async () => {
    seed([
      stored({ id: 1 }),
      stored({ id: 2 }),
      stored({ id: 3, columnId: 3, done: true, doneAt: "2026-10-12" }),
      stored({ id: 4, columnId: 3, done: true, doneAt: "2026-10-12" }),
    ])
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toHaveLength(4))

    act(() => {
      result.current.toggleTask(1)
    })
    act(() => {
      result.current.toggleTask(4)
    })

    expect(columnIds(3)).toEqual([1, 3])
    expect(columnIds(1)).toEqual([2, 4])
  })

  it("updateTask changes the title, due date and priority but keeps the column and done state", async () => {
    seed([stored({ id: 1, columnId: 3, done: true, doneAt: "2026-10-12" })])
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))

    let ok = false
    act(() => {
      ok = result.current.updateTask(1, { title: " Đổi tên ", dueDate: "2026-10-20", priority: "high" })
    })

    expect(ok).toBe(true)
    expect(getStoredWork().tasks[0]).toEqual(
      stored({
        id: 1,
        title: "Đổi tên",
        dueDate: "2026-10-20",
        priority: "high",
        columnId: 3,
        done: true,
        doneAt: "2026-10-12",
      })
    )
  })

  it("updateTask refuses with an error toast when the task was deleted elsewhere, so the editor stays open", async () => {
    seed([stored({ id: 1 })])
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toHaveLength(1))
    // Tab khác vừa xoá việc này — ghi thẳng, chưa kịp đọc lại.
    window.localStorage.setItem(WORK_STORAGE_KEY, JSON.stringify(DEFAULT_WORK_STATE))

    let ok = true
    act(() => {
      ok = result.current.updateTask(1, { title: "Đổi tên", dueDate: null, priority: "low" })
    })

    expect(ok).toBe(false)
    expect(toast.error).toHaveBeenCalledWith("Việc này vừa bị xoá ở nơi khác — không còn gì để cập nhật.")
    expect(toast.success).not.toHaveBeenCalled()
    expect(getStoredWork().tasks).toEqual([])
  })

  it("removeTask deletes only that card", async () => {
    seed([stored({ id: 1 }), stored({ id: 2 })])
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toHaveLength(2))

    act(() => {
      result.current.removeTask(1)
    })

    expect(getStoredWork().tasks.map((t) => t.id)).toEqual([2])
  })

  it("adds a column before the done column, renames it and moves it", async () => {
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.columns).toHaveLength(3))

    act(() => {
      result.current.addColumn("Chờ duyệt")
    })
    act(() => {
      result.current.renameColumn(4, "Chờ sếp duyệt")
    })
    act(() => {
      result.current.moveColumn(4, -1)
    })

    expect(getStoredWork().columns.map((c) => c.title)).toEqual(["Bắt đầu", "Chờ sếp duyệt", "Đang làm", "Hoàn thành"])
  })

  it("removeColumn moves its cards to the first remaining column", async () => {
    seed([stored({ id: 1 }), stored({ id: 2, columnId: 2 })])
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toHaveLength(2))

    act(() => {
      result.current.removeColumn(2)
    })

    expect(getStoredWork().columns.map((c) => c.id)).toEqual([1, 3])
    expect(columnIds(1)).toEqual([1, 2])
  })

  it("saveStandup adds today's entry and overwrites it when saved again the same day", async () => {
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.standups).toEqual([]))

    act(() => {
      result.current.saveStandup("2026-10-13", { yesterday: "- A", today: "- B", blockers: "" })
    })
    act(() => {
      result.current.saveStandup("2026-10-13", { yesterday: "- A", today: "- B sửa", blockers: "Chờ duyệt" })
    })

    expect(getStoredWork().standups).toEqual([
      { day: "2026-10-13", yesterday: "- A", today: "- B sửa", blockers: "Chờ duyệt" },
    ])
    expect(toast.success).toHaveBeenCalledWith("Đã lưu standup")
  })

  it("reports a failed write with a toast and returns false instead of throwing", async () => {
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toEqual([]))
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("QuotaExceededError")
    })

    let ok = true
    act(() => {
      ok = result.current.addTask("Gửi báo cáo")
    })

    expect(ok).toBe(false)
    expect(toast.error).toHaveBeenCalledWith("Không thể thêm việc. Vui lòng thử lại.")
    expect(getStoredWork().tasks).toEqual([])
  })
})

describe("useWork — dữ liệu do nơi khác ghi", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 13, 9, 0))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps the card another tab saved when adding one here, with a fresh id", async () => {
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toEqual([]))

    // Ghi thẳng, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    window.localStorage.setItem(WORK_STORAGE_KEY, JSON.stringify({ ...DEFAULT_WORK_STATE, tasks: [stored({ id: 1 })] }))
    act(() => {
      result.current.addTask("Gửi báo cáo")
    })

    expect(
      getStoredWork()
        .tasks.map((t) => t.id)
        .sort((a, b) => a - b)
    ).toEqual([1, 2])
  })

  it("re-reads when another tab writes work-data", async () => {
    const { result } = renderHook(() => useWork())
    await waitFor(() => expect(result.current.tasks).toEqual([]))

    act(() => {
      seed([stored({ id: 7 })])
    })

    await waitFor(() => expect(result.current.tasks.map((t) => t.id)).toEqual([7]))
  })
})
