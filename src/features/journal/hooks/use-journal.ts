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
    setStoredJournal(next)
    setState(next)
  }, [])

  const saveEntry = useCallback(
    (input: SaveEntryInput): JournalEntry | null => {
      const now = new Date()
      const entry: JournalEntry = {
        id: now.getTime(),
        text: input.text,
        time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        date: `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}`,
        words: input.words,
        mood: input.mood,
      }

      try {
        persist({ entries: [entry, ...state.entries] })
        return entry
      } catch {
        toast.error("Không thể lưu bài viết. Vui lòng thử lại.")
        return null
      }
    },
    [state, persist]
  )

  const updateEntry = useCallback(
    (id: number, input: SaveEntryInput) => {
      try {
        persist({
          ...state,
          entries: state.entries.map((entry) =>
            entry.id === id
              ? { ...entry, text: input.text, words: input.words, mood: input.mood }
              : entry
          ),
        })
        toast.success("Đã cập nhật bài viết")
      } catch {
        toast.error("Không thể cập nhật bài viết. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const deleteEntry = useCallback(
    (id: number) => {
      try {
        persist({ ...state, entries: state.entries.filter((entry) => entry.id !== id) })
        toast.success("Đã xoá bài viết")
      } catch {
        toast.error("Không thể xoá bài viết. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  return {
    entries: state.entries,
    saveEntry,
    updateEntry,
    deleteEntry,
    replaceJournal: persist,
  }
}

export { useJournal }
