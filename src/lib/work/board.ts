import { nextId } from "@/lib/next-id"
import type { WorkColumn, WorkState, WorkTask } from "@/lib/work/types"

// Hàm thuần cho bảng Kanban — useWork gọi rồi ghi kết quả xuống storage.

const DEFAULT_COLUMNS: WorkColumn[] = [
  { id: 1, title: "Bắt đầu" },
  { id: 2, title: "Đang làm" },
  { id: 3, title: "Hoàn thành" },
]

function columnTasks(state: WorkState, columnId: number): WorkTask[] {
  return state.tasks.filter((t) => t.columnId === columnId)
}

// Xếp lại mảng tasks theo thứ tự cột (giữ thứ tự thẻ trong từng cột), rồi cho `done` khớp với cột cuối:
// vào cột cuối thì ghi ngày xong (giữ ngày cũ nếu đã có), rời cột cuối thì xoá.
function rebuild(columns: WorkColumn[], lists: Map<number, WorkTask[]>, today: string): WorkTask[] {
  const lastId = columns[columns.length - 1]?.id
  return columns.flatMap((c) =>
    (lists.get(c.id) ?? []).map((t) => {
      const done = c.id === lastId
      if (done === t.done && t.columnId === c.id && (done || t.doneAt === null)) return t
      return { ...t, columnId: c.id, done, doneAt: done ? (t.done ? t.doneAt : today) : null }
    })
  )
}

function listsOf(state: WorkState): Map<number, WorkTask[]> {
  return new Map(state.columns.map((c) => [c.id, columnTasks(state, c.id)]))
}

function moveTask(state: WorkState, taskId: number, toColumnId: number, toIndex: number, today: string): WorkState {
  const moving = state.tasks.find((t) => t.id === taskId)
  if (!moving || !state.columns.some((c) => c.id === toColumnId)) return state
  const lists = listsOf(state)
  lists.set(moving.columnId, lists.get(moving.columnId)!.filter((t) => t.id !== taskId))
  const target = [...lists.get(toColumnId)!]
  target.splice(Math.max(0, Math.min(toIndex, target.length)), 0, moving)
  lists.set(toColumnId, target)
  return { ...state, tasks: rebuild(state.columns, lists, today) }
}

// Cột mới chen ngay TRƯỚC cột cuối: thêm vào sau cùng thì cột trống mới thành cột "đã xong" và mọi thẻ đang ở
// "Hoàn thành" bị coi như chưa xong.
function addColumn(state: WorkState, title: string): WorkState {
  const clean = title.trim()
  if (!clean) return state
  const column = { id: nextId(state.columns), title: clean }
  const at = Math.max(0, state.columns.length - 1)
  return { ...state, columns: [...state.columns.slice(0, at), column, ...state.columns.slice(at)] }
}

function renameColumn(state: WorkState, columnId: number, title: string): WorkState {
  const clean = title.trim()
  if (!clean) return state
  return { ...state, columns: state.columns.map((c) => (c.id === columnId ? { ...c, title: clean } : c)) }
}

function moveColumn(state: WorkState, columnId: number, delta: -1 | 1, today: string): WorkState {
  const from = state.columns.findIndex((c) => c.id === columnId)
  const to = from + delta
  if (from < 0 || to < 0 || to >= state.columns.length) return state
  const columns = [...state.columns]
  ;[columns[from], columns[to]] = [columns[to], columns[from]]
  return { ...state, columns, tasks: rebuild(columns, listsOf(state), today) }
}

// Thẻ của cột bị xoá dồn xuống cuối cột đầu tiên còn lại; không bao giờ xoá cột cuối cùng còn lại.
function removeColumn(state: WorkState, columnId: number, today: string): WorkState {
  if (state.columns.length <= 1 || !state.columns.some((c) => c.id === columnId)) return state
  const columns = state.columns.filter((c) => c.id !== columnId)
  const lists = listsOf(state)
  const orphans = lists.get(columnId) ?? []
  lists.delete(columnId)
  lists.set(columns[0].id, [...(lists.get(columns[0].id) ?? []), ...orphans])
  return { ...state, columns, tasks: rebuild(columns, lists, today) }
}

export { DEFAULT_COLUMNS, addColumn, columnTasks, moveColumn, moveTask, removeColumn, renameColumn }
