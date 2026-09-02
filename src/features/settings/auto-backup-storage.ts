const AUTO_BACKUP_STORAGE_KEY = "auto-backup-status"

interface AutoBackupStatus {
  lastSyncedAt: string | null
  lastError: string | null
}

const DEFAULT_AUTO_BACKUP_STATUS: AutoBackupStatus = { lastSyncedAt: null, lastError: null }

function getAutoBackupStatus(): AutoBackupStatus {
  try {
    const raw = window.localStorage.getItem(AUTO_BACKUP_STORAGE_KEY)
    if (!raw) return DEFAULT_AUTO_BACKUP_STATUS
    return { ...DEFAULT_AUTO_BACKUP_STATUS, ...(JSON.parse(raw) as Partial<AutoBackupStatus>) }
  } catch {
    return DEFAULT_AUTO_BACKUP_STATUS
  }
}

function setAutoBackupStatus(status: AutoBackupStatus) {
  window.localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(status))
}

export {
  AUTO_BACKUP_STORAGE_KEY,
  DEFAULT_AUTO_BACKUP_STATUS,
  getAutoBackupStatus,
  setAutoBackupStatus,
  type AutoBackupStatus,
}
