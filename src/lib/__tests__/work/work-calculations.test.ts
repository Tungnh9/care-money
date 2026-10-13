import { describe, it, expect } from "vitest"

import {
  formatStandup,
  fridayOf,
  groupTasks,
  previousWorkday,
  suggestStandup,
  weekRange,
  weeklyReport,
  weeklyReportData,
} from "@/lib/work/work-calculations"
import { DEFAULT_COLUMNS } from "@/lib/work/board"
import type { WorkTask } from "@/lib/work/types"

// 2026-10-13 là thứ Ba.
const TODAY = "2026-10-13"

function task(overrides: Partial<WorkTask> & { id: number }): WorkTask {
  return {
    title: `Việc ${overrides.id}`,
    dueDate: null,
    priority: "normal",
    columnId: 1,
    done: false,
    doneAt: null,
    createdAt: "2026-10-01",
    ...overrides,
  }
}

describe("groupTasks", () => {
  it("splits open tasks into overdue, due today, upcoming and no due date, and keeps done ones apart", () => {
    const tasks = [
      task({ id: 1, dueDate: "2026-10-12" }),
      task({ id: 2, dueDate: TODAY }),
      task({ id: 3, dueDate: "2026-10-20" }),
      task({ id: 4 }),
      task({ id: 5, dueDate: "2026-10-12", done: true, doneAt: TODAY }),
    ]

    const groups = groupTasks(tasks, TODAY)

    expect(groups.overdue.map((t) => t.id)).toEqual([1])
    expect(groups.dueToday.map((t) => t.id)).toEqual([2])
    expect(groups.upcoming.map((t) => t.id)).toEqual([3])
    expect(groups.noDue.map((t) => t.id)).toEqual([4])
    expect(groups.done.map((t) => t.id)).toEqual([5])
  })

  it("puts higher priority first in today's list, then the earlier due date", () => {
    const tasks = [
      task({ id: 1, dueDate: TODAY, priority: "low" }),
      task({ id: 2, dueDate: TODAY, priority: "high" }),
      task({ id: 3, dueDate: TODAY, priority: "normal" }),
      task({ id: 4, dueDate: "2026-10-10", priority: "high" }),
      task({ id: 5, dueDate: "2026-10-11", priority: "high" }),
    ]

    const groups = groupTasks(tasks, TODAY)

    expect(groups.dueToday.map((t) => t.id)).toEqual([2, 3, 1])
    expect(groups.overdue.map((t) => t.id)).toEqual([4, 5])
  })

  it("orders upcoming tasks by date first, so tomorrow's low-priority task is not buried under next month's", () => {
    const tasks = [
      task({ id: 1, dueDate: "2026-11-20", priority: "high" }),
      task({ id: 2, dueDate: "2026-10-14", priority: "low" }),
    ]

    expect(groupTasks(tasks, TODAY).upcoming.map((t) => t.id)).toEqual([2, 1])
  })

  it("shows the 20 most recently finished tasks, newest first", () => {
    const tasks = Array.from({ length: 25 }, (_, i) =>
      task({ id: i + 1, done: true, doneAt: `2026-09-${String(i + 1).padStart(2, "0")}` })
    )

    const done = groupTasks(tasks, TODAY).done

    expect(done).toHaveLength(20)
    expect(done[0].id).toBe(25)
    expect(done[19].id).toBe(6)
  })
})

describe("previousWorkday", () => {
  it("goes back to Friday from Monday and over the weekend", () => {
    expect(previousWorkday("2026-10-12")).toBe("2026-10-09") // thứ Hai → thứ Sáu
    expect(previousWorkday("2026-10-11")).toBe("2026-10-09") // Chủ nhật
    expect(previousWorkday("2026-10-10")).toBe("2026-10-09") // thứ Bảy
  })

  it("goes back one day on Tuesday to Friday", () => {
    expect(previousWorkday(TODAY)).toBe("2026-10-12")
    expect(previousWorkday("2026-10-16")).toBe("2026-10-15")
  })
})

describe("previousWorkday — month and year boundaries", () => {
  it("crosses into the previous month and year", () => {
    expect(previousWorkday("2026-06-01")).toBe("2026-05-29") // thứ Hai đầu tháng → thứ Sáu tháng trước
    expect(previousWorkday("2027-01-01")).toBe("2026-12-31") // thứ Sáu 01/01 → thứ Năm 31/12
  })
})

describe("fridayOf", () => {
  it("is this week's Friday on Monday to Friday, and next Friday at the weekend", () => {
    expect(fridayOf("2026-10-12")).toBe("2026-10-16")
    expect(fridayOf(TODAY)).toBe("2026-10-16")
    expect(fridayOf("2026-10-16")).toBe("2026-10-16")
    expect(fridayOf("2026-10-17")).toBe("2026-10-23")
    expect(fridayOf("2026-10-18")).toBe("2026-10-23")
  })
})

