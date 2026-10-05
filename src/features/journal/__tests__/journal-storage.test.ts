import { describe, it, expect, beforeEach } from "vitest"

import { DEFAULT_JOURNAL_STATE, JOURNAL_STORAGE_KEY, getStoredJournal, parseJournalState } from "../journal-storage"

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
})

describe("parseJournalState", () => {
  it("returns the default state for a value that is not an object", () => {
    expect(parseJournalState(null)).toEqual(DEFAULT_JOURNAL_STATE)
    expect(parseJournalState("x")).toEqual(DEFAULT_JOURNAL_STATE)
  })
})
