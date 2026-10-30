"use client"

import { useCallback, useEffect, useState } from "react"

import {
  SECRET_CHARSET_ERROR,
  SYNC_SECRET_STORAGE_KEY,
  getSyncSecret,
  hasUnsendableChar,
} from "@/lib/sync-secret-storage"
import { useStorageSync } from "@/lib/use-storage-sync"
import { fetchImagesConfigured } from "../image-api"

const CHECKING = "Đang kiểm tra máy chủ ảnh…"
const NOT_CONFIGURED = "Server chưa cấu hình Cloudinary — thêm ảnh tạm khoá."
const NO_SECRET = "Thêm ảnh cần khoá đồng bộ — nhập ở Cài đặt."
const STATUS_FAILED = "Không kiểm tra được máy chủ ảnh. Vui lòng thử lại."

type ServerStatus =
  | { kind: "checking" }
  | { kind: "ready" }
  | { kind: "off" }
  // Không hỏi được server (mất mạng…): giữ câu lỗi để hiện, lần mở form sau hỏi lại.
  | { kind: "failed"; reason: string }

interface PhotoLock {
  // Các câu giải thích vì sao chưa thêm được ảnh, hiện thẳng trên màn hình; rỗng = thêm được.
  reasons: string[]
  // Hỏi lại server khi lần trước không hỏi được (gọi lúc mở form ghi chép).
  retry: () => void
}

// Ghi chép bằng chữ luôn lưu được; chỉ nút thêm ảnh bị khoá khi server chưa có Cloudinary, hay máy này chưa có khoá
// đồng bộ dùng được — khoá trống, hay có ký tự header không mang được (gửi kiểu gì cũng hỏng, như thiếu khoá).
function usePhotoLock(): PhotoLock {
  const [server, setServer] = useState<ServerStatus>({ kind: "checking" })
  const [attempt, setAttempt] = useState(0)
  const [secret, setSecret] = useState("")

  useEffect(() => {
    let active = true
    fetchImagesConfigured().then(
      (configured) => {
        if (active) setServer({ kind: configured ? "ready" : "off" })
      },
      // Mất mạng thì fetchImagesConfigured ném Error mang câu tiếng Việt: hiện đúng câu đó, không để lọt thành
      // unhandled rejection — ghi chép bằng chữ vẫn chạy như thường.
      (error: unknown) => {
        const reason = error instanceof Error && error.message ? error.message : STATUS_FAILED
        if (active) setServer({ kind: "failed", reason })
      }
    )
    return () => {
      active = false
    }
  }, [attempt])

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecret(getSyncSecret())
  }, [])

  // Nhập khoá ở tab khác, hay đăng xuất (gỡ khoá) — nút thêm ảnh khoá/mở theo, không cần tải lại trang.
  const reloadSecret = useCallback(() => setSecret(getSyncSecret()), [])
  useStorageSync(SYNC_SECRET_STORAGE_KEY, reloadSecret)

  const retry = useCallback(() => {
    if (server.kind !== "failed") return
    setServer({ kind: "checking" })
    setAttempt((n) => n + 1)
  }, [server.kind])

  const reasons: string[] = []
  if (server.kind === "checking") reasons.push(CHECKING)
  if (server.kind === "off") reasons.push(NOT_CONFIGURED)
  if (server.kind === "failed") reasons.push(server.reason)
  if (!secret) reasons.push(NO_SECRET)
  else if (hasUnsendableChar(secret)) reasons.push(SECRET_CHARSET_ERROR)

  return { reasons, retry }
}

export { usePhotoLock }
