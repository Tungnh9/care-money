import { parseImportPayload, type ExportPayload, type ImportResult } from "@/lib/data-transfer"
import { hasUnsendableChar, SECRET_CHARSET_ERROR } from "@/lib/sync-secret-storage"

// conflict: bản trên đám mây không phải bản máy này dựa trên (máy khác đã tải lên sau, hay máy này chưa tải xuống
// lần nào) — chưa ghi gì, chờ người dùng chọn tải xuống trước hay vẫn ghi đè.
type PushResult =
  | { ok: true; summary: string; etag: string | null }
  | { ok: false; error: string; conflict?: false }
  | { ok: false; error: string; conflict: true; cloudUploadedAt: string | null }

// etag: của bản hiện tại trên đám mây (null với bản cũ trong lịch sử).
type PullResult = (Extract<ImportResult, { ok: true }> & { etag: string | null }) | Extract<ImportResult, { ok: false }>

interface CloudVersion {
  id: string
  uploadedAt: string
  size: number
}

type CloudVersionsResult = { ok: true; versions: CloudVersion[] } | { ok: false; error: string }

interface PushOptions {
  // ETag của bản đám mây mà dữ liệu máy này dựa trên; null nếu chưa tải lên / tải xuống lần nào.
  baseEtag: string | null
  // Người dùng đã thấy cảnh báo xung đột và chọn ghi đè.
  force?: boolean
}

const NETWORK_ERROR = "Không kết nối được máy chủ đồng bộ."

function mapErrorStatus(status: number, serverError?: string): string {
  if (status === 401) return "Sai secret đồng bộ."
  if (status === 404) return "Chưa có bản đồng bộ nào trên máy khác."
  return serverError ?? "Đồng bộ không thành công."
}

// Chỉ gọi khi người dùng bấm "Tải lên": bản tải lên GHI ĐÈ toàn bộ snapshot trên cloud, nên 2 máy dùng
// chung secret mà tự động tải lên sẽ âm thầm xoá thay đổi máy kia chưa kịp tải xuống (lý do đã bỏ hẳn
// tính năng tự động sao lưu, 2026-10-12 — chỉ cân nhắc lại khi có tải xuống tự động hoặc gộp dữ liệu).
// Máy chủ chặn ghi đè 1 bản mà máy này chưa thấy (409) trừ khi `force`.
async function pushSnapshot(secret: string, payload: ExportPayload, options: PushOptions): Promise<PushResult> {
  if (hasUnsendableChar(secret)) return { ok: false, error: SECRET_CHARSET_ERROR }
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    }
    if (options.baseEtag) headers["X-Sync-Base-Etag"] = options.baseEtag
    if (options.force) headers["X-Sync-Force"] = "1"
    const response = await fetch("/api/sync", { method: "POST", headers, body: JSON.stringify(payload) })
    const json = await response.json().catch(() => ({}))

    if (response.status === 409 && json.conflict) {
      return {
        ok: false,
        error: json.error ?? "Bản trên đám mây đã đổi.",
        conflict: true,
        cloudUploadedAt: typeof json.cloudUploadedAt === "string" ? json.cloudUploadedAt : null,
      }
    }
    if (!response.ok) {
      return { ok: false, error: mapErrorStatus(response.status, json.error) }
    }
    return { ok: true, summary: json.summary, etag: typeof json.etag === "string" ? json.etag : null }
  } catch {
    return { ok: false, error: NETWORK_ERROR }
  }
}

// version: mã 1 bản cũ trong lịch sử; bỏ trống là bản hiện tại.
async function pullSnapshot(secret: string, version?: string): Promise<PullResult> {
  if (hasUnsendableChar(secret)) return { ok: false, error: SECRET_CHARSET_ERROR }
  try {
    const query = version ? `?version=${encodeURIComponent(version)}` : ""
    const response = await fetch(`/api/sync${query}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    })

    if (!response.ok) {
      if (version && response.status === 404) return { ok: false, error: "Không còn bản sao này trên đám mây." }
      const json = await response.json().catch(() => ({}))
      return { ok: false, error: mapErrorStatus(response.status, json.error) }
    }
    const result = parseImportPayload(await response.text())
    if (!result.ok) return result
    return { ...result, etag: version ? null : response.headers.get("X-Sync-Etag") }
  } catch {
    return { ok: false, error: NETWORK_ERROR }
  }
}

async function listCloudVersions(secret: string): Promise<CloudVersionsResult> {
  if (hasUnsendableChar(secret)) return { ok: false, error: SECRET_CHARSET_ERROR }
  try {
    const response = await fetch("/api/sync/history", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) return { ok: false, error: mapErrorStatus(response.status, json.error) }
    const versions: CloudVersion[] = Array.isArray(json.versions)
      ? json.versions.filter(
          (v: unknown): v is CloudVersion =>
            typeof v === "object" &&
            v !== null &&
            typeof (v as CloudVersion).id === "string" &&
            typeof (v as CloudVersion).uploadedAt === "string" &&
            typeof (v as CloudVersion).size === "number"
        )
      : []
    return { ok: true, versions }
  } catch {
    return { ok: false, error: NETWORK_ERROR }
  }
}

export {
  listCloudVersions,
  pullSnapshot,
  pushSnapshot,
  type CloudVersion,
  type CloudVersionsResult,
  type PullResult,
  type PushResult,
}
