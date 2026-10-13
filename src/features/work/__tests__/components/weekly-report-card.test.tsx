import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { WeeklyReportCard } from "../../components/weekly-report-card"
import { copyText } from "../../copy-text"
import { DEFAULT_COLUMNS } from "@/lib/work/board"
import type { WorkState, WorkTask } from "@/lib/work/types"

vi.mock("../../copy-text", () => ({ copyText: vi.fn().mockResolvedValue(true) }))

// 2026-10-13 là thứ Ba — tuần này là 12/10 – 18/10.
const TODAY = "2026-10-13"

function task(overrides: Partial<WorkTask> & { id: number }): WorkTask {
  return {
    title: `Việc ${overrides.id}`,
    dueDate: null,
    priority: "normal",
    columnId: overrides.done ? 3 : 1,
    done: false,
    doneAt: null,
    createdAt: "2026-10-01",
    ...overrides,
  }
}

const STATE: WorkState = {
  columns: DEFAULT_COLUMNS,
  tasks: [
    task({ id: 1, title: "Gửi báo cáo", done: true, doneAt: "2026-10-12" }),
    task({ id: 2, title: "Họp team", done: true, doneAt: TODAY }),
    task({ id: 3, title: "Số liệu tháng", done: true, doneAt: TODAY }),
    task({ id: 4, title: "Việc tuần trước", done: true, doneAt: "2026-10-07" }),
    task({ id: 5, title: "Duyệt bài", dueDate: "2026-10-12", columnId: 2 }),
    task({ id: 6, title: "Viết tài liệu", dueDate: "2026-10-16" }),
    task({ id: 7, title: "Nộp hồ sơ", dueDate: "2026-10-08", done: true, doneAt: TODAY }),
  ],
  standups: [{ day: "2026-10-12", yesterday: "", today: "", blockers: "Chờ số liệu" }],
}

const section = (name: string) => screen.getByRole("region", { name })

describe("WeeklyReportCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sums up the week in three tiles, flagging overdue unfinished tasks", () => {
    render(<WeeklyReportCard state={STATE} today={TODAY} />)

    const summary = screen.getByRole("list", { name: "Tóm tắt tuần" })
    const tiles = within(summary).getAllByRole("listitem")
    expect(tiles.map((t) => t.textContent)).toEqual(["Đã xong4", "Còn dở21 quá hạn", "Vướng mắc1"])
    expect(screen.getByText("12/10 – 18/10")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tuần này" })).toHaveAttribute("aria-pressed", "true")
  })

  it("groups the finished tasks by the day they were done", () => {
    render(<WeeklyReportCard state={STATE} today={TODAY} />)

    const done = section("Đã xong")
    expect(within(done).getByText("Thứ Hai, 12/10").nextElementSibling).toHaveTextContent("Gửi báo cáo")
    expect(within(done).getByText("Thứ Ba, 13/10").nextElementSibling).toHaveTextContent("Họp teamSố liệu thángNộp hồ sơ")
    expect(within(done).queryByText("Việc tuần trước")).not.toBeInTheDocument()
  })

  it("lists unfinished tasks with their due date and the column they are in", () => {
    render(<WeeklyReportCard state={STATE} today={TODAY} />)

    const items = within(section("Còn dở")).getAllByRole("listitem")
    expect(items.map((i) => i.textContent)).toEqual(["Duyệt bàiquá hạn 12/10Đang làm", "Viết tài liệuhạn 16/10Bắt đầu"])
  })

  it("lists the week's blockers with their day", () => {
    render(<WeeklyReportCard state={STATE} today={TODAY} />)

    expect(within(section("Vướng mắc")).getByRole("listitem")).toHaveTextContent("Thứ Hai, 12/10Chờ số liệu")
  })

  it("shows how many tasks were finished on each day of the week", () => {
    render(<WeeklyReportCard state={STATE} today={TODAY} />)

    const chart = screen.getByRole("list", { name: "Việc xong theo ngày" })
    expect(within(chart).getAllByRole("listitem")).toHaveLength(7)
    expect(within(chart).getByText("Thứ Hai, 12/10: 1 việc")).toBeInTheDocument()
    expect(within(chart).getByText("Thứ Ba, 13/10: 3 việc")).toBeInTheDocument()
    expect(within(chart).getByText("Chủ nhật, 18/10: 0 việc")).toBeInTheDocument()
  })

  it("switches to last week, where a task finished only this week still counts as unfinished", () => {
    render(<WeeklyReportCard state={STATE} today={TODAY} />)

    fireEvent.click(screen.getByRole("button", { name: "Tuần trước" }))

    expect(screen.getByText("05/10 – 11/10")).toBeInTheDocument()
    expect(within(section("Đã xong")).getByText("Việc tuần trước")).toBeInTheDocument()
    expect(within(section("Còn dở")).getByRole("listitem")).toHaveTextContent("Nộp hồ sơhạn 08/10xong 13/10")
  })

  it("says so plainly when a week has nothing in it", () => {
    render(<WeeklyReportCard state={{ columns: DEFAULT_COLUMNS, tasks: [], standups: [] }} today={TODAY} />)

    expect(within(section("Đã xong")).getByText("Chưa có việc nào xong.")).toBeInTheDocument()
    expect(within(section("Còn dở")).getByText("Không có việc nào còn dở.")).toBeInTheDocument()
    expect(within(section("Vướng mắc")).getByText("Không có vướng mắc nào.")).toBeInTheDocument()
  })

  it("keeps the plain text in a collapsed preview and copies exactly that", () => {
    render(<WeeklyReportCard state={STATE} today={TODAY} />)

    const preview = screen.getByText("Xem bản văn bản (nội dung sẽ được copy)").closest("details")!
    expect(preview).not.toHaveAttribute("open")
    expect(within(preview).getByText(/^Báo cáo tuần 12\/10 – 18\/10/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Copy báo cáo" }))

    expect(copyText).toHaveBeenCalledWith(within(preview).getByText(/^Báo cáo tuần/).textContent)
  })
})
