import { z } from "zod"

import { lifePlanImageSchema } from "@/lib/life-plan/life-plan-storage"
import type { LifePlanImage } from "@/lib/life-plan/types"
import { hasUnsendableChar, SECRET_CHARSET_ERROR } from "@/lib/sync-secret-storage"

// Ảnh đi qua API của app (/api/life-plan/images), trình duyệt không bao giờ gọi thẳng Cloudinary: server giữ API
// secret và link có chữ ký. Tải lên, xem và xoá đều kèm khoá đồng bộ (`Authorization: Bearer`).
// Lỗi ném Error mang câu tiếng Việt để báo thẳng cho người dùng: câu `error` server trả về (vd. "Sai secret đồng
// bộ."), không có thì câu chung của thao tác đó — kể cả khi không gọi được server. Riêng khoá có ký tự header không
// mang được thì ném SECRET_CHARSET_ERROR, không gọi server.

const IMAGES_API = "/api/life-plan/images"

const UPLOAD_FAILED = "Không tải được ảnh lên. Vui lòng thử lại."
const DOWNLOAD_FAILED = "Không tải được ảnh về. Vui lòng thử lại."
const DELETE_FAILED = "Không xoá được ảnh trên Cloudinary. Vui lòng thử lại."
const STATUS_FAILED = "Không kiểm tra được máy chủ ảnh. Vui lòng thử lại."

const errorBodySchema = z.object({ error: z.string().min(1) })
const statusBodySchema = z.object({ configured: z.boolean() })
const deleteBodySchema = z.object({ ok: z.boolean() })

// Khoá có ký tự mã > 255 (đ, ư, ậ… gõ khi bộ gõ tiếng Việt đang bật) làm fetch ném TypeError lúc dựng header, mà
// callImagesApi gộp lỗi đó với lỗi mạng thành câu "Vui lòng thử lại" — thử mấy cũng không được. Báo đúng lỗi khoá
// ngay tại đây: ném ra thì hàm gọi bearer() reject trước khi kịp gọi fetch.
function bearer(secret: string): HeadersInit {
  if (hasUnsendableChar(secret)) throw new Error(SECRET_CHARSET_ERROR)
  return { Authorization: `Bearer ${secret}` }
}

function imageUrl(id: string): string {
  return `${IMAGES_API}?${new URLSearchParams({ id })}`
}

// Trả response khi server trả 2xx; còn lại ném Error mang câu báo lỗi.
async function callImagesApi(url: string, init: RequestInit, fallback: string): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw new Error(fallback)
  }
  if (response.ok) return response
  // Lỗi không phải JSON của route (vd. trang lỗi của Vercel khi request quá lớn) thì dùng câu chung.
  const body = errorBodySchema.safeParse(await response.json().catch(() => null))
  throw new Error(body.success ? body.data.error : fallback)
}

async function readJson<T>(response: Response, schema: z.ZodType<T>, fallback: string): Promise<T> {
  const parsed = schema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) throw new Error(fallback)
  return parsed.data
}

// Server có đủ biến môi trường Cloudinary chưa — chưa có thì trang khoá nút thêm ảnh. Không cần khoá đồng bộ.
async function fetchImagesConfigured(): Promise<boolean> {
  const response = await callImagesApi(`${IMAGES_API}/status`, { cache: "no-store" }, STATUS_FAILED)
  const { configured } = await readJson(response, statusBodySchema, STATUS_FAILED)
  return configured
}

// Gửi 1 ảnh đã thu nhỏ; server trả mã ảnh và kích thước để lưu vào ghi chép.
async function uploadLifePlanImage(blob: Blob, secret: string): Promise<LifePlanImage> {
  const form = new FormData()
  form.append("file", blob)
  const response = await callImagesApi(
    IMAGES_API,
    { method: "POST", headers: bearer(secret), body: form },
    UPLOAD_FAILED
  )
  return readJson(response, lifePlanImageSchema, UPLOAD_FAILED)
}

async function fetchLifePlanImage(id: string, secret: string): Promise<Blob> {
  const response = await callImagesApi(imageUrl(id), { headers: bearer(secret) }, DOWNLOAD_FAILED)
  try {
    return await response.blob()
  } catch {
    throw new Error(DOWNLOAD_FAILED)
  }
}

// true khi ảnh đã không còn trên Cloudinary; false khi Cloudinary trả lời mà không xoá.
async function deleteLifePlanImage(id: string, secret: string): Promise<boolean> {
  const response = await callImagesApi(imageUrl(id), { method: "DELETE", headers: bearer(secret) }, DELETE_FAILED)
  const { ok } = await readJson(response, deleteBodySchema, DELETE_FAILED)
  return ok
}

export { deleteLifePlanImage, fetchImagesConfigured, fetchLifePlanImage, uploadLifePlanImage }
