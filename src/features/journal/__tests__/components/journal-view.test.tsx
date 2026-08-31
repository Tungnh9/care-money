import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { JournalView } from "../../components/journal-view"

function typeInto(editor: HTMLElement, text: string) {
  fireEvent.change(editor, { target: { value: text } })
}

describe("JournalView", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("saves an entry, shows the success card, then lists it after dismissing", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Hôm nay mình đã đi bộ")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    expect(await screen.findByText("Đã lưu vào nhật ký")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Viết thêm một bài" }))

    await waitFor(() => expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument())
    expect(screen.getByText("Hôm nay mình đã đi bộ")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("shows the mood picker when the tamtrang module is enabled by default", async () => {
    render(<JournalView />)

    expect(await screen.findByText("Tâm trạng hôm nay")).toBeInTheDocument()
  })

  it("shows the mascot empty-state when there are no entries yet", async () => {
    render(<JournalView />)

    expect(await screen.findByText("Chưa có bài nào")).toBeInTheDocument()
    expect(screen.getByText("Bài đầu tiên bạn lưu sẽ hiện ở đây.")).toBeInTheDocument()
  })

  it("celebrates a saved entry with the mascot and a tada card", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Hôm nay mình đã đi bộ")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    const successCard = (await screen.findByText("Đã lưu vào nhật ký")).closest("section")
    expect(successCard).toHaveClass("ob-tada")
    expect(successCard?.querySelector("svg")).toBeInTheDocument()
  })

  it("wraps the sections in the ob-card-grid entrance-animation class", async () => {
    render(<JournalView />)

    const entriesCard = (
      await waitFor(() => screen.getByText("Nhật ký đã viết", { exact: false }))
    ).closest("section")
    const wrapper = entriesCard?.parentElement?.parentElement

    expect(wrapper).toHaveClass("ob-card-grid")
  })

  it("gives the empty-state entries card more width than the mood card, with both wrappers stretched to equal height", async () => {
    render(<JournalView />)

    const moodCard = (await screen.findByText("Tâm trạng hôm nay")).closest("section")
    const moodWrapper = moodCard?.parentElement
    expect(moodWrapper).toHaveClass("flex-[1_1_300px]")
    expect(moodWrapper).toHaveClass("[&>*]:h-full")

    const entriesCard = (await screen.findByText("Chưa có bài nào")).closest("section")
    const entriesWrapper = entriesCard?.parentElement
    expect(entriesWrapper).toHaveClass("flex-[2_1_360px]")
    expect(entriesWrapper).toHaveClass("[&>*]:h-full")
  })

  it("clicking Sửa on an entry prefills the editor and updates it instead of creating a new one", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Bài gốc")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))
    fireEvent.click(await screen.findByRole("button", { name: "Viết thêm một bài" }))

    await waitFor(() => expect(screen.getByText("Bài gốc")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: /Sửa bài/ }))

    expect(screen.getByRole("textbox")).toHaveValue("Bài gốc")
    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Bài đã sửa" } })
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    await waitFor(() => expect(screen.getByText("Bài đã sửa")).toBeInTheDocument())
    expect(screen.queryByText("Bài gốc")).not.toBeInTheDocument()
    expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument()
  })

  it("Huỷ sửa cancels editing without changing the entry", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Bài gốc")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))
    fireEvent.click(await screen.findByRole("button", { name: "Viết thêm một bài" }))

    await waitFor(() => expect(screen.getByText("Bài gốc")).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: /Sửa bài/ }))
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Nội dung nháp bỏ đi" } })
    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }))

    expect(screen.getByText("Bài gốc")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toHaveValue("")
  })
})

describe("JournalView on-this-day card", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows the on-this-day card when an entry exists from exactly 1 year ago", async () => {
    vi.setSystemTime(new Date(2025, 7, 10, 9, 0))
    window.localStorage.setItem(
      "journal-entries",
      JSON.stringify({
        entries: [
          { id: new Date(2025, 7, 10, 9, 0).getTime(), text: "Bài năm ngoái", time: "09:00", date: "10/08", words: 2, mood: null },
        ],
      })
    )
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))

    render(<JournalView />)

    const onThisDayLabel = await screen.findByText("1 năm trước, bạn đã viết")
    expect(onThisDayLabel).toBeInTheDocument()
    const onThisDayCard = onThisDayLabel.closest("section") as HTMLElement
    expect(within(onThisDayCard).getByText("Bài năm ngoái")).toBeInTheDocument()

    // Bài này vẫn xuất hiện thêm 1 lần nữa ở danh sách đầy đủ bên dưới — thẻ "gợi lại
    // quá khứ" chỉ là 1 điểm nhấn, không thay thế/ẩn bài đó khỏi danh sách chính.
    expect(screen.getAllByText("Bài năm ngoái")).toHaveLength(2)
  })

  it("does not show the on-this-day card when there is no matching entry", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))

    render(<JournalView />)

    await screen.findByText("Chưa có bài nào")
    expect(screen.queryByText(/bạn đã viết/)).not.toBeInTheDocument()
  })
})
