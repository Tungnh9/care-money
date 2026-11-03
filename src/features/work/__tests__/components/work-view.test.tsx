import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { toast } from "sonner"

import { WorkView } from "../../components/work-view"
import { DEFAULT_WORK_STATE, getStoredWork, setStoredWork } from "@/lib/work/work-storage"
import type { WorkState, WorkTask } from "@/lib/work/types"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// 2026-10-13 là thứ Ba.
function stored(overrides: Partial<WorkTask> & { id: number }): WorkTask {
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

function seed(overrides: Partial<WorkState>) {
  setStoredWork({ ...DEFAULT_WORK_STATE, ...overrides })
}

const tile = (name: string | RegExp) => screen.getByRole("region", { name })

describe("WorkView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 13, 9, 0))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the title, the open count and one bento tile per section and per column, with no tabs", () => {
    render(<WorkView />)

    expect(screen.getByRole("heading", { level: 1, name: "Làm việc" })).toBeInTheDocument()
    expect(screen.getByText("0 việc đang mở")).toBeInTheDocument()
    for (const name of [/^Hôm nay/, "Standup", "Tuần này", "Sắp tới", "Đang làm", "Hoàn thành", "Bắt đầu"]) {
      expect(tile(name)).toBeInTheDocument()
    }
    expect(screen.queryByRole("button", { name: "Việc cần làm" })).not.toBeInTheDocument()
  })

  it("quick-adds a task due today into the first column, shows it in the today tile and says where it went", async () => {
    render(<WorkView />)

    fireEvent.change(screen.getByLabelText("Tên việc mới"), { target: { value: "Gửi báo giá" } })
    fireEvent.click(
      within(screen.getByRole("form", { name: "Thêm việc nhanh" })).getByRole("button", { name: "Hôm nay" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Thêm việc" }))

    expect(await within(tile(/^Hôm nay/)).findByText("Gửi báo giá")).toBeInTheDocument()
    expect(within(tile("Bắt đầu")).getByText("Gửi báo giá")).toBeInTheDocument()
    expect(getStoredWork().tasks[0]).toMatchObject({ title: "Gửi báo giá", columnId: 1, dueDate: "2026-10-13" })
    expect(toast.success).toHaveBeenCalledWith("Đã thêm vào “Bắt đầu”")
  })

  it("ticking a task in the today tile moves it to the done tile", async () => {
    seed({ tasks: [stored({ id: 1, title: "Duyệt bài", dueDate: "2026-10-13" })] })
    render(<WorkView />)

    fireEvent.click(await within(tile(/^Hôm nay/)).findByRole("checkbox", { name: 'Đánh dấu xong "Duyệt bài"' }))

    expect(await within(tile("Hoàn thành")).findByText("Duyệt bài")).toBeInTheDocument()
    expect(getStoredWork().tasks[0]).toMatchObject({ columnId: 3, done: true, doneAt: "2026-10-13" })
  })

  it("moves a task to another column from its card menu and confirms with a toast", async () => {
    seed({ tasks: [stored({ id: 1, title: "Viết test" })] })
    render(<WorkView />)

    fireEvent.click(await within(tile("Bắt đầu")).findByRole("button", { name: 'Thao tác với "Viết test"' }))
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Đang làm" }))

    expect(await within(tile("Đang làm")).findByText("Viết test")).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith("Đã chuyển sang “Đang làm”")
  })

  it("changes a task's status from the editor", async () => {
    seed({ tasks: [stored({ id: 1, title: "Viết test" })] })
    render(<WorkView />)

    fireEvent.click(await within(tile("Bắt đầu")).findByRole("button", { name: "Viết test" }))
    const dialog = screen.getByRole("dialog", { name: "Sửa việc" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Hoàn thành" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(getStoredWork().tasks[0]).toMatchObject({ columnId: 3, done: true }))
    expect(screen.queryByRole("dialog", { name: "Sửa việc" })).not.toBeInTheDocument()
  })

  it("deletes a task after confirming", async () => {
    seed({ tasks: [stored({ id: 1, title: "Việc thừa" })] })
    render(<WorkView />)

    fireEvent.click(await within(tile("Bắt đầu")).findByRole("button", { name: 'Thao tác với "Việc thừa"' }))
    fireEvent.click(await screen.findByRole("menuitem", { name: "Xoá" }))
    const confirm = screen.getByRole("alertdialog", { name: "Xoá việc?" })
    fireEvent.click(within(confirm).getByRole("button", { name: "Xoá" }))

    await waitFor(() => expect(getStoredWork().tasks).toEqual([]))
  })

  it("keeps the standup being typed when its sheet is closed and opened again", async () => {
    render(<WorkView />)

    fireEvent.click(screen.getByRole("button", { name: "Viết standup" }))
    const sheet = screen.getByRole("dialog", { name: "Viết standup" })
    fireEvent.change(within(sheet).getByLabelText("Hôm nay"), { target: { value: "- Họp khách" } })
    fireEvent.click(within(sheet).getByRole("button", { name: "Đóng" }))
    expect(screen.queryByRole("dialog", { name: "Viết standup" })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Viết standup" }))
    expect(within(screen.getByRole("dialog", { name: "Viết standup" })).getByLabelText("Hôm nay")).toHaveValue(
      "- Họp khách"
    )
  })

  it("opens the weekly report from the week tile", () => {
    render(<WorkView />)

    fireEvent.click(screen.getByRole("button", { name: "Báo cáo tuần" }))
    expect(
      within(screen.getByRole("dialog", { name: "Báo cáo tuần" })).getByRole("button", { name: "Copy báo cáo" })
    ).toBeInTheDocument()
  })

  it("lists every task of a column in a sheet from Xem tất cả", async () => {
    seed({ tasks: Array.from({ length: 8 }, (_, i) => stored({ id: i + 1, columnId: 2 })) })
    render(<WorkView />)

    fireEvent.click(await within(tile("Đang làm")).findByRole("button", { name: "Xem tất cả 8" }))
    const sheet = screen.getByRole("dialog", { name: "Đang làm · 8" })
    expect(within(sheet).getAllByRole("listitem")).toHaveLength(8)
  })

  it("renames a column from Quản lý cột, and the tile follows", async () => {
    render(<WorkView />)

    fireEvent.click(screen.getByRole("button", { name: "Quản lý cột" }))
    const name = within(screen.getByRole("dialog", { name: "Quản lý cột" })).getByLabelText('Tên cột "Đang làm"')
    fireEvent.change(name, { target: { value: "Đang code" } })
    fireEvent.blur(name)

    expect(await screen.findByRole("region", { name: "Đang code" })).toBeInTheDocument()
  })

  it("still works with a single column: its tasks show in the done tile only", async () => {
    seed({
      columns: [{ id: 1, title: "Việc" }],
      tasks: [stored({ id: 1, title: "Một việc", done: true, doneAt: "2026-10-13" })],
    })
    render(<WorkView />)

    expect(await within(tile("Việc")).findByText("Một việc")).toBeInTheDocument()
    expect(screen.getAllByRole("region", { name: "Việc" })).toHaveLength(1)
  })
})
