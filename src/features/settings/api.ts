import { parseImportPayload, type ExportPayload, type ImportResult } from "@/lib/data-transfer"
import { hasUnsendableChar, SECRET_CHARSET_ERROR } from "@/lib/sync-secret-storage"

type PushResult = { ok: true; summary: string } | { ok: false; error: string }

function mapErrorStatus(status: number, serverError?: string): string {
  if (status === 401) return "Sai secret đồng bộ."
  if (status === 404) return "Chưa có bản đồng bộ nào trên máy khác."
  return serverError ?? "Đồng bộ không thành công."
}

// Chỉ gọi khi người dùng bấm "Tải lên": bản tải lên GHI ĐÈ toàn bộ snapshot trên cloud, nên 2 máy dùng
// chung secret mà tự động tải lên sẽ âm thầm xoá thay đổi máy kia chưa kịp tải xuống (lý do đã bỏ hẳn
// tính năng tự động sao lưu, 2026-10-12 — chỉ cân nhắc lại khi có tải xuống tự động hoặc gộp dữ liệu).
async function pushSnapshot(secret: string, payload: ExportPayload): Promise<PushResult> {
  if (hasUnsendableChar(secret)) return { ok: false, error: SECRET_CHARSET_ERROR }
  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload),
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      return { ok: false, error: mapErrorStatus(response.status, json.error) }
    }
    return { ok: true, summary: json.summary }
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ đồng bộ." }
  }
}

async function pullSnapshot(secret: string): Promise<ImportResult> {
  if (hasUnsendableChar(secret)) return { ok: false, error: SECRET_CHARSET_ERROR }
  try {
    const response = await fetch("/api/sync", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    })

    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      return { ok: false, error: mapErrorStatus(response.status, json.error) }
    }
    return parseImportPayload(await response.text())
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ đồng bộ." }
  }
}

export { pushSnapshot, pullSnapshot, type PushResult }
