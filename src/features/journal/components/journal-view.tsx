"use client"

import { useState } from "react"

import { longDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useJournal } from "../hooks/use-journal"
import { findOnThisDay } from "../journal-calculations"
import { JournalEditor } from "./journal-editor"
import { JournalEntriesCard } from "./journal-entries-card"
import { JournalSaveSuccess } from "./journal-save-success"
import { MoodPickerCard } from "./mood-picker-card"
import { OnThisDayCard } from "./on-this-day-card"
import type { JournalEntry, MoodSnapshot } from "../types"

function JournalView() {
  const { settings } = useSettings()
  const { entries, saveEntry, updateEntry, deleteEntry } = useJournal()
  const [mood, setMood] = useState("")
  const [justSaved, setJustSaved] = useState<JournalEntry | null>(null)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [highlight, setHighlight] = useState<{ id: number; nonce: number } | null>(null)

  const moodEnabled = settings.modules.find((m) => m.key === "tamtrang")?.on ?? true
  const selectedMood = settings.moods.find((m) => m.label === mood)
  // Bài đang sửa vẫn chọn đúng mood đã lưu thì giữ nguyên snapshot đã lưu (đóng băng như Expense.tag) — kể
  // cả khi mood đó đã bị tắt, bị xoá hay được tạo lại trong Cài đặt. Chỉ khi chọn mood khác (hoặc viết bài
  // mới) mới dựng snapshot từ Cài đặt.
  const keptEntryMood = editingEntry?.mood && editingEntry.mood.label === mood ? editingEntry.mood : null
  const selectedMoodSnapshot: MoodSnapshot | null =
    keptEntryMood ??
    (selectedMood
      ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint, score: selectedMood.score }
      : null)
  const onThisDay = findOnThisDay(entries)

  function handleSave(input: { text: string; words: number; mood: typeof selectedMoodSnapshot }): boolean {
    if (editingEntry) {
      // Ghi lỗi (hay bài vừa bị xoá ở tab khác) thì ở lại chế độ sửa: khung soạn còn nguyên chữ để thử lại.
      if (!updateEntry(editingEntry.id, input)) return false
      leaveEditMode()
      return true
    }
    const entry = saveEntry(input)
    if (!entry) return false
    setJustSaved(entry)
    return true
  }

  function handleEdit(entry: JournalEntry) {
    setJustSaved(null)
    setEditingEntry(entry)
    setMood(entry.mood?.label ?? "")
  }

  // Dùng chung cho Huỷ sửa, Cập nhật xong và xoá đúng bài đang sửa.
  function leaveEditMode() {
    setEditingEntry(null)
    setMood("")
  }

  function handleDelete(id: number) {
    // Xoá đúng bài đang sửa thì rời chế độ sửa — không thì nút "Cập nhật" trỏ vào 1 bài không còn nữa.
    if (deleteEntry(id) && editingEntry?.id === id) leaveEditMode()
  }

  function handleViewEntries() {
    if (!justSaved) return
    // nonce buộc React remount đúng dòng đó để phát lại hiệu ứng nhấp nháy, kể cả khi
    // bấm liên tiếp nhiều lần vào cùng 1 bài (setState cùng id sẽ không tự re-render).
    setHighlight({ id: justSaved.id, nonce: Date.now() })
    const el = document.getElementById(`journal-entry-${justSaved.id}`) ?? document.getElementById("ds-entries")
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Nhật ký</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {longDate()} · viết bao nhiêu cũng được
      </p>
      <div className="ob-card-grid flex flex-wrap gap-5">
        <div className="min-w-0 flex-[1_1_100%]">
          {justSaved ? (
            <JournalSaveSuccess
              entry={justSaved}
              onWriteMore={() => setJustSaved(null)}
              onViewEntries={handleViewEntries}
            />
          ) : (
            <JournalEditor
              key={editingEntry?.id ?? "new"}
              selectedMood={selectedMoodSnapshot}
              onSave={handleSave}
              editingEntry={editingEntry}
              onCancelEdit={leaveEditMode}
            />
          )}
        </div>
        {onThisDay ? (
          <div className="min-w-0 flex-[1_1_100%]">
            <OnThisDayCard result={onThisDay} />
          </div>
        ) : null}
        {moodEnabled ? (
          <div className="min-w-0 flex-[1_1_300px] [&>*]:h-full">
            <MoodPickerCard
              moods={settings.moods}
              selected={mood}
              onSelect={setMood}
              entryMood={editingEntry?.mood ?? null}
            />
          </div>
        ) : null}
        <div
          className={cn(
            "min-w-0 [&>*]:h-full",
            entries.length ? "flex-[1_1_100%]" : "flex-[2_1_360px]"
          )}
        >
          <JournalEntriesCard
            entries={entries}
            onDelete={handleDelete}
            onEdit={handleEdit}
            highlightEntryId={highlight?.id ?? null}
            highlightNonce={highlight?.nonce}
          />
        </div>
      </div>
    </div>
  )
}

export { JournalView }
