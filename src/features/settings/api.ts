import { parseImportPayload, type ExportPayload, type ImportResult } from "./data-transfer"

type PushResult = { ok: true; summary: string } | { ok: false; error: string }

// Header HTTP chỉ nhận ký tự có mã ≤ 255 (Latin-1): secret có "ậ", "ồ", "đ"... làm fetch ném TypeError
// trước khi kịp gửi, và lỗi đó từng bị báo nhầm thành "Không kết nối được máy chủ đồng bộ.".
const SECRET_CHARSET_ERROR =
  "Secret đồng bộ có ký tự không gửi được (chữ có dấu như ậ, ồ, đ). Hãy dùng đúng chuỗi SYNC_SECRET đã đặt trên Vercel."

function hasUnsendableChar(secret: string): boolean {
  return Array.from(secret).some((char) => (char.codePointAt(0) ?? 0) > 255)
}

function mapErrorStatus(status: number, serverError?: string): string {
  if (status === 401) return "Sai secret đồng bộ."
  if (status === 404) return "Chưa có bản đồng bộ nào trên máy khác."
  return serverError ?? "Đồng bộ không thành công."
}

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

export { pushSnapshot, pullSnapshot, SECRET_CHARSET_ERROR, type PushResult }
