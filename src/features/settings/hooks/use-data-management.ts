"use client"

import { useCallback, useEffect, useState } from "react"

import { DEFAULT_FINANCE_STATE, getStoredFinance, type FinanceState } from "@/lib/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, type JournalState } from "@/lib/journal/journal-storage"
import { DEFAULT_STUDY_STATE, type StudyState } from "@/lib/study/study-storage"
import { DEFAULT_BUDGET_STATE, type BudgetState } from "@/lib/budget/budget-storage"
import { DEFAULT_NET_WORTH_HISTORY, type NetWorthHistory } from "@/lib/net-worth/net-worth-history-storage"
import { setCarGoalFundName } from "@/lib/goals/car-goal-storage"
import { notifyDataChanged, onDataChanged } from "@/lib/data-change-bus"
import type { AppSettings } from "@/lib/settings/settings-storage"
import { DEFAULT_WORK_STATE, type WorkState } from "@/lib/work/work-storage"
import { DEFAULT_LIFE_PLAN_STATE, type LifePlanState } from "@/lib/life-plan/life-plan-storage"
import { clearImageCache } from "@/lib/life-plan/image-cache"
import { clearJournalDraft } from "@/lib/journal/journal-draft-storage"
import { clearSyncSecret } from "@/lib/sync-secret-storage"
import {
  BACKUP_STATUS_KEY,
  clearBackupStatus,
  dataFingerprint,
  getBackupStatus,
  markBackedUp,
  markRestored,
} from "@/lib/backup/backup-status-storage"
import { listCloudVersions, pullSnapshot, pushSnapshot, type CloudVersion } from "../api"
import { describeLocalOnly, findLocalOnly, keepLocalOnly } from "../local-only"
import {
  RESTORE_KEYS,
  buildExportPayload,
  exportFileName,
  parseImportPayload,
  readLocalSnapshot,
  restoreCounts,
  type ImportedSnapshot,
} from "@/lib/data-transfer"

interface ExportedInfo {
  file: string
  size: string
  time: string
}

type ImportedInfo = { ok: true; file: string; summary: string } | { ok: false; error: string }
type SyncResult = { ok: true; summary: string } | { ok: false; error: string }

// Bản sao đã đọc + parse xong nhưng CHƯA ghi gì xuống máy — chờ người dùng xác nhận ở hộp thoại
// (DataCard), vì nạp là thay TOÀN BỘ dữ liệu trên máy.
type PendingRestore = {
  data: ImportedSnapshot
  summary: string
  exportedAt: string | null
  incomingCounts: string
  localCounts: string
  // Những gì máy này có mà bản sắp nạp không có ("2 bài nhật ký · 1 ghi chép Plan") — null khi không có gì.
  localOnly: string | null
} & (
  | { source: "file"; fileName: string }
  // etag: của bản hiện tại trên đám mây; null với 1 bản cũ (`old`) — nạp bản cũ không làm máy "bắt kịp" đám mây.
  | { source: "cloud"; etag: string | null; old: boolean }
)

// Lần nạp vừa xong còn hoàn tác được ("ready") hay vừa được hoàn tác ("done").
interface RestoreUndo {
  source: "file" | "cloud"
  status: "ready" | "done"
}

// Chuỗi thô của UNDO_KEYS ngay trước lần nạp (để trả về) và ngay sau nó (để biết đã có gì ghi thêm chưa).
type UndoState = RestoreUndo & { before: Map<string, string | null>; after: Map<string, string | null> }

// Tải lên bị máy chủ chặn, chưa ghi gì: bản đám mây đã đổi từ lần đồng bộ trước (hasBase), hay máy này chưa tải
// xuống / tải lên lần nào.
interface PushConflict {
  cloudUploadedAt: string | null
  hasBase: boolean
}

type CloudVersionsState =
  { status: "loading" } | { status: "ready"; versions: CloudVersion[] } | { status: "error"; error: string }

interface UseDataManagementOptions {
  onReplaceJournal: (journal: JournalState) => void
  onReplaceFinance: (finance: FinanceState) => void
  onReplaceStudy: (study: StudyState) => void
  onReplaceSettings: (settings: AppSettings) => void
  onReplaceBudget: (budget: BudgetState) => void
  onReplaceNetWorthHistory: (history: NetWorthHistory) => void
  onReplaceWork: (work: WorkState) => void
  onReplaceLifePlan: (lifePlan: LifePlanState) => void
}

