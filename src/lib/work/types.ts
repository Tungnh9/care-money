type WorkPriority = "high" | "normal" | "low"

// 1 cột của bảng Kanban — cột CUỐI luôn là "đã xong".
interface WorkColumn {
  id: number
  title: string
}

interface WorkTask {
  id: number
  title: string
  // dayKey "yyyy-mm-dd" — null là việc không có hạn.
  dueDate: string | null
  priority: WorkPriority
  columnId: number
  // Luôn khớp với việc thẻ có nằm ở cột cuối hay không (board.ts / parseWorkState giữ cho đúng).
  done: boolean
  // dayKey ngày thẻ vào cột cuối — standup "Hôm qua" và báo cáo tuần đọc từ đây.
  doneAt: string | null
  createdAt: string
}

// Mỗi ngày 1 bản (định danh = day), lưu đè khi sửa trong ngày.
interface StandupEntry {
  day: string
  yesterday: string
  today: string
  blockers: string
}

// `tasks` giữ đúng thứ tự hiển thị: trong mỗi cột, thẻ đứng trước trong mảng nằm trên.
interface WorkState {
  columns: WorkColumn[]
  tasks: WorkTask[]
  standups: StandupEntry[]
}

export type { StandupEntry, WorkColumn, WorkPriority, WorkState, WorkTask }
