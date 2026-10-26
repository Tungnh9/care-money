import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { WorkSummarySection } from "../../components/work-summary-section"
import type { WorkTask } from "@/lib/work/types"

const TODAY = "2026-10-13"

function task(overrides: Partial<WorkTask> & { id: number }): WorkTask {
  return {
    title: `Việc ${overrides.id}`,
    dueDate: null,
    priority: "normal",
    // Cột cuối (3) của bảng mặc định là cột hoàn thành.
    columnId: overrides.done ? 3 : 1,
    done: false,
    doneAt: null,
    createdAt: "2026-10-01",
    ...overrides,
  }
}

describe("WorkSummarySection", () => {
  it("lists overdue tasks first, then today's, and leaves out later or undated ones", () => {
    const tasks = [
      task({ id: 1, title: "Hôm nay", dueDate: TODAY }),
      task({ id: 2, title: "Trễ hạn", dueDate: "2026-10-10" }),
      task({ id: 3, title: "Tuần sau", dueDate: "2026-10-20" }),
      task({ id: 4, title: "Không hạn" }),
    ]
    render(<WorkSummarySection tasks={tasks} today={TODAY} onToggleTask={vi.fn()} />)

    expect(screen.getAllByRole("checkbox").map((c) => c.closest("label")?.textContent)).toEqual(["Trễ hạn", "Hôm nay"])
  })

  it("shows at most 5 tasks and says how many more there are", () => {
    const tasks = Array.from({ length: 7 }, (_, i) => task({ id: i + 1, dueDate: TODAY }))
    render(<WorkSummarySection tasks={tasks} today={TODAY} onToggleTask={vi.fn()} />)

    expect(screen.getAllByRole("checkbox")).toHaveLength(5)
    expect(screen.getByText("+2 việc nữa")).toBeInTheDocument()
  })

  it("ticks a task by its id", () => {
    const onToggleTask = vi.fn()
    render(
      <WorkSummarySection
        tasks={[task({ id: 9, title: "Gửi báo cáo", dueDate: TODAY })]}
        today={TODAY}
        onToggleTask={onToggleTask}
      />
    )

    fireEvent.click(screen.getByRole("checkbox", { name: "Gửi báo cáo" }))

    expect(onToggleTask).toHaveBeenCalledWith(9)
  })

  it("keeps a task ticked today on the card, struck through, so it can be unticked", () => {
    const tasks = [
      task({ id: 1, title: "Vừa xong", dueDate: TODAY, done: true, doneAt: TODAY }),
      task({ id: 2, title: "Xong từ hôm qua", dueDate: "2026-10-12", done: true, doneAt: "2026-10-12" }),
      task({ id: 3, title: "Còn làm", dueDate: TODAY }),
    ]
    render(<WorkSummarySection tasks={tasks} today={TODAY} onToggleTask={vi.fn()} />)

    expect(screen.getByRole("checkbox", { name: "Còn làm" })).not.toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Vừa xong" })).toBeChecked()
    expect(screen.queryByRole("checkbox", { name: "Xong từ hôm qua" })).not.toBeInTheDocument()
  })

  it("says so when nothing is due today", () => {
    render(<WorkSummarySection tasks={[task({ id: 1, dueDate: "2026-10-20" })]} today={TODAY} onToggleTask={vi.fn()} />)

    expect(screen.getByText("Hôm nay không có việc đến hạn")).toBeInTheDocument()
  })
})
