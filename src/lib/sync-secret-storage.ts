import { notifyDataChanged } from "./data-change-bus"

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

// Báo qua data-change-bus để ô secret đang mở ở Cài đặt (DataCard) tự trống theo — không báo ở
// setSyncSecret vì đó là chính ô đó đang gõ.
function clearSyncSecret() {
  window.localStorage.removeItem(SYNC_SECRET_STORAGE_KEY)
  notifyDataChanged()
}

export { SYNC_SECRET_STORAGE_KEY, getSyncSecret, setSyncSecret, clearSyncSecret }
