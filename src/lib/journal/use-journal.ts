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
} from "@/lib/journal/journal-storage"
import type { JournalEntry, MoodSnapshot } from "@/lib/journal/types"

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

  // Trả true khi đã ghi được — khung soạn (JournalView/JournalEditor) chỉ rời chế độ sửa và xoá chữ khi true.
  const updateEntry = useCallback(
    (id: number, input: SaveEntryInput): boolean => {
      const current = getStoredJournal()
      // Kiểm trên bản đọc tươi: bài có thể vừa bị xoá (ở tab khác, hay ngay trên trang này) trong lúc đang
      // sửa. Không kiểm thì map() không thấy id, ghi lại y nguyên danh sách và vẫn báo "Đã cập nhật".
      if (!current.entries.some((entry) => entry.id === id)) {
        toast.error(
          "Không cập nhật được: bài này đã bị xoá (có thể ở tab khác). Nội dung bạn vừa sửa vẫn còn trong khung soạn."
        )
        return false
      }
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
        return true
      } catch {
        toast.error("Không thể cập nhật bài viết. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  const deleteEntry = useCallback(
    (id: number): boolean => {
      const current = getStoredJournal()
      try {
        persist({ ...current, entries: current.entries.filter((entry) => entry.id !== id) })
        toast.success("Đã xoá bài viết")
        return true
      } catch {
        toast.error("Không thể xoá bài viết. Vui lòng thử lại.")
        return false
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
