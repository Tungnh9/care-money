import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { JournalView } from "../../components/journal-view"

// jsdom không đồng bộ innerText <-> innerHTML như trình duyệt thật (set cái này không
// cập nhật cái kia), nên set cả 2 để mô phỏng đúng trạng thái 1 trình duyệt thật sẽ có.
function typeInto(editor: HTMLElement, text: string) {
  editor.innerHTML = text
  editor.innerText = text
  fireEvent.input(editor)
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

  it("celebrates a saved entry with the mascot and a firework effect", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Hôm nay mình đã đi bộ")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    const successCard = (await screen.findByText("Đã lưu vào nhật ký")).closest("section")
    expect(successCard).not.toHaveClass("ob-tada")
    expect(successCard?.querySelector("svg")).toBeInTheDocument()
    expect(successCard?.querySelectorAll(".ob-firework-spark").length).toBeGreaterThan(0)
  })

  it("clicking Xem lại bài vừa viết keeps the success card and highlights the entry in the list", async () => {
    render(<JournalView />)

    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Hôm nay mình đã đi bộ")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    expect(await screen.findByText("Đã lưu vào nhật ký")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Xem lại bài vừa viết" }))

    expect(screen.getByText("Đã lưu vào nhật ký")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    const entryRow = screen.getByText("Hôm nay mình đã đi bộ").closest("[id^='journal-entry-']")
    expect(entryRow).toHaveClass("ob-highlight-flash")
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

    expect(screen.getByRole("textbox")).toHaveTextContent("Bài gốc")
    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()

    typeInto(screen.getByRole("textbox"), "Bài đã sửa")
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
    typeInto(screen.getByRole("textbox"), "Nội dung nháp bỏ đi")
    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }))

    expect(screen.getByText("Bài gốc")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu vào nhật ký" })).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeEmptyDOMElement()
  })

  it("copies the selected mood's score into the saved journal snapshot", async () => {
    render(<JournalView />)

    fireEvent.click(screen.getByText("Vui")) // mood mặc định "on: true", score = 4
    const editor = await screen.findByRole("textbox")
    typeInto(editor, "Một ngày ổn")
    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    await waitFor(() => expect(screen.getByText("Đã lưu vào nhật ký")).toBeInTheDocument())
    const stored = JSON.parse(window.localStorage.getItem("journal-entries") ?? "{}")
    expect(stored.entries[0].mood.score).toBe(4)
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
