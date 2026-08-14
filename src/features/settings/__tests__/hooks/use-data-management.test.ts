import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"

import {
  DEFAULT_FINANCE_STATE,
  getStoredFinance,
  setStoredFinance,
} from "@/features/finance/finance-storage"
import {
  DEFAULT_JOURNAL_STATE,
  getStoredJournal,
  setStoredJournal,
} from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE, getStoredStudy } from "@/features/study/study-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings-storage"
import { EXPORT_VERSION } from "../../data-transfer"
import { useDataManagement } from "../../hooks/use-data-management"

describe("useDataManagement", () => {
  beforeEach(() => {
    window.localStorage.clear()
    URL.createObjectURL = vi.fn(() => "blob:mock")
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
  })

  it("exportData builds a snapshot of every feature's storage and reports the file info", () => {
    setStoredJournal({ ...DEFAULT_JOURNAL_STATE, streak: 3 })
    const onImportSettings = vi.fn()
    const { result } = renderHook(() => useDataManagement({ onImportSettings }))

    act(() => {
      result.current.exportData()
    })

    expect(result.current.exported?.file).toMatch(/^orange-banana-\d{4}-\d{2}-\d{2}\.json$/)
    expect(result.current.exported?.size).toMatch(/KB$/)
    expect(result.current.imported).toBeNull()
  })

  it("importData restores journal/finance/study storage and reports the new settings via the callback", async () => {
    const onImportSettings = vi.fn()
    const { result } = renderHook(() => useDataManagement({ onImportSettings }))

    const settings = { ...DEFAULT_SETTINGS, profile: { ...DEFAULT_SETTINGS.profile, displayName: "Khôi phục" } }
    const payload = {
      version: EXPORT_VERSION,
      journal: { ...DEFAULT_JOURNAL_STATE, streak: 5 },
      finance: { ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 1, target: 2 }] },
      study: DEFAULT_STUDY_STATE,
      settings,
    }
    const file = new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })

    await act(async () => {
      await result.current.importData(file)
    })

    expect(getStoredJournal().streak).toBe(5)
    expect(getStoredFinance().savings).toHaveLength(1)
    expect(onImportSettings).toHaveBeenCalledWith(settings)
    expect(result.current.imported).toEqual({
      ok: true,
      file: "backup.json",
      summary: expect.stringContaining("bài nhật ký"),
    })
  })

  it("importData reports an error and leaves existing storage untouched when the file is invalid", async () => {
    setStoredJournal({ ...DEFAULT_JOURNAL_STATE, streak: 9 })
    const onImportSettings = vi.fn()
    const { result } = renderHook(() => useDataManagement({ onImportSettings }))

    const file = new File(["not json"], "bad.json", { type: "application/json" })
    await act(async () => {
      await result.current.importData(file)
    })

    expect(result.current.imported).toEqual({ ok: false, error: "File không phải JSON hợp lệ." })
    expect(getStoredJournal().streak).toBe(9)
    expect(onImportSettings).not.toHaveBeenCalled()
  })

  it("wipeData resets journal/finance/study to defaults but keeps the gold price", () => {
    setStoredJournal({ entries: [], streak: 7, lastEntryDay: "2026-08-10" })
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      goldPrice: "935.000",
      savings: [{ name: "Quỹ A", amount: 1, target: 2 }],
    })
    const onImportSettings = vi.fn()
    const { result } = renderHook(() => useDataManagement({ onImportSettings }))

    act(() => {
      result.current.wipeData()
    })

    expect(getStoredJournal()).toEqual(DEFAULT_JOURNAL_STATE)
    expect(getStoredFinance()).toEqual({ ...DEFAULT_FINANCE_STATE, goldPrice: "935.000" })
    expect(getStoredStudy()).toEqual(DEFAULT_STUDY_STATE)
  })
})
