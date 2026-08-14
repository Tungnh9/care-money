"use client"

import { useState } from "react"

import { useSettings } from "@/features/settings/hooks/use-settings"
import { useJournal } from "../hooks/use-journal"
import { JournalEditor } from "./journal-editor"
import { JournalEntriesCard } from "./journal-entries-card"
import { JournalSaveSuccess } from "./journal-save-success"
import { MoodPickerCard } from "./mood-picker-card"
import type { JournalEntry } from "../types"

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]

function longDate(): string {
  const d = new Date()
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}`
}

function JournalView() {
  const { settings } = useSettings()
  const { entries, streak, saveEntry, deleteEntry } = useJournal()
  const [mood, setMood] = useState("")
  const [justSaved, setJustSaved] = useState<JournalEntry | null>(null)

  const moodEnabled = settings.modules.find((m) => m.key === "tamtrang")?.on ?? true
  const selectedMood = settings.moods.find((m) => m.label === mood)
  const selectedMoodSnapshot = selectedMood
    ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint }
    : null

  function handleSave(input: { text: string; words: number; mood: typeof selectedMoodSnapshot }) {
    const entry = saveEntry(input)
    setJustSaved(entry)
  }

  function handleViewEntries() {
    setJustSaved(null)
    setTimeout(() => {
      const el = document.getElementById("ds-entries")
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 20)
    }, 60)
  }

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Nhật ký</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {longDate()} · viết bao nhiêu cũng được
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        {justSaved ? (
          <JournalSaveSuccess
            entry={justSaved}
            streak={streak}
            onWriteMore={() => setJustSaved(null)}
            onViewEntries={handleViewEntries}
          />
        ) : (
          <JournalEditor selectedMood={selectedMoodSnapshot} onSave={handleSave} />
        )}
        {moodEnabled ? (
          <MoodPickerCard moods={settings.moods} selected={mood} onSelect={setMood} />
        ) : null}
        <JournalEntriesCard entries={entries} onDelete={deleteEntry} />
      </div>
    </div>
  )
}

export { JournalView }
