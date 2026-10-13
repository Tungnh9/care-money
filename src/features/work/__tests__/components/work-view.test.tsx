import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { WorkView } from "../../components/work-view"
import { DEFAULT_WORK_STATE, getStoredWork, setStoredWork } from "@/lib/work/work-storage"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("WorkView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 9, 13, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the page title, today's counts, the three tabs and the default board", () => {
    render(<WorkView />)

    expect(screen.getByRole("heading", { level: 1, name: "Làm việc" })).toBeInTheDocument()
    expect(screen.getByText("0 việc hôm nay · 0 quá hạn")).toBeInTheDocument()
    for (const tab of ["Việc cần làm", "Standup", "Báo cáo tuần"]) {
      expect(screen.getByRole("button", { name: tab })).toBeInTheDocument()
    }
    for (const title of ["Bắt đầu", "Đang làm", "Hoàn thành"]) {
      expect(screen.getByRole("region", { name: `Cột ${title}` })).toBeInTheDocument()
    }
  })

  it("adds a card to a column, then sets its due date to today from the edit dialog", async () => {
    render(<WorkView />)

    fireEvent.click(screen.getByRole("button", { name: 'Thêm thẻ vào cột "Bắt đầu"' }))
    const input = screen.getByLabelText('Tên thẻ mới ở cột "Bắt đầu"')
    fireEvent.change(input, { target: { value: "Gửi báo cáo" } })
    fireEvent.submit(input)

    const card = await within(screen.getByRole("region", { name: "Cột Bắt đầu" })).findByRole("button", { name: "Gửi báo cáo" })
    expect(getStoredWork().tasks[0]).toMatchObject({ title: "Gửi báo cáo", columnId: 1, done: false })

    fireEvent.click(card)
    const dialog = screen.getByRole("dialog", { name: "Sửa thẻ" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Hôm nay" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(screen.getByText("1 việc hôm nay · 0 quá hạn")).toBeInTheDocument())
    expect(getStoredWork().tasks[0]).toMatchObject({ dueDate: "2026-10-13" })
  })

  it("moving a card to the last column marks it done today", async () => {
    setStoredWork({
      ...DEFAULT_WORK_STATE,
      tasks: [
        { id: 1, title: "Duyệt bài", dueDate: null, priority: "normal", columnId: 2, done: false, doneAt: null, createdAt: "2026-10-12" },
      ],
    })
    render(<WorkView />)

    fireEvent.click(await screen.findByRole("button", { name: 'Chuyển "Duyệt bài" sang cột' }))
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Hoàn thành" }))

    await waitFor(() =>
      expect(within(screen.getByRole("region", { name: "Cột Hoàn thành" })).getByRole("button", { name: "Duyệt bài" })).toBeInTheDocument()
    )
    expect(getStoredWork().tasks[0]).toMatchObject({ columnId: 3, done: true, doneAt: "2026-10-13" })
    // Thẻ được dựng lại ở cột mới — focus đi theo nút "Chuyển" của nó, không rơi về <body>.
    await waitFor(() => expect(screen.getByRole("button", { name: 'Chuyển "Duyệt bài" sang cột' })).toHaveFocus())
  })

  it("shows the standup and the weekly report on their tabs", () => {
    render(<WorkView />)

    fireEvent.click(screen.getByRole("button", { name: "Standup" }))
    expect(screen.getByRole("textbox", { name: "Vướng mắc" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Báo cáo tuần" }))
    expect(screen.getByText(/Báo cáo tuần 12\/10 – 18\/10/)).toBeInTheDocument()
  })

  it("keeps the half-typed standup and card name when switching tabs", () => {
    render(<WorkView />)

    fireEvent.click(screen.getByRole("button", { name: 'Thêm thẻ vào cột "Bắt đầu"' }))
    fireEvent.change(screen.getByLabelText('Tên thẻ mới ở cột "Bắt đầu"'), { target: { value: "Đang gõ dở" } })
    fireEvent.click(screen.getByRole("button", { name: "Standup" }))
    fireEvent.change(screen.getByRole("textbox", { name: "Vướng mắc" }), { target: { value: "Chờ duyệt" } })
    fireEvent.click(screen.getByRole("button", { name: "Việc cần làm" }))

    expect(screen.getByLabelText('Tên thẻ mới ở cột "Bắt đầu"')).toHaveValue("Đang gõ dở")
    fireEvent.click(screen.getByRole("button", { name: "Standup" }))
    expect(screen.getByRole("textbox", { name: "Vướng mắc" })).toHaveValue("Chờ duyệt")
  })
})
