import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { JournalEditor } from "../../components/journal-editor"
import type { JournalEntry } from "../../types"

// jsdom không đồng bộ innerText <-> innerHTML như trình duyệt thật (set cái này không
// cập nhật cái kia), nên set cả 2 để mô phỏng đúng trạng thái 1 trình duyệt thật sẽ có.
function typeInto(editor: HTMLElement, text: string) {
  editor.innerHTML = text
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

  it("sanitizes pasted HTML before inserting it, instead of letting the browser insert it raw", () => {
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} />)
    const editor = screen.getByRole("textbox")

    const html = '<b>an toàn</b><script>window.__xss = true</script><img src=x onerror="window.__xss2 = true">'
    fireEvent.paste(editor, {
      clipboardData: { getData: (type: string) => (type === "text/html" ? html : "an toàn") },
    })

    // paste mặc định của trình duyệt (chèn thẳng HTML clipboard vào DOM thật) phải bị
    // chặn — execCommand("insertHTML", ...) chỉ được gọi với bản đã sanitize.
    expect(document.execCommand).toHaveBeenCalledWith("insertHTML", false, expect.any(String))
    const inserted = vi.mocked(document.execCommand).mock.calls.find((call) => call[0] === "insertHTML")?.[2]
    expect(inserted).toContain("<b>an toàn</b>")
    expect(inserted).not.toContain("<script>")
    expect(inserted).not.toContain("onerror")
  })

  it("falls back to plain (HTML-escaped) text when the clipboard has no HTML data", () => {
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} />)
    const editor = screen.getByRole("textbox")

    fireEvent.paste(editor, {
      clipboardData: { getData: (type: string) => (type === "text/html" ? "" : "<b>plain</b>") },
    })

    const inserted = vi.mocked(document.execCommand).mock.calls.find((call) => call[0] === "insertHTML")?.[2]
    expect(inserted).toBe("&lt;b&gt;plain&lt;/b&gt;")
  })

  it("sanitizes dropped HTML the same way as pasted HTML, instead of letting the browser insert it raw", () => {
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} />)
    const editor = screen.getByRole("textbox")

    const html = '<b>an toàn</b><script>window.__xss = true</script><img src=x onerror="window.__xss2 = true">'
    fireEvent.drop(editor, {
      dataTransfer: { getData: (type: string) => (type === "text/html" ? html : "an toàn") },
    })

    // kéo-thả là 1 sự kiện khác với dán, nhưng cùng chèn thẳng HTML vào DOM thật nếu
    // không chặn lại — phải sanitize giống hệt paste, không chỉ chặn mỗi paste.
    const inserted = vi.mocked(document.execCommand).mock.calls.find((call) => call[0] === "insertHTML")?.[2]
    expect(inserted).toContain("<b>an toàn</b>")
    expect(inserted).not.toContain("<script>")
    expect(inserted).not.toContain("onerror")
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

  it("sanitizes formatted HTML before saving, keeping only the allowed tags", () => {
    const onSave = vi.fn()
    render(<JournalEditor selectedMood={null} onSave={onSave} />)

    const editor = screen.getByRole("textbox")
    editor.innerHTML = '<b>Đậm</b> và <script>alert(1)</script> chữ thường'
    editor.innerText = "Đậm và  chữ thường"
    fireEvent.input(editor)

    fireEvent.click(screen.getByRole("button", { name: "Lưu vào nhật ký" }))

    const saved = onSave.mock.calls[0][0]
    expect(saved.text).toContain("<b>Đậm</b>")
    expect(saved.text).not.toContain("<script>")
    expect(saved.text).not.toContain("alert(1)")
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

  it("prefills the editor with the entry's sanitized HTML and word count when editing", () => {
    const entry: JournalEntry = {
      id: 1,
      text: "<b>Bài viết cũ</b>",
      time: "09:00",
      date: "10/08",
      words: 3,
      mood: null,
    }
    render(<JournalEditor selectedMood={null} onSave={vi.fn()} editingEntry={entry} />)

    expect(screen.getByRole("textbox").innerHTML).toBe("<b>Bài viết cũ</b>")
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

    typeInto(screen.getByRole("textbox"), "Bài viết đã sửa")
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật bài viết" }))

    expect(onSave).toHaveBeenCalledWith({ text: "Bài viết đã sửa", words: 4, mood })
  })
})
