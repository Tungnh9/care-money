import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { DEFAULT_COLUMNS } from "@/lib/work/board"
import type { WorkState } from "@/lib/work/types"
import { StandupTile } from "../../components/standup-tile"
import { TODAY, task } from "./tile-fixtures"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function state(overrides: Partial<WorkState>): WorkState {
  return { columns: DEFAULT_COLUMNS, tasks: [], standups: [], ...overrides }
}

describe("StandupTile", () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(() => Promise.resolve()) } })
  })

  it("previews the suggestion while today's standup is not saved, with the blocker carried from the last one", () => {
    const tasks = [1, 2, 3, 4].map((id) => task({ id, title: `Việc ${id}`, dueDate: TODAY }))
    render(
      <StandupTile
        state={state({
          tasks,
          standups: [{ day: "2026-10-12", yesterday: "", today: "", blockers: "Chờ cấp quyền staging" }],
        })}
        today={TODAY}
        onWrite={vi.fn()}
      />
    )

    expect(screen.getByText("Chưa lưu")).toBeInTheDocument()
    expect(screen.getByText("Việc 1")).toBeInTheDocument()
    expect(screen.getByText("và 1 việc nữa")).toBeInTheDocument()
    expect(screen.getByText("Chờ cấp quyền staging")).toBeInTheDocument()
    expect(screen.getByText("Từ standup trước")).toBeInTheDocument()
  })

  it("previews today's saved standup, opens the editor and copies the text", () => {
    const onWrite = vi.fn()
    render(
      <StandupTile
        state={state({ standups: [{ day: TODAY, yesterday: "- Gửi báo cáo", today: "- Họp", blockers: "" }] })}
        today={TODAY}
        onWrite={onWrite}
      />
    )

    expect(screen.getByText("Đã lưu")).toBeInTheDocument()
    expect(screen.getByText("Gửi báo cáo")).toBeInTheDocument()
    expect(screen.getByText("Không có")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Viết standup" }))
    expect(onWrite).toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Copy standup" }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Standup Thứ Ba, 13/10\n\nHôm qua:\n- Gửi báo cáo\n\nHôm nay:\n- Họp\n\nVướng mắc:\n- Không có"
    )
  })
})
