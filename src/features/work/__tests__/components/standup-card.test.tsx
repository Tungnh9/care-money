import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { StandupCard } from "../../components/standup-card"
import { copyText } from "../../copy-text"
import { DEFAULT_COLUMNS } from "@/lib/work/board"
import type { WorkState, WorkTask } from "@/lib/work/types"

vi.mock("../../copy-text", () => ({ copyText: vi.fn().mockResolvedValue(true) }))

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

const STATE: WorkState = {
  columns: DEFAULT_COLUMNS,
  tasks: [
    task({ id: 1, title: "Gửi báo cáo", done: true, doneAt: "2026-10-12" }),
    task({ id: 2, title: "Duyệt bài", dueDate: TODAY }),
  ],
  standups: [],
}

describe("StandupCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("prefills today's standup from finished and due tasks when nothing is saved yet", () => {
    render(<StandupCard state={STATE} today={TODAY} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Hôm qua")).toHaveValue("- Gửi báo cáo")
    expect(screen.getByLabelText("Hôm nay")).toHaveValue("- Duyệt bài")
    expect(screen.getByLabelText("Vướng mắc")).toHaveValue("")
    expect(screen.getByText("Chưa lưu bản hôm nay")).toBeInTheDocument()
  })

  it("shows the saved entry for today instead of a suggestion", () => {
    const saved = { ...STATE, standups: [{ day: TODAY, yesterday: "- Họp", today: "- Viết bài", blockers: "Chờ ảnh" }] }
    render(<StandupCard state={saved} today={TODAY} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Hôm qua")).toHaveValue("- Họp")
    expect(screen.getByLabelText("Vướng mắc")).toHaveValue("Chờ ảnh")
    expect(screen.getByText("Đã lưu bản hôm nay")).toBeInTheDocument()
  })

  it("saves what was typed for today", () => {
    const onSave = vi.fn().mockReturnValue(true)
    render(<StandupCard state={STATE} today={TODAY} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Vướng mắc"), { target: { value: "Chờ số liệu" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(TODAY, {
      yesterday: "- Gửi báo cáo",
      today: "- Duyệt bài",
      blockers: "Chờ số liệu",
    })
  })

  it("says there are unsaved changes after editing a saved entry", () => {
    const saved = { ...STATE, standups: [{ day: TODAY, yesterday: "- Họp", today: "- Viết bài", blockers: "" }] }
    render(<StandupCard state={saved} today={TODAY} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Vướng mắc"), { target: { value: "Chờ ảnh" } })

    expect(screen.getByText("Có thay đổi chưa lưu")).toBeInTheDocument()
  })

  it("saves a standup typed before midnight under the day it was started", () => {
    const onSave = vi.fn().mockReturnValue(true)
    const { rerender } = render(<StandupCard state={STATE} today={TODAY} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Vướng mắc"), { target: { value: "Chờ số liệu" } })
    rerender(<StandupCard state={STATE} today="2026-10-14" onSave={onSave} />)
    // Đang gõ dở thì thẻ vẫn ở ngày bắt đầu gõ…
    expect(screen.getByText("Standup · Thứ Ba, 13/10")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith(TODAY, expect.objectContaining({ blockers: "Chờ số liệu" }))
    // …lưu xong mới chuyển sang ngày mới.
    expect(screen.getByText("Standup · Thứ Tư, 14/10")).toBeInTheDocument()
  })

  it("copies today's standup as formatted text", () => {
    render(<StandupCard state={STATE} today={TODAY} onSave={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Copy" }))

    expect(copyText).toHaveBeenCalledWith(
      [
        "Standup Thứ Ba, 13/10",
        "",
        "Hôm qua:",
        "- Gửi báo cáo",
        "",
        "Hôm nay:",
        "- Duyệt bài",
        "",
        "Vướng mắc:",
        "- Không có",
      ].join("\n")
    )
  })

  it("replaces the typed text with a fresh suggestion on Gợi ý lại", () => {
    render(<StandupCard state={STATE} today={TODAY} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Hôm nay"), { target: { value: "gõ nhầm" } })
    fireEvent.click(screen.getByRole("button", { name: "Gợi ý lại" }))

    expect(screen.getByLabelText("Hôm nay")).toHaveValue("- Duyệt bài")
  })

  it("follows the data once it loads, as long as nothing has been typed yet", () => {
    const { rerender } = render(
      <StandupCard state={{ columns: DEFAULT_COLUMNS, tasks: [], standups: [] }} today={TODAY} onSave={vi.fn()} />
    )
    expect(screen.getByLabelText("Hôm nay")).toHaveValue("")

    rerender(<StandupCard state={STATE} today={TODAY} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Hôm nay")).toHaveValue("- Duyệt bài")
  })

  it("lists earlier standups, newest first, each with its own copy button", () => {
    const state = {
      ...STATE,
      standups: [
        { day: "2026-10-09", yesterday: "", today: "- Việc thứ Sáu", blockers: "" },
        { day: "2026-10-12", yesterday: "", today: "- Việc thứ Hai", blockers: "" },
      ],
    }
    render(<StandupCard state={state} today={TODAY} onSave={vi.fn()} />)

    const buttons = screen.getAllByRole("button", { name: /^Copy standup / })
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Copy standup Thứ Hai, 12/10",
      "Copy standup Thứ Sáu, 09/10",
    ])
    fireEvent.click(buttons[1])
    expect(copyText).toHaveBeenCalledWith(expect.stringContaining("- Việc thứ Sáu"))
  })
})
