const SYNC_SECRET_STORAGE_KEY = "sync-secret"

function getSyncSecret(): string {
  try {
    return window.localStorage.getItem(SYNC_SECRET_STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

function setSyncSecret(secret: string) {
  window.localStorage.setItem(SYNC_SECRET_STORAGE_KEY, secret)
}

function clearSyncSecret() {
  window.localStorage.removeItem(SYNC_SECRET_STORAGE_KEY)
}

export { SYNC_SECRET_STORAGE_KEY, getSyncSecret, setSyncSecret, clearSyncSecret }
