"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import {
  DEFAULT_JOURNAL_STATE,
  getStoredJournal,
  setStoredJournal,
  type JournalState,
} from "../journal-storage"
import type { JournalEntry, MoodSnapshot } from "../types"
import { useT, useLocale } from "@/components/locale-provider"

interface SaveEntryInput {
  text: string
  words: number
  mood: MoodSnapshot | null
}

function useJournal() {
  const t = useT()
  const { locale } = useLocale()
  const [state, setState] = useState<JournalState>(DEFAULT_JOURNAL_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredJournal())
  }, [])

  const persist = useCallback((next: JournalState) => {
    setStoredJournal(next)
    setState(next)
  }, [])

  const saveEntry = useCallback(
    (input: SaveEntryInput): JournalEntry | null => {
      const now = new Date()
      const entry: JournalEntry = {
        id: now.getTime(),
        text: input.text,
        time: now.toLocaleTimeString(locale === "en" ? "en-US" : "vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}`,
        words: input.words,
        mood: input.mood,
      }

      try {
        persist({ entries: [entry, ...state.entries] })
        return entry
      } catch {
        toast.error(t("journal.saveFailed"))
        return null
      }
    },
    [state, persist, locale, t]
  )

  const deleteEntry = useCallback(
    (id: number) => {
      try {
        persist({ ...state, entries: state.entries.filter((entry) => entry.id !== id) })
        toast.success(t("journal.deleted"))
      } catch {
        toast.error(t("journal.deleteFailed"))
      }
    },
    [state, persist, t]
  )

  return {
    entries: state.entries,
    saveEntry,
    deleteEntry,
    replaceJournal: persist,
  }
}

export { useJournal }
