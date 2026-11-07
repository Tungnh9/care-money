import { dayKeyFromIso, daysBetween } from "@/lib/date"
import { laterIso } from "./backup-status-storage"

// Quá số ngày này kể từ bản sao gần nhất mà dữ liệu đã đổi thì Tổng quan nhắc sao lưu.
const BACKUP_REMINDER_DAYS = 7

interface BackupOverview {
  // false cho tới khi đọc được localStorage (lúc SSR và lượt render đầu) — chưa biết gì thì chưa nhắc gì.
  ready: boolean
  empty: boolean
  changed: boolean
  fileAt: string | null
  cloudAt: string | null
}

type BackupReminder = { kind: "empty" } | { kind: "never" } | { kind: "stale"; days: number; latestAt: string }

function latestBackupAt(view: Pick<BackupOverview, "fileAt" | "cloudAt">): string | null {
  return laterIso(view.fileAt, view.cloudAt)
}

function backupReminder(view: BackupOverview, today: string): BackupReminder | null {
  if (!view.ready) return null
  if (view.empty) return { kind: "empty" }
  if (!view.changed) return null
  const latestAt = latestBackupAt(view)
  const latestDay = latestAt ? dayKeyFromIso(latestAt) : null
  if (!latestAt || !latestDay) return { kind: "never" }
  const days = daysBetween(latestDay, today)
  return days >= BACKUP_REMINDER_DAYS ? { kind: "stale", days, latestAt } : null
}

// "hôm nay" / "hôm qua" / "12 ngày trước" — tính theo ngày lịch trên máy, không theo 24 giờ.
function formatBackupAge(iso: string, today: string): string {
  const day = dayKeyFromIso(iso)
  if (!day) return "không rõ lúc nào"
  const days = daysBetween(day, today)
  if (days <= 0) return "hôm nay"
  if (days === 1) return "hôm qua"
  return `${days} ngày trước`
}

export {
  BACKUP_REMINDER_DAYS,
  backupReminder,
  formatBackupAge,
  latestBackupAt,
  type BackupOverview,
  type BackupReminder,
}