describe("fridayOf — year boundary", () => {
  it("lands in the next year when that week's Friday is 1 January", () => {
    expect(fridayOf("2026-12-28")).toBe("2027-01-01")
  })
})

describe("weekRange", () => {
  it("runs from Monday to Sunday", () => {
    expect(weekRange(TODAY)).toEqual({ start: "2026-10-12", end: "2026-10-18" })
    expect(weekRange("2026-10-18")).toEqual({ start: "2026-10-12", end: "2026-10-18" })
    expect(weekRange("2026-10-12")).toEqual({ start: "2026-10-12", end: "2026-10-18" })
  })

  it("spans the turn of the year", () => {
    expect(weekRange("2027-01-01")).toEqual({ start: "2026-12-28", end: "2027-01-03" })
  })
})

describe("suggestStandup", () => {
  it("lists what was finished since the last workday as 'Hôm qua' and what is due as 'Hôm nay'", () => {
    const state = {
      columns: DEFAULT_COLUMNS,
      tasks: [
        task({ id: 1, title: "Gửi báo cáo", done: true, doneAt: "2026-10-12" }),
        task({ id: 2, title: "Xong từ tuần trước", done: true, doneAt: "2026-10-05" }),
        task({ id: 3, title: "Duyệt bài", dueDate: TODAY, priority: "high" }),
        task({ id: 4, title: "Trễ hạn", dueDate: "2026-10-10" }),
        task({ id: 5, title: "Tuần sau", dueDate: "2026-10-20" }),
      ],
      standups: [],
    }

    expect(suggestStandup(state, TODAY)).toEqual({
      yesterday: "- Gửi báo cáo",
      today: "- Trễ hạn\n- Duyệt bài",
      blockers: "",
    })
  })

  it("on Monday also counts work finished over the weekend", () => {
    const state = {
      columns: DEFAULT_COLUMNS,
      tasks: [
        task({ id: 1, title: "Thứ Sáu", done: true, doneAt: "2026-10-09" }),
        task({ id: 2, title: "Chủ nhật", done: true, doneAt: "2026-10-11" }),
      ],
      standups: [],
    }

    expect(suggestStandup(state, "2026-10-12").yesterday).toBe("- Thứ Sáu\n- Chủ nhật")
  })

  it("carries over free-text plans from the previous standup, but not tasks that are still open", () => {
    const state = {
      columns: DEFAULT_COLUMNS,
      tasks: [task({ id: 1, title: "Duyệt bài", dueDate: TODAY })],
      standups: [{ day: "2026-10-12", yesterday: "", today: "- Họp khách hàng\n- Duyệt bài", blockers: "" }],
    }

    expect(suggestStandup(state, TODAY).yesterday).toBe("- Họp khách hàng")
  })

  it("does not carry plans from an old standup when days were skipped", () => {
    const state = {
      columns: DEFAULT_COLUMNS,
      tasks: [],
      standups: [{ day: "2026-10-05", yesterday: "", today: "- Kế hoạch tuần trước", blockers: "" }],
    }

    expect(suggestStandup(state, TODAY).yesterday).toBe("")
  })

  it("keeps a carried plan line for an open task that is not due yet, since it would show nowhere else", () => {
    const state = {
      columns: DEFAULT_COLUMNS,
      tasks: [task({ id: 1, title: "Viết đề xuất", dueDate: "2026-10-20" })],
      standups: [{ day: "2026-10-12", yesterday: "", today: "- Viết đề xuất", blockers: "" }],
    }

    expect(suggestStandup(state, TODAY).yesterday).toBe("- Viết đề xuất")
  })

  it("adds cards sitting in a middle (in-progress) column to 'Hôm nay', after the due ones", () => {
    const state = {
      columns: DEFAULT_COLUMNS,
      tasks: [
        task({ id: 1, title: "Đang viết bài", columnId: 2 }),
        task({ id: 2, title: "Chưa bắt đầu", columnId: 1 }),
        task({ id: 3, title: "Đến hạn", dueDate: TODAY, columnId: 2 }),
      ],
      standups: [],
    }

    expect(suggestStandup(state, TODAY).today).toBe("- Đến hạn\n- Đang viết bài")
  })
})

describe("formatStandup", () => {
  it("builds a copy-ready text with the three sections, writing 'Không có' for an empty one", () => {
    const text = formatStandup({ day: TODAY, yesterday: "- Gửi báo cáo", today: "- Duyệt bài\n- Họp", blockers: "  " })

    expect(text).toBe(
      ["Standup Thứ Ba, 13/10", "", "Hôm qua:", "- Gửi báo cáo", "", "Hôm nay:", "- Duyệt bài", "- Họp", "", "Vướng mắc:", "- Không có"].join("\n")
    )
  })
})

