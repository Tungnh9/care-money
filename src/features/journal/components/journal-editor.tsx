"use client"

import { useRef, useState } from "react"
import { Bold, Italic, List, ListOrdered, Quote, Underline, Heading2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { MoodSnapshot } from "../types"

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
}

function JournalEditor({ selectedMood, onSave }: JournalEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [words, setWords] = useState(0)

  function runCommand(command: string, value?: string) {
    document.execCommand(command, false, value)
    ref.current?.focus()
  }

  function handleInput() {
    const text = ref.current?.innerText.trim() ?? ""
    setWords(text ? text.split(/\s+/).length : 0)
  }

  function handleClear() {
    if (ref.current) ref.current.innerHTML = ""
    setWords(0)
  }

  function handleSave() {
    const text = ref.current?.innerText.trim() ?? ""
    if (!text) return
    onSave({ text, words, mood: selectedMood })
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
          <Button variant="ghost" size="sm" type="button" onClick={handleClear}>
            Xoá nháp
          </Button>
          <Button variant="primary" size="sm" type="button" disabled={!words} onClick={handleSave}>
            Lưu vào nhật ký
          </Button>
        </div>
      </div>
    </Card>
  )
}

export { JournalEditor }
