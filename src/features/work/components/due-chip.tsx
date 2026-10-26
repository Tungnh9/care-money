import type { WorkTask } from "@/lib/work/types"
import { shortDay } from "../short-day"
import { Chip } from "./chip"

interface DueChipProps {
  task: WorkTask
  today: string
}

// Hạn của việc: chưa xong mà qua hạn thì đỏ "quá hạn dd/mm", đúng hôm nay thì "hạn hôm nay".
function DueChip({ task, today }: DueChipProps) {
  if (!task.dueDate) return null
  const overdue = !task.done && task.dueDate < today
  if (task.dueDate === today) return <Chip>hạn hôm nay</Chip>
  return (
    <Chip
      tone={overdue ? "danger" : "neutral"}
    >{`${overdue ? "quá hạn" : "hạn"} ${shortDay(task.dueDate, today)}`}</Chip>
  )
}

export { DueChip }
