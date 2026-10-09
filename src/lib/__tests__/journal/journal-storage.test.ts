import { describe, it, expect, beforeEach } from "vitest"

import {
  DEFAULT_JOURNAL_STATE,
  JOURNAL_STORAGE_KEY,
  getStoredJournal,
  parseJournalState,
  setStoredJournal,
} from "@/lib/journal/journal-storage"
import type { JournalEntry } from "@/lib/journal/types"

const VALID = { id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }

describe("getStoredJournal", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("drops a null entry but keeps the valid ones", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [null, VALID] }))

    expect(getStoredJournal().entries).toEqual([VALID])
  })

  it("keeps an entry written before moods had a score", () => {
    const old = { ...VALID, mood: { emoji: "🙂", label: "Vui", tint: "#FFE0C7" } }
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [old] }))

    expect(getStoredJournal().entries).toEqual([old])
  })

  it("fills in missing fields of an entry instead of dropping it", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [{ id: 5, text: "Chỉ có chữ" }] }))

    expect(getStoredJournal().entries).toEqual([
      { id: 5, text: "Chỉ có chữ", time: "", date: "", words: 0, mood: null },
    ])
  })

  it("returns no entries when the stored entries field is not an array", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: "hỏng" }))

    expect(getStoredJournal().entries).toEqual([])
  })

  it("drops fields that are no longer part of JournalState instead of carrying them forever", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify({ entries: [VALID], streak: 4 }))

    expect(getStoredJournal()).toEqual({ entries: [VALID] })
  })

  it("keeps every field of a valid entry, including the mood score, through a stored round trip", () => {
    // Đọc trả về bản đã qua schema (field lạ bị bỏ) — field nào thiếu khỏi schema sẽ âm thầm rụng ở lần
    // ghi kế tiếp, nên mọi field của JournalEntry, kể cả mood.score, phải sống sót qua 1 vòng ghi/đọc.
    const entry: JournalEntry = {
      id: 7,
      text: "Hôm nay vui lắm",
      time: "21:30",
      date: "12/09",
      words: 4,
      mood: { emoji: "🙂", label: "Vui", tint: "#FFE0C7", score: 4 },
    }

    setStoredJournal({ entries: [entry] })

    expect(getStoredJournal()).toEqual({ entries: [entry] })
  })

  it("drops an entry whose id is not a number and turns a malformed mood into null", () => {
    window.localStorage.setItem(
      JOURNAL_STORAGE_KEY,
      JSON.stringify({
        entries: [VALID, { ...VALID, id: "x" }, { ...VALID, id: 3, mood: { emoji: 1 } }],
      })
    )

    expect(getStoredJournal().entries).toEqual([VALID, { ...VALID, id: 3, mood: null }])
  })
})

describe("parseJournalState", () => {
  it("returns the default state for a value that is not an object", () => {
    expect(parseJournalState(null)).toEqual(DEFAULT_JOURNAL_STATE)
    expect(parseJournalState("x")).toEqual(DEFAULT_JOURNAL_STATE)
  })
})
