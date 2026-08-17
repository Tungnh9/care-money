"use client"

import { Card } from "@/components/ui/card"
import { TaskItem } from "@/components/ob/task-item"
import type { Task } from "../types"

interface TasksCardProps {
  tasks: Task[]
  onToggle: (index: number) => void
}

function TasksCard({ tasks, onToggle }: TasksCardProps) {
  return (
    <Card label="Nhiệm vụ hôm nay">
      <div className="flex flex-col gap-[10px]">
        {tasks.map((task, i) => (
          <TaskItem key={task.label} label={task.label} done={task.done} onToggle={() => onToggle(i)} />
        ))}
      </div>
    </Card>
  )
}

export { TasksCard }
