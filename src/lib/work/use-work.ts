"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { dayKey } from "@/lib/date"
import { nextId } from "@/lib/next-id"
import { useStorageSync } from "@/lib/use-storage-sync"
import * as board from "@/lib/work/board"
import {
  DEFAULT_WORK_STATE,
  WORK_STORAGE_KEY,
  getStoredWork,
  setStoredWork,
  type WorkState,
} from "@/lib/work/work-storage"
import type { StandupEntry, WorkPriority, WorkTask } from "@/lib/work/types"

interface TaskInput {
  title: string
  dueDate: string | null
  priority: WorkPriority
  // Có và khác cột hiện tại thì việc chuyển sang cột đó (dòng "Trạng thái" trong hộp sửa).
  columnId?: number
}

// Chỗ thả khi chuyển việc sang cột khác bằng menu hay hộp sửa: vào cột cuối ("đã xong") thì lên ĐẦU — cột
// đó dài dần, việc vừa xong phải thấy ngay — còn cột khác thì xuống cuối.
function placementIndex(state: WorkState, columnId: number): number {
  return state.columns[state.columns.length - 1]?.id === columnId ? 0 : Number.MAX_SAFE_INTEGER
}

function useWork() {
  const [state, setState] = useState<WorkState>(DEFAULT_WORK_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredWork())
  }, [])

  // Tab khác (hay Tổng quan tick việc, 1 lần nhập file/tải xuống) ghi work-data sau khi trang đã mở.
  const reload = useCallback(() => setState(getStoredWork()), [])
  useStorageSync(WORK_STORAGE_KEY, reload)

  const persist = useCallback((next: WorkState) => {
    setStoredWork(next)
    setState(next)
  }, [])

  // Mọi thao tác ghi dựng từ getStoredWork() đọc tươi, không từ `state` trong closure — kể cả nextId,
  // để thẻ mới không trùng id với thẻ tab khác vừa thêm.

  // Ghi 1 trạng thái bảng mới dựng từ bản đọc tươi; lỗi ghi (bộ nhớ đầy) thì báo, không văng khỏi handler.
  const update = useCallback(
    (build: (current: WorkState) => WorkState, error: string) => {
      const current = getStoredWork()
      try {
        const next = build(current)
        if (next !== current) persist(next)
      } catch {
        toast.error(error)
      }
    },
    [persist]
  )

  // Mặc định vào cột đầu, không hạn, ưu tiên thường; ô thêm nhanh đầu trang đặt luôn hạn/ưu tiên qua `extra`.
  const addTask = useCallback(
    (title: string, columnId?: number, extra?: { dueDate?: string | null; priority?: WorkPriority }): boolean => {
      const clean = title.trim()
      if (!clean) return false
      const current = getStoredWork()
      try {
        const target = current.columns.find((c) => c.id === columnId) ?? current.columns[0]
        const today = dayKey()
        const done = target.id === current.columns[current.columns.length - 1].id
        const task: WorkTask = {
          id: nextId(current.tasks),
          title: clean,
          dueDate: extra?.dueDate ?? null,
          priority: extra?.priority ?? "normal",
          columnId: target.id,
          done,
          doneAt: done ? today : null,
          createdAt: today,
        }
        persist({ ...current, tasks: [...current.tasks, task] })
        return true
      } catch {
        toast.error("Không thể thêm việc. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  // Sửa tên/hạn/ưu tiên; có `columnId` khác cột cũ thì chuyển cột luôn trong cùng 1 lần ghi.
  const updateTask = useCallback(
    (id: number, input: TaskInput): boolean => {
      const title = input.title.trim()
      if (!title) return false
      const current = getStoredWork()
      // Tab khác vừa xoá việc này: báo lỗi và giữ hộp sửa mở, thay vì báo "Đã cập nhật" mà không ghi gì.
      if (!current.tasks.some((t) => t.id === id)) {
        toast.error("Việc này vừa bị xoá ở nơi khác — không còn gì để cập nhật.")
        return false
      }
      try {
        const patch = { title, dueDate: input.dueDate, priority: input.priority }
        const patched = { ...current, tasks: current.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }
        const from = current.tasks.find((t) => t.id === id)!.columnId
        const target = current.columns.find((c) => c.id === input.columnId && c.id !== from)
        persist(target ? board.moveTask(patched, id, target.id, placementIndex(patched, target.id), dayKey()) : patched)
        toast.success(target ? `Đã chuyển sang “${target.title}”` : "Đã cập nhật việc")
        return true
      } catch {
        toast.error("Không thể cập nhật việc. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  // Menu "Chuyển sang" trên thẻ. Trả false (không báo "Đã chuyển") khi việc/cột vừa bị nơi khác xoá hay ghi lỗi.
  const moveTaskTo = useCallback(
    (id: number, columnId: number): boolean => {
      const current = getStoredWork()
      const column = current.columns.find((c) => c.id === columnId)
      if (!column || !current.tasks.some((t) => t.id === id)) return false
      try {
        persist(board.moveTask(current, id, columnId, placementIndex(current, columnId), dayKey()))
        toast.success(`Đã chuyển sang “${column.title}”`)
        return true
      } catch {
        toast.error("Không thể chuyển việc. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  // Tick ở Tổng quan: chưa xong → ĐẦU cột "đã xong" (cột này dài dần, thẻ vừa xong phải thấy ngay);
  // bỏ tick → cuối cột đầu tiên (không nhớ cột cũ).
  const toggleTask = useCallback(
    (id: number) =>
      update((current) => {
        const task = current.tasks.find((t) => t.id === id)
        if (!task) return current
        if (task.done) return board.moveTask(current, id, current.columns[0].id, Number.MAX_SAFE_INTEGER, dayKey())
        return board.moveTask(current, id, current.columns[current.columns.length - 1].id, 0, dayKey())
      }, "Không thể cập nhật việc. Vui lòng thử lại."),
    [update]
  )

  const removeTask = useCallback(
    (id: number): boolean => {
      const current = getStoredWork()
      try {
        persist({ ...current, tasks: current.tasks.filter((t) => t.id !== id) })
        toast.success("Đã xoá việc")
        return true
      } catch {
        toast.error("Không thể xoá việc. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  const addColumn = useCallback(
    (title: string) => update((current) => board.addColumn(current, title), "Không thể thêm cột. Vui lòng thử lại."),
    [update]
  )

  const renameColumn = useCallback(
    (id: number, title: string) =>
      update((current) => board.renameColumn(current, id, title), "Không thể đổi tên cột. Vui lòng thử lại."),
    [update]
  )

  const moveColumn = useCallback(
    (id: number, delta: -1 | 1) =>
      update((current) => board.moveColumn(current, id, delta, dayKey()), "Không thể chuyển cột. Vui lòng thử lại."),
    [update]
  )

  const removeColumn = useCallback(
    (id: number) =>
      update((current) => board.removeColumn(current, id, dayKey()), "Không thể xoá cột. Vui lòng thử lại."),
    [update]
  )

  // Mỗi ngày 1 bản — lưu lại trong ngày thì ghi đè.
  const saveStandup = useCallback(
    (day: string, fields: Omit<StandupEntry, "day">): boolean => {
      const current = getStoredWork()
      try {
        const entry: StandupEntry = { day, ...fields }
        const exists = current.standups.some((s) => s.day === day)
        persist({
          ...current,
          standups: exists ? current.standups.map((s) => (s.day === day ? entry : s)) : [...current.standups, entry],
        })
        toast.success("Đã lưu standup")
        return true
      } catch {
        toast.error("Không thể lưu standup. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  return {
    columns: state.columns,
    tasks: state.tasks,
    standups: state.standups,
    addTask,
    updateTask,
    moveTaskTo,
    toggleTask,
    removeTask,
    addColumn,
    renameColumn,
    moveColumn,
    removeColumn,
    saveStandup,
    replaceWork: persist,
  }
}

export { useWork, type TaskInput }
