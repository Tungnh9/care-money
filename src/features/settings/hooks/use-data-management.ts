"use client"

import { useCallback, useState } from "react"

import { FINANCE_STORAGE_KEY, getStoredFinance, type FinanceState } from "@/features/finance/finance-storage"
import {
  DEFAULT_JOURNAL_STATE,
  JOURNAL_STORAGE_KEY,
  getStoredJournal,
  type JournalState,
} from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE, STUDY_STORAGE_KEY, getStoredStudy, type StudyState } from "@/features/study/study-storage"
import { BUDGET_STORAGE_KEY, DEFAULT_BUDGET_STATE, getStoredBudget, type BudgetState } from "@/features/budget/budget-storage"
import {
  DEFAULT_NET_WORTH_HISTORY,
  NET_WORTH_HISTORY_KEY,
  getStoredNetWorthHistory,
  type NetWorthHistory,
} from "@/features/overview/net-worth-history-storage"
import { CAR_GOAL_FUND_KEY, getCarGoalFundName, setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { notifyDataChanged } from "@/lib/data-change-bus"
import { SETTINGS_STORAGE_KEY, getStoredSettings, type AppSettings } from "@/lib/settings-storage"
import { clearSyncSecret } from "@/lib/sync-secret-storage"
import { pushSnapshot, pullSnapshot } from "../api"
import {
  buildExportPayload,
  exportFileName,
  parseImportPayload,
  restoreCounts,
  type ExportSnapshot,
  type ImportedSnapshot,
} from "../data-transfer"

interface ExportedInfo {
  file: string
  size: string
  time: string
}

type ImportedInfo = { ok: true; file: string; summary: string } | { ok: false; error: string }
type SyncResult = { ok: true; summary: string } | { ok: false; error: string }

// Bản sao đã đọc + parse xong nhưng CHƯA ghi gì xuống máy — chờ người dùng xác nhận ở hộp thoại
// (DataCard), vì nạp là thay TOÀN BỘ dữ liệu trên máy và không hoàn tác được.
type PendingRestore = {
  data: ImportedSnapshot
  summary: string
  exportedAt: string | null
  incomingCounts: string
  localCounts: string
} & ({ source: "file"; fileName: string } | { source: "cloud" })

interface UseDataManagementOptions {
  onReplaceJournal: (journal: JournalState) => void
  onReplaceFinance: (finance: FinanceState) => void
  onReplaceStudy: (study: StudyState) => void
  onReplaceSettings: (settings: AppSettings) => void
  onReplaceBudget: (budget: BudgetState) => void
  onReplaceNetWorthHistory: (history: NetWorthHistory) => void
}

// Mọi key mà 1 lần nạp bản sao ghi đè — chụp lại chuỗi thô trước khi ghi để trả về nguyên trạng
// nếu 1 lần ghi giữa chừng lỗi (vd. hết dung lượng localStorage), thay vì để máy nửa cũ nửa mới.
// Thêm 1 lần ghi mới vào applySnapshot thì thêm key của nó vào đây.
const RESTORE_KEYS = [
  JOURNAL_STORAGE_KEY,
  FINANCE_STORAGE_KEY,
  STUDY_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  BUDGET_STORAGE_KEY,
  NET_WORTH_HISTORY_KEY,
  CAR_GOAL_FUND_KEY,
]

const RESTORE_WRITE_ERROR =
  "Không ghi được dữ liệu vào máy (bộ nhớ trình duyệt có thể đã đầy). Dữ liệu trên máy vẫn giữ nguyên như trước."

function readRawBackup(): Map<string, string | null> {
  const backup = new Map<string, string | null>()
  for (const key of RESTORE_KEYS) {
    try {
      backup.set(key, window.localStorage.getItem(key))
    } catch {
      // Không đọc được key này thì cũng không ghi đè lại nó lúc khôi phục.
    }
  }
  return backup
}

// Trả từng key về đúng chuỗi thô trước khi nạp, rồi báo 1 lần để mọi hook đang mở đọc lại storage
// (Plan 1a) — kể cả những phần đã kịp setState bản mới trước khi lần ghi kế tiếp lỗi.
function restoreRawBackup(backup: Map<string, string | null>) {
  backup.forEach((raw, key) => {
    try {
      if (raw === null) window.localStorage.removeItem(key)
      else window.localStorage.setItem(key, raw)
    } catch {
      // Ghi lại bản cũ cũng lỗi thì không còn cách nào khác — để nguyên key đó.
    }
  })
  notifyDataChanged()
}

function readLocalSnapshot(): ExportSnapshot {
  return {
    journal: getStoredJournal(),
    finance: getStoredFinance(),
    study: getStoredStudy(),
    settings: getStoredSettings(),
    budget: getStoredBudget(),
    netWorthHistory: getStoredNetWorthHistory(),
    goals: { carFundName: getCarGoalFundName() },
  }
}

function describeRestore(data: ImportedSnapshot, summary: string, exportedAt: string | null) {
  return {
    data,
    summary,
    exportedAt,
    incomingCounts: restoreCounts(data),
    localCounts: restoreCounts(readLocalSnapshot()),
  }
}

function useDataManagement({
  onReplaceJournal,
  onReplaceFinance,
  onReplaceStudy,
  onReplaceSettings,
  onReplaceBudget,
  onReplaceNetWorthHistory,
}: UseDataManagementOptions) {
  const [exported, setExported] = useState<ExportedInfo | null>(null)
  const [imported, setImported] = useState<ImportedInfo | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null)

  const applySnapshot = useCallback(
    (data: ImportedSnapshot) => {
      const backup = readRawBackup()
      try {
        onReplaceJournal(data.journal)
        onReplaceFinance(data.finance)
        onReplaceStudy(data.study)
        onReplaceSettings(data.settings)
        onReplaceBudget(data.budget)
        onReplaceNetWorthHistory(data.netWorthHistory)
        if (data.goals) setCarGoalFundName(data.goals.carFundName)
      } catch (error) {
        restoreRawBackup(backup)
        throw error
      }
    },
    [onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceSettings, onReplaceBudget, onReplaceNetWorthHistory]
  )

  const pushToCloud = useCallback(async (secret: string) => {
    setSyncing(true)
    const payload = buildExportPayload(readLocalSnapshot(), new Date().toISOString())
    const result = await pushSnapshot(secret, payload)
    setSyncResult(result)
    setSyncing(false)
  }, [])

  const pullFromCloud = useCallback(async (secret: string) => {
    setSyncing(true)
    // Banner của lần đồng bộ trước phải biến mất ngay khi lần kéo mới bắt đầu — không còn trong lúc
    // "Đang đồng bộ…", dưới hộp thoại xác nhận, hay sau khi bấm "Huỷ" (chưa ghi gì). Lỗi mới tự ghi đè
    // ở nhánh lỗi.
    setSyncResult(null)
    try {
      const result = await pullSnapshot(secret)
      if (result.ok) {
        // Chỉ xếp hàng chờ xác nhận — ghi thật ở confirmRestore. Kết quả về sau khi đã rời Cài đặt
        // vì thế không ghi gì (component đã unmount, không còn ai xác nhận).
        setPendingRestore({ ...describeRestore(result.data, result.summary, result.exportedAt), source: "cloud" })
      } else {
        setSyncResult({ ok: false, error: result.error })
      }
    } catch {
      setSyncResult({ ok: false, error: "Không kết nối được máy chủ đồng bộ." })
    } finally {
      setSyncing(false)
    }
  }, [])

  const exportData = useCallback(() => {
    const now = new Date()
    const payload = buildExportPayload(readLocalSnapshot(), now.toISOString())
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const name = exportFileName(payload.exportedAt)
    const link = document.createElement("a")
    link.href = url
    link.download = name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    setExported({
      file: name,
      size: `${(blob.size / 1024).toFixed(1).replace(".", ",")} KB`,
      time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    })
    setImported(null)
  }, [])

  const importData = useCallback(async (file: File) => {
    setExported(null)
    // Như pullFromCloud: banner của lần nạp trước phải biến mất ngay khi chọn file mới — không còn dưới
    // hộp thoại xác nhận hay sau khi bấm "Huỷ" (chưa ghi gì). Lỗi mới tự ghi đè ở các nhánh lỗi bên dưới.
    setImported(null)
    const raw = await file.text().catch(() => null)
    if (raw === null) {
      setImported({ ok: false, error: "Không đọc được nội dung file." })
      return
    }
    const result = parseImportPayload(raw)
    if (!result.ok) {
      setImported({ ok: false, error: result.error })
      return
    }
    setPendingRestore({
      ...describeRestore(result.data, result.summary, result.exportedAt),
      source: "file",
      fileName: file.name,
    })
  }, [])

  const confirmRestore = useCallback(() => {
    if (!pendingRestore) return
    const pending = pendingRestore
    setPendingRestore(null)
    try {
      applySnapshot(pending.data)
    } catch {
      if (pending.source === "cloud") setSyncResult({ ok: false, error: RESTORE_WRITE_ERROR })
      else setImported({ ok: false, error: RESTORE_WRITE_ERROR })
      return
    }
    if (pending.source === "cloud") setSyncResult({ ok: true, summary: pending.summary })
    else setImported({ ok: true, file: pending.fileName, summary: pending.summary })
  }, [pendingRestore, applySnapshot])

  const cancelRestore = useCallback(() => setPendingRestore(null), [])

  const wipeData = useCallback(() => {
    const { goldStores } = getStoredFinance()
    onReplaceJournal(DEFAULT_JOURNAL_STATE)
    onReplaceFinance({ savings: [], cards: [], gold: [], invests: [], goldStores })
    onReplaceStudy(DEFAULT_STUDY_STATE)
    onReplaceBudget(DEFAULT_BUDGET_STATE)
    onReplaceNetWorthHistory(DEFAULT_NET_WORTH_HISTORY)
    setCarGoalFundName(null)
    // "Làm lại từ đầu" trên máy này — không giữ lại credential đồng bộ.
    clearSyncSecret()
    setExported(null)
    setImported(null)
  }, [onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceBudget, onReplaceNetWorthHistory])

  return {
    exported,
    imported,
    exportData,
    importData,
    wipeData,
    syncing,
    syncResult,
    pushToCloud,
    pullFromCloud,
    pendingRestore,
    confirmRestore,
    cancelRestore,
  }
}

export { useDataManagement, type ExportedInfo, type ImportedInfo, type SyncResult, type PendingRestore }
