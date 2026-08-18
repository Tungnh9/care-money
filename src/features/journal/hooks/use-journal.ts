"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_JOURNAL_STATE,
  getStoredJournal,
  setStoredJournal,
  type JournalState,
} from "../journal-storage"
import type { JournalEntry, MoodSnapshot } from "../types"

interface SaveEntryInput {
  text: string
  words: number
  mood: MoodSnapshot | null
}

function useJournal() {
  const [state, setState] = useState<JournalState>(DEFAULT_JOURNAL_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredJournal())
  }, [])

  const persist = useCallback((next: JournalState) => {
    setState(next)
    setStoredJournal(next)
  }, [])

  const saveEntry = useCallback(
    (input: SaveEntryInput): JournalEntry => {
      const now = new Date()
      const entry: JournalEntry = {
        id: now.getTime(),
        text: input.text,
        time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        date: `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}`,
        words: input.words,
        mood: input.mood,
      }

      persist({ entries: [entry, ...state.entries] })

      return entry
    },
    [state, persist]
  )

  const deleteEntry = useCallback(
    (id: number) => {
      persist({ ...state, entries: state.entries.filter((entry) => entry.id !== id) })
    },
    [state, persist]
  )

  return {
    entries: state.entries,
    saveEntry,
    deleteEntry,
    replaceJournal: persist,
  }
}

export { useJournal }
