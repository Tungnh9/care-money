import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { setStoredJournal } from "@/lib/journal/journal-storage"
import { dataFingerprint, setBackupStatus } from "@/lib/backup/backup-status-storage"
import { useBackupStatus } from "@/lib/backup/use-backup-status"

const ENTRY = { id: 1, text: "Bài", time: "09:00", date: "07/11", words: 1, mood: null }

describe("useBackupStatus", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("reads an empty device after mount", () => {
    const { result } = renderHook(() => useBackupStatus())

    expect(result.current).toEqual({ ready: true, empty: true, changed: true, fileAt: null, cloudAt: null })
  })

  it("sees data that matches the last backup as unchanged", () => {
    setStoredJournal({ entries: [ENTRY] })
    setBackupStatus({
      fileAt: "2026-11-07T00:00:00.000Z",
      cloudAt: null,
      fingerprint: dataFingerprint(),
      cloudEtag: null,
    })

    const { result } = renderHook(() => useBackupStatus())

    expect(result.current).toEqual({
      ready: true,
      empty: false,
      changed: false,
      fileAt: "2026-11-07T00:00:00.000Z",
      cloudAt: null,
    })
  })

  it("follows writes from this tab and from other tabs", () => {
    setBackupStatus({
      fileAt: "2026-11-07T00:00:00.000Z",
      cloudAt: null,
      fingerprint: dataFingerprint(),
      cloudEtag: null,
    })
    const { result } = renderHook(() => useBackupStatus())
    expect(result.current).toMatchObject({ empty: true, changed: false })

    act(() => {
      setStoredJournal({ entries: [ENTRY] })
    })
    expect(result.current).toMatchObject({ empty: false, changed: true })

    act(() => {
      window.localStorage.removeItem("journal-entries")
      window.dispatchEvent(new StorageEvent("storage", { key: "journal-entries" }))
    })
    expect(result.current).toMatchObject({ empty: true, changed: false })
  })

  it("keeps the same object when a write changes nothing it reports", () => {
    const { result } = renderHook(() => useBackupStatus())
    const first = result.current

    act(() => {
      window.localStorage.setItem("unrelated", "x")
      window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }))
    })

    expect(result.current).toBe(first)
  })
})
