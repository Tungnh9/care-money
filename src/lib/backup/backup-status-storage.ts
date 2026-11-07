import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { RESTORE_KEYS } from "@/lib/data-transfer"
import { NET_WORTH_HISTORY_KEY } from "@/lib/net-worth/net-worth-history-storage"

const BACKUP_STATUS_KEY = "backup-status"

// Những gì máy này biết về các bản sao của chính nó. Chỉ nằm trên máy này — không đi vào file xuất hay bản đám
// mây, vì mỗi máy có lịch sử sao lưu riêng.
interface BackupStatus {
  // Lần gần nhất biết chắc có 1 file sao lưu: lúc xuất file, hay lúc tạo của file vừa nạp (file đó vẫn còn). ISO.
  fileAt: string | null
  // Như fileAt cho bản trên đám mây: lúc tải lên, hay lúc tạo của bản vừa tải xuống.
  cloudAt: string | null
  // Dấu vân tay dữ liệu ngay lúc bản sao gần nhất được tạo hay nạp — khác dấu hiện tại nghĩa là có thay đổi chưa
  // nằm trong bản sao nào.
  fingerprint: string | null
  // ETag của bản đám mây mà dữ liệu máy này dựa trên (lần tải lên / tải xuống gần nhất). Gửi kèm khi tải lên để máy
  // chủ từ chối nếu máy khác đã tải lên sau đó, thay vì âm thầm ghi đè.
  cloudEtag: string | null
}

const EMPTY_BACKUP_STATUS: BackupStatus = { fileAt: null, cloudAt: null, fingerprint: null, cloudEtag: null }

const backupStatusSchema = z.object({
  fileAt: z.string().nullable().catch(null),
  cloudAt: z.string().nullable().catch(null),
  fingerprint: z.string().nullable().catch(null),
  cloudEtag: z.string().nullable().catch(null),
})

function getBackupStatus(): BackupStatus {
  try {
    const raw = window.localStorage.getItem(BACKUP_STATUS_KEY)
    if (!raw) return EMPTY_BACKUP_STATUS
    const parsed = backupStatusSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : EMPTY_BACKUP_STATUS
  } catch {
    return EMPTY_BACKUP_STATUS
  }
}

// Không ghi được (bộ nhớ đầy) thì thôi: chỉ là lời nhắc sao lưu, không đáng làm hỏng lần xuất/tải lên vừa xong.
function setBackupStatus(status: BackupStatus) {
  try {
    window.localStorage.setItem(BACKUP_STATUS_KEY, JSON.stringify(status))
  } catch {
    return
  }
  notifyDataChanged()
}

function clearBackupStatus() {
  try {
    if (window.localStorage.getItem(BACKUP_STATUS_KEY) === null) return
    window.localStorage.removeItem(BACKUP_STATUS_KEY)
  } catch {
    return
  }
  notifyDataChanged()
}

// Lịch sử tài sản tự ghi thêm 1 dòng mỗi ngày mở Tổng quan — tính cả nó thì hôm sau nào cũng "có thay đổi chưa sao
// lưu" dù người dùng không nhập gì.
const FINGERPRINT_KEYS = RESTORE_KEYS.filter((key) => key !== NET_WORTH_HISTORY_KEY)

// FNV-1a 32-bit trên chuỗi thô của từng key — chỉ để biết "đã đổi hay chưa", không cần chống trùng cố ý.
function dataFingerprint(): string {
  let hash = 0x811c9dc5
  for (const key of FINGERPRINT_KEYS) {
    let raw: string | null = null
    try {
      raw = window.localStorage.getItem(key)
    } catch {
      // Đọc lỗi thì coi như trống.
    }
    const text = `${key}=${raw ?? ""}${raw === null ? "\u0001" : ""}\u0000`
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193)
    }
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

function laterIso(a: string | null, b: string | null): string | null {
  if (!a || Number.isNaN(Date.parse(a))) return b
  if (!b || Number.isNaN(Date.parse(b))) return a
  return Date.parse(a) >= Date.parse(b) ? a : b
}

// Vừa xuất file / tải lên xong. `fingerprint` chụp lúc dựng bản sao, không phải lúc ghi nhận: dữ liệu đổi trong
// lúc chờ tải lên thì phần đổi đó vẫn là "chưa sao lưu".
function markBackedUp(kind: "file" | "cloud", at: string, fingerprint: string, cloudEtag?: string) {
  const current = getBackupStatus()
  setBackupStatus({
    ...current,
    ...(kind === "file" ? { fileAt: at } : { cloudAt: at }),
    fingerprint,
    ...(cloudEtag !== undefined ? { cloudEtag } : {}),
  })
}

interface MarkRestoredOptions {
  // Dữ liệu trên máy trùng hẳn bản vừa nạp. false khi đã gộp thêm phần chỉ có trên máy này — phần đó chưa nằm
  // trong bản sao nào, nên vẫn là "có thay đổi chưa sao lưu".
  exact: boolean
  cloudEtag?: string
}

// Vừa nạp 1 bản sao: bản đó vẫn còn (file / đám mây) nên đã "được sao lưu" tính tới lúc tạo của nó. Gọi SAU khi ghi
// xong để dấu vân tay là của dữ liệu vừa nạp.
function markRestored(kind: "file" | "cloud", exportedAt: string | null, { exact, cloudEtag }: MarkRestoredOptions) {
  const current = getBackupStatus()
  setBackupStatus({
    ...current,
    ...(kind === "file"
      ? { fileAt: laterIso(current.fileAt, exportedAt) }
      : { cloudAt: laterIso(current.cloudAt, exportedAt) }),
    fingerprint: exact ? dataFingerprint() : null,
    ...(cloudEtag !== undefined ? { cloudEtag } : {}),
  })
}

export {
  BACKUP_STATUS_KEY,
  EMPTY_BACKUP_STATUS,
  clearBackupStatus,
  dataFingerprint,
  getBackupStatus,
  laterIso,
  markBackedUp,
  markRestored,
  setBackupStatus,
  type BackupStatus,
}
