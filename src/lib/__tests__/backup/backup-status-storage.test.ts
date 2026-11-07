import { describe, it, expect, beforeEach, vi } from "vitest"

import { onDataChanged } from "@/lib/data-change-bus"
import { setStoredJournal } from "@/lib/journal/journal-storage"
import { NET_WORTH_HISTORY_KEY, setStoredNetWorthHistory } from "@/lib/net-worth/net-worth-history-storage"
import {
  BACKUP_STATUS_KEY,
  EMPTY_BACKUP_STATUS,
  clearBackupStatus,
  dataFingerprint,
  getBackupStatus,
  laterIso,
  markBackedUp,
  markRestored,
  setBackupStatus,
} from "@/lib/backup/backup-status-storage"

const ENTRY = { id: 1, text: "Bài", time: "09:00", date: "07/11", words: 1, mood: null }

describe("backup-status-storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("reads an empty status when nothing was saved or the saved value is broken", () => {
    expect(getBackupStatus()).toEqual(EMPTY_BACKUP_STATUS)

    window.localStorage.setItem(BACKUP_STATUS_KEY, "{not json")
    expect(getBackupStatus()).toEqual(EMPTY_BACKUP_STATUS)
  })

  it("keeps the fields it can read and drops the ones it cannot", () => {
    window.localStorage.setItem(
      BACKUP_STATUS_KEY,
      JSON.stringify({ fileAt: "2026-11-01T00:00:00.000Z", cloudAt: 5, fingerprint: "abc", cloudEtag: null })
    )

    expect(getBackupStatus()).toEqual({
      fileAt: "2026-11-01T00:00:00.000Z",
      cloudAt: null,
      fingerprint: "abc",
      cloudEtag: null,
    })
  })

  it("notifies on every write and on clearing, but not when there was nothing to clear", () => {
    const listener = vi.fn()
    const unsubscribe = onDataChanged(listener)
    try {
      clearBackupStatus()
      expect(listener).not.toHaveBeenCalled()

      setBackupStatus({ ...EMPTY_BACKUP_STATUS, fileAt: "2026-11-01T00:00:00.000Z" })
      clearBackupStatus()
      expect(listener).toHaveBeenCalledTimes(2)
      expect(window.localStorage.getItem(BACKUP_STATUS_KEY)).toBeNull()
    } finally {
      unsubscribe()
    }
  })

  it("does not throw when storage is full", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    try {
      expect(() => setBackupStatus(EMPTY_BACKUP_STATUS)).not.toThrow()
    } finally {
      setItem.mockRestore()
    }
  })

  describe("dataFingerprint", () => {
    it("changes when user data changes and comes back when it does", () => {
      const empty = dataFingerprint()
      setStoredJournal({ entries: [ENTRY] })
      const withEntry = dataFingerprint()

      expect(withEntry).not.toBe(empty)
      expect(dataFingerprint()).toBe(withEntry)

      window.localStorage.removeItem("journal-entries")
      expect(dataFingerprint()).toBe(empty)
    })

    it("tells a missing key from an empty one", () => {
      const missing = dataFingerprint()
      window.localStorage.setItem("car-goal-fund-name", "")

      expect(dataFingerprint()).not.toBe(missing)
    })

    it("ignores the net-worth history the Overview page records by itself every day", () => {
      const before = dataFingerprint()
      setStoredNetWorthHistory([{ date: "2026-11-07", net: 1, savingsTotal: 1 }])

      expect(window.localStorage.getItem(NET_WORTH_HISTORY_KEY)).not.toBeNull()
      expect(dataFingerprint()).toBe(before)
    })
  })

  it("laterIso picks the later of two times and skips missing or unreadable ones", () => {
    expect(laterIso("2026-11-01T00:00:00.000Z", "2026-11-05T00:00:00.000Z")).toBe("2026-11-05T00:00:00.000Z")
    expect(laterIso("2026-11-05T00:00:00.000Z", null)).toBe("2026-11-05T00:00:00.000Z")
    expect(laterIso(null, "2026-11-05T00:00:00.000Z")).toBe("2026-11-05T00:00:00.000Z")
    expect(laterIso("garbage", "2026-11-05T00:00:00.000Z")).toBe("2026-11-05T00:00:00.000Z")
    expect(laterIso(null, null)).toBeNull()
  })

  it("markBackedUp records the time per kind and keeps the other kind and the ETag", () => {
    setBackupStatus({ fileAt: null, cloudAt: "2026-11-01T00:00:00.000Z", fingerprint: null, cloudEtag: "e1" })

    markBackedUp("file", "2026-11-07T08:00:00.000Z", "fp-1")
    expect(getBackupStatus()).toEqual({
      fileAt: "2026-11-07T08:00:00.000Z",
      cloudAt: "2026-11-01T00:00:00.000Z",
      fingerprint: "fp-1",
      cloudEtag: "e1",
    })

    markBackedUp("cloud", "2026-11-07T09:00:00.000Z", "fp-2", "e2")
    expect(getBackupStatus()).toEqual({
      fileAt: "2026-11-07T08:00:00.000Z",
      cloudAt: "2026-11-07T09:00:00.000Z",
      fingerprint: "fp-2",
      cloudEtag: "e2",
    })
  })

  it("markRestored never moves a backup time backwards, and fingerprints only an exact copy", () => {
    setBackupStatus({ fileAt: "2026-11-05T00:00:00.000Z", cloudAt: null, fingerprint: null, cloudEtag: null })
    setStoredJournal({ entries: [ENTRY] })

    markRestored("file", "2026-10-01T00:00:00.000Z", { exact: true })
    expect(getBackupStatus()).toMatchObject({ fileAt: "2026-11-05T00:00:00.000Z", fingerprint: dataFingerprint() })

    markRestored("cloud", "2026-11-06T00:00:00.000Z", { exact: false, cloudEtag: "e" })
    expect(getBackupStatus()).toEqual({
      fileAt: "2026-11-05T00:00:00.000Z",
      cloudAt: "2026-11-06T00:00:00.000Z",
      fingerprint: null,
      cloudEtag: "e",
    })
  })
})
