"use client"

import { useEffect, useRef } from "react"

import { onDataChanged } from "@/lib/data-change-bus"
import { getStoredFinance } from "@/features/finance/finance-storage"
import { getStoredJournal } from "@/features/journal/journal-storage"
import { getStoredStudy } from "@/features/study/study-storage"
import { getStoredBudget } from "@/features/budget/budget-storage"
import { getStoredSettings } from "@/lib/settings-storage"
import { getSyncSecret } from "@/lib/sync-secret-storage"
import { pushSnapshot } from "../api"
import { getAutoBackupStatus, setAutoBackupStatus } from "../auto-backup-storage"
import { buildExportPayload } from "../data-transfer"

const DEBOUNCE_MS = 4000

function AutoBackup() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function scheduleSync() {
      const secret = getSyncSecret()
      // Chưa cấu hình secret → không có lệnh mạng nào cả, giữ nguyên tính chất
      // "không cần tài khoản, luôn hoạt động offline" mặc định của app.
      if (!secret) return

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        const payload = buildExportPayload(
          {
            journal: getStoredJournal(),
            finance: getStoredFinance(),
            study: getStoredStudy(),
            settings: getStoredSettings(),
            budget: getStoredBudget(),
          },
          new Date().toISOString()
        )
        const result = await pushSnapshot(secret, payload)
        setAutoBackupStatus(
          result.ok
            ? { lastSyncedAt: payload.exportedAt, lastError: null }
            : { ...getAutoBackupStatus(), lastError: result.error }
        )
      }, DEBOUNCE_MS)
    }

    return onDataChanged(scheduleSync)
  }, [])

  return null
}

export { AutoBackup }
