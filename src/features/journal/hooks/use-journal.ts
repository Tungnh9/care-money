"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { useStorageSync } from "@/lib/use-storage-sync"
import {
  DEFAULT_JOURNAL_STATE,
  JOURNAL_STORAGE_KEY,
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

  // Bài lưu ở tab khác (hay từ 1 lần nhập file/tải xuống) hiện ra ngay, không đợi tải lại trang.
  const reload = useCallback(() => setState(getStoredJournal()), [])
  useStorageSync(JOURNAL_STORAGE_KEY, reload)

  const persist = useCallback((next: JournalState) => {
    setStoredJournal(next)
    setState(next)
  }, [])

  // Lưu/sửa/xoá đều dựng từ getStoredJournal() đọc tươi — nếu dựng từ `state` đã tải lúc mở trang,
  // bài vừa lưu ở tab khác sẽ bị ghi đè mất, mà bài nhật ký thì không viết lại được.

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

      const current = getStoredJournal()
      try {
        persist({ entries: [entry, ...current.entries] })
        return entry
      } catch {
        toast.error("Không thể lưu bài viết. Vui lòng thử lại.")
        return null
      }
    },
    [persist]
  )

  const updateEntry = useCallback(
    (id: number, input: SaveEntryInput) => {
      const current = getStoredJournal()
      try {
        persist({
          ...current,
          entries: current.entries.map((entry) =>
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
    [persist]
  )

  const deleteEntry = useCallback(
    (id: number) => {
      const current = getStoredJournal()
      try {
        persist({ ...current, entries: current.entries.filter((entry) => entry.id !== id) })
        toast.success("Đã xoá bài viết")
      } catch {
        toast.error("Không thể xoá bài viết. Vui lòng thử lại.")
      }
    },
    [persist]
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
