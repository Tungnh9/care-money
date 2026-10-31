import { createHash, randomInt } from "node:crypto"
import { z } from "zod"

import type { LifePlanImage } from "@/lib/life-plan/types"

// Gọi thẳng REST API của Cloudinary bằng fetch + chữ ký SHA-1, không thêm thư viện `cloudinary`.
// CHỈ server import (route /api/life-plan/images): cần API secret, và link có chữ ký tạo ở đây không bao giờ
// được tới trình duyệt.

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

// Nơi đọc biến môi trường — mặc định process.env. Không dùng kiểu NodeJS.ProcessEnv: Next khai thêm NODE_ENV
// bắt buộc vào kiểu đó, nên không truyền được 1 object thường (vd. trong test).
type Env = Record<string, string | undefined>

// Mã ảnh (public_id) do server tạo khi tải lên: `life-plan/{production|development}/{20 ký tự [a-z0-9]}`. API xem
// và xoá chỉ nhận đúng khuôn này — trình duyệt không trỏ được tới ảnh nào khác trong tài khoản Cloudinary.
const LIFE_PLAN_IMAGE_ID = /^life-plan\/(production|development)\/[a-z0-9]{20}$/
const IMAGE_NAME_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"
const IMAGE_NAME_LENGTH = 20

const uploadResultSchema = z.object({
  public_id: z.string(),
  bytes: z.number(),
  width: z.number(),
  height: z.number(),
})

const destroyResultSchema = z.object({ result: z.string() })

// Body lỗi của Cloudinary: `{ error: { message } }`. Câu đó không chứa API secret (chuỗi ký không có secret).
const cloudinaryErrorSchema = z.object({ error: z.object({ message: z.string() }) })

// Lý do Cloudinary từ chối, đọc từ body lỗi; body lạ thì null.
function cloudinaryReason(body: unknown): string | null {
  const parsed = cloudinaryErrorSchema.safeParse(body)
  return parsed.success ? parsed.data.error.message : null
}

function isLifePlanImageId(id: string): boolean {
  return LIFE_PLAN_IMAGE_ID.test(id)
}

// Thiếu biến nào thì coi như chưa cấu hình: API ảnh trả 503, trang khoá nút thêm ảnh.
function cloudinaryConfig(env: Env = process.env): CloudinaryConfig | null {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

// Máy dev dùng chung tài khoản thật với bản production — ảnh tách 2 thư mục để dễ phân biệt và dễ dọn.
function lifePlanImageFolder(env: Env = process.env): string {
  return env.VERCEL_ENV === "production" ? "life-plan/production" : "life-plan/development"
}

// Chữ ký của Upload API (tài liệu Cloudinary "Generating authentication signatures"): ký mọi tham số gửi đi trừ
// file, api_key (và cloud_name, resource_type) — xếp theo tên, nối `k=v` bằng `&`, nối API secret vào cuối,
// lấy SHA-1 hex.
function signApiParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&")
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex")
}

// Link xem ảnh `authenticated` (tài liệu "Generating delivery URL signatures"): chữ ký là 8 ký tự đầu của base64
// URL-safe(SHA-1(phần link đứng sau chữ ký + API secret)). Link không có transformation hay version nên phần đó
// chính là public_id. Link không hết hạn — ai có link là xem được ảnh.
function signedDeliveryUrl(publicId: string, config: CloudinaryConfig): string {
  const signature = createHash("sha1")
    .update(publicId + config.apiSecret)
    .digest("base64url")
    .slice(0, 8)
  return `https://res.cloudinary.com/${config.cloudName}/image/authenticated/s--${signature}--/${publicId}`
}

function apiUrl(action: "upload" | "destroy", config: CloudinaryConfig): string {
  return `https://api.cloudinary.com/v1_1/${config.cloudName}/image/${action}`
}

// Body gửi Cloudinary: các tham số được ký, cộng api_key và chữ ký (2 field này nằm ngoài chuỗi ký). Timestamp
// tính bằng giây; chữ ký chỉ có hiệu lực 1 giờ kể từ timestamp đó.
function signedForm(params: Record<string, string>, config: CloudinaryConfig): FormData {
  const signed = { ...params, timestamp: Math.floor(Date.now() / 1000) }
  const form = new FormData()
  for (const [key, value] of Object.entries(signed)) form.append(key, String(value))
  form.append("api_key", config.apiKey)
  form.append("signature", signApiParams(signed, config.apiSecret))
  return form
}

// randomInt của node:crypto: ngẫu nhiên cho mật mã, chia đều trên bảng chữ — 20 ký tự ≈ 103 bit, không đoán được
// và không đụng mã ảnh nào khác.
function randomImageName(): string {
  return Array.from(
    { length: IMAGE_NAME_LENGTH },
    () => IMAGE_NAME_ALPHABET[randomInt(IMAGE_NAME_ALPHABET.length)]
  ).join("")
}

// Tải 1 ảnh lên dạng `authenticated` (chỉ xem được qua link có chữ ký). Tài khoản mới dùng dynamic folders:
// `folder` không còn ghép vào public_id nữa, nên server tự đặt public_id và dùng `asset_folder` để ảnh nằm đúng
// thư mục trong Media Library. Cloudinary từ chối, hay trả kết quả thiếu field, thì ném lỗi.
async function uploadToCloudinary(file: Blob, folder: string, config: CloudinaryConfig): Promise<LifePlanImage> {
  const form = signedForm(
    { asset_folder: folder, public_id: `${folder}/${randomImageName()}`, type: "authenticated" },
    config
  )
  form.append("file", file)

  const response = await fetch(apiUrl("upload", config), { method: "POST", body: form })
  if (!response.ok) {
    const reason = cloudinaryReason(await response.json().catch(() => null))
    throw new Error(`Cloudinary upload failed with status ${response.status}${reason ? `: ${reason}` : ""}`)
  }
  const result = uploadResultSchema.parse(await response.json())
  // Kết quả còn có link có chữ ký (url, secure_url) — chỉ giữ mã ảnh và kích thước.
  return { id: result.public_id, bytes: result.bytes, width: result.width, height: result.height }
}

// "not found" cũng tính là xoá được: ảnh đã không còn trên Cloudinary. Cloudinary từ chối thì trả false — body lỗi
// của nó là `{ error: { message } }`, không có `result` — và ghi lý do vào log server. Không gọi được Cloudinary
// (lỗi mạng) thì lỗi của fetch ném ra nơi gọi.
async function destroyOnCloudinary(publicId: string, config: CloudinaryConfig): Promise<boolean> {
  const form = signedForm({ public_id: publicId, type: "authenticated" }, config)

  const response = await fetch(apiUrl("destroy", config), { method: "POST", body: form })
  const body: unknown = await response.json().catch(() => null)
  const parsed = destroyResultSchema.safeParse(body)
  if (parsed.success && (parsed.data.result === "ok" || parsed.data.result === "not found")) return true
  const reason = cloudinaryReason(body) ?? (parsed.success ? parsed.data.result : "unreadable answer")
  console.error(`[life-plan images] Cloudinary did not delete ${publicId} (status ${response.status}): ${reason}`)
  return false
}

export {
  cloudinaryConfig,
  destroyOnCloudinary,
  isLifePlanImageId,
  lifePlanImageFolder,
  signApiParams,
  signedDeliveryUrl,
  uploadToCloudinary,
  type CloudinaryConfig,
}
