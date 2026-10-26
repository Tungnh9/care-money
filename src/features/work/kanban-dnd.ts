import type { UniqueIdentifier } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

import type { WorkColumn, WorkTask } from "@/lib/work/types"

// Phép tính thuần cho lúc kéo thẻ trên bảng — kanban-board.tsx gọi trong các handler của dnd-kit.

// Danh sách id thẻ theo từng cột, đúng thứ tự hiển thị.
type Lists = Map<number, number[]>

// id của dnd-kit: thẻ và cột đều có id số riêng nên mang tiền tố "task-"/"column-" để không đụng nhau.
function taskDndId(id: number): string {
  return `task-${id}`
}

function columnDndId(id: number): string {
  return `column-${id}`
}

function parseDndId(id: UniqueIdentifier): { kind: "task" | "column"; id: number } {
  const [kind, num] = String(id).split("-")
  return { kind: kind === "column" ? "column" : "task", id: Number(num) }
}

function listsOf(columns: WorkColumn[], tasks: WorkTask[]): Lists {
  return new Map(columns.map((c) => [c.id, tasks.filter((t) => t.columnId === c.id).map((t) => t.id)]))
}

// Cột chứa thẻ đó, hoặc chính cột đó nếu đang trỏ vào cột.
function columnOf(lists: Lists, dndId: UniqueIdentifier): number | null {
  const { kind, id } = parseDndId(dndId)
  if (kind === "column") return lists.has(id) ? id : null
  for (const [columnId, ids] of lists) if (ids.includes(id)) return columnId
  return null
}

// Kéo sang cột khác: bỏ thẻ khỏi cột cũ, chèn vào cột mới ngay trên (hoặc dưới) thẻ đang trỏ;
// đang trỏ vào chính cột (chỗ trống, cột rỗng) thì xuống cuối.
function moveAcross(
  lists: Lists,
  taskId: number,
  toColumnId: number,
  overTaskId: number | null,
  below: boolean
): Lists {
  const next = new Map([...lists].map(([columnId, ids]) => [columnId, ids.filter((id) => id !== taskId)]))
  const target = next.get(toColumnId)
  if (!target) return lists
  const at = overTaskId === null ? -1 : target.indexOf(overTaskId)
  target.splice(at < 0 ? target.length : at + (below ? 1 : 0), 0, taskId)
  return next
}

// Thả trong cùng cột: thẻ chiếm chỗ của thẻ nằm dưới con trỏ; thả lên chính nó hay chỗ trống thì giữ nguyên.
function dropIndex(lists: Lists, columnId: number, taskId: number, overTaskId: number | null): number {
  const ids = lists.get(columnId) ?? []
  const from = ids.indexOf(taskId)
  if (overTaskId === null || overTaskId === taskId || !ids.includes(overTaskId)) return from
  return arrayMove(ids, from, ids.indexOf(overTaskId)).indexOf(taskId)
}

export { columnDndId, columnOf, dropIndex, listsOf, moveAcross, parseDndId, taskDndId, type Lists }
