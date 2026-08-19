import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { useJournal } from "../../hooks/use-journal"
import {
  DEFAULT_JOURNAL_STATE,
  JOURNAL_STORAGE_KEY,
  getStoredJournal,
} from "../../journal-storage"
import type { JournalEntry } from "../../types"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("useJournal", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("seeds an empty state when localStorage is empty", async () => {
    const { result } = renderHook(() => useJournal())

    await waitFor(() => expect(result.current.entries).toEqual(DEFAULT_JOURNAL_STATE.entries))
  })

  it("saveEntry adds an entry with computed fields and persists it", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 30))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    let saved
    act(() => {
      saved = result.current.saveEntry({ text: "Hôm nay ổn", words: 2, mood: null })
    })

    expect(saved).toMatchObject({ text: "Hôm nay ổn", words: 2, mood: null, date: "10/08" })
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0]).toEqual(saved)
    expect(getStoredJournal().entries).toHaveLength(1)
  })

  it("deleteEntry removes only the matching entry", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 0))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    let first!: JournalEntry
    act(() => {
      first = result.current.saveEntry({ text: "Bài 1", words: 2, mood: null })!
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
    await waitFor(() => expect(result.current.entries).toEqual([]))

    const restored: JournalEntry[] = [
      { id: 1, text: "Khôi phục", time: "09:00", date: "01/08", words: 2, mood: null },
    ]
    act(() => {
      result.current.replaceJournal({ entries: restored })
    })

    expect(result.current.entries).toEqual(restored)
    expect(getStoredJournal().entries).toEqual(restored)
  })

  it("getStoredJournal falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, "{not valid json")

    expect(getStoredJournal()).toEqual(DEFAULT_JOURNAL_STATE)
  })

  it("saveEntry does not show a success toast (the save-success screen already covers that)", async () => {
    vi.setSystemTime(new Date(2026, 7, 10, 9, 30))
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    act(() => {
      result.current.saveEntry({ text: "Hôm nay ổn", words: 2, mood: null })
    })

    expect(toast.success).not.toHaveBeenCalled()
  })

  it("saveEntry returns null, shows an error toast, and does not add the entry when storage write fails", async () => {
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded")
    })

    let saved
    act(() => {
      saved = result.current.saveEntry({ text: "Sẽ lỗi", words: 2, mood: null })
    })

    expect(saved).toBeNull()
    expect(result.current.entries).toEqual([])
    expect(toast.error).toHaveBeenCalledWith("Không thể lưu bài viết. Vui lòng thử lại.")

    setItemSpy.mockRestore()
  })

  it("deleteEntry removes the entry and shows a success toast", async () => {
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    let entry!: JournalEntry
    act(() => {
      entry = result.current.saveEntry({ text: "Bài sẽ xoá", words: 2, mood: null })!
    })

    act(() => {
      result.current.deleteEntry(entry.id)
    })

    expect(result.current.entries).toEqual([])
    expect(toast.success).toHaveBeenCalledWith("Đã xoá bài viết")
  })

  it("deleteEntry keeps the entry and shows an error toast when storage write fails", async () => {
    const { result } = renderHook(() => useJournal())
    await waitFor(() => expect(result.current.entries).toEqual([]))

    let entry!: JournalEntry
    act(() => {
      entry = result.current.saveEntry({ text: "Bài giữ lại", words: 2, mood: null })!
    })

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded")
    })

    act(() => {
      result.current.deleteEntry(entry.id)
    })

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].id).toBe(entry.id)
    expect(toast.error).toHaveBeenCalledWith("Không thể xoá bài viết. Vui lòng thử lại.")

    setItemSpy.mockRestore()
  })
})
