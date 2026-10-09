import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { safeArray } from "@/lib/safe-array"
import type { JournalEntry } from "@/lib/journal/types"

interface JournalState {
  entries: JournalEntry[]
}

const JOURNAL_STORAGE_KEY = "journal-entries"

const DEFAULT_JOURNAL_STATE: JournalState = {
  entries: [],
}

// Mood của bài viết trước commit a160fdb chưa có `score` — giữ nguyên là thiếu, không tự điền 3:
// insights-calculations đã bỏ qua mood thiếu score, điền vào sẽ đổi kết quả insight của bài cũ.
const moodSnapshotSchema = z.object({
  emoji: z.string(),
  label: z.string(),
  tint: z.string(),
  score: z.number().optional(),
})

// Chỉ `id` là bắt buộc (làm React key, và findOnThisDay lấy ngày viết từ id). Field khác thiếu
// hoặc sai kiểu thì điền mặc định thay vì bỏ cả bài — 1 bài nhật ký mất là không viết lại được.
// Phần tử không phải object (vd. null trong 1 file sao lưu sửa tay) thì bị bỏ riêng nó.
const journalEntrySchema = z.object({
  id: z.number(),
  text: z.string().catch(""),
  time: z.string().catch(""),
  date: z.string().catch(""),
  words: z.number().catch(0),
  mood: moodSnapshotSchema.nullable().catch(null),
})

// Dùng chung cho đọc localStorage và cho data-transfer.ts (nhập file / tải xuống từ cloud).
function parseJournalState(value: unknown): JournalState {
  const parsed = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
  // Kiểu suy ra từ schema chỉ khác JournalEntry ở mood.score (optional, xem ghi chú ở trên).
  return { entries: safeArray(journalEntrySchema, parsed.entries) as JournalEntry[] }
}

function getStoredJournal(): JournalState {
  try {
    const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY)
    if (!raw) return DEFAULT_JOURNAL_STATE
    return parseJournalState(JSON.parse(raw))
  } catch {
    return DEFAULT_JOURNAL_STATE
  }
}

function setStoredJournal(state: JournalState) {
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(state))
  notifyDataChanged()
}

export {
  JOURNAL_STORAGE_KEY,
  DEFAULT_JOURNAL_STATE,
  getStoredJournal,
  setStoredJournal,
  parseJournalState,
  type JournalState,
}
