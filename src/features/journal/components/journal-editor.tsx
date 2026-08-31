"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { JournalEntry, MoodSnapshot } from "../types"

interface JournalEditorProps {
  selectedMood: MoodSnapshot | null
  onSave: (input: { text: string; words: number; mood: MoodSnapshot | null }) => void
  editingEntry?: JournalEntry | null
  onCancelEdit?: () => void
}

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function JournalEditor({ selectedMood, onSave, editingEntry, onCancelEdit }: JournalEditorProps) {
  const [text, setText] = useState(editingEntry?.text ?? "")
  const words = countWords(text)
  const isEditing = !!editingEntry

  function handleClear() {
    setText("")
  }

  function handleSave() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSave({ text: trimmed, words, mood: selectedMood })
    setText("")
  }

  return (
    <Card className="col-span-full">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Hôm nay của bạn thế nào?"
        aria-label="Nội dung nhật ký"
        className="min-h-[220px] w-full resize-y text-[var(--ob-color-text)] outline-none [font:var(--ob-text-body)] placeholder:text-[var(--ob-color-text-subtle)] md:min-h-[300px]"
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
