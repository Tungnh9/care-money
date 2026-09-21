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
import type { JournalEntry } from "../types"

function JournalView() {
  const { settings } = useSettings()
  const { entries, saveEntry, updateEntry, deleteEntry } = useJournal()
  const [mood, setMood] = useState("")
  const [justSaved, setJustSaved] = useState<JournalEntry | null>(null)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [highlight, setHighlight] = useState<{ id: number; nonce: number } | null>(null)

  const moodEnabled = settings.modules.find((m) => m.key === "tamtrang")?.on ?? true
  const selectedMood = settings.moods.find((m) => m.label === mood)
  const selectedMoodSnapshot = selectedMood
    ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint, score: selectedMood.score }
    : null
  const onThisDay = findOnThisDay(entries)

  function handleSave(input: { text: string; words: number; mood: typeof selectedMoodSnapshot }) {
    if (editingEntry) {
      updateEntry(editingEntry.id, input)
      setEditingEntry(null)
      setMood("")
      return
    }
    const entry = saveEntry(input)
    if (entry) setJustSaved(entry)
  }

  function handleEdit(entry: JournalEntry) {
    setJustSaved(null)
    setEditingEntry(entry)
    setMood(entry.mood?.label ?? "")
  }

  function handleCancelEdit() {
    setEditingEntry(null)
    setMood("")
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
              onCancelEdit={handleCancelEdit}
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
            <MoodPickerCard moods={settings.moods} selected={mood} onSelect={setMood} />
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
            onDelete={deleteEntry}
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
