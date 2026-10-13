import { TaskItem } from "@/components/ob/task-item"
import { Card } from "@/components/ui/card"
import { groupTasks } from "@/lib/work/work-calculations"
import type { WorkTask } from "@/lib/work/types"

const SHOWN = 5

interface WorkSummarySectionProps {
  tasks: WorkTask[]
  today: string
  onToggleTask: (id: number) => void
}

// Việc cần xử lý hôm nay: quá hạn trước, rồi đến hạn hôm nay — tick được ngay mà không cần mở /work.
// Việc vừa tick hôm nay vẫn ở lại (gạch ngang) như "Nhiệm vụ hôm nay", để lỡ tay thì bỏ tick lại được.
function WorkSummarySection({ tasks, today, onToggleTask }: WorkSummarySectionProps) {
  const groups = groupTasks(tasks, today)
  const finishedToday = tasks.filter((t) => t.done && t.doneAt === today && t.dueDate !== null && t.dueDate <= today)
  const list = [...groups.overdue, ...groups.dueToday, ...finishedToday]
  const shown = list.slice(0, SHOWN)

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <Card label="Việc hôm nay" className="min-w-0 w-full">
        {shown.length ? (
          <div className="flex flex-col gap-[6px]">
            {shown.map((t) => (
              <TaskItem key={t.id} label={t.title} done={t.done} onToggle={() => onToggleTask(t.id)} />
            ))}
            {list.length > SHOWN ? (
              <p className="text-[13px] text-[var(--ob-color-text-subtle)]">+{list.length - SHOWN} việc nữa</p>
            ) : null}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--ob-color-text-subtle)]">Hôm nay không có việc đến hạn</p>
        )}
      </Card>
    </div>
  )
}

export { WorkSummarySection }
