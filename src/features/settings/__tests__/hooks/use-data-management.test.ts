import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { DEFAULT_FINANCE_STATE, setStoredFinance } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, setStoredJournal } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE } from "@/features/study/study-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings-storage"
import { EXPORT_VERSION } from "../../data-transfer"
import { useDataManagement } from "../../hooks/use-data-management"

function renderDataManagement() {
  const onReplaceJournal = vi.fn()
  const onReplaceFinance = vi.fn()
  const onReplaceStudy = vi.fn()
  const onReplaceSettings = vi.fn()
  const { result } = renderHook(() =>
    useDataManagement({ onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceSettings })
  )
  return { result, onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceSettings }
}

describe("useDataManagement", () => {
  beforeEach(() => {
    window.localStorage.clear()
    URL.createObjectURL = vi.fn(() => "blob:mock")
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
  })

  it("exportData builds a snapshot of every feature's storage and reports the file info", () => {
    setStoredJournal({ ...DEFAULT_JOURNAL_STATE, streak: 3 })
    const { result } = renderDataManagement()

    act(() => {
      result.current.exportData()
    })

    expect(result.current.exported?.file).toMatch(/^orange-banana-\d{4}-\d{2}-\d{2}\.json$/)
    expect(result.current.exported?.size).toMatch(/KB$/)
    expect(result.current.imported).toBeNull()
  })

  it("importData reports the restored data to each domain's replace callback", async () => {
    const { result, onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceSettings } =
      renderDataManagement()

    const journal = { ...DEFAULT_JOURNAL_STATE, streak: 5 }
    const finance = { ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 1, target: 2 }] }
    const settings = { ...DEFAULT_SETTINGS, profile: { ...DEFAULT_SETTINGS.profile, displayName: "Khôi phục" } }
    const payload = { version: EXPORT_VERSION, journal, finance, study: DEFAULT_STUDY_STATE, settings }
    const file = new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })

    await act(async () => {
      await result.current.importData(file)
    })

    expect(onReplaceJournal).toHaveBeenCalledWith(journal)
    expect(onReplaceFinance).toHaveBeenCalledWith(finance)
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
    expect(onReplaceSettings).toHaveBeenCalledWith(settings)
    expect(result.current.imported).toEqual({
      ok: true,
      file: "backup.json",
      summary: expect.stringContaining("bài nhật ký"),
    })
  })

  it("importData reports an error and calls no replace callback when the file is invalid", async () => {
    const { result, onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceSettings } =
      renderDataManagement()

    const file = new File(["not json"], "bad.json", { type: "application/json" })
    await act(async () => {
      await result.current.importData(file)
    })

    expect(result.current.imported).toEqual({ ok: false, error: "File không phải JSON hợp lệ." })
    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(onReplaceFinance).not.toHaveBeenCalled()
    expect(onReplaceStudy).not.toHaveBeenCalled()
    expect(onReplaceSettings).not.toHaveBeenCalled()
  })

  it("wipeData replaces journal/finance/study with empty defaults but keeps the gold price", () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, goldPrice: "935.000" })
    const { result, onReplaceJournal, onReplaceFinance, onReplaceStudy } = renderDataManagement()

    act(() => {
      result.current.wipeData()
    })

    expect(onReplaceJournal).toHaveBeenCalledWith(DEFAULT_JOURNAL_STATE)
    expect(onReplaceFinance).toHaveBeenCalledWith({
      savings: [],
      cards: [],
      gold: [],
      invests: [],
      goldPrice: "935.000",
    })
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
  })
})
