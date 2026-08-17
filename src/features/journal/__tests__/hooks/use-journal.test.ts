import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useJournal } from "../../hooks/use-journal"
import {
  DEFAULT_JOURNAL_STATE,
  JOURNAL_STORAGE_KEY,
  getStoredJournal,
} from "../../journal-storage"
import type { JournalEntry } from "../../types"

describe("useJournal", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("seeds an empty state when localStorage is empty", async () => {
    const { result } = renderHook(() => useJournal())

    await waitFor(() => expect(result.current.entries).toEqual(DEFAULT_JOURNAL_STATE.entries))
    expect(result.current.streak).toBe(0)
  })

  it("saveEntry adds an entry with computed fields and persists it", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 30))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.streak).toBe(0))

    let saved
    act(() => {
      saved = result.current.saveEntry({ text: "Hôm nay ổn", words: 2, mood: null })
    })

    expect(saved).toMatchObject({ text: "Hôm nay ổn", words: 2, mood: null, date: "10/08" })
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0]).toEqual(saved)
    expect(result.current.streak).toBe(1)
    expect(getStoredJournal().entries).toHaveLength(1)
  })

  it("does not increment the streak twice for entries saved on the same day", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.streak).toBe(0))

    act(() => {
      result.current.saveEntry({ text: "Bài 1", words: 2, mood: null })
    })
    act(() => {
      result.current.saveEntry({ text: "Bài 2", words: 2, mood: null })
    })

    expect(result.current.entries).toHaveLength(2)
    expect(result.current.streak).toBe(1)
  })

  it("increments the streak again when saving on the very next day", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.streak).toBe(0))

    act(() => {
      result.current.saveEntry({ text: "Bài 1", words: 2, mood: null })
    })
    expect(result.current.streak).toBe(1)

    vi.setSystemTime(new Date(2026, 7, 11, 9, 0))
    act(() => {
      result.current.saveEntry({ text: "Bài 2", words: 2, mood: null })
    })

    expect(result.current.streak).toBe(2)
  })

  it("resets the streak to 1 instead of incrementing it when a day is missed", async () => {
    vi.setSystemTime(new Date(2026, 7, 1, 9, 0))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.streak).toBe(0))

    act(() => {
      result.current.saveEntry({ text: "Bài 1", words: 2, mood: null })
    })
    expect(result.current.streak).toBe(1)

    // Skip 12 days instead of saving the very next day.
    vi.setSystemTime(new Date(2026, 7, 13, 9, 0))
    act(() => {
      result.current.saveEntry({ text: "Bài 2", words: 2, mood: null })
    })

    expect(result.current.streak).toBe(1)
  })

  it("deleteEntry removes only the matching entry", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.streak).toBe(0))

    let first!: JournalEntry
    act(() => {
      first = result.current.saveEntry({ text: "Bài 1", words: 2, mood: null })
    })
    vi.setSystemTime(new Date(2026, 7, 10, 9, 5))
    act(() => {
      result.current.saveEntry({ text: "Bài 2", words: 2, mood: null })
    })
    expect(result.current.entries).toHaveLength(2)

    act(() => {
      result.current.deleteEntry(first.id)
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].text).toBe("Bài 2")
  })

  it("replaceJournal overwrites the whole state and persists it, e.g. after restoring a backup", async () => {
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.streak).toBe(0))

    const restored = { entries: [], streak: 9, lastEntryDay: "2026-08-01" }
    act(() => {
      result.current.replaceJournal(restored)
    })

    expect(result.current.streak).toBe(9)
    expect(getStoredJournal().streak).toBe(9)
  })

  it("getStoredJournal falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, "{not valid json")

    expect(getStoredJournal()).toEqual(DEFAULT_JOURNAL_STATE)
  })
})