// Hoàn tác trả cả trạng thái sao lưu về như trước lần nạp, để "đã sao lưu" và ETag đám mây khớp lại dữ liệu cũ.
const UNDO_KEYS = [...RESTORE_KEYS, BACKUP_STATUS_KEY]

const RESTORE_WRITE_ERROR =
  "Không ghi được dữ liệu vào máy (bộ nhớ trình duyệt có thể đã đầy). Dữ liệu trên máy vẫn giữ nguyên như trước."

const NETWORK_ERROR = "Không kết nối được máy chủ đồng bộ."

// Chụp chuỗi thô của các key trước khi ghi để trả về nguyên trạng nếu 1 lần ghi giữa chừng lỗi (vd. hết dung
// lượng localStorage), thay vì để máy nửa cũ nửa mới — và để "Hoàn tác" lần nạp vừa xong.
function readRawBackup(keys: readonly string[] = RESTORE_KEYS): Map<string, string | null> {
  const backup = new Map<string, string | null>()
  for (const key of keys) {
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

function sameRawBackup(a: Map<string, string | null>, b: Map<string, string | null>): boolean {
  if (a.size !== b.size) return false
  for (const [key, raw] of a) {
    if (!b.has(key) || b.get(key) !== raw) return false
  }
  return true
}

function describeRestore(data: ImportedSnapshot, summary: string, exportedAt: string | null) {
  const local = readLocalSnapshot()
  return {
    data,
    summary,
    exportedAt,
    incomingCounts: restoreCounts(data),
    localCounts: restoreCounts(local),
    localOnly: describeLocalOnly(findLocalOnly(data, local)),
  }
}

function useDataManagement({
  onReplaceJournal,
  onReplaceFinance,
  onReplaceStudy,
  onReplaceSettings,
  onReplaceBudget,
  onReplaceNetWorthHistory,
  onReplaceWork,
  onReplaceLifePlan,
}: UseDataManagementOptions) {
  const [exported, setExported] = useState<ExportedInfo | null>(null)
  const [imported, setImported] = useState<ImportedInfo | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null)
  const [undo, setUndo] = useState<UndoState | null>(null)
  const [pushConflict, setPushConflict] = useState<PushConflict | null>(null)
  const [cloudVersions, setCloudVersions] = useState<CloudVersionsState | null>(null)

  // Hoàn tác chỉ trả được đúng dữ liệu trước lần nạp nếu từ đó tới giờ không có gì khác ghi xuống — sửa 1 tâm
  // trạng ở Cài đặt hay viết 1 bài ở tab khác rồi bấm Hoàn tác sẽ âm thầm xoá luôn thay đổi đó. Nên hễ chuỗi thô
  // khác lúc vừa nạp xong là thôi cho hoàn tác. Rời Cài đặt (unmount) cũng mất, vì state chỉ sống trong trang này.
  useEffect(() => {
    if (undo?.status !== "ready") return
    const after = undo.after
    function dropUndoIfChanged() {
      if (!sameRawBackup(readRawBackup(UNDO_KEYS), after)) setUndo(null)
    }
    const unsubscribe = onDataChanged(dropUndoIfChanged)
    window.addEventListener("storage", dropUndoIfChanged)
    return () => {
      unsubscribe()
      window.removeEventListener("storage", dropUndoIfChanged)
    }
  }, [undo])

  const applySnapshot = useCallback(
    (data: ImportedSnapshot) => {
      const backup = readRawBackup()
      try {
        onReplaceJournal(data.journal)
        onReplaceFinance(data.finance)
        onReplaceStudy(data.study)
        onReplaceSettings(data.settings)
        onReplaceBudget(data.budget)
        onReplaceWork(data.work)
        onReplaceLifePlan(data.lifePlan)
        onReplaceNetWorthHistory(data.netWorthHistory)
        if (data.goals) setCarGoalFundName(data.goals.carFundName)
      } catch (error) {
        restoreRawBackup(backup)
        throw error
      }
    },
    [
      onReplaceJournal,
      onReplaceFinance,
      onReplaceStudy,
      onReplaceSettings,
      onReplaceBudget,
      onReplaceNetWorthHistory,
      onReplaceWork,
      onReplaceLifePlan,
    ]
  )

  // force: người dùng đã thấy cảnh báo bản đám mây đã đổi và chọn ghi đè.
  const pushToCloud = useCallback(async (secret: string, force = false) => {
    setSyncing(true)
    // Như pullFromCloud: banner của lần đồng bộ trước không được còn dưới "Đang đồng bộ…".
    setSyncResult(null)
    setPushConflict(null)
    setUndo(null)
    const payload = buildExportPayload(readLocalSnapshot(), new Date().toISOString())
    const fingerprint = dataFingerprint()
    const baseEtag = getBackupStatus().cloudEtag
    const result = await pushSnapshot(secret, payload, { baseEtag, force })
    if (result.ok) {
      markBackedUp("cloud", payload.exportedAt, fingerprint, result.etag ?? undefined)
      setSyncResult({ ok: true, summary: result.summary })
    } else if (result.conflict) {
      setPushConflict({ cloudUploadedAt: result.cloudUploadedAt, hasBase: baseEtag !== null })
    } else {
      setSyncResult({ ok: false, error: result.error })
    }
    setSyncing(false)
  }, [])

  const cancelPushConflict = useCallback(() => setPushConflict(null), [])

  // version: 1 bản cũ trong lịch sử đám mây; bỏ trống là bản hiện tại.
  const pull = useCallback(async (secret: string, version?: CloudVersion) => {
    setSyncing(true)
    // Banner của lần đồng bộ trước phải biến mất ngay khi lần kéo mới bắt đầu — không còn trong lúc
    // "Đang đồng bộ…", dưới hộp thoại xác nhận, hay sau khi bấm "Huỷ" (chưa ghi gì). Lỗi mới tự ghi đè
    // ở nhánh lỗi.
    setSyncResult(null)
    setPushConflict(null)
    setUndo(null)
    try {
      const result = await pullSnapshot(secret, version?.id)
      if (result.ok) {
        // Chỉ xếp hàng chờ xác nhận — ghi thật ở confirmRestore. Kết quả về sau khi đã rời Cài đặt
        // vì thế không ghi gì (component đã unmount, không còn ai xác nhận).
        setPendingRestore({
          ...describeRestore(result.data, result.summary, result.exportedAt),
          source: "cloud",
          etag: result.etag,
          old: version !== undefined,
        })
      } else {
        setSyncResult({ ok: false, error: result.error })
      }
    } catch {
      setSyncResult({ ok: false, error: NETWORK_ERROR })
    } finally {
      setSyncing(false)
    }
  }, [])

  const pullFromCloud = useCallback((secret: string) => pull(secret), [pull])
  const pullCloudVersion = useCallback((secret: string, version: CloudVersion) => pull(secret, version), [pull])

  const loadCloudVersions = useCallback(async (secret: string) => {
    setCloudVersions({ status: "loading" })
    const result = await listCloudVersions(secret)
    setCloudVersions(
      result.ok ? { status: "ready", versions: result.versions } : { status: "error", error: result.error }
    )
  }, [])

  const closeCloudVersions = useCallback(() => setCloudVersions(null), [])

  const exportData = useCallback(() => {
    const now = new Date()
    const payload = buildExportPayload(readLocalSnapshot(), now.toISOString())
    const fingerprint = dataFingerprint()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const name = exportFileName(payload.exportedAt)
    const link = document.createElement("a")
    link.href = url
    link.download = name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    // Hoàn tác sau khi xuất sẽ trả cả trạng thái sao lưu về trước lần xuất — thôi hẳn cho gọn.
    setUndo(null)
    markBackedUp("file", payload.exportedAt, fingerprint)
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
    setUndo(null)
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

  // keepLocal: gộp những gì chỉ có trên máy này (bài nhật ký, ghi chép / kế hoạch Plan) vào bản sắp nạp thay vì để
  // mất. Tính lại trên dữ liệu đọc tươi lúc bấm — trong lúc hộp thoại mở, tab khác có thể vừa thêm 1 bài.
  const confirmRestore = useCallback(
    (keepLocal = false) => {
      if (!pendingRestore) return
      const pending = pendingRestore
      setPendingRestore(null)
      const before = readRawBackup(UNDO_KEYS)
      const local = readLocalSnapshot()
      const only = keepLocal ? findLocalOnly(pending.data, local) : null
      const kept = only ? describeLocalOnly(only) : null
      const data = only && kept ? keepLocalOnly(pending.data, local, only) : pending.data
      try {
        applySnapshot(data)
      } catch {
        if (pending.source === "cloud") setSyncResult({ ok: false, error: RESTORE_WRITE_ERROR })
        else setImported({ ok: false, error: RESTORE_WRITE_ERROR })
        return
      }
      // Gộp thêm phần riêng của máy này thì dữ liệu không còn trùng bản sao nào — vẫn là "chưa sao lưu".
      markRestored(pending.source, pending.exportedAt, {
        exact: data === pending.data,
        cloudEtag: pending.source === "cloud" && pending.etag ? pending.etag : undefined,
      })
      setUndo({ source: pending.source, status: "ready", before, after: readRawBackup(UNDO_KEYS) })
      const summary = kept ? `${pending.summary} · giữ lại ${kept} chỉ có trên máy này` : pending.summary
      if (pending.source === "cloud") setSyncResult({ ok: true, summary })
      else setImported({ ok: true, file: pending.fileName, summary })
    },
    [pendingRestore, applySnapshot]
  )

  const cancelRestore = useCallback(() => setPendingRestore(null), [])

  const undoRestore = useCallback(() => {
    if (undo?.status !== "ready") return
    restoreRawBackup(undo.before)
    // Banner "Đã nạp…" không còn đúng nữa — bỏ hẳn, để thao tác kế tiếp (xoá trạng thái hoàn tác) không làm nó hiện lại.
    if (undo.source === "file") setImported(null)
    else setSyncResult(null)
    setUndo({ ...undo, status: "done" })
  }, [undo])

  const wipeData = useCallback(() => {
    // Danh sách cửa hàng vàng/bạc (kèm giá hôm nay) là cấu hình, không phải dữ liệu đã nhập — giữ lại.
    const { goldStores, silverStores } = getStoredFinance()
    onReplaceJournal(DEFAULT_JOURNAL_STATE)
    onReplaceFinance({ ...DEFAULT_FINANCE_STATE, goldStores, silverStores })
    onReplaceStudy(DEFAULT_STUDY_STATE)
    onReplaceBudget(DEFAULT_BUDGET_STATE)
    onReplaceNetWorthHistory(DEFAULT_NET_WORTH_HISTORY)
    onReplaceWork(DEFAULT_WORK_STATE)
    onReplaceLifePlan(DEFAULT_LIFE_PLAN_STATE)
    // Ảnh trang Plan đã tải về máy này cũng dọn theo. Ảnh trên Cloudinary giữ nguyên (dọn ảnh mồ côi trên cloud
    // nằm ngoài phạm vi): nạp lại 1 bản sao lưu thì các ghi chép vẫn trỏ đúng ảnh cũ trên cloud. Không chờ:
    // clearImageCache không bao giờ lỗi.
    void clearImageCache()
    setCarGoalFundName(null)
    // "Làm lại từ đầu" trên máy này — không giữ lại credential đồng bộ, bản nháp nhật ký đang viết dở, hay những gì
    // máy này biết về các bản sao lưu (kể cả ETag đám mây: lần tải lên kế tiếp sẽ được hỏi lại trước khi ghi đè).
    clearSyncSecret()
    clearJournalDraft()
    clearBackupStatus()
    // Trạng thái của tính năng tự động sao lưu đã bỏ (2026-10-12) — không còn gì đọc tới, dọn luôn.
    window.localStorage.removeItem("auto-backup-status")
    setExported(null)
    setImported(null)
    setSyncResult(null)
    setUndo(null)
    setPushConflict(null)
    setCloudVersions(null)
  }, [
    onReplaceJournal,
    onReplaceFinance,
    onReplaceStudy,
    onReplaceBudget,
    onReplaceNetWorthHistory,
    onReplaceWork,
    onReplaceLifePlan,
  ])

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
    restoreUndo: undo ? { source: undo.source, status: undo.status } : null,
    undoRestore,
    pushConflict,
    cancelPushConflict,
    cloudVersions,
    loadCloudVersions,
    closeCloudVersions,
    pullCloudVersion,
  }
}

export {
  useDataManagement,
  type CloudVersionsState,
  type ExportedInfo,
  type ImportedInfo,
  type PendingRestore,
  type PushConflict,
  type RestoreUndo,
  type SyncResult,
}
