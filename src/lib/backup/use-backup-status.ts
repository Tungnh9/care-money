"use client"

import { useEffect, useState } from "react"

import { onDataChanged } from "@/lib/data-change-bus"
import { isSnapshotEmpty, readLocalSnapshot } from "@/lib/data-transfer"
import type { BackupOverview } from "./backup-reminder"
import { dataFingerprint, getBackupStatus } from "./backup-status-storage"

const NOT_READY: BackupOverview = { ready: false, empty: false, changed: false, fileAt: null, cloudAt: null }

function readBackupOverview(): BackupOverview {
  const status = getBackupStatus()
  return {
    ready: true,
    empty: isSnapshotEmpty(readLocalSnapshot()),
    changed: status.fingerprint !== dataFingerprint(),
    fileAt: status.fileAt,
    cloudAt: status.cloudAt,
  }
}

function sameOverview(a: BackupOverview, b: BackupOverview): boolean {
  return (
    a.ready === b.ready &&
    a.empty === b.empty &&
    a.changed === b.changed &&
    a.fileAt === b.fileAt &&
    a.cloudAt === b.cloudAt
  )
}

// Chỉ đọc. Không dùng useStorageSync như các hook dữ liệu khác: "có thay đổi chưa sao lưu" phụ thuộc MỌI key trong
// RESTORE_KEYS chứ không 1 key, nên đọc lại ở mọi lần ghi (tab này hay tab khác) rồi chỉ render lại khi kết quả khác.
function useBackupStatus(): BackupOverview {
  const [overview, setOverview] = useState<BackupOverview>(NOT_READY)

  useEffect(() => {
    function reload() {
      const next = readBackupOverview()
      setOverview((prev) => (sameOverview(prev, next) ? prev : next))
    }
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    reload()
    const unsubscribe = onDataChanged(reload)
    window.addEventListener("storage", reload)
    return () => {
      unsubscribe()
      window.removeEventListener("storage", reload)
    }
  }, [])

  return overview
}

export { useBackupStatus }
