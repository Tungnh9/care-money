import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { JournalEditor } from "../../components/journal-editor"

function typeInto(editor: HTMLElement, text: string) {
  editor.innerText = text
  fireEvent.input(editor)
}

describe("JournalEditor", () => {
  beforeEach(() => {
    document.execCommand = vi.fn()
  })

  it("counts words as the user types and enables the save button", () => {
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} />)

    const editor = screen.getByRole("textbox")
    const saveButton = screen.getByRole("button", { name: "Lưu vào nhật ký" })
    expect(saveButton).toBeDisabled()

    typeInto(editor, "Hôm nay là một ngày tốt")

    expect(screen.getByText("6 từ")).toBeInTheDocument()
    expect(saveButton).toBeEnabled()
  })

  it("runs the matching execCommand when a toolbar button is clicked", () => {
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Đậm" }))
    expect(document.execCommand).toHaveBeenCalledWith("bold", false, undefined)

    fireEvent.click(screen.getByRole("button", { name: "Tiêu đề" }))
    expect(document.execCommand).toHaveBeenCalledWith("formatBlock", false, "h3")
  })

  it("saves the current text, word count, and selected mood, then clears the editor", () => {
    const onSave = vi.fn()
    const mood = { emoji: "🙂", label: "Vui", tint: "#FFE0C7" }
    render(<JournalEditor selectedMood={mood} onSave={onSave} />)

    const editor = screen.getByRole("textbox")
    typeInto(editor, "Một ngày ổn")

    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    expect(onSave).toHaveBeenCalledWith({ text: "Một ngày ổn", words: 3, mood })
    expect(editor.innerHTML).toBe("")
    expect(screen.getByText("0 từ")).toBeInTheDocument()
  })

  it("does nothing when saving with no text", () => {
    const onSave = vi.fn()
    render(<JournalEditor selectedMood={null} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    expect(onSave).not.toHaveBeenCalled()
  })

  it("clears the draft and resets the word count", () => {
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} />)

    const editor = screen.getByRole("textbox")
    typeInto(editor, "Đang viết nháp")
    expect(screen.getByText("3 từ")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xoá nháp" }))

    expect(editor.innerHTML).toBe("")
    expect(screen.getByText("0 từ")).toBeInTheDocument()
  })
})
