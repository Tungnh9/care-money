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

  // Gõ tên ở "+ Thêm thẻ" cuối cột là xong — hạn và ưu tiên sửa sau khi bấm vào thẻ.
  const addTask = useCallback(
    (title: string, columnId?: number): boolean => {
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
          dueDate: null,
          priority: "normal",
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

  // Sửa tên/hạn/ưu tiên — cột và trạng thái xong giữ nguyên (chuyển cột đi qua moveTask).
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
        persist({ ...current, tasks: current.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
        toast.success("Đã cập nhật việc")
        return true
      } catch {
        toast.error("Không thể cập nhật việc. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  const moveTask = useCallback(
    (id: number, columnId: number, index: number) =>
      update(
        (current) => board.moveTask(current, id, columnId, index, dayKey()),
        "Không thể chuyển thẻ. Vui lòng thử lại."
      ),
    [update]
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
    moveTask,
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
