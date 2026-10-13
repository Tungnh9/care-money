"use client"

import { useState } from "react"

import { Tabs } from "@/components/ob/tabs"
import { dayKey } from "@/lib/date"
import { useWork } from "@/lib/work/use-work"
import { groupTasks } from "@/lib/work/work-calculations"
import { KanbanBoard } from "./kanban-board"
import { StandupCard } from "./standup-card"
import { WeeklyReportCard } from "./weekly-report-card"

const TABS = ["Việc cần làm", "Standup", "Báo cáo tuần"]

function WorkView() {
  const work = useWork()
  const { columns, tasks, standups } = work
  const [tab, setTab] = useState(TABS[0])
  const today = dayKey()
  const groups = groupTasks(tasks, today)
  const state = { columns, tasks, standups }

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Làm việc</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {groups.dueToday.length} việc hôm nay · {groups.overdue.length} quá hạn
      </p>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Cả 3 tab luôn được render, tab không chọn chỉ bị ẩn — chuyển tab giữa chừng không mất chữ đang gõ
          (standup chưa lưu, thẻ đang gõ dở). */}
      <div hidden={tab !== "Việc cần làm"}>
        <KanbanBoard
          columns={columns}
          tasks={tasks}
          today={today}
          onAddTask={work.addTask}
          onUpdateTask={work.updateTask}
          onMoveTask={work.moveTask}
          onRemoveTask={work.removeTask}
          onAddColumn={work.addColumn}
          onRenameColumn={work.renameColumn}
          onMoveColumn={work.moveColumn}
          onRemoveColumn={work.removeColumn}
        />
      </div>

      <div hidden={tab !== "Standup"}>
        <div className="ob-card-grid flex flex-wrap gap-5">
          <StandupCard state={state} today={today} onSave={work.saveStandup} className="min-w-0 basis-full" />
        </div>
      </div>

      <div hidden={tab !== "Báo cáo tuần"}>
        <div className="ob-card-grid flex flex-wrap gap-5">
          <WeeklyReportCard state={state} today={today} className="min-w-0 basis-full" />
        </div>
      </div>
    </div>
  )
}

export { WorkView }
