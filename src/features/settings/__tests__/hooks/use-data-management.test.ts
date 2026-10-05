import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { DEFAULT_FINANCE_STATE, FINANCE_STORAGE_KEY, setStoredFinance } from "@/features/finance/finance-storage"
import {
  DEFAULT_JOURNAL_STATE,
  JOURNAL_STORAGE_KEY,
  getStoredJournal,
  setStoredJournal,
} from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE, STUDY_STORAGE_KEY } from "@/features/study/study-storage"
import { BUDGET_STORAGE_KEY, DEFAULT_BUDGET_STATE } from "@/features/budget/budget-storage"
import { DEFAULT_NET_WORTH_HISTORY, NET_WORTH_HISTORY_KEY } from "@/features/overview/net-worth-history-storage"
import { onDataChanged } from "@/lib/data-change-bus"
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "@/lib/settings-storage"
import { CAR_GOAL_FUND_KEY, getCarGoalFundName, setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { EXPORT_VERSION } from "../../data-transfer"
import { useDataManagement } from "../../hooks/use-data-management"

vi.mock("../../api", () => ({
  pushSnapshot: vi.fn(),
  pullSnapshot: vi.fn(),
}))

import { pushSnapshot, pullSnapshot } from "../../api"

const WRITE_FAILED =
  "Không ghi được dữ liệu vào máy (bộ nhớ trình duyệt có thể đã đầy). Dữ liệu trên máy vẫn giữ nguyên như trước."

const LOCAL_JOURNAL = {
  entries: [{ id: 9, text: "Bài trên máy", time: "08:00", date: "01/08", words: 3, mood: null }],
}

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

type DataManagementResult = ReturnType<typeof renderDataManagement>["result"]

// Nạp bản sao giờ gồm 2 bước: đọc + parse (xếp vào pendingRestore), rồi người dùng xác nhận.
async function importAndConfirm(result: DataManagementResult, file: File) {
  await act(async () => {
    await result.current.importData(file)
  })
  act(() => {
    result.current.confirmRestore()
  })
}

async function pullAndConfirm(result: DataManagementResult, secret: string) {
  await act(async () => {
    await result.current.pullFromCloud(secret)
  })
  act(() => {
    result.current.confirmRestore()
  })
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

  it("importData stages a valid backup and replaces nothing until confirmRestore", async () => {
    setStoredJournal(LOCAL_JOURNAL)
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
      exportedAt: "2026-09-20T02:00:00.000Z",
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

    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(result.current.imported).toBeNull()
    expect(result.current.pendingRestore).toMatchObject({
      source: "file",
      fileName: "backup.json",
      exportedAt: "2026-09-20T02:00:00.000Z",
      incomingCounts: "1 bài nhật ký · 0 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
      localCounts: "1 bài nhật ký · 0 khoản chi · 0 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
    })

    act(() => {
      result.current.confirmRestore()
    })

    expect(onReplaceJournal).toHaveBeenCalledWith(journal)
    expect(onReplaceFinance).toHaveBeenCalledWith(finance)
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
    expect(onReplaceSettings).toHaveBeenCalledWith(settings)
    expect(onReplaceBudget).toHaveBeenCalledWith(budget)
    expect(onReplaceNetWorthHistory).toHaveBeenCalledWith(netWorthHistory)
    expect(result.current.pendingRestore).toBeNull()
    expect(result.current.imported).toEqual({
      ok: true,
      file: "backup.json",
      summary: expect.stringContaining("bài nhật ký"),
    })
  })

  it("cancelRestore drops the staged backup without writing anything", async () => {
    const { result, onReplaceJournal } = renderDataManagement()
    const file = new File([JSON.stringify({ version: EXPORT_VERSION })], "backup.json", { type: "application/json" })

    await act(async () => {
      await result.current.importData(file)
    })
    act(() => {
      result.current.cancelRestore()
    })

    expect(result.current.pendingRestore).toBeNull()
    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(result.current.imported).toBeNull()
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

  it("pullFromCloud stages the cloud snapshot; confirmRestore applies it and reports the summary", async () => {
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
      exportedAt: "2026-09-20T02:00:00.000Z",
    })

    await act(async () => {
      await result.current.pullFromCloud("my-secret")
    })

    expect(pullSnapshot).toHaveBeenCalledWith("my-secret")
    expect(onReplaceJournal).not.toHaveBeenCalled()
    expect(result.current.syncing).toBe(false)
    expect(result.current.pendingRestore).toMatchObject({ source: "cloud", exportedAt: "2026-09-20T02:00:00.000Z" })

    act(() => {
      result.current.confirmRestore()
    })

    expect(onReplaceJournal).toHaveBeenCalledWith(journal)
    expect(onReplaceFinance).toHaveBeenCalledWith(DEFAULT_FINANCE_STATE)
    expect(onReplaceStudy).toHaveBeenCalledWith(DEFAULT_STUDY_STATE)
    expect(onReplaceSettings).toHaveBeenCalledWith(DEFAULT_SETTINGS)
    expect(onReplaceBudget).toHaveBeenCalledWith(budget)
    expect(onReplaceNetWorthHistory).toHaveBeenCalledWith(netWorthHistory)
    expect(result.current.syncResult).toEqual({ ok: true, summary: "5 bài nhật ký" })
  })

  it("writes nothing when the settings page is left before the cloud answers", async () => {
    let resolvePull!: (value: Awaited<ReturnType<typeof pullSnapshot>>) => void
    vi.mocked(pullSnapshot).mockReturnValue(new Promise((resolve) => (resolvePull = resolve)))
    const onReplaceJournal = vi.fn()
    const { result, unmount } = renderHook(() =>
      useDataManagement({
        onReplaceJournal,
        onReplaceFinance: vi.fn(),
        onReplaceStudy: vi.fn(),
        onReplaceSettings: vi.fn(),
        onReplaceBudget: vi.fn(),
        onReplaceNetWorthHistory: vi.fn(),
      })
    )

    let pending!: Promise<void>
    act(() => {
      pending = result.current.pullFromCloud("my-secret")
    })
    unmount()
    await act(async () => {
      resolvePull({
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
        exportedAt: null,
      })
      await pending
    })

    expect(onReplaceJournal).not.toHaveBeenCalled()
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

  it("importData reports an error instead of rejecting when the file cannot be read", async () => {
    const { result, onReplaceJournal } = renderDataManagement()
    const file = new File(["{}"], "backup.json", { type: "application/json" })
    Object.defineProperty(file, "text", { value: () => Promise.reject(new Error("NotReadableError")) })

    await act(async () => {
      await result.current.importData(file)
    })

    expect(result.current.imported).toEqual({ ok: false, error: "Không đọc được nội dung file." })
    expect(onReplaceJournal).not.toHaveBeenCalled()
  })

  it("importData puts every section back and reports an error when a write fails half-way through", async () => {
    setStoredJournal(LOCAL_JOURNAL)
    const { result, onReplaceJournal, onReplaceFinance, onReplaceStudy } = renderDataManagement()
    // Journal rồi finance ghi thật xuống storage, sau đó finance ném lỗi như khi localStorage hết dung
    // lượng giữa chừng. finance-data trước đó chưa có nên phải bị gỡ lại, không để lại bản dở dang.
    onReplaceJournal.mockImplementation((journal) => setStoredJournal(journal))
    onReplaceFinance.mockImplementation((finance) => {
      setStoredFinance(finance)
      throw new Error("QuotaExceededError")
    })
    const payload = {
      version: EXPORT_VERSION,
      journal: { entries: [{ id: 1, text: "Bài từ file", time: "09:00", date: "10/08", words: 3, mood: null }] },
    }
    const file = new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })

    await importAndConfirm(result, file)

    expect(getStoredJournal()).toEqual(LOCAL_JOURNAL)
    expect(window.localStorage.getItem(FINANCE_STORAGE_KEY)).toBeNull()
    expect(onReplaceStudy).not.toHaveBeenCalled()
    expect(result.current.imported).toEqual({ ok: false, error: WRITE_FAILED })
  })

  it("pullFromCloud clears 'syncing' and reports an error even when the request itself throws", async () => {
    const { result } = renderDataManagement()
    vi.mocked(pullSnapshot).mockRejectedValue(new Error("boom"))

    await act(async () => {
      await result.current.pullFromCloud("my-secret")
    })

    expect(result.current.syncing).toBe(false)
    expect(result.current.syncResult).toEqual({ ok: false, error: "Không kết nối được máy chủ đồng bộ." })
  })

  it("pullFromCloud puts every section back, reports an error and stops syncing when a write fails half-way through", async () => {
    setStoredJournal(LOCAL_JOURNAL)
    const { result, onReplaceJournal, onReplaceFinance } = renderDataManagement()
    onReplaceJournal.mockImplementation((journal) => setStoredJournal(journal))
    onReplaceFinance.mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    vi.mocked(pullSnapshot).mockResolvedValue({
      ok: true,
      data: {
        journal: { entries: [{ id: 1, text: "Bài từ cloud", time: "09:00", date: "10/08", words: 3, mood: null }] },
        finance: DEFAULT_FINANCE_STATE,
        study: DEFAULT_STUDY_STATE,
        settings: DEFAULT_SETTINGS,
        budget: DEFAULT_BUDGET_STATE,
        netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
      },
      summary: "1 bài nhật ký",
      exportedAt: null,
    })

    await pullAndConfirm(result, "my-secret")

    expect(getStoredJournal()).toEqual(LOCAL_JOURNAL)
    expect(result.current.syncResult).toEqual({ ok: false, error: WRITE_FAILED })
    expect(result.current.syncing).toBe(false)
  })

  it("confirmRestore puts every written key back byte-for-byte and notifies once when a write fails half-way through", async () => {
    // Chuỗi thô cố ý lệch khỏi JSON.stringify(JSON.parse(raw)): khôi phục bằng cách serialize lại thay
    // vì trả đúng chuỗi cũ sẽ không còn khớp. Budget cố ý để trống — sau khi khôi phục nó phải bị gỡ.
    const seeds: Record<string, string> = {
      [JOURNAL_STORAGE_KEY]: '{ "seed" :  "journal" }',
      [FINANCE_STORAGE_KEY]: '{ "seed" :  "finance" }',
      [STUDY_STORAGE_KEY]: '{ "seed" :  "study" }',
      [SETTINGS_STORAGE_KEY]: '{ "seed" :  "settings" }',
      [NET_WORTH_HISTORY_KEY]: '{ "seed" :  "net-worth" }',
      [CAR_GOAL_FUND_KEY]: "Quỹ mua xe",
    }
    for (const [key, raw] of Object.entries(seeds)) window.localStorage.setItem(key, raw)
    const watchedKeys = [...Object.keys(seeds), BUDGET_STORAGE_KEY]

    const {
      result,
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
    } = renderDataManagement()
    // Mỗi onReplace* ghi thẳng 1 chuỗi khác vào key của nó (không qua setStored* nên không notify);
    // net-worth ghi xong mới lỗi, như localStorage hết dung lượng ở lần ghi cuối.
    const writeOther = (key: string) => () => window.localStorage.setItem(key, `{"written":"${key}"}`)
    onReplaceJournal.mockImplementation(writeOther(JOURNAL_STORAGE_KEY))
    onReplaceFinance.mockImplementation(writeOther(FINANCE_STORAGE_KEY))
    onReplaceStudy.mockImplementation(writeOther(STUDY_STORAGE_KEY))
    onReplaceSettings.mockImplementation(writeOther(SETTINGS_STORAGE_KEY))
    onReplaceBudget.mockImplementation(writeOther(BUDGET_STORAGE_KEY))
    onReplaceNetWorthHistory.mockImplementation(() => {
      writeOther(NET_WORTH_HISTORY_KEY)()
      throw new Error("QuotaExceededError")
    })
    const file = new File([JSON.stringify({ version: EXPORT_VERSION })], "backup.json", { type: "application/json" })

    // Nghe từ trước bước xếp hàng: nếu chỉ chọn file (chưa xác nhận) mà đã notify thì listener bị gọi 2 lần.
    const seenByListener: Array<Record<string, string | null>> = []
    const listener = vi.fn(() => {
      seenByListener.push(Object.fromEntries(watchedKeys.map((key) => [key, window.localStorage.getItem(key)])))
    })
    const unsubscribe = onDataChanged(listener)
    try {
      await importAndConfirm(result, file)
    } finally {
      unsubscribe()
    }

    for (const [key, raw] of Object.entries(seeds)) {
      expect(window.localStorage.getItem(key), key).toBe(raw)
    }
    expect(window.localStorage.getItem(BUDGET_STORAGE_KEY)).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)
    // Listener chạy khi storage đã trả về hết, không phải lúc còn dở dang.
    expect(seenByListener[0]).toEqual({ ...seeds, [BUDGET_STORAGE_KEY]: null })
    expect(result.current.imported).toEqual({ ok: false, error: WRITE_FAILED })
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

      await importAndConfirm(result, backupFile({ goals: { carFundName: "Quỹ mua xe" } }))

      expect(getCarGoalFundName()).toBe("Quỹ mua xe")
    })

    it("importData clears the link when the backup explicitly has no fund chosen", async () => {
      setCarGoalFundName("Quỹ cũ")
      const { result } = renderDataManagement()

      await importAndConfirm(result, backupFile({ goals: { carFundName: null } }))

      expect(getCarGoalFundName()).toBeNull()
    })

    it("importData keeps this device's link when the backup predates the goals section", async () => {
      setCarGoalFundName("Quỹ mua xe")
      const { result } = renderDataManagement()

      await importAndConfirm(result, backupFile({}))

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
        exportedAt: null,
      })
      const { result } = renderDataManagement()

      await pullAndConfirm(result, "my-secret")

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
        exportedAt: null,
      })
      const { result } = renderDataManagement()

      await pullAndConfirm(result, "my-secret")

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
        exportedAt: null,
      })
      const { result } = renderDataManagement()

      await pullAndConfirm(result, "my-secret")

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
