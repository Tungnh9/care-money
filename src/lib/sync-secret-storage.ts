import { notifyDataChanged } from "./data-change-bus"

const SYNC_SECRET_STORAGE_KEY = "sync-secret"

// Secret đi trong header `Authorization: Bearer` (đồng bộ cloud, ảnh Plan cuộc đời), mà header HTTP chỉ nhận ký tự có
// mã ≤ 255 (Latin-1): secret có "ậ", "ồ", "đ"... (gõ khi bộ gõ tiếng Việt đang bật) làm fetch ném TypeError trước khi
// kịp gửi. Nơi gửi secret kiểm trước bằng hasUnsendableChar rồi báo câu này — lỗi đó từng bị báo nhầm thành lỗi mạng
// ("Không kết nối được máy chủ đồng bộ.", "Không tải được ảnh lên. Vui lòng thử lại."), thử lại mấy cũng không được.
const SECRET_CHARSET_ERROR =
  "Secret đồng bộ có ký tự không gửi được (chữ có dấu như ậ, ồ, đ). Hãy dùng đúng chuỗi SYNC_SECRET đã đặt trên Vercel."

function hasUnsendableChar(secret: string): boolean {
  return Array.from(secret).some((char) => (char.codePointAt(0) ?? 0) > 255)
}

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

export {
  SECRET_CHARSET_ERROR,
  SYNC_SECRET_STORAGE_KEY,
  clearSyncSecret,
  getSyncSecret,
  hasUnsendableChar,
  setSyncSecret,
}
