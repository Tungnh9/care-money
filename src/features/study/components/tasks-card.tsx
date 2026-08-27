"use client"

import { Card } from "@/components/ui/card"
import { TaskItem } from "@/components/ob/task-item"
import { useT } from "@/components/locale-provider"
import type { Task } from "../types"

interface TasksCardProps {
  tasks: Task[]
  onToggle: (index: number) => void
  className?: string
}

function TasksCard({ tasks, onToggle, className }: TasksCardProps) {
  const t = useT()

  return (
    <Card label={t("overview.study.tasksTitle")} className={className}>
      <div className="flex flex-col gap-[10px]">
        {tasks.map((task, i) => (
          <TaskItem key={task.label} label={task.label} done={task.done} onToggle={() => onToggle(i)} />
        ))}
      </div>
    </Card>
  )
}

export { TasksCard }
