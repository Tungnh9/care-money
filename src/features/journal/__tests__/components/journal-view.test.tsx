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
    expect(
      screen.getByText("Chuỗi ngày 1. Còn 29 ngày nữa mở huy hiệu Chuỗi Vàng.")
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Viết thêm một bài" }))

    await waitFor(() => expect(screen.getByText("Nhật ký đã viết · 1")).toBeInTheDocument())
    expect(screen.getByText("Hôm nay mình đã đi bộ")).toBeInTheDocument()
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("shows the mood picker when the tamtrang module is enabled by default", async () => {
    render(<JournalView />)

    expect(await screen.findByText("Tâm trạng hôm nay")).toBeInTheDocument()
  })
})
