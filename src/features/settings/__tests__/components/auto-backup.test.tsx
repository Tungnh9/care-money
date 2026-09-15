import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render } from "@testing-library/react"

import { setStoredFinance, DEFAULT_FINANCE_STATE } from "@/features/finance/finance-storage"
import { setStoredJournal, DEFAULT_JOURNAL_STATE } from "@/features/journal/journal-storage"
import { setStoredBudget, DEFAULT_BUDGET_STATE } from "@/features/budget/budget-storage"
import { setSyncSecret } from "@/lib/sync-secret-storage"
import { getAutoBackupStatus } from "../../auto-backup-storage"
import { EXPORT_VERSION } from "../../data-transfer"
import { AutoBackup } from "../../components/auto-backup"

vi.mock("../../api", () => ({
  pushSnapshot: vi.fn(),
  pullSnapshot: vi.fn(),
}))

import { pushSnapshot } from "../../api"

// Khớp với DEBOUNCE_MS (private) trong ../../components/auto-backup.tsx.
const DEBOUNCE_MS = 4000

describe("AutoBackup", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("does nothing when no sync secret is configured", async () => {
    render(<AutoBackup />)

    setStoredJournal({ entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }] })
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    expect(pushSnapshot).not.toHaveBeenCalled()
  })

  it("pushes a full snapshot after the debounce once a secret is configured", async () => {
    setSyncSecret("my-secret")
    vi.mocked(pushSnapshot).mockResolvedValue({ ok: true, summary: "ok" })
    render(<AutoBackup />)

    setStoredFinance({ ...DEFAULT_FINANCE_STATE, goldStores: [{ name: "SJC", price: "935.000" }] })
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    expect(pushSnapshot).toHaveBeenCalledTimes(1)
    expect(pushSnapshot).toHaveBeenCalledWith(
      "my-secret",
      expect.objectContaining({
        version: EXPORT_VERSION,
        journal: DEFAULT_JOURNAL_STATE,
        finance: expect.objectContaining({ goldStores: [{ name: "SJC", price: "935.000" }] }),
      })
    )
  })

  it("includes the budget state in the pushed snapshot", async () => {
    setSyncSecret("my-secret")
    vi.mocked(pushSnapshot).mockResolvedValue({ ok: true, summary: "ok" })
    render(<AutoBackup />)

    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-09", amount: 20_000_000 }],
    })
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    expect(pushSnapshot).toHaveBeenCalledWith(
      "my-secret",
      expect.objectContaining({
        budget: expect.objectContaining({ salaries: [{ month: "2026-09", amount: 20_000_000 }] }),
      })
    )
  })

  it("coalesces several rapid changes into a single push", async () => {
    setSyncSecret("my-secret")
    vi.mocked(pushSnapshot).mockResolvedValue({ ok: true, summary: "ok" })
    render(<AutoBackup />)

    setStoredJournal({ entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 1, mood: null }] })
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2)
    setStoredJournal({ entries: [{ id: 2, text: "Bài 2", time: "10:00", date: "10/08", words: 1, mood: null }] })
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    expect(pushSnapshot).toHaveBeenCalledTimes(1)
  })

  it("records the error and keeps the previous lastSyncedAt when the push fails", async () => {
    setSyncSecret("my-secret")
    vi.mocked(pushSnapshot).mockResolvedValue({ ok: false, error: "Sai secret đồng bộ." })
    render(<AutoBackup />)

    setStoredJournal({ entries: [] })
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    expect(getAutoBackupStatus()).toEqual({ lastSyncedAt: null, lastError: "Sai secret đồng bộ." })
  })

  it("records lastSyncedAt and clears lastError when the push succeeds", async () => {
    setSyncSecret("my-secret")
    vi.mocked(pushSnapshot).mockResolvedValue({ ok: true, summary: "ok" })
    render(<AutoBackup />)

    setStoredJournal({ entries: [] })
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)

    const status = getAutoBackupStatus()
    expect(status.lastError).toBeNull()
    expect(status.lastSyncedAt).not.toBeNull()
  })
})
