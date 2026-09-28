import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { DEFAULT_FINANCE_STATE, setStoredFinance } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, setStoredJournal } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE } from "@/features/study/study-storage"
import { DEFAULT_BUDGET_STATE } from "@/features/budget/budget-storage"
import { DEFAULT_NET_WORTH_HISTORY } from "@/features/overview/net-worth-history-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings-storage"
import { getCarGoalFundName, setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { EXPORT_VERSION } from "../../data-transfer"
import { useDataManagement } from "../../hooks/use-data-management"

vi.mock("../../api", () => ({
  pushSnapshot: vi.fn(),
  pullSnapshot: vi.fn(),
}))

import { pushSnapshot, pullSnapshot } from "../../api"

function renderDataManagement() {
  const onReplaceJournal = vi.fn()
  const onReplaceFinance = vi.fn()
  const onReplaceStudy = vi.fn()
  const onReplaceSettings = vi.fn()
  const onReplaceBudget = vi.fn()
  const onReplaceNetWorthHistory = vi.fn()
  const { result } = renderHook(() =>
    useDataManagement({
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
    })
  )
  return {
    result,
    onReplaceJournal,
    onReplaceFinance,
    onReplaceStudy,
    onReplaceSettings,
    onReplaceBudget,
    onReplaceNetWorthHistory,
  }
}

describe("useDataManagement", () => {
  beforeEach(() => {
    window.localStorage.clear()
    URL.createObjectURL = vi.fn(() => "blob:mock")
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
  })

  it("exportData builds a snapshot of every feature's storage and reports the file info", () => {
    setStoredJournal({
      entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }],
    })
    const { result } = renderDataManagement()

    act(() => {
      result.current.exportData()
    })

    expect(result.current.exported?.file).toMatch(/^orange-banana-\d{4}-\d{2}-\d{2}\.json$/)
    expect(result.current.exported?.size).toMatch(/KB$/)
    expect(result.current.imported).toBeNull()
  })

  it("importData reports the restored data to each domain's replace callback", async () => {
    const {
      result,
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
    } = renderDataManagement()

    const journal = {
      entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }],
    }
    const finance = { ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 1, target: 2 }] }
    const settings = { ...DEFAULT_SETTINGS, profile: { ...DEFAULT_SETTINGS.profile, displayName: "Khôi phục" } }
    const budget = { ...DEFAULT_BUDGET_STATE, salaries: [{ month: "2026-09", amount: 20_000_000 }] }
    const netWorthHistory = [{ date: "2026-09-01", net: 1_000_000, savingsTotal: 500_000 }]
    const payload = {
      version: EXPORT_VERSION,
      journal,
      finance,
      study: DEFAULT_STUDY_STATE,
      settings,
      budget,
      netWorthHistory,
    }
    const file = new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })

    await act(async () => {
      await result.current.importData(file)
    })

    expect(onReplaceJournal).toHaveBeenCalledWith(journal)
    expect(onReplaceFinance).toHaveBeenCalledWith(finance)
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
    expect(onReplaceSettings).toHaveBeenCalledWith(settings)
    expect(onReplaceBudget).toHaveBeenCalledWith(budget)
    expect(onReplaceNetWorthHistory).toHaveBeenCalledWith(netWorthHistory)
    expect(result.current.imported).toEqual({
      ok: true,
      file: "backup.json",
      summary: expect.stringContaining("bài nhật ký"),
    })
  })

  it("importData reports an error and calls no replace callback when the file is invalid", async () => {
    const {
      result,
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
    } = renderDataManagement()

    const file = new File(["not json"], "bad.json", { type: "application/json" })
    await act(async () => {
      await result.current.importData(file)
    })

    expect(result.current.imported).toEqual({ ok: false, error: "File không phải JSON hợp lệ." })
    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(onReplaceFinance).not.toHaveBeenCalled()
    expect(onReplaceStudy).not.toHaveBeenCalled()
    expect(onReplaceSettings).not.toHaveBeenCalled()
    expect(onReplaceBudget).not.toHaveBeenCalled()
    expect(onReplaceNetWorthHistory).not.toHaveBeenCalled()
  })

  it("wipeData replaces journal/finance/study/budget/net-worth-history with empty defaults but keeps the gold stores", () => {
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, goldStores: [{ name: "SJC", price: "935.000" }] })
    const { result, onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceBudget, onReplaceNetWorthHistory } =
      renderDataManagement()

    act(() => {
      result.current.wipeData()
    })

    expect(onReplaceJournal).toHaveBeenCalledWith(DEFAULT_JOURNAL_STATE)
    expect(onReplaceFinance).toHaveBeenCalledWith({
      savings: [],
      cards: [],
      gold: [],
      invests: [],
      goldStores: [{ name: "SJC", price: "935.000" }],
    })
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
    expect(onReplaceBudget).toHaveBeenCalledWith(DEFAULT_BUDGET_STATE)
    expect(onReplaceNetWorthHistory).toHaveBeenCalledWith(DEFAULT_NET_WORTH_HISTORY)
  })

  it("pushToCloud sends a snapshot of every feature's storage and reports the result", async () => {
    setStoredJournal({
      entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }],
    })
    vi.mocked(pushSnapshot).mockResolvedValue({ ok: true, summary: "Đã tải lên" })
    const { result } = renderDataManagement()

    await act(async () => {
      await result.current.pushToCloud("my-secret")
    })

    expect(pushSnapshot).toHaveBeenCalledWith(
      "my-secret",
      expect.objectContaining({
        version: EXPORT_VERSION,
        journal: expect.objectContaining({ entries: expect.arrayContaining([expect.objectContaining({ text: "Bài 1" })]) }),
        finance: DEFAULT_FINANCE_STATE,
        study: DEFAULT_STUDY_STATE,
        settings: DEFAULT_SETTINGS,
        budget: DEFAULT_BUDGET_STATE,
        netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
        goals: { carFundName: null },
      })
    )
    expect(result.current.syncResult).toEqual({ ok: true, summary: "Đã tải lên" })
    expect(result.current.syncing).toBe(false)
  })

  it("pullFromCloud reports the restored data to each domain's replace callback", async () => {
    const {
      result,
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
    } = renderDataManagement()

    const journal = {
      entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }],
    }
    const budget = { ...DEFAULT_BUDGET_STATE, salaries: [{ month: "2026-09", amount: 20_000_000 }] }
    const netWorthHistory = [{ date: "2026-09-01", net: 1_000_000, savingsTotal: 500_000 }]
    vi.mocked(pullSnapshot).mockResolvedValue({
      ok: true,
      data: {
        journal,
        finance: DEFAULT_FINANCE_STATE,
        study: DEFAULT_STUDY_STATE,
        settings: DEFAULT_SETTINGS,
        budget,
        netWorthHistory,
      },
      summary: "5 bài nhật ký",
    })

    await act(async () => {
      await result.current.pullFromCloud("my-secret")
    })

    expect(pullSnapshot).toHaveBeenCalledWith("my-secret")
    expect(onReplaceJournal).toHaveBeenCalledWith(journal)
    expect(onReplaceFinance).toHaveBeenCalledWith(DEFAULT_FINANCE_STATE)
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
    expect(onReplaceSettings).toHaveBeenCalledWith(DEFAULT_SETTINGS)
    expect(onReplaceBudget).toHaveBeenCalledWith(budget)
    expect(onReplaceNetWorthHistory).toHaveBeenCalledWith(netWorthHistory)
    expect(result.current.syncResult).toEqual({ ok: true, summary: "5 bài nhật ký" })
  })

  it("pullFromCloud reports an error and calls no replace callback when it fails", async () => {
    const {
      result,
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
    } = renderDataManagement()
    vi.mocked(pullSnapshot).mockResolvedValue({ ok: false, error: "Sai secret đồng bộ." })

    await act(async () => {
      await result.current.pullFromCloud("wrong-secret")
    })

    expect(result.current.syncResult).toEqual({ ok: false, error: "Sai secret đồng bộ." })
    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(onReplaceFinance).not.toHaveBeenCalled()
    expect(onReplaceStudy).not.toHaveBeenCalled()
    expect(onReplaceSettings).not.toHaveBeenCalled()
    expect(onReplaceBudget).not.toHaveBeenCalled()
    expect(onReplaceNetWorthHistory).not.toHaveBeenCalled()
  })
  describe("car-goal fund link", () => {
    function backupFile(extra: Record<string, unknown>) {
      return new File([JSON.stringify({ version: EXPORT_VERSION, ...extra })], "backup.json", { type: "application/json" })
    }

    it("exportData writes the current car-goal link into the exported file", async () => {
      setCarGoalFundName("Quỹ mua xe")
      const { result } = renderDataManagement()

      act(() => {
        result.current.exportData()
      })

      const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsText(blob)
      })
      const exported = JSON.parse(text)
      expect(exported.goals).toEqual({ carFundName: "Quỹ mua xe" })
    })

    it("pushToCloud sends the current car-goal link", async () => {
      setCarGoalFundName("Quỹ mua xe")
      vi.mocked(pushSnapshot).mockResolvedValue({ ok: true, summary: "ok" })
      const { result } = renderDataManagement()

      await act(async () => {
        await result.current.pushToCloud("my-secret")
      })

      expect(pushSnapshot).toHaveBeenCalledWith("my-secret", expect.objectContaining({ goals: { carFundName: "Quỹ mua xe" } }))
    })

    it("importData restores the link from a backup that has a goals section", async () => {
      setCarGoalFundName("Quỹ cũ")
      const { result } = renderDataManagement()

      await act(async () => {
        await result.current.importData(backupFile({ goals: { carFundName: "Quỹ mua xe" } }))
      })

      expect(getCarGoalFundName()).toBe("Quỹ mua xe")
    })

    it("importData clears the link when the backup explicitly has no fund chosen", async () => {
      setCarGoalFundName("Quỹ cũ")
      const { result } = renderDataManagement()

      await act(async () => {
        await result.current.importData(backupFile({ goals: { carFundName: null } }))
      })

      expect(getCarGoalFundName()).toBeNull()
    })

    it("importData keeps this device's link when the backup predates the goals section", async () => {
      setCarGoalFundName("Quỹ mua xe")
      const { result } = renderDataManagement()

      await act(async () => {
        await result.current.importData(backupFile({}))
      })

      expect(getCarGoalFundName()).toBe("Quỹ mua xe")
    })

    it("pullFromCloud restores the link from the cloud snapshot", async () => {
      setCarGoalFundName("Quỹ cũ")
      vi.mocked(pullSnapshot).mockResolvedValue({
        ok: true,
        data: {
          journal: DEFAULT_JOURNAL_STATE,
          finance: DEFAULT_FINANCE_STATE,
          study: DEFAULT_STUDY_STATE,
          settings: DEFAULT_SETTINGS,
          budget: DEFAULT_BUDGET_STATE,
          netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
          goals: { carFundName: "Quỹ mua xe" },
        },
        summary: "ok",
      })
      const { result } = renderDataManagement()

      await act(async () => {
        await result.current.pullFromCloud("my-secret")
      })

      expect(getCarGoalFundName()).toBe("Quỹ mua xe")
    })

    it("pullFromCloud clears the link when the cloud snapshot explicitly has no fund chosen", async () => {
      setCarGoalFundName("Quỹ cũ")
      vi.mocked(pullSnapshot).mockResolvedValue({
        ok: true,
        data: {
          journal: DEFAULT_JOURNAL_STATE,
          finance: DEFAULT_FINANCE_STATE,
          study: DEFAULT_STUDY_STATE,
          settings: DEFAULT_SETTINGS,
          budget: DEFAULT_BUDGET_STATE,
          netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
          goals: { carFundName: null },
        },
        summary: "ok",
      })
      const { result } = renderDataManagement()

      await act(async () => {
        await result.current.pullFromCloud("my-secret")
      })

      expect(getCarGoalFundName()).toBeNull()
    })

    it("pullFromCloud keeps this device's link when the cloud snapshot predates the goals section", async () => {
      setCarGoalFundName("Quỹ mua xe")
      vi.mocked(pullSnapshot).mockResolvedValue({
        ok: true,
        data: {
          journal: DEFAULT_JOURNAL_STATE,
          finance: DEFAULT_FINANCE_STATE,
          study: DEFAULT_STUDY_STATE,
          settings: DEFAULT_SETTINGS,
          budget: DEFAULT_BUDGET_STATE,
          netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
        },
        summary: "ok",
      })
      const { result } = renderDataManagement()

      await act(async () => {
        await result.current.pullFromCloud("my-secret")
      })

      expect(getCarGoalFundName()).toBe("Quỹ mua xe")
    })

    it("pullFromCloud leaves the link untouched when the pull fails", async () => {
      setCarGoalFundName("Quỹ mua xe")
      vi.mocked(pullSnapshot).mockResolvedValue({ ok: false, error: "Sai secret đồng bộ." })
      const { result } = renderDataManagement()

      await act(async () => {
        await result.current.pullFromCloud("wrong-secret")
      })

      expect(getCarGoalFundName()).toBe("Quỹ mua xe")
    })

    it("wipeData removes the link along with the savings funds it pointed to", () => {
      setCarGoalFundName("Quỹ mua xe")
      const { result } = renderDataManagement()

      act(() => {
        result.current.wipeData()
      })

      expect(getCarGoalFundName()).toBeNull()
    })
  })
})
