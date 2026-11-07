"use client"

import { formatBackupAge } from "@/lib/backup/backup-reminder"
import { useBackupStatus } from "@/lib/backup/use-backup-status"
import { dayKey } from "@/lib/date"

// "Sao lưu gần nhất: file hôm qua · đám mây 12 ngày trước" và dữ liệu hiện tại đã nằm trong bản sao nào chưa.
function BackupStatusLine() {
  const backup = useBackupStatus()
  if (!backup.ready) return null
  const today = dayKey()
  const age = (iso: string | null) => (iso ? formatBackupAge(iso, today) : "chưa có")

  return (
    <div className="mt-4 rounded-[var(--ob-radius-md)] bg-[var(--ob-color-surface-sunken)] px-[14px] py-[11px] text-[13px] leading-[1.5]">
      <p className="text-[var(--ob-color-text-muted)]">
        Sao lưu gần nhất: file <strong className="font-bold text-[var(--ob-color-text)]">{age(backup.fileAt)}</strong> ·
        đám mây <strong className="font-bold text-[var(--ob-color-text)]">{age(backup.cloudAt)}</strong>
      </p>
      {backup.empty ? null : backup.changed ? (
        <p className="mt-[2px] font-semibold text-[var(--ob-color-expense)]">Có thay đổi chưa nằm trong bản sao nào.</p>
      ) : (
        <p className="mt-[2px] font-semibold text-[#0E7A50]">Mọi thay đổi đã có trong bản sao.</p>
      )}
    </div>
  )
}

export { BackupStatusLine }
