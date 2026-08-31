import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { JournalEditor } from "../../components/journal-editor"
import type { JournalEntry } from "../../types"

describe("JournalEditor", () => {
  it("counts words as the user types and enables the save button", () => {
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} />)

    const editor = screen.getByRole("textbox")
    const saveButton = screen.getByRole("button", { name: "Lưu vào nhật ký" })
    expect(saveButton).toBeDisabled()

    fireEvent.change(editor, { target: { value: "Hôm nay là một ngày tốt" } })

    expect(screen.getByText("6 từ")).toBeInTheDocument()
    expect(saveButton).toBeEnabled()
  })

  it("saves the current text, word count, and selected mood, then clears the editor", () => {
    const onSave = vi.fn()
    const mood = { emoji: "🙂", label: "Vui", tint: "#FFE0C7" }
    render(<JournalEditor selectedMood={mood} onSave={onSave} />)

    const editor = screen.getByRole("textbox")
    fireEvent.change(editor, { target: { value: "Một ngày ổn" } })

    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    expect(onSave).toHaveBeenCalledWith({ text: "Một ngày ổn", words: 3, mood })
    expect(editor).toHaveValue("")
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
    fireEvent.change(editor, { target: { value: "Đang viết nháp" } })
    expect(screen.getByText("3 từ")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xoá nháp" }))

    expect(editor).toHaveValue("")
    expect(screen.getByText("0 từ")).toBeInTheDocument()
  })

  it("prefills the textarea with the entry's text and word count when editing", () => {
    const entry: JournalEntry = {
      id: 1,
      text: "Bài viết cũ",
      time: "09:00",
      date: "10/08",
      words: 3,
      mood: null,
    }
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} editingEntry={entry} />)

    expect(screen.getByRole("textbox")).toHaveValue("Bài viết cũ")
    expect(screen.getByText("3 từ")).toBeInTheDocument()
  })

  it("shows 'Cập nhật bài viết' and 'Huỷ sửa' instead of the create-mode buttons when editing", () => {
    const entry: JournalEntry = {
      id: 1,
      text: "Bài viết cũ",
      time: "09:00",
      date: "10/08",
      words: 3,
      mood: null,
    }
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} editingEntry={entry} />)

    expect(screen.getByRole("button", { name: "Cập nhật bài viết" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Huỷ sửa" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Lưu vào nhật ký" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Xoá nháp" })).not.toBeInTheDocument()
  })

  it("calls onCancelEdit when Huỷ sửa is clicked", () => {
    const onCancelEdit = vi.fn()
    const entry: JournalEntry = {
      id: 1,
      text: "Bài viết cũ",
      time: "09:00",
      date: "10/08",
      words: 3,
      mood: null,
    }
    render(
      <JournalEditor
        selectedMood={null}
        onSave={vi.fn()}
        editingEntry={entry}
        onCancelEdit={onCancelEdit}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Huỷ sửa" }))

    expect(onCancelEdit).toHaveBeenCalledTimes(1)
  })

  it("calls onSave with the edited text when updating", () => {
    const onSave = vi.fn()
    const mood = { emoji: "😌", label: "Bình yên", tint: "#E7F6EF" }
    const entry: JournalEntry = {
      id: 1,
      text: "Bài viết cũ",
      time: "09:00",
      date: "10/08",
      words: 3,
      mood: null,
    }
    render(<JournalEditor selectedMood={mood} onSave={onSave} editingEntry={entry} />)

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Bài viết đã sửa" } })
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    expect(onSave).toHaveBeenCalledWith({ text: "Bài viết đã sửa", words: 4, mood })
  })
})