describe("weeklyReport", () => {
  it("lists this week's finished tasks, the unfinished ones due this week and the week's blockers", () => {
    const state = {
      tasks: [
        task({ id: 1, title: "Gửi báo cáo", done: true, doneAt: "2026-10-12" }),
        task({ id: 2, title: "Họp team", done: true, doneAt: TODAY }),
        task({ id: 3, title: "Số liệu tháng", done: true, doneAt: TODAY }),
        task({ id: 4, title: "Tuần trước", done: true, doneAt: "2026-10-09" }),
        task({ id: 5, title: "Duyệt bài", dueDate: "2026-10-15" }),
        task({ id: 6, title: "Tháng sau", dueDate: "2026-11-15" }),
      ],
      standups: [
        { day: "2026-10-12", yesterday: "", today: "", blockers: "Chờ số liệu" },
        { day: TODAY, yesterday: "", today: "", blockers: "" },
      ],
    }

    expect(weeklyReport(state, TODAY)).toBe(
      [
        "Báo cáo tuần 12/10 – 18/10",
        "",
        "Đã xong (3):",
        "- Gửi báo cáo",
        "- Họp team",
        "- Số liệu tháng",
        "",
        "Còn dở (1):",
        "- Duyệt bài — hạn 15/10",
        "",
        "Vướng mắc:",
        "- Thứ Hai, 12/10: Chờ số liệu",
      ].join("\n")
    )
  })

  it("counts a task due last week but finished after it as still unfinished in last week's report", () => {
    const state = {
      tasks: [task({ id: 1, title: "Nộp hồ sơ", dueDate: "2026-10-08", done: true, doneAt: TODAY })],
      standups: [],
    }

    const lastWeek = weeklyReport(state, "2026-10-07")

    expect(lastWeek).toContain("Còn dở (1):\n- Nộp hồ sơ — hạn 08/10")
    expect(weeklyReport(state, TODAY)).toContain("Đã xong (1):")
  })

  it("writes 'Không có' for every empty section", () => {
    expect(weeklyReport({ tasks: [], standups: [] }, TODAY)).toBe(
      ["Báo cáo tuần 12/10 – 18/10", "", "Đã xong (0):", "- Không có", "", "Còn dở (0):", "- Không có", "", "Vướng mắc:", "- Không có"].join("\n")
    )
  })
})

describe("weeklyReportData", () => {
  const state = {
    tasks: [
      task({ id: 3, title: "Số liệu tháng", done: true, doneAt: TODAY }),
      task({ id: 1, title: "Gửi báo cáo", done: true, doneAt: "2026-10-12" }),
      task({ id: 2, title: "Họp team", done: true, doneAt: TODAY }),
      task({ id: 4, title: "Tuần trước", done: true, doneAt: "2026-10-09" }),
      task({ id: 6, title: "Hạn thứ Sáu", dueDate: "2026-10-16" }),
      task({ id: 5, title: "Duyệt bài", dueDate: "2026-10-15" }),
      task({ id: 7, title: "Tháng sau", dueDate: "2026-11-15" }),
    ],
    standups: [
      { day: TODAY, yesterday: "", today: "", blockers: "  Chờ duyệt\nThiếu máy test " },
      { day: "2026-10-12", yesterday: "", today: "", blockers: "Chờ số liệu" },
      { day: "2026-10-14", yesterday: "", today: "", blockers: "  " },
    ],
  }

  it("gives the week's range, the tasks finished in it in the order they were done, and the unfinished ones by due date", () => {
    const data = weeklyReportData(state, TODAY)

    expect(data.start).toBe("2026-10-12")
    expect(data.end).toBe("2026-10-18")
    expect(data.finished.map((t) => t.id)).toEqual([1, 2, 3])
    expect(data.unfinished.map((t) => t.id)).toEqual([5, 6])
  })

  it("keeps each day's blockers as written (trimmed), oldest day first, skipping blank ones", () => {
    expect(weeklyReportData(state, TODAY).blockers).toEqual([
      { day: "2026-10-12", text: "Chờ số liệu" },
      { day: TODAY, text: "Chờ duyệt\nThiếu máy test" },
    ])
  })

  it("counts the tasks finished on each day of the week, Monday first", () => {
    expect(weeklyReportData(state, TODAY).perDay).toEqual([
      { day: "2026-10-12", count: 1 },
      { day: "2026-10-13", count: 2 },
      { day: "2026-10-14", count: 0 },
      { day: "2026-10-15", count: 0 },
      { day: "2026-10-16", count: 0 },
      { day: "2026-10-17", count: 0 },
      { day: "2026-10-18", count: 0 },
    ])
  })
})
