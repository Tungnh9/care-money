"use client"

import { useState } from "react"

import { longDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useJournal } from "../hooks/use-journal"
import { JournalEditor } from "./journal-editor"
import { JournalEntriesCard } from "./journal-entries-card"
import { JournalSaveSuccess } from "./journal-save-success"
import { MoodPickerCard } from "./mood-picker-card"
import type { JournalEntry } from "../types"

function JournalView() {
  const { settings } = useSettings()
  const { entries, saveEntry, deleteEntry } = useJournal()
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
      <div className="ob-card-grid flex flex-wrap gap-5">
        <div className="min-w-0 flex-[1_1_100%]">
          {justSaved ? (
            <JournalSaveSuccess
              entry={justSaved}
              onWriteMore={() => setJustSaved(null)}
              onViewEntries={handleViewEntries}
            />
          ) : (
            <JournalEditor selectedMood={selectedMoodSnapshot} onSave={handleSave} />
          )}
        </div>
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
          <JournalEntriesCard entries={entries} onDelete={deleteEntry} />
        </div>
      </div>
    </div>
  )
}

export { JournalView }
