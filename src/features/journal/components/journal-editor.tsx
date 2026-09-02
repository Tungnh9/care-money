"use client"

import { useEffect, useRef, useState } from "react"
import type { ClipboardEvent, DragEvent } from "react"
import { Bold, Italic, List, ListOrdered, Quote, Underline, Heading2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { sanitizeJournalHtml } from "../journal-html"
import type { JournalEntry, MoodSnapshot } from "../types"

interface Tool {
  icon: typeof Bold
  command: string
  value?: string
  label: string
}

const TOOLS: Tool[] = [
  { icon: Bold, command: "bold", label: "Đậm" },
  { icon: Italic, command: "italic", label: "Nghiêng" },
  { icon: Underline, command: "underline", label: "Gạch chân" },
  { icon: Heading2, command: "formatBlock", value: "h3", label: "Tiêu đề" },
  { icon: List, command: "insertUnorderedList", label: "Danh sách" },
  { icon: ListOrdered, command: "insertOrderedList", label: "Danh sách đánh số" },
  { icon: Quote, command: "formatBlock", value: "blockquote", label: "Trích dẫn" },
]

interface JournalEditorProps {
  selectedMood: MoodSnapshot | null
  onSave: (input: { text: string; words: number; mood: MoodSnapshot | null }) => void
  editingEntry?: JournalEntry | null
  onCancelEdit?: () => void
}

function JournalEditor({ selectedMood, onSave, editingEntry, onCancelEdit }: JournalEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [words, setWords] = useState(editingEntry?.words ?? 0)
  const isEditing = !!editingEntry

  // contentEditable không hỗ trợ prop "value" điều khiển được như input/textarea, nên
  // set innerHTML 1 lần lúc mount qua effect rỗng-dep — component này remount mỗi khi
  // chuyển sang sửa 1 bài khác (parent key={editingEntry?.id}), nên chỉ cần set đúng 1 lần;
  // không dùng ref callback vì callback định nghĩa inline sẽ có identity mới mỗi lần
  // render, khiến React gọi lại nó (và ghi đè nội dung đang gõ dở) sau mỗi lần setWords.
  useEffect(() => {
    if (ref.current && editingEntry) {
      ref.current.innerHTML = sanitizeJournalHtml(editingEntry.text)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy 1 lần lúc mount
  }, [])

  function runCommand(command: string, value?: string) {
    document.execCommand(command, false, value)
    ref.current?.focus()
  }

  function handleInput() {
    const text = ref.current?.innerText?.trim() ?? ""
    setWords(text ? text.split(/\s+/).length : 0)
  }

  // Chặn hành vi chèn mặc định của trình duyệt cho cả dán (paste) lẫn kéo-thả (drop):
  // nội dung HTML chèn vào contentEditable qua 2 đường này đi thẳng vào DOM thật ngay
  // lập tức (vd. <img onerror> tự chạy khi vừa chèn), xảy ra TRƯỚC khi handleSave kịp
  // sanitize — nên phải sanitize ngay tại thời điểm chèn, không thể chỉ dựa vào lúc lưu.
  function insertSanitized(data: DataTransfer) {
    const html = data.getData("text/html")
    const plain = data.getData("text/plain")
    const safeHtml = html ? sanitizeJournalHtml(html) : plain.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string)
    document.execCommand("insertHTML", false, safeHtml)
    handleInput()
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    insertSanitized(e.clipboardData)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    insertSanitized(e.dataTransfer)
  }

  function handleClear() {
    if (ref.current) ref.current.innerHTML = ""
    setWords(0)
  }

  function handleSave() {
    const plainText = ref.current?.innerText?.trim() ?? ""
    if (!plainText) return
    const html = sanitizeJournalHtml(ref.current?.innerHTML ?? "")
    onSave({ text: html, words, mood: selectedMood })
    if (ref.current) ref.current.innerHTML = ""
    setWords(0)
  }

  return (
    <Card className="col-span-full">
      <div className="mb-[14px] flex flex-wrap gap-0.5 border-b border-[var(--ob-color-border)] pb-[10px]">
        {TOOLS.map(({ icon: ToolIcon, command, value, label }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(command, value)}
            className="flex size-11 items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-muted)] transition-[background-color,color] duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:bg-[var(--ob-color-action-soft)] hover:text-[var(--ob-color-action-strong)]"
          >
            <ToolIcon size={17} />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Nội dung nhật ký"
        onInput={handleInput}
        onPaste={handlePaste}
        onDrop={handleDrop}
        data-placeholder="Hôm nay của bạn thế nào?"
        className={cn(
          "min-h-[220px] text-[var(--ob-color-text)] outline-none md:min-h-[300px]",
          "[font:var(--ob-text-body)]",
          "empty:before:text-[var(--ob-color-text-subtle)] empty:before:content-[attr(data-placeholder)]",
          "[&_h3]:mt-[18px] [&_h3]:mb-2 [&_h3]:[font:var(--ob-text-h3)]",
          "[&_blockquote]:my-[14px] [&_blockquote]:border-l-[3px] [&_blockquote]:border-[var(--ob-color-reward)] [&_blockquote]:pl-4 [&_blockquote]:text-[var(--ob-color-text-muted)]",
          "[&_ul]:my-[10px] [&_ul]:list-disc [&_ul]:pl-[22px]",
          "[&_ol]:my-[10px] [&_ol]:list-decimal [&_ol]:pl-[22px]",
          "[&_li]:my-1"
        )}
      />
      <div className="mt-[18px] flex flex-wrap items-center gap-[14px] border-t border-[var(--ob-color-border)] pt-4">
        <span className="[font-family:var(--ob-font-num)] text-[12.5px] text-[var(--ob-color-text-subtle)]">
          {words} từ
        </span>
        <div className="ml-auto flex gap-[10px]">
          {isEditing ? (
            <Button variant="ghost" size="sm" type="button" onClick={onCancelEdit}>
              Huỷ sửa
            </Button>
          ) : (
            <Button variant="ghost" size="sm" type="button" onClick={handleClear}>
              Xoá nháp
            </Button>
          )}
          <Button variant="primary" size="sm" type="button" disabled={!words} onClick={handleSave}>
            {isEditing ? "Cập nhật bài viết" : "Lưu vào nhật ký"}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export { JournalEditor }
