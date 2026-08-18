import { describe, it, expect, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { JournalView } from "../../components/journal-view"

function typeInto(editor: HTMLElement, text: string) {
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
})
